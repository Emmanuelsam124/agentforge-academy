import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// BYU-Pathway student checkout WITHOUT signing in first (2026-09-29): the
// student types their @byupathway.edu address, pays ₦10,000, and paystack-
// webhook then creates the account and emails the login to that mailbox.
//
// Why skipping verification up front is still safe: nobody gets a session
// from this flow — the only way into the account is through the emailed
// code/link (or a later "log in with an emailed code"), and both go to the
// BYU mailbox. Paying with an address you don't own buys access only that
// mailbox's owner can use. No account is created here; the webhook creates
// it after a signature-verified successful payment, so typing addresses
// can't spray accounts into the database.
//
// Deployed with verify_jwt: false (the caller has no account yet).
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';

// Must match paystack-webhook's MULTI_TIER_PRICES.aimastery and
// create-paystack-checkout's AIMASTERY_STUDENT_PRICE.
const STUDENT_PRICE = 10000;
const STUDENT_EMAIL_RE = /^[^\s@]+@byupathway\.edu$/i;

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

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const email = String(body?.email ?? '').trim().toLowerCase();
  if (email.length > 254 || !STUDENT_EMAIL_RE.test(email)) {
    return jsonResponse({ error: 'Enter your full @byupathway.edu email address.' }, 400);
  }

  // The client-supplied origin only decides where Paystack sends the browser
  // afterwards — restrict it to our own sites so it can't be an open redirect.
  const requestedOrigin = String(body?.redirectOrigin ?? '');
  const origin = ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(requestedOrigin))
    ? requestedOrigin
    : 'https://socialdevtechnologies.com';

  const reference = `sdt_aimastery_student_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: STUDENT_PRICE * 100, // kobo
      currency: 'NGN',
      reference,
      // No user_id: the account doesn't exist yet. The webhook keys off
      // student_email (re-validated there against the same domain rule).
      metadata: { plan: 'aimastery', student_email: email },
      callback_url: `${origin}/ai-agent-mastery?paid=student`,
    }),
  });

  const data = await paystackRes.json();
  if (!paystackRes.ok || !data.status) {
    return jsonResponse({ error: data.message || 'Failed to initialize payment' }, 502);
  }
  return jsonResponse({ authorization_url: data.data.authorization_url });
});
