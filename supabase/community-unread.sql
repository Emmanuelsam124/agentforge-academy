-- Tracks, per user per room, the last time they looked at it — powers a
-- real "you have new messages" indicator (not a decorative bell; see
-- DashboardTopBar.jsx's own note on why this dashboard doesn't ship fake
-- notification UI).

create table if not exists public.community_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_id text not null references public.community_channels(id),
  last_read_at timestamptz not null default now(),
  primary key (user_id, channel_id)
);

alter table public.community_reads enable row level security;

-- No insert/update policy on purpose — the only writer is
-- community_mark_channel_read() below (SECURITY DEFINER, bypasses RLS), so
-- a client can't write an arbitrary last_read_at directly via the REST API.
drop policy if exists "community_reads_select_own" on public.community_reads;
create policy "community_reads_select_own"
  on public.community_reads for select
  to authenticated
  using (user_id = auth.uid());

-- Any room with a message newer than this user's last_read_at for it (or no
-- read record at all) counts as unread. Excludes the caller's own messages
-- — sending one shouldn't light up your own badge.
create or replace function public.community_has_unread()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_channels c
    where public.has_community_membership(auth.uid(), c.id)
      and exists (
        select 1 from public.community_messages m
        where m.channel_id = c.id
          and m.user_id <> auth.uid()
          and m.created_at > coalesce(
            (select r.last_read_at from public.community_reads r
             where r.user_id = auth.uid() and r.channel_id = c.id),
            '-infinity'::timestamptz
          )
      )
  );
$$;

revoke execute on function public.community_has_unread() from public;
revoke execute on function public.community_has_unread() from anon;
grant  execute on function public.community_has_unread() to authenticated;

create or replace function public.community_mark_channel_read(p_channel_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_community_membership(auth.uid(), p_channel_id) then
    raise exception 'Not a member of this channel';
  end if;

  insert into public.community_reads (user_id, channel_id, last_read_at)
  values (auth.uid(), p_channel_id, now())
  on conflict (user_id, channel_id) do update set last_read_at = excluded.last_read_at;
end;
$$;

revoke execute on function public.community_mark_channel_read(text) from public;
revoke execute on function public.community_mark_channel_read(text) from anon;
grant  execute on function public.community_mark_channel_read(text) to authenticated;

-- Realtime on the reads table too — this is what lets the nav badge clear
-- itself the instant a room is marked read, in any tab/device, without a
-- shared React context between the sidebar and the Community page.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_reads'
  ) then
    alter publication supabase_realtime add table public.community_reads;
  end if;
end $$;
