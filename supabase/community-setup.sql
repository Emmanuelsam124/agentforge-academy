-- Student community: one "General" room for anyone who has ever bought
-- anything, plus one room per product (matching the same tiers usePro.js
-- and guide_purchases already track). Text + emoji only — there is no
-- attachment/upload path anywhere in this feature, so "no images or
-- videos" is enforced by simply never building one, not by content
-- filtering.

create table if not exists public.community_channels (
  id text primary key,
  name text not null,
  description text not null default '',
  sort_order int not null default 0
);

insert into public.community_channels (id, name, description, sort_order) values
  ('general', 'General', 'For everyone who has ever bought a class here.', 0),
  ('builder1', 'Builder 1', 'For Builder 1 (and Pro) students.', 1),
  ('builder2', 'Builder 2', 'For Builder 2 (and Pro) students.', 2),
  ('vibecoding', 'Vibe Coding', 'For Vibe Coding Bootcamp students.', 3),
  ('aimastery', 'AI Agent Mastery', 'For AI Agent Mastery students.', 4),
  ('agentslive', 'AI Agents Live', 'For AI Agents Live students.', 5)
on conflict (id) do nothing;

alter table public.community_channels enable row level security;

drop policy if exists "community_channels_select_authenticated" on public.community_channels;
create policy "community_channels_select_authenticated"
  on public.community_channels for select
  to authenticated
  using (true);

-- Messages ---------------------------------------------------------------

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id text not null references public.community_channels(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  reply_to_id uuid references public.community_messages(id) on delete set null,
  mentioned_user_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint community_messages_body_length check (char_length(body) between 1 and 1000)
);

create index if not exists community_messages_channel_created_idx
  on public.community_messages (channel_id, created_at);

alter table public.community_messages enable row level security;

-- Membership ---------------------------------------------------------------
-- Permanent once granted (mirrors guide_purchases being a permanent grant,
-- not tied to whether a live cohort's access window has since expired) —
-- this is a class community, not a paywall, so "ever bought builder2"
-- keeps you in the builder2 room even after the cohort itself is long
-- over. is_admin bypasses every channel, same convention as course_content.

create or replace function public.has_community_membership(p_user_id uuid, p_channel_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (select 1 from entitlements e where e.user_id = p_user_id and e.is_admin = true)
    or case p_channel_id
      when 'builder1' then
        exists (select 1 from guide_purchases g where g.user_id = p_user_id and g.tier = 'builder1')
        or exists (select 1 from entitlements e where e.user_id = p_user_id and e.builder1_expires_at is not null)
      when 'builder2' then
        exists (select 1 from guide_purchases g where g.user_id = p_user_id and g.tier = 'builder2')
        or exists (select 1 from entitlements e where e.user_id = p_user_id and e.builder2_expires_at is not null)
      when 'vibecoding' then
        exists (select 1 from entitlements e where e.user_id = p_user_id and e.vibecoding_expires_at is not null)
      when 'aimastery' then
        exists (select 1 from entitlements e where e.user_id = p_user_id and e.aimastery_expires_at is not null)
      when 'agentslive' then
        exists (select 1 from entitlements e where e.user_id = p_user_id and e.agentslive_expires_at is not null)
      when 'general' then
        exists (select 1 from guide_purchases g where g.user_id = p_user_id)
        or exists (
          select 1 from entitlements e
          where e.user_id = p_user_id
            and (e.builder1_expires_at is not null or e.builder2_expires_at is not null
                 or e.vibecoding_expires_at is not null or e.aimastery_expires_at is not null
                 or e.agentslive_expires_at is not null)
        )
      else false
    end;
$$;

revoke execute on function public.has_community_membership(uuid, text) from public;
revoke execute on function public.has_community_membership(uuid, text) from anon;
grant  execute on function public.has_community_membership(uuid, text) to authenticated;

-- RLS ---------------------------------------------------------------

drop policy if exists "community_messages_select" on public.community_messages;
create policy "community_messages_select"
  on public.community_messages for select
  to authenticated
  using (public.has_community_membership(auth.uid(), channel_id));

drop policy if exists "community_messages_insert" on public.community_messages;
create policy "community_messages_insert"
  on public.community_messages for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.has_community_membership(auth.uid(), channel_id)
    and (
      reply_to_id is null
      or exists (
        select 1 from public.community_messages parent
        where parent.id = community_messages.reply_to_id
          and parent.channel_id = community_messages.channel_id
      )
    )
  );

-- Self-delete + admin delete-any — public user content on a live product
-- needs at least this much moderation from day one.
drop policy if exists "community_messages_delete" on public.community_messages;
create policy "community_messages_delete"
  on public.community_messages for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from entitlements e where e.user_id = auth.uid() and e.is_admin = true)
  );

-- Member lookup (author names + @mention autocomplete) ---------------------
-- Scoped to callers who are themselves a member of the channel — this is
-- not a general user directory, only "who else is in this room".

create or replace function public.community_channel_members(p_channel_id text)
returns table(user_id uuid, display_name text, handle text)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    coalesce(nullif(trim(p.display_name), ''), split_part(p.email, '@', 1)),
    regexp_replace(lower(split_part(p.email, '@', 1)), '[^a-z0-9_]', '', 'g')
  from profiles p
  where public.has_community_membership(auth.uid(), p_channel_id)
    and public.has_community_membership(p.id, p_channel_id)
$$;

revoke execute on function public.community_channel_members(text) from public;
revoke execute on function public.community_channel_members(text) from anon;
grant  execute on function public.community_channel_members(text) to authenticated;

-- Accessible-channel list ---------------------------------------------------

create or replace function public.my_community_channels()
returns setof public.community_channels
language sql
stable
security definer
set search_path = public
as $$
  select c.* from public.community_channels c
  where public.has_community_membership(auth.uid(), c.id)
  order by c.sort_order;
$$;

revoke execute on function public.my_community_channels() from public;
revoke execute on function public.my_community_channels() from anon;
grant  execute on function public.my_community_channels() to authenticated;

-- Realtime -------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_messages'
  ) then
    alter publication supabase_realtime add table public.community_messages;
  end if;
end $$;
