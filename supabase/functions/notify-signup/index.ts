import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const ADMIN_EMAIL = Deno.env.get('ADMIN_NOTIFY_EMAIL') ?? 'king.samueljacob@gmail.com';
// Same shared secret already used by the pg_cron-triggered email functions
// (send-winback-emails etc.) — reused here rather than provisioning a new
// one, since the DB trigger that calls this function has no end-user JWT to
// present either.
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

serve(async (req) => {
  try {
    const cronHeader = req.headers.get('x-cron-secret') ?? '';
    if (!CRON_SECRET || cronHeader !== CRON_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = await req.json();
    const record = payload.record;

    if (!record) return new Response('No record', { status: 400 });

    const email = escapeHtml(record.email ?? 'unknown');
    const name = escapeHtml(record.display_name ?? record.email ?? 'unknown');
    const joined = new Date(record.created_at).toLocaleString('en-GB', {
      dateStyle: 'medium', timeStyle: 'short',
    });

    const html = `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
        <h2 style="color:#0067B8;margin-bottom:8px;">🎉 New user joined Social Dev Technologies</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#666;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;font-weight:600;">${email}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Joined</td><td style="padding:8px 0;">${joined}</td></tr>
        </table>
        <a href="https://socialdevtechnologies.com/admin" style="display:inline-block;margin-top:16px;background:#264D73;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
          View in Admin Dashboard →
        </a>
      </div>
    `;

    if (RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Social Dev Technologies <notifications@socialdevtechnologies.com>',
          to: [ADMIN_EMAIL],
          subject: `New signup: ${name} (${email})`,
          html,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
