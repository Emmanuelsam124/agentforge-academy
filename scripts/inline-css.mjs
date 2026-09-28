// Inlines dist/assets/index.css directly into dist/index.html's <head> as a
// <style> tag, replacing the external <link rel="stylesheet">. Lighthouse
// flags that link as a render-blocking request (~40ms on a cold mobile
// load) — for a single ~10KB stylesheet, eliminating the extra network
// round-trip outweighs losing separate browser caching for it. That
// caching loss barely matters here anyway: within a session React Router
// handles navigation client-side (no new HTML fetch, so no re-download
// regardless), and cross-page hard-navigation is rare on this kind of
// marketing site. Deferring it instead (like the Google Fonts links) was
// ruled out — index.css carries the entire Tailwind-generated layout, so
// deferring it would flash fully unstyled content on every load, a much
// worse regression than the 40ms this saves.
//
// Also refreshes the inlined CSS inside every prerendered snapshot
// (public/**/index.html, copied into dist/ by Vite). Those snapshots are
// committed files that carry whatever CSS existed the day `npm run
// prerender` last ran, but they load the always-current /assets/index.js —
// so any Tailwind class added to a component since then simply didn't
// exist on that route, while the same page looked fine locally. That's how
// /ai-agent-mastery lost its flow-diagram and instructor-card colours in
// production. Swapping in this build's CSS here keeps every snapshot's
// styles in step with the JS it ships alongside, without re-prerendering.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist');
const distIndexPath = path.join(distDir, 'index.html');
const cssPath = path.join(distDir, 'assets', 'index.css');

const LINK_PATTERN = /<link rel="stylesheet"[^>]*href="\/assets\/index\.css"[^>]*>/i;
const INLINED_TAILWIND_PATTERN = /<style>\/\*! tailwindcss[\s\S]*?<\/style>/i;

async function findHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'assets' ? [] : findHtmlFiles(full);
    return entry.name.endsWith('.html') ? [full] : [];
  }));
  return nested.flat();
}

async function main() {
  const css = await readFile(cssPath, 'utf-8').catch(() => null);
  if (!css) {
    console.warn('[inline-css] dist/assets/index.css not found — leaving HTML untouched.');
    return;
  }
  const styleTag = `<style>${css}</style>`;

  const html = await readFile(distIndexPath, 'utf-8');
  if (LINK_PATTERN.test(html)) {
    await writeFile(distIndexPath, html.replace(LINK_PATTERN, () => styleTag), 'utf-8');
    console.log('[inline-css] ✓ dist/index.html now has index.css inlined.');
  } else {
    console.warn('[inline-css] Could not find the index.css <link> tag — leaving dist/index.html untouched.');
  }

  const snapshots = (await findHtmlFiles(distDir)).filter((f) => f !== distIndexPath);
  let refreshed = 0;
  for (const file of snapshots) {
    const snapshot = await readFile(file, 'utf-8');
    if (!INLINED_TAILWIND_PATTERN.test(snapshot)) continue;
    await writeFile(file, snapshot.replace(INLINED_TAILWIND_PATTERN, () => styleTag), 'utf-8');
    refreshed += 1;
  }
  console.log(`[inline-css] ✓ refreshed inlined CSS in ${refreshed} prerendered snapshot(s).`);
}

main();
