-- Scholarship admin page: show whether an applicant has an account and whether
-- they are actually enrolled in AI Agent Mastery (2026-10-06).
--
-- "redeemed" only says they paid the scholarship price. Someone approved who then
-- paid the full price, or was enrolled by hand, is also enrolled, so enrollment is
-- read from entitlements (aimastery_expires_at set) by the account whose confirmed
-- login email matches the application email (auth.users.email, never profiles.email).

drop function if exists public.admin_list_scholarship_applications(text);

create function public.admin_list_scholarship_applications(p_status text default 'all')
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
  approval_email_sent_at timestamptz,
  created_at timestamptz,
  has_account boolean,
  enrolled boolean
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
           s.status, s.reviewed_at, s.redeemed_at, s.payment_reference,
           s.approval_email_sent_at, s.created_at,
           u.id is not null,
           coalesce(e.aimastery_expires_at is not null, false)
    from scholarship_applications s
    left join auth.users u on lower(u.email) = s.email and u.email_confirmed_at is not null
    left join entitlements e on e.user_id = u.id
    where p_status = 'all' or s.status = p_status
    order by s.created_at desc
    limit 500;
end;
$$;

revoke execute on function public.admin_list_scholarship_applications(text) from public;
revoke execute on function public.admin_list_scholarship_applications(text) from anon;
grant execute on function public.admin_list_scholarship_applications(text) to authenticated;
