/* Train With FIFS service worker: offline support for PUBLIC pages only.
 *
 * What it does:  keeps a copy of the home page, the site's own scripts, styles, images and the field guide so they still open with no signal,
 *                and shows a friendly page (/offline.html) when something that was never saved is asked for.
 * What it NEVER does: touch the API, sign-in, password reset, payments, Stripe, Supabase, uploads, or any URL that carries a token or code.
 *                Those requests are not intercepted at all, so the browser handles them exactly as if this file did not exist. Nothing a
 *                signed-in person sees (records, receipts, score sheets, documents) is ever stored here.
 * Updates:       a new version waits until every open tab is closed, then takes over on the next open (no mixing old and new code mid-visit), unless the person taps
 *                "Reload now" on the update notice (then it takes over at once and the page reloads).
 * To switch it off: deploy a sw.js that unregisters itself (self.registration.unregister()) and deletes caches whose names start with "fifs-".
 */
const VERSION = 'v1';
const SHELL = 'fifs-shell-' + VERSION; // /offline.html and the home page
const STATIC = 'fifs-static-' + VERSION; // build files, scripts, styles, images, fonts, the field guide
const OFFLINE_URL = '/offline.html';
const MAX_STATIC_ENTRIES = 150;
const MAX_PRECACHE_URLS = 80;
const NAV_TIMEOUT_MS = 4000;
const ASSET_TIMEOUT_MS = 3000;

// Anything that must go to the network untouched.
function isSensitive(url) {
  const p = url.pathname;
  if (p.startsWith('/api/') || p === '/api') return true;
  if (p.startsWith('/reset-password') || p.startsWith('/auth')) return true;
  const q = url.search.toLowerCase();
  if (/(^|[?&])(code|token|access_token|refresh_token|type|error|error_description|_rsc)=/.test(q)) return true;
  if (/access_token|refresh_token/.test(url.hash.toLowerCase())) return true;
  return false;
}
function isBuildAsset(url) { return url.pathname.startsWith('/_next/static/'); }
function isSiteAsset(url) {
  const p = url.pathname;
  if (p === OFFLINE_URL) return false;
  if (p.startsWith('/scripts/') || p.startsWith('/icons/') || p.startsWith('/hero/')) return true;
  return /^\/[^/]+\.(?:png|jpg|jpeg|webp|svg|ico|css|js|woff2?|html|webmanifest)$/i.test(p);
}
function isCacheable(res) {
  if (!res || !res.ok || res.type !== 'basic') return false;
  if (res.headers.has('set-cookie')) return false;
  return !/no-store|private/i.test(res.headers.get('cache-control') || '');
}
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}
async function trim(cache, max) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i += 1) await cache.delete(keys[i]);
}
async function remember(cacheName, request, response, max) {
  if (!isCacheable(response)) return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  if (max) await trim(cache, max);
}

async function navigate(request, url) {
  try {
    const res = await withTimeout(fetch(request), NAV_TIMEOUT_MS); // network first: online visitors always get the newest page
    if (url.pathname === '/' && !url.search) await remember(SHELL, '/', res, 0);
    return res;
  } catch (_e) {
    if (url.pathname === '/') {
      const home = await caches.match('/', { cacheName: SHELL });
      if (home) return home;
    }
    const off = await caches.match(OFFLINE_URL, { cacheName: SHELL });
    return off || new Response('You are offline. Reconnect and try again.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}
async function cacheFirst(request) {
  const hit = await caches.match(request, { cacheName: STATIC });
  if (hit) return hit;
  const res = await fetch(request);
  await remember(STATIC, request, res, MAX_STATIC_ENTRIES);
  return res;
}
async function networkFirst(request) {
  try {
    const res = await withTimeout(fetch(request), ASSET_TIMEOUT_MS); // site scripts are not versioned, so never prefer an old copy while online
    await remember(STATIC, request, res, MAX_STATIC_ENTRIES);
    return res;
  } catch (e) {
    const hit = await caches.match(request, { cacheName: STATIC });
    if (hit) return hit;
    throw e;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' }))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('fifs-') && n !== SHELL && n !== STATIC).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isSensitive(url) || request.headers.has('authorization') || request.headers.has('range')) return;
  if (request.mode === 'navigate') { event.respondWith(navigate(request, url)); return; }
  if (isBuildAsset(url)) { event.respondWith(cacheFirst(request)); return; }
  if (isSiteAsset(url)) { event.respondWith(networkFirst(request)); return; }
});

// ---- Push notifications (sent by the website's server, src/Lib/server/push.ts). A notification shows a short generic line and nothing private. Tapping it opens, or brings forward,
//      the site at the address inside it (only ever an address on this site). Every push shows a notification, as the browsers require. ----
const NOTE_ICON = '/icons/icon-192.png';
function safeNoteUrl(raw) {
  try { const u = new URL(String(raw || '/'), self.location.origin); return u.origin === self.location.origin ? u.pathname + u.search : '/'; } catch (_e) { return '/'; }
}
self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (_e) { d = {}; }
  const title = String((d && d.title) || 'Train With FIFS').slice(0, 80);
  const body = String((d && d.body) || '').slice(0, 200);
  event.waitUntil(self.registration.showNotification(title, { body, icon: NOTE_ICON, badge: NOTE_ICON, tag: String((d && d.tag) || 'fifs').slice(0, 40), data: { url: safeNoteUrl(d && d.url) } }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = safeNoteUrl(event.notification.data && event.notification.data.url);
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if (!c.url.startsWith(self.location.origin)) continue;
      try { await c.focus(); if ('navigate' in c) await c.navigate(url); return; } catch (_e) { /* open a new window instead */ }
    }
    await self.clients.openWindow(url);
  })());
});

// The page lists the build files it already loaded, so they are saved on the first visit too (the worker only sees requests made after it starts).
self.addEventListener('message', (event) => {
  const data = event.data;
  if (data && data.type === 'SKIP_WAITING') { self.skipWaiting(); return; } // the person tapped "Reload now" on the update notice
  if (!data || data.type !== 'CACHE_URLS' || !Array.isArray(data.urls)) return;
  const wanted = [];
  for (const raw of data.urls.slice(0, MAX_PRECACHE_URLS)) {
    let u;
    try { u = new URL(String(raw), self.location.origin); } catch (_e) { continue; }
    if (u.origin !== self.location.origin || isSensitive(u)) continue;
    if (isBuildAsset(u) || isSiteAsset(u)) wanted.push(u.pathname + u.search);
  }
  if (!wanted.length) return;
  event.waitUntil((async () => {
    for (const path of wanted) {
      try {
        const req = new Request(path);
        if (await caches.match(req, { cacheName: STATIC })) continue;
        await remember(STATIC, req, await fetch(req), MAX_STATIC_ENTRIES);
      } catch (_e) { /* one file failing never stops the rest */ }
    }
  })());
});
