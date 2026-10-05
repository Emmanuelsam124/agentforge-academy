-- ============================================================
-- Scholarship approval emails (2026-10-05)
--
-- When an admin approves an application at /admin/scholarships, the page calls
-- the send-scholarship-approval-email Edge Function, which emails the applicant
-- and stamps approval_email_sent_at here. The stamp is both the "already sent"
-- guard (a double-click can't email twice) and what the admin page shows.
--
-- Apply BEFORE deploying send-scholarship-approval-email. Idempotent.
-- ============================================================

alter table public.scholarship_applications
  add column if not exists approval_email_sent_at timestamptz;

-- The admin list now also returns approval_email_sent_at. A function's return
-- type can't be changed in place, so drop and recreate it, then repeat the
-- three revoke/grant statements this project requires for any admin_* RPC.
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
           s.status, s.reviewed_at, s.redeemed_at, s.payment_reference,
           s.approval_email_sent_at, s.created_at
    from scholarship_applications s
    where p_status = 'all' or s.status = p_status
    order by s.created_at desc
    limit 500;
end;
$$;

revoke execute on function public.admin_list_scholarship_applications(text) from public;
revoke execute on function public.admin_list_scholarship_applications(text) from anon;
grant execute on function public.admin_list_scholarship_applications(text) to authenticated;
