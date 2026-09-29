import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

// AI Agent Mastery runs as a rolling weekly cohort: Fri/Sat/Sun at 7:00 PM
// WAT, first cohort Friday 2026-10-09 (founder-confirmed 2026-09-29). This is
// a copy of src/data/aiMasteryCohort.js's arithmetic — keep the two in step.
// WAT is UTC+1 year-round, so every cohort start is a fixed 7 days apart.
const FIRST_START_UTC = Date.UTC(2026, 9, 9, 18, 0, 0);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

// Two reminders per cohort, told apart by how close the start is when the
// function runs: the Friday-morning cron (~9h out) sends the full-schedule
// email, the Friday-evening cron (~1h out) sends the short "starting soon"
// nudge. Each has its own email_log type, so dedup never lets one block the other.
const HOUR_WINDOW_MS = 90 * 60 * 1000;
const EMAIL_TYPES = { morning: 'aimastery_class_reminder', hour: 'aimastery_class_reminder_1h' };

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

// Names come from user-controlled data (a display name, or the part of an
// email before the @), so escape them before they go into email HTML.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function emailShell(innerHtml) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#FBFAFF;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:18px;font-weight:800;color:#1A1333;">Social Dev <span style="color:#7C3AED;">Technologies</span></span>
      </div>
      ${innerHtml}
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #EEE6FB;font-size:12px;color:#8A82AD;text-align:center;">
        Social Dev Technologies · You're receiving this because you registered for AI Agent Mastery.<br/>
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

const fmtDay = (d, opts) => d.toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', ...opts });

function hourReminderHtml(name) {
  return `
    <p style="font-size:15px;color:#1A1333;">Hey ${escapeHtml(name)},</p>
    <p style="font-size:15px;color:#3A3358;line-height:1.6;">
      Your <strong>AI Agent Mastery</strong> class starts in <strong>1 hour</strong> — <strong>7:00 PM WAT</strong> tonight.
    </p>
    <p style="font-size:15px;color:#3A3358;line-height:1.6;">
      Your join link is on your dashboard under <strong>Live Sessions</strong>. Log in now so you're ready when we start.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://socialdevtechnologies.com/dashboard/live-sessions"
         style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
        Join the class →
      </a>
    </div>
  `;
}

function reminderHtml(name, dayLines) {
  return `
    <p style="font-size:15px;color:#1A1333;">Hey ${escapeHtml(name)},</p>
    <p style="font-size:15px;color:#3A3358;line-height:1.6;">
      Your <strong>AI Agent Mastery</strong> cohort starts <strong>today at 7:00 PM WAT</strong>. Here's the full schedule — all three evenings at 7:00 PM WAT:
    </p>
    <ul style="font-size:15px;color:#3A3358;line-height:1.8;padding-left:20px;margin:12px 0;">
      ${dayLines.map((l) => `<li>${l}</li>`).join('')}
    </ul>
    <p style="font-size:15px;color:#3A3358;line-height:1.6;">
      Your join links are on your dashboard under <strong>Live Sessions</strong>. Log in a few minutes early so you're in when we start.
      If you can't remember how to log in, use “Log in with an emailed code instead” on the login page.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://socialdevtechnologies.com/dashboard/live-sessions"
         style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
        Open my live sessions →
      </a>
    </div>
  `;
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

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const cronHeader = req.headers.get('x-cron-secret') ?? '';
  const isAutomatedRun = Boolean(CRON_SECRET) && cronHeader === CRON_SECRET;

  // Same gate as the other reminder functions: the cron secret, or a signed-in
  // admin (checked by calling an admin-only RPC as the caller).
  if (!isAutomatedRun) {
    const authHeader = req.headers.get('Authorization') ?? '';
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { error: authError } = await callerClient.rpc('admin_get_email_settings');
    if (authError) return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  let dryRun = false;
  try {
    dryRun = (await req.json())?.dryRun === true;
  } catch {
    // no body (cron) — a real run
  }

  // The cohort that starts within the next 24 hours, if any. The cron fires
  // Friday morning, so this is "today's" cohort; any other day is a no-op.
  const now = Date.now();
  const weeks = now < FIRST_START_UTC ? 0 : Math.floor((now - FIRST_START_UTC) / WEEK_MS) + 1;
  const startMs = FIRST_START_UTC + weeks * WEEK_MS;
  if (startMs - now > REMINDER_WINDOW_MS) {
    return jsonResponse({ ok: true, skipped: true, reason: 'No cohort starts in the next 24 hours' });
  }
  const startIso = new Date(startMs).toISOString();
  const kind = startMs - now <= HOUR_WINDOW_MS ? 'hour' : 'morning';
  const emailType = EMAIL_TYPES[kind];

  // Everyone who registered for THIS cohort: paid after the previous cohort
  // began (they were told they'd join the next one) and before this one began.
  // The very first cohort also takes everyone who paid before it opened.
  let query = serviceClient
    .from('payments')
    .select('user_id, created_at')
    .eq('plan', 'aimastery')
    .eq('status', 'granted')
    .lt('created_at', startIso);
  if (startMs > FIRST_START_UTC) {
    query = query.gte('created_at', new Date(startMs - WEEK_MS).toISOString());
  }
  const { data: payments, error: payErr } = await query;
  if (payErr) {
    console.error('payments query failed:', payErr.message);
    return jsonResponse({ error: 'Could not load registrants' }, 500);
  }
  const userIds = [...new Set((payments || []).map((p) => p.user_id).filter(Boolean))];
  if (userIds.length === 0) return jsonResponse({ ok: true, cohortStart: startIso, matched: 0, sent: 0 });

  const { data: profiles, error: profErr } = await serviceClient
    .from('profiles')
    .select('id, email, display_name')
    .in('id', userIds);
  if (profErr) {
    console.error('profiles query failed:', profErr.message);
    return jsonResponse({ error: 'Could not load registrant emails' }, 500);
  }

  // Dedup: never send the same cohort's reminder to the same person twice
  // (cron retries, manual runs, an admin re-running it).
  const { data: alreadySent } = await serviceClient
    .from('email_log')
    .select('user_id')
    .eq('email_type', emailType)
    .contains('metadata', { cohort_start: startIso });
  const sentSet = new Set((alreadySent || []).map((r) => r.user_id));

  const dayLines = [0, 1, 2].map((i) => {
    const d = new Date(startMs + i * DAY_MS);
    return `${fmtDay(d, { weekday: 'long', day: 'numeric', month: 'long' })} — 7:00 PM WAT`;
  });

  const todo = (profiles || []).filter((p) => p.email && !sentSet.has(p.id));
  if (dryRun) {
    return jsonResponse({ ok: true, dryRun: true, kind, cohortStart: startIso, registered: userIds.length, wouldSend: todo.length });
  }

  let sent = 0;
  for (const p of todo) {
    const name = p.display_name || p.email.split('@')[0];
    const subject = kind === 'hour'
      ? 'Starting in 1 hour: AI Agent Mastery, 7 PM WAT tonight'
      : 'Your AI Agent Mastery cohort starts today at 7 PM WAT';
    const html = kind === 'hour' ? hourReminderHtml(name) : reminderHtml(name, dayLines);
    const ok = await sendResendEmail(p.email, subject, emailShell(html));
    if (ok) {
      sent += 1;
      await serviceClient.from('email_log').insert({
        user_id: p.id,
        email: p.email,
        email_type: emailType,
        subject,
        metadata: { cohort_start: startIso },
      });
    }
  }

  return jsonResponse({ ok: true, kind, cohortStart: startIso, registered: userIds.length, matched: todo.length, sent });
});
