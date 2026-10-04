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
        Social Dev Technologies · You're receiving this because you started a checkout on socialdevtechnologies.com.
        It's one of two reminders we send for a checkout — never more.<br/>
        Questions? Message us on WhatsApp: wa.me/2349066006963.
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

// AI Agent Mastery is a rolling weekly cohort (Fri/Sat/Sun 7:00 PM WAT, first
// one Fri 9 Oct 2026). This is the third copy of that arithmetic — keep
// FIRST_START_UTC in step with src/data/aiMasteryCohort.js and
// send-aimastery-class-reminders.
const FIRST_START_UTC = Date.UTC(2026, 9, 9, 18, 0, 0);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function nextMasteryCohortLine(now = Date.now()) {
  const weeks = now < FIRST_START_UTC ? 0 : Math.floor((now - FIRST_START_UTC) / WEEK_MS) + 1;
  const start = new Date(FIRST_START_UTC + weeks * WEEK_MS);
  const day = start.toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long' });
  return `The next cohort starts <strong>${day} at 7:00 PM WAT</strong> (classes run Friday to Sunday).`;
}

// What each checkout_attempts.plan is, where to send the person back to, and
// the plain facts worth repeating. Every claim here is already published on
// the product's own page — don't add anything here that isn't (e.g. a refund
// promise). Prices are deliberately left out of the live-cohort entries:
// AI Agent Mastery has a separate student price, and the page shows the one
// that applies to the visitor.
const PRODUCTS = {
  builder1: {
    label: 'Builder 1',
    path: '/pricing',
    facts: [
      '12 step-by-step AI agent guides, with the copy-paste prompts for every build',
      'A one-time payment of ₦5,000 — permanent access, no subscription, no expiry',
      'All you need is a free Gemini API key from Google AI Studio',
    ],
  },
  builder2: {
    label: 'Builder 2',
    path: '/pricing',
    facts: [
      '13 multi-step, API-integrated agent builds, each with its portfolio write-up prompt',
      'A one-time payment of ₦7,000 — permanent access, no subscription, no expiry',
      'All you need is a free Gemini API key from Google AI Studio',
    ],
  },
  pro: {
    label: 'Pro',
    path: '/pricing',
    facts: [
      'Every guide — Builder 1 and Builder 2 together, no prerequisite',
      'A one-time payment of ₦10,000 — cheaper than buying both separately, permanent access',
      'All you need is a free Gemini API key from Google AI Studio',
    ],
  },
  proupgrade: {
    label: 'Pro upgrade',
    path: '/pricing',
    facts: [
      'You already own one track, so you only pay the difference to unlock the other one',
      'Permanent access — no subscription, no expiry',
    ],
  },
  vibecoding: {
    label: 'Vibe Coding Bootcamp',
    path: '/vibe-coding',
    facts: [
      '4 weeks and 8 live classes, taught live',
      'Go from an idea to a deployed website, web app and AI-powered product — no coding experience required',
      'Live classes, replays and the prompt library are all on your dashboard',
    ],
  },
  aimastery: {
    label: 'AI Agent Mastery',
    path: '/ai-agent-mastery',
    facts: [
      'Three live evenings, Friday to Sunday at 7:00 PM WAT',
      'Build one personal-assistant agent end to end — inbox, calendar, research and messaging',
      'Classes and replays are on your dashboard',
    ],
    extra: () => nextMasteryCohortLine(),
  },
};

const FALLBACK_PRODUCT = { label: 'Social Dev Technologies', path: '/pricing', facts: [] };

function ctaLink(product, stage) {
  const url = `https://socialdevtechnologies.com${product.path}?utm_source=email&utm_medium=checkout_recovery&utm_campaign=stage${stage}`;
  return `
    <div style="text-align:center;margin:28px 0;">
      <a href="${url}"
         style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
        Finish my checkout →
      </a>
    </div>`;
}

function factsList(product) {
  if (!product.facts.length) return '';
  return `
    <ul style="font-size:14px;color:#3A3358;line-height:1.7;padding-left:20px;margin:16px 0;">
      ${product.facts.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
    </ul>`;
}

function stage1Html(name, product) {
  const extra = product.extra ? `<p style="font-size:14px;color:#3A3358;line-height:1.6;">${product.extra()}</p>` : '';
  return `
    <p style="font-size:15px;color:#1A1333;">Hey ${escapeHtml(name)},</p>
    <p style="font-size:15px;color:#3A3358;line-height:1.6;">
      You started checking out for <strong>${escapeHtml(product.label)}</strong> but the payment didn't go through,
      so your access isn't active yet. Here's what you'd be getting:
    </p>
    ${factsList(product)}
    ${extra}
    ${ctaLink(product, 1)}
    <p style="font-size:14px;color:#3A3358;line-height:1.6;">
      If your card was declined or the payment page timed out, it's safe to try again — you're only charged when a
      payment succeeds. Using a different card, or another payment option if the page offers one, often fixes it.
    </p>
  `;
}

function stage2Html(name, product) {
  const extra = product.extra ? `<p style="font-size:14px;color:#3A3358;line-height:1.6;">${product.extra()}</p>` : '';
  return `
    <p style="font-size:15px;color:#1A1333;">Hey ${escapeHtml(name)},</p>
    <p style="font-size:15px;color:#3A3358;line-height:1.6;">
      Quick follow-up on <strong>${escapeHtml(product.label)}</strong>. If something stopped you — a payment problem, a
      question about whether it's right for you, or just bad timing — we'd rather help than leave it hanging.
    </p>
    ${factsList(product)}
    ${extra}
    ${ctaLink(product, 2)}
    <p style="font-size:14px;color:#3A3358;line-height:1.6;">
      Not sure it fits? Message us on WhatsApp:
      <a href="https://wa.me/2349066006963" style="color:#7C3AED;">wa.me/2349066006963</a>
      (we reply 10am–5pm WAT, Monday to Saturday).
    </p>
  `;
}

const SUBJECTS = {
  1: (label) => `${label}: your checkout didn't finish`,
  2: (label) => `Any questions about ${label}?`,
};

// Safety cap per run — the query already limits to one row per person, so this
// only matters if a backlog builds up (e.g. the function was disabled for days).
const MAX_SENDS_PER_RUN = 150;

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
    .select('abandoned_checkout_automation_enabled')
    .eq('id', 1)
    .single();
  if (settingsError || !settings) {
    if (settingsError) console.error('Failed to load email settings:', settingsError.message);
    return jsonResponse({ error: 'Could not load email settings' }, 500);
  }

  if (isAutomatedRun) {
    if (!settings.abandoned_checkout_automation_enabled) {
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

  // Who is due which email is decided in SQL (supabase/checkout-recovery.sql):
  // one row per person, stage 1 an hour after they started, stage 2 a day
  // after, nobody who already owns the product, nobody past two emails. The
  // address comes from auth.users (confirmed), never the user-writable
  // profiles.email, so a reminder can't be aimed at a stranger.
  const { data: candidates, error: queryError } = await serviceClient.rpc('service_get_checkout_recovery_candidates');
  if (queryError) {
    console.error('service_get_checkout_recovery_candidates failed:', queryError.message);
    return jsonResponse({ error: 'Could not load abandoned checkouts' }, 500);
  }

  let sent = 0;
  for (const c of (candidates || []).slice(0, MAX_SENDS_PER_RUN)) {
    if (!c.email) continue;
    try {
      const name = c.display_name || c.email.split('@')[0];
      const product = PRODUCTS[c.plan] || FALLBACK_PRODUCT;
      const stage = c.stage === 2 ? 2 : 1;
      const subject = SUBJECTS[stage](product.label);
      const html = emailShell(stage === 2 ? stage2Html(name, product) : stage1Html(name, product));
      const ok = await sendResendEmail(c.email, subject, html);
      if (ok) {
        sent += 1;
        // The log row is what stops the next hourly run sending this again,
        // so a failed insert must be loud, not silent.
        const { error: logError } = await serviceClient.from('email_log').insert({
          user_id: c.user_id,
          email: c.email,
          email_type: 'abandoned_checkout',
          subject,
          metadata: { checkout_attempt_id: c.attempt_id, plan: c.plan, stage },
        });
        if (logError) console.error('email_log insert failed (will re-send next run):', logError.message);
      }
    } catch (err) {
      console.error('abandoned checkout email failed:', err);
    }
  }

  return jsonResponse({ ok: true, matched: (candidates || []).length, sent });
});
