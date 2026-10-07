import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

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
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Social Dev Technologies <notifications@socialdevtechnologies.com>', to: [to], subject, html }),
  });
  return res.ok;
}

function digestEmailHtml(fullArticles, blurbs) {
  const articleItems = fullArticles
    .map(
      (a) => `
      <div style="margin:0 0 20px;">
        <a href="https://socialdevtechnologies.com/news/${a.slug}" style="font-size:16px;font-weight:700;color:#0F1A2A;text-decoration:none;">${a.title}</a>
        <p style="font-size:14px;color:#1F2C3D;line-height:1.5;margin:4px 0 0;">${a.dek}</p>
        <a href="https://socialdevtechnologies.com/news/${a.slug}" style="font-size:13px;font-weight:600;color:#264D73;text-decoration:none;">Read more →</a>
      </div>`,
    )
    .join('');
  const blurbItems = blurbs
    .map((b) => `<li style="font-size:14px;color:#1F2C3D;line-height:1.6;margin-bottom:8px;">${b.dek}</li>`)
    .join('');

  return `
    <p style="font-size:15px;color:#0F1A2A;">Hey there,</p>
    <p style="font-size:15px;color:#1F2C3D;line-height:1.6;">Here's what happened in AI today — picked and written for people actually building with this stuff.</p>
    ${articleItems}
    ${blurbs.length ? `<p style="font-size:14px;font-weight:700;color:#0F1A2A;margin:20px 0 8px;">Also worth knowing:</p><ul style="padding-left:20px;margin:0;">${blurbItems}</ul>` : ''}
    <div style="text-align:center;margin:28px 0;">
      <a href="https://socialdevtechnologies.com/news" style="display:inline-block;background:#264D73;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">Read more on the site →</a>
    </div>
  `;
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const date = body.date || new Date().toISOString().slice(0, 10);

  // admin_send_news_digest both authenticates (raises if the caller isn't
  // an admin) and atomically claims the batch — no separate auth check
  // needed here, same reasoning as every other admin_* RPC call pattern.
  const authHeader = req.headers.get('Authorization') ?? '';
  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: batch, error: claimError } = await callerClient.rpc('admin_send_news_digest', { p_date: date });
  if (claimError) return jsonResponse({ error: claimError.message.includes('Unauthorized') ? 'Unauthorized' : claimError.message }, claimError.message.includes('Unauthorized') ? 403 : 500);

  if (!batch || batch.length === 0) return jsonResponse({ ok: true, sent: 0, reason: 'Nothing approved for this date' });

  const fullArticles = batch.filter((a) => a.is_full_article);
  const blurbs = batch.filter((a) => !a.is_full_article);

  const { data: profiles, error: profilesError } = await callerClient.rpc('admin_get_all_profiles');
  if (profilesError) return jsonResponse({ error: 'Could not load recipients' }, 500);

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const notifTitle = `Today's AI news digest`;
  const notifBody = fullArticles.length
    ? `${batch.length} new stor${batch.length === 1 ? 'y' : 'ies'}, including "${fullArticles[0].title}"`
    : `${batch.length} new AI news item${batch.length === 1 ? '' : 's'}`;

  const recipients = (profiles || []).filter((p) => p.email);
  if (recipients.length > 0) {
    await serviceClient.from('notifications').insert(
      recipients.map((p) => ({ user_id: p.id, type: 'news_digest', title: notifTitle, body: notifBody, link: '/news' })),
    );
  }

  const subject = fullArticles.length ? `AI Digest: ${fullArticles[0].title}` : 'Your AI news digest';
  const html = emailShell(digestEmailHtml(fullArticles, blurbs));

  let sent = 0;
  for (const p of recipients) {
    const ok = await sendResendEmail(p.email, subject, html);
    if (ok) {
      sent += 1;
      await serviceClient.from('email_log').insert({
        user_id: p.id,
        email: p.email,
        email_type: 'news_digest',
        subject,
        metadata: { date, article_count: batch.length },
      });
    }
  }

  return jsonResponse({ ok: true, articleCount: batch.length, matched: recipients.length, sent });
});
