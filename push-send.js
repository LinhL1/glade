'use strict';
// Run by GitHub Actions every hour. Sends a push to each subscription whose
// stored IANA timezone currently reads 9 PM local time, so everyone gets the
// reminder at their own 9 PM regardless of where they are (and regardless of DST).
// Required env vars: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, PUSH_SUBSCRIPTIONS
const webpush = require('web-push');

const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT     = process.env.VAPID_SUBJECT || 'mailto:lvnh.le11@gmail.com';

const TARGET_HOUR = 21; // 9 PM
const MESSAGE = 'Your garden misses you. Take a moment for gratitude.';

const raw = process.env.PUSH_SUBSCRIPTIONS || '[]';
const parsed = JSON.parse(raw);
const subs = Array.isArray(parsed) ? parsed : [parsed];

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('Missing VAPID keys — set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in GitHub Secrets.');
  process.exit(1);
}
if (subs.length === 0) {
  console.log('No subscriptions found in PUSH_SUBSCRIPTIONS — nothing to send.');
  process.exit(0);
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function localHour(timezone) {
  return Number(
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).format(new Date())
  );
}

async function run() {
  for (const sub of subs) {
    if (!sub.timezone) {
      console.log('skipping (no timezone — resubscribe from the app to pick one up):', (sub.endpoint || '').slice(-40));
      continue;
    }
    let hour;
    try {
      hour = localHour(sub.timezone);
    } catch (e) {
      console.error('skipping (invalid timezone):', sub.timezone, sub.endpoint.slice(-40));
      continue;
    }
    if (hour !== TARGET_HOUR) continue;

    try {
      await webpush.sendNotification(sub, JSON.stringify({ quote: MESSAGE }));
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
