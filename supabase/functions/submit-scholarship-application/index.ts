import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateApplication } from './validate.ts';

// AI Agent Mastery scholarship application (supabase/scholarship-applications.sql).
// Anonymous visitors submit the /scholarship form here; this is the ONLY writer
// of the table (service role), since it has RLS on and no client grants.
//
// Deploy with verify_jwt = false (applicants have no account yet).
//
// Optional Supabase secrets (the defaults need none):
//   SCHOLARSHIP_CLOSES_AT     ISO time the form stops accepting applications
//                             (default Thu 8 Oct 2026, 8:00 PM WAT). Mirrored in
//                             src/data/scholarship.js (VITE_ override) only to pick
//                             which page to render; the check here is the real one.
//   SCHOLARSHIP_AUTO_APPROVE  new applications stay PENDING until an admin approves
//                             them at /admin/scholarships, unless this is set to
//                             "true" / "1" / "yes" / "on" (approve on submit).

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const DEFAULT_CLOSES_AT = '2026-10-08T20:00:00+01:00';

function parseTime(value, fallback) {
  const t = Date.parse(String(value ?? '').trim());
  return Number.isFinite(t) ? t : Date.parse(fallback);
}
const CLOSES_AT = parseTime(Deno.env.get('SCHOLARSHIP_CLOSES_AT'), DEFAULT_CLOSES_AT);
const AUTO_APPROVE = ['true', '1', 'yes', 'on'].includes(
  String(Deno.env.get('SCHOLARSHIP_AUTO_APPROVE') ?? '').trim().toLowerCase(),
);

// Rate limits over a rolling hour. Per-IP is deliberately generous because many
// Nigerian mobile users share one carrier-grade NAT address; the global cap is
// well above organic traffic and bounds what a rotating-IP script can do.
const MAX_PER_IP_PER_HOUR = 10;
const MAX_PER_HOUR = 200;
const HOUR_MS = 60 * 60 * 1000;

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/socialdevtechnologies\.com$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
];

function corsHeadersFor(req) {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://socialdevtechnologies.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

// Keyed hash of the caller's IP — enough to count submissions per source without
// keeping the address. The service-role key is the secret, so no new env var.
async function hashIp(ip) {
  if (!ip) return null;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SUPABASE_SERVICE_ROLE_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try {
    const raw = await req.text();
    if (raw.length > 8192) return json({ error: 'Request too large' }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  // Honeypot: a field real visitors never see. Bots that fill it get the same
  // friendly answer as a real submission and nothing is stored.
  if (typeof body?.website === 'string' && body.website.trim() !== '') return json({ ok: true });

  // The deadline is enforced here regardless of what the page showed.
  if (Date.now() >= CLOSES_AT) {
    return json({ error: 'Scholarship applications for this cohort are now closed.', code: 'closed' }, 403);
  }

  const result = validateApplication(body);
  if (!result.ok) return json({ error: result.error }, 400);

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const since = new Date(Date.now() - HOUR_MS).toISOString();
  const tooMany = () => json({ error: 'Too many applications right now. Please try again in a little while.' }, 429);

  // cf-connecting-ip is set by the edge proxy and can't be forged by the caller;
  // the first x-forwarded-for entry can, so only the last one is a fallback.
  const clientIp =
    req.headers.get('cf-connecting-ip') ??
    (req.headers.get('x-forwarded-for') ?? '').split(',').pop()?.trim() ??
    '';
  const ipHash = await hashIp(clientIp);
  if (ipHash) {
    const { count: fromIp } = await sb
      .from('scholarship_applications')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', since);
    if ((fromIp ?? 0) >= MAX_PER_IP_PER_HOUR) return tooMany();
  }
  const { count: lastHour } = await sb
    .from('scholarship_applications')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since);
  if ((lastHour ?? 0) >= MAX_PER_HOUR) return tooMany();

  const { error } = await sb.from('scholarship_applications').insert({
    ...result.value,
    ip_hash: ipHash,
    status: AUTO_APPROVE ? 'approved' : 'pending',
    reviewed_at: AUTO_APPROVE ? new Date().toISOString() : null,
  });

  // 23505 = unique violation: this email has already applied. Answer exactly as
  // for a new application so the form can't be used to find out who has applied.
  if (error && error.code !== '23505') {
    // Log the code only — the message/details can echo the applicant's data.
    console.error('scholarship insert failed:', error.code);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }

  return json({ ok: true });
});
