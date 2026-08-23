import { buildPushPayload } from '@block65/webcrypto-web-push';

const ALLOWED_ORIGIN = 'https://linhl1.github.io';
const TARGET_HOUR = 21; // 9 PM
const MESSAGE = 'Your garden misses you. Take a moment for gratitude.';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function isValidSubscription(sub) {
  return sub
    && typeof sub.endpoint === 'string'
    && sub.keys
    && typeof sub.keys.p256dh === 'string'
    && typeof sub.keys.auth === 'string'
    && typeof sub.timezone === 'string';
}

async function handleSubscribe(request, env) {
  let sub;
  try {
    sub = await request.json();
  } catch (e) {
    return json(400, { error: 'Invalid JSON' });
  }
  if (!isValidSubscription(sub)) {
    return json(400, { error: 'Missing endpoint, keys.p256dh, keys.auth, or timezone' });
  }
  const record = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    timezone: sub.timezone,
    subscribedAt: new Date().toISOString(),
  };
  await env.SUBSCRIPTIONS.put(sub.endpoint, JSON.stringify(record));
  return json(200, { ok: true });
}

async function handleUnsubscribe(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json(400, { error: 'Invalid JSON' });
  }
  if (!body || typeof body.endpoint !== 'string') {
    return json(400, { error: 'Missing endpoint' });
  }
  await env.SUBSCRIPTIONS.delete(body.endpoint);
  return json(200, { ok: true });
}

function localHour(timezone) {
  return Number(
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).format(new Date())
  );
}

async function sendReminders(env) {
  const list = await env.SUBSCRIPTIONS.list();
  const vapid = {
    subject: env.VAPID_SUBJECT,
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
  };
  const message = { data: JSON.stringify({ quote: MESSAGE }) };

  for (const { name: endpointKey } of list.keys) {
    const raw = await env.SUBSCRIPTIONS.get(endpointKey);
    if (!raw) continue;
    const record = JSON.parse(raw);

    let hour;
    try {
      hour = localHour(record.timezone);
    } catch (e) {
      console.error('invalid timezone, skipping:', record.timezone, endpointKey.slice(-40));
      continue;
    }
    if (hour !== TARGET_HOUR) continue;

    try {
      const payload = await buildPushPayload(message, record, vapid);
      const res = await fetch(record.endpoint, payload);
      if (res.status === 404 || res.status === 410) {
        await env.SUBSCRIPTIONS.delete(endpointKey);
        console.log('expired, removed:', endpointKey.slice(-40));
      } else if (!res.ok) {
        console.error('send failed:', res.status, endpointKey.slice(-40));
      } else {
        console.log('sent to', endpointKey.slice(-40));
      }
    } catch (e) {
      console.error('send error:', e.message, endpointKey.slice(-40));
    }
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method === 'POST' && pathname === '/subscribe') {
      return handleSubscribe(request, env);
    }
    if (request.method === 'POST' && pathname === '/unsubscribe') {
      return handleUnsubscribe(request, env);
    }
    return json(404, { error: 'Not found' });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendReminders(env));
  },
};
