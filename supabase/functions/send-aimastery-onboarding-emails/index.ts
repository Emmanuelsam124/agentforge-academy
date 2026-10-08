import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Catch-up email (2026-10-08) for people who paid for AI Agent Mastery and have no
// record of a welcome/registration email: "you're in, class starts <date>, here's
// your dashboard". Deploy with verify_jwt = false: it does its own auth, the same
// two ways as send-aimastery-class-reminders — the shared x-cron-secret header, or
// a signed-in admin (checked by calling an admin-only RPC as the caller).
//
// Who gets it: a user with a granted 'aimastery' payment whose auth.users email is
// CONFIRMED (never profiles.email — see CLAUDE.md) and who has no email_log row of
// type 'welcome' or 'aimastery_onboarding'. Note email_log only started recording
// the webhook's welcome emails on 2026-10-04, so an earlier buyer with no row most
// likely did get one and simply wasn't logged; this is a harmless second touch for
// them, not a duplicate of something we know was sent.
//
// Once-only per person via email_log ('aimastery_onboarding', needs
// supabase/email-log-aimastery-types.sql applied first). Body { "dryRun": true }
// counts the audience and sends nothing.
//
// The next-cohort arithmetic below is another copy of FIRST_START_UTC (see
// src/data/aiMasteryCohort.js and send-aimastery-class-reminders) — keep them in step.
//
// Like the other recent scholarship/AI Agent Mastery emails it doesn't invite
// replies and carries no mailto: — the apex domain has no MX record (see CLAUDE.md),
// so it points to WhatsApp instead.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

const SITE = 'https://socialdevtechnologies.com';
const EMAIL_TYPE = 'aimastery_onboarding';

// Rolling weekly cohort, Fri/Sat/Sun at 7:00 PM WAT; first cohort Friday 2026-10-09.
const FIRST_START_UTC = Date.UTC(2026, 9, 9, 18, 0, 0);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

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

// Names come from user-controlled data (a display name, or the part of an email
// before the @), so escape them before they go into HTML.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const fmt = (ms, opts) => new Date(ms).toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', ...opts });

// The next cohort start at or after `now` (WAT is UTC+1 all year, so a fixed 7 days apart).
export function nextCohortStart(now = Date.now()) {
  if (now <= FIRST_START_UTC) return FIRST_START_UTC;
  return FIRST_START_UTC + Math.ceil((now - FIRST_START_UTC) / WEEK_MS) * WEEK_MS;
}

export function onboardingEmail(name, startMs) {
  const days = [0, 1, 2].map((i) => fmt(startMs + i * DAY_MS, { weekday: 'long', day: 'numeric', month: 'long' }));
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#F6F8FB;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:18px;font-weight:800;color:#0F1A2A;">Social Dev <span style="color:#264D73;">Technologies</span></span>
      </div>
      <p style="font-size:15px;color:#0F1A2A;">Hi ${escapeHtml(name)},</p>
      <p style="font-size:15px;color:#1F2C3D;line-height:1.6;">
        You're registered for <strong>AI Agent Mastery</strong> — welcome! Your first live class is
        <strong>${escapeHtml(days[0])} at 7:00 PM WAT</strong>. The cohort runs three evenings, all at 7:00 PM WAT:
      </p>
      <ul style="font-size:15px;color:#1F2C3D;line-height:1.8;padding-left:20px;margin:12px 0;">
        ${days.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}
      </ul>
      <p style="font-size:15px;color:#1F2C3D;line-height:1.6;">
        Everything for the course lives on your dashboard, including <strong>Live Sessions</strong> where your class
        link appears. We'll also email you the join link one hour before class starts.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${SITE}/dashboard"
           style="display:inline-block;background:#264D73;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
          Go to my dashboard →
        </a>
      </div>
      <p style="font-size:14px;color:#1F2C3D;line-height:1.6;">
        Can't remember how to log in? Use “Log in with an emailed code instead” on the login page.<br/>
        Stuck on anything? Message us on WhatsApp:
        <a href="https://wa.me/2349066006963" style="color:#264D73;">wa.me/2349066006963</a>
        (we reply 10am–5pm WAT, Monday to Saturday).
      </p>
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E7ECF2;font-size:12px;color:#4A5B6C;text-align:center;line-height:1.6;">
        Social Dev Technologies · You're receiving this because you registered for AI Agent Mastery.
      </div>
    </div>`;
  return { subject: `You're in: AI Agent Mastery starts ${days[0].split(/[ ,]/)[0]} at 7 PM WAT`, html };
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

  const { data: payments, error: payErr } = await sb
    .from('payments')
    .select('user_id')
    .eq('plan', 'aimastery')
    .eq('status', 'granted');
  if (payErr) {
    console.error('aimastery onboarding: payments query failed:', payErr.code);
    return json({ error: 'Could not load registrants.' }, 500);
  }
  const userIds = [...new Set((payments ?? []).map((p) => p.user_id).filter(Boolean))];
  if (userIds.length === 0) return json({ ok: true, registered: 0, wouldSend: 0, sent: 0 });

  // Anyone we already have a welcome / onboarding record for is left alone.
  const { data: logged, error: logErr } = await sb
    .from('email_log')
    .select('user_id')
    .in('email_type', ['welcome', EMAIL_TYPE])
    .in('user_id', userIds);
  if (logErr) {
    console.error('aimastery onboarding: email_log query failed:', logErr.code);
    return json({ error: 'Could not check earlier emails.' }, 500);
  }
  const alreadyHave = new Set((logged ?? []).map((r) => r.user_id));
  const candidateIds = userIds.filter((id) => !alreadyHave.has(id));

  // Recipients come from auth.users (the confirmed address), never profiles.email.
  const recipients = [];
  let unconfirmed = 0;
  for (const id of candidateIds) {
    const { data, error } = await sb.auth.admin.getUserById(id);
    if (error || !data?.user?.email) {
      console.error('aimastery onboarding: user lookup failed');
      return json({ error: 'Could not look up a registrant.' }, 500);
    }
    if (!data.user.email_confirmed_at) {
      unconfirmed += 1;
      continue;
    }
    const meta = data.user.user_metadata ?? {};
    const name = String(meta.display_name ?? meta.full_name ?? meta.name ?? '').trim().split(/\s+/)[0] || data.user.email.split('@')[0];
    recipients.push({ id, email: data.user.email, name });
  }

  if (dryRun) {
    return json({ ok: true, dryRun: true, registered: userIds.length, alreadyHaveARecord: alreadyHave.size, unconfirmedSkipped: unconfirmed, wouldSend: recipients.length });
  }

  const startMs = nextCohortStart();
  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    const { subject, html } = onboardingEmail(r.name, startMs);
    const ok = RESEND_API_KEY ? await sendResendEmail(r.email, subject, html) : false;
    if (!ok) {
      failed += 1;
      continue;
    }
    sent += 1;
    const { error: insertErr } = await sb.from('email_log').insert({
      user_id: r.id,
      email: r.email,
      email_type: EMAIL_TYPE,
      subject,
      metadata: { cohort_start: new Date(startMs).toISOString() },
    });
    // If this ever fails the dedupe is blind, so say so loudly rather than silently.
    if (insertErr) console.error('aimastery onboarding: email_log insert failed:', insertErr.code);
    await sleep(600); // stay under Resend's 2 requests/second
  }

  return json({ ok: true, registered: userIds.length, matched: recipients.length, sent, failed });
});
