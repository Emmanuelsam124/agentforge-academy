import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Neutralized deliberately — this function used to create accounts via the
// admin API with email_confirm:true, bypassing Supabase Auth's own signup
// confirmation email. That was a temporary fix for Auth's SMTP being broken
// (see CLAUDE.md). SMTP is now confirmed working and AuthContext.jsx has
// reverted to the real supabase.auth.signUp() confirmation-email flow, so
// this endpoint has no legitimate caller left — left deployed-but-inert
// (same pattern as the retired flutterwave-webhook/lemonsqueezy-webhook
// functions) rather than left fully functional and reachable by anyone who
// finds the URL, since it would otherwise still let someone skip email
// verification entirely.
serve(async () => {
  return new Response(JSON.stringify({ error: 'This endpoint has been retired.' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' },
  });
});
