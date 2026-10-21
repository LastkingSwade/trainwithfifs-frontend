// Offline support (offline): the service worker only ever touches public pages. It never intercepts the API, sign-in, password reset,
// payments, other sites, or any address that carries a token or code, and it never saves a response that says not to.
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..'); const R = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
const ORIGIN = 'https://example.test';
const SW = R('public/sw.js');

function makeWorker() {
  const listeners = {}; const store = new Map(); let claimed = false; let fetchImpl = async () => { throw new TypeError('offline'); }; const fetchLog = [];
  const keyOf = (r) => new URL(typeof r === 'string' ? r : r.url, ORIGIN).href;
  const mkCache = (name) => { if (!store.has(name)) store.set(name, new Map()); const m = store.get(name); return {
    async add(r) { const res = await fetchImpl(r); m.set(keyOf(r), res); },
    async put(r, res) { m.set(keyOf(r), res); },
    async match(r) { const x = m.get(keyOf(r)); return x ? x.clone() : undefined; },
    async keys() { return Array.from(m.keys()).map((u) => new Request(u)); },
    async delete(r) { return m.delete(keyOf(r)); },
  }; };
  const caches = {
    async open(name) { return mkCache(name); },
    async keys() { return Array.from(store.keys()); },
    async delete(name) { return store.delete(name); },
    async match(r, opts) { const names = opts && opts.cacheName ? [opts.cacheName] : Array.from(store.keys()); for (const n of names) { const x = store.get(n) && store.get(n).get(keyOf(r)); if (x) return x.clone(); } return undefined; },
  };
  const self = { location: { origin: ORIGIN }, addEventListener: (t, f) => { listeners[t] = f; }, clients: { claim: async () => { claimed = true; } } };
  // A real service worker resolves short addresses against its own location; Node's Request does not, so this wrapper does it.
  class SWRequest extends Request { constructor(u, init) { super(typeof u === 'string' ? new URL(u, ORIGIN).href : u, init); } }
  const ctx = { self, caches, fetch: (r) => { fetchLog.push(keyOf(r)); return fetchImpl(r); }, Request: SWRequest, Response, Headers, URL, Promise, setTimeout, clearTimeout, Array, Set, String, Error, TypeError, Math };
  vm.runInNewContext(SW, ctx);
  return {
    store, fetchLog, isClaimed: () => claimed, setFetch: (f) => { fetchImpl = f; },
    async install() { let p; listeners.install({ waitUntil: (x) => { p = x; } }); await p; },
    async activate() { let p; listeners.activate({ waitUntil: (x) => { p = x; } }); await p; },
    // returns the Response the worker answered with, or null when it did NOT intercept the request
    async request(url, init = {}, mode) { const req = new Request(url, init); if (mode) Object.defineProperty(req, 'mode', { value: mode }); let answered = null; listeners.fetch({ request: req, respondWith: (p) => { answered = p; } }); return answered ? await answered : null; },
    async message(data) { let p = Promise.resolve(); listeners.message({ data, waitUntil: (x) => { p = x; } }); await p; },
    cacheKeys(name) { return store.has(name) ? Array.from(store.get(name).keys()) : []; },
  };
}
const ok = (body, headers = {}, type = 'basic') => { const r = new Response(body, { status: 200, headers }); Object.defineProperty(r, 'type', { value: type }); return r; };
const bad = (status) => { const r = new Response('x', { status }); Object.defineProperty(r, 'type', { value: 'basic' }); return r; };

(async () => {
  console.log('\n[offline support: service worker]');
  await test('Install saves the offline page; update takes over on the next open (no skipWaiting), and old fifs- caches are removed on activate', async () => {
    const w = makeWorker(); w.setFetch(async () => ok('<html>offline</html>')); await w.install();
    assert(w.cacheKeys('fifs-shell-v1').includes(ORIGIN + '/offline.html'), 'offline page saved');
    // A new version waits for the next open. The one exception is the person tapping "Reload now" on the update notice: skipWaiting is allowed only inside the SKIP_WAITING message handler.
    const code = SW.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); const calls = code.match(/skipWaiting\(/g) || [];
    assert(calls.length === 1 && /data\.type === 'SKIP_WAITING'\) \{ self\.skipWaiting\(\); return; \}/.test(code), 'a new version must wait for the next open unless the person asks for it');
    assert(!/addEventListener\('install'[\s\S]{0,400}skipWaiting/.test(code) && !/addEventListener\('activate'[\s\S]{0,400}skipWaiting/.test(code), 'never on install or activate');
    w.store.set('fifs-static-v0', new Map([[ORIGIN + '/old.js', ok('old')]])); w.store.set('someone-elses-cache', new Map([['k', ok('keep')]]));
    await w.activate();
    assert(!w.store.has('fifs-static-v0') && w.store.has('someone-elses-cache') && w.isClaimed(), 'only our own old caches are deleted');
  });

  await test('NEVER intercepted: API calls, other sites (Stripe, Supabase), password reset, sign-in, token or code in the address, a login header, and every non-GET request', async () => {
    const w = makeWorker(); w.setFetch(async () => ok('x'));
    const never = [
      ['GET', ORIGIN + '/api/fifs'], ['POST', ORIGIN + '/api/fifs'], ['POST', ORIGIN + '/'], ['PUT', ORIGIN + '/scripts/TrainWithFIFS_scripts.js'],
      ['GET', 'https://js.stripe.com/v3/'], ['GET', 'https://abc.supabase.co/auth/v1/user'], ['GET', 'https://drive.google.com/thumbnail?id=1'],
      ['GET', 'https://other.test/_next/static/chunks/a.js'], ['GET', 'https://other.test/scripts/TrainWithFIFS_scripts.js'], ['GET', 'https://other.test/logo.png'],
      ['GET', ORIGIN + '/reset-password'], ['GET', ORIGIN + '/reset-password?x=1'], ['GET', ORIGIN + '/auth/callback'],
      ['GET', ORIGIN + '/?code=abc123'], ['GET', ORIGIN + '/?type=recovery'], ['GET', ORIGIN + '/?access_token=zzz'], ['GET', ORIGIN + '/?error=access_denied'],
      ['GET', ORIGIN + '/_next/static/chunks/a.js?token=1'], ['GET', ORIGIN + '/?_rsc=abc'],
    ];
    for (const [method, url] of never) assert((await w.request(url, { method })) === null, method + ' ' + url + ' must not be intercepted');
    assert((await w.request(ORIGIN + '/scripts/TrainWithFIFS_scripts.js', { headers: { Authorization: 'Bearer abc' } })) === null, 'a request carrying a login header is never intercepted');
    assert((await w.request(ORIGIN + '/scripts/TrainWithFIFS_scripts.js', { headers: { Range: 'bytes=0-9' } })) === null, 'range requests are left alone');
    assert((await w.request('https://other.test/', {}, 'navigate')) === null, 'a page on another site is never intercepted');
    assert((await w.request(ORIGIN + '/api/fifs', {}, 'navigate')) === null, 'even a page-style request to the API is left alone');
    assert(w.fetchLog.length === 0 && Array.from(w.store.keys()).length === 0, 'nothing was fetched or saved by the worker');
  });

  await test('Pages: online visitors always get the live page; offline they get the saved home page, or the friendly offline page; with nothing saved a plain 503', async () => {
    const w = makeWorker(); w.setFetch(async () => ok('<html>offline page</html>')); await w.install();
    w.setFetch(async () => ok('<html>HOME v1</html>')); let r = await w.request(ORIGIN + '/', {}, 'navigate'); assert((await r.text()) === '<html>HOME v1</html>', 'live page when online');
    assert(w.cacheKeys('fifs-shell-v1').includes(ORIGIN + '/'), 'home page saved');
    w.setFetch(async () => ok('<html>HOME v2</html>')); r = await w.request(ORIGIN + '/', {}, 'navigate'); assert((await r.text()) === '<html>HOME v2</html>', 'a newer page replaces the saved one');
    w.setFetch(async () => { throw new TypeError('offline'); });
    r = await w.request(ORIGIN + '/', {}, 'navigate'); assert((await r.text()) === '<html>HOME v2</html>', 'offline home page comes from the saved copy');
    r = await w.request(ORIGIN + '/?utm=x', {}, 'navigate'); assert((await r.text()) === '<html>HOME v2</html>', 'a harmless extra word in the address still gets the saved home page');
    r = await w.request(ORIGIN + '/somewhere-new', {}, 'navigate'); assert((await r.text()) === '<html>offline page</html>', 'an unsaved page shows the friendly offline page');
    const empty = makeWorker(); r = await empty.request(ORIGIN + '/', {}, 'navigate'); assert(r.status === 503, 'nothing saved at all: plain 503');
  });

  await test('A page with an extra word in the address never replaces the saved home page; a slow network (timeout) falls back to the saved copy', async () => {
    const w = makeWorker(); w.setFetch(async () => ok('OFFLINE')); await w.install();
    w.setFetch(async () => ok('HOME')); await w.request(ORIGIN + '/', {}, 'navigate');
    w.setFetch(async () => ok('SOMETHING ELSE')); await w.request(ORIGIN + '/?utm=x', {}, 'navigate');
    w.setFetch(async () => { throw new TypeError('offline'); }); const r = await w.request(ORIGIN + '/', {}, 'navigate'); assert((await r.text()) === 'HOME', 'only the plain home page is saved');
  });

  await test('Nothing is saved that should not be: no-store, private, cookies, errors, and responses from other origins are skipped', async () => {
    const w = makeWorker(); w.setFetch(async () => ok('offline')); await w.install();
    const cases = [ok('a', { 'Cache-Control': 'no-store' }), ok('b', { 'Cache-Control': 'private, max-age=0' }), ok('c', { 'Set-Cookie': 'a=b' }), bad(404), bad(500), ok('d', {}, 'cors'), ok('e', {}, 'opaque')];
    let i = 0; for (const res of cases) { w.setFetch(async () => res); await w.request(ORIGIN + '/_next/static/chunks/c' + (i++) + '.js'); }
    assert(w.cacheKeys('fifs-static-v1').length === 0, 'nothing from those cases may be stored: ' + w.cacheKeys('fifs-static-v1'));
    w.setFetch(async () => ok('fine', { 'Cache-Control': 'public, max-age=31536000, immutable' })); await w.request(ORIGIN + '/_next/static/chunks/good.js');
    assert(w.cacheKeys('fifs-static-v1').length === 1, 'a normal public file is stored');
  });

  await test('Build files are cache-first (second load needs no network); the site script is network-first (never an old copy while online, saved copy when offline or slow)', async () => {
    const w = makeWorker(); w.setFetch(async () => ok('offline')); await w.install();
    w.setFetch(async () => ok('chunk')); await w.request(ORIGIN + '/_next/static/chunks/main-abc.js'); const before = w.fetchLog.length;
    const r = await w.request(ORIGIN + '/_next/static/chunks/main-abc.js'); assert((await r.text()) === 'chunk' && w.fetchLog.length === before, 'served from the saved copy without the network');
    const S = ORIGIN + '/scripts/TrainWithFIFS_scripts.js';
    w.setFetch(async () => ok('script v1')); await w.request(S);
    w.setFetch(async () => ok('script v2')); let s = await w.request(S); assert((await s.text()) === 'script v2', 'online: the newest script, never the old one');
    w.setFetch(async () => { throw new TypeError('offline'); }); s = await w.request(S); assert((await s.text()) === 'script v2', 'offline: the saved script');
    w.setFetch(() => new Promise(() => {})); const t0 = Date.now(); s = await w.request(S); assert((await s.text()) === 'script v2' && Date.now() - t0 < 6000, 'a network that never answers falls back to the saved script');
    const g = ORIGIN + '/FIFS-34-State-Multi-Permit-SOP-Field-Guide.html'; w.setFetch(async () => ok('guide')); await w.request(g); w.setFetch(async () => { throw new TypeError('offline'); });
    assert((await (await w.request(g)).text()) === 'guide', 'the field guide opens offline once seen');
  });

  await test('The cache never grows past its limit', async () => {
    const w = makeWorker(); w.setFetch(async () => ok('offline')); await w.install(); w.setFetch(async () => ok('chunk'));
    for (let i = 0; i < 170; i++) await w.request(ORIGIN + '/_next/static/chunks/f' + i + '.js');
    assert(w.cacheKeys('fifs-static-v1').length === 150, 'trimmed to 150, got ' + w.cacheKeys('fifs-static-v1').length);
    assert(!w.cacheKeys('fifs-static-v1').includes(ORIGIN + '/_next/static/chunks/f0.js') && w.cacheKeys('fifs-static-v1').includes(ORIGIN + '/_next/static/chunks/f169.js'), 'oldest go first');
  });

  await test('The first-visit list: only the site\'s own build files and scripts are accepted; API, other sites, tokens, pages and nonsense are ignored', async () => {
    const w = makeWorker(); w.setFetch(async () => ok('offline')); await w.install(); w.setFetch(async (r) => ok('body of ' + new URL(typeof r === 'string' ? r : r.url, ORIGIN).pathname));
    await w.message({ type: 'CACHE_URLS', urls: ['/_next/static/chunks/ok1.js', ORIGIN + '/scripts/TrainWithFIFS_scripts.js', '/api/fifs', '/reset-password', 'https://js.stripe.com/v3/', 'https://evil.test/_next/static/x.js', '/_next/static/a.js?token=1', '/?code=1', '/dashboard', 'javascript:alert(1)', '', 42, null] });
    const keys = w.cacheKeys('fifs-static-v1').sort();
    assert(JSON.stringify(keys) === JSON.stringify([ORIGIN + '/_next/static/chunks/ok1.js', ORIGIN + '/scripts/TrainWithFIFS_scripts.js'].sort()), 'only the two allowed files: ' + keys);
    await w.message({ type: 'SOMETHING_ELSE', urls: ['/_next/static/z.js'] }); await w.message(null); await w.message({ type: 'CACHE_URLS', urls: 'nope' });
    assert(w.cacheKeys('fifs-static-v1').length === 2, 'other messages do nothing');
    const many = Array.from({ length: 200 }, (_, i) => '/_next/static/m' + i + '.js'); await w.message({ type: 'CACHE_URLS', urls: many });
    assert(w.cacheKeys('fifs-static-v1').length <= 82, 'one message can save at most 80 files');
  });

  console.log('\n[offline support: page, registration and settings]');
  const P = ts.transpileModule(R('src/pwa/swPlan.ts'), { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText; const pm = { exports: {} }; vm.runInNewContext(P, { module: pm, exports: pm.exports, URL, Array, Set });
  const { offlineUrlsFrom, shouldRegister } = pm.exports;
  await test('Registration: only on the real site (Production build), in a secure page, in a browser that supports it', () => {
    assert(shouldRegister('production', true, true) === true && shouldRegister('non-production', true, true) === false && shouldRegister(undefined, true, true) === false && shouldRegister('production', false, true) === false && shouldRegister('production', true, false) === false, 'only production + supported + secure');
    assert(offlineUrlsFrom(['https://example.test/_next/static/a.js', 'https://example.test/_next/static/a.js', 'https://example.test/scripts/TrainWithFIFS_scripts.js', 'https://example.test/api/fifs', 'https://other.test/_next/static/b.js', 'https://example.test/_next/static/c.js?token=1', 'https://example.test/auth/x', 'nonsense'], 'https://example.test').join(',') === '/_next/static/a.js,/scripts/TrainWithFIFS_scripts.js', 'first-visit list is filtered and de-duplicated');
  });
  await test('Wiring: registered once from the layout, the file is never cached by the browser, the existing offline banner is reused, offline page has no scripts and a way back', () => {
    const L = R('src/app/layout.tsx'), C = R('next.config.ts'), REG = R('src/pwa/ServiceWorkerRegister.tsx'), OFF = R('public/offline.html'), POL = R('src/polish/polish.ts');
    assert((L.match(/<ServiceWorkerRegister \/>/g) || []).length === 1, 'registered once');
    assert(/source: "\/sw\.js"[\s\S]{0,200}no-cache, no-store, must-revalidate/.test(C), 'sw.js is served with no-cache');
    assert(/register\('\/sw\.js', \{ scope: '\/' \}\)/.test(REG) && !/localStorage|sessionStorage|fetch\(|pwa-offline/.test(REG) && /You are offline/.test(POL), 'no storage, no network calls of its own, and no second offline banner');
    assert((OFF.match(/<script/gi) || []).length === 1 && !/<script[^>]+src=/i.test(OFF) && /<script>\s*(\/\/[^\n]*\n\s*)?window\.addEventListener\('online', function \(\) \{ location\.replace\('\/'\); \}\);\s*<\/script>/.test(OFF) && /href="\/"/.test(OFF) && /tel:4439901304/.test(OFF) && /<meta name="viewport"/.test(OFF) && /lang="en"/.test(OFF), 'offline page: only the one tiny "back online" script (no external file), Try again link, phone link, viewport');
  });
  console.log('\n[installable app: manifest, icons, page settings]');
  const { execSync } = require('child_process');
  const MS = ts.transpileModule(R('src/app/manifest.ts'), { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText; const mm = { exports: {} }; vm.runInNewContext(MS, { module: mm, exports: mm.exports });
  const MAN = mm.exports.default(); const LAYOUT = R('src/app/layout.tsx');
  const png = (rel) => { const b = fs.readFileSync(path.join(ROOT, rel)); assert(b.slice(0, 8).toString('hex') === '89504e470d0a1a0a', rel + ' must be a real PNG'); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), colorType: b[25], bytes: b.length }; };
  await test('Manifest: name, short name, start page, standalone window, and the site\'s dark colours', () => {
    assert(MAN.name === 'Train With FIFS' && MAN.short_name === 'FIFS' && MAN.short_name.length <= 12, 'names');
    assert(MAN.start_url === '/' && MAN.scope === '/' && MAN.id === '/' && MAN.display === 'standalone', 'opens the home page in its own window and stays inside the site');
    assert(MAN.theme_color === '#090d16' && MAN.background_color === '#090d16' && new RegExp('--bg-dark-core: ' + MAN.theme_color, 'i').test(R('src/app/globals.css')) && /themeColor: "#090d16"/.test(LAYOUT), 'colours match the site background and the page settings');
  });
  await test('Icons: 192 and 512 for every browser, a 512 maskable one with safe margin; the files exist, are real PNGs of the declared size, opaque and small', () => {
    const want = [['/icons/icon-192.png', 192, 'any'], ['/icons/icon-512.png', 512, 'any'], ['/icons/icon-maskable-512.png', 512, 'maskable']];
    assert(JSON.stringify(MAN.icons.map((i) => [i.src, parseInt(i.sizes, 10), i.purpose])) === JSON.stringify(want), 'icon list: ' + JSON.stringify(MAN.icons));
    for (const [src, size] of want) { const i = png('public' + src); assert(i.w === size && i.h === size, src + ' is ' + i.w + 'x' + i.h); assert(i.colorType !== 4 && i.colorType !== 6, src + ' must have no transparency (some phones paint it black)'); assert(i.bytes < 150000, src + ' is ' + i.bytes + ' bytes'); }
    assert(MAN.icons.every((i) => i.purpose !== 'any maskable'), 'no icon claims to be both: a maskable icon needs its own safe margin');
  });
  await test('iPhone and iPad: its own 180x180 icon, a short home-screen name, a solid status bar, and the page is never stretched under the notch', () => {
    const i = png('public/icons/apple-touch-icon.png'); assert(i.w === 180 && i.h === 180 && i.colorType !== 4 && i.colorType !== 6, 'apple icon is 180x180 and opaque');
    assert(/appleWebApp: \{ capable: true, title: "FIFS", statusBarStyle: "black", startupImage: STARTUP_IMAGES \}/.test(LAYOUT) && /url: "\/icons\/apple-touch-icon\.png"/.test(LAYOUT), 'apple settings');
    assert(!/viewportFit|viewport-fit/.test(LAYOUT), 'no viewport-fit=cover (it would draw the page under the notch and home bar)');
  });
  await test('The saved offline copy includes the manifest and icons, so the installed app opens with no signal', async () => {
    const w = makeWorker(); w.setFetch(async () => ok('offline')); await w.install();
    for (const f of ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/apple-touch-icon.png']) { w.setFetch(async () => ok('file ' + f)); await w.request(ORIGIN + f); }
    w.setFetch(async () => { throw new TypeError('offline'); });
    for (const f of ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/apple-touch-icon.png']) assert((await (await w.request(ORIGIN + f)).text()) === 'file ' + f, f + ' must open offline');
  });
  await test('Install banner tells the truth: no promise of offline checklist access, and it says what needs a connection', () => {
    const PAGE = R('src/app/page.tsx'); assert(!/instant, offline access/.test(PAGE) && /Pages you have already opened still load without a signal\. Signing in and your checklist need a connection\./.test(PAGE), 'banner wording');
  });
  await test('Locally installed agent skill folders are git-ignored, real project files are not', () => {
    const ign = (p) => { try { execSync('git check-ignore -q ' + JSON.stringify(p), { cwd: ROOT, stdio: 'ignore' }); return true; } catch (_e) { return false; } };
    for (const p of ['.agents/skills/x/SKILL.md', '.windsurf/rules/x.md', '.claude/skills/x/SKILL.md', 'skills/brandkit', 'skills-lock.json', '.github/skills/x', '.github/agents/x', '.kiro/steering/x']) assert(ign(p), p + ' must be ignored');
    for (const p of ['src/app/page.tsx', 'public/sw.js', 'public/icons/icon-512.png', 'scripts/test_pwa_sw.js', '.github/workflows/production-deployment-verification.yml', 'CLAUDE.md', 'package.json']) assert(!ign(p), p + ' must NOT be ignored');
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
