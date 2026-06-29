'use strict';
const CACHE      = 'glade-v3';
const FONT_CACHE = 'glade-fonts-v1';

const SHELL = [
  './',
  'index.html',
  'bloom.js',
  'bloom.css',
  'idb.js',
  'manifest.json',
  'assets/flower1.png',
  'assets/flower2.png',
  'assets/flower3.png',
  'assets/flower4.png',
  'assets/flower6.png',
  'assets/clover.png',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/vendor/react.production.min.js',
  'assets/vendor/react-dom.production.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Google Fonts — stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const fresh = fetch(e.request)
            .then(r => { cache.put(e.request, r.clone()); return r; })
            .catch(() => cached);
          return cached || fresh;
        })
      )
    );
    return;
  }

  // Supabase API calls — network only, never cache
  if (url.hostname.includes('supabase.co')) return;

  // App shell and assets — cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
