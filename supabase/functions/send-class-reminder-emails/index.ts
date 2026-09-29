import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
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
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#FBFAFF;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:18px;font-weight:800;color:#1A1333;">Social Dev <span style="color:#7C3AED;">Technologies</span></span>
      </div>
      ${innerHtml}
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #EEE6FB;font-size:12px;color:#8A82AD;text-align:center;">
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

const TIER_LABELS = { builder1: 'Builder 1', builder2: 'Builder 2' };

function classReminderHtml(name, tierLabel, title, dateFormatted, joinLink) {
  return `
    <p style="font-size:15px;color:#1A1333;">Hey ${name},</p>
    <p style="font-size:15px;color:#3A3358;line-height:1.6;">
      Your <strong>${tierLabel}</strong> live class — <strong>${title}</strong> — starts <strong>${dateFormatted}</strong>.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${joinLink || 'https://socialdevtechnologies.com/dashboard/live-sessions'}"
         style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
        ${joinLink ? 'Join the class →' : 'View live sessions →'}
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

  const { data: settings, error: settingsError } = await serviceClient
    .from('email_settings')
    .select('class_reminder_automation_enabled')
    .eq('id', 1)
    .single();
  if (settingsError || !settings) {
    if (settingsError) console.error('Failed to load email settings:', settingsError.message);
    return jsonResponse({ error: 'Could not load email settings' }, 500);
  }

  if (isAutomatedRun) {
    if (!settings.class_reminder_automation_enabled) {
      return jsonResponse({ ok: true, skipped: true, reason: 'Automation disabled' });
    }
  } else {
    const authHeader = req.headers.get('Authorization') ?? '';
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { error: authError } = await callerClient.rpc('admin_get_email_settings');
    if (authError) return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  const { data: candidates, error: queryError } = await serviceClient.rpc('service_get_class_reminder_candidates', {
    p_hours_ahead: 24,
  });
  if (queryError) {
    console.error('service_get_class_reminder_candidates failed:', queryError.message);
    return jsonResponse({ error: 'Could not load class reminder candidates' }, 500);
  }

  let sent = 0;
  for (const c of candidates || []) {
    if (!c.email) continue;

    // Insert with dedup: `ignoreDuplicates` means PostgREST only returns a
    // row when it actually inserted one (the unique index on
    // (user_id, type, related_id) rejects a repeat). That return value is
    // both the dedup check AND the notification write in one call — if
    // nothing came back, this person was already reminded about this
    // session, so skip the email too.
    const tierLabel = TIER_LABELS[c.tier] || c.tier;
    const dateFormatted = new Date(c.session_date).toLocaleString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos',
    });

    const { data: inserted, error: insertError } = await serviceClient
      .from('notifications')
      .upsert({
        user_id: c.user_id,
        type: 'class_reminder',
        title: `${c.title} starts soon`,
        body: `Your ${tierLabel} live class starts ${dateFormatted} WAT.`,
        link: '/dashboard/live-sessions',
        related_id: c.session_id,
      }, { onConflict: 'user_id,type,related_id', ignoreDuplicates: true })
      .select();
    if (insertError) {
      console.error('notifications insert failed:', insertError.message);
      continue;
    }
    if (!inserted || inserted.length === 0) continue; // already notified for this session

    const name = c.display_name || c.email.split('@')[0];
    const subject = `Reminder: ${c.title} starts ${dateFormatted} WAT`;
    const ok = await sendResendEmail(
      c.email,
      subject,
      emailShell(classReminderHtml(name, tierLabel, c.title, `${dateFormatted} WAT`, c.join_link)),
    );
    if (ok) {
      sent += 1;
      await serviceClient.from('email_log').insert({
        user_id: c.user_id,
        email: c.email,
        email_type: 'class_reminder',
        subject,
        metadata: { tier: c.tier, session_id: c.session_id },
      });
    }
  }

  return jsonResponse({ ok: true, matched: (candidates || []).length, sent });
});
