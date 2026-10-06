// Meta (Facebook) Pixel bootstrap — kept in its own file rather than inline in
// index.html because this site's CSP has no script-src 'unsafe-inline' (see
// vercel.json, and the same reasoning in gtag-init.js). This is Meta's standard
// base code, with one addition: the injected fbevents.js tag is marked
// data-runtime-injected so scripts/prerender.mjs strips it before it can be baked
// into a committed snapshot. The <noscript> image fallback lives in each HTML file.
//
// Single-page navigations are reported by AppShell in src/App.jsx, which fires
// fbq('track', 'PageView') on every route change after the first load.
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.setAttribute('data-runtime-injected','1');
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1148513550838930');
fbq('track', 'PageView');
