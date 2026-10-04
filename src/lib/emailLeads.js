import { invokeWithRetry } from './invokeFunction';

// Thin client for the email-leads Edge Function (supabase/functions/email-leads).
// Resolves to { ok: true } or { ok: false, message } — never throws, so callers
// only deal with one shape. supabase-js reports a non-2xx reply as a generic
// "non-2xx status" error; the real, user-safe reason is in the response body.
export async function callEmailLeads(body) {
  const { data, error } = await invokeWithRetry('email-leads', { body });
  if (!error) return { ok: true, data };

  let message = error.message;
  try {
    const parsed = await error.context?.clone().json();
    if (parsed?.error) message = parsed.error;
  } catch {
    // keep the generic message (a network error has no response body)
  }
  return { ok: false, message: message || 'Something went wrong. Please try again.' };
}
