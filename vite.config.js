import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Manual registration only (see src/main.jsx) — NOT injectRegister:
      // 'auto'. That would add a <script> to index.html, and
      // scripts/inject-home.mjs replaces this build's entire <body> with
      // the prerendered snapshot's body afterward, silently deleting any
      // script tag injected there. Registering from inside main.jsx instead
      // means it's part of the JS bundle itself, immune to that swap.
      injectRegister: null,
      registerType: 'autoUpdate',
      manifest: {
        name: 'Social Dev Technologies',
        short_name: 'SDT',
        description: 'Your Social Dev Technologies dashboard — live sessions, replays, community, and your courses.',
        // Opens straight into the dashboard, not the marketing homepage —
        // that's the actual "app" this is meant to feel like. scope stays
        // the whole origin so following an in-app link to course content
        // (outside /dashboard) doesn't fall out of the installed window.
        start_url: '/dashboard',
        scope: '/',
        display: 'standalone',
        background_color: '#FBFAFF',
        theme_color: '#7C3AED',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache only images/icons — never HTML, and (deliberately) never
        // assets/*.{js,css} either, despite that seeming like the obvious
        // thing to precache. Those two files have FIXED, non-hashed names
        // (see the build.rollupOptions comment below — required so the
        // locally-prerendered HTML's script/link tags never drift from a
        // separate Vercel build). Workbox's precache entries came out as
        // {url: "assets/index.js", revision: null} on every single build
        // regardless of actual content changes — confirmed by rebuilding
        // after a real source change and seeing the same null. Workbox
        // treats an unchanged {url, revision} pair as "already cached,
        // nothing to do" and skips re-fetching it, so a device that
        // installed the app once would keep serving whatever JS/CSS was
        // live at that moment forever, through every later deploy, with no
        // way to self-correct short of a full uninstall. This is exactly
        // why vercel.json already gives /assets/* a short 5-minute
        // must-revalidate Cache-Control instead of the usual immutable
        // far-future one — the fixed-filename tradeoff was already solved
        // for at the HTTP layer before this service worker existed, and
        // precaching these two files fought that existing design instead
        // of complementing it. The runtimeCaching rule below still covers
        // them (it matches the same .js/.css extensions), and
        // StaleWhileRevalidate there correctly revalidates against the
        // network on every request regardless of any revision metadata —
        // so they're still cached for instant repeat loads, just without
        // precaching's broken update story.
        navigateFallback: null,
        globPatterns: ['*.{png,webp,svg,ico}'],
        runtimeCaching: [
          {
            // Same-origin static assets only — StaleWhileRevalidate so a
            // repeat visit paints instantly from cache while a fresh copy
            // fetches in the background for next time. Explicitly excludes
            // Supabase (community Realtime, auth, every data fetch) and
            // any other cross-origin request, which should never be
            // served stale or from a cache.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && /\.(?:js|css|png|webp|svg|ico|woff2?)$/.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'sdt-static-assets' },
          },
        ],
      },
    }),
  ],
  build: {
    // Fixes the Lighthouse "Missing source maps for large first-party
    // JavaScript" finding, and lets real users' (and our own) devtools show
    // actual file/line stack traces instead of minified positions. Source
    // maps are only fetched when devtools is open — no cost to normal page
    // load/TBT for visitors who never open them.
    sourcemap: true,
    rollupOptions: {
      output: {
        // Fixed (non-hashed) filenames — deliberate. Prerendered pages are
        // generated locally and committed as static HTML (see
        // scripts/prerender.mjs), referencing whatever this build produces.
        // Content-hashed filenames would drift between that local build and
        // Vercel's own separate build, silently breaking every prerendered
        // page's script/link tags. Fixed names guarantee they always match.
        // Cache-Control on /assets/* (see vercel.json) is shortened to
        // compensate for losing hash-based cache-busting.
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
