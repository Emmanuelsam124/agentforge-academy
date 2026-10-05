import { invokeWithRetry } from './invokeFunction';

// Thin client for submit-scholarship-application. Resolves to { ok: true }, or
// { ok: false, closed, message } — never throws, so the form deals with one shape.
// supabase-js reports a non-2xx reply as a generic "non-2xx status" error; the
// real, user-safe reason is in the response body.
export async function submitScholarshipApplication(body) {
  const { error } = await invokeWithRetry('submit-scholarship-application', { body });
  if (!error) return { ok: true };

  let message = error.message;
  let closed = false;
  try {
    const parsed = await error.context?.clone().json();
    if (parsed?.error) message = parsed.error;
    closed = parsed?.code === 'closed';
  } catch {
    // keep the generic message (a network error has no response body)
  }
  return { ok: false, closed, message: message || 'Something went wrong. Please try again.' };
}
