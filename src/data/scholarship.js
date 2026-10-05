// AI Agent Mastery scholarship application (non-BYU-Pathway applicants) —
// display-side settings and form rules. The SERVER decides everything that
// matters: the deadline is enforced by submit-scholarship-application
// (SCHOLARSHIP_CLOSES_AT secret) and the price/expiry by create-paystack-checkout
// and paystack-webhook (SCHOLARSHIP_PRICE_NAIRA / SCHOLARSHIP_EXPIRES_AT secrets).
// These constants only pick which page/copy to render, so if you change a secret,
// change the matching VITE_ value (or the default below) too — the same "keep in
// step" arrangement as AI_AGENT_MASTERY_STUDENT_PRICE.

const toNumber = (value, fallback) => {
  const n = Number(String(value ?? '').trim());
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
const toTime = (value, fallback) => {
  const t = Date.parse(String(value ?? '').trim());
  return Number.isFinite(t) ? t : Date.parse(fallback);
};

// Thu 8 Oct 2026, 8:00 PM WAT — the form stops accepting applications.
export const SCHOLARSHIP_CLOSES_AT = toTime(import.meta.env.VITE_SCHOLARSHIP_CLOSES_AT, '2026-10-08T20:00:00+01:00');

export const SCHOLARSHIP_PRICE_NAIRA = toNumber(import.meta.env.VITE_SCHOLARSHIP_PRICE_NAIRA, 10000);
// Fri 9 Oct 2026, 7:00 PM WAT — class starts; approved offers lapse.
export const SCHOLARSHIP_EXPIRES_AT = toTime(import.meta.env.VITE_SCHOLARSHIP_EXPIRES_AT, '2026-10-09T19:00:00+01:00');

export const isScholarshipOpen = (now = Date.now()) => now < SCHOLARSHIP_CLOSES_AT;
export const isScholarshipOfferLive = (now = Date.now()) => now < SCHOLARSHIP_EXPIRES_AT;

// "Thu 8 October, 8:00 PM WAT"
export const formatWatDateTime = (ms) =>
  new Date(ms)
    .toLocaleString('en-GB', {
      timeZone: 'Africa/Lagos',
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .replace(',', '')
    .replace(/ at /, ', ')
    .replace(/\b(am|pm)\b/, (s) => s.toUpperCase()) + ' WAT';

export const STATUS_TYPE_OPTIONS = [
  { value: 'student_elsewhere', label: 'Student (at another school)' },
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'job_seeker', label: 'Job seeker' },
  { value: 'other', label: 'Other' },
];
export const statusTypeLabel = (value) => STATUS_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;

// Same limits as supabase/functions/submit-scholarship-application/validate.ts.
export const NAME_MIN = 2;
export const NAME_MAX = 100;
export const REASON_MIN = 20;
export const REASON_MAX = 500;
export const HOW_HEARD_MIN = 2;
export const HOW_HEARD_MAX = 120;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "+234 906 600 6963" / "00234…" -> "+2349066006963"; null without a country code.
export function normalizeWhatsapp(raw) {
  let s = String(raw ?? '').trim();
  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  if (!s.startsWith('+')) return null;
  let digits = s.slice(1).replace(/[\s().-]/g, '');
  digits = digits.replace(/^2340/, '234'); // "+234 0906…": drop the stray trunk zero
  if (!/^[1-9][0-9]{7,14}$/.test(digits)) return null;
  return `+${digits}`;
}

const collapse = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();

// Returns { field: message } for every problem; {} means the form is valid.
export function validateScholarshipForm(f) {
  const errors = {};
  const name = collapse(f.full_name);
  if (name.length < NAME_MIN || name.length > NAME_MAX) errors.full_name = 'Please enter your full name.';
  if (!normalizeWhatsapp(f.whatsapp)) errors.whatsapp = 'Include your country code, e.g. +234 906 600 6963.';
  const email = String(f.email ?? '').trim();
  if (email.length < 5 || email.length > 254 || !EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';
  if (!STATUS_TYPE_OPTIONS.some((o) => o.value === f.status_type)) errors.status_type = 'Please choose your current status.';
  const reason = String(f.reason ?? '').trim();
  if (reason.length < REASON_MIN) errors.reason = `Tell us a little more — at least ${REASON_MIN} characters.`;
  else if (reason.length > REASON_MAX) errors.reason = `Please keep it to ${REASON_MAX} characters or fewer.`;
  const heard = collapse(f.how_heard);
  if (heard.length < HOW_HEARD_MIN || heard.length > HOW_HEARD_MAX) errors.how_heard = 'Please tell us how you heard about us.';
  if (f.consent !== true) errors.consent = 'Please tick the box to confirm you agree.';
  return errors;
}

// wa.me link an admin opens to message an applicant.
export function scholarshipWhatsappUrl(application) {
  const digits = String(application.whatsapp ?? '').replace(/\D/g, '');
  const firstName = collapse(application.full_name).split(' ')[0] || 'there';
  const text = `Hi ${firstName}, this is Social Dev Technologies about your AI Agent Mastery scholarship application.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
