-- Community welcome assistant (2026-10-06).
--
-- When a student posts their FIRST message in a community room, Gemini replies
-- with a short welcome / encouragement as a dedicated "Social Dev Assistant"
-- account. It never answers questions in general — only that first-message
-- welcome, once per student per room (community_welcomes is the dedupe claim).
--
-- Flow: AFTER INSERT trigger on community_messages -> pg_net POST to the
-- community-welcome Edge Function (same x-cron-secret Vault entry the other
-- trigger-called functions use) -> the function re-checks everything, asks
-- Gemini, and inserts the reply with the service role.
--
-- Ships DISABLED (enabled = false). An admin turns it on at /admin/community-bot.
-- Deploy order: run this SQL, deploy the community-welcome function
-- (verify_jwt = false), then the frontend.

-- ---------- settings (one row) ----------
create table if not exists public.community_bot_settings (
  id int primary key default 1 check (id = 1),
  enabled boolean not null default false,
  bot_user_id uuid references auth.users(id) on delete set null,
  extra_instructions text not null default '' check (char_length(extra_instructions) <= 1000),
  updated_at timestamptz not null default now()
);
insert into public.community_bot_settings (id) values (1) on conflict (id) do nothing;

alter table public.community_bot_settings enable row level security;
revoke all on public.community_bot_settings from anon, authenticated;

-- ---------- one welcome per student per room ----------
create table if not exists public.community_welcomes (
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_id text not null references public.community_channels(id),
  message_id uuid references public.community_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, channel_id)
);

alter table public.community_welcomes enable row level security;
revoke all on public.community_welcomes from anon, authenticated;

-- ---------- trigger: first message in a room -> call the function ----------
-- Never blocks or fails the student's message: any error here is swallowed.
create or replace function public.community_welcome_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
begin
  select enabled, bot_user_id into s from public.community_bot_settings where id = 1;
  if not found or not s.enabled then
    return new;
  end if;
  if s.bot_user_id is not null and new.user_id = s.bot_user_id then
    return new;
  end if;
  -- Only the very first message this person has posted in this room.
  if (select count(*) from public.community_messages m
      where m.user_id = new.user_id and m.channel_id = new.channel_id) > 1 then
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

revoke execute on function public.community_welcome_trigger() from public;
revoke execute on function public.community_welcome_trigger() from anon;
revoke execute on function public.community_welcome_trigger() from authenticated;

drop trigger if exists community_messages_welcome on public.community_messages;
create trigger community_messages_welcome
  after insert on public.community_messages
  for each row execute function public.community_welcome_trigger();

-- ---------- admin: read settings + recent welcomes ----------
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
    'extra_instructions', s.extra_instructions,
    'bot_ready', s.bot_user_id is not null,
    'total_welcomes', (select count(*) from community_welcomes),
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

-- ---------- admin: turn on/off + extra guidance ----------
create or replace function public.admin_set_community_bot(p_enabled boolean, p_instructions text)
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
      extra_instructions = left(coalesce(p_instructions, ''), 1000),
      updated_at = now()
  where id = 1;
end;
$$;

revoke execute on function public.admin_set_community_bot(boolean, text) from public;
revoke execute on function public.admin_set_community_bot(boolean, text) from anon;
grant execute on function public.admin_set_community_bot(boolean, text) to authenticated;
