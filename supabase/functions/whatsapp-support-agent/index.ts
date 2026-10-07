import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod@4.4.3';
import { buildSystemPrompt } from './knowledge-base.ts';

// Supabase edge runtime global — lets us return a 200 to Meta before the
// model call and outbound send have finished.
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN') ?? '';
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ?? '';
const WHATSAPP_APP_SECRET = Deno.env.get('WHATSAPP_APP_SECRET') ?? '';
const WHATSAPP_VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') ?? '';
const GRAPH_API_VERSION = Deno.env.get('GRAPH_API_VERSION') ?? 'v22.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const ADMIN_EMAIL = Deno.env.get('ADMIN_NOTIFY_EMAIL') ?? 'king.samueljacob@gmail.com';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// A stranger can send unlimited messages to a public WhatsApp number, and
// every one of them would otherwise be a paid model call. Past this many
// inbound messages in an hour we stop answering that number; real customers
// do not hit 20, and the messages are still logged and readable.
const HOURLY_MESSAGE_LIMIT = 20;
const MAX_INBOUND_CHARS = 2000;
const HISTORY_TURNS = 10;
// One open escalation per number per this window, so a back-and-forth that
// has already been handed off doesn't email the owner on every new message.
const ESCALATION_DEDUPE_HOURS = 12;

const FALLBACK_REPLY =
  "Thanks for reaching out! Let me get someone from the team to reply to you " +
  'personally — they’ll come back to you shortly.';

// Same model and same call style as generate-news-digest — raw fetch against
// v1beta rather than the SDK, so both Gemini callers in this project read the
// same way and neither drags an npm dependency into a cold start.
const GEMINI_MODEL = 'gemini-3.7-flash';
const GEMINI_MAX_ATTEMPTS = 3;
const GEMINI_RETRY_DELAY_MS = 2000;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Gemini enforces the schema server-side, but it is not a hard guarantee the
// way a strict tool call is — so the response is parsed and validated before
// any of it reaches a customer.
const AgentReply = z.object({
  reply: z.string(),
  confident: z.boolean(),
  escalation_reason: z.string(),
});

const REPLY_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    confident: { type: 'boolean' },
    escalation_reason: { type: 'string' },
  },
  required: ['reply', 'confident', 'escalation_reason'],
};

type Turn = { role: 'user' | 'model'; parts: Array<{ text: string }> };

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Meta signs the raw request body with the app secret. Without this check the
// function is an open endpoint that anyone can drive into paid model calls
// and outbound WhatsApp messages, so an unset secret fails closed.
async function verifySignature(raw: string, header: string | null): Promise<boolean> {
  if (!WHATSAPP_APP_SECRET || !header?.startsWith('sha256=')) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(WHATSAPP_APP_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
  const expected = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const received = header.slice('sha256='.length);
  if (received.length !== expected.length) return false;

  // Constant-time compare — a plain === leaks the signature byte by byte.
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  }
  return diff === 0;
}

async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`WhatsApp send failed (${res.status}): ${await res.text()}`);
  }
}

async function emailOwner(phone: string, name: string, question: string, reason: string) {
  if (!RESEND_API_KEY) return;

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
      <h2 style="color:#264D73;margin-bottom:8px;">💬 WhatsApp question needs you</h2>
      <p style="color:#666;font-size:14px;margin-top:0;">
        The support agent handed this one off instead of answering it.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#666;width:110px;">From</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Number</td><td style="padding:8px 0;font-weight:600;">+${escapeHtml(phone)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;vertical-align:top;">Why</td><td style="padding:8px 0;">${escapeHtml(reason)}</td></tr>
      </table>
      <div style="margin-top:16px;padding:14px;background:#F6F8FB;border-left:3px solid #264D73;border-radius:6px;">
        <p style="margin:0;color:#333;font-size:14px;white-space:pre-wrap;">${escapeHtml(question)}</p>
      </div>
      <a href="https://socialdevtechnologies.com/admin/support" style="display:inline-block;margin-top:18px;background:#25D366;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
        Reply in the inbox →
      </a>
      <p style="color:#999;font-size:12px;margin-top:12px;">
        Reply there, not from your own WhatsApp — the inbox sends from the
        business number, so it lands in the same chat the customer started.
      </p>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Social Dev Technologies <notifications@socialdevtechnologies.com>',
      to: [ADMIN_EMAIL],
      subject: `WhatsApp: ${name} needs a personal reply`,
      html,
    }),
  });
}

async function escalate(phone: string, name: string, question: string, reason: string) {
  const since = new Date(Date.now() - ESCALATION_DEDUPE_HOURS * 3600_000).toISOString();
  const { data: existing } = await supabase
    .from('whatsapp_escalations')
    .select('id')
    .eq('wa_phone', phone)
    .eq('status', 'open')
    .gte('created_at', since)
    .limit(1);

  if (existing?.length) return; // already flagged and still unresolved

  await supabase.from('whatsapp_escalations').insert({
    wa_phone: phone,
    contact_name: name,
    question,
    reason,
  });

  await emailOwner(phone, name, question, reason);
}

async function askAgent(history: Turn[]) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
    contents: history,
    generationConfig: {
      maxOutputTokens: 2000,
      responseMimeType: 'application/json',
      responseSchema: REPLY_SCHEMA,
      // Deliberately no `seed`. Pinning one would make the same question come
      // back worded the same way every time, which is the opposite of the
      // point — see the voice notes in knowledge-base.ts.
    },
  });

  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return null;
      // The schema is enforced server-side but isn't a hard guarantee, and
      // this string is about to be sent to a customer.
      const parsed = AgentReply.safeParse(JSON.parse(text));
      return parsed.success ? parsed.data : null;
    }

    const raw = await res.text();
    lastError = new Error(`Gemini API returned ${res.status}: ${raw.slice(0, 300)}`);
    if (attempt === GEMINI_MAX_ATTEMPTS) throw lastError;

    // 429 = over the rate limit, which on the free tier is only 5 requests a
    // minute — two customers messaging at once can hit it. Google tells us how
    // long to wait, so wait that long rather than turning a perfectly
    // answerable question into a hand-off. We're inside waitUntil, so the
    // delay costs the customer a slower reply, not a missing one.
    if (res.status === 429) {
      const wait = Number(raw.match(/"retryDelay":\s*"(\d+)s"/)?.[1] ?? 30) + 2;
      console.warn(`Gemini rate limited, waiting ${wait}s (attempt ${attempt}/${GEMINI_MAX_ATTEMPTS})`);
      await sleep(wait * 1000);
      continue;
    }

    // Any other 4xx (bad key, malformed request) fails identically every time.
    if (res.status < 500) throw lastError;

    console.error(`Gemini attempt ${attempt}/${GEMINI_MAX_ATTEMPTS} failed, retrying:`, lastError.message);
    await sleep(GEMINI_RETRY_DELAY_MS * attempt);
  }
  throw lastError;
}

async function handleMessage(
  phone: string,
  name: string,
  text: string,
  isUnsupportedType: boolean,
) {
  let reply = FALLBACK_REPLY;
  let confident = false;
  let reason = 'Agent could not produce an answer.';

  if (isUnsupportedType) {
    reason = 'Customer sent a non-text message (image, voice note, or document).';
  } else {
    try {
      const { data: recent } = await supabase
        .from('whatsapp_messages')
        .select('direction, body, created_at')
        .eq('wa_phone', phone)
        .order('created_at', { ascending: false })
        .limit(HISTORY_TURNS);

      const history: Turn[] = (recent ?? [])
        .reverse()
        .map((m) => ({
          role: m.direction === 'inbound' ? ('user' as const) : ('model' as const),
          parts: [{ text: m.body }],
        }));

      // The conversation must open on a customer turn.
      while (history.length && history[0].role === 'model') history.shift();

      const parsed = await askAgent(history);
      if (parsed) {
        confident = parsed.confident;
        reason = parsed.escalation_reason || 'Agent was not confident enough to answer.';
        if (parsed.reply.trim()) reply = parsed.reply.trim();
      }
    } catch (err) {
      console.error('Agent call failed:', err);
      reason = 'The support agent errored while answering.';
    }
  }

  await sendWhatsAppMessage(phone, reply);

  await supabase.from('whatsapp_messages').insert({
    wa_message_id: `out_${crypto.randomUUID()}`,
    wa_phone: phone,
    contact_name: name,
    direction: 'outbound',
    body: reply,
  });

  if (!confident) {
    await escalate(phone, name, text, reason);
  }
}

serve(async (req) => {
  const url = new URL(req.url);

  // Meta's one-time subscription handshake.
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && WHATSAPP_VERIFY_TOKEN && token === WHATSAPP_VERIFY_TOKEN) {
      return new Response(challenge ?? '', { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const raw = await req.text();

  if (!(await verifySignature(raw, req.headers.get('x-hub-signature-256')))) {
    return new Response('Invalid signature', { status: 401 });
  }

  try {
    const payload = JSON.parse(raw);
    const value = payload?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    // Delivery/read receipts arrive on the same hook with no `messages` array.
    if (!message) return new Response('ok', { status: 200 });

    const phone: string = message.from;
    const name: string = value?.contacts?.[0]?.profile?.name ?? 'Unknown';
    const isUnsupportedType = message.type !== 'text';
    const text: string = isUnsupportedType
      ? `[${message.type} message]`
      : String(message.text?.body ?? '').slice(0, MAX_INBOUND_CHARS);

    // Insert first: the wamid primary key is what makes Meta's retries safe.
    // A duplicate means we already picked this message up on an earlier
    // delivery, so acknowledge and stop.
    const { error: insertError } = await supabase.from('whatsapp_messages').insert({
      wa_message_id: message.id,
      wa_phone: phone,
      contact_name: name,
      direction: 'inbound',
      body: text,
    });

    if (insertError) {
      if (insertError.code === '23505') return new Response('ok', { status: 200 });
      throw insertError;
    }

    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await supabase
      .from('whatsapp_messages')
      .select('wa_message_id', { count: 'exact', head: true })
      .eq('wa_phone', phone)
      .eq('direction', 'inbound')
      .gte('created_at', since);

    if ((count ?? 0) > HOURLY_MESSAGE_LIMIT) {
      console.warn(`Rate limit hit for ${phone} (${count} inbound this hour)`);
      return new Response('ok', { status: 200 });
    }

    // Meta retries the whole webhook if it doesn't get a 200 within seconds,
    // which is less time than a model call plus an outbound send. Acknowledge
    // now and finish the work after the response — the dedupe insert above
    // has already claimed this message.
    EdgeRuntime.waitUntil(
      handleMessage(phone, name, text, isUnsupportedType).catch((err) =>
        console.error('handleMessage failed:', err),
      ),
    );

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('Webhook error:', err);
    // Still a 200: a 500 makes Meta redeliver, and a payload that broke us
    // once will break us again on every retry.
    return new Response('ok', { status: 200 });
  }
});
