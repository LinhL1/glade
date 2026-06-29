# Glade — Project Context

## What it is
A floral gratitude journal PWA. Users log three things they're grateful for each day; each entry gets a randomly assigned flower image. Built with plain React 18 (no bundler), Supabase for auth + cloud storage, and a service worker for offline support.

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
  flower1–4,6.png   ← flower images (flower5 intentionally skipped)
  sprout.png        ← source image used for app icons
  icon-192.png      ← PWA icon (generated from sprout.png)
  icon-512.png      ← PWA icon (generated from sprout.png)
  vendor/
    react.production.min.js
    react-dom.production.min.js
    supabase.min.js  ← vendored at a point-in-time version; re-download to update
```

## Adding flower images
Add the file to `assets/` and append its path to the `FLOWERS` array at the top of `bloom.js`. The existing `buildFlower()` function picks from this array using `seed % FLOWERS.length`.

## Storage architecture
- **Source of truth:** Supabase Postgres (`entries` table, keyed by `user_id + date`)
- **Local cache:** IndexedDB (`glade` DB, `entries` store, keyed by `date` string `YYYY-MM-DD`)
- **Flow:** On login, fetch all entries from Supabase → write to IndexedDB. If Supabase is unreachable, read from IndexedDB instead (read-only offline mode). On plant, write to Supabase first; on success, also write to IndexedDB.
- **Offline writes:** Not supported — planting requires a network connection. A friendly error is shown if offline.

### Entry shape (Supabase + IndexedDB)
```
{ date: "YYYY-MM-DD", items: string[3], species: number, seed: number }
```
`species` is the flower index (`seed % FLOWERS.length`). `seed` is `(Date.now() % 1000000) + 1`.

## PWA setup
- **Manifest:** `manifest.json` at repo root. `start_url: "./"` and `scope: "./"` are relative to the manifest, which works for both GitHub Pages and local dev.
- **Service worker:** `sw.js` at repo root. Cache name: `glade-v1` (bump this string when deploying breaking changes to force a cache refresh). App shell is precached on install. Supabase API calls bypass the cache entirely. Google Fonts use stale-while-revalidate.
- **Icons:** Generated from `assets/sprout.png` using PowerShell System.Drawing. To regenerate after updating sprout.png, run the resize script (see conversation history).
- **Install prompt:** Android: `beforeinstallprompt` is captured; an "install app" button appears on the welcome screen. iOS: no prompt API — user must use Share → Add to Home Screen manually.

## Hosting — GitHub Pages
- Repo: `https://github.com/LinhL1/glade`
- To enable: Settings → Pages → Source: branch `main`, folder `/` (root)
- Live URL (once enabled): `https://linhl1.github.io/glade/`
- **Supabase auth:** After enabling Pages, add `https://linhl1.github.io/glade/` to Supabase → Auth → URL Configuration → Redirect URLs. The sign-in code uses `window.location.href.split('#')[0]` as the redirect, which resolves correctly automatically.

## Updating vendored JS
The files in `assets/vendor/` are point-in-time snapshots. To update:
```powershell
Invoke-WebRequest "https://unpkg.com/react@18/umd/react.production.min.js" -OutFile "assets/vendor/react.production.min.js"
Invoke-WebRequest "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" -OutFile "assets/vendor/react-dom.production.min.js"
Invoke-WebRequest "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js" -OutFile "assets/vendor/supabase.min.js"
```
Then bump `CACHE = 'glade-v2'` (or next version) in `sw.js` so installed PWAs pick up the new files.
