// Single source of truth for displayed prices — Pricing.jsx, Home.jsx, and
// AIBuilder.jsx all read from here so a price change is a one-line edit,
// not a hunt across pages. Must stay in sync with the webhook's own price
// checks (supabase/functions/paystack-webhook/index.ts PRICES), which is
// the actual source of truth for what gets charged/granted server-side —
// and with create-paystack-checkout's own PRICES constant, which is what
// actually determines the amount sent to Paystack. Also duplicated (not
// imported — a pre-existing drift risk, not introduced by this change) in
// TheOfferSlide.jsx and webinarSlides.js for the live webinar deck.
//
// Repriced 2026-09-22: Builder 1/Builder 2/Pro moved from a ₦25,000/
// ₦25,000/₦45,000 six-month subscription (live cohort + AI Builder
// credits) to permanent, guides-only access — see
// supabase/guide-purchases-setup.sql. Builder 1 and Builder 2 no longer
// share one price (Builder 2, the more advanced track, costs more), so
// there's no single BUILDER_PRICE constant anymore. No anchor/savings
// framing at this price point — a struck-through ₦100,000 next to ₦5,000
// would read as a fabricated 95%-off claim, not a real discount.
export const BUILDER1_PRICE = 5000;
export const BUILDER2_PRICE = 7000;
// A ~17% discount off buying both separately (₦12,000) — enough to make
// "just get Pro" the default for anyone leaning toward wanting both.
export const PRO_PRICE = 10000;

// Vibe Coding bootcamp — a separate live-cohort product, not a tier of the
// builder1/builder2/pro ladder above. Priced independently. Added 2026-09-08,
// repriced from 25000 to 50000 on 2026-09-23.
export const VIBECODING_PRICE = 50000;

// AI Agent Mastery — a new live-cohort product (added 2026-09-22): build a
// personal-assistant agent. Not a tier of the builder1/builder2/pro ladder
// either. Priced independently of Vibe Coding, not at parity with it
// (changed from 25000 to 19999, 2026-09-22).
export const AI_AGENT_MASTERY_PRICE = 19999;

// AI Agents Live — a separate, short-format live workshop (added
// 2026-09-27): 2 days, build a personal AI agent connected to messaging
// tools plus a multi-agent dashboard. NOT the same product as AI Agent
// Mastery above (that's a 6-month, ₦19,999 cohort) — deliberately its own
// page/plan/price so the two are never confused. Same 10000 naira as PRO
// is coincidental, not a collision risk: the webhook/checkout key off the
// distinct plan string ('agentslive'), not the amount alone.
//
// Real seat-based scarcity pricing (founder-confirmed 2026-09-27): the
// first AGENTS_LIVE_SEAT_THRESHOLD paid seats are AGENTS_LIVE_PRICE_EARLY;
// every seat after that is AGENTS_LIVE_PRICE_LATE. This is NOT decorative —
// create-paystack-checkout computes the real charge from the same
// threshold against a live count of granted 'agentslive' payments (via
// agentslive-seat-pricing.sql's agentslive_seats_taken() RPC), and
// paystack-webhook's resolvePlan() accepts both amounts as valid for this
// plan. Keep all three numbers below in sync with those two files — a
// mismatch here just makes the displayed price wrong, but a mismatch there
// makes a real charge get flagged as unrecognized.
export const AGENTS_LIVE_PRICE_EARLY = 10000;
export const AGENTS_LIVE_PRICE_LATE = 15000;
export const AGENTS_LIVE_SEAT_THRESHOLD = 100;
// Kept as the "starting at" price for places that just need one number
// (WhatsApp bot facts, SEO description) — the page itself always shows the
// live, seat-count-derived price instead of this constant.
export const AGENTS_LIVE_PRICE = AGENTS_LIVE_PRICE_EARLY;
// Access window after the 2 live days (recordings/resources/support) —
// short on purpose, this is a workshop, not a cohort.
export const AGENTS_LIVE_ACCESS_DAYS = 7;
// Registration/price-lock deadline: the moment the workshop starts (no
// separate earlier cutoff was set) — 7:00 PM WAT on the cohort_schedule
// 'agentslive' start_date. WAT is UTC+1 with no DST, so this offset is safe
// to hardcode.
export const AGENTS_LIVE_START_HOUR_WAT = '19:00:00+01:00';
