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
export const AGENTS_LIVE_PRICE = 10000;
// Access window after the 2 live days (recordings/resources/support) —
// short on purpose, this is a workshop, not a cohort.
export const AGENTS_LIVE_ACCESS_DAYS = 7;
