/**
 * TrainWithFIFS - public bottom navigation: Home, Start, Book Now, Permits, My FIFS (offline)
 * Exactly five tabs; every link goes somewhere real; never on screen with the signed-in tab bar; staff are never sent into the Admin Hub; nothing stored or sent; 44px+ tabs.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const N = require(path.join(ROOT, 'src/shell/publicNavLogic.ts')); const LA = require(path.join(ROOT, 'src/pwa/launch.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const NOW = new Date('2026-10-22T16:00:00Z');
const store = (obj) => { const keys = Object.keys(obj); return { length: keys.length, key: (i) => keys[i] ?? null, getItem: (k) => (k in obj ? obj[k] : null) }; };
const login = (role, signedIn = '2026-10-20T12:00:00Z', extra = {}) => JSON.stringify({ access_token: 'x', user: { app_metadata: { role, ...extra }, last_sign_in_at: signedIn } });

(async () => {
  console.log('\n[The five tabs]');
  await test('exactly five tabs in this order, each with a label and a drawn icon, and every link is real', () => {
    eq(N.ITEMS.map((i) => i.key), ['home', 'start', 'book', 'permits', 'myfifs']); eq(N.ITEMS.map((i) => i.label), ['Home', 'Start', 'Book Now', 'Permits', 'My FIFS']); assert(N.ITEMS.every((i) => i.icon.length >= 1 && i.icon.every((d) => /^M/.test(d))), 'icons');
    for (const i of N.ITEMS) assert(i.href === '/' || i.href === '/permits' || /^\/\?open=[a-z]+$/.test(i.href), i.href);
  });
  await test('every ?open= word the bar uses is one the site\'s deep-link handler accepts, for every kind of visitor', () => {
    const words = [...N.ITEMS.map((i) => i.href), N.myFifsHref('student'), N.myFifsHref('client'), N.myFifsHref(null)].map((h) => (h.match(/open=([a-z]+)/) || [])[1]).filter(Boolean);
    for (const w of words) assert(LA.TARGETS.includes(w), w); eq(N.myFifsHref('client'), '/?open=client'); eq(N.myFifsHref('student'), '/?open=student'); eq(N.myFifsHref(null), '/?open=login');
    eq(N.ITEMS.find((i) => i.key === 'start').href, '/?open=start', 'Start opens the Start Here screen, not booking'); assert(LA.TARGETS.includes('start'), 'start is a deep-link word');
    assert(!words.includes('admin') && !words.includes('staff'), 'never an admin door');
  });

  console.log('\n[When it shows and which tab is current]');
  await test('it shows on the one-page site and the Permit Center only; never on payment or password-reset pages or other paths', () => {
    for (const p of ['/', '/permits', '/permits/maryland', '/permits/virginia']) assert(N.isPublicPath(p), p); for (const p of ['/pay-invoice', '/reset-password', '/permitsx', '/permits-evil', '/api/fifs', '/admin', '/manifest.webmanifest', '']) assert(!N.isPublicPath(p), p);
  });
  await test('it hides inside a signed-in dashboard (the signed-in tab bar is there instead), in the admin screen and during the intro, so two bars are never on screen together', () => {
    const base = { pathname: '/', view: 'home', dashboardOpen: false, booting: false }; assert(N.navVisible(base), 'home'); assert(N.navVisible({ ...base, view: 'portal' }), 'the portal sign-in screen keeps the bar'); assert(N.navVisible({ ...base, pathname: '/permits' }), 'permits');
    assert(!N.navVisible({ ...base, dashboardOpen: true }), 'dashboard'); assert(!N.navVisible({ ...base, view: 'admin' }), 'admin'); assert(!N.navVisible({ ...base, booting: true }), 'intro'); assert(!N.navVisible({ ...base, pathname: '/pay-invoice' }), 'pay page');
  });
  await test('the current tab follows the screen or the address; Start is the Start Here screen; Book Now is the booking screen; unlisted screens highlight nothing', () => {
    const a = (pathname, view) => N.activeFor({ pathname, view });
    eq(a('/', 'home'), 'home'); eq(a('/', ''), 'home'); eq(a('/', 'booking'), 'book'); eq(a('/', 'start'), 'start'); assert(!N.ITEMS.some((i) => i.key === 'classes'), 'no Classes tab any more'); eq(a('/', 'portal'), 'myfifs'); eq(a('/', 'fi-portal'), 'myfifs'); eq(a('/permits', 'home'), 'permits'); eq(a('/permits/maryland', 'home'), 'permits');
    for (const v of ['faq', 'about', 'testimonial', 'admin']) eq(a('/', v), null, v); eq(a('/pay-invoice', 'home'), null);
  });

  console.log('\n[My FIFS and the saved login]');
  await test('a saved student or client login goes to its own portal; staff, expired, future-dated, undated, malformed, roleless or missing logins get the portal chooser (never the Admin Hub)', () => {
    const k = 'sb-abc-auth-token';
    eq(N.savedPortal(store({ [k]: login('student') }), NOW), 'student'); eq(N.savedPortal(store({ [k]: login('client') }), NOW), 'client'); eq(N.savedPortal(store({ other: 'x', [k]: login('Client') }), NOW), 'client', 'role is case-insensitive');
    for (const bad of [login('admin'), login('staff'), login('instructor'), login('student', '2026-10-20T12:00:00Z', { is_admin: true }), login('student', '2026-08-01T00:00:00Z'), login('student', '2027-01-01T00:00:00Z'), login('student', ''), login(''), login(undefined), '{not json', 'null', JSON.stringify({ access_token: '', user: {} })]) eq(N.savedPortal(store({ [k]: bad }), NOW), null, bad.slice(0, 40));
    eq(N.savedPortal(store({}), NOW), null); eq(N.savedPortal(null, NOW), null); eq(N.savedPortal({ length: 1, key: () => { throw new Error('blocked'); }, getItem: () => null }, NOW), null);
  });

  console.log('\n[Wiring and look]');
  await test('it is mounted for every page, is a labelled navigation with real links and a marked current tab, and stores and sends nothing (it only reads the saved login)', () => {
    assert(/<PublicNav \/>/.test(read('src/app/layout.tsx')) && /import PublicNav from "\.\.\/shell\/PublicNav"/.test(read('src/app/layout.tsx')), 'mounted');
    const c = read('src/shell/PublicNav.tsx'); assert(/<nav className="fpn" aria-label="Main sections"/.test(c) && /<a key=\{it\.key\} className="fpn-tab" href=/.test(c) && /aria-current=\{snap\.active === it\.key \? 'page' : undefined\}/.test(c) && /aria-hidden="true"/.test(c) && /data-organic="skip"/.test(c), 'markup');
    const code = c.replace(/\/\/.*$/gm, ''); assert(!/innerHTML|dangerouslySetInnerHTML|setItem|removeItem|sessionStorage|document\.cookie|fetch\(|console\.|XMLHttpRequest|sendBeacon/.test(code), 'stores and sends nothing'); assert(/savedPortal\(window\.localStorage/.test(code), 'only reads the saved login');
    assert(/modified clicks keep the real link|e\.metaKey/.test(c) && /item\.key === 'permits'\) return/.test(c), 'real links stay real');
  });
  await test('it never shows with the signed-in tab bar: it checks the dashboards and that bar\'s marker, and hides itself', () => {
    const c = read('src/shell/PublicNav.tsx'); assert(/shown\('student-active-dashboard'\)/.test(c) && /shown\('client-active-dashboard'\)/.test(c) && /classList\.contains\('fifs-tabs-on'\)/.test(c), 'checks both'); assert(/fifs-tabs-on/.test(read('src/shell/tabShell.ts')), 'the signed-in bar sets that marker');
  });
  await test('phones only (899px and under); every tab is 56px tall and 44px+ wide with a visible focus ring, safe-area padding and no animation; the chat and text-size buttons ride above it and the page gets room', () => {
    const css = read('src/shell/publicNav.css').replace(/\/\*[\s\S]*?\*\//g, '');
    assert(/^\.fpn \{ display: none; \}/m.test(css) && /@media \(max-width: 899px\)/.test(css) && /grid-template-columns: repeat\(5, 1fr\)/.test(css) && /env\(safe-area-inset-bottom/.test(css), 'phone only grid');
    assert(/\.fpn-tab \{[^}]*min-width: 44px; min-height: 56px/.test(css), 'sizes'); assert(/:focus-visible \{ outline: 3px solid #00e5ff/.test(css), 'focus'); assert(!/animation|transition|@keyframes/.test(css), 'no motion'); assert(/#ffb703/.test(css) && /#00e5ff/.test(css) && /#080c12/.test(css), 'company colours');
    assert(/body\.fifs-pubnav-on #floatingCommWrapper, body\.fifs-pubnav-on \.fifs-float \{ transform: translateY/.test(css) && /body\.fifs-pubnav-on \{ padding-bottom: calc\(60px/.test(css), 'no overlap'); assert(/id="floatingCommWrapper"/.test(read('src/app/page.tsx')) && /fifs-float/.test(read('src/polish/polish.css')), 'the buttons it moves exist');
  });

  console.log(`\nPublic navigation: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
