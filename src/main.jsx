import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Manual registration (vite.config.js sets injectRegister: null) — see that
// file's comment for why: auto-injecting a <script> into index.html isn't
// safe here, since scripts/inject-home.mjs replaces this build's entire
// <body> afterward. Registering from inside the bundle itself sidesteps
// that entirely. `immediate: true` registers on load rather than waiting
// for the window `load` event workbox-window otherwise defers to.
registerSW({ immediate: true })

// index.html loads the Google Fonts stylesheets with media="print" so they
// don't block first paint; flip each to media="all" once it's actually
// loaded. This has to happen here (a same-origin module script) rather than
// an inline onload= attribute — the site's CSP script-src has no
// 'unsafe-inline', which blocks inline event-handler attributes outright.
document.querySelectorAll('link[data-defer-font]').forEach((link) => {
  const activate = () => { link.media = 'all' }
  if (link.sheet) activate()
  else link.addEventListener('load', activate, { once: true })
})

const rootEl = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Always a clean createRoot — never hydrateRoot. #root ships real markup on
// prerendered/crawler-stub routes, but none of it can be hydrated against:
//
//   1. api/news-article.js, api/news-index.js, api/webinar.js, and
//      api/guide-article.js/api/guides-index.js inject hand-written HTML
//      stubs (marked data-ssr-stub) for crawlers — not real React output, so
//      the markup never matches what the client renders.
//
//   2. scripts/prerender.mjs snapshots are real React output, but from a
//      LIVE, animating page — framer-motion writes inline styles
//      continuously, so whatever frame Puppeteer caught gets baked into the
//      committed file (verifiably, e.g. `transform: translateX(0.55724px)`).
//      React's first client render emits each component's `initial` styles
//      instead, which can't match those sub-pixel values, so hydrateRoot
//      failed with React #418 on every visit and React discarded the whole
//      prerendered tree and rebuilt it client-side.
//
// That teardown-and-rebuild isn't just wasted work for human visitors —
// Googlebot's rendering pass executes this same JS and judges the page on
// the post-rebuild DOM, not the raw HTML. Caught mid-teardown (or before
// useAuth/usePro/useCohortSchedule resolve), the page can look empty enough
// to get flagged a soft 404 — confirmed 2026-09-16 on /vibe-coding via
// Search Console, despite the served HTML being fully populated.
//
// This exact fix shipped once before (2026-08-19) and was reverted minutes
// later with no recorded reason — which is how the regression above went
// unnoticed. Re-running the prerender does NOT fix it; it just bakes a
// different random frame. hydrateRoot only becomes viable again if mount
// animations are dropped from prerendered routes, making the first client
// render deterministic. Until then, createRoot is correct, not a shortcut —
// don't reintroduce hydrateRoot without solving that first.
createRoot(rootEl).render(app)
