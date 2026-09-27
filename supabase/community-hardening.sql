-- Community hardening — tightened before the feature's first merge (not a
-- fix for a live incident, just closing gaps before this goes out).

-- 1. Reject blank-looking messages. The original check counted raw chars,
--    so a body of all spaces (or newlines) still passed char_length >= 1.
alter table public.community_messages drop constraint if exists community_messages_body_length;
alter table public.community_messages add constraint community_messages_body_length
  check (char_length(trim(body)) between 1 and 1000);

-- 2. Cap how many people one message can @mention. No notification consumer
--    reads this yet, but there's no reason to allow an unbounded array
--    either — plain abuse-prevention against a future feature depending on it.
alter table public.community_messages drop constraint if exists community_messages_mention_limit;
alter table public.community_messages add constraint community_messages_mention_limit
  check (array_length(mentioned_user_ids, 1) is null or array_length(mentioned_user_ids, 1) <= 20);

-- 3. Insert policy: mentions must resolve to actual members of the same
--    room. A client could otherwise tag arbitrary user ids unrelated to
--    this channel — harmless today with nothing reading the column, but
--    wrong to allow silently once something does.
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
    and (
      mentioned_user_ids = '{}'
      or not exists (
        select 1 from unnest(mentioned_user_ids) as uid
        where not public.has_community_membership(uid, community_messages.channel_id)
      )
    )
  );

-- 4. Flood guard, enforced in Postgres rather than trusted to client-side
--    debouncing (trivially bypassed by anything scripting the REST API
--    directly): no more than 20 messages per user per rolling 60 seconds,
--    across every room. Generous for a real conversation, enough to stop a
--    scripted flood.
create or replace function public.community_enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count int;
begin
  select count(*) into recent_count
  from public.community_messages m
  where m.user_id = new.user_id
    and m.created_at > now() - interval '60 seconds';

  if recent_count >= 20 then
    raise exception 'You are sending messages too quickly — wait a moment and try again.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke execute on function public.community_enforce_rate_limit() from public;
revoke execute on function public.community_enforce_rate_limit() from anon;
revoke execute on function public.community_enforce_rate_limit() from authenticated;

drop trigger if exists community_messages_rate_limit on public.community_messages;
create trigger community_messages_rate_limit
  before insert on public.community_messages
  for each row execute function public.community_enforce_rate_limit();
