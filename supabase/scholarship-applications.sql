-- ============================================================
-- AI Agent Mastery scholarship applications (2026-10-05)
--
-- People who are NOT BYU-Pathway students apply at /scholarship and, by default,
-- are approved on submit (SCHOLARSHIP_AUTO_APPROVE; set it to "false" to review
-- each one by hand at /admin/scholarships). At checkout, create-paystack-checkout
-- charges the scholarship price when the signed-in, email-CONFIRMED user's
-- address matches an approved, unredeemed application and the offer hasn't
-- expired; paystack-webhook marks it redeemed once the payment is verified, so
-- each approval is good for one discounted purchase. BYU-Pathway students are
-- unaffected (they never need this form).
--
-- Access model: RLS on with NO policies and no grants to anon/authenticated, so
-- the table is unreachable from the REST API. Inserts come only from the
-- submit-scholarship-application Edge Function (service role); admins read and
-- review through the admin_* RPCs below; a signed-in user can ask only the
-- yes/no question "do I have an offer?" via has_scholarship_offer().
--
-- Apply this BEFORE deploying submit-scholarship-application.
-- ============================================================

create table if not exists public.scholarship_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null
    check (char_length(btrim(full_name)) between 2 and 100),
  -- E.164-style, with country code: +2349066006963. Normalised by the function.
  whatsapp text not null
    check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  email text not null
    check (
      email = lower(email)
      and char_length(email) between 5 and 254
      and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    ),
  status_type text not null
    check (status_type in ('student_elsewhere', 'employed', 'self_employed', 'job_seeker', 'other')),
  reason text not null
    check (char_length(btrim(reason)) between 20 and 500),
  how_heard text not null
    check (char_length(btrim(how_heard)) between 2 and 120),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  -- Set by paystack-webhook after a verified payment. A redeemed application can't
  -- be reviewed again and can't be used for a second discounted checkout.
  redeemed_at timestamptz,
  payment_reference text,
  -- HMAC of the submitter's IP, used only to rate-limit the open form. Not the
  -- address itself, never returned to the admin.
  ip_hash text,
  created_at timestamptz not null default now(),
  constraint scholarship_redeemed_needs_approval
    check (redeemed_at is null or status = 'approved')
);

-- One application per person, case-insensitively (the function also lowercases).
create unique index if not exists scholarship_applications_email_key
  on public.scholarship_applications (lower(email));
create index if not exists scholarship_applications_status_idx
  on public.scholarship_applications (status, created_at desc);
-- Per-IP flood guard in the submit function.
create index if not exists scholarship_applications_ip_idx
  on public.scholarship_applications (ip_hash, created_at)
  where ip_hash is not null;

alter table public.scholarship_applications enable row level security;
revoke all on public.scholarship_applications from anon, authenticated;

-- ---------- admin: list ----------
-- Admin-gated, with the three revoke/grant statements this project requires for
-- any admin_* RPC. ip_hash is deliberately not returned.
create or replace function public.admin_list_scholarship_applications(p_status text default 'all')
returns table (
  id uuid,
  full_name text,
  whatsapp text,
  email text,
  status_type text,
  reason text,
  how_heard text,
  status text,
  reviewed_at timestamptz,
  redeemed_at timestamptz,
  payment_reference text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  if p_status not in ('all', 'pending', 'approved', 'rejected') then
    raise exception 'Invalid status filter';
  end if;

  return query
    select s.id, s.full_name, s.whatsapp, s.email, s.status_type, s.reason, s.how_heard,
           s.status, s.reviewed_at, s.redeemed_at, s.payment_reference, s.created_at
    from scholarship_applications s
    where p_status = 'all' or s.status = p_status
    order by s.created_at desc
    limit 500;
end;
$$;

revoke execute on function public.admin_list_scholarship_applications(text) from public;
revoke execute on function public.admin_list_scholarship_applications(text) from anon;
grant execute on function public.admin_list_scholarship_applications(text) to authenticated;

-- ---------- admin: approve / reject / back to pending ----------
-- A redeemed application is final: the person has already paid the scholarship
-- price, so it can't be flipped.
create or replace function public.admin_review_scholarship(p_id uuid, p_decision text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  if p_decision not in ('approve', 'reject', 'pending') then
    raise exception 'Invalid decision';
  end if;

  update scholarship_applications
     set status = case p_decision when 'approve' then 'approved' when 'reject' then 'rejected' else 'pending' end,
         reviewed_at = case when p_decision = 'pending' then null else now() end
   where id = p_id
     and redeemed_at is null;

  if not found then
    raise exception 'Application not found, or it has already been redeemed';
  end if;
end;
$$;

revoke execute on function public.admin_review_scholarship(uuid, text) from public;
revoke execute on function public.admin_review_scholarship(uuid, text) from anon;
grant execute on function public.admin_review_scholarship(uuid, text) to authenticated;

-- ---------- signed-in user: "do I have an offer?" ----------
-- Display only (the /ai-agent-mastery price card). The price actually charged is
-- decided server-side in create-paystack-checkout from the same rows. Matches on
-- auth.users (the confirmed address), never on the user-writable profiles.email,
-- and answers a bare boolean about the caller's own address only. The expiry
-- lives in an Edge Function secret, so the client applies it separately.
create or replace function public.has_scholarship_offer()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from scholarship_applications s
    join auth.users u on lower(u.email) = s.email
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
      and s.status = 'approved'
      and s.redeemed_at is null
  );
$$;

revoke execute on function public.has_scholarship_offer() from public;
revoke execute on function public.has_scholarship_offer() from anon;
grant execute on function public.has_scholarship_offer() to authenticated;
