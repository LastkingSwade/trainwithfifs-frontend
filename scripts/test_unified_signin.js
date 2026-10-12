/**
 * TrainWithFIFS - one sign-in in the header (offline)
 * The email decides the portal; a wrong email and a wrong password look the same; nothing about an account is shown before the password is right; the
 * portal's own sign-in still runs (so first-login password screens and every other rule stay); staff are routed to the staff sign-in, never to a portal.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const u = require(path.join(ROOT, 'src/portal/unifiedSignIn.ts'));
let passed = 0, failed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log(`  ✓ PASS: ${name}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${name}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const session = (role, extra = {}) => ({ access_token: 'tok-1', user: { app_metadata: { ...(role === undefined ? {} : { role }), ...extra } } });
const mk = (sess, statuses = {}) => { const calls = { fetch: [], signOut: 0, signIn: [] }; return { calls, deps: {
  signIn: async (e, p) => { calls.signIn.push([e, p]); if (sess instanceof Error) throw sess; return sess; },
  fetchPortal: async (portal, token) => { calls.fetch.push([portal, token]); const s = statuses[portal]; if (s instanceof Error) throw s; return { status: s === undefined ? 404 : s }; },
  signOutLocal: async () => { calls.signOut++; } } }; };

(async () => {
  await test('Input check: needs an email with @ and a password; the email is trimmed and lower-cased; the password is kept exactly as typed', () => {
    eq(u.validateInput('', 'x'), { error: u.MSG.need }); eq(u.validateInput('a@b.co', ''), { error: u.MSG.need }); eq(u.validateInput('nope', 'x'), { error: u.MSG.need });
    eq(u.validateInput('  Dana@Example.COM ', '  pa ss  '), { email: 'dana@example.com', password: '  pa ss  ' });
  });
  await test('Routing by role: staff roles and is_admin go to staff; client and student go to their own; no role tries student, then client', () => {
    for (const r of ['admin', 'instructor', 'staff', 'ADMIN']) eq(u.routeOrder(session(r)), 'staff', r);
    eq(u.routeOrder(session(undefined, { is_admin: true })), 'staff'); eq(u.routeOrder({ user: { app_metadata: { is_admin: true } } }), 'staff');
    eq(u.routeOrder(session('client')), ['client']); eq(u.routeOrder(session('student')), ['student']); eq(u.routeOrder(session(undefined)), ['student', 'client']); eq(u.routeOrder(null), ['student', 'client']);
  });
  await test('A student email opens the student portal; a client email opens the client portal; a login with no role is found by asking the server (student first, then client)', async () => {
    let m = mk(session('student'), { student: 200 }); eq(await u.signInAndRoute(m.deps, 'a@b.co', 'pw'), { ok: true, portal: 'student' }); eq(m.calls.fetch, [['student', 'tok-1']]);
    m = mk(session('client'), { client: 200 }); eq(await u.signInAndRoute(m.deps, 'a@b.co', 'pw'), { ok: true, portal: 'client' }); eq(m.calls.fetch.length, 1);
    m = mk(session(undefined), { student: 404, client: 200 }); eq(await u.signInAndRoute(m.deps, 'a@b.co', 'pw'), { ok: true, portal: 'client' }); eq(m.calls.fetch.map((c) => c[0]), ['student', 'client']);
    m = mk(session(undefined), { student: 200 }); eq((await u.signInAndRoute(m.deps, 'a@b.co', 'pw')).portal, 'student');
  });
  await test('Staff are sent to the staff sign-in (no portal data is requested for them)', async () => {
    const m = mk(session('admin')); eq(await u.signInAndRoute(m.deps, 'kai@x.co', 'pw'), { ok: true, portal: 'staff' }); eq(m.calls.fetch, []);
  });
  await test('A wrong email and a wrong password get the very same message, and nothing is asked of the server', async () => {
    const m1 = mk(null), m2 = mk(null); const a = await u.signInAndRoute(m1.deps, 'known@x.co', 'bad'), b = await u.signInAndRoute(m2.deps, 'unknown@x.co', 'bad');
    eq(a, b); eq(a, { ok: false, message: u.MSG.wrong }); eq(m1.calls.fetch, []);
  });
  await test('A good login with no student or client profile is signed out again on this device and told to contact FIFS; a refused login is signed out too', async () => {
    let m = mk(session(undefined), { student: 404, client: 404 }); eq(await u.signInAndRoute(m.deps, 'a@b.co', 'pw'), { ok: false, message: u.MSG.none }); eq(m.calls.signOut, 1);
    m = mk(session('student'), { student: 401 }); eq((await u.signInAndRoute(m.deps, 'a@b.co', 'pw')).ok, false); eq(m.calls.signOut, 1);
    m = mk(session('student'), { student: 403 }); eq(m.calls.signOut, 0); await u.signInAndRoute(m.deps, 'a@b.co', 'pw'); eq(m.calls.signOut, 1);
  });
  await test('Offline or a server error never signs the person out and never throws; messages never contain the password or the email', async () => {
    let m = mk(session('student'), { student: new Error('boom') }); let r = await u.signInAndRoute(m.deps, 'secret@x.co', 'hunter2'); eq(r, { ok: false, message: u.MSG.server }); eq(m.calls.signOut, 0);
    m = mk(session('student'), { student: 500 }); r = await u.signInAndRoute(m.deps, 'secret@x.co', 'hunter2'); eq(r.message, u.MSG.server);
    m = mk(new Error('network')); r = await u.signInAndRoute(m.deps, 'secret@x.co', 'hunter2'); eq(r, { ok: false, message: u.MSG.unavailable });
    for (const msg of Object.values(u.MSG)) assert(!/hunter2|secret@x\.co/.test(msg), 'message leaks input');
  });
  await test('Hand-off: the portal\'s own sign-in function runs with the typed values (so first-login screens and saved-login rules still apply), then the password is cleared; panel text is textContent only; nothing stored or logged', () => {
    const h = u.HANDOFF; eq(h.student, { tab: 'portal', email: 'studentAuthInput', password: 'studentAuthPassword', run: 'lookupStudentAccount' }); eq(h.client.run, 'lookupClientAccount'); eq(h.staff.run, 'verifyAdminAccess');
    const src = read('src/portal/signInPanel.ts'); assert(/HANDOFF\[portal\]/.test(src) && /w\.openAndSwitch\(h\.tab\)/.test(src) && /w\[h\.run\]/.test(src), 'hand-off wiring');
    assert(/p\.value = ''/.test(src) && /pass\.value = ''/.test(src), 'password cleared'); assert(!/innerHTML/.test(src) && !/localStorage|sessionStorage|console\./.test(src), 'no html injection, storage or logging');
    assert(/autocomplete = 'current-password'/.test(src) && /autocomplete = 'username'/.test(src) && /aria-pressed/.test(src) && /role', 'alert'|'alert' : 'status'/.test(src), 'password-manager friendly, show/hide, announced errors');
  });
  await test('Header: signed out shows the single sign-in; signed in still shows the account panel; Escape and arrow keys behave; the page installs it', () => {
    const hp = read('src/portal/headerProfile.ts'); assert(/fifsRenderSignInPanel/.test(hp) && /Not you\? Sign out/.test(hp) && /classList\.contains\('hb-item'\)/.test(hp), 'header wiring');
    assert(/installSignInPanel\(\);[^;]*;?\s*installHeaderProfile\(\)|installSignInPanel\(\); installPasswordPeek\(\); installHeaderProfile\(\)/.test(read('src/app/page.tsx')), 'installed before the header profile');
    const css = read('src/portal/dashboard.css'); assert(/\.hb-input \{[^}]*min-height: 44px/.test(css) && /\.hb-go \{[^}]*min-height: 48px/.test(css) && /\.hb-show \{[^}]*min-height: 44px/.test(css), '44px+ targets');
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`); process.exit(failed ? 1 : 0);
})();
