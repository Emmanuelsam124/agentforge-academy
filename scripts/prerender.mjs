// Generates static HTML snapshots of every public route (scripts/prerender-
// routes.mjs) so crawlers that don't execute JavaScript (most AI crawlers —
// GPTBot, ClaudeBot, PerplexityBot — plus search engines before/without a
// render pass) see real content instead of an empty <div id="root"></div>.
//
// This is a MANUAL, LOCAL step — NOT run as part of Vercel's build. Vercel's
// build container can't reliably launch headless Chrome (that's specifically
// what @sparticuz/chromium solves, but only inside a serverless FUNCTION at
// request time, not the build step — confirmed the hard way). Instead:
//   1. Run `npm run build` locally (vite.config.js uses fixed, non-hashed
//      asset filenames specifically so these committed snapshots never go
//      stale against a future Vercel build's own separate `vite build`).
//   2. Run this script — it snapshots dist/ into public/<route>/index.html
//      (and public/prerendered-home.html for "/", since the source root
//      index.html must stay Vite's build *template*, not built output).
//   3. Commit the generated public/ files and push.
// Re-run whenever session/marketing content changes — a snapshot older than the
// page it stands in for flashes the OLD content on load, until React replaces it.
// To refresh just some routes, pass them: `npm run prerender -- /ai-agent-mastery`.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { routes as allRoutes } from './prerender-routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
// Optional route filter (see the header). Unknown routes are an error, not a no-op.
const requested = process.argv.slice(2);
const unknown = requested.filter((r) => !allRoutes.includes(r));
if (unknown.length > 0) {
  console.error(`[prerender] unknown route(s): ${unknown.join(', ')}`);
  process.exit(1);
}
const routes = requested.length > 0 ? allRoutes.filter((r) => requested.includes(r)) : allRoutes;

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

// Builder session guides — see the data-ssr-stub note in the route loop.
const SSR_STUB_ROUTE = /^\/builder-[12]\//;

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status < 500) return resolve();
      } catch {
        // server not up yet
      }
      if (Date.now() - start > timeoutMs) return reject(new Error(`Preview server did not start within ${timeoutMs}ms`));
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

async function outputPathFor(route) {
  const filePath = route === '/'
    ? path.join(publicDir, 'prerendered-home.html')
    : path.join(publicDir, route.slice(1), 'index.html');
  await mkdir(path.dirname(filePath), { recursive: true });
  return filePath;
}

async function main() {
  console.log(`[prerender] starting preview server on port ${PORT}...`);
  const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: path.join(__dirname, '..'),
    shell: true,
    stdio: 'pipe',
  });

  let browser;
  let succeeded = 0;
  let failed = 0;

  try {
    await waitForServer(BASE_URL);
    browser = await puppeteer.launch({ headless: true });

    for (const route of routes) {
      try {
        const page = await browser.newPage();
        // networkidle2 (not networkidle0): the homepage's hero video is a
        // long-lived streaming connection that never truly idles —
        // tolerating up to 2 in-flight connections means it can't block
        // this indefinitely, while still waiting for actual data fetches
        // (Supabase testimonials/course content, etc.) to settle.
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2', timeout: 20000 });
        await new Promise((r) => setTimeout(r, 300));

        // Drop nodes that runtime code injected into the DOM (currently the
        // deferred gtag.js loader — see public/gtag-init.js). page.content()
        // serializes the live DOM, so anything a script appended would
        // otherwise be committed into the snapshot as if it had been in the
        // source HTML all along — re-introducing on page load exactly the
        // request the runtime injection exists to defer.
        await page.evaluate(() => {
          document.querySelectorAll('[data-runtime-injected]').forEach((el) => el.remove());
        });

        // Drop client-only, time-varying subtrees (currently the /ai-builder
        // cohort countdown). Puppeteer captures the *mounted* DOM, so a live
        // clock would be frozen into a committed file — stale the moment
        // it's written, and a hydration mismatch besides: these components
        // render nothing on the hydration pass (useSyncExternalStore's
        // getServerSnapshot returns null) precisely so the snapshot and the
        // client's first render agree. Removing them here is what makes that
        // agreement true. Mark the component's ROOT element, not a wrapper —
        // the empty wrapper must survive to match what React renders.
        await page.evaluate(() => {
          document.querySelectorAll('[data-client-only]').forEach((el) => el.remove());
        });

        // Routes whose markup settles on data this snapshot can't carry
        // forward opt out of hydration (see src/main.jsx). Builder session
        // pages gate on `course_content`, and useCourseContent starts at
        // `loading: true` while Puppeteer captures the *resolved* state —
        // anonymous, so the locked panel. Hydration therefore compares the
        // client's loading UI against the snapshot's locked UI and throws
        // React #418 on every visit.
        //
        // The embed trick the testimonial/cohort hooks use (stash the fetched
        // JSON in the DOM so the next snapshot carries it) is deliberately
        // NOT an option here: that content is paywalled, and embedding it
        // would publish it in a committed, publicly-served file. Rendering
        // the locked panel first instead would flash "you need to buy this"
        // at paying customers. So these render client-side via createRoot —
        // crawlers still get the full static HTML above the gate.
        if (SSR_STUB_ROUTE.test(route)) {
          await page.evaluate(() => {
            document.getElementById('root')?.setAttribute('data-ssr-stub', '1');
          });
        }

        const html = await page.content();
        await page.close();

        const outPath = await outputPathFor(route);
        await writeFile(outPath, html, 'utf-8');
        succeeded += 1;
        console.log(`[prerender] ✓ ${route}`);
      } catch (err) {
        failed += 1;
        console.error(`[prerender] ✗ ${route} — ${err.message}`);
      }
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    preview.kill();
  }

  console.log(`[prerender] done — ${succeeded} succeeded, ${failed} failed out of ${routes.length} routes`);
  if (failed > 0) process.exitCode = 1;
}

main();
