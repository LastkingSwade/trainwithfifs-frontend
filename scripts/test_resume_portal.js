/**
 * TrainWithFIFS - a signed-in student or client skips the intro and lands in their portal (offline)
 * The page's first script decides from the saved login alone (no network): student or client, signed in within 30 days, never staff. The intro still plays for everyone else.
 * A short "Opening your portal" cover replaces the home page until the portal is open, and always comes down.
 */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const CFG = require(path.join(ROOT, 'src/boot/bootConfig.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const DAY = 86400000;

// Runs the real gate script in a tiny fake page and returns what it did.
function gate({ path: p = '/', hash = '', search = '', store = {}, reduced = false, ua = 'Mozilla/5.0 (iPhone)', throws = false } = {}) {
  const attrs = {}; const timers = []; const events = [];
  const d = { setAttribute: (k, v) => { attrs[k] = v; }, removeAttribute: (k) => { delete attrs[k]; }, hasAttribute: (k) => k in attrs };
  const keys = Object.keys(store); const ls = { get length() { return keys.length; }, key: (i) => keys[i], getItem: (k) => store[k] };
  const win = { matchMedia: () => ({ matches: reduced }), dispatchEvent: (e) => events.push(e.type), Event: class { constructor(t) { this.type = t; } } };
  const ctx = { document: { documentElement: d }, location: { pathname: p, hash, search }, navigator: { userAgent: ua }, window: win, matchMedia: win.matchMedia, setTimeout: (f, ms) => { timers.push([f, ms]); return timers.length; }, Event: win.Event, Date, JSON, String, isFinite, RegExp };
  Object.defineProperty(ctx, 'localStorage', { get() { if (throws) throw new Error('blocked'); return ls; } }); vm.runInNewContext(CFG.BOOT_GATE_SCRIPT, ctx);
  return { attrs, timers, events, fire: () => timers.forEach(([f]) => f()) };
}
const session = (role, daysAgo, extra = {}) => ({ access_token: 'tok', refresh_token: 'r', user: { app_metadata: role === null ? {} : { role }, last_sign_in_at: new Date(Date.now() - daysAgo * DAY).toISOString(), ...extra } });
const store = (v, key = 'sb-abcdefg-auth-token') => ({ [key]: JSON.stringify(v), other: 'x' });

(async () => {
  console.log('\n[Who skips the intro]');
  await test('a student or client signed in within 30 days: their own "Welcome Back Agent" intro (not the normal one); with reduced motion only a still cover; both safety timers are set', () => {
    const own = { 'data-resume': 'on', 'data-boot': 'on' };
    for (const role of ['student', 'client', 'Student', null]) { const g = gate({ store: store(session(role, 3)) }); eq(g.attrs, own, String(role)); eq(g.timers.map((t) => t[1]), [CFG.BOOT.resumeFailsafeMs, CFG.BOOT.failsafeMs]); g.fire(); eq(g.attrs, {}, 'both marks are removed by the timers'); eq(g.events, ['fifs:boot-complete'], 'the page is told the intro is over'); }
    eq(gate({ store: store(session('student', 29.5)) }).attrs, own); eq(gate({ store: store(session('student', 3), 'sb-localtest-auth-token') }).attrs, own, 'any project name');
    const calm = gate({ store: store(session('student', 3)), reduced: true }); eq(calm.attrs, { 'data-resume': 'on' }, 'reduced motion: no intro, only the still cover'); eq(calm.timers.map((t) => t[1]), [CFG.BOOT.resumeFailsafeMs]);
  });
  await test('everyone else still gets the intro: staff, an old login, a future date, no token, damaged data, blocked storage, a different key', () => {
    const intro = (o) => { const g = gate(o); eq(g.attrs, { 'data-boot': 'on' }); };
    for (const role of ['admin', 'instructor', 'staff', 'ADMIN']) intro({ store: store(session(role, 1)) }); intro({ store: store(session('student', 1, { app_metadata: { role: 'student', is_admin: true } })) });
    intro({ store: store(session('student', 31)) }); intro({ store: store(session('student', -1)) }); intro({ store: store({ ...session('student', 3), access_token: '' }) }); intro({ store: store({ access_token: 't' }) }); intro({ store: store({ ...session('student', 3), user: { app_metadata: {}, last_sign_in_at: 'nonsense' } }) });
    intro({ store: { 'sb-x-auth-token': '{not json' } }); intro({ store: {} }); intro({ store: store(session('student', 3), 'some-other-key') }); intro({ store: store(session('student', 3), 'sb-x-auth-token-code-verifier') }); intro({ store: store(session('student', 3)), throws: true });
  });
  await test('the saved-login check changes nothing about when the intro is skipped for other reasons: other pages, deep links, reset links, group codes and bots never get either screen', () => {
    for (const o of [{ path: '/reset-password' }, { path: '/missed-the-target' }, { hash: '#enrollment' }, { search: '?code=abc' }, { search: '?gcode=FIFS-POD-AB12' }, { hash: '#access_token=x&type=recovery' }]) eq(gate({ ...o, store: store(session('student', 3)) }).attrs, {}, JSON.stringify(o));
    eq(gate({ store: {}, ua: 'Googlebot/2.1' }).attrs, {}, 'bots'); eq(gate({ store: {}, reduced: true }).attrs, {}, 'reduced motion with nobody signed in'); eq(gate({ store: {} }).attrs, { 'data-boot': 'on' }); assert(gate({ store: {} }).timers.some((t) => t[1] === CFG.BOOT.failsafeMs), 'the old failsafe is kept');
  });

  console.log('\n[Straight to the portal]');
  await test('the restore starts at once for a returning person, always takes the cover down, and a normal tab (not only the installed app) is sent to the portal', () => {
    const rs = read('src/portal/RestoreSession.tsx'), sr = read('src/portal/sessionRestore.ts'), css = read('src/boot/boot.css');
    assert(/hasAttribute\('data-resume'\)\) \{ void installSessionRestore\(\)\.finally\(\(\) => \{ if \(!cancelled\) installLaunchTargets\(\); \}\); return; \}/.test(rs), 'starts at once');
    assert(/try \{ return await runSessionRestore\(\); \} finally \{ try \{ document\.documentElement\.removeAttribute\('data-resume'\)/.test(sr), 'always takes the cover down'); assert(/export function shouldAutoOpen\(i: AutoOpenInput\): boolean \{ return i\.pathname === '\/'/.test(sr) && !/i\.standalone && i\.pathname/.test(sr), 'a normal tab is sent too');
    assert(/i\.standalone && shouldAutoOpen\(i\)/.test(sr), 'the sign-in screen is still only opened by the installed app, never for a signed-out visitor in a normal tab');
    const cover = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)', css.indexOf('Opening your portal') - 900));
    assert(/@media \(prefers-reduced-motion: reduce\) \{\s*html\[data-resume\]:not\(\[data-boot\]\)::after \{[^}]*pointer-events: none[^}]*\}/.test(css) && /Opening your portal/.test(css) && !/animation/.test(cover), 'a still cover, only for reduced motion, that never takes a tap');
    assert(/booting: root\.hasAttribute\('data-boot'\) && !root\.hasAttribute\('data-resume'\)/.test(sr), 'the portal opens behind the returning-person intro');
  });
  await test('staff are never sent anywhere automatically, a temporary-password student still goes through the first-login screen, a refused or old login is cleared, and nothing new is stored', () => {
    const sr = read('src/portal/sessionRestore.ts'); const code = sr.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert(/STAFF_ROLES\.includes\(role\) \|\| meta\.is_admin === true\) return \{ action: 'none' \}/.test(sr) && /record\.mustChangePassword === true\) return 'skipped'/.test(sr) && /classify\(r\.status\)/.test(sr), 'the existing safeguards are untouched'); assert(!/localStorage\.setItem|sessionStorage|document\.cookie|indexedDB|console\./.test(code), 'nothing stored or logged');
    const gateCode = CFG.BOOT_GATE_SCRIPT; assert(!/setItem|fetch\(|XMLHttpRequest|sendBeacon|cookie/.test(gateCode), 'the first script only reads whether a login exists');
  });
  console.log('\n[Welcome Back Agent]');
  await test('the name is the first word of the full name on their own record, plain text, capped, and empty when there is none', () => {
    const { firstName, nameFromPortals } = require(path.join(ROOT, 'src/boot/welcomeBack.ts'));
    eq(firstName({ fullName: 'Kai Wade' }), 'Kai'); eq(firstName({ fullName: '  maria   de la Cruz ' }), 'maria'); eq(firstName({ fullName: '<img src=x onerror=1>Bob' }), 'img'); eq(firstName({ fullName: 'A'.repeat(80) }).length, 24);
    for (const bad of [null, undefined, 5, 'x', {}, { fullName: null }, { fullName: '   ' }]) eq(firstName(bad), '', String(bad));
    eq(nameFromPortals({}), ''); eq(nameFromPortals({ __fifsClientPortalRecord: { fullName: 'Dana Lee' } }), 'Dana'); eq(nameFromPortals({ __fifsStudentPortalRecord: { fullName: 'Sam Roe' }, __fifsClientPortalRecord: { fullName: 'Dana Lee' } }), 'Sam');
  });
  await test('the returning-person intro types "Welcome Back Agent" then the name (as text, in the business colour), waits a bounded time for it, then shares the normal glitch, dissolve and CRT ending', () => {
    const bi = read('src/boot/BootIntro.tsx'), cfg = read('src/boot/bootConfig.ts');
    assert(/BOOT_WELCOME_BACK = 'Welcome Back Agent'/.test(cfg), 'text'); assert(/const resume = root\.hasAttribute\('data-resume'\)/.test(bi) && /typeOut\(BOOT_WELCOME_BACK/.test(bi) && /nameFromPortals\(window/.test(bi), 'wiring');
    assert(/BOOT\.nameWaitMs/.test(bi) && /else afterWelcome\(\)/.test(bi), 'bounded wait, then carries on without a name'); assert(!/dangerouslySetInnerHTML|innerHTML/.test(bi), 'the name is only ever text');
    assert(/i >= welcome\.length \? ' boot-brand'/.test(bi), 'the name is in the business colour');
  });
  console.log(`\nResume portal: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
