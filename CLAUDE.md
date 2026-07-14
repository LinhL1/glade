# Glade — Project Context

## What it is
A floral gratitude journal PWA. Users log three things they're grateful for each day; each entry gets a randomly assigned flower image. Built with plain React 18 (no bundler), IndexedDB for local storage, and a service worker for full offline support. (An earlier version used Supabase for auth + cloud storage; that code lives only in `bloom.html`, kept for reference.)

## File map
```
index.html          ← PWA entry point (GitHub Pages serves this)
bloom.html          ← original name, kept for reference; not served by Pages
bloom.js            ← all React components and app logic (~470 lines, no JSX)
bloom.css           ← all styles (~23 lines)
idb.js              ← IndexedDB module (global IDB object)
manifest.json       ← Web App Manifest
sw.js               ← Service worker
assets/
  flower1–4.png     ← flower images
  clover.png        ← source image used for app icons
  clover-home.png   ← welcome-screen clover
  icon-192.png      ← PWA icon
  icon-512.png      ← PWA icon
  fonts/
    fonts.css       ← @font-face rules for the self-hosted fonts below
    *.woff2         ← Space Grotesk + Hanken Grotesk (variable fonts, latin + latin-ext)
  vendor/
    react.production.min.js
    react-dom.production.min.js
    supabase.min.js  ← unused (legacy, only referenced by bloom.html)
```

## Adding flower images
Add the file to `assets/` and append its path to the `FLOWERS` array at the top of `bloom.js`. The existing `buildFlower()` function picks from this array using `seed % FLOWERS.length`. **Also add the file to the `SHELL` list in `sw.js`** — and note that `cache.addAll` fails the whole service-worker install if any SHELL entry 404s, so never list a file that doesn't exist.

## Storage architecture
- **Source of truth:** IndexedDB (`glade` DB, `entries` store, keyed by `date` string `YYYY-MM-DD`). No server, no auth — everything is device-local.
- **Offline:** Fully supported for reads and writes. The service worker precaches the entire app shell (including fonts), so the app loads and plants entries with no network after the first visit.

### Entry shape (IndexedDB)
```
{ date: "YYYY-MM-DD", items: string[3], species: number, seed: number }
```
`species` is the flower index (`seed % FLOWERS.length`). `seed` is `(Date.now() % 1000000) + 1`.

## PWA setup
- **Manifest:** `manifest.json` at repo root. `start_url: "./"` and `scope: "./"` are relative to the manifest, which works for both GitHub Pages and local dev.
- **Service worker:** `sw.js` at repo root. Cache name: `glade-v6` (bump this string whenever any cached file changes, or installed PWAs keep serving the old version). App shell — including self-hosted fonts — is precached on install; fetches are cache-first with a navigation fallback to the cached shell.
- **Fonts:** Self-hosted in `assets/fonts/` (downloaded from Google Fonts as variable woff2 files) so the app has zero external network dependencies. `index.html` loads `assets/fonts/fonts.css`; do not re-add `fonts.googleapis.com` links.
- **Icons:** Generated from `assets/clover.png` using PowerShell System.Drawing. To regenerate after updating clover.png, run the resize script (see conversation history).
- **Install prompt:** Android: `beforeinstallprompt` is captured; an "install app" button appears on the welcome screen. iOS: no prompt API — user must use Share → Add to Home Screen manually.

## Hosting — GitHub Pages
- Repo: `https://github.com/LinhL1/glade`
- To enable: Settings → Pages → Source: branch `main`, folder `/` (root)
- Live URL (once enabled): `https://linhl1.github.io/glade/`

## Updating vendored JS
The files in `assets/vendor/` are point-in-time snapshots. To update:
```powershell
Invoke-WebRequest "https://unpkg.com/react@18/umd/react.production.min.js" -OutFile "assets/vendor/react.production.min.js"
Invoke-WebRequest "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" -OutFile "assets/vendor/react-dom.production.min.js"
```
Then bump `CACHE = 'glade-v2'` (or next version) in `sw.js` so installed PWAs pick up the new files.
