---
name: verify
description: Build/launch/drive recipe for verifying Glade (offline-first PWA) in headless Chrome
---

# Verifying Glade

Glade is a static PWA — no build step. Verification means serving the repo over HTTP
(service workers need http://localhost or https), driving it in a real browser, and
checking behavior, especially offline.

## Recipe that works

1. Serve the repo root with any static server on localhost (a ~20-line Node `http` server
   is enough; give `.woff2` the `font/woff2` MIME type).
2. Drive with `puppeteer-core` pointed at the installed Chrome
   (`C:/Program Files/Google/Chrome/Application/chrome.exe`), `headless: 'new'`,
   and a throwaway `userDataDir` so SW/cache state starts clean each run.
3. Load the page, then wait for the service worker by **polling the cache**, not by
   awaiting `navigator.serviceWorker.ready` — returning a `ServiceWorkerRegistration`
   from `page.evaluate` hangs the protocol. Poll until `caches.open('glade-vN')` holds
   the expected number of SHELL entries.
4. To test offline, **kill the HTTP server** and reload — this is a truer simulation
   than CDP offline emulation and definitely applies to SW fetches.
5. Useful checks: `document.fonts.check("16px 'Space Grotesk'")`, `document.body.innerText`
   for screen text ("Tend to the good things", "Planted."), `img.naturalWidth > 0`,
   and driving the plant flow (click "Today"/"Revisit" → type into 3 textareas →
   click "plant in garden" → expect "Planted.").

## Gotchas

- `cache.addAll(SHELL)` in sw.js fails the entire SW install if any listed file 404s —
  a missing asset silently breaks all offline support. Check SHELL against `assets/` first.
- Bump `CACHE = 'glade-vN'` in sw.js when cached files change, or an installed PWA keeps
  serving stale files.
- `favicon.ico` 404s in the console; harmless.
