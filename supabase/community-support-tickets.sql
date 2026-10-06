-- Community assistant: support tickets (2026-10-06), on top of
-- community-welcome-bot.sql.
--
-- When a student's community message looks like a request for help, the
-- assistant replies that someone will respond (it never answers the problem
-- itself) and logs a ticket for the admin at /admin/community-bot.
--
-- Separate switch from the welcome: community_bot_settings.support_enabled
-- (default off). The trigger now fires for every message when either switch is
-- on; the community-welcome function decides what, if anything, to do.
-- Deploy order: run this SQL, redeploy the community-welcome function, then
-- the frontend.

alter table public.community_bot_settings
  add column if not exists support_enabled boolean not null default false;

-- ---------- tickets ----------
create table if not exists public.community_support_tickets (
  id uuid primary key default gen_random_uuid(),
  message_id uuid unique references public.community_messages(id) on delete set null,
  channel_id text not null references public.community_channels(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  category text not null default 'other',
  summary text not null default '',
  ack_message_id uuid references public.community_messages(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists community_support_tickets_status_created_idx
  on public.community_support_tickets (status, created_at desc);

alter table public.community_support_tickets enable row level security;
revoke all on public.community_support_tickets from anon, authenticated;

-- ---------- trigger: any message, when either switch is on ----------
create or replace function public.community_welcome_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
begin
  select enabled, support_enabled, bot_user_id into s from public.community_bot_settings where id = 1;
  if not found or not (s.enabled or s.support_enabled) then
    return new;
  end if;
  if s.bot_user_id is not null and new.user_id = s.bot_user_id then
    return new;
  end if;

  begin
    perform net.http_post(
      url := 'https://qkrfpuckvymjpewcszgs.supabase.co/functions/v1/community-welcome',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := jsonb_build_object('record', jsonb_build_object(
        'id', new.id, 'channel_id', new.channel_id, 'user_id', new.user_id, 'body', new.body
      ))
    );
  exception when others then
    null;
  end;
  return new;
end;
$$;

-- ---------- admin: settings + stats (replaces the welcome-only versions) ----------
drop function if exists public.admin_get_community_bot();
drop function if exists public.admin_set_community_bot(boolean, text);

create or replace function public.admin_get_community_bot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  select jsonb_build_object(
    'enabled', s.enabled,
    'support_enabled', s.support_enabled,
    'extra_instructions', s.extra_instructions,
    'bot_ready', s.bot_user_id is not null,
    'total_welcomes', (select count(*) from community_welcomes),
    'open_tickets', (select count(*) from community_support_tickets where status = 'open'),
    'recent', coalesce((
      select jsonb_agg(r order by r.created_at desc) from (
        select w.created_at, w.channel_id,
               coalesce(nullif(trim(p.display_name), ''), split_part(p.email, '@', 1)) as student
        from community_welcomes w
        left join profiles p on p.id = w.user_id
        order by w.created_at desc
        limit 15
      ) r
    ), '[]'::jsonb)
  ) into result
  from community_bot_settings s where s.id = 1;

  return result;
end;
$$;

revoke execute on function public.admin_get_community_bot() from public;
revoke execute on function public.admin_get_community_bot() from anon;
grant execute on function public.admin_get_community_bot() to authenticated;

create or replace function public.admin_set_community_bot(p_enabled boolean, p_support_enabled boolean, p_instructions text)
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

  update community_bot_settings
  set enabled = coalesce(p_enabled, false),
      support_enabled = coalesce(p_support_enabled, false),
      extra_instructions = left(coalesce(p_instructions, ''), 1000),
      updated_at = now()
  where id = 1;
end;
$$;

revoke execute on function public.admin_set_community_bot(boolean, boolean, text) from public;
revoke execute on function public.admin_set_community_bot(boolean, boolean, text) from anon;
grant execute on function public.admin_set_community_bot(boolean, boolean, text) to authenticated;

-- ---------- admin: tickets ----------
create or replace function public.admin_list_community_tickets(p_status text default 'open')
returns table (
  id uuid,
  channel_id text,
  channel_name text,
  student_name text,
  student_email text,
  body text,
  category text,
  summary text,
  status text,
  created_at timestamptz,
  resolved_at timestamptz
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

  return query
  select t.id, t.channel_id, c.name,
         coalesce(nullif(trim(p.display_name), ''), split_part(p.email, '@', 1)),
         p.email, t.body, t.category, t.summary, t.status, t.created_at, t.resolved_at
  from community_support_tickets t
  left join community_channels c on c.id = t.channel_id
  left join profiles p on p.id = t.user_id
  where p_status = 'all' or t.status = p_status
  order by t.created_at desc
  limit 100;
end;
$$;

revoke execute on function public.admin_list_community_tickets(text) from public;
revoke execute on function public.admin_list_community_tickets(text) from anon;
grant execute on function public.admin_list_community_tickets(text) to authenticated;

create or replace function public.admin_set_community_ticket_status(p_id uuid, p_status text)
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
  if p_status not in ('open', 'resolved') then
    raise exception 'Invalid status';
  end if;

  update community_support_tickets
  set status = p_status,
      resolved_at = case when p_status = 'resolved' then now() else null end
  where id = p_id;
end;
$$;

revoke execute on function public.admin_set_community_ticket_status(uuid, text) from public;
revoke execute on function public.admin_set_community_ticket_status(uuid, text) from anon;
grant execute on function public.admin_set_community_ticket_status(uuid, text) to authenticated;
