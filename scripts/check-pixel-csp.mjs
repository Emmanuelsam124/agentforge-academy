// Fails the build if the inline Meta Pixel script in dist/ isn't allowed by the
// Content-Security-Policy in vercel.json.
//
// The site's CSP has no script-src 'unsafe-inline', so the pixel's inline <script>
// (index.html and every prerendered snapshot) runs only because its sha256 hash is
// listed in script-src. Change one character of that script — or let a prerender
// re-serialize it differently — and the hash stops matching: the browser blocks the
// script, the pixel silently stops reporting, and nothing else breaks. This check
// turns that silent failure into a failed deploy (Vercel keeps serving the last good
// build when a build fails).
//
// To update after an intentional edit: run this, copy the hash it prints into
// script-src in vercel.json, run it again. Hashes are taken over LF text, which is
// what git stores and Vercel builds from; CRLF from a Windows checkout is normalised.
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');

const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;

async function findHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'assets' ? [] : findHtmlFiles(full);
    return entry.name.endsWith('.html') ? [full] : [];
  }));
  return nested.flat();
}

const sha256 = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

async function main() {
  const vercel = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf-8'));
  const csp = vercel.headers
    .flatMap((h) => h.headers)
    .find((h) => h.key === 'Content-Security-Policy')?.value;
  if (!csp) throw new Error('No Content-Security-Policy header found in vercel.json');
  const scriptSrc = csp.split(';').map((d) => d.trim()).find((d) => d.startsWith('script-src ')) ?? '';

  const files = await findHtmlFiles(distDir);
  const problems = [];
  let checked = 0;

  for (const file of files) {
    const rel = path.relative(distDir, file);
    const html = await readFile(file, 'utf-8');

    if (html.includes('/meta-pixel-init.js')) {
      problems.push(`${rel}: still loads /meta-pixel-init.js (removed — the pixel is inline now)`);
    }

    let found = false;
    for (const match of html.matchAll(INLINE_SCRIPT)) {
      if (!match[1].includes("fbq('init'")) continue;
      found = true;
      checked += 1;
      const hash = sha256(match[1].replace(/\r\n/g, '\n'));
      if (!scriptSrc.includes(hash)) {
        problems.push(`${rel}: inline Meta Pixel hash ${hash} is not in the script-src of vercel.json`);
      }
    }
    if (!found && rel === 'index.html') problems.push('index.html: inline Meta Pixel script not found');
  }

  if (problems.length > 0) {
    console.error('[check-pixel-csp] FAILED');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`[check-pixel-csp] ok — ${checked} inline pixel script(s) match the CSP hash in vercel.json`);
}

main().catch((err) => {
  console.error(`[check-pixel-csp] ${err.message}`);
  process.exit(1);
});
