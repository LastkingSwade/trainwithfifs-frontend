/**
 * TrainWithFIFS - Offline Student Portal & Save-Reporting Regression Suite
 *
 * Covers: staff notes hidden from students, no invented qualification scores, explicit
 * "not saved" responses for portal actions without server persistence, and frontend code that
 * reports a change as saved only when the server confirms it.
 *
 * Supabase is mocked and global fetch is stubbed; nothing leaves this process.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Module = require('module');
const { installFetchStub } = require('./lib/ts-loader');

for (const key of ['DISCORD_WEBHOOK_URL', 'RESEND_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'CRON_SECRET', 'CHAT_HMAC_SECRET']) {
  delete process.env[key];
}
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.example.test';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXT_PUBLIC_SITE_URL = 'https://preview.example.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-secret-key-32chars!';
const fetchCalls = installFetchStub();

const mockNextServer = {
  NextResponse: { json: (body, init) => ({ status: (init && init.status) || 200, _body: body }) },
  NextRequest: class {}
};

let db;
const writes = [];
// Test controls: force a database error for an operation, or make an update match no rows.
let failOp = null;
let updateMatchesNothing = false;
function resetDb() {
  db = {
    students: [
      { id: 'row-alice', user_id: 'uuid-student-alice', student_id: 'FIFS-1001', email: 'alice@student.com', full_name: 'Alice Student',
        status: 'STEP_2_CONFIRMED', internal_notes: 'Staff only: payment plan discussed', qualification_score: null,
        prep_tasks: { transport_law: true, ammo_acquired: false, custom_extra: 'keep' } },
      { id: 'row-bob', user_id: 'uuid-student-bob', student_id: 'FIFS-1002', email: 'bob@student.com', full_name: 'Bob Student',
        status: 'STEP_6_QUALIFIED', internal_notes: 'Staff only', qualification_score: '24/25 (96%)' },
      // A student-editable is_admin flag must never grant staff access.
      { id: 'row-carol', user_id: 'uuid-student-carol', student_id: 'FIFS-1003', email: 'carol@student.com', full_name: 'Carol Student',
        status: 'STEP_1_REGISTERED', internal_notes: 'Staff only: carol', qualification_score: null, is_admin: true, role: 'admin' }
    ],
    enrollments: [],
    clients: []
  };
  writes.length = 0;
  failOp = null;
  updateMatchesNothing = false;
}

function queryBuilder(table) {
  const filters = [];
  let op = 'select';
  let patch = null;
  const run = () => {
    if (failOp && failOp === op) return { data: null, error: { message: 'boom: internal database detail' } };
    if (op === 'update') {
      const hit = updateMatchesNothing ? [] : (db[table] || []).filter((r) => filters.every((f) => f(r)));
      hit.forEach((r) => Object.assign(r, patch));
      writes.push({ table, op, patch, rows: hit.length });
      return { data: hit.map((r) => ({ ...r })), error: null };
    }
    if (op === 'insert') {
      (db[table] = db[table] || []).push({ ...patch });
      writes.push({ table, op, patch });
      return { data: null, error: null };
    }
    if (op !== 'select') { writes.push({ table, op }); return { data: null, error: null }; }
    return { data: (db[table] || []).filter((r) => filters.every((f) => f(r))).map((r) => ({ ...r })), error: null };
  };
  const b = {
    select: () => b,
    insert: (data) => { op = 'insert'; patch = data; return b; },
    update: (data) => { op = 'update'; patch = data; return b; },
    upsert: () => { op = 'upsert'; return b; },
    delete: () => { op = 'delete'; return b; },
    eq: (c, v) => { filters.push((r) => r[c] === v); return b; },
    or: (expr) => {
      // Supports the staff lookup form: student_id.eq.X,email.eq.Y
      const parts = String(expr).split(',').map((p) => p.split('.eq.'));
      filters.push((r) => parts.some(([col, val]) => String(r[col] || '').toLowerCase() === String(val || '').toLowerCase()));
      return b;
    },
    order: () => b,
    maybeSingle: async () => { const r = run(); return { data: (r.data || [])[0] || null, error: r.error }; },
    single: async () => { const r = run(); return { data: (r.data || [])[0] || null, error: r.error }; },
    then: (resolve, reject) => Promise.resolve(run()).then(resolve, reject)
  };
  return b;
}

const mockSupabase = {
  createClient: () => ({
    from: queryBuilder,
    storage: { from: () => ({ createSignedUrl: async () => ({ data: null, error: { message: 'none' } }) }) },
    auth: {
      admin: {
        createUser: async () => ({ data: { user: { id: 'uuid-new-invitee' } }, error: null }),
        generateLink: async () => ({ data: { properties: { action_link: 'https://link.example.test/setup' } }, error: null }),
        deleteUser: async () => ({ data: null, error: null })
      },
      getUser: async (token) => {
        const users = {
          'student-alice-token': { id: 'uuid-student-alice', email: 'alice@student.com', app_metadata: { role: 'student' } },
          'student-bob-token': { id: 'uuid-student-bob', email: 'bob@student.com', app_metadata: { role: 'student' } },
          'instructor-token': { id: 'uuid-instructor', email: 'coach@example.test', app_metadata: { role: 'instructor' } },
          'staff-token': { id: 'uuid-staff', email: 'frontdesk@example.test', app_metadata: { role: 'staff' } },
          // Spoof attempt: admin claims only in user-editable user_metadata and the students row.
          'student-carol-token': { id: 'uuid-student-carol', email: 'carol@student.com', app_metadata: { role: 'student' }, user_metadata: { role: 'admin', is_admin: true } }
        };
        return users[token] ? { data: { user: users[token] }, error: null } : { data: { user: null }, error: { message: 'Invalid token' } };
      }
    }
  })
};

const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'next/server') return mockNextServer;
  if (id === '@supabase/supabase-js') return mockSupabase;
  if (id === 'stripe') return class { constructor() { throw new Error('Stripe must not be used by this suite'); } };
  return originalRequire.apply(this, arguments);
};

const ROOT = path.resolve(__dirname, '..');
const fifsRoute = require(path.join(ROOT, 'src/app/api/fifs/route.ts'));
const PUBLIC_SCRIPT = fs.readFileSync(path.join(ROOT, 'public/scripts/TrainWithFIFS_scripts.js'), 'utf-8');

function makeRequest(body, headers = {}) {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return { url: 'https://trainwithfifs.example/api/fifs', headers: { get: (n) => lower[String(n).toLowerCase()] ?? null }, json: async () => body };
}
async function fifs(action, payload = {}, token) {
  const headers = token ? { Authorization: 'Bearer ' + token } : {};
  const res = await fifsRoute.POST(makeRequest({ action, ...payload }, headers));
  return { status: res.status, body: res._body };
}

/** Returns the source of a top-level function declaration from the public script. */
function extractFunction(name) {
  const start = PUBLIC_SCRIPT.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function not found: ' + name);
  let i = PUBLIC_SCRIPT.indexOf('{', start);
  let depth = 0;
  for (; i < PUBLIC_SCRIPT.length; i++) {
    if (PUBLIC_SCRIPT[i] === '{') depth++;
    else if (PUBLIC_SCRIPT[i] === '}' && --depth === 0) break;
  }
  return PUBLIC_SCRIPT.slice(start, i + 1);
}

/** Splits the top-level arguments of every callFifsBackend('<action>', ...) call. */
function backendCallArgs(action) {
  const calls = [];
  const needle = new RegExp("callFifsBackend\\(\\s*['\"]" + action + "['\"]", 'g');
  let m;
  while ((m = needle.exec(PUBLIC_SCRIPT))) {
    const open = PUBLIC_SCRIPT.indexOf('(', m.index);
    const args = [];
    let depth = 0, inStr = null, argStart = open + 1;
    for (let i = open; i < PUBLIC_SCRIPT.length; i++) {
      const c = PUBLIC_SCRIPT[i];
      if (inStr) { if (c === '\\') i++; else if (c === inStr) inStr = null; continue; }
      if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
      if ('([{'.includes(c)) depth++;
      else if (')]}'.includes(c)) {
        depth--;
        if (depth === 0) { args.push(PUBLIC_SCRIPT.slice(argStart, i).trim()); break; }
      } else if (c === ',' && depth === 1) { args.push(PUBLIC_SCRIPT.slice(argStart, i).trim()); argStart = i + 1; }
    }
    calls.push({ line: PUBLIC_SCRIPT.slice(0, m.index).split('\n').length, args });
  }
  return calls;
}

let passed = 0, failed = 0;
async function test(name, fn) {
  resetDb();
  fetchCalls.length = 0;
  try { await fn(); passed++; console.log(`  ✓ PASS: ${name}`); }
  catch (err) { failed++; console.log(`  ✗ FAIL: ${name}\n    -> ${err.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

const NOT_IMPLEMENTED = ['adminEditClient',
  'saveStudentScoresheet', 'deleteStudentScoresheet', 'submitStudentWaiver', 'handleLeadMagnetSubmission'];

async function main() {
  console.log('================================================================');
  console.log('🔒 STUDENT PORTAL & SAVE-REPORTING REGRESSION SUITE (offline)');
  console.log('================================================================\n');

  console.log('[SECTION A: Student portal data]');
  await test('A student never receives staff internal notes', async () => {
    const { status, body } = await fifs('getStudentPortalData', {}, 'student-alice-token');
    assert(status === 200, `expected 200, got ${status}`);
    assert(!('internalNotes' in body.student) && !JSON.stringify(body).includes('Staff only'), 'internal notes leaked to student');
  });
  await test('The student view is an allow-list: no internal-notes, account, or admin fields at any level', async () => {
    const { body } = await fifs('getStudentPortalData', {}, 'student-alice-token');
    const allowed = ['assignedDate', 'course', 'email', 'enrollments', 'fullName', 'mustChangePassword', 'phone', 'prepTasks', 'profileDocUrl', 'qualificationScore', 'status', 'studentId', 'track'];
    assert(JSON.stringify(Object.keys(body.student).sort()) === JSON.stringify(allowed), `unexpected student fields: ${Object.keys(body.student).sort().join(',')}`);
    const text = JSON.stringify(body);
    assert(!/internal|Staff only|is_admin|user_id/i.test(text), 'a staff-only or account field reached the student response');
    for (const e of body.student.enrollments) assert(!Object.keys(e).some((k) => /internal|note/i.test(k) && k !== 'required_gear_notes'), `enrollment exposes a notes field: ${Object.keys(e).join(',')}`);
  });
  await test('Staff still see internal notes for a student', async () => {
    const { body } = await fifs('getStudentPortalData', { identifier: 'FIFS-1001' }, 'instructor-token');
    assert(body.student && body.student.internalNotes === 'Staff only: payment plan discussed', 'staff should see notes');
  });
  await test('A missing qualification score is reported as null, not a perfect score', async () => {
    const { body } = await fifs('getStudentPortalData', {}, 'student-alice-token');
    assert(body.student.qualificationScore === null, 'got ' + JSON.stringify(body.student.qualificationScore));
  });
  await test('A recorded qualification score is returned unchanged', async () => {
    const { body } = await fifs('getStudentPortalData', {}, 'student-bob-token');
    assert(body.student.qualificationScore === '24/25 (96%)', 'got ' + body.student.qualificationScore);
  });
  await test('A student identifier cannot be used to read another student (ownership by user_id)', async () => {
    const { status } = await fifs('getStudentPortalData', { identifier: 'FIFS-1002' }, 'student-alice-token');
    assert(status === 403, `expected 403, got ${status}`);
  });

  console.log('\n[SECTION B: Portal actions without server persistence]');
  for (const action of NOT_IMPLEMENTED) {
    await test(`${action}: fails explicitly with 501 "NOT saved" and writes nothing`, async () => {
      const { status, body } = await fifs(action, { studentId: 'FIFS-1001', status: 'STEP_8_LICENSED' }, 'instructor-token');
      assert(status === 501 && body.success === false && body.status === 'error' && body.notImplemented === true, `got ${status} ${JSON.stringify(body)}`);
      assert(/NOT saved/.test(body.error), 'message must say the change was not saved');
      assert(writes.length === 0, 'no database write may occur');
    });
  }
  await test('Unknown actions are still rejected with 400', async () => {
    const { status } = await fifs('definitelyNotAnAction');
    assert(status === 400, `expected 400, got ${status}`);
  });

  console.log('\n[SECTION C: Frontend save reporting (public script)]');
  // The dispatcher resolves its bearer token through fifsResolveBearerToken, so load both together.
  const wrapperSrc = extractFunction('fifsResolveBearerToken') + '\n' + extractFunction('callFifsBackend');
  const helperSrc = extractFunction('fifsSaveOrReport');
  function loadWrapper(response) {
    const ctx = {
      console: { error() {}, log() {} },
      window: {},
      fetch: async () => ({ ok: response.ok, status: response.status, json: async () => response.body })
    };
    vm.createContext(ctx);
    vm.runInContext(wrapperSrc + '\nthis.callFifsBackend = callFifsBackend;', ctx);
    return ctx.callFifsBackend;
  }
  await test('Wrapper rejects promise-style callers when the server refuses the change', async () => {
    const call = loadWrapper({ ok: false, status: 501, body: { success: false, error: 'Saving X is not available yet. This change was NOT saved.' } });
    let rejected = null;
    await call('adminEditStudent', {}).then(() => {}, (e) => { rejected = e; });
    assert(rejected && /NOT saved/.test(rejected.message), 'expected rejection with server message');
  });
  await test('Wrapper calls onError (and does not reject) when an error callback is provided', async () => {
    const call = loadWrapper({ ok: false, status: 501, body: { success: false, error: 'nope' } });
    let seen = null;
    const result = await call('saveStudentScoresheet', {}, () => { throw new Error('onSuccess must not run'); }, (e) => { seen = e; });
    assert(seen && seen.message === 'nope' && result === undefined, 'expected onError with server message');
  });
  await test('Wrapper resolves with the server data on success', async () => {
    const call = loadWrapper({ ok: true, status: 200, body: { success: true, value: 42 } });
    const data = await call('getStudentPortalData', {});
    assert(data && data.value === 42, 'expected server data');
  });
  function loadHelper(callImpl) {
    const ctx = { callFifsBackend: callImpl };
    vm.createContext(ctx);
    vm.runInContext(helperSrc + '\nthis.fifsSaveOrReport = fifsSaveOrReport;', ctx);
    return ctx.fifsSaveOrReport;
  }
  await test('fifsSaveOrReport treats an error payload passed to onSuccess (page.tsx wrapper) as a failure', async () => {
    const helper = loadHelper((a, p, onSuccess) => onSuccess({ success: false, status: 'error', error: 'This change was NOT saved.' }));
    let saved = false, failure = null;
    helper('updateStudentStatus', {}, () => { saved = true; }, (e) => { failure = e; });
    assert(!saved && failure && /NOT saved/.test(failure.message), 'must report failure');
  });
  await test('fifsSaveOrReport reports failure via the error callback path', async () => {
    const helper = loadHelper((a, p, onSuccess, onError) => onError(new Error('HTTP 500')));
    let failure = null;
    helper('adminDeleteStudent', {}, () => { throw new Error('must not succeed'); }, (e) => { failure = e; });
    assert(failure && failure.message === 'HTTP 500', 'expected failure');
  });
  await test('fifsSaveOrReport reports success only when the server confirms', async () => {
    const helper = loadHelper((a, p, onSuccess) => onSuccess({ success: true }));
    let saved = false;
    helper('adminDeleteStudent', {}, () => { saved = true; }, () => { throw new Error('must not fail'); });
    assert(saved, 'expected success');
  });
  await test('Status, edit, task, and delete actions all go through fifsSaveOrReport', async () => {
    for (const action of ['updateStudentStatus', 'adminEditStudent', 'adminEditClient', 'updateStudentTask', 'adminDeleteStudent', 'adminDeleteClient']) {
      const direct = backendCallArgs(action);
      assert(direct.length === 0, `${action} is still called directly at line(s) ${direct.map((c) => c.line).join(', ')}`);
      assert(new RegExp("fifsSaveOrReport\\(\\s*['\"]" + action + "['\"]").test(PUBLIC_SCRIPT), `${action} must use fifsSaveOrReport`);
    }
  });
  await test('Scoresheet and waiver calls always pass an error callback', async () => {
    for (const action of ['saveStudentScoresheet', 'deleteStudentScoresheet', 'submitStudentWaiver']) {
      const calls = backendCallArgs(action);
      assert(calls.length > 0, `no ${action} call found`);
      for (const c of calls) assert(c.args.length >= 4 && /^function\s*\(/.test(c.args[3]), `${action} at line ${c.line} has no error callback`);
    }
  });
  await test('No success message is shown before the server confirms a student/client edit', async () => {
    for (const fn of ['handleAdminEditStudentSubmit', 'handleAdminEditClientSubmit']) {
      const src = extractFunction(fn);
      const successAt = src.search(/showStatus\(st, '(Changes saved successfully!|Client permit record updated!)'/);
      const callAt = src.indexOf('fifsSaveOrReport(');
      assert(callAt >= 0 && successAt > callAt, `${fn} shows success before the save call`);
    }
  });
  await test('Editors never prefill an invented "25/25 (100%)" score', async () => {
    const offenders = PUBLIC_SCRIPT.split('\n')
      .map((l, i) => ({ l, n: i + 1 }))
      .filter(({ l }) => /\|\|\s*'25\/25 \(100%\)'|:\s*'25\/25 \(100%\)';/.test(l));
    assert(offenders.length === 0, 'fallback found at line(s) ' + offenders.map((o) => o.n).join(', '));
  });


  console.log('\n[SECTION: Staff roles, spoofing, escaping, and Admin Hub entry]');
  await test('The "staff" role (app_metadata) can read a student record, including internal notes', async () => {
    const { status, body } = await fifs('getStudentPortalData', { identifier: 'FIFS-1002' }, 'staff-token');
    assert(status === 200 && body.student.studentId === 'FIFS-1002' && body.student.internalNotes === 'Staff only', `got ${status}`);
  });
  await test('A students.is_admin flag or user_metadata.role does not grant staff access', async () => {
    const other = await fifs('getStudentPortalData', { identifier: 'FIFS-1002' }, 'student-carol-token');
    assert(other.status === 403, `reading another student must be refused, got ${other.status}`);
    const own = await fifs('getStudentPortalData', {}, 'student-carol-token');
    assert(own.status === 200 && own.body.student.studentId === 'FIFS-1003', 'own record must load');
    assert(!('internalNotes' in own.body.student), 'spoofed admin must not receive internal notes');
    const adminAction = await fifs('getAdminDashboardData', {}, 'student-carol-token');
    assert(adminAction.status === 401 || adminAction.status === 403, `admin dashboard must be refused, got ${adminAction.status}`);
  });

  function allFunctionSources(name) {
    const out = [];
    let from = 0;
    for (;;) {
      const start = PUBLIC_SCRIPT.indexOf('function ' + name + '(', from);
      if (start < 0) break;
      let i = PUBLIC_SCRIPT.indexOf('{', start);
      let depth = 0;
      for (; i < PUBLIC_SCRIPT.length; i++) {
        if (PUBLIC_SCRIPT[i] === '{') depth++;
        else if (PUBLIC_SCRIPT[i] === '}' && --depth === 0) break;
      }
      out.push(PUBLIC_SCRIPT.slice(start, i + 1));
      from = i + 1;
    }
    return out;
  }
  const HOSTILE = '<img src=x onerror=alert(1)// "\'&>';
  await test('Every escapeHtml in the public script escapes < > & " and \'', async () => {
    const defs = allFunctionSources('escapeHtml').concat(allFunctionSources('escapeChatHtml'));
    assert(defs.length >= 3, 'expected escape helpers, found ' + defs.length);
    for (const src of defs) {
      const fn = new Function(src + '; return ' + src.match(/function (\w+)/)[1] + ';')();
      const out = fn(HOSTILE);
      assert(!/[<>"']/.test(out) && out.includes('&lt;img') && out.includes('&amp;'), 'unsafe escape output: ' + out);
    }
  });
  await test('fifsSafeId keeps server-style IDs and blanks anything that could break an inline handler', async () => {
    const fifsSafeId = new Function(extractFunction('fifsSafeId') + '; return fifsSafeId;')();
    for (const ok of ['th_0123abcd', 'FIFS-1001', 'CLI-ABC123', 'GUEST-9F2A']) assert(fifsSafeId(ok) === ok, 'rejected ' + ok);
    for (const bad of ["x');alert(1);//", 'a b', '<x>', '"q"', '', null, undefined, 'a'.repeat(200)]) assert(fifsSafeId(bad) === '', 'accepted ' + bad);
  });
  await test('Staff chat inbox renders a hostile visitor thread as inert text', async () => {
    const src = ['escapeHtml', 'fifsSafeId', 'renderAdminChatConsole'].map((n) => allFunctionSources(n).pop()).join('\n');
    const inbox = { innerHTML: '' };
    const doc = { getElementById: (id) => (id === 'admin-chat-inbox-list' ? inbox : null) };
    const threads = [{ id: "x');alert(1);//", senderName: HOSTILE, senderPhone: HOSTILE, lastUpdated: '9:00 AM', unread: true,
      messages: [{ sender: 'user', text: HOSTILE }] }];
    const run = new Function('document', 'window', 'getStoredChatThreads', 'renderActiveAdminChatMessages', src + '; renderAdminChatConsole();');
    run(doc, {}, () => threads, () => {});
    assert(inbox.innerHTML.length > 0, 'inbox was not rendered');
    assert(!/<img/i.test(inbox.innerHTML), 'visitor HTML must not become a live element');
    assert(!inbox.innerHTML.includes("alert(1);//')"), 'thread id must not reach the inline handler');
    assert(inbox.innerHTML.includes("selectAdminChatThread('')"), 'unsafe thread id must be blanked in the handler');
  });
  await test('Terminal "auth" opens the Supabase staff sign-in and never accepts a passcode', async () => {
    const at = PUBLIC_SCRIPT.indexOf("cmd === 'auth'");
    assert(at >= 0, 'auth command not found');
    const branch = PUBLIC_SCRIPT.slice(at, PUBLIC_SCRIPT.indexOf('} else {', at));
    assert(/openAndSwitch\('admin'\)/.test(branch) && /adminStaffEmail/.test(branch), 'auth must open the staff sign-in form');
    assert(!/verifyAdminAccess|callFifsBackend|fetch\(/.test(branch), 'auth must not verify a passcode client-side');
    assert(!/isValidInstructorPin\(/.test(PUBLIC_SCRIPT), 'undefined legacy PIN check must be gone');
  });
  await test('The student scoresheet badge never contains an invented passing score', async () => {
    const page = fs.readFileSync(path.resolve(__dirname, '../src/app/page.tsx'), 'utf-8');
    const at = page.indexOf('id="dash-scoresheet-score-badge"');
    assert(at >= 0, 'badge not found');
    const badge = page.slice(at, page.indexOf('</span>', at));
    assert(!/25\/25|100%|PASS/.test(badge) && /Not yet recorded/.test(badge), 'badge default must be unrecorded');
  });
  console.log('\n[SECTION D: updateStudentStatus, adminEditStudent, updateStudentTask]');
  const STEPS = ['STEP_1_REGISTERED', 'STEP_2_CONFIRMED', 'STEP_3_PREPARATION', 'STEP_4_CLASSROOM', 'STEP_5_LIVE_FIRE', 'STEP_6_CERTIFIED', 'STEP_7_MSP_PORTAL', 'STEP_8_LICENSED'];
  const row = (id) => db.students.find((r) => r.student_id === id);
  const noWrites = () => assert(writes.length === 0, 'no database write may occur, saw ' + JSON.stringify(writes));
  const err = (r, status) => assert(r.status === status && r.body.success === false && typeof r.body.error === 'string', `expected ${status} failure, got ${r.status} ${JSON.stringify(r.body)}`);
  const patchColumns = () => Object.keys(writes[0].patch).sort();

  // ---- updateStudentStatus ----
  await test('updateStudentStatus: unauthenticated, student, and spoofed-admin callers are refused and nothing is written', async () => {
    for (const token of [undefined, 'bad-token', 'student-alice-token', 'student-carol-token']) {
      err(await fifs('updateStudentStatus', { studentId: 'FIFS-1001', status: 'STEP_8_LICENSED' }, token), 401);
    }
    noWrites();
    assert(row('FIFS-1001').status === 'STEP_2_CONFIRMED', 'status must be unchanged');
  });
  await test('updateStudentStatus: instructor and staff roles can set every allow-listed step; only status and updated_at change', async () => {
    for (const [i, step] of STEPS.entries()) {
      const r = await fifs('updateStudentStatus', { studentId: 'FIFS-1001', status: step }, i % 2 ? 'staff-token' : 'instructor-token');
      assert(r.status === 200 && r.body.success === true && r.body.status === 'success', `step ${step}: ${r.status} ${JSON.stringify(r.body)}`);
      assert(row('FIFS-1001').status === step, `row not updated to ${step}`);
    }
    assert(writes.length === STEPS.length && writes.every((w) => w.table === 'students' && w.rows === 1 && JSON.stringify(Object.keys(w.patch).sort()) === '["status","updated_at"]'), 'unexpected writes: ' + JSON.stringify(writes));
    assert(row('FIFS-1002').status === 'STEP_6_QUALIFIED', 'another student must not change');
  });
  await test('updateStudentStatus: unknown, legacy, empty, and non-string statuses are rejected with 400', async () => {
    for (const bad of ['STEP_9_DONE', 'STEP_6_QUALIFIED', 'CONFIRMED', 'step_1_registered ', '', '   ', null, 3, ['STEP_1_REGISTERED'], { a: 1 }, true]) {
      err(await fifs('updateStudentStatus', { studentId: 'FIFS-1001', status: bad }, 'instructor-token'), 400);
    }
    err(await fifs('updateStudentStatus', { studentId: 'FIFS-1001' }, 'instructor-token'), 400);
    noWrites();
  });
  await test('updateStudentStatus: malformed or unknown student IDs are rejected; unknown IDs are 404', async () => {
    for (const bad of ['', '   ', "x'; drop table students;--", 'a b', 'A'.repeat(65), null, 7, ['FIFS-1001'], undefined]) {
      err(await fifs('updateStudentStatus', { studentId: bad, status: 'STEP_3_PREPARATION' }, 'instructor-token'), 400);
    }
    err(await fifs('updateStudentStatus', { studentId: 'FIFS-9999', status: 'STEP_3_PREPARATION' }, 'instructor-token'), 404);
    noWrites();
  });
  await test('updateStudentStatus: database failures are reported as failures without leaking details', async () => {
    failOp = 'update';
    const a = await fifs('updateStudentStatus', { studentId: 'FIFS-1001', status: 'STEP_3_PREPARATION' }, 'instructor-token');
    err(a, 500);
    failOp = 'select';
    const b = await fifs('updateStudentStatus', { studentId: 'FIFS-1001', status: 'STEP_3_PREPARATION' }, 'instructor-token');
    err(b, 500);
    assert(!/boom|internal database/.test(JSON.stringify([a.body, b.body])), 'database error text leaked');
    failOp = null; updateMatchesNothing = true;
    err(await fifs('updateStudentStatus', { studentId: 'FIFS-1001', status: 'STEP_3_PREPARATION' }, 'instructor-token'), 409);
  });

  // ---- adminEditStudent ----
  const editPayload = () => ({
    fullName: 'Alice Q. Student', email: 'ALICE@student.com', phone: '410-555-0100', courseSelection: 'Maryland HQL 8hr',
    assignedDate: 'Nov 3, 2026', classDate: 'Nov 3, 2026', status: 'STEP_4_CLASSROOM', qualificationScore: '24/25 (96%)',
    profileDocUrl: 'https://ufqnmcincwnlyiwsmzcq.supabase.co/storage/v1/object/public/documents/a.pdf',
    dossierUrl: 'https://ufqnmcincwnlyiwsmzcq.supabase.co/storage/v1/object/public/documents/a.pdf', notes: 'Bring range bag'
  });
  const edit = (updates, token = 'instructor-token', studentId = 'FIFS-1001') => fifs('adminEditStudent', { studentId, updates }, token);
  await test('adminEditStudent: unauthenticated, student, and spoofed-admin callers are refused and nothing is written', async () => {
    for (const token of [null, 'bad-token', 'student-alice-token', 'student-carol-token']) err(await edit(editPayload(), token), 401);
    noWrites();
  });
  await test('adminEditStudent: the edit-modal payload saves exactly the allow-listed columns', async () => {
    const r = await edit(editPayload());
    assert(r.status === 200 && r.body.success === true && r.body.status === 'success', `got ${r.status} ${JSON.stringify(r.body)}`);
    assert(writes.length === 1 && writes[0].rows === 1, 'expected a single one-row update');
    assert(JSON.stringify(patchColumns()) === JSON.stringify(['assigned_date', 'course_selection', 'full_name', 'internal_notes', 'phone', 'profile_doc_url', 'qualification_score', 'status', 'updated_at']), 'columns: ' + patchColumns());
    const a = row('FIFS-1001');
    assert(a.full_name === 'Alice Q. Student' && a.status === 'STEP_4_CLASSROOM' && a.internal_notes === 'Bring range bag' && a.assigned_date === 'Nov 3, 2026', 'values not saved');
    assert(a.email === 'alice@student.com' && a.user_id === 'uuid-student-alice' && a.student_id === 'FIFS-1001', 'identity columns must not change');
    assert(JSON.stringify(r.body).indexOf('Bring range bag') < 0, 'notes must not be echoed');
  });
  await test('adminEditStudent: the dossier-modal payload (document link, class date, notes) saves', async () => {
    const u = { profileDocUrl: 'https://example.com/d.pdf', dossier_url: 'https://example.com/d.pdf', assignedDate: 'Dec 1', preferredDates: 'Dec 1', notes: 'n' };
    const r = await edit(u);
    assert(r.status === 200, `got ${r.status} ${JSON.stringify(r.body)}`);
    assert(JSON.stringify(patchColumns()) === JSON.stringify(['assigned_date', 'internal_notes', 'profile_doc_url', 'updated_at']), 'columns: ' + patchColumns());
  });
  await test('adminEditStudent: every key the UI sends is accepted (contract matches public script)', async () => {
    const sample = (k) => /email/i.test(k) ? 'alice@student.com' : k === 'status' ? 'STEP_3_PREPARATION' : /url/i.test(k) ? 'https://example.com/x.pdf' : 'value';
    for (const fn of ['handleAdminEditStudentSubmit', 'handleSaveStudentDossier']) {
      const src = allFunctionSources(fn).pop();
      const block = src.match(/updates:\s*\{([\s\S]*?)\}/);
      assert(block, 'no updates block in ' + fn);
      const keys = [...block[1].matchAll(/(\w+)\s*:/g)].map((m) => m[1]);
      assert(keys.length >= 5, 'too few keys found in ' + fn);
      const u = {};
      for (const k of keys) u[k] = sample(k);
      u.assignedDate = u.classDate = u.preferredDates = u.assignedDate; // aliases must agree
      for (const k of keys) if (!(k in u)) delete u[k];
      const r = await edit(u);
      assert(r.status === 200, `${fn}: keys ${keys.join(',')} -> ${r.status} ${JSON.stringify(r.body)}`);
    }
  });
  await test('adminEditStudent: a changed email is rejected with the exact message and nothing is written', async () => {
    const r = await edit({ fullName: 'Alice', email: 'other@student.com' });
    err(r, 400);
    assert(r.body.error === 'Email addresses cannot be modified here to avoid desyncing portal login credentials.', r.body.error);
    for (const bad of ['', null, 5, ['alice@student.com']]) err(await edit({ fullName: 'Alice', email: bad }), 400);
    err(await edit({ email: 'other@student.com' }), 400);
    noWrites();
  });
  await test('adminEditStudent: identity, role, password, and token fields are rejected and nothing is written', async () => {
    const forbidden = ['user_id', 'userId', 'student_id', 'is_admin', 'isAdmin', 'role', 'id', 'portal_password', 'portalPassword', 'password', 'newPassword',
      'must_change_password', 'temp_password_reset', 'password_expires_at', 'last_password_change', 'token', 'access_token', 'created_at', 'updated_at', 'constructor', 'toString'];
    for (const k of forbidden) err(await edit({ fullName: 'Alice', [k]: 'x' }), 400);
    err(await edit(JSON.parse('{"fullName":"Alice","__proto__":{"is_admin":true}}')), 400);
    noWrites();
    assert(row('FIFS-1001').is_admin === undefined, 'is_admin must not be written');
  });
  await test('adminEditStudent: document links are normalised or must be plain http(s) URLs', async () => {
    for (const empty of ['', '#', '  #  ']) {
      writes.length = 0;
      const r = await edit({ profileDocUrl: empty });
      assert(r.status === 200 && writes[0].patch.profile_doc_url === null, `"${empty}" should clear the link`);
    }
    for (const ok of ['https://example.com/a.pdf', 'HTTP://example.com/a', ' https://example.com/a ']) {
      const r = await edit({ profileDocUrl: ok });
      assert(r.status === 200, `rejected ${ok}`);
    }
    writes.length = 0;
    for (const bad of ['javascript:alert(1)', 'data:text/html,<script>1</script>', 'ftp://example.com/a', '//evil.example/a', 'example.com/a.pdf', 'https://', 'https://user:pw@example.com/a',
      'https://exa mple.com', 'https://example.com/\u0000', 'vbscript:x', 'https:/example.com', 'https://' + 'a'.repeat(2100), 5, null, {}]) {
      err(await edit({ profileDocUrl: bad }), 400);
    }
    noWrites();
  });
  await test('adminEditStudent: bad values for text, status, and notes are rejected', async () => {
    const cases = [{ fullName: '' }, { fullName: '   ' }, { fullName: 42 }, { fullName: 'A'.repeat(121) }, { fullName: 'Al\u0000ice' }, { phone: {} }, { phone: '1'.repeat(41) },
      { courseSelection: 'C'.repeat(201) }, { assignedDate: 'D'.repeat(101) }, { qualificationScore: 'Q'.repeat(51) }, { status: 'STEP_9' }, { status: '' }, { status: 4 },
      { notes: 5 }, { notes: 'N'.repeat(5001) }, { notes: 'bad\u0000note' }];
    for (const c of cases) err(await edit(c), 400);
    noWrites();
  });
  await test('adminEditStudent: conflicting alias values and empty requests are rejected', async () => {
    err(await edit({ assignedDate: 'Nov 3', classDate: 'Nov 4' }), 400);
    err(await edit({ profileDocUrl: 'https://example.com/a', dossierUrl: 'https://example.com/b' }), 400);
    err(await edit({}), 400);
    err(await edit({ notes: '   ' }), 400);
    for (const u of [undefined, null, 'x', ['a'], 7]) err(await fifs('adminEditStudent', { studentId: 'FIFS-1001', updates: u }, 'instructor-token'), 400);
    for (const id of ['', "x'--", 'a b', null]) err(await edit({ fullName: 'A' }, 'instructor-token', id), 400);
    noWrites();
  });
  await test('adminEditStudent: empty notes never clear saved internal notes; blank optional text fields store null, but phone stores an empty string', async () => {
    const r = await edit({ notes: '', phone: '', qualificationScore: '' });
    assert(r.status === 200, `got ${r.status}`);
    const a = row('FIFS-1001');
    assert(a.internal_notes === 'Staff only: payment plan discussed', 'internal notes were wiped');
    assert(a.phone === '' && a.qualification_score === null, 'blank phone must be "" (NOT NULL column) and blank score null');
    assert(!('internal_notes' in writes[0].patch), 'internal_notes must not be in the update');
  });
  await test('adminEditStudent: never writes null to the NOT NULL columns phone, status, full_name, or prep_tasks', async () => {
    for (const phone of ['', '   ', '410-555-0100']) {
      const r = await edit({ phone, fullName: 'Alice', status: 'STEP_3_PREPARATION' });
      assert(r.status === 200, `got ${r.status}`);
    }
    for (const w of writes) {
      for (const col of ['phone', 'status', 'full_name', 'prep_tasks', 'updated_at']) {
        if (col in w.patch) assert(w.patch[col] !== null && w.patch[col] !== undefined, `${col} was written as ${w.patch[col]}`);
      }
      assert(!('prep_tasks' in w.patch), 'adminEditStudent must not touch prep_tasks');
    }
    assert(writes[0].patch.phone === '' && writes[1].patch.phone === '' && writes[2].patch.phone === '410-555-0100', 'blank phone should be ""');
    writes.length = 0;
    for (const bad of [{ fullName: '' }, { fullName: null }, { status: null }, { status: '' }, { prep_tasks: null }, { prepTasks: {} }]) err(await edit(bad), 400);
    noWrites();
  });
  await test('Admin invite messages never promise a sign-in or credentials before the student sets a password', async () => {
    assert(!/Credentials generated|using their email\/ID|Generating credentials/.test(PUBLIC_SCRIPT), 'misleading invite wording is back');
    const at = PUBLIC_SCRIPT.indexOf("callFifsBackend('adminDirectInvite'");
    assert(at > 0, 'invite call not found');
    const block = PUBLIC_SCRIPT.slice(at, at + 2500);
    assert(/password setup link/.test(block) && /before they can sign in/.test(block) && /No password was sent/.test(block), 'success message must explain the setup link');
  });
  await test('adminDirectInvite: the student insert sets every NOT NULL column that has no database default', async () => {
    // From information_schema on Production (students): NOT NULL without default.
    const REQUIRED = ['student_id', 'full_name', 'email', 'phone', 'course_name'];
    for (const phone of [undefined, '', '410-555-0100']) {
      writes.length = 0;
      await fifs('adminDirectInvite', { portalType: 'student', generatedId: 'FIFS-7777', fullName: 'Invitee Person', email: 'invitee@example.test', phone, course: 'Maryland HQL 8hr' }, 'instructor-token');
      const ins = writes.find((w) => w.table === 'students' && w.op === 'insert');
      assert(ins, 'no students insert was attempted');
      for (const col of REQUIRED) assert(typeof ins.patch[col] === 'string' && (col === 'phone' || ins.patch[col].length > 0), `${col} missing or not text: ${JSON.stringify(ins.patch[col])}`);
      assert(ins.patch.course_name === 'Maryland HQL 8hr' && ins.patch.course_selection === 'Maryland HQL 8hr', 'course must be saved to both columns');
      assert(ins.patch.phone === (phone || ''), 'phone must be the text given, or an empty string');
      assert(!('prep_tasks' in ins.patch) || (ins.patch.prep_tasks && Object.keys(ins.patch.prep_tasks).length > 0), 'prep_tasks must not be written as an empty value');
      assert(ins.patch.user_id === 'uuid-new-invitee' && ins.patch.must_change_password === true, 'linked identity and first-login flag expected');
    }
  });
  await test('adminEnrollStudent: a new student insert sets every NOT NULL column that has no database default', async () => {
    const REQUIRED = ['student_id', 'full_name', 'email', 'phone', 'course_name'];
    for (const [i, phone] of [undefined, '', '410-555-0100'].entries()) {
      writes.length = 0;
      const dbg = await fifs('adminEnrollStudent', { fullName: 'Enrollee Person', email: `enrollee${i}@example.test`, phone, classId: 'class-1', scheduledDate: '2027-03-01T14:00:00.000Z' }, 'instructor-token');
      const ins = writes.find((w) => w.table === 'students' && w.op === 'insert');
      assert(ins, 'no students insert was attempted: ' + dbg.status + ' ' + JSON.stringify(dbg.body));
      for (const col of REQUIRED) assert(typeof ins.patch[col] === 'string' && (col === 'phone' || ins.patch[col].length > 0), `${col} missing or not text: ${JSON.stringify(ins.patch[col])}`);
      assert(ins.patch.course_name === ins.patch.course_selection && ins.patch.course_name.length > 0, 'course must be saved to both course_name and course_selection');
      assert(ins.patch.phone === (phone || ''), 'phone must be the text given, or an empty string');
      assert(!('prep_tasks' in ins.patch) || (ins.patch.prep_tasks && Object.keys(ins.patch.prep_tasks).length > 0), 'prep_tasks must not be written as an empty value');
    }
  });
  await test('adminEditStudent: unknown student is 404; database failures are 500 without leaking details', async () => {
    err(await edit({ fullName: 'Ghost' }, 'instructor-token', 'FIFS-9999'), 404);
    failOp = 'update';
    const a = await edit({ fullName: 'Alice' });
    err(a, 500);
    failOp = 'select';
    const b = await edit({ fullName: 'Alice' });
    err(b, 500);
    assert(!/boom|internal database/.test(JSON.stringify([a.body, b.body])), 'database error text leaked');
    failOp = null; updateMatchesNothing = true;
    err(await edit({ fullName: 'Alice' }), 409);
  });

  // ---- updateStudentTask ----
  const task = (payload, token = 'student-alice-token') => fifs('updateStudentTask', payload, token);
  await test('updateStudentTask: a missing or invalid token is refused and nothing is written', async () => {
    for (const token of [null, 'bad-token']) err(await task({ taskId: 'ammo_acquired', isChecked: true }, token), 401);
    noWrites();
  });
  await test('updateStudentTask: merges into the caller\'s own prep_tasks and keeps other keys', async () => {
    const r = await task({ studentId: 'FIFS-1001', email: 'alice@student.com', taskId: 'ammo_acquired', isChecked: true });
    assert(r.status === 200 && r.body.success === true && r.body.status === 'success', `got ${r.status} ${JSON.stringify(r.body)}`);
    assert(JSON.stringify(row('FIFS-1001').prep_tasks) === JSON.stringify({ transport_law: true, ammo_acquired: true, eye_ear_pro: false, id_ready: false, custom_extra: 'keep' }),
      'merged value: ' + JSON.stringify(row('FIFS-1001').prep_tasks));
    assert(writes.length === 1 && JSON.stringify(patchColumns()) === '["prep_tasks","updated_at"]', 'only prep_tasks and updated_at may change');
    const off = await task({ taskId: 'transport_law', isChecked: false });
    assert(off.status === 200 && row('FIFS-1001').prep_tasks.transport_law === false, 'unchecking must save');
  });
  await test('updateStudentTask: studentId and email in the request cannot redirect the write to another student', async () => {
    const before = JSON.stringify(row('FIFS-1002'));
    const r = await task({ studentId: 'FIFS-1002', email: 'bob@student.com', identifier: 'FIFS-1002', user_id: 'uuid-student-bob', taskId: 'id_ready', isChecked: true });
    assert(r.status === 200, `got ${r.status}`);
    assert(JSON.stringify(row('FIFS-1002')) === before, 'another student was modified');
    assert(row('FIFS-1001').prep_tasks.id_ready === true, 'the caller\'s own row should change');
  });
  await test('updateStudentTask: accepts a tasks object, applying nothing if any entry is invalid', async () => {
    const ok = await task({ tasks: { eye_ear_pro: true, id_ready: true } });
    assert(ok.status === 200 && row('FIFS-1001').prep_tasks.eye_ear_pro === true && row('FIFS-1001').prep_tasks.id_ready === true, 'tasks object should save');
    writes.length = 0;
    err(await task({ tasks: { eye_ear_pro: false, is_admin: true } }), 400);
    noWrites();
  });
  await test('updateStudentTask: unknown task keys and non-boolean values are rejected', async () => {
    for (const k of ['is_admin', 'status', 'constructor', '__proto__', 'transport_law ', '', 7, null, undefined]) err(await task({ taskId: k, isChecked: true }), 400);
    for (const v of ['true', 'false', 1, 0, null, undefined, {}, []]) err(await task({ taskId: 'ammo_acquired', isChecked: v }), 400);
    for (const t of [null, [], 'x', 5]) err(await task({ tasks: t }), 400);
    err(await task({ tasks: {} }), 400);
    err(await task(JSON.parse('{"tasks":{"__proto__":true}}')), 400);
    noWrites();
  });
  await test('updateStudentTask: a signed-in user with no student record gets 404; null prep_tasks starts from defaults', async () => {
    err(await task({ taskId: 'ammo_acquired', isChecked: true }, 'instructor-token'), 404);
    noWrites();
    const r = await task({ taskId: 'id_ready', isChecked: true }, 'student-bob-token');
    assert(r.status === 200 && JSON.stringify(row('FIFS-1002').prep_tasks) === JSON.stringify({ transport_law: false, ammo_acquired: false, eye_ear_pro: false, id_ready: true }), 'defaults: ' + JSON.stringify(row('FIFS-1002').prep_tasks));
  });
  await test('updateStudentTask: database failures are reported as failures without leaking details', async () => {
    failOp = 'update';
    const a = await task({ taskId: 'ammo_acquired', isChecked: true });
    err(a, 500);
    failOp = 'select';
    const b = await task({ taskId: 'ammo_acquired', isChecked: true });
    err(b, 500);
    assert(!/boom|internal database/.test(JSON.stringify([a.body, b.body])), 'database error text leaked');
    failOp = null; updateMatchesNothing = true;
    err(await task({ taskId: 'ammo_acquired', isChecked: true }), 409);
  });
  await test('The three actions are implemented: no longer in the 501 list, and the route never uses a user-scoped client for them', async () => {
    const src = fs.readFileSync(path.join(ROOT, 'src/app/api/fifs/route.ts'), 'utf-8');
    const list = src.slice(src.indexOf('const NOT_IMPLEMENTED_ACTIONS'), src.indexOf('};', src.indexOf('const NOT_IMPLEMENTED_ACTIONS')));
    for (const a of ['updateStudentStatus', 'adminEditStudent', 'updateStudentTask']) {
      assert(!list.includes(a + ':'), a + ' is still listed as not implemented');
      const at = src.indexOf("case '" + a + "':");
      assert(at > 0, 'no case for ' + a);
      const body = src.slice(at, src.indexOf('\n     case ', at + 10));
      assert(body.indexOf('getAuthenticatedUser') >= 0 && body.indexOf('getAuthenticatedUser') < body.indexOf('getPrivilegedClient'), a + ' must authenticate before creating the privileged client');
      assert(!/getPublicClient/.test(body), a + ' must not use the public client');
    }
  });

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  console.log('================================================================');
  if (fetchCalls.length) console.log(`(stubbed outbound calls: ${fetchCalls.length})`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => { console.error('Suite crashed:', err); process.exit(1); });
