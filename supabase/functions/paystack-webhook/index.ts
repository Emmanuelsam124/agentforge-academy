import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Set PAYSTACK_SECRET_KEY in your Supabase Edge Function secrets — Paystack
// signs webhooks with your secret key directly (no separate webhook secret).
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

// Expected NGN prices — must match Pricing.jsx and create-paystack-checkout
// exactly. These two constants must move together or a real payment gets
// flagged 'flagged_unrecognized_amount' and nothing is granted despite the
// charge succeeding.
//
// builder1/builder2/pro cut from 25000/25000/45000 to 5000/7000/10000
// (2026-09-22): these now grant permanent, guides-only access via
// guide_purchases (see below) instead of a 6-month entitlements-table
// subscription with cohort/credits — never add back a struck-through
// anchor price for these three, the 95%+ discount it would imply is no
// longer real.
//
// vibecoding and aimastery are both separate live-cohort products, each
// priced independently (aimastery cut from 25000 to 19999 and vibecoding
// raised from 25000 to 50000, both 2026-09-23). resolvePlan() below trusts
// metadata.plan first, and checkout always sets it.
//
const PRICES = {
  builder1: 5000,
  builder2: 7000,
  pro: 10000,
  vibecoding: 50000,
  aimastery: 19999,
};
const AMOUNT_TOLERANCE = 1;

// Share of a referred person's payment credited to their referrer. Must match
// REFERRAL_COMMISSION_PERCENT in src/data/pricing.js (display copy).
const REFERRAL_COMMISSION_RATE = 0.1;

// Scholarship price for approved applicants (2026-10-05). Same Supabase
// secret create-paystack-checkout reads, so whatever it charges is an amount this
// webhook recognises. Unset or not a positive number -> 10000.
const SCHOLARSHIP_PRICE_NAIRA = (() => {
  const n = Number(String(Deno.env.get('SCHOLARSHIP_PRICE_NAIRA') ?? '').trim());
  return Number.isFinite(n) && n > 0 ? n : 10000;
})();

// Plans that have more than one valid price. resolvePlan() checks every price
// in this list instead of the single PRICES[plan] value.
const MULTI_TIER_PRICES = {
  // Full price or the scholarship price (default ₦10,000). Eligibility is
  // enforced at checkout creation (create-paystack-checkout: an approved
  // scholarship application) — only that function can start a discounted
  // aimastery charge, so the webhook just needs to recognise the amounts.
  aimastery: [...new Set([19999, SCHOLARSHIP_PRICE_NAIRA])],
};

// Pro upgrade-by-difference (2026-10-04): a buyer who already owns ONE
// permanent guide tier pays Pro minus what that tier cost and gets the other
// tier. Keyed by the tier they already own. Must equal the same table in
// create-paystack-checkout (both derive it from PRICES).
const UPGRADE_PRICES = {
  builder1: PRICES.pro - PRICES.builder1,
  builder2: PRICES.pro - PRICES.builder2,
};

// Paystack can add its own transaction fee on top of the amount we set at
// checkout, if this account's "customer bears the fee" preference is on
// (Paystack Dashboard → Settings → Preferences → Transaction fees). When
// that's on, the amount that actually lands here is price + fee, not price
// exactly — local cards run ~1.5% + ₦100, international cards ~3.9% + ₦100,
// both capped, which tops out around 4% at our price points. 6% gives
// headroom without being loose enough to wave through a genuinely wrong
// amount. This does NOT relax the floor — amountNaira still can't be below
// the listed price (minus AMOUNT_TOLERANCE for rounding).
const FEE_CEILING_MULTIPLIER = 1.06;

const PLAN_LABELS = {
  builder1: 'Builder 1',
  builder2: 'Builder 2',
  pro: 'Pro',
  vibecoding: 'Vibe Coding Bootcamp',
  aimastery: 'AI Agent Mastery',
};

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

// Cohort dates are purely informational (access is instant/self-paced on
// purchase regardless), but surfacing an upcoming date here still helps a
// buyer know when live/group activity around their tier kicks off.
async function buildCohortLines(supabase, plan) {
  // builder1/builder2/pro are permanent, guides-only purchases now — no
  // cohort or live-session perks attached, so there's nothing to surface.
  if (plan === 'builder1' || plan === 'builder2' || plan === 'pro') return '';
  const { data } = await supabase.from('cohort_schedule').select('tier, start_date').eq('tier', plan);
  const labels = { vibecoding: 'Vibe Coding Bootcamp', aimastery: 'AI Agent Mastery' };
  const today = new Date(new Date().toDateString());
  const lines = (data || [])
    .filter((row) => row.start_date && new Date(`${row.start_date}T00:00:00`) >= today)
    .map((row) => {
      const formatted = new Date(`${row.start_date}T00:00:00`).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      return `<li>${labels[row.tier]} cohort starts <strong>${formatted}</strong></li>`;
    });
  if (lines.length === 0) return '';
  return `<ul style="font-size:14px;color:#3A3358;line-height:1.7;padding-left:20px;margin:16px 0;">${lines.join('')}</ul>`;
}

// One-tier buyers can unlock the other tier for the difference to Pro
// (create-paystack-checkout decides the price from what they own; these
// figures are derived from the same PRICES so the email can't quote a stale one).
function upgradeUpsell(plan) {
  if (plan !== 'builder1' && plan !== 'builder2') return '';
  const otherLabel = plan === 'builder1' ? 'Builder 2' : 'Builder 1';
  const upgradePrice = UPGRADE_PRICES[plan];
  const normalPrice = PRICES[plan === 'builder1' ? 'builder2' : 'builder1'];
  return `
    <div style="margin:20px 0;padding:14px 16px;border:1.5px solid #EEE6FB;border-radius:12px;background:#FFFFFF;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#1A1333;">Want ${otherLabel} too?</p>
      <p style="margin:0;font-size:14px;color:#3A3358;line-height:1.6;">
        Because you own ${PLAN_LABELS[plan]}, you can unlock ${otherLabel} for just
        <strong>₦${upgradePrice.toLocaleString('en-US')}</strong> instead of ₦${normalPrice.toLocaleString('en-US')} —
        you only pay the difference to Pro. Find it on the
        <a href="https://socialdevtechnologies.com/pricing" style="color:#7C3AED;">pricing page</a> whenever you're ready.
      </p>
    </div>`;
}

// Distinct bullet variants:
// - builder1/builder2/pro (permanent guides, added 2026-09-22): no cohort
//   lines, no "6 months" framing (access is permanent), no credits mention
//   (these no longer grant AI Builder credits) — a free Gemini API key is
//   still all that's needed to work through the guides.
// - vibecoding: live-taught (join links/replays live on the dashboard, not
//   a self-paced build queue), plus its prompt library.
// - aimastery: live-taught like vibecoding, but no prompt-library bullet —
//   this program has no equivalent reference-library table.
function welcomeHtml(name, planLabel, cohortLines, plan) {
  const isPermanentGuides = plan === 'builder1' || plan === 'builder2' || plan === 'pro';
  let bullets;
  if (plan === 'vibecoding') {
    bullets = `
      <li>Your live classes and replays are on your dashboard under Live Sessions.</li>
      <li>The prompt library (8 reusable prompts for the bootcamp) is also on your dashboard.</li>
      <li>Stuck on something? Reach us on WhatsApp: <a href="https://wa.me/2349066006963" style="color:#7C3AED;">wa.me/2349066006963</a></li>
    `;
  } else if (plan === 'aimastery') {
    bullets = `
      <li>Your live classes and replays are on your dashboard under Live Sessions.</li>
      <li>Stuck on something? Reach us on WhatsApp: <a href="https://wa.me/2349066006963" style="color:#7C3AED;">wa.me/2349066006963</a></li>
    `;
  } else {
    bullets = `
      <li>All you need is a free Gemini API key from Google AI Studio — no paid AI subscription required.</li>
      <li>Every session ends with a portfolio write-up prompt — that's what makes this resume-ready, don't skip it.</li>
      <li>Stuck on a build? Reach us on WhatsApp: <a href="https://wa.me/2349066006963" style="color:#7C3AED;">wa.me/2349066006963</a></li>
    `;
  }
  const accessLine = isPermanentGuides
    ? `You're in! Your <strong>${planLabel}</strong> access is live right now — yours to keep, no expiry.`
    : `You're in! Your <strong>${planLabel}</strong> access is live right now, for the next 6 months.`;
  return `
    <p style="font-size:15px;color:#1A1333;">Hey ${escapeHtml(name)},</p>
    <p style="font-size:15px;color:#3A3358;line-height:1.6;">
      ${accessLine}
    </p>
    ${cohortLines}
    ${upgradeUpsell(plan)}
    <p style="font-size:15px;color:#3A3358;line-height:1.6;">A few things before you start:</p>
    <ul style="font-size:14px;color:#3A3358;line-height:1.7;padding-left:20px;">
      ${bullets}
    </ul>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://socialdevtechnologies.com/dashboard"
         style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
        Go to my dashboard →
      </a>
    </div>
  `;
}

async function hmacSha512Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time comparison — a plain `===`/`!==` on the hex strings would
// short-circuit on the first differing character, leaking a timing signal
// an attacker could use to guess the correct signature byte-by-byte.
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// Trust the plan embedded in metadata at checkout creation (see
// create-paystack-checkout) as the primary signal, but verify its price
// matches before granting anything.
// Only fall back to amount-only resolution for payments with no metadata
// (e.g. a manual charge created directly in the Paystack dashboard), where
// 'pro' is the only plan this fallback checks for.
function resolvePlan(metadataPlan, amountNaira, currency) {
  if (currency !== 'NGN') return null;

  const withinRange = (price) =>
    amountNaira >= price - AMOUNT_TOLERANCE && amountNaira <= price * FEE_CEILING_MULTIPLIER;

  // 'proupgrade' only says "this amount is one of the two upgrade prices"; the
  // handler re-checks it against what the user actually owns before granting.
  if (metadataPlan === 'proupgrade') {
    return Object.values(UPGRADE_PRICES).some(withinRange) ? 'proupgrade' : null;
  }
  if (metadataPlan && Object.hasOwn(PRICES, metadataPlan)) {
    const validPrices = MULTI_TIER_PRICES[metadataPlan] ?? [PRICES[metadataPlan]];
    if (validPrices.some(withinRange)) return metadataPlan;
  }
  if (withinRange(PRICES.pro)) return 'pro';
  return null;
}

// course_ids for each tier, used to expand a builder1/builder2/pro
// purchase into one guide_purchases row per guide. Mirrors the ranges
// already implicit in course_content.tier — kept as a literal list rather
// than re-deriving it from a live query result inline, so the insert below
// is one straightforward batch rather than a query-then-map dance.
const TIER_COURSE_IDS = {
  builder1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  builder2: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
};

serve(async (req) => {
  const rawBody = await req.text();

  // Verify HMAC-SHA512 signature — proves this request genuinely came from
  // Paystack and that its payload (including metadata we set at checkout
  // creation) hasn't been tampered with.
  const signature = req.headers.get('x-paystack-signature') ?? '';
  const expected = await hmacSha512Hex(PAYSTACK_SECRET_KEY, rawBody);
  if (!timingSafeEqual(signature, expected)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  if (payload.event !== 'charge.success' || payload.data?.status !== 'success') {
    return new Response('Ignored', { status: 200 });
  }

  const txId = String(payload.data?.reference ?? payload.data?.id ?? '');
  const amountNaira = Number(payload.data?.amount) / 100; // kobo -> naira
  const currency = String(payload.data?.currency ?? '');
  const email = payload.data?.customer?.email;
  const metadataUserId = payload.data?.metadata?.user_id;

  if (!txId) return new Response('Missing transaction reference', { status: 400 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Idempotency: a retried/duplicated webhook delivery must never double-process.
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('provider_transaction_id', txId)
    .maybeSingle();
  if (existing) return new Response('Already processed', { status: 200 });

  // A real charge came through for this reference — mark the matching
  // checkout_attempts row resolved so the abandoned-checkout reminder never
  // emails someone who actually completed payment. Best-effort: this must
  // never block granting the entitlement below.
  try {
    await supabase
      .from('checkout_attempts')
      .update({ resolved_at: new Date().toISOString() })
      .eq('provider_reference', txId);
  } catch (_err) {
    // non-fatal — see comment above
  }

  // Never trust event type or metadata alone — verify the amount matches a
  // real plan price before granting anything.
  const metadataPlan = payload.data?.metadata?.plan;
  const plan = resolvePlan(metadataPlan, amountNaira, currency);

  if (!plan) {
    await supabase.from('payments').insert({
      user_id: null,
      provider: 'paystack',
      provider_transaction_id: txId,
      amount: Number.isFinite(amountNaira) ? amountNaira : 0,
      currency: currency || 'unknown',
      status: 'flagged_unrecognized_amount',
    });
    return new Response('Amount did not match a known plan price', { status: 200 });
  }

  // Prefer the user id we embedded in metadata when creating the checkout
  // (see create-paystack-checkout) — exact and not spoofable, since the
  // whole payload is signature-verified above. Fall back to email lookup
  // only for payments that didn't originate from our own checkout flow
  // (e.g. a manual charge created directly in the Paystack dashboard).
  let userId = metadataUserId || null;
  if (!userId && email) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1);
    userId = users?.[0]?.id || null;
  }

  if (!userId) {
    await supabase.from('payments').insert({
      user_id: null,
      provider: 'paystack',
      provider_transaction_id: txId,
      amount: amountNaira,
      currency,
      status: 'flagged_no_matching_user',
    });
    return new Response('User not found', { status: 404 });
  }

  // A Pro upgrade is recorded as a 'pro' purchase (the state the buyer ends up
  // in) at the amount actually paid. Before granting, re-derive from the
  // buyer's real guide_purchases which tier they're missing and what it should
  // have cost — the signed metadata only proves the checkout was ours, not that
  // it still makes sense (e.g. two upgrade checkouts opened and both paid).
  let upgradeGrantTiers = null;
  if (plan === 'proupgrade') {
    const { data: ownedRows } = await supabase.from('guide_purchases').select('tier').eq('user_id', userId);
    const owned = new Set((ownedRows ?? []).map((r) => r.tier));
    const ownsExactlyOne = owned.has('builder1') !== owned.has('builder2');
    const ownedTier = owned.has('builder1') ? 'builder1' : 'builder2';
    const expected = UPGRADE_PRICES[ownedTier];
    const amountMatches =
      ownsExactlyOne && amountNaira >= expected - AMOUNT_TOLERANCE && amountNaira <= expected * FEE_CEILING_MULTIPLIER;
    if (!amountMatches) {
      await supabase.from('payments').insert({
        user_id: userId,
        provider: 'paystack',
        provider_transaction_id: txId,
        amount: amountNaira,
        currency,
        status: 'flagged_upgrade_not_applicable',
      });
      return new Response('Upgrade did not match the buyer’s purchases', { status: 200 });
    }
    upgradeGrantTiers = [ownedTier === 'builder1' ? 'builder2' : 'builder1'];
  }
  const effectivePlan = plan === 'proupgrade' ? 'pro' : plan;

  const isPermanentGuidePlan = effectivePlan === 'builder1' || effectivePlan === 'builder2' || effectivePlan === 'pro';

  if (isPermanentGuidePlan) {
    // builder1/builder2/pro grant permanent access via guide_purchases,
    // never entitlements.builder1_expires_at/builder2_expires_at — those
    // two columns stay reserved for grandfathered pre-2026-09-22
    // subscribers and are never written to by a new purchase.
    const tiers = upgradeGrantTiers ?? (effectivePlan === 'pro' ? ['builder1', 'builder2'] : [effectivePlan]);
    const rows = tiers.flatMap((tier) =>
      TIER_COURSE_IDS[tier].map((course_id) => ({ user_id: userId, course_id, tier, provider_transaction_id: txId })),
    );
    await supabase
      .from('guide_purchases')
      .upsert(rows, { onConflict: 'user_id,course_id', ignoreDuplicates: true });
  } else {
    // vibecoding/aimastery are one-time payments for 6 months of live
    // cohort access (founder-confirmed).
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 182);
    const expiresAtIso = expiresAt.toISOString();

    const entitlementUpdate = { payment_provider: 'paystack' };
    if (plan === 'vibecoding') {
      entitlementUpdate.vibecoding_expires_at = expiresAtIso;
    } else if (plan === 'aimastery') {
      entitlementUpdate.aimastery_expires_at = expiresAtIso;
    }

    await supabase
      .from('entitlements')
      .update(entitlementUpdate)
      .eq('user_id', userId);
  }

  // No plan grants AI Builder credits anymore as of 2026-09-22 (builder1/
  // builder2/pro dropped credits along with the rest of the subscription
  // perks; vibecoding/aimastery never had them) — the ai_grant_credits
  // call that used to live here is gone, not just unreachable, since
  // ai_platform_settings.grant_builder1/grant_builder2/grant_pro have no
  // remaining purchase path that reads them.

  const { data: paymentRow } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      provider: 'paystack',
      provider_transaction_id: txId,
      amount: amountNaira,
      currency,
      plan: effectivePlan,
      status: 'granted',
    })
    .select('id')
    .single();

  // Scholarship redemption — only now, after the signature-verified, amount-
  // checked payment has been granted. scholarship_id is in the metadata
  // create-paystack-checkout set (covered by the same signature). The
  // conditional update makes it single-use: it matches only an approved,
  // not-yet-redeemed application. Best-effort — a hiccup here must never cost a
  // paying student their access.
  const scholarshipId = String(payload.data?.metadata?.scholarship_id ?? '');
  if (plan === 'aimastery' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scholarshipId)) {
    try {
      const { error: redeemError } = await supabase
        .from('scholarship_applications')
        .update({ redeemed_at: new Date().toISOString(), payment_reference: txId })
        .eq('id', scholarshipId)
        .eq('status', 'approved')
        .is('redeemed_at', null);
      // supabase-js reports failures in the result rather than throwing. Worth a
      // log line: if it fails the application stays redeemable and needs a manual fix.
      if (redeemError) console.error('scholarship redeem failed:', txId, redeemError.code);
    } catch (_err) {
      // non-fatal — see comment above
    }
  }

  // Referral payout — best-effort and isolated from the grant above: a
  // referrals-table hiccup must never cost a real student their entitlement.
  // This only ever creates a 'pending' ledger row; an admin marks it paid
  // by hand later (admin_mark_referral_earning_paid in referrals-setup.sql)
  // — there is no automatic transfer anywhere in this flow.
  //
  // Commission is REFERRAL_COMMISSION_RATE of the amount paid, and only when
  // the referrer is themselves enrolled in the product being bought
  // (referrer_owned_plans in referrals-percentage.sql — one definition of
  // "enrolled", shared with the code-minting gate). Every qualifying payment
  // earns one row; referral_earnings.payment_id is UNIQUE, so a retried
  // delivery of the same charge can't credit twice.
  try {
    if (paymentRow?.id) {
      const { data: referral } = await supabase
        .from('referrals')
        .select('id, referrer_id')
        .eq('referred_user_id', userId)
        .maybeSingle();

      if (referral) {
        const { data: ownedPlans } = await supabase.rpc('referrer_owned_plans', { p_user: referral.referrer_id });
        if (Array.isArray(ownedPlans) && ownedPlans.includes(effectivePlan)) {
          await supabase.from('referral_earnings').upsert(
            {
              referral_id: referral.id,
              referrer_id: referral.referrer_id,
              payment_id: paymentRow.id,
              plan: effectivePlan,
              amount: Math.round(amountNaira * REFERRAL_COMMISSION_RATE * 100) / 100,
            },
            { onConflict: 'payment_id', ignoreDuplicates: true },
          );
        }
      }
    }
  } catch (_err) {
    // non-fatal — see comment above
  }

  // Welcome email — best-effort, must never block the entitlement grant
  // above or this webhook's 200 response back to Paystack. The idempotency
  // check earlier in this handler already means this only ever fires once
  // per unique transaction, even across retried webhook deliveries.
  try {
    if (RESEND_API_KEY) {
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', userId)
        .maybeSingle();
      const recipientEmail = profileRow?.email || email;
      if (recipientEmail) {
        const name = profileRow?.display_name || recipientEmail.split('@')[0];
        const planLabel = PLAN_LABELS[effectivePlan] || effectivePlan;
        const cohortLines = await buildCohortLines(supabase, effectivePlan);
        const subject = `Welcome to ${planLabel} — you're in!`;
        const ok = await sendResendEmail(recipientEmail, subject, emailShell(welcomeHtml(name, planLabel, cohortLines, effectivePlan)));
        if (ok) {
          await supabase.from('email_log').insert({
            user_id: userId,
            email: recipientEmail,
            email_type: 'welcome',
            subject,
            metadata: { plan: effectivePlan, ...(plan === 'proupgrade' ? { upgrade: true } : {}) },
          });
        }
      }
    }
  } catch (_err) {
    // non-fatal — see comment above
  }

  return new Response('OK', { status: 200 });
});
