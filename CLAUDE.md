# Agent Forge / Social Dev Technologies — Project Context

React 19 + Vite frontend, Supabase (Postgres + Auth + Edge Functions, Deno) backend, Paystack payments, deployed on Vercel (GitHub `master` branch = production — there is no `main` branch; check with `git ls-remote --heads origin` before assuming).

**Deploy pipeline ownership:** the GitHub repo is `King0711/agentforge-academy`, and the Vercel project that serves `socialdevtechnologies.com` lives in a *separate person's* Vercel account (team `AGENTFROGE`, Hobby plan). Anything that requires installing/authorizing the Vercel GitHub App, or reconnecting the Git integration, has to be done by the repo owner — collaborator access is not sufficient, since GitHub App installation is an ownership-level permission. If merges stop deploying, check the project's Settings → Git (repo still connected?) and Settings → Environments → Production (Branch Tracking still `master`?) before assuming the build is broken. Note that Vercel does *not* retroactively build commits that landed before a Git reconnection — it needs a fresh push.

Supabase project ref: `qkrfpuckvymjpewcszgs`. Two other webhook functions exist (`flutterwave-webhook`, `lemonsqueezy-webhook`) but Paystack is the live payment provider.

## Access model

**Since the 2026-09-22 repricing, new sales are permanent guide purchases**, not subscriptions: Builder 1 ₦5,000 (12 guides), Builder 2 ₦7,000 (13 guides), Pro ₦10,000 (both). `paystack-webhook` inserts one `guide_purchases` row per course_id in the tier (see `supabase/guide-purchases-setup.sql`). Prices live in `src/data/pricing.js`, `paystack-webhook` `PRICES`, `create-paystack-checkout`, and the WhatsApp bot's `knowledge-base.ts` — all four must move together. Vibe Coding (₦50,000) and AI Agent Mastery (₦19,999) are separate live cohorts with 6-month access — AI Agent Mastery runs 3 live days (founder-confirmed 2026-09-27), the third dedicated to monetizing the skill rather than more assistant-building; see `CURRICULUM_DAYS` in `src/pages/AIAgentMastery.jsx`. AI Agents Live (added 2026-09-27) is a third, separate product: a 2-day workshop with only 7 days of post-workshop access and real seat-based scarcity pricing — see below.

`src/pages/AIAgentMastery.jsx` and `src/pages/AgentsLive.jsx` share the same system-showcase diagram (`AgentsLiveFlowDiagram`), the same two demo recordings and their `DemoVideo`/`DemoLoop` wrapper components (`src/components/DemoMedia.jsx`, data in `src/data/demoMedia.js`), the same "About the instructor" card (`src/components/InstructorSection.jsx` — content is identical across both pages except the one `closingLine` prop naming the specific product/format), and the same WhatsApp-screenshot testimonials (`src/components/AgentBuildTestimonials.jsx`) — founder direction 2026-09-27, since both pages sell variants of the same underlying agent-building skill.

`entitlements` table (RLS: no client write, service-role/Edge-Function/admin-RPC only):
- `builder1_expires_at` / `builder2_expires_at` — the old 6-month subscriptions, kept working for grandfathered subscribers only.
- `is_admin` — bypasses all gating.
- `is_pro` / `pro_expires_at` — legacy columns, no longer read or written anywhere, kept for historical data only.

`course_content` RLS policy allows `is_admin`, OR an unexpired `builder1_expires_at`/`builder2_expires_at` matching the row's tier, OR a `guide_purchases` row for that course_id.

Admin panel (`/admin`, `src/pages/Admin.jsx`) uses SECURITY DEFINER RPCs in `supabase/admin-setup.sql` (`admin_get_all_profiles`, `admin_set_user_pro`, `admin_set_user_admin`) — self-check inside each function, only callable by an existing admin.

## Student community (added 2026-09-27)

`/dashboard/community` (`src/pages/dashboard/Community.jsx`) is a text-only chat: one `general` room for anyone who has ever bought anything, plus one room per product (`builder1`, `builder2`, `vibecoding`, `aimastery`, `agentslive`) — schema in `supabase/community-setup.sql`. No attachment/upload path exists anywhere in this feature, which is how "no images or videos" is enforced (never built, not filtered).

- **Membership is permanent, not tied to whether a live cohort's access window has since expired** — `has_community_membership()` checks "ever granted" (`guide_purchases` row exists, or the relevant `entitlements.*_expires_at` is non-null), not `usePro()`'s "currently active" rule. This is a class alumni room, not a paywall. `is_admin` bypasses every channel.
- Three new SECURITY DEFINER functions (`has_community_membership`, `my_community_channels`, `community_channel_members`) all got the same 3-statement revoke/grant dance as any other new RPC — verified via `aclexplode(proacl)`, none show up in `get_advisors`'s anon-executable list.
- `community_channel_members(channel_id)` is scoped to callers who are themselves a member of that channel — it's "who else is in this room" for author names and @mention autocomplete, not a general user directory.
- Realtime via `postgres_changes` on `community_messages` (added to the `supabase_realtime` publication) — this respects the table's own SELECT RLS policy, so a client only ever receives INSERT/DELETE broadcasts for rooms it's actually a member of.
- Moderation is self-delete + admin-delete-any only for now (no mute/ban) — first-version scope, revisit if real usage shows more is needed.
- `src/pages/dashboard/Community.jsx` mounts a `ChannelRoom` subcomponent keyed on `channel.id` per room — switching rooms is a clean remount rather than an effect resetting local composer state, which also sidesteps this repo's `react-hooks/set-state-in-effect` lint rule (see `usePro.js`'s guard-clause branch for the one place that rule is still pre-existing-violated — untouched, out of scope for this feature).

**Every new `admin_*` RPC needs three revokes, not one.** The internal `is_admin()` guard is necessary but isn't the whole job — two separate default-grant mechanisms make a fresh function reachable anonymously over `/rest/v1/rpc/<name>` unless both are revoked:
1. Postgres grants `EXECUTE` to `PUBLIC` by default on `CREATE FUNCTION`, and `anon`/`authenticated` inherit from `PUBLIC`.
2. This Supabase project's `ALTER DEFAULT PRIVILEGES` on the `public` schema *also* grants `EXECUTE` directly to `anon` (and `authenticated`), independent of `PUBLIC` — confirmed 2026-08-19 when `admin_update_testimonial` came out of `CREATE FUNCTION` with `anon` already in its ACL despite no explicit grant statement. Revoking only `FROM PUBLIC` leaves this direct grant untouched.

Ship every admin RPC with all three statements:

```sql
REVOKE EXECUTE ON FUNCTION public.<name>(<arg types>) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.<name>(<arg types>) FROM anon;
GRANT  EXECUTE ON FUNCTION public.<name>(<arg types>) TO authenticated;
```

A correctly-locked function's ACL reads `postgres=X, authenticated=X, service_role=X` with no leading `=X/postgres` entry (that empty grantee is `PUBLIC`) and no `anon` entry — check by querying `aclexplode(proacl)`, not just by eyeballing `REVOKE ... FROM PUBLIC` in the migration. The guides-CMS and live-session RPCs shipped without any of this and were anonymously callable until 2026-08-19; the `is_admin()` guard did hold, so nothing was exposed, but they were relying on a single layer. Check with `get_advisors(type: "security")`.

`get_certificate_by_id` is deliberately left callable by `anon` — the public `/verify/:id` page depends on it. `agentslive_seats_taken()` (`supabase/agentslive-seat-pricing.sql`) is the same kind of deliberate exception: it returns only an integer count (no PII), explicitly granted to `anon` rather than revoked, so the AI Agents Live page can show a real "seats left" figure to a visitor who isn't logged in yet.

## AI Agents Live — real seat-based pricing (added 2026-09-27)

`/ai-agents-live` (`src/pages/AgentsLive.jsx`) is a standalone 2-day workshop product, plan key `agentslive`, entitlement column `entitlements.agentslive_expires_at` (7-day grant, not 182 like the other live cohorts — see `supabase/agents-live-setup.sql`). It's deliberately **not** the same product as AI Agent Mastery (₦19,999, 6-month) even though the two are easy to confuse by name.

The scarcity pricing is real, not decorative copy: the first 100 *granted* `agentslive` payments are ₦10,000; every one after that is ₦15,000 (founder-confirmed threshold/prices). Three places implement this and must stay in sync:
- `create-paystack-checkout` computes the actual charge from a live `count(*) from payments where plan='agentslive' and status='granted'` via `resolveAgentsLivePrice()` — this is what Paystack actually charges. On a failed count query it fails closed to ₦15,000 (the higher price), never silently under-charging.
- `paystack-webhook`'s `resolvePlan()` accepts **both** ₦10,000 and ₦15,000 (see `MULTI_TIER_PRICES`) as valid for plan `agentslive` — every other plan still has exactly one valid price.
- `AgentsLive.jsx` reads the same count via the public `agentslive_seats_taken()` RPC to display the current price and "X seats left" — this is a separate read from what checkout charges (a client-side display value, re-verified server-side at checkout), so there's an inherent, accepted race: the displayed price can theoretically go stale between page load and the moment someone clicks pay if the 100th seat sells in between.

The workshop's countdown timer counts down to `cohort_schedule` (`tier='agentslive'`) `start_date` at a hardcoded 7:00 PM WAT (`AGENTS_LIVE_START_HOUR_WAT` in `src/data/pricing.js`) — registration is treated as closing when the workshop starts; there is no separate, earlier registration-close deadline configured.

## Recent incident — resolved 2026-08-05

**Bug:** `paystack-webhook` (`supabase/functions/paystack-webhook/index.ts`) required the charged amount to match the listed plan price within ±₦1. When a customer's card is charged with Paystack's transaction fee passed through (Paystack Dashboard → Settings → Preferences → "Transaction fees" toggle), the actual `charge.success` amount is price + fee, so `resolvePlan()` returned `null` and the payment got logged to `payments` as `flagged_unrecognized_amount` (with `user_id: null`) instead of granting the entitlement. Real, successful payments were silently not granting access — affected at least one confirmed user (`ezinwajohn@gmail.com`, Builder 1, charged ₦50,862.95 against a ₦50,000 price).

**Fix applied (local edit, not yet redeployed):**
- `resolvePlan()` now accepts amounts from the listed price up to `price * 1.06` (`FEE_CEILING_MULTIPLIER`), covering Paystack's local (~1.7%) and international (~4%) fee ranges with headroom, instead of requiring an exact match.
- `supabase/backfill-fee-flagged-payments.sql` — idempotent backfill script. Parses plan + user id back out of `provider_transaction_id` (format: `sdt_<plan>_<uuid>_<timestamp>`, set at checkout time), sanity-checks the amount against the same price/fee band, grants the entitlement, and relabels the payment row `granted_backfill_fee_mismatch`. Rows it can't confidently resolve are left `flagged_unrecognized_amount` for manual review (e.g. a ₦100 charge with no plan/user in its reference turned up during backfill — unrelated to any real plan, likely a card-verification probe, correctly left alone).
- Already run once against production data; `ezinwajohn@gmail.com` is fixed.

**Still open / TODO:**
- [x] ~~Redeploy `paystack-webhook`~~ — done. The deployed function is at version 16 and contains `FEE_CEILING_MULTIPLIER = 1.06`; verified 2026-08-19 by reading it back with the Supabase MCP. This entry sat here stale for a while and read like an active revenue-losing bug, so check the deployed version before trusting a TODO here.
- [ ] Decide whether to also turn off "customer bears the fee" in Paystack Dashboard → Settings → Preferences (optional now that the webhook tolerates it, but affects what customers see at checkout).
- [ ] Re-run `backfill-fee-flagged-payments.sql` periodically or after the redeploy to confirm no new flagged rows accumulate.

## Article and guide images

Header images for news articles and guides live in the **`news-images` Supabase Storage bucket** (public), but `image_url` on a row stores a **first-party URL**, never the raw storage one:

```
https://socialdevtechnologies.com/article-images/<slug>-<timestamp36>.jpg
```

`vercel.json` rewrites `/article-images/*` onto the bucket's public endpoint — so images are attributed to the site rather than a `supabase.co` host, and changing storage later is a rewrite change instead of a rewrite of every `image_url` in the database. The rewrite must stay **above** the catch-all `/(.*)  → /index.html`, or it never matches. `src/lib/articleImages.js` owns the path/URL construction; keep it and the rewrite in step.

**Use 1200×675 (16:9).** Every on-site placement renders the image in a 16:9 `object-cover` box — both listing cards (`News.jsx`, `GuidesIndex.jsx`) and both article heroes (`NewsArticle.jsx`, `GuidePage.jsx`) — so 1200×675 fits all four exactly, while still clearing LinkedIn's 1200×627 floor for the `og:image` (which crops to ~1.91:1 and loses only a couple dozen pixels). The admin upload control warns on off-ratio images but never blocks them.

**Uploads use a unique path per upload, not a stable `<slug>.jpg`.** These are served with a one-year immutable `Cache-Control`, so overwriting a path would strand viewers on the old image until the CDN entry expired. The tradeoff is that replaced images become unreferenced orphans in the bucket — prune them from the Supabase dashboard, not with `delete from storage.objects` (a direct row delete unlinks the index entry but leaves the actual blob behind).

**Storage policies are a separate layer from the `admin_*` RPC grants above.** The bucket existed with *zero* RLS policies until 2026-08-22 and nobody noticed, because `generate-news-digest` writes through `service_role`, which bypasses RLS entirely — so the gap only surfaced when a browser first tried to upload. Anything that writes to a bucket from the client needs explicit policies; `supabase/article-images-setup.sql` holds the three admin-gated ones (insert/update/delete) plus the bucket's `file_size_limit` (2MB) and `allowed_mime_types` (JPG/PNG/WebP). Those two bucket settings were also null until then — harmless while only `service_role` could write, dangerous the moment a browser can.

Note the policies read the caller's `entitlements` row, which works only because that table's RLS permits `auth.uid() = user_id` self-reads. Tightening `entitlements` RLS would silently break admin uploads — verify with a role-simulation probe (`set local role authenticated` + `request.jwt.claims`), not by eyeballing the policy.

**Automatic generation exists but has never run.** `generateImage()` in `supabase/functions/generate-news-digest/index.ts` calls OpenAI `gpt-image-1` when `OPENAI_API_KEY` is set, and returns `null` (logging a warning) when it isn't — which is why the bucket sat empty for weeks. Two things to know before switching it on: `gpt-image-1` is **deprecated as of 2026-10-23**, and the hardcoded `1536x1024` is 1.5:1, not the ~1.91:1 the code comment claims to be aiming for. Gemini's free tier (~500 images/day, native 16:9) was evaluated as the better replacement if per-article art is ever wanted.

## Prerendering never supported hydration — don't reintroduce `hydrateRoot`

`scripts/prerender.mjs` snapshots a **live, animating** page. framer-motion writes inline styles continuously, so whatever frame Puppeteer happened to catch gets baked into the committed snapshot — e.g. `public/prerendered-home.html` verifiably contained `style="opacity: 0; transform: translateX(0.55724px) translateY(0.222896px);"`. That's a mid-flight animation frame; React's first client render emits the component's `initial` styles instead, which can never match those sub-pixel numbers. Result: `hydrateRoot` fails with React #418 on every visit to any prerendered route using `m.*` (framer-motion) elements, and React responds by discarding the *entire* prerendered tree and rebuilding it client-side.

This was fixed once (2026-08-19, measured LCP 532→400ms, TBT ~218→151ms, console #418→clean) by making `src/main.jsx` always use `createRoot`. It was reverted minutes later with no recorded reason, silently erasing this note along with it — which is exactly how the regression went unnoticed until it surfaced again as a **Google Search Console soft-404 on `/vibe-coding`** (2026-09-16): the raw served HTML is fully populated (verified directly), but Googlebot's rendering pass executes the same JS a real visitor does, and catches the page mid-teardown/rebuild — sometimes before `useAuth`/`usePro`/`useCohortSchedule` resolve — which can look thin enough to trip the soft-404 heuristic. The homepage has the same animation pattern and almost certainly has the same defect; it just hasn't been flagged in GSC yet.

Re-applied the `createRoot`-always fix in `src/main.jsx` on 2026-09-16. **Re-running `npm run prerender` does not fix this** — it just bakes a different random animation frame. `hydrateRoot` only becomes viable again if mount animations are dropped from prerendered routes, making the first client render deterministic. Until then, `createRoot` is correct, not a workaround — if you're tempted to revert this again, fix the animation-snapshot mismatch first, or at minimum re-run `npm run prerender` + Puppeteer content-length checks against every route in `scripts/prerender-routes.mjs` before merging, and leave a reason in the commit this time.

## Course guides, Gemini, and the jobs that call it (2026-09-25/26)

- **Live guides (`course_content` 1-25) are what students see; `supabase/starter-projects/` is not.** Since 2026-09-26 guides 1-3 and 5-25 are the "real tested Python" rewrite (published from `supabase/course-content-drafts/` by `supabase/course-drafts-publish-20260926.sql`; the pre-publish live rows are in `course_content_backup_20260926_publish`). They share one dual-provider `sdt_ai.py` (`AI_PROVIDER=gemini` with a free key, or `claude` with the student's own Anthropic key - there are no platform credits): Gemini default `gemini-flash-latest`, key sent as `x-goog-api-key`, `thinkingConfig: {thinkingBudget: 0}` plus a 1024-token allowance on top of `max_tokens`, readable errors for empty (`MAX_TOKENS`) and 404 replies; Claude default `claude-haiku-4-5`. Its mock test suite is `scripts/course-content/test_sdt_ai.py`. Guide 4 (Make.com, no code) is unchanged.
- **Guide fixes applied 2026-09-25/26** (each `supabase/course-content-*.sql` file is the exact migration that ran, with its own `course_content_backup_2026092x_*` table) - the same fixes were ported into the rewritten guides before they were published on 2026-09-26:
  - Every Python guide (all but the no-code #4) now opens with a "Set up Python" step: Python 3.10+, a `.venv`, and a `pip install` of exactly what that guide imports. Builder 2 guides 13-22 also run `pip install -r requirements.txt` after the prompt that writes it.
  - Guides no longer point at files students never get (README.md, `.env.example`, "included" samples). The samples are inlined; #12 has a `make_samples.py` step.
  - Third-party steps are current: HubSpot Service Keys, Buffer GraphQL, Airtable PATs, DataForSEO API password, ngrok authtoken, Railway pricing, and port 5050 instead of 5000.
  - Code bugs are fixed in #2, #3, #10, #11 (the code is inline; each file was run against its own self-test) and in the #16, #17, #19, #23, #25 prompts.
  - The step numbers students see come from array position, so inserting a step renumbers the ones after it. Text referring to "Build N" uses `build.number` and is unaffected.
- **`course_content_draft` is empty since the 2026-09-26 publish** (the published drafts are backed up in `course_content_draft_backup_20260926_publish`). `admin_publish_course_draft()` overwrites the whole live row and, since `supabase/course-draft-publish-guard.sql`, refuses a draft older than the live row. To change a guide, edit its file in `supabase/course-content-drafts/`, load it as a draft, then publish.
- **Gemini facts, checked 2026-09-25:** `gemini-2.5-flash` returns 404 "no longer available to new users" for new API keys and shuts down ~2026-10-16..20; 2.0 Flash shut down 2026-06-01. Thinking tokens count against `maxOutputTokens`. `thinkingBudget` works on 2.5 and 3.x; `thinkingLevel` errors on 2.5. Current Flash models: 3.8, 3.7, 3.6, 3.5-flash-lite.
- **Editing guide content:** write a migration that guards every edit (md5 of the old value), checksums its own new text, asserts the end state, backs up first (CREATE TABLE AS does not carry RLS — enable it and revoke anon/authenticated), and runs as one transaction. Dry-run it on a local Postgres copy of the rows first.
  - `scripts/course-content/gen_edits.py` generates exactly that from a small Python spec (text replacements, whole values, new keys, inserted steps).
  - Long code blocks with small changes ship as "patch" hunks, each checked against the md5 of the reviewed result. This keeps a migration small enough to paste through the Supabase MCP (~40KB has worked; 76KB was split).
- **`generate-news-digest`** runs weekly (Mon 06:00 UTC, 12:00 catch-up if no articles that day); drafts land as `pending_review`. The Free plan kills an Edge Function at 150s wall clock (HTTP 546, nothing logged), and `gemini-3.7-flash` has returned "high demand" at 06:00 on every recorded run — so the function alternates 3.7/3.6 inside a 135s budget and times out each feed at 15s. Before 2026-09-25 it had silently produced nothing since 09-15.
- **`whatsapp-support-agent`**: every fact it may say is in `knowledge-base.ts`; keep it in step with pricing (it quoted the old ₦25,000 prices for three days after the repricing). Human-reply hours are 10am-5pm WAT Monday-Saturday, closed Sunday (confirmed by the owner 2026-09-26; deployed as v4). It had received 0 messages as of 2026-09-25.
- **Claude cloud sessions can't reach** ai.google.dev, firebase.google.com, socialdevtechnologies.com or *.vercel.app (egress policy). Google's API discovery doc (`generativelanguage.googleapis.com/$discovery/rest?version=v1beta`) and raw.githubusercontent.com (google-gemini/cookbook, googleapis/python-genai) are reachable and authoritative. Confirm a production deploy via the GitHub commit-status API instead of fetching the site.

## Workflow preferences (confirmed with project owner)

- **Git:** push to a feature branch and open a PR — do not push straight to `main`. This repo has live payment/auth logic; changes should go through a review step before production.
- **Supabase Edge Functions:** deploy via the Supabase CLI once linked (`supabase link --project-ref qkrfpuckvymjpewcszgs`).
- Broader engineering conventions (schema style, RLS patterns, watermarking approach for paid content, etc.) are documented in `content-protection-brief.md` and `claude-code-prompt.md` in the repo root — read those before touching payment, entitlement, or content-gating code.
