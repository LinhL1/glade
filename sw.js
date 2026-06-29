'use strict';
const CACHE      = 'glade-v5';
const FONT_CACHE = 'glade-fonts-v1';

// ── Daily reminder quotes ────────────────────────────────
const QUOTES = [
  'What made you smile today?',
  'Three small things. That\'s all it takes.',
  'Your garden is waiting. What are you grateful for?',
  'Pause. Breathe. Name three good things.',
  'Even ordinary days hold something worth keeping.',
  'What was the best part of your day?',
  'Gratitude grows the more you tend to it.',
  'Take a moment — what do you appreciate right now?',
  'A small kindness, a quiet moment, a simple joy.',
  'What would you want to remember about today?',
  'Notice something beautiful, however small.',
  'The little things? They\'re the big things.',
];

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
  'assets/clover-home.png',
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

  // App shell and assets — cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ── Push notifications ────────────────────────────────────────────────────────

self.addEventListener('push', e => {
  let quote;
  try { quote = e.data && e.data.json().quote; } catch (_) {}
  if (!quote) quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  e.waitUntil(
    self.registration.showNotification('Glade', {
      body: quote,
      icon: 'assets/icon-192.png',
      badge: 'assets/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});
