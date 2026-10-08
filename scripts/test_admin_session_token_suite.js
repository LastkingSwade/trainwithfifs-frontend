/**
 * TrainWithFIFS - Offline Admin-Session Token Suite
 *
 * Regression tests for "Unauthorized: Staff or administrator authentication required." on Admin Hub actions
 * such as Send Direct Portal Invitation. The browser dispatcher used a session snapshot taken at sign-in;
 * once Supabase refreshed the session (tokens last about an hour) the snapshot expired and the server
 * rejected it. The dispatcher must send the refreshed token, and must never decide who is authorized.
 *
 * The real dispatcher code is read from public/scripts/TrainWithFIFS_scripts.js and run in a sandbox with a
 * fake fetch and a fake Supabase client. Nothing is sent anywhere and no user or email is created.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = fs.readFileSync(path.join(ROOT, 'public/scripts/TrainWithFIFS_scripts.js'), 'utf-8');

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ PASS: ${name}`); }
  catch (e) { failed++; console.log(`  ✗ FAIL: ${name}\n      ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

// Extract the real dispatcher (token resolver + callFifsBackend) from the browser script.
const startMarker = 'function fifsResolveBearerToken(';
const endMarker = 'window.callFifsBackend = callFifsBackend;';
const startIdx = SCRIPT.indexOf(startMarker);
const endIdx = SCRIPT.indexOf(endMarker, startIdx);
if (startIdx < 0 || endIdx < 0) { console.error('Could not find the dispatcher in the browser script.'); process.exit(1); }
const DISPATCHER = SCRIPT.slice(startIdx, endIdx + endMarker.length);

/** Builds a fresh sandboxed "browser" and returns helpers to call the dispatcher and inspect the request. */
function browser({ staff, student, client, live, liveThrows = false, response = { ok: true, status: 200, body: { success: true } } } = {}) {
  const requests = [];
  const win = {};
  if (staff) win.__fifsStaffSession = staff;
  if (student) win.__fifsStudentSession = student;
  if (client) win.__fifsClientSession = client;
  if (live !== undefined || liveThrows) {
    win.supabaseClient = { auth: { getSession: () => (liveThrows ? Promise.reject(new Error('storage unavailable')) : Promise.resolve({ data: { session: live } })) } };
  }
  const sandbox = {
    window: win, console: { error() {}, warn() {}, log() {} }, Promise, Object, JSON,
    fetch: async (url, init) => {
      requests.push({ url, headers: init.headers, body: JSON.parse(init.body) });
      return { ok: response.ok, status: response.status, json: async () => response.body };
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(DISPATCHER, sandbox);
  return {
    win, requests,
    call: (action, payload, onSuccess, onError) => sandbox.window.callFifsBackend(action, payload, onSuccess, onError),
    auth: () => requests[requests.length - 1] && requests[requests.length - 1].headers['Authorization']
  };
}
const session = (userId, token) => ({ access_token: token, user: { id: userId } });
const INVITE = { portalType: 'student', generatedId: 'FIFS-1234', fullName: 'New Student', email: 'new.student@example.test', phone: '', course: 'Maryland Wear & Carry', dates: 'Upcoming Cohort' };

async function main() {
  console.log('\n[SECTION A: A stale staff snapshot is replaced by the refreshed session]');
  await test('Invite sends the refreshed token when the sign-in snapshot has expired (the reported bug)', async () => {
    const b = browser({ staff: session('admin-1', 'EXPIRED-SNAPSHOT'), live: session('admin-1', 'REFRESHED-TOKEN') });
    await b.call('adminDirectInvite', INVITE);
    assert(b.auth() === 'Bearer REFRESHED-TOKEN', `sent ${b.auth()}`);
    assert(b.win.__fifsStaffSession.access_token === 'REFRESHED-TOKEN', 'the snapshot must be updated for later calls');
    assert(b.requests[0].body.action === 'adminDirectInvite' && b.requests[0].body.email === INVITE.email, 'the invitation payload must be sent unchanged');
  });
  await test('A different signed-in user is never swapped in for the staff snapshot', async () => {
    const b = browser({ staff: session('admin-1', 'STAFF-TOKEN'), live: session('student-9', 'STUDENT-LIVE-TOKEN') });
    await b.call('adminDirectInvite', INVITE);
    assert(b.auth() === 'Bearer STAFF-TOKEN', `sent ${b.auth()}`);
    assert(b.win.__fifsStaffSession.access_token === 'STAFF-TOKEN', 'the staff snapshot must be left alone');
  });
  await test('If the client cannot be read (rejects or is absent), the snapshot token is still used', async () => {
    const rejecting = browser({ staff: session('admin-1', 'STAFF-TOKEN'), liveThrows: true });
    await rejecting.call('getAdminDashboardData', {});
    assert(rejecting.auth() === 'Bearer STAFF-TOKEN', `rejecting client sent ${rejecting.auth()}`);
    const absent = browser({ staff: session('admin-1', 'STAFF-TOKEN') });
    await absent.call('getAdminDashboardData', {});
    assert(absent.auth() === 'Bearer STAFF-TOKEN', `absent client sent ${absent.auth()}`);
  });

  console.log('\n[SECTION B: Other session sources keep working]');
  await test('With no staff snapshot, a restored live session is used (page reload with a saved sign-in)', async () => {
    const b = browser({ live: session('admin-1', 'LIVE-RESTORED') });
    await b.call('adminDirectInvite', INVITE);
    assert(b.auth() === 'Bearer LIVE-RESTORED', `sent ${b.auth()}`);
  });
  await test('Student and client snapshots still take precedence over the shared live session', async () => {
    const s = browser({ student: session('stu-1', 'STUDENT-SNAPSHOT'), live: session('x', 'LIVE') });
    await s.call('getStudentPortalData', {});
    assert(s.auth() === 'Bearer STUDENT-SNAPSHOT', `student sent ${s.auth()}`);
    const c = browser({ client: session('cli-1', 'CLIENT-SNAPSHOT'), live: session('x', 'LIVE') });
    await c.call('getClientPortalData', {});
    assert(c.auth() === 'Bearer CLIENT-SNAPSHOT', `client sent ${c.auth()}`);
  });
  await test('An explicit accessToken still wins and is never sent in the request body', async () => {
    const b = browser({ staff: session('admin-1', 'STAFF-TOKEN'), live: session('admin-1', 'LIVE') });
    await b.call('getStudentPortalData', { identifier: 'a@b.test', accessToken: 'EXPLICIT-TOKEN' });
    assert(b.auth() === 'Bearer EXPLICIT-TOKEN', `sent ${b.auth()}`);
    assert(!('accessToken' in b.requests[0].body), 'the token must not appear in the body');
  });

  console.log('\n[SECTION C: No session means no credentials, and nothing is added to the request]');
  await test('Signed-out browsers send no Authorization header (the server then returns 401)', async () => {
    const b = browser({ live: null });
    await b.call('adminDirectInvite', INVITE);
    assert(b.auth() === undefined, `an Authorization header was sent: ${b.auth()}`);
  });
  await test('Legacy PIN/passcode fields are stripped from every request', async () => {
    const b = browser({ staff: session('admin-1', 'STAFF-TOKEN') });
    await b.call('adminDirectInvite', { ...INVITE, pin: '5819', passcode: 'Ultima' });
    const body = b.requests[0].body;
    assert(!('pin' in body) && !('passcode' in body), 'pin/passcode must never be sent');
  });
  await test('The role is never taken from the browser: no role field is added to the request', async () => {
    const b = browser({ staff: { ...session('admin-1', 'STAFF-TOKEN'), user: { id: 'admin-1', user_metadata: { role: 'admin' }, app_metadata: { role: 'admin' } } } });
    await b.call('adminDirectInvite', INVITE);
    const text = JSON.stringify(b.requests[0].body);
    assert(!/"role"|app_metadata|user_metadata/.test(text), 'the request body must not carry a role');
  });

  console.log('\n[SECTION D: Responses and errors behave as before]');
  await test('A 401 from the server still surfaces its message through onError', async () => {
    const b = browser({ staff: session('admin-1', 'STALE'), response: { ok: false, status: 401, body: { success: false, error: 'Unauthorized: Staff or administrator authentication required.' } } });
    let seen = null;
    await b.call('adminDirectInvite', INVITE, () => { throw new Error('onSuccess must not run'); }, (e) => { seen = e.message; });
    assert(seen === 'Unauthorized: Staff or administrator authentication required.', `got ${seen}`);
  });
  await test('A successful response reaches onSuccess with the full body', async () => {
    const b = browser({ staff: session('admin-1', 'T'), response: { ok: true, status: 200, body: { success: true, studentId: 'FIFS-1234', emailDispatched: true } } });
    let got = null;
    await b.call('adminDirectInvite', INVITE, (d) => { got = d; });
    assert(got && got.success === true && got.emailDispatched === true, 'onSuccess did not receive the body');
  });
  await test('Promise-style callers (no callbacks) still see failures', async () => {
    const b = browser({ staff: session('admin-1', 'T'), response: { ok: false, status: 500, body: { error: 'boom' } } });
    let threw = false;
    try { await b.call('getAdminDashboardData', {}); } catch (e) { threw = e.message === 'boom'; }
    assert(threw, 'a failed promise-style call must reject');
  });

  console.log('\n[SECTION E: Source checks]');
  await test('The browser script contains no server secret names or service-role references in the dispatcher', async () => {
    assert(!/SERVICE_ROLE|SERVICE_KEY|service_role|auth\.admin/.test(DISPATCHER), 'dispatcher references a server-only secret');
  });

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Suite crashed:', e && e.message); process.exit(1); });
