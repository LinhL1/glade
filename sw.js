'use strict';
const CACHE = 'glade-v7';

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
  'assets/clover.png',
  'assets/clover-home.png',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/vendor/react.production.min.js',
  'assets/vendor/react-dom.production.min.js',
  'assets/fonts/fonts.css',
  'assets/fonts/space-grotesk-latin.woff2',
  'assets/fonts/space-grotesk-latin-ext.woff2',
  'assets/fonts/hanken-grotesk-latin.woff2',
  'assets/fonts/hanken-grotesk-latin-ext.woff2',
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
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // App shell and assets — cache first; navigations fall back to the cached shell
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      const fresh = fetch(e.request);
      return e.request.mode === 'navigate'
        ? fresh.catch(() => caches.match('./'))
        : fresh;
    })
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
