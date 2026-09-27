// Social Dev Technologies — AI Gateway
//
// The single point through which every student AI request passes. Students
// never hold an Anthropic key; they authenticate with their Supabase session
// (browser) or a durable AI Builder key in X-SDT-Key (scripts), and this
// function calls Anthropic on their behalf, metering the spend.
//
// This function is deliberately thin. Every budget guardrail lives in Postgres
// (see supabase/ai-credits-setup.sql) because a check-then-deduct in JS leaves
// a race that the Builder 1 batch projects hit routinely — Gmail triage fires
// ten calls per run, and ten concurrent requests would all read the same stale
// balance. ai_reserve_request() holds a row lock; this file just orchestrates.
//
// Flow:
//   authenticate → reserve worst case → call Anthropic → settle actual → respond
//
// If the reserve step throws, nothing was charged and nothing is called.
// If Anthropic fails, settle('error') refunds the full reservation.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// Rough token estimate for the reservation. Deliberately conservative: over-
// estimating only means a larger hold that gets refunded at settle time, while
// under-estimating would let a request slip past the balance check. ~3.5 chars
// per token is a safe floor for English prose and code.
const estimateTokens = (text: string) => Math.ceil(text.length / 3.5);

// Wildcard CORS here was needless exposure: student Python scripts (the
// X-SDT-Key path) never send an Origin header and ignore CORS entirely — a
// browser is the ONLY caller CORS headers affect, so scripts are unaffected
// by tightening this to the same allow-list every other Edge Function in
// this repo already uses. Only a page on one of these origins can read the
// response of a cross-origin browser call now.
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/socialdevtechnologies\.com$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
];

function corsHeadersFor(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://socialdevtechnologies.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sdt-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

serve(async (req) => {
  const cors = corsHeadersFor(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Sign in to use AI Builder credits' }, 401);

  // Two ways to authenticate, because students call this from two places.
  //
  // Browser code holds a Supabase session JWT, which expires in about an hour
  // — fine for a web page, useless for a Python script on a laptop. So a
  // student can instead send a durable `sdt_live_...` key in X-SDT-Key.
  //
  // The key deliberately does NOT go in Authorization: platform-level JWT
  // verification stays ON, and a non-JWT there would be rejected before this
  // code runs. Scripts put the (public) anon key in Authorization to satisfy
  // that check, and their real identity in X-SDT-Key.
  //
  // JWT path: a client bound to the caller's token, so auth.uid() inside the
  // RPCs resolves to them and RLS applies. Key path: resolve the key to a user
  // with the service role, then call the *_core functions naming that user.
  // Either way the same Postgres guardrails run — only the identity lookup
  // differs.
  const studentKey = req.headers.get('X-SDT-Key');

  const supabase = studentKey
    ? createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    : createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });

  let keyUserId: string | null = null;
  if (studentKey) {
    const { data } = await supabase.rpc('ai_resolve_student_key', { p_key: studentKey });
    if (!data) {
      return json(
        { error: 'That AI Builder key is not valid. Copy a new one from your dashboard.' },
        401,
      );
    }
    keyUserId = data as string;
  }

  let body: {
    model?: string;
    prompt?: string;
    system?: string;
    max_tokens?: number;
    project?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const model = body.model ?? 'claude-haiku-4-5';
  const prompt = body.prompt;
  if (!prompt || typeof prompt !== 'string') {
    return json({ error: 'A `prompt` string is required' }, 400);
  }

  const estimatedInput = estimateTokens(prompt + (body.system ?? ''));

  // 1. Reserve. Runs every guardrail: kill switch, entitlement, model
  //    allow-list, tier gate, hourly rate limit, daily caps, balance —
  //    then deducts the worst-case cost under a row lock.
  const { data: reservation, error: reserveError } = await (keyUserId
    ? supabase.rpc('ai_reserve_request_core', {
        p_user_id: keyUserId,
        p_model_key: model,
        p_estimated_input_tokens: estimatedInput,
        p_project_slug: body.project ?? null,
      })
    : supabase.rpc('ai_reserve_request', {
        p_model_key: model,
        p_estimated_input_tokens: estimatedInput,
        p_project_slug: body.project ?? null,
      })
  ).maybeSingle();

  if (reserveError || !reservation) {
    const message = reserveError?.message ?? 'Could not start request';
    // An anon-key caller with no signed-in user is rejected by the function's
    // GRANT before any of our own guards run, surfacing a raw Postgres string.
    // Everything else is a guard message written for students to read directly
    // — "Not enough credits (need 4, have 1)", "AI gateway is currently
    // disabled" — so those pass through unchanged.
    if (message.includes('permission denied')) {
      return json({ error: 'Sign in to use AI Builder credits' }, 401);
    }
    return json({ error: message }, 402);
  }

  const { log_id: logId, max_tokens: modelMaxTokens } = reservation as {
    log_id: string;
    credits_reserved: number;
    max_tokens: number;
  };

  // Clamp to the model's server-side ceiling. A student can ask for less but
  // never more — the reservation was priced against modelMaxTokens, so a
  // larger value would let real cost exceed what was held.
  const maxTokens = Math.min(body.max_tokens ?? modelMaxTokens, modelMaxTokens);

  const settle = (
    inputTokens: number,
    outputTokens: number,
    status: 'success' | 'error',
    message?: string,
  ) =>
    keyUserId
      ? supabase.rpc('ai_settle_request_core', {
          p_user_id: keyUserId,
          p_log_id: logId,
          p_input_tokens: inputTokens,
          p_output_tokens: outputTokens,
          p_status: status,
          p_error_message: message ?? null,
        })
      : supabase.rpc('ai_settle_request', {
          p_log_id: logId,
          p_input_tokens: inputTokens,
          p_output_tokens: outputTokens,
          p_status: status,
          p_error_message: message ?? null,
        });

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  // ---- Mock mode ----------------------------------------------------------
  // With no key configured the gateway returns a canned response instead of
  // failing. This exercises the entire path — auth, every guardrail, reserve,
  // settle, refund — with zero provider spend, so the system can be built,
  // merged and verified long before the Anthropic account exists. The moment
  // ANTHROPIC_API_KEY is set, real calls take over with no code change.
  if (!apiKey) {
    const mockText =
      `[mock response] The AI gateway is running without a provider key, so this ` +
      `is placeholder text rather than a real model response. Your credits, ` +
      `guardrails and usage log all worked correctly.`;
    const mockOutput = estimateTokens(mockText);
    const { data: charged } = await settle(estimatedInput, mockOutput, 'success');
    return json({
      text: mockText,
      model,
      mock: true,
      usage: { input_tokens: estimatedInput, output_tokens: mockOutput },
      credits_charged: charged,
    });
  }

  // ---- Real provider call -------------------------------------------------
  let anthropicResponse: Response;
  try {
    anthropicResponse = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        ...(body.system ? { system: body.system } : {}),
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  } catch (e) {
    // Network failure — the student is refunded in full.
    await settle(0, 0, 'error', String(e));
    return json({ error: 'Could not reach the AI provider. Your credits were not charged.' }, 502);
  }

  if (!anthropicResponse.ok) {
    const detail = await anthropicResponse.text();
    await settle(0, 0, 'error', detail.slice(0, 500));
    // Don't leak provider error bodies to students — they can contain account
    // and key metadata. The real detail is in ai_usage_logs for admins.
    return json(
      { error: 'The AI provider rejected this request. Your credits were not charged.' },
      502,
    );
  }

  const result = await anthropicResponse.json();

  // Content is a list of blocks; concatenate the text ones. Non-text blocks
  // (thinking, tool_use) are ignored here — this gateway serves plain
  // completion requests only.
  const text = (result.content ?? [])
    .filter((b: { type: string }) => b.type === 'text')
    .map((b: { text: string }) => b.text)
    .join('');

  const inputTokens = result.usage?.input_tokens ?? estimatedInput;
  const outputTokens = result.usage?.output_tokens ?? 0;

  // 2. Settle against real usage. Charges actual cost, refunds the rest.
  const { data: charged } = await settle(inputTokens, outputTokens, 'success');

  return json({
    text,
    model: result.model ?? model,
    stop_reason: result.stop_reason,
    usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    credits_charged: charged,
  });
});
