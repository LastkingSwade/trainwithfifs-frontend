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
let deleteMatchesNothing = false;
let storageCalls = { upload: [], remove: [], sign: [] };
let storageFail = null;
let authUsers = {};
let authCalls = { createUser: [], generateLink: [], deleteUser: [], getUserById: [], deleteSnapshots: [] };
let authFail = null;
// Simulates the database trigger handle_student_auth_user_link: when a confirmed account is created and exactly one
// unlinked student has that email, that student is linked to it. Modes: 'own' (normal), 'other' (links to a different
// account), 'vanish' (the student row is deleted mid-request). false = no trigger.
let authTrigger = false;
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
    clients: [],
    student_scoresheets: []
  };
  db.clients.push(
    { id: 'row-client-1', user_id: 'uuid-client-1', client_id: 'CLI-1001', full_name: 'Marcus Client', email: 'marcus@client.example', phone: '410-555-0111',
      permit_state: 'Maryland Wear & Carry', expiration_date: '2026-12-31', status: 'ACTIVE_REGISTERED', updated_at: '2026-01-01T00:00:00.000Z' },
    { id: 'row-client-2', user_id: 'uuid-client-2', client_id: 'CLI-2002', full_name: 'Second Client', email: 'client2@client.example', phone: null, permit_state: 'Maryland Wear & Carry', expiration_date: null, status: 'ACTIVE_REGISTERED' },
    { id: '3f1c2b54-7d0e-4a3b-9c11-0a1b2c3d4e5f', user_id: null, client_id: null, full_name: 'No Public Id', email: 'noid@client.example', phone: null,
      permit_state: 'Maryland', expiration_date: null, status: 'ACTIVE_PERMIT_HOLDER' }
  );
  // Roster students for the setup-link tests (no Auth account yet, no email, a staff email, mismatches).
  db.students.push(
    { id: 'row-dana', user_id: null, student_id: 'FIFS-1004', email: 'dana.migrated@example.test', full_name: 'Dana Migrated', status: 'STEP_1_REGISTERED' },
    { id: 'row-noemail', user_id: null, student_id: 'FIFS-1005', email: '', full_name: 'No Email', status: 'STEP_1_REGISTERED' },
    { id: 'row-staffmail', user_id: null, student_id: 'FIFS-1006', email: 'coach@example.test', full_name: 'Staff Mail', status: 'STEP_1_REGISTERED' },
    { id: 'row-mismatch', user_id: 'uuid-someone-else', student_id: 'FIFS-1007', email: 'selfsignup@example.test', full_name: 'Mismatch', status: 'STEP_1_REGISTERED' },
    { id: 'row-self', user_id: null, student_id: 'FIFS-1008', email: 'selfsignup@example.test', full_name: 'Self Signup', status: 'STEP_1_REGISTERED' },
    { id: 'row-dupe', user_id: null, student_id: 'FIFS-1009', email: 'alice@student.com', full_name: 'Duplicate Of Alice', status: 'STEP_1_REGISTERED' },
    { id: 'row-dana2', user_id: 'uuid-dana', student_id: 'FIFS-1013', email: 'dana.linked@example.test', full_name: 'Dana Linked', status: 'STEP_1_REGISTERED' },
    { id: 'row-staffed', user_id: 'uuid-staff', student_id: 'FIFS-1014', email: 'frontdesk@example.test', full_name: 'Linked To Staff', status: 'STEP_1_REGISTERED' },
    { id: 'row-self2', user_id: 'uuid-coach2', student_id: 'FIFS-1015', email: 'coach2@example.test', full_name: 'Linked To Caller', status: 'STEP_1_REGISTERED' },
    { id: 'row-shared', user_id: 'uuid-client-1', student_id: 'FIFS-1016', email: 'marcus@client.example', full_name: 'Shared With Client', status: 'STEP_1_REGISTERED' }
  );
  writes.length = 0;
  failOp = null;
  updateMatchesNothing = false;
  deleteMatchesNothing = false;
  storageFail = null;
  storageCalls = { upload: [], remove: [], sign: [] };
  authFail = null;
  authTrigger = false;
  authCalls = { createUser: [], generateLink: [], deleteUser: [], getUserById: [], deleteSnapshots: [] };
  authUsers = {
    'alice@student.com': { id: 'uuid-student-alice', email: 'alice@student.com', app_metadata: { role: 'student' } },
    'coach@example.test': { id: 'uuid-instructor', email: 'coach@example.test', app_metadata: { role: 'instructor' } },
    'selfsignup@example.test': { id: 'uuid-self-signup', email: 'selfsignup@example.test', app_metadata: {} },
    'marcus@client.example': { id: 'uuid-client-1', email: 'marcus@client.example', app_metadata: { role: 'client' } },
    'frontdesk@example.test': { id: 'uuid-staff', email: 'frontdesk@example.test', app_metadata: { role: 'staff' } },
    'dana.linked@example.test': { id: 'uuid-dana', email: 'dana.linked@example.test', app_metadata: { role: 'student' } },
    'coach2@example.test': { id: 'uuid-coach2', email: 'coach2@example.test', app_metadata: { role: 'instructor' } },
    'client2@client.example': { id: 'uuid-client-2', email: 'client2@client.example', app_metadata: { role: 'client' } }
  };
}

function queryBuilder(table) {
  const filters = [];
  let op = 'select';
  let patch = null;
  let conflict = null;
  const run = () => {
    if (failOp && failOp === op) return { data: null, error: { message: 'boom: internal database detail' } };
    if (op === 'update') {
      const hit = updateMatchesNothing ? [] : (db[table] || []).filter((r) => filters.every((f) => f(r)));
      hit.forEach((r) => Object.assign(r, patch));
      writes.push({ table, op, patch, rows: hit.length });
      return { data: hit.map((r) => ({ ...r })), error: null };
    }
    if (op === 'upsert') {
      const rows = (db[table] = db[table] || []);
      const hit = rows.find((r) => conflict && r[conflict] === patch[conflict]);
      if (hit) Object.assign(hit, patch); else rows.push({ ...patch });
      writes.push({ table, op, patch });
      return { data: [{ ...(hit || rows[rows.length - 1]) }], error: null };
    }
    if (op === 'delete') {
      const rows = db[table] || [];
      const gone = deleteMatchesNothing ? [] : rows.filter((r) => filters.every((f) => f(r)));
      db[table] = rows.filter((r) => !gone.includes(r));
      writes.push({ table, op, rows: gone.length });
      return { data: gone.map((r) => ({ ...r })), error: null };
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
    upsert: (data, opts) => { op = 'upsert'; patch = data; conflict = opts && opts.onConflict; return b; },
    delete: () => { op = 'delete'; return b; },
    eq: (c, v) => { filters.push((r) => r[c] === v); return b; },
    or: (expr) => {
      // Supports the staff lookup form: student_id.eq.X,email.eq.Y
      const parts = String(expr).split(',').map((p) => p.split('.eq.'));
      filters.push((r) => parts.some(([col, val]) => String(r[col] || '').toLowerCase() === String(val || '').toLowerCase()));
      return b;
    },
    neq: (c, v) => { filters.push((r) => r[c] !== v); return b; },
    is: (c, v) => { filters.push((r) => (r[c] === undefined ? null : r[c]) === v); return b; },
    limit: () => b,
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
    storage: { from: (bucket) => ({
      createSignedUrl: async (path, ttl) => {
        if (bucket !== 'scoresheets') return { data: null, error: { message: 'none' } };
        storageCalls.sign.push({ path, ttl });
        if (storageFail === 'sign') return { data: null, error: { message: 'boom: internal storage detail' } };
        return { data: { signedUrl: 'https://files.example.test/signed/' + path + '?token=SIGNED-TOKEN' }, error: null };
      },
      upload: async (path, bytes, opts) => {
        storageCalls.upload.push({ bucket, path, size: bytes.length, opts });
        if (storageFail === 'upload') return { data: null, error: { message: 'boom: internal storage detail' } };
        return { data: { path }, error: null };
      },
      remove: async (paths) => {
        storageCalls.remove.push({ bucket, paths });
        if (storageFail === 'remove') return { data: null, error: { message: 'boom: internal storage detail' } };
        return { data: paths.map((name) => ({ name })), error: null };
      }
    }) },
    auth: {
      admin: {
        createUser: async (params) => {
          authCalls.createUser.push(params);
          if (authFail === 'createUser') return { data: { user: null }, error: { status: 500, message: 'boom: internal auth detail' } };
          const email = String(params.email).toLowerCase();
          authUsers[email] = authUsers[email] || { id: 'uuid-new-invitee', email, app_metadata: params.app_metadata || {} };
          if (authTrigger && params.email_confirm) {
            const matches = (db.students || []).filter((r) => (r.user_id === null || r.user_id === undefined) && String(r.email || '').trim().toLowerCase() === email.trim().toLowerCase());
            if (matches.length === 1) {
              if (authTrigger === 'own') matches[0].user_id = authUsers[email].id;
              else if (authTrigger === 'other') matches[0].user_id = 'uuid-some-other-account';
              else if (authTrigger === 'vanish') db.students = db.students.filter((r) => r !== matches[0]);
            }
          }
          return { data: { user: authUsers[email] }, error: null };
        },
        generateLink: async (params) => {
          authCalls.generateLink.push(params);
          if (authFail === 'generateLink') return { data: { properties: null, user: null }, error: { status: 500, message: 'boom: internal auth detail' } };
          const u = authUsers[String(params.email).toLowerCase()];
          if (!u) return { data: { properties: null, user: null }, error: { status: 404, code: 'user_not_found', message: 'User not found' } };
          return { data: { properties: { action_link: 'https://link.example.test/verify?token=SECRET-TOKEN-123&type=recovery' }, user: u }, error: null };
        },
        deleteUser: async (id) => {
          authCalls.deleteUser.push(id);
          authCalls.deleteSnapshots.push({ students: (db.students || []).map((r) => r.student_id), clients: (db.clients || []).map((r) => r.client_id) });
          if (authFail === 'throwDelete') throw new Error('boom: internal auth exception');
          if (authFail === 'deleteUser') return { data: null, error: { status: 500, message: 'boom: internal auth detail' } };
          return { data: null, error: null };
        },
        getUserById: async (id) => {
          authCalls.getUserById.push(id);
          if (authFail === 'throwGet') throw new Error('boom: internal auth exception');
          if (authFail === 'getUserById') return { data: { user: null }, error: { status: 500, message: 'boom: internal auth detail' } };
          const u = Object.values(authUsers).find((x) => x.id === id);
          return u ? { data: { user: u }, error: null } : { data: { user: null }, error: { status: 404, message: 'User not found' } };
        }
      },
      getUser: async (token) => {
        const users = {
          'student-alice-token': { id: 'uuid-student-alice', email: 'alice@student.com', app_metadata: { role: 'student' } },
          'student-bob-token': { id: 'uuid-student-bob', email: 'bob@student.com', app_metadata: { role: 'student' } },
          'instructor-token': { id: 'uuid-instructor', email: 'coach@example.test', app_metadata: { role: 'instructor' } },
          'staff-token': { id: 'uuid-staff', email: 'frontdesk@example.test', app_metadata: { role: 'staff' } },
          // Spoof attempt: admin claims only in user-editable user_metadata and the students row.
          'coach2-token': { id: 'uuid-coach2', email: 'coach2@example.test', app_metadata: { role: 'instructor' } },
          'client-marcus-token': { id: 'uuid-client-1', email: 'marcus@client.example', app_metadata: { role: 'client' } },
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
const ROUTE_SRC = fs.readFileSync(path.join(ROOT, 'src/app/api/fifs/route.ts'), 'utf-8');

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

const NOT_IMPLEMENTED = ['submitStudentWaiver', 'handleLeadMagnetSubmission'];

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
    for (const action of ['updateStudentStatus', 'adminEditStudent', 'adminEditClient', 'updateStudentTask', 'adminDeleteStudent', 'adminDeleteClient', 'saveStudentScoresheet', 'deleteStudentScoresheet', 'getStudentScoresheet']) {
      const direct = backendCallArgs(action);
      assert(direct.length === 0, `${action} is still called directly at line(s) ${direct.map((c) => c.line).join(', ')}`);
      assert(new RegExp("fifsSaveOrReport\\(\\s*['\"]" + action + "['\"]").test(PUBLIC_SCRIPT), `${action} must use fifsSaveOrReport`);
    }
  });
  await test('Waiver calls always pass an error callback', async () => {
    for (const action of ['submitStudentWaiver']) {
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
      // Keys come from either a literal `updates: { ... }` block or `updates.key = ...` assignments.
      const block = src.match(/updates:\s*\{([\s\S]*?)\}/);
      const keys = [...new Set([...(block ? [...block[1].matchAll(/(\w+)\s*:/g)].map((m) => m[1]) : []), ...[...src.matchAll(/updates\.(\w+)\s*=/g)].map((m) => m[1])])];
      assert(keys.length >= 5, 'too few keys found in ' + fn + ': ' + keys.join(','));
      assert(!keys.includes('email'), fn + ' must not send the email');
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
  await test('adminDirectInvite: new students start at the canonical STEP_1_REGISTERED status (the same as enroll, and one updateStudentStatus accepts); clients are untouched', async () => {
    const invite = async (portalType, email) => {
      writes.length = 0;
      await fifs('adminDirectInvite', { portalType, generatedId: portalType === 'client' ? 'CLI-8899' : 'FIFS-8899', fullName: 'Status Person', email, phone: '', course: 'Maryland HQL 8hr' }, 'instructor-token');
      return writes.find((w) => w.op === 'insert' && w.table === (portalType === 'client' ? 'clients' : 'students'));
    };
    const student = await invite('student', 'status.student@example.test');
    assert(student && student.patch.status === 'STEP_1_REGISTERED', 'invite status: ' + (student && student.patch.status));
    const allow = (ROUTE_SRC.match(/const STUDENT_STATUS_ALLOWLIST = \[([\s\S]*?)\];/) || [])[1] || '';
    assert([...allow.matchAll(/'([^']+)'/g)].some((m) => m[1] === student.patch.status), 'the invite status must be one updateStudentStatus accepts');
    await fifs('adminEnrollStudent', { fullName: 'Enroll Person', email: 'status.enroll@example.test', phone: '', classId: 'class-1', scheduledDate: '2027-03-01T14:00:00.000Z' }, 'instructor-token');
    const enrolled = db.students.find((x) => x.email === 'status.enroll@example.test');
    assert(enrolled && enrolled.status === student.patch.status, 'invite and enroll must create students at the same status: ' + (enrolled && enrolled.status));
    const client = await invite('client', 'status.client@example.test');
    assert(client && client.patch.status === 'ACTIVE_REGISTERED', 'client status must be unchanged: ' + (client && client.patch.status));
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

  console.log('\n[SECTION E: Roster status dropdown (public script)]');
  const statusSrc = ['fifsRosterNotice', 'getStepNumberFromStatus', 'formatStepLabel', 'updateStudentJourneyStep'].map(extractFunction).join('\n');
  function loadStatusHandler(saveImpl, opts = {}) {
    const mkEl = () => ({
      style: { display: 'none', color: '', props: {}, setProperty(k, v) { this.props[k] = v; }, removeProperty(k) { delete this.props[k]; } },
      textContent: '', attrs: {},
      setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; }, getAttribute(k) { return this.attrs[k] === undefined ? null : this.attrs[k]; }
    });
    const els = { 'chip-status-FIFS-1001': mkEl() };
    if (!opts.noIndicator) els['save-ind-FIFS-1001'] = mkEl();
    els['chip-status-FIFS-1001'].textContent = 'before';
    const alerts = [];
    const ctx = { window: { adminCachedStudents: [{ studentId: 'FIFS-1001', status: 'STEP_2_CONFIRMED' }] }, document: { getElementById: (id) => els[id] || null },
      alert: (m) => alerts.push(m), setTimeout: () => 0, clearTimeout() {}, fifsSaveOrReport: saveImpl };
    vm.createContext(ctx);
    vm.runInContext(statusSrc + '\nthis.fn = updateStudentJourneyStep;', ctx);
    const select = { value: 'STEP_4_CLASSROOM', disabled: false, getAttribute: () => null };
    return { fn: ctx.fn, cache: ctx.window.adminCachedStudents, chip: els['chip-status-FIFS-1001'], ind: els['save-ind-FIFS-1001'], select, alerts };
  }
  const isGreen = (chip) => /accent-green/.test(chip.style.props.color || '') && chip.attrs['data-saved'] === 'true';
  await test('Status dropdown: sends updateStudentStatus, disables the select in flight, and shows nothing as saved yet', async () => {
    let call = null;
    const h = loadStatusHandler((action, payload, ok, fail) => { call = { action, payload, ok, fail }; });
    h.fn('FIFS-1001', 'STEP_4_CLASSROOM', h.select);
    assert(call && call.action === 'updateStudentStatus' && JSON.stringify(call.payload) === JSON.stringify({ studentId: 'FIFS-1001', status: 'STEP_4_CLASSROOM' }), 'wrong request: ' + JSON.stringify(call && call.payload));
    assert(h.select.disabled === true, 'select must be disabled while saving');
    assert(h.cache[0].status === 'STEP_2_CONFIRMED', 'cache must not change before the server confirms');
    assert(!isGreen(h.chip) && h.chip.textContent === 'before', 'chip must not look saved before confirmation');
    assert(/Saving/.test(h.ind.textContent), 'pending text expected');
  });
  await test('Status dropdown: on confirmed success the cache, chip, and select update and the chip turns green', async () => {
    let cb;
    const h = loadStatusHandler((a, p, ok) => { cb = ok; });
    h.fn('FIFS-1001', 'STEP_4_CLASSROOM', h.select);
    cb({ success: true, status: 'success' });
    assert(h.cache[0].status === 'STEP_4_CLASSROOM', 'cache should update');
    assert(h.select.disabled === false && h.select.value === 'STEP_4_CLASSROOM', 'select re-enabled at the new step');
    assert(/Classroom/.test(h.chip.textContent) && isGreen(h.chip), 'chip should show the new step in green: ' + h.chip.textContent);
    assert(/Saved/.test(h.ind.textContent) && /accent-green/.test(h.ind.style.color), 'saved indicator expected');
  });
  await test('Status dropdown: on failure the select, chip, and cache revert, nothing stays green, and an error is shown', async () => {
    let cb;
    const h = loadStatusHandler((a, p, ok, fail) => { cb = fail; });
    h.fn('FIFS-1001', 'STEP_4_CLASSROOM', h.select);
    cb(new Error('Unauthorized: Staff or administrator authentication required.'));
    assert(h.select.value === 'STEP_2_CONFIRMED' && h.select.disabled === false, 'select must revert and re-enable, got ' + h.select.value);
    assert(h.cache[0].status === 'STEP_2_CONFIRMED', 'cache must stay unchanged');
    assert(/Confirmation/.test(h.chip.textContent) && !isGreen(h.chip) && !h.chip.style.props.color, 'chip must revert, got ' + h.chip.textContent);
    assert(/^Not saved: Unauthorized/.test(h.ind.textContent) && /accent-red/.test(h.ind.style.color), 'visible red error expected, got ' + h.ind.textContent);
  });
  await test('Status dropdown: a failed save with no indicator on the row still alerts the user', async () => {
    let cb;
    const h = loadStatusHandler((a, p, ok, fail) => { cb = fail; }, { noIndicator: true });
    h.fn('FIFS-1001', 'STEP_4_CLASSROOM', h.select);
    cb(new Error('HTTP 501'));
    assert(h.alerts.length === 1 && /Not saved: HTTP 501/.test(h.alerts[0]), 'expected one alert, got ' + JSON.stringify(h.alerts));
  });
  await test('Status dropdown: an unknown step is refused in the browser without any request', async () => {
    let called = false;
    for (const bad of ['STEP_9_DONE', '', 'REGISTERED', undefined, '<img>']) {
      const h = loadStatusHandler(() => { called = true; });
      h.fn('FIFS-1001', bad, h.select);
      assert(h.select.value === 'STEP_2_CONFIRMED' && h.cache[0].status === 'STEP_2_CONFIRMED', 'must revert for ' + bad);
    }
    assert(!called, 'no request may be sent for an invalid step');
  });
  await test('Status dropdown: one definition only, no Google Apps Script or demo branch, and the row passes the select', async () => {
    assert((PUBLIC_SCRIPT.match(/function updateStudentJourneyStep\(/g) || []).length === 1, 'duplicate definition present');
    const body = extractFunction('updateStudentJourneyStep') + extractFunction('fifsRosterNotice');
    assert(!/google\.script|simulation|demo/i.test(body), 'legacy branch remains');
    assert(/fifsSaveOrReport\('updateStudentStatus'/.test(body), 'must use fifsSaveOrReport');
    const tpl = PUBLIC_SCRIPT.match(/onchange="updateStudentJourneyStep\([^"]*"/g) || [];
    assert(tpl.length === 1 && tpl.every((t) => /this\.value, this\)/.test(t)), 'the row dropdown must pass this: ' + tpl.join(' | '));
  });
  await test('Server: updateStudentStatus returns a confirmed, well-formed success and refuses bad values and non-staff', async () => {
    const ok = await fifs('updateStudentStatus', { studentId: 'FIFS-1001', status: 'STEP_5_LIVE_FIRE' }, 'instructor-token');
    assert(ok.status === 200 && ok.body.success === true && ok.body.status === 'success' && ok.body.studentId === 'FIFS-1001' && ok.body.newStatus === 'STEP_5_LIVE_FIRE', 'got ' + JSON.stringify(ok.body));
    err(await fifs('updateStudentStatus', { studentId: 'FIFS-1001', status: 'STEP_9_DONE' }, 'instructor-token'), 400);
    err(await fifs('updateStudentStatus', { studentId: 'FIFS-1001', status: 'STEP_5_LIVE_FIRE' }, 'student-alice-token'), 401);
    err(await fifs('updateStudentStatus', { studentId: 'FIFS-1001', status: 'STEP_5_LIVE_FIRE' }, null), 401);
  });

  console.log('\n[SECTION F: Student sign-in is email only]');
  const PAGE_SRC = fs.readFileSync(path.resolve(__dirname, '../src/app/page.tsx'), 'utf-8');
  await test('The student sign-in form asks for an email address only: no Student ID in label, placeholder, or helper text', async () => {
    const at = PAGE_SRC.indexOf('htmlFor="studentAuthInput"');
    assert(at > 0, 'student sign-in label not found');
    const block = PAGE_SRC.slice(PAGE_SRC.lastIndexOf('<p>', at), PAGE_SRC.indexOf('studentAuthPassword', at));
    assert(/Email Address\s*<span/.test(block) && !/Student ID|student ID|FIFS-\d/.test(block), 'label/placeholder/helper still mention a Student ID: ' + block.replace(/\s+/g, ' ').slice(0, 300));
    assert(/placeholder="e\.g\., student@example\.com"/.test(block), 'placeholder should be an email example');
    assert(/email address linked to your student account/i.test(block), 'helper text should name the linked email address');
  });
  await test('Sign-in handlers, the change-password modal, and the Forgot-password label never ask for a Student ID', async () => {
    const pageLookup = PAGE_SRC.slice(PAGE_SRC.indexOf('(window as any).lookupStudentAccount = async'), PAGE_SRC.indexOf('(window as any).lookupStudentAccount = async') + 900);
    assert(!/Student ID/.test(pageLookup) && /includes\('@'\)/.test(pageLookup), 'page handler must require an email and not mention an ID');
    for (const src of [extractFunction('lookupStudentAccount')]) assert(!/Student ID/.test(src), 'script handler mentions a Student ID');
    const cp = PAGE_SRC.slice(PAGE_SRC.indexOf('htmlFor="cpUserEmail"'), PAGE_SRC.indexOf('htmlFor="cpCurrentPassword"'));
    assert(!/Student ID|FIFS-\d|or ID/.test(cp) && /Email Address/.test(cp), 'change-password modal still asks for an ID');
    const resetSrc = fs.readFileSync(path.resolve(__dirname, '../src/Lib/auth/password-reset.ts'), 'utf-8');
    assert(/student: \{ input: 'studentAuthInput', status: 'student-login-status', label: 'Email Address' \}/.test(resetSrc), 'Forgot-password label for students must be Email Address');
  });
  await test('The client sign-in asks for an email address only, and no sign-in message anywhere asks for a Student or Client ID', async () => {
    const at = PAGE_SRC.indexOf('htmlFor="clientAuthInput"');
    assert(at > 0, 'client sign-in label not found');
    const block = PAGE_SRC.slice(at, PAGE_SRC.indexOf('/>', PAGE_SRC.indexOf('id="clientAuthInput"', at)));
    assert(/Email Address\s*<span/.test(block) && !/Client ID|Student ID/.test(block), 'client label still mentions an ID: ' + block.replace(/\s+/g, ' ').slice(0, 260));
    assert(/placeholder="e\.g\., client@example\.com"/.test(block), 'client placeholder should be an email example');
    for (const [name, text] of [['page.tsx', PAGE_SRC], ['script', PUBLIC_SCRIPT]]) {
      const lines = text.split('\n').map((l, i) => ({ l, n: i + 1 })).filter(({ l }) => /Please enter|Enter (your|the)/.test(l) && /(Student\/Client ID|Client ID|Student ID|or ID\b)/.test(l));
      assert(lines.length === 0, `${name} still asks for an ID in a message at line(s) ${lines.map((x) => x.n).join(', ')}`);
    }
  });
  await test('The Admin Hub invite result tells staff the person signs in with their email address after using the setup link', async () => {
    const at = PUBLIC_SCRIPT.indexOf("callFifsBackend('adminDirectInvite'");
    const block = PUBLIC_SCRIPT.slice(at, at + 3200);
    assert(/Sign in with email: ' \+ email/.test(block) && /sign in with that email address/.test(block), 'invite result must refer to signing in with email');
    assert(!/ID: ' \+ newId \+ \(res\.tempPassword/.test(block) && !/Temp Password/.test(block), 'the temp-password display must be gone');
    assert(/Invitation sent\. The person signs in with their email address/.test(PAGE_SRC), 'result box heading must be updated');
  });

  console.log('\n[SECTION G: Edit Student form: read-only email and cache integrity]');
  const editSrc = extractFunction('handleAdminEditStudentSubmit') + '\n' + extractFunction('getStepNumberFromStatus');
  function loadEditHandler(formOverrides = {}, studentOverrides = {}) {
    const student = { studentId: 'FIFS-1001', fullName: 'Alice Student', email: 'alice@student.com', phone: '410-555-0100', course: 'Firearms Training', assignedDate: 'Upcoming Cohort',
      status: 'STEP_2_CONFIRMED', qualificationScore: '', profileDocUrl: '#', ...studentOverrides };
    // The form as openAdminEditStudentModal fills it for this student.
    const form = { editStudentId: 'FIFS-1001', editFullName: 'Alice Student', editEmail: 'alice@student.com', editPhone: '410-555-0100', editCourse: 'Firearms Training',
      editAssignedDate: 'Upcoming Cohort', editJourneyStatus: 'STEP_2_CONFIRMED', editScore: '', editProfileDocUrl: '', editNotes: '', ...formOverrides };
    const statuses = [], closed = [], saves = [];
    const ctx = {
      window: { adminCachedStudents: [student] }, adminCachedStudents: null,
      document: { getElementById: (id) => (id === 'edit-student-status' ? { id } : (id in form ? { value: form[id] } : null)) },
      showStatus: (el, text, type) => statuses.push({ text, type }), closeAdminEditStudentModal: () => closed.push(1), renderAdminTerminal() {},
      setTimeout: (fn) => fn(), fifsSaveOrReport: (action, payload, ok, fail) => saves.push({ action, payload, ok, fail })
    };
    ctx.adminCachedStudents = ctx.window.adminCachedStudents;
    vm.createContext(ctx);
    vm.runInContext(editSrc + '\nthis.fn = handleAdminEditStudentSubmit;', ctx);
    return { submit: () => ctx.fn({ preventDefault() {} }), student, saves, statuses, closed };
  }
  await test('Edit Student: a changed name is the only thing sent, and the email is never in the payload', async () => {
    const h = loadEditHandler({ editFullName: 'Alice Q. Student' });
    h.submit();
    assert(h.saves.length === 1 && h.saves[0].action === 'adminEditStudent', 'expected one adminEditStudent call');
    assert(JSON.stringify(h.saves[0].payload) === JSON.stringify({ studentId: 'FIFS-1001', updates: { fullName: 'Alice Q. Student' } }), 'payload: ' + JSON.stringify(h.saves[0].payload));
    assert(!JSON.stringify(h.saves[0].payload).includes('email'), 'email must never be sent');
  });
  await test('Edit Student: even if the email box is edited (for example through developer tools) the email is not sent', async () => {
    const h = loadEditHandler({ editEmail: 'attacker@example.com', editPhone: '410-555-0199' });
    h.submit();
    const body = JSON.stringify(h.saves[0].payload);
    assert(!/email|attacker/i.test(body), 'a changed email reached the payload: ' + body);
    assert(JSON.stringify(h.saves[0].payload.updates) === JSON.stringify({ phone: '410-555-0199' }), 'unexpected updates: ' + body);
  });
  await test('Edit Student: nothing is sent when nothing changed, so placeholder defaults and legacy statuses are not written back', async () => {
    const h = loadEditHandler();
    h.submit();
    assert(h.saves.length === 0 && /No changes/.test(h.statuses[h.statuses.length - 1].text), 'an unchanged form must not save');
    const legacy = loadEditHandler({ editJourneyStatus: 'STEP_2_CONFIRMED' }, { status: 'CONFIRMED' });
    legacy.submit();
    assert(legacy.saves.length === 0, 'a legacy status that maps to the shown step must not be rewritten');
  });
  await test('Edit Student: the cached student is not changed before the server confirms, and a failure leaves it untouched', async () => {
    const h = loadEditHandler({ editFullName: 'Alice Q. Student', editJourneyStatus: 'STEP_5_LIVE_FIRE', editProfileDocUrl: 'https://example.com/d.pdf' });
    h.submit();
    assert(h.student.fullName === 'Alice Student' && h.student.status === 'STEP_2_CONFIRMED' && h.student.profileDocUrl === '#', 'cache changed before the server answered');
    assert(!h.statuses.some((x) => /saved successfully/.test(x.text)), 'success shown before confirmation');
    h.saves[0].fail(new Error('Unauthorized'));
    assert(h.student.fullName === 'Alice Student' && h.student.status === 'STEP_2_CONFIRMED' && h.student.profileDocUrl === '#', 'cache changed after a failed save');
    assert(/^NOT saved: Unauthorized/.test(h.statuses[h.statuses.length - 1].text) && h.closed.length === 0, 'the error must show and the modal must stay open');
  });
  await test('Edit Student: on confirmed success the cache takes the saved values, and cleared fields clear the cache', async () => {
    const h = loadEditHandler({ editFullName: 'Alice Q. Student', editJourneyStatus: 'STEP_5_LIVE_FIRE', editProfileDocUrl: 'https://example.com/d.pdf', editPhone: '' });
    h.submit();
    h.saves[0].ok({ success: true, status: 'success' });
    assert(h.student.fullName === 'Alice Q. Student' && h.student.status === 'STEP_5_LIVE_FIRE' && h.student.profileDocUrl === 'https://example.com/d.pdf' && h.student.phone === '', 'cache not updated: ' + JSON.stringify(h.student));
    assert(h.student.email === 'alice@student.com', 'email in the cache must not change');
    assert(h.statuses.some((x) => /saved successfully/.test(x.text)) && h.closed.length === 1, 'success message and close expected');
  });
  await test('Edit Student: the email input is read-only with the explanatory note, and the server still rejects an email change', async () => {
    const at = PAGE_SRC.indexOf('<input id="editEmail"');
    assert(at > 0, 'email input not found');
    const tag = PAGE_SRC.slice(at, PAGE_SRC.indexOf('/>', at));
    assert(/readOnly/.test(tag) && /aria-readonly="true"/.test(tag) && !/\brequired\b/.test(tag), 'the email input must be read-only: ' + tag.slice(0, 200));
    assert(PAGE_SRC.indexOf('Email cannot be modified here to protect login credentials.') > at, 'the inline note is missing');
    const r = await fifs('adminEditStudent', { studentId: 'FIFS-1001', updates: { email: 'other@student.com', fullName: 'Alice' } }, 'instructor-token');
    assert(r.status === 400 && /Email addresses cannot be modified here/.test(r.body.error) && writes.length === 0, 'server defense-in-depth is gone: ' + JSON.stringify(r.body));
  });

  console.log('\n[SECTION H: Dossier link validation and the Dossier button]');
  const withNodeEnv = async (value, fn) => { const prev = process.env.NODE_ENV; process.env.NODE_ENV = value; try { await fn(); } finally { if (prev === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = prev; } };
  await test('Server: dossier links must be https:// in production; script, data, vbscript, file, and blob schemes are refused with 400', async () => {
    await withNodeEnv('production', async () => {
      for (const key of ['dossier_url', 'profileDocUrl', 'profile_doc_url', 'dossierUrl']) {
        writes.length = 0;
        const ok = await edit({ [key]: 'https://example.com/docs/a.pdf' });
        assert(ok.status === 200 && writes[0].patch.profile_doc_url === 'https://example.com/docs/a.pdf', `${key}: https link should save, got ${ok.status}`);
      }
      writes.length = 0;
      for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)', 'file:///etc/passwd', 'blob:https://example.com/x',
        'about:blank', 'http://example.com/a.pdf', 'ftp://example.com/a.pdf', '//example.com/a.pdf', 'example.com/a.pdf', 'https://', 'https://user:pw@example.com/a', 'https://exa mple.com']) {
        const r = await edit({ dossier_url: bad });
        err(r, 400);
      }
      const named = await edit({ dossier_url: 'javascript:alert(1)' });
      assert(/not allowed/i.test(named.body.error) && !named.body.error.includes('alert'), 'dangerous scheme should be refused by name without echoing it: ' + named.body.error);
      noWrites();
    });
  });
  await test('Server: http:// links are accepted only outside production (local development)', async () => {
    await withNodeEnv('development', async () => {
      const r = await edit({ dossier_url: 'http://localhost:3000/doc.pdf' });
      assert(r.status === 200 && writes[0].patch.profile_doc_url === 'http://localhost:3000/doc.pdf', 'local http should be accepted, got ' + r.status);
      err(await edit({ dossier_url: 'javascript:alert(1)' }), 400);
    });
    await withNodeEnv('production', async () => {
      writes.length = 0;
      const r = await edit({ dossier_url: 'http://localhost:3000/doc.pdf' });
      err(r, 400);
      assert(/https:\/\//.test(r.body.error), 'message should ask for https: ' + r.body.error);
      noWrites();
    });
  });
  await test('Server: an empty dossier link (or the "#" placeholder) clears the link', async () => {
    for (const v of ['', '   ', '#']) {
      writes.length = 0;
      const r = await edit({ dossier_url: v });
      assert(r.status === 200 && writes[0].patch.profile_doc_url === null, `"${v}" should clear the link`);
    }
  });
  const dossierSrc = ['fifsSafeHttpUrl', 'fifsSafeId', 'openStudentDossierModal'].map(extractFunction).join('\n');
  function loadDossierButton(student) {
    const calls = { opened: [], editModal: [], alerts: [], focused: 0, scrolled: 0 };
    const urlBox = { focus() { calls.focused++; }, scrollIntoView() { calls.scrolled++; } };
    const ctx = { window: { adminCachedStudents: student ? [student] : [], open: (...a) => calls.opened.push(a), location: { origin: 'https://trainwithfifs.example' } },
      document: { getElementById: (id) => (id === 'editProfileDocUrl' ? urlBox : null) }, alert: (m) => calls.alerts.push(m), openAdminEditStudentModal: (id) => calls.editModal.push(id), URL, String };
    vm.createContext(ctx);
    vm.runInContext(dossierSrc + '\nthis.fn = openStudentDossierModal;', ctx);
    return { fn: ctx.fn, calls };
  }
  await test('Dossier button: a valid document link opens in a new tab with noopener and no form', async () => {
    const h = loadDossierButton({ studentId: 'FIFS-1001', profileDocUrl: 'https://example.com/d.pdf' });
    h.fn('FIFS-1001');
    assert(h.calls.opened.length === 1 && h.calls.opened[0][0] === 'https://example.com/d.pdf' && h.calls.opened[0][2] === 'noopener,noreferrer', 'expected a noopener open: ' + JSON.stringify(h.calls.opened));
    assert(h.calls.editModal.length === 0, 'the edit form should not open when a link exists');
  });
  await test('Dossier button: no link, the "#" placeholder, or an unsafe link opens the Edit form focused on the link box', async () => {
    for (const url of [undefined, '', '#', 'javascript:alert(1)', 'data:text/html,x', 'vbscript:x']) {
      const h = loadDossierButton({ studentId: 'FIFS-1001', profileDocUrl: url });
      h.fn('FIFS-1001');
      assert(h.calls.opened.length === 0, `nothing may be opened for ${url}: ${JSON.stringify(h.calls.opened)}`);
      assert(JSON.stringify(h.calls.editModal) === '["FIFS-1001"]' && h.calls.focused === 1 && h.calls.scrolled === 1, `edit form should open focused for ${url}`);
    }
  });
  await test('Dossier button: an unknown student alerts and does nothing else', async () => {
    const h = loadDossierButton(null);
    h.fn('FIFS-9999');
    assert(h.calls.alerts.length === 1 && h.calls.opened.length === 0 && h.calls.editModal.length === 0, 'unexpected behavior for an unknown student');
  });
  await test('Dossier button: the handler no longer depends on the missing #studentDossierModal element', async () => {
    assert(!/studentDossierModal|dossierModal/.test(extractFunction('openStudentDossierModal')), 'the dead modal lookup is still in the handler');
  });

  console.log('\n[SECTION I: adminResendSetupLink and the setup-link UI]');
  const KEY = 're_test_key_0000000000000000';
  const resendCalls = () => fetchCalls.filter((c) => /api\.resend\.com/.test(c.url)).map((c) => ({ ...JSON.parse(c.init.body) }));
  async function withResend(fn, opts = {}) {
    const prevKey = process.env.RESEND_API_KEY, prevFetch = global.fetch;
    process.env.RESEND_API_KEY = KEY;
    if (opts.failEmail) global.fetch = async (url, init = {}) => { fetchCalls.push({ url: String(url), init }); return { ok: false, status: 422, statusText: 'x', json: async () => ({}), text: async () => 'provider rejected the message' }; };
    try { await fn(); } finally { if (prevKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = prevKey; global.fetch = prevFetch; }
  }
  const resend = (studentId, extra = {}, token = 'instructor-token') => fifs('adminResendSetupLink', { studentId, ...extra }, token);
  const noEmailSent = () => assert(resendCalls().length === 0 && authCalls.generateLink.length === 0 && authCalls.createUser.length === 0, 'no email or account action may happen');

  await test('adminResendSetupLink: unauthenticated, student, and spoofed-admin callers are refused and nothing happens', async () => {
    await withResend(async () => {
      for (const token of [null, 'bad-token', 'student-alice-token', 'student-carol-token']) err(await resend('FIFS-1001', {}, token), 401);
      noEmailSent(); noWrites();
    });
  });
  await test('adminResendSetupLink: bad or unknown student IDs are refused before any account action', async () => {
    await withResend(async () => {
      for (const bad of ['', "x'; drop--", 'a b', null, ['FIFS-1001'], 5]) err(await resend(bad), 400);
      err(await resend('FIFS-9999'), 404);
      noEmailSent(); noWrites();
    });
  });
  await test('adminResendSetupLink: an existing student gets a link at the email on file; a browser-supplied email is ignored and the link is never returned', async () => {
    await withResend(async () => {
      const r = await resend('FIFS-1001', { email: 'attacker@example.com', to: 'attacker@example.com', identifier: 'attacker@example.com' });
      assert(r.status === 200 && r.body.success === true && r.body.status === 'success' && r.body.message === 'Password setup link sent to student.', `got ${r.status} ${JSON.stringify(r.body)}`);
      const mails = resendCalls();
      assert(mails.length === 1 && JSON.stringify(mails[0].to) === '["alice@student.com"]', 'must email only the record email: ' + JSON.stringify(mails.map((m) => m.to)));
      assert(mails[0].html.includes('SECRET-TOKEN-123') && !JSON.stringify(r.body).match(/SECRET-TOKEN|link\.example|alice@student|attacker/), 'the link must be in the email only, never in the response');
      assert(authCalls.generateLink.length === 1 && authCalls.generateLink[0].type === 'recovery' && authCalls.generateLink[0].email === 'alice@student.com' && /\/reset-password$/.test(authCalls.generateLink[0].options.redirectTo), 'recovery link to /reset-password expected: ' + JSON.stringify(authCalls.generateLink));
      assert(authCalls.createUser.length === 0 && r.body.accountCreated === false && r.body.accountLinked === false && writes.length === 0, 'nothing should be created or changed for a linked student');
    });
  });
  await test('adminResendSetupLink: a roster student with no sign-in gets one created without a password, linked to their record, and a link emailed', async () => {
    await withResend(async () => {
      const r = await resend('FIFS-1004');
      assert(r.status === 200 && r.body.accountCreated === true && r.body.accountLinked === true, `got ${r.status} ${JSON.stringify(r.body)}`);
      assert(authCalls.createUser.length === 1 && authCalls.createUser[0].email === 'dana.migrated@example.test' && !('password' in authCalls.createUser[0]) && authCalls.createUser[0].app_metadata.role === 'student' && authCalls.createUser[0].email_confirm === true, 'account must be created without a password: ' + JSON.stringify(authCalls.createUser));
      assert(db.students.find((x) => x.student_id === 'FIFS-1004').user_id === 'uuid-new-invitee', 'the student record must be linked to the new account');
      assert(writes.length === 1 && JSON.stringify(Object.keys(writes[0].patch).sort()) === '["updated_at","user_id"]', 'only user_id and updated_at may change: ' + JSON.stringify(writes));
      assert(resendCalls().length === 1 && JSON.stringify(resendCalls()[0].to) === '["dana.migrated@example.test"]', 'link must go to the record email');
    });
  });
  await test('adminResendSetupLink: an existing Auth account for the email is linked rather than duplicated', async () => {
    await withResend(async () => {
      const r = await resend('FIFS-1008');
      assert(r.status === 200 && r.body.accountCreated === false && r.body.accountLinked === true, `got ${r.status} ${JSON.stringify(r.body)}`);
      assert(authCalls.createUser.length === 0 && db.students.find((x) => x.student_id === 'FIFS-1008').user_id === 'uuid-self-signup', 'must link to the existing account without creating another');
    });
  });
  await test('adminResendSetupLink: a staff email, a different linked account, or an account already used by another student is refused with nothing sent', async () => {
    await withResend(async () => {
      for (const id of ['FIFS-1006', 'FIFS-1007', 'FIFS-1009']) { const r = await resend(id); err(r, 409); }
      assert(resendCalls().length === 0, 'no email may be sent');
      assert(db.students.find((x) => x.student_id === 'FIFS-1006').user_id === null && db.students.find((x) => x.student_id === 'FIFS-1009').user_id === null && db.students.find((x) => x.student_id === 'FIFS-1007').user_id === 'uuid-someone-else', 'no record may be re-linked');
      assert(writes.length === 0 && authCalls.deleteUser.length === 0 && authCalls.createUser.length === 0, 'no writes and no account changes');
    });
  });
  await test('adminResendSetupLink: a student with no email on file is refused (422)', async () => {
    await withResend(async () => { err(await resend('FIFS-1005'), 422); noEmailSent(); noWrites(); });
  });
  await test('adminResendSetupLink: an email provider failure is reported honestly, and the ready account is kept for a retry', async () => {
    await withResend(async () => {
      const r = await resend('FIFS-1004');
      assert(r.status === 502 && r.body.success === false && r.body.emailDispatched === false && /NOT delivered/.test(r.body.error), `got ${r.status} ${JSON.stringify(r.body)}`);
      assert(r.body.accountCreated === true && r.body.accountLinked === true && !/provider rejected/.test(JSON.stringify(r.body)), 'provider detail must not leak');
      const retry = await resend('FIFS-1004');
      assert(retry.status === 502 && authCalls.createUser.length === 1, 'a retry must reuse the account, not create another');
    }, { failEmail: true });
    await withResend(async () => {
      const ok = await resend('FIFS-1004');
      assert(ok.status === 200 && ok.body.accountCreated === false && ok.body.accountLinked === false, 'a later retry succeeds without creating or re-linking');
    });
  });
  await test('adminResendSetupLink: missing email configuration reports failure, never success', async () => {
    const r = await resend('FIFS-1001');
    assert(r.status === 502 && r.body.success === false && /NOT delivered/.test(r.body.error), `got ${r.status} ${JSON.stringify(r.body)}`);
  });
  await test('adminResendSetupLink: auth failures send nothing and leak no detail; a link that cannot be saved removes the account it created', async () => {
    await withResend(async () => {
      authFail = 'generateLink';
      const a = await resend('FIFS-1001'); err(a, 502);
      authFail = 'createUser';
      const b = await resend('FIFS-1004'); err(b, 502);
      assert(!/boom|internal auth/.test(JSON.stringify([a.body, b.body])), 'internal detail leaked');
      authFail = null; resetDbKeepAuth();
      updateMatchesNothing = true;
      const c = await resend('FIFS-1004'); err(c, 500);
      assert(authCalls.deleteUser.includes('uuid-new-invitee'), 'the account created for this call must be removed when linking fails');
      assert(resendCalls().length === 0, 'no email may be sent after a failure');
    });
    function resetDbKeepAuth() { delete authUsers['dana.migrated@example.test']; authCalls = { createUser: [], generateLink: [], deleteUser: [], getUserById: [], deleteSnapshots: [] }; fetchCalls.length = 0; }
  });
  await test('adminDirectInvite: when the setup email is not delivered the response says so plainly and points to the Setup link button', async () => {
    const r = await fifs('adminDirectInvite', { portalType: 'student', generatedId: 'FIFS-7788', fullName: 'Invitee Person', email: 'invitee@example.test', phone: '', course: 'Maryland HQL 8hr' }, 'instructor-token');
    assert(r.status === 502 && r.body.success === false && r.body.recordCreated === true && r.body.resendAvailable === true && /NOT delivered/.test(r.body.error) && /Setup link/.test(r.body.error) && /cannot sign in yet/.test(r.body.error), `got ${r.status} ${JSON.stringify(r.body)}`);
    assert(!/account recovery\/resend/.test(r.body.error), 'old vague instruction is back');
  });

  const setupFn = extractFunction('resendStudentSetupLink');
  function loadSetupButton(student, confirmAnswer = true) {
    const calls = { alerts: [], confirms: [], saves: [] };
    const ctx = { window: { adminCachedStudents: student ? [student] : [] }, alert: (m) => calls.alerts.push(m), confirm: (m) => { calls.confirms.push(m); return confirmAnswer; },
      fifsSaveOrReport: (action, payload, ok, fail) => calls.saves.push({ action, payload, ok, fail }) };
    vm.createContext(ctx);
    vm.runInContext(setupFn + '\nthis.fn = resendStudentSetupLink;', ctx);
    return { fn: ctx.fn, calls };
  }
  await test('Setup link button: confirms first, sends only the student ID, disables itself while sending, and reports the server result', async () => {
    const h = loadSetupButton({ studentId: 'FIFS-1004', fullName: "Dana O'Migrated", email: 'dana.migrated@example.test' });
    const btn = { disabled: false };
    h.fn('FIFS-1004', btn);
    assert(h.calls.confirms.length === 1 && h.calls.confirms[0].includes('dana.migrated@example.test'), 'a confirmation naming the email is expected');
    assert(h.calls.saves.length === 1 && h.calls.saves[0].action === 'adminResendSetupLink' && JSON.stringify(h.calls.saves[0].payload) === '{"studentId":"FIFS-1004"}', 'only the student ID may be sent: ' + JSON.stringify(h.calls.saves[0]));
    assert(btn.disabled === true, 'button must be disabled in flight');
    h.calls.saves[0].ok({ success: true, message: 'Password setup link sent to student.' });
    assert(btn.disabled === false && h.calls.alerts[0] === 'Password setup link sent to student.', 'success should re-enable and report: ' + h.calls.alerts);
    const f = loadSetupButton({ studentId: 'FIFS-1004', fullName: 'D', email: 'd@example.test' });
    const b2 = { disabled: false }; f.fn('FIFS-1004', b2); f.calls.saves[0].fail(new Error('The setup email was NOT delivered'));
    assert(b2.disabled === false && /was NOT sent: The setup email was NOT delivered/.test(f.calls.alerts[0]), 'failure must be reported: ' + f.calls.alerts);
  });
  await test('Setup link button: nothing is sent when the admin cancels, the student is unknown, or there is no email', async () => {
    const cancel = loadSetupButton({ studentId: 'FIFS-1004', fullName: 'D', email: 'd@example.test' }, false); cancel.fn('FIFS-1004', {});
    assert(cancel.calls.saves.length === 0, 'cancel must not send');
    const unknown = loadSetupButton(null); unknown.fn('FIFS-9999', {});
    assert(unknown.calls.saves.length === 0 && unknown.calls.alerts.length === 1, 'unknown student must alert only');
    const noMail = loadSetupButton({ studentId: 'FIFS-1005', fullName: 'N', email: '' }); noMail.fn('FIFS-1005', {});
    assert(noMail.calls.saves.length === 0 && /no email address/.test(noMail.calls.alerts[0]), 'no email must alert only');
  });
  await test('The roster row and Edit form offer the Setup link button; the dead first-time password box is gone', async () => {
    assert(/onclick="resendStudentSetupLink\('\$\{id\}', this\)"/.test(PUBLIC_SCRIPT), 'roster row button missing');
    assert(/data-onclick="resendStudentSetupLink\(document\.getElementById\('editStudentId'\)\.value, this\)"/.test(PAGE_SRC), 'Edit form button missing');
    for (const dead of ['student-setup-password-box', 'submitNewStudentPassword', 'studentNewPasswordInput', 'Create Your Permanent Portal Password', 'Choose a password (min 4 characters)']) {
      assert(!PAGE_SRC.includes(dead) && !PUBLIC_SCRIPT.includes(dead), `dead first-time box remnant: ${dead}`);
    }
  });

  console.log('\n[SECTION J: MSP Form 29-14 qualification score sheet]');
  const PDF = Buffer.from('%PDF-1.4\n%signed scoresheet\n');
  const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32, 1)]);
  const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32, 2)]);
  const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(16, 3)]);
  const dataUrl = (mime, buf) => `data:${mime};base64,${buf.toString('base64')}`;
  const goodSheet = (over = {}) => ({ courseOfFire: 'Handgun qualification', targetDistances: '3, 5, 7 yards', roundsFired: 50, hitsOnTarget: 48, qualificationDate: '2026-10-01',
    instructorName: 'Kai Wade', instructorNumber: 'MSP-12345', result: 'pass', notes: 'Clean run', ...over });
  const saveSheet = (sheet, extra = {}, token = 'instructor-token', studentId = 'FIFS-1001') => fifs('saveStudentScoresheet', { studentId, sheet, ...extra }, token);
  const sheetRow = (id = 'FIFS-1001') => db.student_scoresheets.find((r) => r.student_id === id);
  const noStorage = () => assert(storageCalls.upload.length === 0 && storageCalls.remove.length === 0, 'no storage action may occur: ' + JSON.stringify(storageCalls));

  await test('Score sheet save: unauthenticated, student, and spoofed-admin callers are refused and nothing is written or uploaded', async () => {
    for (const token of [null, 'bad-token', 'student-alice-token', 'student-carol-token']) {
      err(await saveSheet(goodSheet(), { fileBase64: dataUrl('application/pdf', PDF) }, token), 401);
    }
    noWrites(); noStorage();
  });
  await test('Score sheet save: bad student IDs are 400 and an unknown student is 404, with no upload', async () => {
    for (const bad of ['', "x'--", 'a b', null, 7]) err(await saveSheet(goodSheet(), {}, 'instructor-token', bad), 400);
    err(await saveSheet(goodSheet(), { fileBase64: dataUrl('application/pdf', PDF) }, 'instructor-token', 'FIFS-9999'), 404);
    noWrites(); noStorage();
  });
  await test('Score sheet save: invalid or incomplete fields are refused with 400 and nothing is written', async () => {
    const bad = [
      undefined, null, 'x', [], {}, goodSheet({ extra: 1 }), goodSheet({ finalScorePercent: 100 }), goodSheet({ user_id: 'x' }),
      goodSheet({ courseOfFire: '' }), goodSheet({ courseOfFire: 'C'.repeat(101) }), goodSheet({ courseOfFire: 'bad\u0000' }), goodSheet({ courseOfFire: 5 }),
      goodSheet({ roundsFired: 0 }), goodSheet({ roundsFired: 501 }), goodSheet({ roundsFired: 1.5 }), goodSheet({ roundsFired: 'abc' }), goodSheet({ roundsFired: null }), goodSheet({ roundsFired: -3 }),
      goodSheet({ hitsOnTarget: -1 }), goodSheet({ hitsOnTarget: 51 }), goodSheet({ hitsOnTarget: 'x' }), goodSheet({ hitsOnTarget: 1.5 }), goodSheet({ hitsOnTarget: undefined }),
      goodSheet({ qualificationDate: '' }), goodSheet({ qualificationDate: '2026-13-40' }), goodSheet({ qualificationDate: '2026-02-30' }), goodSheet({ qualificationDate: '10/01/2026' }),
      goodSheet({ qualificationDate: '2999-01-01' }), goodSheet({ qualificationDate: '1999-12-31' }), goodSheet({ qualificationDate: 20261001 }),
      goodSheet({ result: 'maybe' }), goodSheet({ result: '' }), goodSheet({ result: true }), goodSheet({ instructorName: '' }), goodSheet({ instructorName: 'I'.repeat(101) }),
      goodSheet({ instructorNumber: '<script>1</script>' }), goodSheet({ instructorNumber: 'N'.repeat(41) }), goodSheet({ notes: 'N'.repeat(1001) }), goodSheet({ notes: 'bad\u0000note' }),
      goodSheet({ targetDistances: 'D'.repeat(101) })
    ];
    for (const sheet of bad) err(await saveSheet(sheet), 400);
    noWrites(); noStorage();
  });
  await test('Score sheet save: valid fields are stored as one row per student, the score is calculated by the server, and the student record is updated', async () => {
    const r = await saveSheet(goodSheet({ roundsFired: '50', hitsOnTarget: '48' }));
    assert(r.status === 200 && r.body.success === true && r.body.status === 'success' && r.body.score === '48/50 (96%)' && r.body.finalScorePercent === 96 && r.body.hasFile === false, `got ${r.status} ${JSON.stringify(r.body)}`);
    const row = sheetRow();
    assert(row && row.image_url === '' && row.score === '48/50 (96%)' && row.passed === true && row.is_unread_by_student === true, 'row: ' + JSON.stringify(row));
    const notes = JSON.parse(row.notes);
    assert(notes.v === 1 && notes.form === 'MSP-29-14' && notes.finalScorePercent === 96 && notes.courseOfFire === 'Handgun qualification' && notes.instructorName === 'Kai Wade' && notes.result === 'pass' && notes.qualificationDate === '2026-10-01', 'stored fields: ' + row.notes);
    assert(db.students.find((x) => x.student_id === 'FIFS-1001').qualification_score === '48/50 (96%)', 'student record score not updated');
    assert(!JSON.stringify(r.body).match(/Kai Wade|Clean run|MSP-12345/), 'staff-entered details must not be echoed');
    noStorage();
  });
  await test('Score sheet save: pass, fail, and pending map to passed true, false, and null; percentages are rounded to one decimal', async () => {
    for (const [result, passed] of [['pass', true], ['fail', false], ['pending', null]]) {
      await saveSheet(goodSheet({ result, roundsFired: 9, hitsOnTarget: 7 }));
      assert(sheetRow().passed === passed && sheetRow().score === '7/9 (77.8%)', `${result}: ${JSON.stringify(sheetRow())}`);
    }
    await saveSheet(goodSheet({ roundsFired: 50, hitsOnTarget: 0, result: 'fail' }));
    assert(sheetRow().score === '0/50 (0%)', sheetRow().score);
    assert(db.student_scoresheets.filter((r) => r.student_id === 'FIFS-1001').length === 1, 'a second save must update the same row, not add another');
  });
  await test('Score sheet save: a PDF, PNG, JPEG, or WebP is stored in the private bucket under the student\'s own folder and the client file name is never used', async () => {
    for (const [mime, buf, ext] of [['application/pdf', PDF, 'pdf'], ['image/png', PNG, 'png'], ['image/jpeg', JPG, 'jpg'], ['image/webp', WEBP, 'webp']]) {
      storageCalls = { upload: [], remove: [], sign: [] };
      const r = await saveSheet(goodSheet(), { fileBase64: dataUrl(mime, buf), fileType: mime, fileName: '../../evil/../x.html' });
      assert(r.status === 200 && r.body.hasFile === true, `${mime}: got ${r.status} ${JSON.stringify(r.body)}`);
      assert(storageCalls.upload.length === 1, 'expected one upload');
      const up = storageCalls.upload[0];
      assert(up.bucket === 'scoresheets' && new RegExp('^FIFS-1001/MSP-29-14-\\d+-[0-9a-f]{8}\\.' + ext + '$').test(up.path), 'unexpected path: ' + up.path);
      assert(up.opts.contentType === mime && up.opts.upsert === false && up.size === buf.length, 'upload options: ' + JSON.stringify(up.opts));
      assert(sheetRow().image_url === up.path && !/evil|\.\./.test(up.path), 'row must point at the stored file');
    }
  });
  await test('Score sheet save: files that are not a real PDF/JPEG/PNG/WebP, are mislabeled, empty, unreadable, or over 3 MB are refused before anything is stored', async () => {
    const html = Buffer.from('<html><script>alert(1)</script></html>');
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>');
    const gif = Buffer.from('GIF89a' + 'x'.repeat(20));
    const big = Buffer.concat([PDF, Buffer.alloc(3_000_001)]);
    const cases = [
      [dataUrl('application/pdf', html), 'application/pdf'], [dataUrl('image/svg+xml', svg), 'image/svg+xml'], [dataUrl('image/gif', gif), 'image/gif'],
      [dataUrl('application/pdf', PNG), 'application/pdf'], [dataUrl('image/png', PDF), 'image/png'], [dataUrl('application/pdf', Buffer.alloc(0)), 'application/pdf'],
      ['data:application/pdf;base64,!!!notbase64!!!', 'application/pdf'], ['not a data url at all', 'application/pdf'], [dataUrl('application/pdf', big), 'application/pdf'],
      [PDF.toString('base64'), 'image/png'], [12345, 'application/pdf'], [{}, 'application/pdf']
    ];
    for (const [fileBase64, fileType] of cases) err(await saveSheet(goodSheet(), { fileBase64, fileType }), 400);
    noWrites(); noStorage();
  });
  await test('Score sheet save: a storage failure saves nothing; a database failure after the upload removes the uploaded file', async () => {
    storageFail = 'upload';
    const a = await saveSheet(goodSheet(), { fileBase64: dataUrl('application/pdf', PDF) });
    err(a, 502); noWrites();
    storageFail = null; storageCalls = { upload: [], remove: [], sign: [] };
    failOp = 'upsert';
    const b = await saveSheet(goodSheet(), { fileBase64: dataUrl('application/pdf', PDF) });
    err(b, 500);
    assert(storageCalls.upload.length === 1 && storageCalls.remove.length === 1 && storageCalls.remove[0].paths[0] === storageCalls.upload[0].path, 'the uploaded file must be cleaned up: ' + JSON.stringify(storageCalls));
    assert(!/boom|internal/.test(JSON.stringify([a.body, b.body])), 'internal detail leaked');
    assert(db.student_scoresheets.length === 0 && db.students.find((x) => x.student_id === 'FIFS-1001').qualification_score === null, 'no score may be recorded after a failed save');
  });
  await test('Score sheet save: replacing the document removes the old file; saving without a file keeps the existing one', async () => {
    db.student_scoresheets.push({ student_id: 'FIFS-1001', image_url: 'FIFS-1001/old-sheet.pdf', score: '1/1 (100%)', passed: true, notes: '' });
    const keep = await saveSheet(goodSheet());
    assert(keep.status === 200 && sheetRow().image_url === 'FIFS-1001/old-sheet.pdf' && keep.body.hasFile === true && storageCalls.remove.length === 0, 'an existing document must be kept: ' + JSON.stringify(sheetRow()));
    const swap = await saveSheet(goodSheet(), { fileBase64: dataUrl('image/png', PNG) });
    assert(swap.status === 200 && swap.body.fileReplaced === true && sheetRow().image_url !== 'FIFS-1001/old-sheet.pdf', 'new file expected');
    assert(storageCalls.remove.length === 1 && storageCalls.remove[0].paths[0] === 'FIFS-1001/old-sheet.pdf', 'the replaced file must be removed: ' + JSON.stringify(storageCalls.remove));
  });
  await test('Score sheet save: if the student record cannot be updated the response says the sheet was saved but the record was not', async () => {
    failOp = 'update';
    const r = await saveSheet(goodSheet());
    assert(r.status === 500 && r.body.success === false && r.body.sheetSaved === true && /could not be updated/.test(r.body.error) && !/boom|internal/.test(JSON.stringify(r.body)), `got ${r.status} ${JSON.stringify(r.body)}`);
  });
  await test('Score sheet read: only staff can read it, the document is a short-lived signed link, and the other fields come back parsed', async () => {
    await saveSheet(goodSheet(), { fileBase64: dataUrl('application/pdf', PDF) });
    for (const token of [null, 'bad-token', 'student-alice-token', 'student-carol-token']) err(await fifs('getStudentScoresheet', { studentId: 'FIFS-1001' }, token), 401);
    storageCalls.sign.length = 0;
    const r = await fifs('getStudentScoresheet', { studentId: 'FIFS-1001' }, 'staff-token');
    assert(r.status === 200 && r.body.success === true && r.body.scoresheet.sheet.courseOfFire === 'Handgun qualification' && r.body.scoresheet.sheet.result === 'pass' && r.body.scoresheet.score === '48/50 (96%)' && r.body.scoresheet.hasFile === true, `got ${r.status} ${JSON.stringify(r.body)}`);
    assert(/^https:\/\/files\.example\.test\/signed\/FIFS-1001\//.test(r.body.scoresheet.fileUrl) && storageCalls.sign.length === 1 && storageCalls.sign[0].ttl === 600, 'a 10-minute signed link is expected');
    assert(!JSON.stringify(r.body).includes(sheetRow().image_url.replace(/\?.*/, '')) || /signed/.test(r.body.scoresheet.fileUrl), 'only the signed link may carry the file location');
  });
  await test('Score sheet read: no sheet is null, plain-text legacy notes are not parsed as a form, and a file path outside the student\'s folder is never signed', async () => {
    const none = await fifs('getStudentScoresheet', { studentId: 'FIFS-1001' }, 'instructor-token');
    assert(none.status === 200 && none.body.scoresheet === null, 'expected null');
    db.student_scoresheets.push({ student_id: 'FIFS-1001', image_url: 'FIFS-1002/other-students-file.pdf', score: '', passed: null, notes: 'Verified by Instructor Kai Wade (MSP Form 29-14)' });
    storageCalls.sign.length = 0;
    const legacy = await fifs('getStudentScoresheet', { studentId: 'FIFS-1001' }, 'instructor-token');
    assert(legacy.body.scoresheet.sheet === null && /Verified by Instructor/.test(legacy.body.scoresheet.legacyNotes) && legacy.body.scoresheet.hasFile === false && legacy.body.scoresheet.fileUrl === null && storageCalls.sign.length === 0, 'unexpected legacy read: ' + JSON.stringify(legacy.body));
    err(await fifs('getStudentScoresheet', { studentId: "x'--" }, 'instructor-token'), 400);
    failOp = 'select';
    const down = await fifs('getStudentScoresheet', { studentId: 'FIFS-1001' }, 'instructor-token');
    err(down, 500); assert(!/boom|internal/.test(JSON.stringify(down.body)), 'detail leaked');
  });
  await test('Score sheet delete: staff only; removes the file, the row, and the student\'s score; and reports failures honestly', async () => {
    for (const token of [null, 'student-alice-token', 'student-carol-token']) err(await fifs('deleteStudentScoresheet', { studentId: 'FIFS-1001' }, token), 401);
    err(await fifs('deleteStudentScoresheet', { studentId: 'FIFS-1001' }, 'instructor-token'), 404);
    await saveSheet(goodSheet(), { fileBase64: dataUrl('application/pdf', PDF) });
    const path = sheetRow().image_url; storageCalls = { upload: [], remove: [], sign: [] };
    storageFail = 'remove';
    const stuck = await fifs('deleteStudentScoresheet', { studentId: 'FIFS-1001' }, 'instructor-token');
    err(stuck, 502); assert(sheetRow() && /nothing was deleted/i.test(stuck.body.error), 'a file that cannot be removed must leave the sheet in place');
    storageFail = null; storageCalls = { upload: [], remove: [], sign: [] };
    const ok = await fifs('deleteStudentScoresheet', { studentId: 'FIFS-1001' }, 'instructor-token');
    assert(ok.status === 200 && ok.body.success === true && !sheetRow() && storageCalls.remove.length === 1 && storageCalls.remove[0].paths[0] === path, `got ${ok.status} ${JSON.stringify(ok.body)}`);
    assert(db.students.find((x) => x.student_id === 'FIFS-1001').qualification_score === null, 'the student score must be cleared');
    failOp = 'delete';
    await saveSheet(goodSheet());
    err(await fifs('deleteStudentScoresheet', { studentId: 'FIFS-1001' }, 'instructor-token'), 500);
  });

  // ---- browser side ----
  const ssSrc = ['fifsScoresheetValue', 'fifsScoresheetFeedback', 'fifsScoresheetPercentText', 'fifsScoresheetUpdatePercent', 'fifsBindScoresheetPercentListeners', 'fifsScoresheetReadForm', 'fifsScoresheetSetBadge', 'fifsScoresheetFillForm', 'fifsLoadScoresheetForEdit', 'handleSaveScoresheetFromEdit', 'handleDeleteScoresheetFromEdit', 'fifsSafeHttpUrl']
    .map(extractFunction).join('\n') + '\nvar FIFS_SCORESHEET_MAX_FILE_BYTES = 3000000;';
  function loadScoresheetUi(values = {}, opts = {}) {
    const els = {};
    const make = (id, v = '') => (els[id] = { id, value: v, style: {}, textContent: '', disabled: false, files: [], listeners: {}, removeAttribute(k) { delete this[k]; }, setAttribute() {},
      addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }, dispatch(type) { (this.listeners[type] || []).forEach((fn) => fn({ type, target: this })); } });
    for (const id of ['ssCourseOfFire', 'ssTargetDistances', 'ssRoundsFired', 'ssHitsOnTarget', 'ssFinalPercent', 'ssQualificationDate', 'ssInstructorName', 'ssInstructorNumber', 'ssResult', 'ssNotes',
      'editScoresheetFileInput', 'editScoresheetFeedback', 'editScoresheetStatusBadge', 'editScoresheetViewLink', 'btnDeleteScoresheetFromEdit', 'btnSaveScoresheetFromEdit', 'editScore']) make(id);
    make('editStudentId', 'FIFS-1001');
    Object.assign(els, {});
    const form = { ssCourseOfFire: 'Handgun qualification', ssRoundsFired: '50', ssHitsOnTarget: '48', ssQualificationDate: '2026-10-01', ssInstructorName: 'Kai Wade', ssResult: 'pass', ...values };
    for (const [k, v] of Object.entries(form)) els[k].value = v;
    const saves = [], alerts = [];
    const student = { studentId: 'FIFS-1001', qualificationScore: '' };
    class FakeReader { readAsDataURL(f) { if (opts.readerFails) this.onerror(); else this.onload({ target: { result: 'data:' + f.type + ';base64,QUJD' } }); } }
    const ctx = { window: { adminCachedStudents: [student], location: { origin: 'https://trainwithfifs.example' } }, document: { getElementById: (id) => els[id] || null }, alert: (m) => alerts.push(m), confirm: () => true, FileReader: FakeReader, URL, String, Number, Math,
      fifsSaveOrReport: (action, payload, ok, fail) => saves.push({ action, payload, ok, fail }) };
    vm.createContext(ctx);
    vm.runInContext(ssSrc + '\nthis.api = { read: fifsScoresheetReadForm, save: handleSaveScoresheetFromEdit, del: handleDeleteScoresheetFromEdit, fill: fifsScoresheetFillForm, load: fifsLoadScoresheetForEdit, pct: fifsScoresheetPercentText, bind: fifsBindScoresheetPercentListeners };', ctx);
    return { api: ctx.api, els, saves, alerts, student };
  }
  await test('Score sheet form: client checks mirror the server and the percentage is calculated', async () => {
    const ok = loadScoresheetUi().api.read();
    assert(ok.sheet && ok.sheet.roundsFired === 50 && ok.sheet.hitsOnTarget === 48 && ok.sheet.result === 'pass' && !('finalScorePercent' in ok.sheet), 'valid form: ' + JSON.stringify(ok));
    for (const bad of [{ ssCourseOfFire: '' }, { ssRoundsFired: '0' }, { ssRoundsFired: '501' }, { ssRoundsFired: 'x' }, { ssHitsOnTarget: '51' }, { ssHitsOnTarget: '-1' }, { ssQualificationDate: '' }, { ssInstructorName: '' }, { ssResult: 'maybe' }]) {
      assert(loadScoresheetUi(bad).api.read().error, 'should be refused: ' + JSON.stringify(bad));
    }
    const p = loadScoresheetUi().api.pct;
    assert(p('50', '48') === '96%' && p('9', '7') === '77.8%' && p('50', '0') === '0%' && p('0', '0') === '' && p('50', '51') === '' && p('', '') === '', 'percentages');
  });
  await test('Score sheet form: saving sends the fields only after validation, disables the button, and shows success only after the server confirms', async () => {
    const h = loadScoresheetUi();
    h.api.save();
    assert(h.saves.length === 1 && h.saves[0].action === 'saveStudentScoresheet' && h.saves[0].payload.studentId === 'FIFS-1001' && h.saves[0].payload.sheet.courseOfFire === 'Handgun qualification' && !('fileBase64' in h.saves[0].payload) && !('fileName' in h.saves[0].payload), 'payload: ' + JSON.stringify(h.saves[0] && h.saves[0].payload));
    assert(h.els.btnSaveScoresheetFromEdit.disabled === true && /Saving/.test(h.els.editScoresheetFeedback.textContent), 'must show a pending state');
    assert(h.student.qualificationScore === '' && !/saved/i.test(h.els.editScoresheetFeedback.textContent), 'nothing may look saved before the server answers');
    h.saves[0].ok({ success: true, status: 'success', score: '48/50 (96%)' });
    assert(h.els.btnSaveScoresheetFromEdit.disabled === false && h.student.qualificationScore === '48/50 (96%)' && h.els.editScore.value === '48/50 (96%)', 'success should update the cached score and the Score box');
    const f = loadScoresheetUi(); f.api.save(); f.saves[0].fail(new Error('Unauthorized'));
    assert(f.els.btnSaveScoresheetFromEdit.disabled === false && /^NOT saved: Unauthorized/.test(f.els.editScoresheetFeedback.textContent) && f.student.qualificationScore === '', 'failure must be reported and change nothing');
    const inv = loadScoresheetUi({ ssHitsOnTarget: '99' }); inv.api.save();
    assert(inv.saves.length === 0 && /cannot be more/.test(inv.els.editScoresheetFeedback.textContent), 'an invalid form must not be sent');
  });
  await test('Score sheet form: an attached file is size- and type-checked in the browser and sent as base64 with its type, never its name', async () => {
    const att = (h, file) => { h.els.editScoresheetFileInput.files = [file]; };
    const ok = loadScoresheetUi(); att(ok, { size: 1000, type: 'application/pdf', name: 'C:\\fakepath\\my scan.pdf' }); ok.api.save();
    assert(ok.saves.length === 1 && /^data:application\/pdf;base64,/.test(ok.saves[0].payload.fileBase64) && ok.saves[0].payload.fileType === 'application/pdf' && !JSON.stringify(ok.saves[0].payload).includes('fakepath'), 'file payload: ' + JSON.stringify(ok.saves[0] && Object.keys(ok.saves[0].payload)));
    const big = loadScoresheetUi(); att(big, { size: 3000001, type: 'application/pdf' }); big.api.save();
    assert(big.saves.length === 0 && /too large/.test(big.els.editScoresheetFeedback.textContent), 'oversize files must not be sent');
    for (const type of ['text/html', 'image/gif', 'image/svg+xml', '']) { const w = loadScoresheetUi(); att(w, { size: 10, type }); w.api.save(); assert(w.saves.length === 0, 'type should be refused: ' + type); }
    const rf = loadScoresheetUi({}, { readerFails: true }); att(rf, { size: 10, type: 'image/png' }); rf.api.save();
    assert(rf.saves.length === 0 && /could not be read/.test(rf.els.editScoresheetFeedback.textContent), 'an unreadable file must not be sent');
  });
  await test('Score sheet form: a saved sheet fills the form and badge; the document link is shown only when it is a safe http(s) URL', async () => {
    const h = loadScoresheetUi();
    h.api.fill({ sheet: { courseOfFire: 'CoF', roundsFired: 50, hitsOnTarget: 40, qualificationDate: '2026-09-01', instructorName: 'I', instructorNumber: 'N1', result: 'fail', notes: 'n' }, score: '40/50 (80%)', hasFile: true, fileUrl: 'https://files.example.test/s.pdf' });
    assert(h.els.ssCourseOfFire.value === 'CoF' && h.els.ssRoundsFired.value === '50' && h.els.ssFinalPercent.value === '80%' && h.els.ssResult.value === 'fail', 'form not filled');
    assert(/^FAIL/.test(h.els.editScoresheetStatusBadge.textContent) && h.els.editScoresheetViewLink.href === 'https://files.example.test/s.pdf' && h.els.btnDeleteScoresheetFromEdit.style.display === 'inline-block', 'badge or link wrong');
    for (const url of ['javascript:alert(1)', 'data:text/html,x', 'vbscript:x']) { h.api.fill({ sheet: null, score: '', hasFile: true, fileUrl: url }); assert(h.els.editScoresheetViewLink.style.display === 'none' && !h.els.editScoresheetViewLink.href, 'unsafe link shown: ' + url); }
    h.api.fill(null);
    assert(h.els.ssCourseOfFire.value === '' && /No score sheet/.test(h.els.editScoresheetStatusBadge.textContent) && h.els.btnDeleteScoresheetFromEdit.style.display === 'none', 'clearing failed');
  });
  await test('Score sheet percentage: typing in the rounds or hits box updates the calculated percentage on input and on change', async () => {
    const h = loadScoresheetUi({ ssRoundsFired: '', ssHitsOnTarget: '' });
    h.api.bind();
    const rounds = h.els.ssRoundsFired, hits = h.els.ssHitsOnTarget, out = h.els.ssFinalPercent;
    rounds.value = '50'; rounds.dispatch('input');
    assert(out.value === '', 'hits still blank, so the percentage must stay blank: ' + JSON.stringify(out.value));
    hits.value = '4'; hits.dispatch('input'); assert(out.value === '8%', 'after typing 4: ' + out.value);
    hits.value = '48'; hits.dispatch('input'); assert(out.value === '96%', 'after typing 48: ' + out.value);
    rounds.value = '60'; rounds.dispatch('input'); assert(out.value === '80%', 'rounds edit must recalculate: ' + out.value);
    hits.value = '45'; hits.dispatch('change'); assert(out.value === '75%', 'a change event (spinner or paste) must recalculate: ' + out.value);
    rounds.value = '9'; hits.value = '7'; rounds.dispatch('change'); assert(out.value === '77.8%', 'rounds change event: ' + out.value);
  });
  await test('Score sheet percentage: blank, non-numeric, zero, negative, oversized, and hits-above-rounds inputs leave it blank, never NaN or Infinity', async () => {
    const h = loadScoresheetUi();
    h.api.bind();
    const rounds = h.els.ssRoundsFired, hits = h.els.ssHitsOnTarget, out = h.els.ssFinalPercent;
    const cases = [['', ''], ['50', ''], ['', '48'], ['abc', '5'], ['50', 'abc'], ['0', '0'], ['0', '5'], ['-5', '1'], ['50', '-1'], ['1.5', '1'], ['50', '1.5'], ['1e2', '5'], ['50', '51'], ['501', '10'], ['99999', '1'],
      ['50', '99999'], ['  ', '  '], ['5 0', '4'], ['NaN', 'NaN'], ['Infinity', '1'], ['٣٠', '1']];
    for (const [r, hs] of cases) {
      out.value = 'stale'; rounds.value = r; hits.value = hs; hits.dispatch('input');
      assert(out.value === '', `rounds=${JSON.stringify(r)} hits=${JSON.stringify(hs)} should show blank, got ${JSON.stringify(out.value)}`);
      assert(!/NaN|Infinity/.test(out.value), 'NaN or Infinity leaked');
    }
    for (const [r, hs, want] of [['50', '50', '100%'], ['50', '0', '0%'], ['500', '1', '0.2%'], ['1', '1', '100%'], [' 50 ', ' 48 ', '96%'], ['3', '1', '33.3%'], ['3', '2', '66.7%']]) {
      rounds.value = r; hits.value = hs; rounds.dispatch('input');
      assert(out.value === want, `rounds=${JSON.stringify(r)} hits=${JSON.stringify(hs)} should be ${want}, got ${out.value}`);
    }
    const p = h.api.pct;
    assert(p(undefined, undefined) === '' && p(null, null) === '' && p(50, 48) === '96%', 'null/undefined/number inputs must be handled');
  });
  await test('Score sheet percentage: listeners are bound once per box however often the form opens, and opening the form binds them', async () => {
    const h = loadScoresheetUi();
    h.api.bind(); h.api.bind(); h.api.bind();
    for (const id of ['ssRoundsFired', 'ssHitsOnTarget']) {
      assert((h.els[id].listeners.input || []).length === 1 && (h.els[id].listeners.change || []).length === 1, `${id} must have exactly one input and one change listener`);
    }
    const fresh = loadScoresheetUi();
    assert(!(fresh.els.ssRoundsFired.listeners.input || []).length, 'precondition: nothing bound yet');
    fresh.api.load('FIFS-1001');
    for (const id of ['ssRoundsFired', 'ssHitsOnTarget']) assert((fresh.els[id].listeners.input || []).length === 1, `opening the form must bind ${id}`);
    fresh.els.ssRoundsFired.value = '10'; fresh.els.ssHitsOnTarget.value = '9'; fresh.els.ssHitsOnTarget.dispatch('input');
    assert(fresh.els.ssFinalPercent.value === '90%', 'typing after opening the form must update the percentage: ' + fresh.els.ssFinalPercent.value);
  });
  await test('Score sheet percentage: the script attaches real input and change listeners instead of relying on an unsupported data-oninput attribute', async () => {
    const fn = extractFunction('fifsBindScoresheetPercentListeners');
    assert(/addEventListener\('input', fifsScoresheetUpdatePercent\)/.test(fn) && /addEventListener\('change', fifsScoresheetUpdatePercent\)/.test(fn) && /ssRoundsFired/.test(fn) && /ssHitsOnTarget/.test(fn), 'listeners missing');
    assert(/DOMContentLoaded', fifsBindScoresheetPercentListeners/.test(PUBLIC_SCRIPT), 'listeners should also be bound at page load');
    const boxes = ['ssRoundsFired', 'ssHitsOnTarget'].map((id) => PAGE_SRC.slice(PAGE_SRC.indexOf('<input id="' + id + '"'), PAGE_SRC.indexOf('/>', PAGE_SRC.indexOf('<input id="' + id + '"'))));
    assert(boxes.every((b) => b.length > 20 && !/data-oninput/.test(b)), 'the inert data-oninput attribute should be gone from the two boxes');
  });
  await test('Score sheet UI wiring: the fields exist once in the Edit form, the old standalone modals and handlers are gone, and the roster button opens the Edit form', async () => {
    for (const id of ['ssCourseOfFire', 'ssTargetDistances', 'ssRoundsFired', 'ssHitsOnTarget', 'ssFinalPercent', 'ssQualificationDate', 'ssInstructorName', 'ssInstructorNumber', 'ssResult', 'ssNotes', 'editScoresheetFileInput', 'btnSaveScoresheetFromEdit', 'editScoresheetCard']) {
      assert((PAGE_SRC.match(new RegExp('id="' + id + '"', 'g')) || []).length === 1, `${id} should appear exactly once`);
    }
    assert(/id="ssFinalPercent"[^>]*readOnly/.test(PAGE_SRC), 'the calculated percentage must be read-only');
    for (const dead of ['adminScoresheetModal', 'scoresheetModalFileInput', 'closeStudentScoresheetModal', 'saveStudentScoresheetFromModal', 'deleteCurrentStudentScoresheet', 'handleUploadScoresheetFromEdit', 'editScoresheetScore']) {
      assert(!PAGE_SRC.includes(dead) && !PUBLIC_SCRIPT.includes(dead), `old scoresheet remnant: ${dead}`);
    }
    assert(/function openStudentScoresheetModal\(studentId\) \{\s*openAdminEditStudentModal\(studentId\);/.test(PUBLIC_SCRIPT), 'the roster Scoresheet button must open the Edit form');
    assert(/fifsLoadScoresheetForEdit\(s\.studentId\)/.test(PUBLIC_SCRIPT), 'the Edit form must load the saved sheet when it opens');
  });

  console.log('\n[SECTION K: Global data-oninput delegation]');
  const tsLib = require('typescript');
  const blockFrom = (marker) => {
    const a = PAGE_SRC.indexOf(marker);
    assert(a > 0, 'could not find in page.tsx: ' + marker);
    const end = '\n    };\n';
    return PAGE_SRC.slice(a, PAGE_SRC.indexOf(end, a) + end.length);
  };
  const delegatorJs = tsLib.transpileModule(blockFrom('    const decodeEntities = ') + '\n' + blockFrom('    const handleDelegatedInput = '), { compilerOptions: { target: tsLib.ScriptTarget.ES2022 } }).outputText;
  // A minimal element tree: closest('[attr]') walks up the parents like the browser does.
  const node = (attrs = {}, parent = null, value = '') => ({
    attrs, parent, value, getAttribute(n) { return Object.prototype.hasOwnProperty.call(this.attrs, n) ? this.attrs[n] : null; },
    closest(sel) { const name = sel.slice(1, -1); for (let n = this; n; n = n.parent) if (Object.prototype.hasOwnProperty.call(n.attrs, name)) return n; return null; }
  });
  function loadDelegator() {
    const log = { search: [], contacts: 0, resize: [], errors: [], events: [], thisIs: [] };
    const ctx = {
      console: { error: (...a) => log.errors.push(a.map(String).join(' ')), log() {}, warn() {} },
      handleSearch: (v) => log.search.push(v), filterContacts: () => { log.contacts++; }, autoResizeInput: (el) => log.resize.push(el),
      record: function (ev) { log.events.push(ev && ev.type); log.thisIs.push(this); }
    };
    vm.createContext(ctx);
    vm.runInContext(delegatorJs + '\nthis.run = handleDelegatedInput;', ctx);
    return { run: ctx.run, log };
  }
  const inputEvent = (target) => ({ type: 'input', target });

  await test('Delegated input: typing in the state search box runs handleSearch with the typed text', async () => {
    const d = loadDelegator();
    const box = node({ 'data-oninput': 'handleSearch(this.value)' }, null, 'Virg');
    d.run(inputEvent(box));
    box.value = 'Virginia'; d.run(inputEvent(box));
    assert(JSON.stringify(d.log.search) === '["Virg","Virginia"]', 'each keystroke should run the handler with the current value: ' + JSON.stringify(d.log.search));
  });
  await test('Delegated input: the contact search and the chat box handlers run, and the chat box gets itself as the argument', async () => {
    const d = loadDelegator();
    d.run(inputEvent(node({ 'data-oninput': 'filterContacts()' })));
    const chat = node({ 'data-oninput': 'autoResizeInput(this)', 'data-onkeydown': 'handleInputKey(event)' });
    d.run(inputEvent(chat));
    assert(d.log.contacts === 1 && d.log.resize.length === 1 && d.log.resize[0] === chat, 'contacts: ' + d.log.contacts + ', resize target ok: ' + (d.log.resize[0] === chat));
  });
  await test('Delegated input: events bubble from a child to the nearest ancestor with data-oninput, and handlers receive the event', async () => {
    const d = loadDelegator();
    const outer = node({ 'data-oninput': 'record(event)' });
    const inner = node({ 'data-oninput': 'record(event)' }, outer);
    const leaf = node({}, inner);
    d.run(inputEvent(leaf));
    assert(d.log.events.length === 1 && d.log.events[0] === 'input', 'exactly one handler should run, with the event: ' + JSON.stringify(d.log.events));
    const viaThis = loadDelegator();
    const holder = node({ 'data-oninput': 'handleSearch(this.getAttribute("data-oninput").length)' }); const child = node({}, holder);
    viaThis.run(inputEvent(child));
    assert(viaThis.log.search.length === 1 && typeof viaThis.log.search[0] === 'number', '`this` must be the element carrying the attribute');
  });
  await test('Delegated input: the handler runs synchronously, so any debounce a handler does itself is unaffected', async () => {
    const d = loadDelegator();
    d.run(inputEvent(node({ 'data-oninput': 'handleSearch(1); handleSearch(2)' })));
    assert(JSON.stringify(d.log.search) === '[1,2]', 'the whole handler must have run before run() returned');
  });
  await test('Delegated input: HTML-escaped attribute text is decoded like the other delegators', async () => {
    const d = loadDelegator();
    d.run(inputEvent(node({ 'data-oninput': 'handleSearch(&quot;a&quot;)' })));
    d.run(inputEvent(node({ 'data-oninput': 'handleSearch(&#x27;b&#x27;)' })));
    assert(JSON.stringify(d.log.search) === '["a","b"]', 'decoded attributes: ' + JSON.stringify(d.log.search) + ' errors ' + JSON.stringify(d.log.errors));
  });
  await test('Delegated input: elements without data-oninput, empty attributes, and non-element targets are ignored without errors', async () => {
    const d = loadDelegator();
    const cases = [inputEvent(node({})), inputEvent(node({ 'data-oninput': '' })), inputEvent(node({}, node({ 'data-onclick': 'x()' }))), inputEvent(null), inputEvent(undefined), inputEvent({}), inputEvent('text'), inputEvent(42), { type: 'input' }];
    for (const ev of cases) { let threw = null; try { d.run(ev); } catch (e) { threw = e; } assert(!threw, 'threw: ' + (threw && threw.message)); }
    assert(d.log.search.length === 0 && d.log.contacts === 0 && d.log.errors.length === 0, 'nothing should have run or been logged');
  });
  await test('Delegated input: a handler that is broken, throws, or names a missing function is logged and never thrown to the page', async () => {
    const d = loadDelegator();
    for (const bad of ['handleSearch(', 'noSuchFunction(this.value)', 'throw new Error("boom")', '}{', 'handleSearch(undefinedVariable)']) {
      let threw = null; try { d.run(inputEvent(node({ 'data-oninput': bad }))); } catch (e) { threw = e; }
      assert(!threw, `"${bad}" threw out of the delegator`);
    }
    assert(d.log.errors.length === 5 && d.log.errors.every((m) => /Error executing data-oninput handler/.test(m)), 'each failure should be logged once: ' + JSON.stringify(d.log.errors));
    d.run(inputEvent(node({ 'data-oninput': 'handleSearch("still works")' })));
    assert(d.log.search[0] === 'still works', 'a later good handler must still run');
  });
  await test('Delegated input: the page registers one document-level input listener and removes it on cleanup', async () => {
    assert((PAGE_SRC.match(/document\.addEventListener\('input', handleDelegatedInput\)/g) || []).length === 1, 'exactly one registration expected');
    assert((PAGE_SRC.match(/document\.removeEventListener\('input', handleDelegatedInput\)/g) || []).length === 1, 'the listener must be removed on cleanup');
    assert(!/e\.preventDefault\(\)/.test(blockFrom('    const handleDelegatedInput = ')), 'typing must not be cancelled');
  });
  await test('Every data-oninput in the page calls a function the page actually defines (state search, contact search, admin chat box, visitor chat box)', async () => {
    const used = [...PAGE_SRC.matchAll(/data-oninput="([^"]*)"/g)].map((m) => m[1]);
    assert(used.length === 4, 'expected the four known data-oninput elements, found ' + used.length + ': ' + used.join(' | '));
    for (const attr of used) {
      const fn = (attr.match(/^(\w+)\(/) || [])[1];
      assert(fn, 'handler is not a simple call: ' + attr);
      const defined = new RegExp('function ' + fn + '\\s*\\(').test(PUBLIC_SCRIPT) || new RegExp('window\\.' + fn + '\\s*=').test(PUBLIC_SCRIPT);
      assert(defined, `${fn} (used by data-oninput) is not defined by the script`);
    }
    assert(/window\.handleSearch = handleSearch;/.test(PUBLIC_SCRIPT), 'handleSearch must be exported to window to be reachable from the delegator');
    assert(!/\bonInput=/.test(PAGE_SRC.slice(PAGE_SRC.indexOf('id="stateSearchInput"') - 200, PAGE_SRC.indexOf('id="stateSearchInput"') + 400)), 'a React onInput on the same box would fire the handler twice');
  });

  console.log('\n[SECTION L: adminEditClient and the keydown unmount cleanup]');
  // ---- keydown cleanup: run the page's real registration and cleanup lines against a fake document and window ----
  const HANDLERS = ['handleDelegatedClick', 'handleDelegatedChange', 'handleDelegatedKeyDown', 'handleDelegatedInput', 'handleDelegatedSubmit', 'handleModalEscapeKey'];
  const addLines = [...PAGE_SRC.matchAll(/^\s*(document|window)\.addEventListener\('(\w+)', (\w+)( as any)?\);/gm)].filter((m) => HANDLERS.includes(m[3])).map((m) => m[0].trim().replace(' as any', ''));
  const cleanupStart = PAGE_SRC.indexOf("window.removeEventListener('keydown', handleModalEscapeKey);");
  const cleanupBlock = PAGE_SRC.slice(PAGE_SRC.lastIndexOf('return () => {', cleanupStart), PAGE_SRC.indexOf('\n    };', cleanupStart));
  const removeLines = [...cleanupBlock.matchAll(/^\s*(document|window)\.removeEventListener\('(\w+)', (\w+)( as any)?\);/gm)].map((m) => m[0].trim().replace(' as any', ''));
  function mountAndUnmount() {
    const registry = [];
    const target = (name) => ({
      addEventListener: (type, fn) => { if (!registry.some((r) => r.name === name && r.type === type && r.fn === fn)) registry.push({ name, type, fn }); },
      removeEventListener: (type, fn) => { const i = registry.findIndex((r) => r.name === name && r.type === type && r.fn === fn); if (i >= 0) registry.splice(i, 1); }
    });
    const ctx = { document: target('document'), window: target('window') };
    for (const h of HANDLERS) ctx[h] = function () {};
    vm.createContext(ctx);
    return { registry, mount: () => addLines.forEach((l) => vm.runInContext(l, ctx)), unmount: () => removeLines.forEach((l) => vm.runInContext(l, ctx)) };
  }
  await test('Unmount cleanup removes every delegated listener, including keydown, and a remount does not stack duplicates', async () => {
    assert(addLines.length === 6, `expected the 6 delegator registrations in page.tsx, found ${addLines.length}: ${addLines.join(' | ')}`);
    assert(removeLines.length === 6, `expected 6 removals in the cleanup, found ${removeLines.length}: ${removeLines.join(' | ')}`);
    const types = (list) => list.map((l) => l.match(/^(document|window)\.\w+\('(\w+)', (\w+)/).slice(1).join(':')).sort();
    assert(JSON.stringify(types(addLines)) === JSON.stringify(types(removeLines)), 'every registration needs a matching removal.\nadds: ' + types(addLines) + '\nremoves: ' + types(removeLines));
    assert(removeLines.some((l) => /document\.removeEventListener\('keydown', handleDelegatedKeyDown\)/.test(l)), 'the document keydown delegator must be removed on cleanup');
    const m = mountAndUnmount();
    m.mount();
    assert(m.registry.length === 6, 'six listeners expected after mount, got ' + m.registry.length);
    m.unmount();
    assert(m.registry.length === 0, 'listeners left registered after unmount: ' + m.registry.map((r) => r.name + ':' + r.type).join(', '));
    m.mount(); m.unmount(); m.mount();
    const perType = {}; m.registry.forEach((r) => { const k = r.name + ':' + r.type; perType[k] = (perType[k] || 0) + 1; });
    assert(m.registry.length === 6 && Object.values(perType).every((n) => n === 1), 'a remount must leave exactly one of each listener: ' + JSON.stringify(perType));
    m.unmount();
    assert(m.registry.length === 0, 'listeners left after the final unmount');
  });

  // ---- adminEditClient (server) ----
  const clientRow = (id = 'CLI-1001') => db.clients.find((r) => r.client_id === id);
  const editClient = (updates, token = 'instructor-token', clientId = 'CLI-1001') => fifs('adminEditClient', { clientId, updates }, token);
  const validClient = () => ({ fullName: 'Marcus A. Client', phone: '(410) 555-0199', permitState: 'Virginia Concealed Handgun', expirationDate: '2027-03-15', status: 'RENEWAL_PENDING' });
  await test('adminEditClient: unauthenticated, client, student, and spoofed-admin callers are refused and nothing is written', async () => {
    for (const token of [null, 'bad-token', 'client-marcus-token', 'student-alice-token', 'student-carol-token']) err(await editClient(validClient(), token), 401);
    noWrites();
  });
  await test('adminEditClient: instructor, staff, and admin-role staff can save, and an unknown client is 404', async () => {
    for (const token of ['instructor-token', 'staff-token']) { const r = await editClient({ phone: '410-555-0123' }, token); assert(r.status === 200 && r.body.success === true && r.body.status === 'success', `${token}: ${r.status} ${JSON.stringify(r.body)}`); }
    writes.length = 0;
    err(await editClient({ phone: '410-555-0123' }, 'instructor-token', 'CLI-9999'), 404);
    noWrites();
  });
  await test('adminEditClient: bad client IDs and bad payload shapes are refused with 400', async () => {
    for (const id of ['', '   ', "x'; drop--", 'a b', null, 7, ['CLI-1001'], 'C'.repeat(65)]) err(await editClient({ phone: '410-555-0123' }, 'instructor-token', id), 400);
    for (const u of [undefined, null, 'x', ['a'], 7]) err(await fifs('adminEditClient', { clientId: 'CLI-1001', updates: u }, 'instructor-token'), 400);
    err(await fifs('adminEditClient', { clientId: 'CLI-1001', client: validClient() }, 'instructor-token'), 400);
    err(await editClient({}), 400);
    noWrites();
  });
  await test('adminEditClient: a changed email is rejected with the exact message; an unchanged email is accepted and ignored', async () => {
    const r = await editClient({ fullName: 'Marcus', email: 'other@client.example' });
    err(r, 400);
    assert(r.body.error === 'Email addresses cannot be modified here to avoid desyncing portal login credentials.', r.body.error);
    for (const bad of ['', null, 5, ['marcus@client.example'], 'MARCUS@client.example.evil']) err(await editClient({ fullName: 'Marcus', email: bad }), 400);
    err(await editClient({ email: 'other@client.example' }), 400);
    err(await editClient({ email: 'marcus@client.example' }), 400);
    noWrites();
    const same = await editClient({ email: ' MARCUS@Client.Example ', phone: '410-555-0124' });
    assert(same.status === 200 && writes.length === 1 && !('email' in writes[0].patch) && clientRow().email === 'marcus@client.example', 'an unchanged email must never be written: ' + JSON.stringify(writes));
  });
  await test('adminEditClient: identity, login, SMS, and password fields are rejected and nothing is written', async () => {
    const forbidden = ['user_id', 'userId', 'client_id', 'clientId', 'id', 'role', 'is_admin', 'password', 'newPassword', 'temp_password_reset', 'password_expires_at', 'last_password_change',
      'sms_alert_phone', 'sms_carrier', 'sms_milestones', 'opt_in_reminder', 'permit_type', 'created_at', 'updated_at', 'token', 'internal_notes', 'dossier_url', 'constructor', 'toString'];
    for (const k of forbidden) err(await editClient({ fullName: 'Marcus', [k]: 'x' }), 400);
    err(await editClient(JSON.parse('{"fullName":"Marcus","__proto__":{"is_admin":true}}')), 400);
    noWrites();
  });
  await test('adminEditClient: whitelisted fields save to exactly their columns with an updated timestamp, and identity columns stay put', async () => {
    const r = await editClient(validClient());
    assert(r.status === 200 && r.body.success === true && r.body.status === 'success' && r.body.message === 'Client record updated.' && r.body.clientId === 'CLI-1001', `got ${r.status} ${JSON.stringify(r.body)}`);
    assert(writes.length === 1 && writes[0].table === 'clients' && writes[0].rows === 1, 'expected one single-row update');
    assert(JSON.stringify(Object.keys(writes[0].patch).sort()) === JSON.stringify(['expiration_date', 'full_name', 'permit_state', 'phone', 'status', 'updated_at']), 'columns: ' + Object.keys(writes[0].patch));
    const c = clientRow();
    assert(c.full_name === 'Marcus A. Client' && c.phone === '(410) 555-0199' && c.permit_state === 'Virginia Concealed Handgun' && c.expiration_date === '2027-03-15' && c.status === 'RENEWAL_PENDING', 'values not saved: ' + JSON.stringify(c));
    assert(c.email === 'marcus@client.example' && c.user_id === 'uuid-client-1' && c.client_id === 'CLI-1001', 'identity columns must not change');
    assert(c.updated_at !== '2026-01-01T00:00:00.000Z' && !isNaN(Date.parse(c.updated_at)), 'updated_at must be refreshed');
    assert(!JSON.stringify(r.body).match(/Virginia|555|2027/), 'saved values must not be echoed');
  });
  await test('adminEditClient: aliases (snake_case and camelCase) work; a client with no public ID can be edited by its row ID', async () => {
    const a = await editClient({ full_name: 'Snake Case', permit_state: 'Pennsylvania LTCF', expiration_date: '2027-01-01', phone: '410-555-0188' });
    assert(a.status === 200 && clientRow().full_name === 'Snake Case', `got ${a.status} ${JSON.stringify(a.body)}`);
    const uuid = '3f1c2b54-7d0e-4a3b-9c11-0a1b2c3d4e5f'; writes.length = 0;
    const b = await editClient({ status: 'RENEWED' }, 'instructor-token', uuid);
    assert(b.status === 200 && db.clients.find((r) => r.id === uuid).status === 'RENEWED' && writes[0].patch.status === 'RENEWED', `got ${b.status} ${JSON.stringify(b.body)}`);
    err(await editClient({ fullName: 'A', full_name: 'B' }), 400);
  });
  await test('adminEditClient: phone, date, permit type, status, and name are validated; blank phone and date are stored as null', async () => {
    for (const good of ['410-555-0100', '(410) 555-0100', '+1 410.555.0100', '4105550100', ' 410 555 0100 ']) { writes.length = 0; const r = await editClient({ phone: good }); assert(r.status === 200, `phone ${good}: ${r.status} ${JSON.stringify(r.body)}`); }
    for (const bad of ['abc', '555', '1'.repeat(16), '410-555-0100 ext 5', '410/555/0100', '<script>1</script>', 'bad\u0000phone', '1'.repeat(40), 5, {}, ['410']]) err(await editClient({ phone: bad }), 400);
    for (const bad of ['2026-13-40', '2026-02-30', '10/01/2026', '1999-12-31', '2101-01-01', 'tomorrow', 20261001, null]) err(await editClient({ expirationDate: bad }), 400);
    for (const bad of ['Texas LTC', '', 'maryland wear & carry', 5, null]) err(await editClient({ permitState: bad }), 400);
    for (const bad of ['EXPIRED', 'active_registered', '', 5, null, 'ACTIVE_PERMIT_HOLDER']) err(await editClient({ status: bad }), 400);
    for (const bad of ['', '   ', 'N'.repeat(121), 'bad\u0000name', 5, null]) err(await editClient({ fullName: bad }), 400);
    writes.length = 0;
    const blank = await editClient({ phone: '   ', expirationDate: '' });
    assert(blank.status === 200 && writes[0].patch.phone === null && writes[0].patch.expiration_date === null, 'blank phone and date should be stored as null (both columns are nullable)');
    const past = await editClient({ expirationDate: '2020-05-01' });
    assert(past.status === 200, 'a past expiration date (an expired permit) must be allowed');
  });
  await test('adminEditClient: database failures are reported without leaking detail, and an unconfirmed update is 409', async () => {
    failOp = 'update'; const a = await editClient({ phone: '410-555-0100' }); err(a, 500);
    failOp = 'select'; const b = await editClient({ phone: '410-555-0100' }); err(b, 500);
    assert(!/boom|internal/.test(JSON.stringify([a.body, b.body])), 'internal detail leaked');
    failOp = null; updateMatchesNothing = true; err(await editClient({ phone: '410-555-0100' }), 409);
  });
  await test('adminEditClient: the editable-column allowlist is exactly full_name, phone, permit_state, expiration_date, and status', async () => {
    const m = ROUTE_SRC.match(/const ADMIN_EDIT_CLIENT_FIELDS: Record<string, string> = \{([\s\S]*?)\n\};/);
    assert(m, 'the allowlist map was not found in route.ts');
    const pairs = [...m[1].matchAll(/(\w+):\s*'(\w+)'/g)].map((x) => [x[1], x[2]]);
    const columns = [...new Set(pairs.map((pair) => pair[1]))].sort();
    assert(JSON.stringify(columns) === JSON.stringify(['expiration_date', 'full_name', 'permit_state', 'phone', 'status']), 'editable columns changed: ' + columns.join(','));
    for (const [key] of pairs) assert(!/^(email|user_?id|client_?id|id|password|token|role|sms|opt_|temp_|last_|created|updated)/i.test(key), 'a protected field is in the allowlist: ' + key);
  });
  await test('adminEditClient: the permit-type and status allowlists match the options in the edit form', async () => {
    const options = (id) => { const at = PAGE_SRC.indexOf('<select id="' + id + '"'); const block = PAGE_SRC.slice(at, PAGE_SRC.indexOf('</select>', at)); return [...block.matchAll(/<option value="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&')); };
    const list = (name) => { const m = ROUTE_SRC.match(new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\];')); assert(m, name + ' not found in route.ts'); return [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]); };
    assert(JSON.stringify(options('editClientPermitState')) === JSON.stringify(list('CLIENT_PERMIT_STATE_ALLOWLIST')), 'permit types differ from the form: ' + options('editClientPermitState') + ' vs ' + list('CLIENT_PERMIT_STATE_ALLOWLIST'));
    assert(JSON.stringify(options('editClientStatus')) === JSON.stringify(list('CLIENT_STATUS_ALLOWLIST')), 'statuses differ from the form: ' + options('editClientStatus') + ' vs ' + list('CLIENT_STATUS_ALLOWLIST'));
    assert(!/adminEditClient:/.test(ROUTE_SRC.slice(ROUTE_SRC.indexOf('const NOT_IMPLEMENTED_ACTIONS'), ROUTE_SRC.indexOf('};', ROUTE_SRC.indexOf('const NOT_IMPLEMENTED_ACTIONS')))), 'adminEditClient is still listed as not implemented');
  });

  // ---- client edit form (browser) ----
  const clientFormSrc = extractFunction('handleAdminEditClientSubmit');
  function loadClientForm(formOver = {}, clientOver = {}) {
    const client = { clientId: 'CLI-1001', fullName: 'Marcus Client', email: 'marcus@client.example', phone: '410-555-0111', permitState: 'Maryland Wear & Carry', expirationDate: '2026-12-31', status: 'ACTIVE_REGISTERED', ...clientOver };
    const form = { editClientId: 'CLI-1001', editClientFullName: 'Marcus Client', editClientEmail: 'marcus@client.example', editClientPhone: '410-555-0111', editClientPermitState: 'Maryland Wear & Carry',
      editClientExpDate: '2026-12-31', editClientStatus: 'ACTIVE_REGISTERED', ...formOver };
    const statuses = [], saves = [], closed = [];
    const ctx = { window: { adminCachedClients: [client] }, adminCachedClients: null, document: { getElementById: (id) => (id === 'edit-client-status' ? { id } : (id in form ? { value: form[id] } : null)) },
      showStatus: (el, text, type) => statuses.push({ text, type }), closeAdminEditClientModal: () => closed.push(1), renderAdminClientTerminal() {}, setTimeout: (fn) => fn(),
      fifsSaveOrReport: (action, payload, ok, fail) => saves.push({ action, payload, ok, fail }) };
    ctx.adminCachedClients = ctx.window.adminCachedClients;
    vm.createContext(ctx); vm.runInContext(clientFormSrc + '\nthis.fn = handleAdminEditClientSubmit;', ctx);
    return { submit: () => ctx.fn({ preventDefault() {} }), client, saves, statuses, closed };
  }
  await test('Edit Client form: only changed fields are sent, the email never is (even if the box is edited), and nothing is sent when nothing changed', async () => {
    const h = loadClientForm({ editClientPhone: '410-555-0199', editClientEmail: 'attacker@example.com' });
    h.submit();
    assert(h.saves.length === 1 && h.saves[0].action === 'adminEditClient' && JSON.stringify(h.saves[0].payload) === JSON.stringify({ clientId: 'CLI-1001', updates: { phone: '410-555-0199' } }), 'payload: ' + JSON.stringify(h.saves[0] && h.saves[0].payload));
    assert(!/email|attacker/i.test(JSON.stringify(h.saves[0].payload)), 'the email must never be sent');
    const none = loadClientForm(); none.submit();
    assert(none.saves.length === 0 && /No changes/.test(none.statuses[none.statuses.length - 1].text), 'an unchanged form must not save');
    const legacy = loadClientForm({ editClientPermitState: '', editClientStatus: '' }, { permitState: 'Maryland', status: 'ACTIVE_PERMIT_HOLDER' }); legacy.submit();
    assert(legacy.saves.length === 0, 'dropdowns that show nothing (saved values the list does not offer) must not be sent');
  });
  await test('Edit Client form: the cache changes only after the server confirms, and a failure leaves it untouched with the modal open', async () => {
    const h = loadClientForm({ editClientFullName: 'Marcus A. Client', editClientStatus: 'RENEWED', editClientExpDate: '2027-05-05' });
    h.submit();
    assert(h.client.fullName === 'Marcus Client' && h.client.status === 'ACTIVE_REGISTERED' && !h.statuses.some((x) => /updated/i.test(x.text)), 'nothing may change or look saved before the server answers');
    h.saves[0].fail(new Error('Unauthorized'));
    assert(h.client.fullName === 'Marcus Client' && h.client.status === 'ACTIVE_REGISTERED' && /^NOT saved: Unauthorized/.test(h.statuses[h.statuses.length - 1].text) && h.closed.length === 0, 'failure must change nothing');
    const ok = loadClientForm({ editClientFullName: 'Marcus A. Client', editClientStatus: 'RENEWED', editClientExpDate: '2027-05-05' }); ok.submit(); ok.saves[0].ok({ success: true });
    assert(ok.client.fullName === 'Marcus A. Client' && ok.client.status === 'RENEWED' && ok.client.expirationDate === '2027-05-05' && ok.client.email === 'marcus@client.example' && ok.closed.length === 1, 'success should update the cache: ' + JSON.stringify(ok.client));
  });
  await test('Edit Client form: the email input is read-only with the explanatory note', async () => {
    const at = PAGE_SRC.indexOf('<input id="editClientEmail"');
    const tag = PAGE_SRC.slice(at, PAGE_SRC.indexOf('/>', at));
    assert(at > 0 && /readOnly/.test(tag) && /aria-readonly="true"/.test(tag) && !/\brequired\b/.test(tag), 'the client email input must be read-only: ' + tag.slice(0, 160));
    assert(PAGE_SRC.indexOf('Email cannot be modified here to protect login credentials.', at) > at, 'the note is missing');
  });

  console.log('\n[SECTION M: Comms HUD contact search]');
  const hudSrc = ['escapeChatHtml', 'getContactSearchQuery', 'contactMatchesQuery', 'renderLiveVisitorRoster', 'filterContacts'].map(extractFunction).join('\n');
  function loadHud(session = { name: 'Marcus Visitor', phone: '4105550100', threadId: 'thread_4105550100' }, query = '') {
    const search = { id: 'contactSearchInput', value: query, attrs: { 'data-oninput': 'filterContacts()' }, parent: null,
      getAttribute(n) { return Object.prototype.hasOwnProperty.call(this.attrs, n) ? this.attrs[n] : null; },
      closest(sel) { const name = sel.slice(1, -1); for (let n = this; n; n = n.parent) if (Object.prototype.hasOwnProperty.call(n.attrs, name)) return n; return null; } };
    const children = [];
    const container = { id: 'contactRosterContainer', set innerHTML(v) { if (v === '') children.length = 0; }, get innerHTML() { return children.map((c) => c.innerHTML || c.textContent || '').join(''); }, appendChild(c) { children.push(c); } };
    const ctx = { window: { __activeChatSession: session }, console: { error() {}, log() {}, warn() {} },
      document: { getElementById: (id) => (id === 'contactRosterContainer' ? container : (id === 'contactSearchInput' ? search : null)),
        createElement: () => ({ className: '', innerHTML: '', textContent: '', style: {}, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }) } };
    vm.createContext(ctx);
    vm.runInContext(hudSrc + '\nthis.api = { render: renderLiveVisitorRoster, filter: filterContacts };', ctx);
    const typed = (text) => { search.value = text; ctx.api.filter(); };
    return { api: ctx.api, search, children, typed, ctx, delegate: () => {
      // The real page delegator, so a real input event reaches filterContacts() the way it does in the browser.
      const dctx = Object.assign(ctx, { decodedFrom: null });
      vm.runInContext(delegatorJs + '\nthis.runInput = handleDelegatedInput;', dctx);
      return (text) => { search.value = text; dctx.runInput({ type: 'input', target: search }); };
    } };
  }
  const cards = (h) => h.children.filter((c) => /contact-card/.test(c.className));
  const emptyState = (h) => h.children.filter((c) => /contact-empty/.test(c.className));

  await test('Comms HUD search: a blank search shows the contact card, and a whitespace-only search still shows it', async () => {
    const h = loadHud();
    h.api.render();
    assert(cards(h).length === 1 && emptyState(h).length === 0 && /Marcus Visitor/.test(cards(h)[0].innerHTML), 'the card should show with no query');
    h.typed('   '); assert(cards(h).length === 1 && emptyState(h).length === 0, 'a whitespace-only query shows everything');
  });
  await test('Comms HUD search: typing filters case-insensitively by visitor name, session ID, or session label', async () => {
    const h = loadHud();
    for (const q of ['marcus', 'MARCUS', 'Marcus Vis', 'visitor', 'thread_4105550100', 'THREAD_410', '4105550100', 'peer-to-instructor', 'comm link', 'peer link', 'chief desk', 'sec-net', 'live', 'marcus thread_4105']) {
      h.typed(q);
      assert(cards(h).length === 1 && emptyState(h).length === 0, `"${q}" should match the card`);
    }
  });
  await test('Comms HUD search: a query that matches nothing hides the card and shows a clean empty state; clearing the box restores it', async () => {
    const h = loadHud();
    for (const q of ['zzz', 'marcus zzz', 'dana', 'thread_999', 'x']) {
      h.typed(q);
      assert(cards(h).length === 0 && emptyState(h).length === 1 && emptyState(h)[0].textContent === 'No matching contacts' && emptyState(h)[0].attrs.role === 'status', `"${q}" should show the empty state, found ${cards(h).length} cards`);
    }
    h.typed(''); assert(cards(h).length === 1 && emptyState(h).length === 0, 'clearing the box must restore the card');
    h.typed('nomatch'); h.typed('marcus'); assert(cards(h).length === 1 && emptyState(h).length === 0, 'refining back to a match must restore the card');
  });
  await test('Comms HUD search: the query is plain text, so pattern characters and markup match nothing and never throw', async () => {
    const h = loadHud();
    for (const q of ['.*', '(', '[a-z]+', '\\', '<img src=x onerror=alert(1)>', '%', '$^', '"; drop table', '\u0000']) {
      let threw = null; try { h.typed(q); } catch (e) { threw = e; }
      assert(!threw, `"${q}" threw: ${threw && threw.message}`);
      assert(cards(h).length === 0 && emptyState(h).length === 1, `"${q}" should match nothing`);
    }
  });
  await test('Comms HUD search: a hostile visitor name is still escaped in the card and can be searched for', async () => {
    const h = loadHud({ name: '<img src=x onerror=alert(1)>', threadId: 'thread_1' });
    h.api.render();
    assert(cards(h).length === 1 && !/<img/i.test(cards(h)[0].innerHTML) && /&lt;img/.test(cards(h)[0].innerHTML), 'name must be escaped: ' + cards(h)[0].innerHTML.slice(0, 120));
    h.typed('onerror'); assert(cards(h).length === 1, 'the name text is searchable');
  });
  await test('Comms HUD search: a real input event on the search box (through the page delegator) filters the roster as the user types', async () => {
    const h = loadHud();
    const type = h.delegate();
    h.api.render();
    type('m'); assert(cards(h).length === 1, 'm matches');
    type('mx'); assert(cards(h).length === 0 && emptyState(h).length === 1, 'mx matches nothing');
    type('mar'); assert(cards(h).length === 1, 'mar matches again');
    type(''); assert(cards(h).length === 1 && emptyState(h).length === 0, 'cleared');
    assert(/data-oninput="filterContacts\(\)"/.test(PAGE_SRC.slice(PAGE_SRC.indexOf('id="contactSearchInput"') - 300, PAGE_SRC.indexOf('id="contactSearchInput"') + 400)), 'the search box must call filterContacts() on input');
  });
  await test('Comms HUD search: other callers that redraw the roster (such as starting a chat) also respect the current search', async () => {
    const h = loadHud(undefined, 'zzz');
    h.api.render();
    assert(cards(h).length === 0 && emptyState(h).length === 1, 'a redraw with an active query must stay filtered');
    h.search.value = ''; h.api.render();
    assert(cards(h).length === 1, 'a redraw with no query shows the card');
  });

  console.log('\n[SECTION N: Visitor chat intake box auto-resize]');
  const chatTag = (() => { const at = PAGE_SRC.indexOf('<textarea id="chatMessageText"'); return PAGE_SRC.slice(at, PAGE_SRC.indexOf('>', PAGE_SRC.indexOf('style={{', at)) + 1); })();
  await test('The visitor chat message box carries the auto-resize attribute, a 120 px cap, and scrolls beyond it', async () => {
    assert(/data-oninput="autoResizeInput\(this\)"/.test(chatTag), 'data-oninput="autoResizeInput(this)" missing on #chatMessageText: ' + chatTag.slice(0, 200));
    assert(/"maxHeight": "120px"/.test(chatTag) && /"overflowY": "auto"/.test(chatTag), 'the box needs a 120 px cap with scrolling: ' + chatTag.slice(-260));
    assert((PAGE_SRC.match(/id="chatMessageText"/g) || []).length === 1 && !/onInput=/.test(chatTag), 'one box, and no React onInput that would resize twice');
  });
  await test('Auto-resize: the box grows to fit its content and stops cleanly at 120 px, like the admin chat box', async () => {
    const ctx = {}; vm.createContext(ctx);
    vm.runInContext(extractFunction('autoResizeInput') + '\nthis.fn = autoResizeInput;', ctx);
    const sizes = [[40, '40px'], [85, '85px'], [119, '119px'], [120, '120px'], [121, '120px'], [300, '120px'], [5000, '120px']];
    for (const [scrollHeight, want] of sizes) {
      const el = { style: { height: '999px' }, scrollHeight };
      ctx.fn(el);
      assert(el.style.height === want, `scrollHeight ${scrollHeight} should give ${want}, got ${el.style.height}`);
    }
    const heights = []; const el = { style: {}, get scrollHeight() { heights.push(this.style.height); return 200; } };
    ctx.fn(el);
    assert(heights[0] === 'auto', 'the height must be reset to auto before measuring so the box can also shrink: ' + heights[0]);
    assert(ctx.fn(null) === undefined && ctx.fn(undefined) === undefined, 'a missing element must be ignored');
  });
  await test('Typing in the visitor chat box (a real input event through the page delegator) resizes it, using the attribute that is actually in the page', async () => {
    const attr = (chatTag.match(/data-oninput="([^"]*)"/) || [])[1];
    assert(attr, 'attribute not found');
    const el = { style: { height: 'auto' }, scrollHeight: 300, attrs: { 'data-oninput': attr }, getAttribute(n) { return this.attrs[n] === undefined ? null : this.attrs[n]; }, closest(sel) { return this.attrs[sel.slice(1, -1)] !== undefined ? this : null; } };
    const ctx = { console: { error() {}, log() {}, warn() {} } };
    vm.createContext(ctx);
    vm.runInContext(delegatorJs + '\n' + extractFunction('autoResizeInput') + '\nthis.run = handleDelegatedInput;', ctx);
    ctx.run({ type: 'input', target: el });
    assert(el.style.height === '120px', 'typing should resize the box, got ' + el.style.height);
    el.scrollHeight = 60; ctx.run({ type: 'input', target: el });
    assert(el.style.height === '60px', 'deleting text should shrink it again, got ' + el.style.height);
  });

  console.log('\n[SECTION O: Client delete confirmation]');
  function loadClientDelete(confirmAnswer, clients) {
    const calls = { confirms: [], saves: [], alerts: [], renders: 0 };
    const ctx = { adminCachedClients: clients, confirm: (m) => { calls.confirms.push(m); return confirmAnswer; }, alert: (m) => calls.alerts.push(m), getStaffSessionToken() {},
      fifsSaveOrReport: (action, payload, ok, fail) => calls.saves.push({ action, payload, ok, fail }), renderAdminClientTerminal: () => { calls.renders++; }, refreshAdminRoster() {} };
    vm.createContext(ctx);
    vm.runInContext(extractFunction('deleteClientFromRoster') + '\nthis.fn = deleteClientFromRoster;', ctx);
    return { fn: ctx.fn, calls, ctx };
  }
  await test('Client delete confirmation names the client and ID and contains no raw template syntax, whatever the name holds', async () => {
    for (const name of ['Marcus Client', "Sean O'Connor", 'Mary-Ann "Mac" Quinn', 'A&B Tactical <b>Co</b>', '$' + '{evil}', 'back`tick']) {
      const h = loadClientDelete(false, [{ clientId: 'CLI-1001', fullName: name }]);
      h.fn('CLI-1001');
      assert(h.calls.confirms.length === 1, 'one confirmation expected');
      const msg = h.calls.confirms[0];
      assert(msg.includes(name) && msg.includes('CLI-1001'), `the prompt should name the client and ID: ${msg}`);
      const withoutName = msg.replace(name, '');
      assert(!/[{}$`]/.test(withoutName), `raw template syntax leaked into the prompt: ${msg}`);
      assert(/permanently delete/i.test(msg) && /cannot be undone/i.test(msg), 'the prompt should warn that deletion is permanent: ' + msg);
    }
    const unknown = loadClientDelete(false, []); unknown.fn('CLI-9999');
    assert(unknown.calls.confirms[0].includes('CLI-9999') && !/[{}$`]/.test(unknown.calls.confirms[0]), 'an ID with no cached client still reads cleanly: ' + unknown.calls.confirms[0]);
  });
  await test('Client delete: cancelling deletes nothing; confirming sends only the client ID, and a failure is reported', async () => {
    const no = loadClientDelete(false, [{ clientId: 'CLI-1001', fullName: 'Marcus' }]); no.fn('CLI-1001');
    assert(no.calls.saves.length === 0 && no.ctx.adminCachedClients.length === 1 && no.calls.renders === 0, 'cancel must not delete or redraw');
    const yes = loadClientDelete(true, [{ clientId: 'CLI-1001', fullName: 'Marcus' }, { clientId: 'CLI-1002', fullName: 'Other' }]); yes.fn('CLI-1001');
    assert(yes.calls.saves.length === 1 && yes.calls.saves[0].action === 'adminDeleteClient' && JSON.stringify(yes.calls.saves[0].payload) === '{"clientId":"CLI-1001"}', 'payload: ' + JSON.stringify(yes.calls.saves[0] && yes.calls.saves[0].payload));
    assert(yes.ctx.adminCachedClients.length === 1 && yes.ctx.adminCachedClients[0].clientId === 'CLI-1002', 'only the confirmed client is removed from the list');
    yes.calls.saves[0].fail(new Error('Unauthorized'));
    assert(/was NOT deleted: Unauthorized/.test(yes.calls.alerts[0]), 'a failed delete must be reported: ' + yes.calls.alerts);
  });
  await test('Neither roster delete confirmation (student or client) has a damaged placeholder left in the script', async () => {
    for (const fn of ['deleteStudentFromRoster', 'deleteClientFromRoster']) {
      const src = extractFunction(fn);
      const confirmCall = src.slice(src.indexOf('confirm('), src.indexOf('{', src.indexOf('confirm(')));
      assert(!/`/.test(confirmCall) && !/\{\w+\}\)/.test(confirmCall), `${fn} still has a template-literal confirmation: ${confirmCall}`);
    }
  });

  console.log('\n[SECTION P: Sign-in cleanup on delete, canonical client permit type, Clients refresh, invite error message]');
  const delStudent = (payload, token = 'instructor-token') => fifs('adminDeleteStudent', payload, token);
  const delClient = (payload, token = 'instructor-token') => fifs('adminDeleteClient', payload, token);
  const noAuthCalls = () => assert(authCalls.deleteUser.length === 0 && authCalls.getUserById.length === 0, 'no account lookup or deletion may happen: ' + JSON.stringify({ del: authCalls.deleteUser, get: authCalls.getUserById }));

  await test('Delete student: after the record is removed its sign-in account is deleted too, in that order, and the response says so', async () => {
    const r = await delStudent({ studentId: 'FIFS-1013' });
    assert(r.status === 200 && r.body.success === true && r.body.authCleanup === 'removed' && r.body.authUserRemoved === true, `got ${r.status} ${JSON.stringify(r.body)}`);
    assert(!db.students.some((x) => x.student_id === 'FIFS-1013'), 'the student record must be gone');
    assert(JSON.stringify(authCalls.deleteUser) === '["uuid-dana"]', 'exactly the linked account should be deleted: ' + JSON.stringify(authCalls.deleteUser));
    assert(!authCalls.deleteSnapshots[0].students.includes('FIFS-1013'), 'the record must already be deleted when the account is deleted');
    assert(!JSON.stringify(r.body).includes('uuid-dana') && !/dana\.linked/.test(JSON.stringify(r.body)), 'neither the account id nor the email may be echoed');
  });
  await test('Delete student by email also removes the linked sign-in', async () => {
    const r = await delStudent({ email: 'dana.linked@example.test' });
    assert(r.status === 200 && r.body.authCleanup === 'removed' && JSON.stringify(authCalls.deleteUser) === '["uuid-dana"]', `got ${r.status} ${JSON.stringify(r.body)}`);
  });
  await test('Delete client: after the record is removed its sign-in account is deleted too', async () => {
    const r = await delClient({ clientId: 'CLI-2002' });
    assert(r.status === 200 && r.body.success === true && r.body.authCleanup === 'removed' && r.body.authUserRemoved === true, `got ${r.status} ${JSON.stringify(r.body)}`);
    assert(!db.clients.some((x) => x.client_id === 'CLI-2002') && JSON.stringify(authCalls.deleteUser) === '["uuid-client-2"]', 'record gone and exactly its account deleted');
    assert(!authCalls.deleteSnapshots[0].clients.includes('CLI-2002'), 'the record must already be deleted when the account is deleted');
  });
  await test('Delete: a record with no linked sign-in makes no account lookup or deletion', async () => {
    const r = await delStudent({ studentId: 'FIFS-1004' });
    assert(r.status === 200 && r.body.authCleanup === 'none' && r.body.authUserRemoved === null, `got ${r.status} ${JSON.stringify(r.body)}`);
    noAuthCalls();
    const missing = await delStudent({ studentId: 'FIFS-9999' });
    assert(missing.status === 200 && missing.body.authCleanup === 'none', 'an unknown record must not trigger any account deletion');
    noAuthCalls();
  });
  await test('Delete: a failure to delete the sign-in is logged and reported but never fails the delete, and leaks no detail', async () => {
    authFail = 'deleteUser';
    const s1 = await delStudent({ studentId: 'FIFS-1013' });
    assert(s1.status === 200 && s1.body.success === true && s1.body.authCleanup === 'failed' && s1.body.authUserRemoved === false && /could not be removed automatically/.test(s1.body.message), `student: ${s1.status} ${JSON.stringify(s1.body)}`);
    assert(!db.students.some((x) => x.student_id === 'FIFS-1013'), 'the record removal stands');
    const c1 = await delClient({ clientId: 'CLI-2002' });
    assert(c1.status === 200 && c1.body.success === true && c1.body.authCleanup === 'failed', `client: ${c1.status} ${JSON.stringify(c1.body)}`);
    assert(!/boom|internal auth/.test(JSON.stringify([s1.body, c1.body])), 'internal detail leaked');
  });
  await test('Delete: if the record cannot be deleted nothing happens to the sign-in', async () => {
    failOp = 'delete';
    const r = await delStudent({ studentId: 'FIFS-1013' });
    assert(r.status === 500 && r.body.success === false, `got ${r.status} ${JSON.stringify(r.body)}`);
    noAuthCalls();
    assert(db.students.some((x) => x.student_id === 'FIFS-1013'), 'the record must still exist');
  });
  await test('Delete: a sign-in that belongs to staff, to the signed-in caller, or to another record is never deleted', async () => {
    const staffLinked = await delStudent({ studentId: 'FIFS-1014' });
    assert(staffLinked.status === 200 && staffLinked.body.authCleanup === 'skipped' && staffLinked.body.authUserRemoved === false, 'a staff account must be skipped: ' + JSON.stringify(staffLinked.body));
    const self = await delStudent({ studentId: 'FIFS-1015' }, 'coach2-token');
    assert(self.status === 200 && self.body.authCleanup === 'skipped', 'the caller\'s own account must be skipped: ' + JSON.stringify(self.body));
    const sharedStudent = await delStudent({ studentId: 'FIFS-1016' });
    assert(sharedStudent.status === 200 && sharedStudent.body.authCleanup === 'skipped', 'an account still linked to a client record must be skipped: ' + JSON.stringify(sharedStudent.body));
    assert(authCalls.deleteUser.length === 0, 'none of the three skipped accounts may have been deleted: ' + JSON.stringify(authCalls.deleteUser));
    // The shared account goes only when its last record goes: the client record still existed above; now it is the last one.
    const lastRecord = await delClient({ clientId: 'CLI-1001' });
    assert(lastRecord.status === 200 && lastRecord.body.authCleanup === 'removed' && JSON.stringify(authCalls.deleteUser) === '["uuid-client-1"]', 'the account is removed with the last record that used it: ' + JSON.stringify([lastRecord.body, authCalls.deleteUser]));
    assert(!authCalls.deleteSnapshots[0].students.includes('FIFS-1016') && !authCalls.deleteSnapshots[0].clients.includes('CLI-1001'), 'both records must be gone before the account is deleted');
  });
  await test('Delete: if the account cannot be checked it is left alone; an account that is already gone is not an error', async () => {
    authFail = 'getUserById';
    const unsure = await delStudent({ studentId: 'FIFS-1013' });
    assert(unsure.status === 200 && unsure.body.authCleanup === 'skipped' && authCalls.deleteUser.length === 0, 'an unverifiable account must not be deleted: ' + JSON.stringify(unsure.body));
    authFail = null; delete authUsers['client2@client.example'];
    const gone = await delClient({ clientId: 'CLI-2002' });
    assert(gone.status === 200 && gone.body.authCleanup === 'none' && authCalls.deleteUser.length === 0, 'an account that no longer exists needs no deletion: ' + JSON.stringify(gone.body));
  });
  await test('Delete: a thrown error from the account service is also caught, so the delete still succeeds and nothing leaks', async () => {
    for (const mode of ['throwDelete', 'throwGet']) {
      resetDb(); authFail = mode;
      const s1 = await delStudent({ studentId: 'FIFS-1013' });
      assert(s1.status === 200 && s1.body.success === true && ['failed', 'skipped'].includes(s1.body.authCleanup) && s1.body.authUserRemoved === false, `${mode}: ${s1.status} ${JSON.stringify(s1.body)}`);
      assert(!/boom|exception/.test(JSON.stringify(s1.body)) && !db.students.some((x) => x.student_id === 'FIFS-1013'), `${mode}: the record must be deleted and nothing may leak`);
    }
  });
  await test('Delete: if the delete matched no record, no sign-in is touched, even when the record had been found', async () => {
    deleteMatchesNothing = true;
    const s1 = await delStudent({ studentId: 'FIFS-1013' });
    assert(s1.status === 200 && s1.body.authCleanup === 'none' && s1.body.authUserRemoved === null, `student: ${JSON.stringify(s1.body)}`);
    const c1 = await delClient({ clientId: 'CLI-2002' });
    assert(c1.status === 200 && c1.body.authCleanup === 'none', `client: ${JSON.stringify(c1.body)}`);
    noAuthCalls();
  });
  await test('Delete: only staff can delete, and a refused caller causes no record or account change', async () => {
    for (const token of [null, 'bad-token', 'student-alice-token', 'client-marcus-token', 'student-carol-token']) {
      err(await delStudent({ studentId: 'FIFS-1013' }, token), 401);
      err(await delClient({ clientId: 'CLI-2002' }, token), 401);
    }
    noAuthCalls(); noWrites();
    assert(db.students.some((x) => x.student_id === 'FIFS-1013') && db.clients.some((x) => x.client_id === 'CLI-2002'), 'nothing may be deleted');
  });

  await test('Client invite: a direct client invite uses the canonical permit type, the same as the Edit Client dropdown', async () => {
    writes.length = 0;
    await fifs('adminDirectInvite', { portalType: 'client', generatedId: 'CLI-7001', fullName: 'Permit Person', email: 'permit.person@example.test', phone: '', course: 'Maryland Wear & Carry Permit' }, 'instructor-token');
    const ins = writes.find((w) => w.op === 'insert' && w.table === 'clients');
    assert(ins && ins.patch.permit_state === 'Maryland Wear & Carry', 'permit_state: ' + (ins && ins.patch.permit_state));
    const at = PAGE_SRC.indexOf('<select id="editClientPermitState"');
    const firstOption = (PAGE_SRC.slice(at, PAGE_SRC.indexOf('</select>', at)).match(/<option value="([^"]*)"/) || [])[1].replace(/&amp;/g, '&');
    assert(firstOption === ins.patch.permit_state, 'must match the form\'s first option: ' + firstOption);
    const list = (ROUTE_SRC.match(/const CLIENT_PERMIT_STATE_ALLOWLIST = \[([\s\S]*?)\];/) || [])[1] || '';
    assert([...list.matchAll(/'([^']*)'/g)].some((m) => m[1] === ins.patch.permit_state), 'must be accepted by adminEditClient');
  });

  const refreshSrc = extractFunction('triggerCardGunRefresh');
  function loadRefresh(win) {
    const ctx = { window: win, executeUniversalGunReloadAnimation: (btn, cb) => cb() };
    vm.createContext(ctx); vm.runInContext(refreshSrc + '\nthis.fn = triggerCardGunRefresh;', ctx);
    return ctx.fn;
  }
  await test('Clients refresh button: it fetches from the server through refreshAdminRoster, and the other card buttons still work', async () => {
    const calls = { roster: 0, chat: 0, telemetry: 0, clients: 0 };
    const win = { refreshAdminRoster: () => calls.roster++, refreshAdminLiveChats: () => calls.chat++, syncTelemetryMetrics: () => calls.telemetry++ };
    const fn = loadRefresh(win);
    fn({}, 'clients'); assert(calls.roster === 1, 'clients must call refreshAdminRoster once, got ' + calls.roster);
    win.refreshAdminClients = () => calls.clients++;   // even if some other script defines it, the real fetch still happens
    fn({}, 'clients'); assert(calls.roster === 2, 'the real server fetch must still run');
    fn({}, 'roster'); assert(calls.roster === 3, 'roster');
    fn({}, 'chat'); assert(calls.chat === 1, 'chat'); fn({}, 'telemetry'); assert(calls.telemetry === 1, 'telemetry');
    fn({}, 'unknown'); assert(calls.roster === 3 && calls.chat === 1 && calls.telemetry === 1, 'an unknown type does nothing');
    let threw = null; try { loadRefresh({})({}, 'clients'); } catch (e) { threw = e; } assert(!threw, 'a missing refreshAdminRoster must not throw');
    const refresh = extractFunction('refreshAdminRoster');
    assert(/callFifsBackend\('getAdminDashboardData'/.test(refresh) && /renderAdminClientTerminal\(res\)/.test(refresh), 'refreshAdminRoster must really fetch the dashboard and redraw the clients');
  });
  await test('Invite error message no longer claims to be talking to Supabase', async () => {
    const at = PUBLIC_SCRIPT.indexOf("callFifsBackend('adminDirectInvite'");
    const block = PUBLIC_SCRIPT.slice(at, at + 4200);
    assert(/showStatus\(st, 'Error communicating with server: ' \+/.test(block), 'the failure callback should say "Error communicating with server: "');
    assert(!/communicating with Supabase/i.test(PUBLIC_SCRIPT), 'the misleading prefix is still in the script');
  });

  console.log('\n[SECTION Q: refreshAdminClients]');
  function loadClientsRefresh(opts = {}) {
    const calls = { roster: 0 };
    const now = { t: 1_000_000 };
    const ctx = { window: { __fifsLastRosterRefreshAt: opts.lastAt }, Date: { now: () => now.t } };
    if (!opts.noRoster) ctx.refreshAdminRoster = () => { calls.roster++; ctx.window.__fifsLastRosterRefreshAt = now.t; };
    vm.createContext(ctx);
    vm.runInContext(extractFunction('refreshAdminClients') + '\nthis.fn = refreshAdminClients;', ctx);
    return { fn: ctx.fn, calls, now, ctx };
  }
  await test('refreshAdminClients: opening the Clients tab does a real roster fetch, and is safe if the roster refresh is missing', async () => {
    const h = loadClientsRefresh(); h.fn();
    assert(h.calls.roster === 1, 'one real fetch expected, got ' + h.calls.roster);
    let threw = null; try { loadClientsRefresh({ noRoster: true }).fn(); } catch (e) { threw = e; }
    assert(!threw, 'a missing refreshAdminRoster must not throw');
  });
  await test('refreshAdminClients: right after a roster refresh it does not fetch a second time, and it works again a moment later', async () => {
    const h = loadClientsRefresh({ lastAt: 1_000_000 - 200 });
    h.fn(); assert(h.calls.roster === 0, 'a roster fetch 200 ms ago already covers the clients');
    h.now.t += 1500; h.fn(); assert(h.calls.roster === 1, 'a later call must fetch again');
    h.fn(); assert(h.calls.roster === 1, 'and the call right after that is covered by it');
  });
  await test('refreshAdminClients is exported, the roster refresh records when it fetches, and every "refresh all" caller runs the roster first', async () => {
    assert(/window\.refreshAdminClients = refreshAdminClients;/.test(PUBLIC_SCRIPT), 'refreshAdminClients must be on window');
    const roster = extractFunction('refreshAdminRoster');
    assert(roster.indexOf('window.__fifsLastRosterRefreshAt = Date.now();') > roster.indexOf('if (!pin) return;') && roster.indexOf('window.__fifsLastRosterRefreshAt = Date.now();') < roster.indexOf("callFifsBackend('getAdminDashboardData'"), 'the timestamp must be recorded only when a fetch is actually issued');
    // triggerModalAdminRefresh is declared twice in the script; the later declaration is the one that runs.
    const lastFunction = (name) => { const start = PUBLIC_SCRIPT.lastIndexOf('function ' + name + '('); let i = PUBLIC_SCRIPT.indexOf('{', start), depth = 0; for (; i < PUBLIC_SCRIPT.length; i++) { if (PUBLIC_SCRIPT[i] === '{') depth++; else if (PUBLIC_SCRIPT[i] === '}' && --depth === 0) break; } return PUBLIC_SCRIPT.slice(start, i + 1); };
    for (const fn of ['triggerModalAdminRefresh', 'triggerAdminRefreshAll']) {
      const src = lastFunction(fn);
      assert(src.indexOf('refreshAdminRoster') >= 0 && src.indexOf('refreshAdminRoster') < src.indexOf('refreshAdminClients'), `${fn} (the live definition) must refresh the roster before the clients`);
    }
    assert(/window\.refreshAdminRoster\) window\.refreshAdminRoster\(\);\s*\n\s*if \(window\.refreshAdminClients\)/.test(PUBLIC_SCRIPT), 'the other "refresh all" callers keep the same order');
  });

  console.log('\n[SECTION U: Setup link when the database trigger links the student during the request]');
  const dbWritesTo = (table, op) => writes.filter((w) => w.table === table && w.op === op);
  await test('Setup link: when the trigger links the student\'s own row to the account created in this request, it succeeds and writes no redundant link', async () => {
    await withResend(async () => {
      authTrigger = 'own';
      const r = await resend('FIFS-1004');
      assert(r.status === 200 && r.body.success === true && r.body.accountCreated === true && r.body.accountLinked === true, `got ${r.status} ${JSON.stringify(r.body)}`);
      assert(db.students.find((x) => x.student_id === 'FIFS-1004').user_id === 'uuid-new-invitee', 'the row stays linked to the new account');
      assert(dbWritesTo('students', 'update').length === 0, 'the trigger already linked it, so the redundant link update must be skipped: ' + JSON.stringify(writes));
      assert(authCalls.deleteUser.length === 0, 'the new account must not be deleted');
      const mails = resendCalls();
      assert(mails.length === 1 && JSON.stringify(mails[0].to) === '["dana.migrated@example.test"]', 'the setup email is sent to the record email');
    });
  });
  await test('Setup link: a second press after the trigger linked the row sends again without creating or linking anything', async () => {
    await withResend(async () => {
      authTrigger = 'own';
      await resend('FIFS-1004');
      fetchCalls.length = 0; authCalls = { createUser: [], generateLink: [], deleteUser: [], getUserById: [], deleteSnapshots: [] }; writes.length = 0;
      const again = await resend('FIFS-1004');
      assert(again.status === 200 && again.body.accountCreated === false && again.body.accountLinked === false && authCalls.createUser.length === 0 && writes.length === 0 && resendCalls().length === 1, `got ${again.status} ${JSON.stringify(again.body)}`);
    });
  });
  await test('Setup link: a DIFFERENT student row holding the account is still refused with 409, and the account created for this call is removed', async () => {
    await withResend(async () => {
      authTrigger = 'own';
      db.students.push({ id: 'row-other-holder', user_id: 'uuid-new-invitee', student_id: 'FIFS-1099', email: 'someone.else@example.test', full_name: 'Other Holder', status: 'STEP_1_REGISTERED' });
      const r = await resend('FIFS-1004');
      err(r, 409);
      assert(/already linked to another student/.test(r.body.error), r.body.error);
      assert(resendCalls().length === 0 && authCalls.deleteUser.includes('uuid-new-invitee'), 'nothing is sent and the account created for this call is removed');
      assert(db.students.find((x) => x.student_id === 'FIFS-1099').user_id === 'uuid-new-invitee', 'the other student\'s link is untouched');
    });
  });
  await test('Setup link: an existing account already held by another student is refused whether or not the trigger exists', async () => {
    await withResend(async () => {
      for (const mode of [false, 'own']) {
        resetDb(); authTrigger = mode; fetchCalls.length = 0;
        const r = await resend('FIFS-1009');
        err(r, 409);
        assert(/already linked to another student/.test(r.body.error) && resendCalls().length === 0 && db.students.find((x) => x.student_id === 'FIFS-1009').user_id === null, `trigger=${mode}: ${JSON.stringify(r.body)}`);
      }
    });
  });
  await test('Setup link: if the row ends up linked to some other account, or disappears mid-request, it is refused and the new account is removed', async () => {
    await withResend(async () => {
      authTrigger = 'other';
      const other = await resend('FIFS-1004');
      err(other, 409);
      assert(/different sign-in/.test(other.body.error) && resendCalls().length === 0 && authCalls.deleteUser.includes('uuid-new-invitee'), 'a row linked elsewhere: ' + JSON.stringify(other.body));
      resetDb(); authTrigger = 'vanish'; fetchCalls.length = 0;
      const gone = await resend('FIFS-1004');
      err(gone, 500);
      assert(/Could not verify the sign-in link/.test(gone.body.error) && resendCalls().length === 0 && authCalls.deleteUser.includes('uuid-new-invitee'), 'a vanished row: ' + JSON.stringify(gone.body));
    });
  });
  await test('Setup link: when the trigger does not link (two unlinked students share the email) the guarded link update still runs', async () => {
    await withResend(async () => {
      authTrigger = 'own';
      db.students.push({ id: 'row-dana-twin', user_id: null, student_id: 'FIFS-1098', email: 'dana.migrated@example.test', full_name: 'Dana Twin', status: 'STEP_1_REGISTERED' });
      const r = await resend('FIFS-1004');
      assert(r.status === 200 && r.body.accountCreated === true && r.body.accountLinked === true, `got ${r.status} ${JSON.stringify(r.body)}`);
      const updates = dbWritesTo('students', 'update');
      assert(updates.length === 1 && Object.keys(updates[0].patch).sort().join() === 'updated_at,user_id', 'one guarded link update expected: ' + JSON.stringify(writes));
      assert(db.students.find((x) => x.student_id === 'FIFS-1004').user_id === 'uuid-new-invitee' && db.students.find((x) => x.student_id === 'FIFS-1098').user_id === null, 'only the clicked student is linked');
    });
  });
  await test('Setup link: the conflict check excludes the student\'s own row and the row is re-read before linking', async () => {
    const at = ROUTE_SRC.indexOf("case 'adminResendSetupLink'");
    const block = ROUTE_SRC.slice(at, ROUTE_SRC.indexOf("case 'adminEnrollStudent'", at));
    assert(/\.eq\('user_id', authId\)\.neq\('id', row\.id\)/.test(block), 'the "taken" check must exclude the student\'s own row');
    assert(/select\('user_id'\)\.eq\('id', row\.id\)\.maybeSingle\(\)/.test(block), 'the row must be re-read before linking');
    assert(/handle_student_auth_user_link/.test(block), 'the comment should name the trigger so the reason is not lost');
  });

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  console.log('================================================================');
  if (fetchCalls.length) console.log(`(stubbed outbound calls: ${fetchCalls.length})`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => { console.error('Suite crashed:', err); process.exit(1); });
