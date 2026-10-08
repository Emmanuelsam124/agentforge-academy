import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// One-off nudge (2026-10-08) to applicants whose AI Agent Mastery scholarship is
// approved but who haven't paid yet. Deploy with verify_jwt = false: it does its
// own auth, the same two ways as send-aimastery-class-reminders — the shared
// x-cron-secret header, or a signed-in admin (checked by calling an admin-only RPC
// as the caller).
//
// Who gets it: status 'approved', not redeemed, ALREADY told they were approved
// (approval_email_sent_at is set — so nobody hears "reminder" about something we
// never told them) at least MIN_AGE_HOURS ago (so someone approved an hour ago
// isn't nagged), not yet sent this reminder, and not someone who already owns
// AI Agent Mastery (e.g. paid the normal price with the same email). Once the
// scholarship price has expired it sends nothing. Running it again later picks up
// anyone approved since.
//
// reminder_email_sent_at (supabase/scholarship-reminder-email.sql) makes it
// once-only: each send claims the stamp first, and releases it if the send fails.
// Body { "dryRun": true } counts the audience and sends nothing.
//
// Price and expiry are the same Supabase secrets create-paystack-checkout and
// send-scholarship-approval-email use, so the email never quotes a price or a
// deadline that checkout doesn't honour:
//   SCHOLARSHIP_PRICE_NAIRA   default 10000
//   SCHOLARSHIP_EXPIRES_AT    default 2026-10-09T19:00:00+01:00 (class start)
//
// Like the approval email, it doesn't invite replies and carries no mailto: — the
// apex domain has no MX record (see CLAUDE.md), so it points to WhatsApp instead.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

const SITE = 'https://socialdevtechnologies.com';

// Don't "remind" someone who was told they were approved only hours ago.
const MIN_AGE_HOURS = 12;

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
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

export function reminderEmail(application) {
  const firstName = String(application.full_name ?? '').trim().split(/\s+/)[0] || 'there';
  const price = `₦${PRICE_NAIRA.toLocaleString('en-US')}`;
  const deadline = formatDeadline(EXPIRES_AT);
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#FBFAFF;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:18px;font-weight:800;color:#1A1333;">Social Dev <span style="color:#7C3AED;">Technologies</span></span>
      </div>
      <p style="font-size:15px;color:#1A1333;">Hi ${escapeHtml(firstName)},</p>
      <p style="font-size:15px;color:#3A3358;line-height:1.6;">
        Your scholarship for the <strong>AI Agent Mastery</strong> live cohort is <strong>approved</strong>, but we haven't
        seen your registration yet — and your scholarship price of <strong>${escapeHtml(price)}</strong> expires
        <strong>${escapeHtml(deadline)}</strong>, when the first class starts.
      </p>
      <p style="font-size:15px;color:#3A3358;line-height:1.6;">
        Register before then to be in this weekend's cohort: three live evenings, Friday to Sunday, at 7:00 PM WAT.
      </p>
      <p style="font-size:15px;color:#1A1333;font-weight:700;margin-bottom:6px;">It takes about two minutes:</p>
      <ol style="font-size:15px;color:#3A3358;line-height:1.8;padding-left:20px;margin:0 0 8px;">
        <li>Open the AI Agent Mastery page below and sign in — or create your account — with
          <strong>${escapeHtml(application.email)}</strong>, the exact email you applied with.</li>
        <li>Confirm your email if asked. The scholarship price only applies to a confirmed address.</li>
        <li>Start checkout. <strong>${escapeHtml(price)}</strong> is applied automatically — there's no code to enter.</li>
      </ol>
      <div style="text-align:center;margin:28px 0;">
        <a href="${SITE}/ai-agent-mastery"
           style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
          Claim my scholarship price →
        </a>
      </div>
      <p style="font-size:14px;color:#3A3358;line-height:1.6;">
        Stuck on anything? Message us on WhatsApp:
        <a href="https://wa.me/2349066006963" style="color:#7C3AED;">wa.me/2349066006963</a>
        (we reply 10am–5pm WAT, Monday to Saturday).
      </p>
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #EEE6FB;font-size:12px;color:#8A82AD;text-align:center;line-height:1.6;">
        Social Dev Technologies · You're receiving this because you applied for an AI Agent Mastery scholarship on our website.
      </div>
    </div>`;
  const weekday = new Date(EXPIRES_AT).toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', weekday: 'long' });
  return { subject: `Reminder: your ${price} AI Agent Mastery scholarship price ends ${weekday}`, html };
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const isAutomatedRun = Boolean(CRON_SECRET) && (req.headers.get('x-cron-secret') ?? '') === CRON_SECRET;
  if (!isAutomatedRun) {
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { error: authError } = await callerClient.rpc('admin_get_email_settings');
    if (authError) return json({ error: 'Unauthorized' }, 403);
  }

  let dryRun = false;
  try {
    dryRun = (await req.json())?.dryRun === true;
  } catch {
    // no body — a real run
  }

  if (Date.now() >= EXPIRES_AT) {
    return json({ ok: true, skipped: true, reason: 'The scholarship price has already expired' });
  }

  const { data: apps, error: appsError } = await sb
    .from('scholarship_applications')
    .select('id, full_name, email')
    .eq('status', 'approved')
    .is('redeemed_at', null)
    // A null approval_email_sent_at never satisfies lt(), so this also requires that
    // the approval email went out.
    .lt('approval_email_sent_at', new Date(Date.now() - MIN_AGE_HOURS * 60 * 60 * 1000).toISOString())
    .is('reminder_email_sent_at', null)
    .order('created_at');
  if (appsError) {
    console.error('scholarship reminder: load failed:', appsError.code);
    return json({ error: 'Could not load the applications.' }, 500);
  }

  // Anyone who already owns AI Agent Mastery (say, paid the normal price with the
  // same email) shouldn't be told to go and pay. Looked up by auth.users email, the
  // confirmed address. If a lookup fails we stop rather than risk emailing an owner.
  const { data: owners, error: ownersError } = await sb
    .from('entitlements')
    .select('user_id')
    .gt('aimastery_expires_at', new Date().toISOString());
  if (ownersError) {
    console.error('scholarship reminder: owners query failed:', ownersError.code);
    return json({ error: 'Could not check existing enrolments.' }, 500);
  }
  const ownerEmails = new Set();
  for (const o of owners ?? []) {
    const { data, error } = await sb.auth.admin.getUserById(o.user_id);
    if (error) {
      console.error('scholarship reminder: owner lookup failed');
      return json({ error: 'Could not check existing enrolments.' }, 500);
    }
    const email = data?.user?.email?.toLowerCase();
    if (email) ownerEmails.add(email);
  }

  const todo = (apps ?? []).filter((a) => !ownerEmails.has(String(a.email).toLowerCase()));
  if (dryRun) {
    return json({ ok: true, dryRun: true, approvedNotReminded: (apps ?? []).length, alreadyOwn: (apps ?? []).length - todo.length, wouldSend: todo.length });
  }

  let sent = 0;
  let failed = 0;
  for (const app of todo) {
    // Claim before sending; a concurrent duplicate run matches no row and sends nothing.
    const { data: claimed, error: claimError } = await sb
      .from('scholarship_applications')
      .update({ reminder_email_sent_at: new Date().toISOString() })
      .eq('id', app.id)
      .eq('status', 'approved')
      .is('redeemed_at', null)
      .is('reminder_email_sent_at', null)
      .select('id');
    if (claimError) {
      console.error('scholarship reminder: claim failed:', claimError.code);
      failed += 1;
      continue;
    }
    if (!claimed || claimed.length === 0) continue;

    const { subject, html } = reminderEmail(app);
    const ok = RESEND_API_KEY ? await sendResendEmail(app.email, subject, html) : false;
    if (ok) {
      sent += 1;
    } else {
      failed += 1;
      // Release the claim so another run can try this one again.
      await sb.from('scholarship_applications').update({ reminder_email_sent_at: null }).eq('id', app.id);
    }
    await sleep(600); // stay under Resend's 2 requests/second
  }

  return json({ ok: true, matched: todo.length, sent, failed });
});
