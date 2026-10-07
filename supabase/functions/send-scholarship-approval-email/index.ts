import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Emails an applicant that their AI Agent Mastery scholarship was approved.
// Called by the admin page (/admin/scholarships) right after "Approve", and by its
// "Resend email" button. Admin-only: the caller's JWT is verified and must belong to
// an entitlements.is_admin user (deploy with verify_jwt = true).
//
// Sends only for an application that is currently approved and not yet redeemed.
// approval_email_sent_at (supabase/scholarship-approval-email.sql) makes it
// once-only: the first call claims the stamp before sending, so a double-click or
// a retry can't email twice; { resend: true } deliberately sends again.
//
// Settings are the same Supabase secrets create-paystack-checkout uses, so the
// email never quotes a price or deadline that checkout doesn't honour:
//   SCHOLARSHIP_PRICE_NAIRA   default 10000
//   SCHOLARSHIP_EXPIRES_AT    default 2026-10-09T19:00:00+01:00 (class start)
//
// The email deliberately doesn't invite replies and carries no mailto: — the apex
// domain has no MX record (see CLAUDE.md), so it points to WhatsApp instead.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const SITE = 'https://socialdevtechnologies.com';

function parseNumber(value, fallback) {
  const n = Number(String(value ?? '').trim());
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
function parseTime(value, fallback) {
  const t = Date.parse(String(value ?? '').trim());
  return Number.isFinite(t) ? t : Date.parse(fallback);
}
const PRICE_NAIRA = parseNumber(Deno.env.get('SCHOLARSHIP_PRICE_NAIRA'), 10000);
const EXPIRES_AT = parseTime(Deno.env.get('SCHOLARSHIP_EXPIRES_AT'), '2026-10-09T19:00:00+01:00');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/socialdevtechnologies\.com$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
];

function corsHeadersFor(req) {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : SITE,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

// Names and emails are applicant-supplied, so escape them before they go into HTML.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// "Friday 9 October, 7:00 PM WAT"
function formatDeadline(ms) {
  return (
    new Date(ms)
      .toLocaleString('en-GB', {
        timeZone: 'Africa/Lagos',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      .replace(',', '')
      .replace(/ at /, ', ')
      .replace(/\b(am|pm)\b/, (s) => s.toUpperCase()) + ' WAT'
  );
}

export function approvalEmail(application, now = Date.now()) {
  const firstName = String(application.full_name ?? '').trim().split(/\s+/)[0] || 'there';
  const price = `₦${PRICE_NAIRA.toLocaleString('en-US')}`;
  const live = now < EXPIRES_AT;
  const deadline = live
    ? `Please register before class starts — <strong>${escapeHtml(formatDeadline(EXPIRES_AT))}</strong> — because the scholarship price expires then.`
    : '';
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#F6F8FB;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:18px;font-weight:800;color:#0F1A2A;">Social Dev <span style="color:#264D73;">Technologies</span></span>
      </div>
      <p style="font-size:15px;color:#0F1A2A;">Hi ${escapeHtml(firstName)},</p>
      <p style="font-size:15px;color:#1F2C3D;line-height:1.6;">
        Great news — your scholarship for the <strong>AI Agent Mastery</strong> live cohort has been <strong>approved</strong>. 🎉
      </p>
      <p style="font-size:15px;color:#1F2C3D;line-height:1.6;">
        To claim it, register on the AI Agent Mastery page using <strong>the same email you applied with</strong>
        (<strong>${escapeHtml(application.email)}</strong>). The scholarship price of <strong>${escapeHtml(price)}</strong>
        is applied automatically at checkout — there's no code to enter.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${SITE}/ai-agent-mastery"
           style="display:inline-block;background:#264D73;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
          Register now →
        </a>
      </div>
      ${deadline ? `<p style="font-size:15px;color:#1F2C3D;line-height:1.6;">${deadline}</p>` : ''}
      <p style="font-size:14px;color:#1F2C3D;line-height:1.6;">
        Questions? Message us on WhatsApp:
        <a href="https://wa.me/2349066006963" style="color:#264D73;">wa.me/2349066006963</a>
        (we reply 10am–5pm WAT, Monday to Saturday).
      </p>
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E7ECF2;font-size:12px;color:#4A5B6C;text-align:center;line-height:1.6;">
        Social Dev Technologies · You're receiving this because you applied for an AI Agent Mastery scholarship on our website.
      </div>
    </div>`;
  return { subject: 'Your AI Agent Mastery scholarship is approved 🎉', html };
}

async function sendResendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Social Dev Technologies <notifications@socialdevtechnologies.com>',
      to: [to],
      subject,
      html,
    }),
  });
  return res.ok;
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // Who is calling: the JWT-verified user, never anything in the body.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: 'Unauthorized' }, 401);

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: ent } = await sb.from('entitlements').select('is_admin').eq('user_id', user.id).maybeSingle();
  if (!ent?.is_admin) return json({ error: 'Admin access required' }, 403);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const id = String(body?.id ?? '');
  if (!UUID_RE.test(id)) return json({ error: 'Invalid application id' }, 400);
  const resend = body?.resend === true;

  const { data: app, error: loadError } = await sb
    .from('scholarship_applications')
    .select('id, full_name, email, status, redeemed_at, approval_email_sent_at')
    .eq('id', id)
    .maybeSingle();
  if (loadError) {
    console.error('approval email: load failed:', loadError.code);
    return json({ error: 'Could not load the application.' }, 500);
  }
  if (!app) return json({ error: 'Application not found' }, 404);
  if (app.status !== 'approved' || app.redeemed_at) {
    return json({ error: 'Only an approved, unredeemed application can be emailed.' }, 409);
  }
  const previousStamp = app.approval_email_sent_at ?? null;
  if (previousStamp && !resend) return json({ ok: true, already: true });

  // Claim before sending. Without resend, only the call that flips the stamp from
  // null wins; a concurrent duplicate matches no row and sends nothing.
  const claimedAt = new Date().toISOString();
  let claim = sb.from('scholarship_applications').update({ approval_email_sent_at: claimedAt }).eq('id', id);
  claim = resend ? claim : claim.is('approval_email_sent_at', null);
  const { data: claimed, error: claimError } = await claim.select('id');
  if (claimError) {
    console.error('approval email: claim failed:', claimError.code);
    return json({ error: 'Could not record the email.' }, 500);
  }
  if (!claimed || claimed.length === 0) return json({ ok: true, already: true });

  const { subject, html } = approvalEmail(app);
  const sent = RESEND_API_KEY ? await sendResendEmail(app.email, subject, html) : false;
  if (!sent) {
    // Release the claim so "Resend email" (or another Approve) can try again.
    await sb
      .from('scholarship_applications')
      .update({ approval_email_sent_at: previousStamp })
      .eq('id', id);
    return json({ error: "We couldn't send the email. Try Resend email, or message them on WhatsApp." }, 502);
  }

  return json({ ok: true, sentAt: claimedAt });
});
