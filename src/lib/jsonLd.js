// Body for a <script type="application/ld+json"> in the server-rendered
// /api pages. JSON.stringify doesn't escape "<", so a title containing
// "</script>" would end the script element early and everything after it
// would be parsed as markup. </>/& are still valid JSON and
// decode back to the same characters for crawlers.
//
// The browser-side copies (src/hooks/usePageSeo.js) are set via textContent,
// which is never parsed as HTML, so they don't need this.
export function jsonLdBody(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
