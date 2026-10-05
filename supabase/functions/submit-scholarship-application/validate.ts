// Input rules for the scholarship application, kept apart from index.ts so they
// can be exercised without a server. The client form (src/pages/Scholarship.jsx,
// rules in src/data/scholarship.js) enforces the same limits for quick feedback;
// THIS file is the one that counts. Keep the two in step.

export const STATUS_TYPES = ['student_elsewhere', 'employed', 'self_employed', 'job_seeker', 'other'];

export const NAME_MIN = 2;
export const NAME_MAX = 100;
export const REASON_MIN = 20;
export const REASON_MAX = 500;
export const HOW_HEARD_MIN = 2;
export const HOW_HEARD_MAX = 120;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "+234 906 600 6963", "+234-906-600-6963" and "00234 906 600 6963" all become
// "+2349066006963". Returns null when there is no country code or the digits
// aren't a plausible international number (E.164: up to 15 digits).
export function normalizeWhatsapp(raw) {
  let s = String(raw ?? '').trim();
  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  if (!s.startsWith('+')) return null;
  let digits = s.slice(1).replace(/[\s().-]/g, '');
  // Nigeria is the main audience and "+234 0906…" (the trunk zero left in) is the
  // commonest slip. 234 followed by 0 is never a valid number, so drop the zero.
  digits = digits.replace(/^2340/, '234');
  if (!/^[1-9][0-9]{7,14}$/.test(digits)) return null;
  return `+${digits}`;
}

const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();

// Returns { ok: true, value } with the fields normalised for storage, or
// { ok: false, error } with a message that is safe to show the applicant.
export function validateApplication(body) {
  const fullName = clean(body?.full_name);
  if (fullName.length < NAME_MIN || fullName.length > NAME_MAX) {
    return { ok: false, error: 'Please enter your full name.' };
  }

  const whatsapp = normalizeWhatsapp(body?.whatsapp);
  if (!whatsapp) {
    return { ok: false, error: 'Enter your WhatsApp number with its country code, e.g. +234 906 600 6963.' };
  }

  const email = String(body?.email ?? '').trim().toLowerCase();
  if (email.length < 5 || email.length > 254 || !EMAIL_RE.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }

  const statusType = String(body?.status_type ?? '');
  if (!STATUS_TYPES.includes(statusType)) {
    return { ok: false, error: 'Please choose your current status.' };
  }

  // Keep the applicant's own line breaks in the reason; only trim the ends.
  const reason = String(body?.reason ?? '').trim();
  if (reason.length < REASON_MIN) {
    return { ok: false, error: `Tell us a little more — at least ${REASON_MIN} characters.` };
  }
  if (reason.length > REASON_MAX) {
    return { ok: false, error: `Please keep your answer to ${REASON_MAX} characters or fewer.` };
  }

  const howHeard = clean(body?.how_heard);
  if (howHeard.length < HOW_HEARD_MIN || howHeard.length > HOW_HEARD_MAX) {
    return { ok: false, error: 'Please tell us how you heard about us.' };
  }

  if (body?.consent !== true) {
    return { ok: false, error: 'Please tick the box to confirm you agree.' };
  }

  return {
    ok: true,
    value: {
      full_name: fullName,
      whatsapp,
      email,
      status_type: statusType,
      reason,
      how_heard: howHeard,
    },
  };
}
