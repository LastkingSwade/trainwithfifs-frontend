// Stay signed in (offline): a saved login brings the student's or client's portal back, within 30 days, never for staff, never over the first-login screen.
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..'); const R = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
const m = { exports: {} }; vm.runInNewContext(ts.transpileModule(R('src/portal/sessionRestore.ts'), { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, window: undefined, Date, Number, String, Math, Promise, setTimeout, Array, Object, document: undefined, location: undefined });
const S = m.exports;
const NOW = new Date('2026-10-12T15:00:00Z'); const daysAgo = (d) => new Date(NOW.getTime() - d * 86400000).toISOString();
const sess = (role, signedIn, extra = {}) => ({ access_token: 'tok-abc', user: { id: 'u1', app_metadata: role ? { role } : {}, last_sign_in_at: signedIn, ...extra } });

function deps(over = {}) {
  const log = { fetches: [], signOuts: 0, applied: [], opened: [], sessions: 0 };
  const d = {
    now: () => NOW, getSession: async () => { log.sessions++; return over.session === undefined ? sess('student', daysAgo(2)) : over.session; },
    signOutLocal: async () => { log.signOuts++; }, hasPortalRecord: () => !!over.hasRecord,
    fetchPortal: async (portal, token) => { log.fetches.push([portal, token]); const r = (over.answers || {})[portal]; if (typeof r === 'function') return r(); if (over.throwFetch) throw new TypeError('offline'); return r || { status: 404, body: { success: false } }; },
    apply: (portal, rec) => { log.applied.push([portal, rec]); }, autoOpen: (portal) => { log.opened.push(portal); return !!over.standalone; },
  };
  return { d, log };
}
const STUDENT = { studentId: 'FIFS-1001', fullName: 'Alice Student', mustChangePassword: false }; const CLIENT = { clientId: 'CLI-1', fullName: 'Marcus Client' };
const ok = (k, v) => ({ status: 200, body: { success: true, [k]: v } });

(async () => {
  console.log('\n[stay signed in: the rules]');
  await test('Plan: a student or client login within 30 days is restored; the exact 30th day still counts; 31 days is cleared; a missing or future sign-in date is cleared', () => {
    assert(S.MAX_AGE_DAYS === 30, '30 days (the owner\'s choice)');
    assert(JSON.stringify(S.planRestore(sess('student', daysAgo(5)), NOW)) === '{"action":"restore","order":["student"]}', 'student');
    assert(JSON.stringify(S.planRestore(sess('client', daysAgo(5)), NOW)) === '{"action":"restore","order":["client"]}', 'client');
    assert(JSON.stringify(S.planRestore(sess('', daysAgo(1)), NOW)) === '{"action":"restore","order":["student","client"]}', 'no role: student first, then client');
    assert(S.planRestore(sess('student', daysAgo(30)), NOW).action === 'restore', 'day 30');
    const old = S.planRestore(sess('student', daysAgo(31)), NOW); assert(old.action === 'clear' && old.reason === 'too-old', '31 days');
    assert(S.planRestore(sess('student', ''), NOW).reason === 'no-date' && S.planRestore(sess('student', 'garbage'), NOW).reason === 'no-date', 'unreadable date');
    assert(S.planRestore(sess('student', new Date(NOW.getTime() + 3600000).toISOString()), NOW).reason === 'future' && S.planRestore(sess('student', new Date(NOW.getTime() + 60000).toISOString()), NOW).action === 'restore', 'a clock a minute off is fine, an hour ahead is not');
  });
  await test('Plan: staff are never restored (admin, instructor, staff roles and the admin flag), and no session or no token means nothing to do', () => {
    for (const r of ['admin', 'instructor', 'staff', 'ADMIN']) assert(S.planRestore(sess(r, daysAgo(1)), NOW).action === 'none', r + ' must not be restored');
    assert(S.planRestore({ access_token: 't', user: { app_metadata: { is_admin: true }, last_sign_in_at: daysAgo(1) } }, NOW).action === 'none', 'admin flag');
    assert(S.planRestore(null, NOW).action === 'none' && S.planRestore({}, NOW).action === 'none' && S.planRestore({ user: { app_metadata: {} } }, NOW).action === 'none', 'nothing saved');
  });
  await test('Server answers: 200 restores, 401/403 clear the saved login, 404 tries the next portal, anything else (offline, busy) stops quietly and keeps the login', () => {
    assert(S.classify(200) === 'ok' && S.classify(401) === 'clear' && S.classify(403) === 'clear' && S.classify(404) === 'next' && S.classify(500) === 'stop' && S.classify(503) === 'stop' && S.classify(0) === 'stop' && S.classify(429) === 'stop', 'classification');
  });
  await test('Auto-open: a signed-in person (installed app or normal tab) goes straight to their portal from a plain home screen; never over a deep link, a reset link, the boot intro, Hack Detected, or a visitor already somewhere else', () => {
    const base = { standalone: true, pathname: '/', hash: '', search: '', view: 'home', booting: false, hacking: false };
    assert(S.shouldAutoOpen(base) === true && S.shouldAutoOpen({ ...base, hash: '#' }) === true && S.shouldAutoOpen({ ...base, view: '' }) === true && S.shouldAutoOpen({ ...base, standalone: false }) === true, 'plain home, installed app or normal tab');
    for (const [k, v] of [['pathname', '/reset-password'], ['hash', '#enrollment'], ['search', '?code=abc'], ['search', '?gcode=ABC'], ['view', 'booking'], ['booting', true], ['hacking', true]]) assert(S.shouldAutoOpen({ ...base, [k]: v }) === false, k + '=' + v + ' must not auto-open');
  });

  console.log('\n[stay signed in: the whole flow]');
  await test('Student: the record comes back, is applied once, and a normal tab only restores while the installed app opens the portal', async () => {
    let { d, log } = deps({ answers: { student: ok('student', STUDENT) } }); let out = await S.restoreSession(d);
    assert(out === 'restored' && log.applied.length === 1 && log.applied[0][0] === 'student' && log.applied[0][1].studentId === 'FIFS-1001' && log.fetches.length === 1 && log.signOuts === 0, 'restored: ' + out);
    ({ d, log } = deps({ standalone: true, answers: { student: ok('student', STUDENT) } })); out = await S.restoreSession(d); assert(out === 'opened' && log.opened[0] === 'student', 'installed app opens the portal');
  });
  await test('Requests carry only the login: the saved token goes to the server, never an id or email chosen by the page', async () => {
    const { d, log } = deps({ answers: { student: ok('student', STUDENT) } }); await S.restoreSession(d);
    assert(log.fetches.length === 1 && log.fetches[0].length === 2 && log.fetches[0][1] === 'tok-abc', 'portal name and token only: ' + JSON.stringify(log.fetches));
  });
  await test('Client login: only the client portal is asked; a client with no role label: student 404 then client 200 restores the client; a student that answers 200 stops the search', async () => {
    let { d, log } = deps({ session: sess('client', daysAgo(3)), answers: { client: ok('client', CLIENT) } }); let out = await S.restoreSession(d);
    assert(out === 'restored' && log.fetches.map((f) => f[0]).join() === 'client' && log.applied[0][0] === 'client', 'client only');
    ({ d, log } = deps({ session: sess('', daysAgo(3)), answers: { student: { status: 404, body: { success: false } }, client: ok('client', CLIENT) } })); out = await S.restoreSession(d);
    assert(out === 'restored' && log.fetches.map((f) => f[0]).join() === 'student,client' && log.applied.length === 1 && log.applied[0][0] === 'client', 'falls through to client');
    ({ d, log } = deps({ session: sess('', daysAgo(3)), answers: { student: ok('student', STUDENT), client: ok('client', CLIENT) } })); await S.restoreSession(d);
    assert(log.applied.length === 1 && log.applied[0][0] === 'student' && log.fetches.length === 1, 'only one portal is ever restored');
  });
  await test('Refusals: 401 or 403 clear the saved login on this device and restore nothing; an old login is cleared without asking the server', async () => {
    for (const status of [401, 403]) { const { d, log } = deps({ answers: { student: { status, body: { success: false } } } }); const out = await S.restoreSession(d); assert(out === 'cleared' && log.signOuts === 1 && log.applied.length === 0, status + ' -> ' + out); }
    const { d, log } = deps({ session: sess('student', daysAgo(45)) }); const out = await S.restoreSession(d); assert(out === 'cleared' && log.signOuts === 1 && log.fetches.length === 0 && log.applied.length === 0, 'too old: ' + out);
  });
  await test('Offline or server trouble keeps the saved login and shows nothing wrong (no sign-out, nothing applied)', async () => {
    for (const over of [{ throwFetch: true }, { answers: { student: { status: 500, body: null } } }, { answers: { student: { status: 503, body: { success: false } } } }]) { const { d, log } = deps(over); const out = await S.restoreSession(d); assert(out === 'kept' && log.signOuts === 0 && log.applied.length === 0, JSON.stringify(over) + ' -> ' + out); }
  });
  await test('A student on a temporary password still goes through the first-login screen: nothing is restored and the login is left alone', async () => {
    const { d, log } = deps({ answers: { student: ok('student', { ...STUDENT, mustChangePassword: true }) } }); const out = await S.restoreSession(d);
    assert(out === 'skipped' && log.applied.length === 0 && log.signOuts === 0, out);
  });
  await test('Staff, signed-out browsers and people who already signed in by hand are never touched: no server call, no sign-out, nothing applied', async () => {
    let { d, log } = deps({ session: sess('instructor', daysAgo(1)) }); assert((await S.restoreSession(d)) === 'none' && log.fetches.length === 0 && log.signOuts === 0 && log.applied.length === 0, 'staff');
    ({ d, log } = deps({ session: null })); assert((await S.restoreSession(d)) === 'none' && log.fetches.length === 0 && log.signOuts === 0, 'nothing saved');
    ({ d, log } = deps({ hasRecord: true })); assert((await S.restoreSession(d)) === 'skipped' && log.sessions === 0 && log.fetches.length === 0, 'already signed in by hand: not even asked');
    let first = true; ({ d, log } = deps({ answers: { student: () => ok('student', STUDENT) } })); d.hasPortalRecord = () => { const v = !first; first = false; return v; };
    assert((await S.restoreSession(d)) === 'skipped' && log.applied.length === 0, 'they signed in by hand while we were asking');
    ({ d, log } = deps({})); d.getSession = async () => { throw new Error('storage blocked'); }; assert((await S.restoreSession(d)) === 'none', 'a broken session read is contained');
  });

  console.log('\n[stay signed in: wiring and safety]');
  await test('Wiring: starts once, only after the page has loaded, gone idle and the boot intro is over; has an off switch; uses only the two existing own-record routes; stores and logs nothing', () => {
    const SRC = R('src/portal/sessionRestore.ts'), C = R('src/portal/RestoreSession.tsx'), L = R('src/app/layout.tsx'), CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert((L.match(/<RestoreSession \/>/g) || []).length === 1 && L.indexOf('<RestoreSession />') > L.indexOf('{children}'), 'mounted once after the page');
    assert(/readyState === 'complete'/.test(C) && /requestIdleCallback/.test(C) && /data-boot/.test(C) && /setTimeout\(async/.test(C), 'waits for load, idle and the boot intro');
    assert(/__fifsNoRestore/.test(SRC) && /__fifsSessionRestoreRan/.test(SRC), 'off switch and runs once');
    const actions = CODE.match(/'get(Student|Client)PortalData'/g) || []; assert(actions.length === 2 && !/identifier|studentId|clientId|email/.test(CODE.split('body: JSON.stringify')[1].split(')')[0]), 'only the two own-record routes, with no id in the request');
    assert(!/console\.|localStorage|sessionStorage|document\.cookie|indexedDB/.test(CODE), 'nothing logged or stored');
    assert(/openAndSwitch\(portal === 'student' \? 'portal' : 'fi-portal'\)/.test(SRC), 'opens the right portal');
  });
  await test('A way out stays visible: the header profile menu shows "Not you? Sign out" for any portal that is signed in, wired to the real sign-out buttons', () => {
    const H = R('src/portal/headerProfile.ts'); assert(/Not you\? Sign out/.test(H) && /w\.logoutStudent/.test(H) && /w\.fiLogoutClient/.test(H) && /if \(on\)/.test(H), 'sign-out row for signed-in portals');
    assert(/function fifsSignOutSupabase/.test(R('public/scripts/TrainWithFIFS_scripts.js')), 'and those sign-outs clear the saved login on this device');
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
