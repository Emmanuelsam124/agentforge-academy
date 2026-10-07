import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Restricted to an allowlist rather than '*' since this endpoint is an
// admin-only, state-changing action (sends real email to real users) —
// still needs to allow local dev (localhost) and Vercel preview
// deployments (*.vercel.app), not just the production domain.
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

// Shared branded wrapper so every outbound email looks consistent, with a
// footer identifying the sender and giving a reply-to path — basic good
// practice for any account-based transactional/marketing email.
function emailShell(innerHtml) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#F6F8FB;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:18px;font-weight:800;color:#0F1A2A;">Social Dev <span style="color:#264D73;">Technologies</span></span>
      </div>
      ${innerHtml}
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E7ECF2;font-size:12px;color:#4A5B6C;text-align:center;">
        Social Dev Technologies · You're receiving this because you have an account with us.<br/>
        Questions? Reply to this email or contact support@socialdevtechnologies.com.
      </div>
    </div>
  `;
}

async function sendResendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Social Dev Technologies <notifications@socialdevtechnologies.com>',
      to: [to],
      subject,
      html,
    }),
  });
  return res.ok;
}

function isActive(expiresAt) {
  return Boolean(expiresAt) && new Date(expiresAt) > new Date();
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { subject, html, segment, recipients: explicitRecipients } = body;
  if (!subject || !html) return jsonResponse({ error: 'subject and html are required' }, 400);

  // Two ways to reach this function:
  // 1. Admin panel — a real admin's JWT, gated by admin_get_all_profiles
  //    (same as before). Can target a segment, or an explicit recipients
  //    list (e.g. a manual test batch before a wider segment send).
  // 2. Service-triggered — a shared x-cron-secret header (same pattern as
  //    the other send-*-emails functions), for one-off sends with an
  //    explicit recipients list and no logged-in admin session available
  //    (e.g. a scripted follow-up send). Never accepts a segment this way,
  //    since segment resolution requires the admin-gated profile lookup.
  const cronHeader = req.headers.get('x-cron-secret') ?? '';
  const isServiceTriggered = Boolean(CRON_SECRET) && cronHeader === CRON_SECRET;

  const cleanExplicitRecipients = Array.isArray(explicitRecipients)
    ? [...new Set(explicitRecipients.map((e) => String(e).trim().toLowerCase()).filter((e) => EMAIL_RE.test(e)))]
    : [];

  let recipients;
  let resolvedSegment = segment;

  if (isServiceTriggered) {
    if (cleanExplicitRecipients.length === 0) {
      return jsonResponse({ error: 'recipients array is required for service-triggered sends' }, 400);
    }
    recipients = cleanExplicitRecipients.map((email) => ({ id: null, email }));
    resolvedSegment = 'custom';
  } else {
    // Reuse the existing admin_get_all_profiles RPC to both fetch the
    // audience AND enforce the admin check — it raises 'Unauthorized'
    // internally for a non-admin caller, so we don't need to duplicate that
    // logic here.
    const authHeader = req.headers.get('Authorization') ?? '';
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: profiles, error: rpcError } = await callerClient.rpc('admin_get_all_profiles');
    if (rpcError) {
      console.error('admin_get_all_profiles failed:', rpcError.message);
      return jsonResponse({ error: 'Unauthorized' }, 403);
    }

    if (cleanExplicitRecipients.length > 0) {
      const byEmail = new Map((profiles || []).filter((p) => p.email).map((p) => [p.email.toLowerCase(), p]));
      recipients = cleanExplicitRecipients.map((email) => {
        const match = byEmail.get(email);
        return { id: match?.id ?? null, email: match?.email ?? email };
      });
      resolvedSegment = 'custom';
    } else {
      const validSegments = ['all', 'builder1', 'builder2', 'pro'];
      if (!validSegments.includes(segment)) return jsonResponse({ error: 'Invalid segment' }, 400);
      recipients = (profiles || [])
        .filter((p) => {
          if (!p.email) return false;
          if (segment === 'all') return true;
          if (segment === 'builder1') return isActive(p.builder1_expires_at);
          if (segment === 'builder2') return isActive(p.builder2_expires_at);
          if (segment === 'pro') return isActive(p.builder1_expires_at) && isActive(p.builder2_expires_at);
          return false;
        })
        .map((p) => ({ id: p.id, email: p.email }));
    }
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const finalHtml = emailShell(html);
  let sent = 0;

  for (const recipient of recipients) {
    const ok = await sendResendEmail(recipient.email, subject, finalHtml);
    if (ok) {
      sent += 1;
      await serviceClient.from('email_log').insert({
        user_id: recipient.id,
        email: recipient.email,
        email_type: 'broadcast',
        subject,
        metadata: { segment: resolvedSegment },
      });
    }
  }

  return jsonResponse({ ok: true, matched: recipients.length, sent });
});
