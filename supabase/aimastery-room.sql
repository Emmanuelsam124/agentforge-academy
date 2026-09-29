-- AI Agent Mastery join room (2026-09-29). One row holding the Zoom room URL
-- and an on/off switch for the "Join class" buttons on
-- /ai-agent-mastery/course. Kept in a table (not in the JS bundle) because the
-- URL carries the meeting passcode; RLS limits reads to enrolled students and
-- admins, and anon has no privileges at all. The seed URL was copied from the
-- Builder 1 sessions' room server-side.
--
-- To open the buttons:  update public.aimastery_room set join_enabled = true, updated_at = now() where id = 1;
-- To close them again:  ... set join_enabled = false ...
-- To point at another room: update ... set join_link = '<url>' ...
create table public.aimastery_room (
  id int primary key check (id = 1),
  join_link text,
  join_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.aimastery_room enable row level security;
revoke all on public.aimastery_room from public, anon, authenticated;
grant select on public.aimastery_room to authenticated;
create policy "AI Agent Mastery room link: entitled students or admin"
  on public.aimastery_room for select to authenticated
  using (
    exists (select 1 from public.entitlements e where e.user_id = auth.uid() and e.is_admin = true)
    or exists (select 1 from public.entitlements e where e.user_id = auth.uid() and e.aimastery_expires_at is not null and e.aimastery_expires_at > now())
  );
-- insert into public.aimastery_room (id, join_link, join_enabled) values (1, '<zoom url>', false);
