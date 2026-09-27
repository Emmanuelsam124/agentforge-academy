import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Set PAYSTACK_SECRET_KEY in your Supabase Edge Function secrets.
// SUPABASE_URL and SUPABASE_ANON_KEY are injected automatically.
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Prices in NGN (major units). Paystack settles in NGN even for
// international card holders — it handles FX conversion on its end, so
// there's no separate USD price. Keep these in sync with Pricing.jsx and
// the amount check in paystack-webhook — this constant is what's actually
// sent to Paystack (see amountNaira below), so a mismatch with the
// webhook's own PRICES means a real charge gets flagged as unrecognized.
//
// builder1/builder2/pro cut from 25000/25000/45000 to 5000/7000/10000
// (2026-09-22) as part of repositioning them from a 6-month subscription
// (live cohort + AI Builder credits) into permanent, guides-only access —
// see supabase/guide-purchases-setup.sql. Builder 1 and Builder 2 no
// longer share one price: Builder 2 is priced above Builder 1 as the more
// advanced track. Pro (10000) is a discount off buying both separately
// (12000), same "just get Pro" logic as before at the new price floor.
//
// vibecoding and aimastery are both separate live-cohort products, not
// tiers of the builder1/builder2/pro ladder above — priced independently
// of each other and of the ladder (aimastery cut from 25000 to 19999 and
// vibecoding raised from 25000 to 50000, both 2026-09-23). The webhook's
// resolvePlan() trusts the metadata.plan set below for exact
// identification, only falling back to amount-only matching (pro-only)
// for metadata-less payments.
//
// agentslive (added 2026-09-27) is a separate 2-day live workshop, not a
// tier of AI Agent Mastery — same starting price as 'pro' (10000) is
// coincidental; resolvePlan() in the webhook keys off the plan string in
// metadata, not the amount alone, so this collision is safe as long as
// checkout always sets metadata.plan (it does, below).
//
// agentslive is also the one plan with REAL seat-based scarcity pricing
// (founder-confirmed 2026-09-27): the first AGENTS_LIVE_SEAT_THRESHOLD
// granted payments are AGENTS_LIVE_PRICE_EARLY, everyone after is
// AGENTS_LIVE_PRICE_LATE — computed below from a live count, not this
// static map. See resolveAgentsLivePrice().
const PRICES = {
  builder1: 5000,
  builder2: 7000,
  pro: 10000,
  vibecoding: 50000,
  aimastery: 19999,
  agentslive: 10000, // early-bird price; resolveAgentsLivePrice() may override
};

const AGENTS_LIVE_PRICE_EARLY = 10000;
const AGENTS_LIVE_PRICE_LATE = 15000;
const AGENTS_LIVE_SEAT_THRESHOLD = 100;

// Counts granted 'agentslive' payments directly (service-role client
// bypasses the payments table's "view your own rows only" RLS) rather than
// calling the public agentslive_seats_taken() RPC — same number either way,
// but this avoids a round trip through PostgREST for a value this function
// already has a direct service-role connection for.
async function resolveAgentsLivePrice(supabaseService) {
  const { count, error } = await supabaseService
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('plan', 'agentslive')
    .eq('status', 'granted');
  if (error) throw error;
  return (count ?? 0) >= AGENTS_LIVE_SEAT_THRESHOLD ? AGENTS_LIVE_PRICE_LATE : AGENTS_LIVE_PRICE_EARLY;
}

// This function is called directly from the browser (Pricing.jsx via
// supabase.functions.invoke), so it needs CORS headers and to answer the
// browser's preflight OPTIONS request — without these, the browser blocks
// the request before it ever reaches this code and supabase-js reports
// "Failed to send a request to the Edge Function". Restricted to an
// allowlist rather than '*' since this endpoint performs a privileged,
// state-changing action (initiates a real charge) for an authenticated
// user — but still needs to allow local dev (localhost) and Vercel preview
// deployments (*.vercel.app), not just the production domain.
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

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  // Identify the caller from their Supabase JWT (this function requires
  // verify_jwt: true) — never trust a client-supplied user id.
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { plan, redirectOrigin } = body;
  if (typeof plan !== 'string' || !Object.hasOwn(PRICES, plan)) {
    return jsonResponse({ error: 'Unknown plan' }, 400);
  }

  // Created once here (not just at the bottom for checkout_attempts
  // logging) since agentslive's real price needs a service-role read of
  // the payments table before Paystack is ever called.
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let amountNaira = PRICES[plan];
  if (plan === 'agentslive') {
    try {
      amountNaira = await resolveAgentsLivePrice(serviceClient);
    } catch (_err) {
      // Fail closed to the higher price rather than risk under-charging if
      // the seat count can't be read — never silently give the early-bird
      // price on an error.
      amountNaira = AGENTS_LIVE_PRICE_LATE;
    }
  }

  // Embed the verified user id + plan in Paystack's metadata. Paystack
  // signs the whole webhook payload with our secret key, so when it comes
  // back we can trust this exactly as much as we trust our own signature
  // check — this is what lets the webhook grant access by user id instead
  // of the fragile "match the payer's email" approach.
  const reference = `sdt_${plan}_${user.id}_${Date.now()}`;

  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: amountNaira * 100, // kobo
      currency: 'NGN',
      reference,
      metadata: { user_id: user.id, plan },
      callback_url: `${redirectOrigin || ''}/dashboard`,
    }),
  });

  const data = await paystackRes.json();
  if (!paystackRes.ok || !data.status) {
    return jsonResponse({ error: data.message || 'Failed to initialize payment' }, 502);
  }

  // Log the attempt so the abandoned-checkout reminder can find people who
  // started paying and never finished. Uses the service role client since
  // the caller's own JWT has no insert grant on checkout_attempts (by design
  // — only the service role and admin RPCs touch this table). Best-effort:
  // a logging failure here must never block the actual checkout redirect.
  try {
    await serviceClient.from('checkout_attempts').insert({
      user_id: user.id,
      plan,
      provider_reference: reference,
    });
  } catch (_err) {
    // non-fatal — see comment above
  }

  return jsonResponse({ authorization_url: data.data.authorization_url });
});
