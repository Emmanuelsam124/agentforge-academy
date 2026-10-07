import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
// Shared secret for the pg_cron scheduled call, since a cron job has no
// end-user JWT to present. Set this in both the Edge Function secrets and
// the Supabase Vault entry referenced by the cron job (see the migration
// that schedules it).
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

// Restricted to an allowlist rather than '*' — the cron-triggered path never
// hits CORS at all (server-to-server), this only matters for the
// admin-manual-run path from the browser. Still needs to allow local dev
// (localhost) and Vercel preview deployments (*.vercel.app).
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
  if (res.ok) return { ok: true };
  let errorBody;
  try {
    errorBody = await res.json();
  } catch {
    errorBody = await res.text();
  }
  return { ok: false, status: res.status, error: errorBody };
}

function winbackHtml(name) {
  return `
    <p style="font-size:15px;color:#0F1A2A;">Hey ${name},</p>
    <p style="font-size:15px;color:#1F2C3D;line-height:1.6;">
      We noticed it's been a little while since you last logged in to build. Your progress, XP,
      and access are all still right where you left them — no need to start over.
    </p>
    <p style="font-size:15px;color:#1F2C3D;line-height:1.6;">
      Pick up your next session whenever you're ready:
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://socialdevtechnologies.com/dashboard"
         style="display:inline-block;background:#264D73;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
        Continue building →
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

  let body = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine (e.g. the cron job always sends {})
  }
  // Lets an admin manually add extra addresses to a send — e.g. previewing
  // what the email looks like by cc'ing themselves. Only meaningful on a
  // manual (admin-triggered) run; the cron job never sends this.
  const extraRecipients = Array.isArray(body.extra_recipients) ? body.extra_recipients.filter(Boolean) : [];

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const cronHeader = req.headers.get('x-cron-secret') ?? '';
  const isAutomatedRun = Boolean(CRON_SECRET) && cronHeader === CRON_SECRET;

  const { data: settings, error: settingsError } = await serviceClient
    .from('email_settings')
    .select('winback_inactive_days, winback_automation_enabled')
    .eq('id', 1)
    .single();
  if (settingsError || !settings) {
    if (settingsError) console.error('Failed to load email settings:', settingsError.message);
    return jsonResponse({ error: 'Could not load email settings' }, 500);
  }

  if (isAutomatedRun) {
    // Scheduled run — respect the admin's automation toggle.
    if (!settings.winback_automation_enabled) {
      return jsonResponse({ ok: true, skipped: true, reason: 'Automation disabled' });
    }
  } else {
    // Manual run — caller must be an authenticated admin. Reuse an existing
    // admin RPC purely as the auth check (its own is_admin guard does the
    // work); a manual send always proceeds regardless of the automation toggle.
    const authHeader = req.headers.get('Authorization') ?? '';
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { error: authError } = await callerClient.rpc('admin_get_email_settings');
    if (authError) return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  const { data: inactiveUsers, error: queryError } = await serviceClient.rpc('service_get_inactive_users', {
    p_days: settings.winback_inactive_days,
  });
  if (queryError) {
    console.error('service_get_inactive_users failed:', queryError.message);
    return jsonResponse({ error: 'Could not load inactive users' }, 500);
  }

  // Merge in any manually-added preview/extra recipients that aren't
  // already part of the real inactive-user match (avoid double-emailing).
  const matchedEmails = new Set((inactiveUsers || []).map((u) => u.email));
  const previewRecipients = extraRecipients
    .filter((email) => !matchedEmails.has(email))
    .map((email) => ({ id: null, email, display_name: null, days_inactive: null }));
  const recipients = [...(inactiveUsers || []), ...previewRecipients];

  let sent = 0;
  let hadError = false;
  for (const u of recipients) {
    if (!u.email) continue;
    const name = u.display_name || u.email.split('@')[0];
    const subject = "We saved your spot — pick up where you left off";
    const result = await sendResendEmail(u.email, subject, emailShell(winbackHtml(name)));
    if (result.ok) {
      sent += 1;
      await serviceClient.from('email_log').insert({
        user_id: u.id,
        email: u.email,
        email_type: 'winback',
        subject,
        metadata: u.days_inactive === null ? { preview: true } : { days_inactive: u.days_inactive },
      });
    } else if (!hadError) {
      hadError = true;
      console.error('sendResendEmail failed:', u.email, result.status, JSON.stringify(result.error));
    }
  }

  return jsonResponse({ ok: true, matched: recipients.length, sent, hadError });
});
