-- ============================================================
-- AI News section — bot-drafted, admin-reviewed articles + student digest.
-- Covers: news_sources, news_articles tables; admin review-queue RPCs;
-- service_insert_news_draft (bot write path); admin_send_news_digest
-- (claims the day's approved batch for the send-news-digest function);
-- the daily generate-news-digest cron. Mirrors this session's established
-- conventions (notifications-system-setup.sql, admin-setup.sql): RLS-gated
-- public table, SECURITY DEFINER admin RPCs with the inline
-- entitlements.is_admin check, service-role-only RPC for the bot's insert
-- path, explicit revoke/grant pairs.
-- ============================================================

-- 1. news_sources — admin-configurable list of feeds the daily bot reads.
--    A DB row per source (not a hardcoded list in the Edge Function) so a
--    broken/changed feed URL is a one-row fix, not a redeploy.
create table if not exists public.news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  feed_url text not null,
  -- 'rss' — feed_url is a real RSS/Atom feed, parsed as XML.
  -- 'html' — feed_url is a regular page with no feed; fetched as HTML and
  --   handed to the LLM directly to extract headlines/summaries from.
  source_type text not null default 'rss' check (source_type in ('rss', 'html')),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.news_sources enable row level security;
-- No policies — internal-only, read via the service role from the daily
-- Edge Function. Same lockdown shape as `email_log`/`email_settings`.

insert into public.news_sources (name, feed_url, source_type, enabled) values
  ('OpenAI', 'https://openai.com/news/rss.xml', 'rss', true),
  ('Anthropic', 'https://www.anthropic.com/news', 'html', true),
  ('Google DeepMind', 'https://deepmind.google/blog/rss.xml', 'rss', true),
  ('TechCrunch AI', 'https://techcrunch.com/category/artificial-intelligence/feed/', 'rss', true),
  -- Note the segment order: /rss/<section>/index.xml, NOT
  -- /<section>/rss/index.xml. The swapped form 404s silently — fetchSource
  -- logs it and returns [], so the run still "succeeds" with one fewer
  -- source. Cost us this feed for an unknown stretch before 2026-08-24.
  ('The Verge AI', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', 'rss', true),
  ('Ars Technica', 'https://arstechnica.com/feed/', 'rss', true),
  ('VentureBeat AI', 'https://venturebeat.com/category/ai/feed/', 'rss', true),
  ('Hacker News (AI)', 'https://hnrss.org/newest?q=AI', 'rss', true),
  -- Seeded disabled as of 2026-08-24. The feed is alive, but it 403s any
  -- request whose User-Agent identifies itself as a bot; the same URL
  -- returns 200 to a browser UA. Left in place, disabled, rather than
  -- spoofing a browser to get around a block the publisher set
  -- deliberately. Re-enable only if someone decides that's acceptable.
  ('AI News', 'https://www.artificialintelligence-news.com/feed/', 'rss', false),
  ('AI Magazine', 'https://aimagazine.com', 'html', true),
  ('MIT Technology Review (AI)', 'https://www.technologyreview.com/topic/artificial-intelligence/feed', 'rss', true)
on conflict do nothing;

-- 2. news_articles — one row per drafted item, whether it ends up as a
--    full public article or a digest-only blurb.
create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  dek text not null,                                -- one-sentence summary — meta description + digest blurb text
  body_blocks jsonb not null default '[]'::jsonb,    -- [{type:'paragraph'|'heading'|'quote',text}|{type:'list',items:[...]}]
  is_full_article boolean not null default false,    -- false = digest-only blurb, no public /news/:slug page
  source_name text not null,
  source_url text not null,                          -- citation link — never full-text reproduction
  department_ids text[] not null default '{}',       -- matches src/data/departments.js ids
  related_agent_slug text,                           -- nullable — "no link" is a valid, common outcome
  related_agent_tier text check (related_agent_tier in ('builder1', 'builder2')),
  image_url text,
  author text not null default 'Social Dev Technologies',
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected')),
  digest_date date not null default current_date,    -- which day's bot run produced this
  digest_sent_at timestamptz,                         -- set when the manual "send digest" claims this batch
  published_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.news_articles enable row level security;

create policy "Published articles are public"
  on public.news_articles for select
  using (status = 'approved');
-- No client insert/update/delete policy — the bot writes via the
-- service-role-only RPC below, admins write via the admin_* RPCs. Same
-- lockdown shape as `entitlements` / `notifications`.

create index if not exists news_articles_status_idx on public.news_articles (status, digest_date);
create index if not exists news_articles_published_idx on public.news_articles (published_at desc) where status = 'approved';

-- 3. admin_list_news_drafts — feeds the review queue.
create or replace function public.admin_list_news_drafts(p_status text default 'pending_review')
returns setof public.news_articles
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
    select * from news_articles na
    where na.status = p_status
    order by na.created_at desc;
end;
$$;

-- 4. admin_update_news_article — edit-in-place before approving. Bot drafts
--    need occasional correction; this is the one gap vs. the testimonials
--    moderation pattern (which only toggles flags, never edits content).
create or replace function public.admin_update_news_article(
  p_id uuid,
  p_title text,
  p_dek text,
  p_body_blocks jsonb,
  p_department_ids text[],
  p_related_agent_slug text default null,
  p_related_agent_tier text default null,
  p_image_url text default null
)
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

  update news_articles
  set
    title = p_title,
    dek = p_dek,
    body_blocks = p_body_blocks,
    department_ids = p_department_ids,
    related_agent_slug = p_related_agent_slug,
    related_agent_tier = p_related_agent_tier,
    image_url = coalesce(p_image_url, image_url)
  where id = p_id;
end;
$$;

-- 5. admin_set_news_article_status — approve/reject. Approving sets
--    published_at, which is what actually makes the RLS select policy
--    above start returning the row to the public.
create or replace function public.admin_set_news_article_status(p_id uuid, p_status text)
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

  if p_status not in ('approved', 'rejected', 'pending_review') then
    raise exception 'Invalid status';
  end if;

  update news_articles
  set
    status = p_status,
    published_at = case when p_status = 'approved' then now() else published_at end
  where id = p_id;
end;
$$;

-- 6. admin_delete_news_article
create or replace function public.admin_delete_news_article(p_id uuid)
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

  delete from news_articles where id = p_id;
end;
$$;

-- 7. admin_send_news_digest — atomically claims the approved, not-yet-sent
--    batch for a given day. The RPC only claims (marks digest_sent_at); the
--    actual notification/email I/O happens in the send-news-digest Edge
--    Function, which calls this first and then sends whatever it returns.
create or replace function public.admin_send_news_digest(p_date date)
returns setof public.news_articles
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
    update news_articles
    set digest_sent_at = now()
    where status = 'approved' and digest_date = p_date and digest_sent_at is null
    returning *;
end;
$$;

-- 8. service_insert_news_draft — service-role only, used by the daily
--    generate-news-digest Edge Function to write drafts. No auth.uid()
--    check — same reasoning as service_get_class_reminder_candidates in
--    notifications-system-setup.sql: invoked with the service-role key, a
--    trusted server context with no end-user JWT.
create or replace function public.service_insert_news_draft(
  p_slug text,
  p_title text,
  p_dek text,
  p_body_blocks jsonb,
  p_is_full_article boolean,
  p_source_name text,
  p_source_url text,
  p_department_ids text[],
  p_related_agent_slug text,
  p_related_agent_tier text,
  p_image_url text,
  p_digest_date date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into news_articles (
    slug, title, dek, body_blocks, is_full_article, source_name, source_url,
    department_ids, related_agent_slug, related_agent_tier, image_url, digest_date
  ) values (
    p_slug, p_title, p_dek, p_body_blocks, p_is_full_article, p_source_name, p_source_url,
    p_department_ids, p_related_agent_slug, p_related_agent_tier, p_image_url, p_digest_date
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.admin_list_news_drafts(text) from anon, public;
grant execute on function public.admin_list_news_drafts(text) to authenticated;

revoke execute on function public.admin_update_news_article(uuid, text, text, jsonb, text[], text, text, text) from anon, public;
grant execute on function public.admin_update_news_article(uuid, text, text, jsonb, text[], text, text, text) to authenticated;

revoke execute on function public.admin_set_news_article_status(uuid, text) from anon, public;
grant execute on function public.admin_set_news_article_status(uuid, text) to authenticated;

revoke execute on function public.admin_delete_news_article(uuid) from anon, public;
grant execute on function public.admin_delete_news_article(uuid) to authenticated;

revoke execute on function public.admin_send_news_digest(date) from anon, public;
grant execute on function public.admin_send_news_digest(date) to authenticated;

revoke execute on function public.service_insert_news_draft(text, text, text, jsonb, boolean, text, text, text[], text, text, text, date) from anon, authenticated, public;

-- 9. notifications — widen the type check to add news_digest (existing
--    values from notifications-system-setup.sql: class_reminder, announcement).
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('class_reminder', 'announcement', 'news_digest'));

-- 10. email_log — widen the type check again (already widened once for
--    class_reminder in notifications-system-setup.sql) so digest sends show
--    up in the existing admin "Recent sends" log for free.
alter table public.email_log drop constraint if exists email_log_email_type_check;
alter table public.email_log add constraint email_log_email_type_check
  check (email_type in ('broadcast', 'winback', 'abandoned_checkout', 'cohort_reminder', 'class_reminder', 'news_digest'));

-- 11. Storage — public bucket for AI-generated article images, uploaded by
--    the daily Edge Function via the service-role key (bypasses RLS on
--    storage.objects; public=true is what makes the resulting URLs
--    world-readable, no separate SELECT policy needed).
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do nothing;

-- 12. Scheduling — same pg_cron + pg_net + vault-secret wiring as every other
--    cron job in this project (extensions and the cron_secret vault entry
--    already exist from email-system-setup.sql).
--    Switched daily -> weekly (Monday 06:00 UTC) on 2026-09-18 to cut token
--    consumption; renamed 'news-digest-daily' -> 'news-digest-weekly' when
--    this was applied in production (old job unscheduled, not altered in
--    place, so history is clean if anyone diffs cron.job by name).
select cron.schedule(
  'news-digest-weekly',
  '0 6 * * 1', -- weekly, Monday 06:00 UTC — gives the admin the day to review before sending
  $$
  select net.http_post(
    url := 'https://qkrfpuckvymjpewcszgs.supabase.co/functions/v1/generate-news-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 13. Catch-up run. The 06:00 job above has no retry-later-in-the-day path:
--     when generate-news-digest fails outright, nothing drafts until the next
--     run a week later. On 2026-08-23/24 a gemini-3.7-flash "high demand" 503
--     outage lasted 30+ hours and zeroed out two consecutive days before
--     anyone noticed (back when this ran daily). This fires 6h after the
--     primary run, gated on the day having no rows yet — a no-op on a normal
--     week, one more shot on a failed one. Runs the same weekday as the
--     primary job, not daily, since a daily gate would fire spuriously every
--     non-digest day of the week now that the primary is weekly.
select cron.schedule(
  'news-digest-weekly-catchup',
  '0 12 * * 1',
  $cron$
  do $do$
  begin
    if not exists (
      select 1 from public.news_articles where digest_date = current_date
    ) then
      perform net.http_post(
        url := 'https://qkrfpuckvymjpewcszgs.supabase.co/functions/v1/generate-news-digest',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
        ),
        body := '{}'::jsonb
      );
    end if;
  end;
  $do$;
  $cron$
);
