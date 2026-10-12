/**
 * TrainWithFIFS - website visits + Discord ping (offline)
 * Every page load counts (a hard refresh again); bots are ignored; nothing identifying is stored or sent (no IP, query string, full referrer or email);
 * the Discord ping is throttled; only staff can read or reset the numbers; the admin panel shows the server's real numbers.
 */
const fs = require('fs'); const path = require('path'); const Module = require('module');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const v = require(path.join(ROOT, 'src/Lib/server/site-visits.ts'));
let passed = 0, failed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log(`  ✓ PASS: ${name}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${name}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const UA = { iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ipad: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', pixel: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36', win: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0', deck: 'Mozilla/5.0 (X11; Linux x86_64; Steam Deck) AppleWebKit/537.36 Chrome/118 Safari/537.36', bot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };

(async () => {
  await test('Devices are told apart: phone, tablet (including an iPad that says it is a Mac), desktop, handheld PC', () => {
    eq(v.classifyDevice(UA.iphone, 390, true), 'Mobile Phone'); eq(v.classifyDevice(UA.pixel, 412, true), 'Mobile Phone'); eq(v.classifyDevice(UA.ipad, 820, true), 'Tablet / iPad');
    eq(v.classifyDevice(UA.mac, 1024, true), 'Tablet / iPad', 'iPadOS as Mac'); eq(v.classifyDevice(UA.mac, 1440, false), 'Desktop / Laptop'); eq(v.classifyDevice(UA.win, 1920, false), 'Desktop / Laptop'); eq(v.classifyDevice(UA.deck, 1280, true), 'Handheld PC');
    eq(v.parseAgent(UA.win), { browser: 'Edge', os: 'Windows' }); eq(v.parseAgent(UA.iphone), { browser: 'Safari', os: 'iOS' }); eq(v.parseAgent(UA.pixel), { browser: 'Chrome', os: 'Android' });
  });
  await test('Bots, crawlers and empty browsers are ignored', () => { assert(v.isBot(UA.bot) && v.isBot('') && v.isBot('curl/8.0') && v.isBot('Lighthouse') && v.isBot('x'.repeat(500)), 'bots'); assert(!v.isBot(UA.iphone) && !v.isBot(UA.win), 'real browsers'); });
  await test('Only the page path is kept: queries, fragments, tokens, odd characters and other sites are dropped', () => {
    eq(v.cleanPath('/reset-password?code=SECRET#access_token=abc'), '/reset-password'); eq(v.cleanPath('/'), '/'); eq(v.cleanPath('//evil.com'), null); eq(v.cleanPath('javascript:alert(1)'), null); eq(v.cleanPath('/a b'), null); eq(v.cleanPath('/' + 'x'.repeat(130)), null);
    eq(v.cleanHost('www.google.com'), 'www.google.com'); eq(v.cleanHost('https://google.com/search?q=gun'), null); eq(v.cleanHost('localhost'), null); eq(v.cleanHost('a b.com'), null);
  });
  await test('The visitor hash is one-way, changes every day, and does not exist without a server secret (so it cannot be reversed to an IP)', () => {
    const d1 = new Date('2026-10-12T15:00:00Z'), d2 = new Date('2026-10-13T15:00:00Z'), s = 'server-secret-123';
    const a = v.visitorHash('1.2.3.4', UA.win, d1, s); assert(/^[0-9a-f]{16}$/.test(a) && !a.includes('1.2.3.4'), 'shape'); eq(a, v.visitorHash('1.2.3.4', UA.win, new Date('2026-10-12T23:59:00Z'), s), 'stable within a day');
    assert(a !== v.visitorHash('1.2.3.4', UA.win, d2, s), 'new day, new hash'); assert(a !== v.visitorHash('1.2.3.5', UA.win, d1, s), 'different IP'); eq(v.visitorHash('1.2.3.4', UA.win, d1, ''), null, 'no secret'); eq(v.visitorHash('1.2.3.4', UA.win, d1, 'short'), null);
  });
  await test('A visit row holds no IP, email, query or full referrer; API paths are never counted', () => {
    const row = v.buildRow({ ua: UA.iphone, ip: '9.9.9.9', now: new Date('2026-10-12T15:00:00Z'), secret: 'server-secret-123', geo: { country: 'US', region: 'MD', city: 'Glen%20Burnie' }, body: { p: '/?utm=1', w: 390, t: true, r: 'google.com' } });
    eq(Object.keys(row).sort(), ['browser', 'city', 'country', 'device', 'os', 'path', 'referrer_host', 'region', 'visitor_hash'], 'columns'); eq(row.city, 'Glen Burnie'); eq(row.path, '/'); eq(row.device, 'Mobile Phone'); assert(!JSON.stringify(row).includes('9.9.9.9'), 'IP stored');
    eq(v.buildRow({ ua: UA.win, ip: '', now: new Date(), secret: 's'.repeat(10), geo: {}, body: { p: '/api/fifs' } }), null); eq(v.buildRow({ ua: UA.win, ip: '', now: new Date(), secret: 's'.repeat(10), geo: {}, body: {} }), null);
  });
  await test('Discord: one ping per visitor per 30 minutes, at most 20 per 10 minutes, and a visit repeating faster than a person is not counted at all', () => {
    const st = v.newThrottle(), t0 = 1_000_000;
    assert(v.shouldPing('h1', t0, st) && !v.shouldPing('h1', t0 + 60_000, st) && !v.shouldPing('h1', t0 + 29 * 60_000, st) && v.shouldPing('h1', t0 + 31 * 60_000, st), 'per visitor');
    const st2 = v.newThrottle(); let ok = 0; for (let i = 0; i < 40; i++) if (v.shouldPing('k' + i, t0 + i * 1000, st2)) ok++; eq(ok, 20, 'global cap'); assert(v.shouldPing('late', t0 + 11 * 60_000, st2), 'cap resets');
    const st3 = v.newThrottle(); let allowed = 0; for (let i = 0; i < 100; i++) if (v.allowVisit('same', t0 + i * 100, st3)) allowed++; eq(allowed, 40, 'flood limit'); assert(v.allowVisit('other', t0, st3), 'others unaffected');
  });
  await test('The Discord message shows device, place, page and where they came from (no IP, no hash)', () => {
    const d = v.discordFor({ visitor_hash: 'abcd1234abcd1234', device: 'Mobile Phone', browser: 'Safari', os: 'iOS', path: '/', referrer_host: null, country: 'US', region: 'MD', city: 'Baltimore' });
    const all = JSON.stringify(d); assert(/Mobile Phone/.test(all) && /Safari on iOS/.test(all) && /Baltimore, MD, US/.test(all) && /Direct/.test(all), all); assert(!/abcd1234/.test(all), 'hash leaked');
    assert(/Location unknown/.test(JSON.stringify(v.discordFor({ visitor_hash: null, device: 'Desktop / Laptop', browser: 'Chrome', os: 'Windows', path: '/x', referrer_host: 'google.com', country: null, region: null, city: null }))), 'unknown place');
  });
  await test('Telemetry numbers: page loads count every row (refreshes included), uniques are per day, devices are tallied, latest visits are listed', () => {
    const rows = [
      { created_at: '2026-10-12T15:00:00Z', device: 'Mobile Phone', visitor_hash: 'a', browser: 'Safari', os: 'iOS', path: '/', city: 'Baltimore', region: 'MD', country: 'US' },
      { created_at: '2026-10-12T15:01:00Z', device: 'Mobile Phone', visitor_hash: 'a', browser: 'Safari', os: 'iOS', path: '/' },
      { created_at: '2026-10-12T16:00:00Z', device: 'Desktop / Laptop', visitor_hash: 'b', browser: 'Chrome', os: 'Windows', path: '/' },
      { created_at: '2026-10-11T16:00:00Z', device: 'Desktop / Laptop', visitor_hash: 'b', browser: 'Chrome', os: 'Windows', path: '/' }, { created_at: '2026-10-11T17:00:00Z', device: 'Tablet / iPad', visitor_hash: null, browser: 'Safari', os: 'iOS', path: '/' }];
    const t = v.aggregate(rows, 3); eq(t.visits30, 5, 'every load'); eq(t.unique30, 3, 'a+b on the 12th, b on the 11th'); eq(t.devices, { 'Mobile Phone': 2, 'Tablet / iPad': 1, 'Desktop / Laptop': 2, 'Handheld PC': 0 }); eq(t.recent.length, 5); eq(t.recent[0].place, 'Baltimore, MD, US'); eq(t.visitsAll, 5, 'never below the 30-day count');
  });

  const calls = { inserts: [], pings: [], afterFns: [] }; let insertError = null; const origLoad = Module._load;
  const fakeNext = { NextRequest: class {}, NextResponse: class { constructor(b, i) { this.status = (i && i.status) || 200; } }, after: (fn) => { calls.afterFns.push(fn); } };
  Module._load = function (request, parent, ...rest) {
    if (request === 'next/server') return fakeNext;
    if (/Lib\/server\/supabase-admin$/.test(request)) return { getPrivilegedClient: () => ({ from: (t) => ({ insert: async (row) => { calls.inserts.push([t, row]); return { error: insertError }; } }) }) };
    if (/Lib\/server\/discord$/.test(request)) return { sendDiscordAlert: async (...a) => { calls.pings.push(a); return true; } };
    return origLoad.call(this, request, parent, ...rest);
  };
  const route = require(path.join(ROOT, 'src/app/api/visit/route.ts')); Module._load = origLoad;
  const mkReq = (body, headers = {}) => ({ headers: { get: (k) => ({ host: 'trainwithfifs.com', 'user-agent': UA.iphone, 'x-forwarded-for': '9.9.9.9, 10.0.0.1', 'x-vercel-ip-country': 'US', 'x-vercel-ip-country-region': 'MD', 'x-vercel-ip-city': 'Baltimore', ...headers })[k.toLowerCase()] ?? null }, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });
  const run = async (req) => { calls.afterFns = []; const r = await route.POST(req); for (const f of calls.afterFns) await f(); return r.status; };
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-secret-for-test'; process.env.VERCEL_ENV = 'production';
  await test('Route: a visit is saved and pinged; a hard refresh is saved again but not pinged again; always 204', async () => {
    eq(await run(mkReq({ p: '/', w: 390, t: true, r: 'google.com' })), 204); eq(calls.inserts.length, 1); eq(calls.inserts[0][0], 'site_visits'); eq(calls.pings.length, 1);
    assert(/Baltimore, MD, US/.test(JSON.stringify(calls.pings[0])) && !/9\.9\.9\.9/.test(JSON.stringify(calls.pings) + JSON.stringify(calls.inserts)), 'place yes, IP never');
    eq(await run(mkReq({ p: '/', w: 390, t: true })), 204); eq(calls.inserts.length, 2, 'refresh counted again'); eq(calls.pings.length, 1, 'no second ping');
  });
  await test('Route: bots, other websites, junk and oversized bodies are ignored (still 204, nothing saved or sent)', async () => {
    const before = [calls.inserts.length, calls.pings.length];
    eq(await run(mkReq({ p: '/' }, { 'user-agent': UA.bot })), 204); eq(await run(mkReq({ p: '/' }, { origin: 'https://evil.example' })), 204); eq(await run(mkReq('not json')), 204); eq(await run(mkReq({ p: '/' + 'x'.repeat(3000) })), 204); eq(await run(mkReq({ p: '/api/fifs' })), 204);
    eq([calls.inserts.length, calls.pings.length], before);
  });
  await test('Route: Discord pings are production-only, and a missing table never breaks the page (the ping still goes out)', async () => {
    process.env.VERCEL_ENV = 'preview'; const p0 = calls.pings.length; await run(mkReq({ p: '/' }, { 'x-forwarded-for': '5.5.5.5' })); eq(calls.pings.length, p0, 'no pings outside production');
    process.env.VERCEL_ENV = 'production'; insertError = { code: '42P01', message: 'relation "site_visits" does not exist' }; const w0 = console.warn; let warned = 0; console.warn = () => { warned++; };
    eq(await run(mkReq({ p: '/' }, { 'x-forwarded-for': '6.6.6.6' })), 204); console.warn = w0; eq(calls.pings.length, p0 + 1, 'ping still sent'); assert(warned <= 1, 'logged once at most');
  });
  await test('Wiring: the beacon is in the layout and sends only the path (no query, no cookies or storage); the API and admin panel use the same safe pieces; staff only', () => {
    const b = read('src/analytics/VisitBeacon.tsx'); assert(/window\.location\.pathname/.test(b) && !/location\.search|location\.hash|localStorage|sessionStorage|document\.cookie/.test(b) && /sendBeacon/.test(b), 'beacon'); assert(/<VisitBeacon \/>/.test(read('src/app/layout.tsx')), 'mounted once');
    const api = read('src/app/api/fifs/route.ts'); for (const a of ['getSiteTelemetry', 'resetTelemetry']) { const at = api.indexOf("case '" + a + "'"); assert(at > 0, a); assert(/isStaffOrAdmin\(user\)/.test(api.slice(at, at + 500)) && /status: 401/.test(api.slice(at, at + 500)), a + ' must be staff only'); }
    const st = read('src/portal/siteTelemetry.ts'); assert(/getSiteTelemetry/.test(st) && /fifs_pageviews_count/.test(st) && !/innerHTML/.test(st), 'admin panel'); assert(/installSiteTelemetry\(\)/.test(read('src/app/page.tsx')), 'installed');
    const sql = read('scripts/sql/20261012_site_visits.sql'); assert(/enable row level security/.test(sql) && /revoke all on public\.site_visits from anon, authenticated/.test(sql) && !/\bip\b|email/i.test(sql.replace(/--.*$/gm, '')), 'private table, no IP or email column');
  });
  await test('Admin panel: server numbers replace the tab-only counters, and an unready table is explained', () => {
    const st = require(path.join(ROOT, 'src/portal/siteTelemetry.ts')); const mem = {}; const store = { setItem: (k, val) => { mem[k] = val; } };
    eq(st.applyTelemetry({ ready: true, visits30: 12, unique30: 7, devices: { 'Mobile Phone': 9, 'Desktop / Laptop': 3 } }, store), true); eq(mem.fifs_pageviews_count, '12'); eq(mem.fifs_unique_visitors_count, '7'); eq(JSON.parse(mem.fifs_device_counts)['Mobile Phone'], 9);
    eq(st.applyTelemetry({ ready: false }, store), false); eq(st.applyTelemetry(null, store), false); assert(/Page Loads \(30 days, refreshes count\)/.test(read('public/scripts/TrainWithFIFS_scripts.js')), 'label says refreshes count');
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`); process.exit(failed ? 1 : 0);
})();
