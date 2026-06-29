'use strict';
// Run by GitHub Actions daily at 6 AM to send push notifications.
// Required env vars: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, PUSH_SUBSCRIPTIONS
const webpush = require('web-push');

const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT     = process.env.VAPID_SUBJECT || 'mailto:lvnh.le11@gmail.com';

const raw = process.env.PUSH_SUBSCRIPTIONS || '[]';
const subs = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [JSON.parse(raw)];

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('Missing VAPID keys — set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in GitHub Secrets.');
  process.exit(1);
}
if (subs.length === 0) {
  console.log('No subscriptions found in PUSH_SUBSCRIPTIONS — nothing to send.');
  process.exit(0);
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// The service worker picks its own random quote from QUOTES in sw.js.
// Send a minimal payload just to wake it up.
async function run() {
  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, JSON.stringify({}));
      console.log('sent to', sub.endpoint.slice(-40));
    } catch (e) {
      console.error('failed:', e.statusCode, sub.endpoint.slice(-40));
      if (e.statusCode === 410 || e.statusCode === 404) {
        console.log('  Subscription expired — remove it from the PUSH_SUBSCRIPTIONS secret.');
      }
    }
  }
}

run();
