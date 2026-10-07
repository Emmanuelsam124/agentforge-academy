import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Email capture + the free "start building AI agents" starter series.
//
// One function, three callers:
//   * the browser (EmailCapture form, /subscribe/confirm, /unsubscribe):
//     JSON POST {action: 'subscribe' | 'confirm' | 'unsubscribe', ...}
//   * a mail client's one-click unsubscribe (RFC 8058): POST ?unsubscribe=<token>
//   * pg_cron, hourly (x-cron-secret): sends whichever drip emails are due
//
// Deploy with verify_jwt = false (it must accept anonymous visitors); the
// cron path is protected by the shared CRON_SECRET, everything else only ever
// touches the one address/token it was given. Schema: supabase/email-capture.sql.
//
// Double opt-in: 'subscribe' only stores a pending row and sends a
// confirmation email. Nothing else is sent until 'confirm' is called with the
// token from that email, so typing someone else's address does nothing but
// send them one confirmation they can ignore.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

const SITE = 'https://socialdevtechnologies.com';

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

// Prices quoted in the offer email (drip step 3). Same figures as
// src/data/pricing.js / create-paystack-checkout / paystack-webhook — move them
// together.
const BUILDER1_PRICE = 5000;
const BUILDER2_PRICE = 7000;
const PRO_PRICE = 10000;
const fmt = (n) => `₦${n.toLocaleString('en-US')}`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOURCE_RE = /^[a-z0-9_\-/]{1,60}$/i;

const CONFIRM_RESEND_COOLDOWN_MS = 60 * 60 * 1000;
// Stops the open form being used to fire confirmation emails at strangers in
// bulk. Counts EVERY confirmation email sent in the last hour — new sign-ups and
// re-sends alike — and refuses further ones past this. Well above organic
// traffic; an attacker is capped at this many unsolicited emails an hour.
const MAX_CONFIRMATION_EMAILS_PER_HOUR = 60;
// Addresses that never confirmed are deleted after this long (we shouldn't keep
// strangers' addresses we were typed into a form for).
const PENDING_RETENTION_DAYS = 30;
const MAX_DRIPS_PER_RUN = 100;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function shell(innerHtml, footerHtml) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#F6F8FB;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:18px;font-weight:800;color:#0F1A2A;">Social Dev <span style="color:#264D73;">Technologies</span></span>
      </div>
      ${innerHtml}
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E7ECF2;font-size:12px;color:#4A5B6C;text-align:center;line-height:1.6;">
        ${footerHtml}
      </div>
    </div>
  `;
}

const button = (href, label) => `
  <div style="text-align:center;margin:28px 0;">
    <a href="${href}" style="display:inline-block;background:#264D73;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">${label}</a>
  </div>`;

const p = (html) => `<p style="font-size:15px;color:#1F2C3D;line-height:1.6;">${html}</p>`;
const link = (href, label) => `<a href="${href}" style="color:#264D73;">${label}</a>`;

async function sendResendEmail(to, subject, html, extraHeaders = undefined) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Social Dev Technologies <notifications@socialdevtechnologies.com>',
      to: [to],
      subject,
      html,
      ...(extraHeaders ? { headers: extraHeaders } : {}),
    }),
  });
  return res.ok;
}

// ---------- confirmation email ----------

function confirmationEmail(token) {
  const url = `${SITE}/subscribe/confirm?token=${token}`;
  return {
    subject: 'Confirm your email to get the free AI agent starter series',
    html: shell(
      `
      ${p('Hey,')}
      ${p(`Someone — hopefully you — asked for our free <strong>AI agent starter series</strong> on socialdevtechnologies.com.
        Press the button to confirm your email address and we'll send the first email straight away.`)}
      ${button(url, 'Yes, send me the series')}
      ${p(`<span style="font-size:13px;color:#4A5B6C;">If that wasn't you, ignore this email — nothing will be sent and you won't hear from us.</span>`)}
    `,
      `Social Dev Technologies · You're receiving this because this address was entered on our website.`,
    ),
  };
}

// ---------- the 3-email series ----------
// Every claim below is already true on the live site: the Daily News walkthrough
// is public, the Gemini key is free, the prices are the current ones. Don't add
// testimonials, income claims or deadlines here.

const DAILY_NEWS_URL = `${SITE}/session/daily-news-agent`;

function dripEmail(step, unsubscribeUrl) {
  const footer = `Social Dev Technologies · You're receiving this because you asked for our free AI agent starter series.<br/>
    ${link(unsubscribeUrl, 'Unsubscribe')} at any time — one click, no login.`;

  if (step === 1) {
    return {
      subject: 'Welcome — your free walkthrough is ready',
      html: shell(
        `
        ${p('Hey,')}
        ${p(`You're in. Over the next week you'll get two more short emails after this one — then that's it, unless you choose to hear more.`)}
        ${p(`<strong>Start here:</strong> a free, step-by-step walkthrough of a real agent — a Daily News &amp; Industry Summary agent that
          collects headlines for your industry and sends you a decision-ready briefing every morning. It takes you from setting up your
          workspace, to connecting a free AI writer, to scheduling it so it runs without you.`)}
        ${button(DAILY_NEWS_URL, 'Open the free walkthrough →')}
        ${p(`You don't need a paid AI subscription for any of this — a free Gemini API key from Google AI Studio is enough.`)}
        ${p(`Want to read around first? Our ${link(`${SITE}/guides`, 'free guides')} and ${link(`${SITE}/news`, 'AI news digest')} are open to everyone.`)}
      `,
        footer,
      ),
    };
  }

  if (step === 2) {
    return {
      subject: 'The four parts every AI agent has',
      html: shell(
        `
        ${p('Hey,')}
        ${p(`Every agent you'll ever build — however fancy it looks — is the same four parts. Once you see them, new builds stop feeling like starting from zero:`)}
        <ol style="font-size:15px;color:#1F2C3D;line-height:1.7;padding-left:22px;">
          <li><strong>A trigger</strong> — what starts it (a schedule, a new email, a message).</li>
          <li><strong>Instructions</strong> — the prompt that tells the AI exactly what to do, and what a good answer looks like.</li>
          <li><strong>Tools</strong> — where it gets information or does work (news feeds, your inbox, a spreadsheet).</li>
          <li><strong>An output</strong> — where the result lands (an email, a Slack message, a row in a sheet).</li>
        </ol>
        ${p(`In the Daily News agent: the trigger is a morning schedule, the instructions are a prompt that turns headlines into a briefing,
          the tools are your news sources and the AI model, and the output is the email you wake up to.`)}
        ${p(`If you haven't built it yet, that's the best place to feel all four click into place:`)}
        ${button(DAILY_NEWS_URL, 'Build it free →')}
        ${p(`Stuck on a step? Message us on WhatsApp: ${link('https://wa.me/2349066006963', 'wa.me/2349066006963')} (we reply 10am–5pm WAT, Monday to Saturday).`)}
      `,
        footer,
      ),
    };
  }

  return {
    subject: 'Ready for the next step?',
    html: shell(
      `
      ${p('Hey,')}
      ${p(`This is the last email in the series. If the walkthrough made you want to build more, here's how people continue:`)}
      <ul style="font-size:15px;color:#1F2C3D;line-height:1.7;padding-left:22px;">
        <li><strong>Builder 1 — ${fmt(BUILDER1_PRICE)}.</strong> 12 step-by-step agent guides with copy-paste prompts. One payment, yours permanently.</li>
        <li><strong>Builder 2 — ${fmt(BUILDER2_PRICE)}.</strong> 13 multi-step, API-integrated agent builds. One payment, yours permanently.</li>
        <li><strong>Pro — ${fmt(PRO_PRICE)}.</strong> Both tracks together — cheaper than buying them separately.</li>
      </ul>
      ${p(`Prefer to learn live? <strong>AI Agent Mastery</strong> is a three-evening live cohort (Friday to Sunday) where you build a personal-assistant agent,
        and the <strong>Vibe Coding Bootcamp</strong> is four weeks of live classes taking you from an idea to a deployed product.`)}
      ${button(`${SITE}/pricing`, 'See every option →')}
      ${p(`Questions before you decide? Message us on WhatsApp: ${link('https://wa.me/2349066006963', 'wa.me/2349066006963')} (we reply 10am–5pm WAT, Monday to Saturday).`)}
    `,
      footer,
    ),
  };
}

// ---------- sending one drip step ----------

async function sendDrip(row, step) {
  const unsubscribeUrl = `${SITE}/unsubscribe?token=${row.unsubscribe_token}`;
  const { subject, html } = dripEmail(step, unsubscribeUrl);
  const oneClick = `${SUPABASE_URL}/functions/v1/email-leads?unsubscribe=${row.unsubscribe_token}`;
  return { subject, ok: await sendResendEmail(row.email, subject, html, {
    // https only: there is no working mailbox to offer as a mailto fallback.
    'List-Unsubscribe': `<${oneClick}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }) };
}

// Claim-then-send: bump drip_step only if it still holds the value we read, so
// two overlapping runs (or the confirm action racing the cron) can't both send
// the same step. If the send fails, release the claim so the next run retries.
async function claimAndSendDrip(sb, row, step) {
  const { data: claimed } = await sb
    .from('email_subscribers')
    .update({ drip_step: step, last_drip_at: new Date().toISOString() })
    .eq('id', row.id)
    .eq('drip_step', step - 1)
    .select('id');
  if (!claimed || claimed.length === 0) return false;

  const { subject, ok } = await sendDrip(row, step);
  if (!ok) {
    await sb.from('email_subscribers').update({ drip_step: step - 1 }).eq('id', row.id);
    return false;
  }
  const { error } = await sb.from('email_log').insert({
    user_id: null,
    email: row.email,
    email_type: 'lead_drip',
    subject,
    metadata: { step },
  });
  if (error) console.error('email_log insert failed:', error.message);
  return true;
}

// ---------- handler ----------

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const url = new URL(req.url);

  // One-click unsubscribe from a mail client (RFC 8058). The token is in the
  // query string; the body is "List-Unsubscribe=One-Click" and is not needed.
  const oneClickToken = url.searchParams.get('unsubscribe');
  if (oneClickToken) {
    if (UUID_RE.test(oneClickToken)) {
      await sb
        .from('email_subscribers')
        .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
        .eq('unsubscribe_token', oneClickToken);
    }
    return json({ ok: true });
  }

  // Scheduled run.
  const cronHeader = req.headers.get('x-cron-secret') ?? '';
  if (cronHeader) {
    if (!CRON_SECRET || cronHeader !== CRON_SECRET) return json({ error: 'Unauthorized' }, 401);

    const { data: settings } = await sb.from('email_settings').select('lead_drip_automation_enabled').eq('id', 1).single();
    if (!settings?.lead_drip_automation_enabled) return json({ ok: true, skipped: true, reason: 'Automation disabled' });

    const { data: due, error: dueError } = await sb.rpc('service_get_due_lead_drips');
    if (dueError) {
      console.error('service_get_due_lead_drips failed:', dueError.message);
      return json({ error: 'Could not load due emails' }, 500);
    }

    let sent = 0;
    let converted = 0;
    for (const row of (due || []).slice(0, MAX_DRIPS_PER_RUN)) {
      try {
        if (row.is_customer) {
          // Already a paying customer — stop selling them what they bought.
          await sb.from('email_subscribers').update({ converted_at: new Date().toISOString() }).eq('id', row.id);
          converted += 1;
          continue;
        }
        if (await claimAndSendDrip(sb, row, row.next_step)) sent += 1;
      } catch (err) {
        console.error('lead drip failed:', err);
      }
    }
    // Housekeeping: drop addresses that never confirmed.
    const cutoff = new Date(Date.now() - PENDING_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { error: pruneError } = await sb.from('email_subscribers').delete().eq('status', 'pending').lt('created_at', cutoff);
    if (pruneError) console.error('pruning unconfirmed subscribers failed:', pruneError.message);

    return json({ ok: true, due: (due || []).length, sent, converted });
  }

  // Browser actions.
  let body;
  try {
    const raw = await req.text();
    if (raw.length > 4096) return json({ error: 'Request too large' }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const action = body?.action;

  if (action === 'subscribe') {
    // Honeypot: a field real visitors never see. Bots that fill it get the same
    // friendly answer and nothing happens.
    if (typeof body.website === 'string' && body.website.trim() !== '') return json({ ok: true });

    const email = String(body.email ?? '').trim().toLowerCase();
    if (email.length < 5 || email.length > 254 || !EMAIL_RE.test(email)) {
      return json({ error: 'Please enter a valid email address.' }, 400);
    }
    const source = typeof body.source === 'string' && SOURCE_RE.test(body.source) ? body.source : 'site';

    const { data: existing } = await sb.from('email_subscribers').select('*').eq('email', email).maybeSingle();

    // Same answer whether or not the address is already known — the form must
    // not reveal who is on the list.
    if (existing?.status === 'confirmed') return json({ ok: true });
    if (existing?.confirm_sent_at && Date.now() - new Date(existing.confirm_sent_at).getTime() < CONFIRM_RESEND_COOLDOWN_MS) {
      return json({ ok: true });
    }

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: sentLastHour } = await sb
      .from('email_subscribers')
      .select('id', { count: 'exact', head: true })
      .gte('confirm_sent_at', since);
    if ((sentLastHour ?? 0) >= MAX_CONFIRMATION_EMAILS_PER_HOUR) {
      return json({ error: 'Too many sign-ups right now. Please try again in a little while.' }, 429);
    }

    let row = existing;
    if (!row) {
      const { data: inserted, error: insertError } = await sb
        .from('email_subscribers')
        .insert({ email, source, status: 'pending' })
        .select('*')
        .single();
      if (insertError || !inserted) {
        console.error('subscribe insert failed:', insertError?.message);
        return json({ error: 'Something went wrong. Please try again.' }, 500);
      }
      row = inserted;
    } else if (row.status === 'unsubscribed') {
      // Coming back after unsubscribing: needs a fresh confirmation like anyone new.
      await sb.from('email_subscribers').update({ status: 'pending', drip_step: 0, last_drip_at: null }).eq('id', row.id);
    }

    const { subject, html } = confirmationEmail(row.confirm_token);
    const ok = await sendResendEmail(email, subject, html);
    if (!ok) return json({ error: "We couldn't send the confirmation email. Please try again." }, 502);
    await sb.from('email_subscribers').update({ confirm_sent_at: new Date().toISOString() }).eq('id', row.id);
    await sb.from('email_log').insert({ user_id: null, email, email_type: 'lead_confirm', subject, metadata: { source } });
    return json({ ok: true });
  }

  if (action === 'confirm') {
    const token = String(body.token ?? '');
    if (!UUID_RE.test(token)) return json({ error: 'This confirmation link is not valid.' }, 400);

    const { data: row } = await sb.from('email_subscribers').select('*').eq('confirm_token', token).maybeSingle();
    if (!row) return json({ error: 'This confirmation link is not valid.' }, 404);
    if (row.status === 'confirmed') return json({ ok: true, already: true });

    await sb
      .from('email_subscribers')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        unsubscribed_at: null,
        // An old confirmation link used after unsubscribing restarts the series.
        ...(row.status === 'unsubscribed' ? { drip_step: 0, last_drip_at: null } : {}),
      })
      .eq('id', row.id);

    // Welcome email right away. If it fails the row stays at drip_step 0 and the
    // next hourly run sends it.
    try {
      await claimAndSendDrip(sb, row, 1);
    } catch (err) {
      console.error('welcome send failed:', err);
    }
    return json({ ok: true });
  }

  if (action === 'unsubscribe') {
    const token = String(body.token ?? '');
    if (UUID_RE.test(token)) {
      await sb
        .from('email_subscribers')
        .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
        .eq('unsubscribe_token', token);
    }
    return json({ ok: true });
  }

  return json({ error: 'Unknown action' }, 400);
});
