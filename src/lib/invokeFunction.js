import { supabase } from './supabaseClient';

// supabase.functions.invoke() reports a request that never completed as a
// FunctionsFetchError ("Failed to send a request to the Edge Function") and a
// gateway hiccup as a FunctionsRelayError. Neither means the function ran or
// failed — the edge logs show every checkout request that reached Supabase
// succeeding — so they're almost always a dropped/slow connection, a mobile
// network blip, or a content blocker. Both checkout functions only open a
// Paystack transaction (nothing is charged until the person pays on Paystack's
// page), so repeating the call is harmless, and retrying turns most of these
// into a non-event.
const RETRY_DELAYS_MS = [700, 1800];

const isTransient = (error) =>
  error?.name === 'FunctionsFetchError' || error?.name === 'FunctionsRelayError';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const NETWORK_ERROR_MESSAGE =
  "We couldn't reach our server. Check your internet connection and try again — if it keeps happening, turn off any ad blocker or VPN for this site.";

export async function invokeWithRetry(name, options) {
  let result;
  for (let attempt = 0; ; attempt += 1) {
    result = await supabase.functions.invoke(name, options);
    if (!isTransient(result.error) || attempt >= RETRY_DELAYS_MS.length) break;
    await sleep(RETRY_DELAYS_MS[attempt]);
  }
  if (isTransient(result.error)) {
    console.error(`${name} unreachable after retries:`, result.error);
    return { data: null, error: new Error(NETWORK_ERROR_MESSAGE) };
  }
  return result;
}
