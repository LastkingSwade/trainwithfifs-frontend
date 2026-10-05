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
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-secret-key-32chars!';
const fetchCalls = installFetchStub();

const mockNextServer = {
  NextResponse: { json: (body, init) => ({ status: (init && init.status) || 200, _body: body }) },
  NextRequest: class {}
};

let db;
const writes = [];
function resetDb() {
  db = {
    students: [
      { id: 'row-alice', user_id: 'uuid-student-alice', student_id: 'FIFS-1001', email: 'alice@student.com', full_name: 'Alice Student',
        status: 'STEP_2_CONFIRMED', internal_notes: 'Staff only: payment plan discussed', qualification_score: null },
      { id: 'row-bob', user_id: 'uuid-student-bob', student_id: 'FIFS-1002', email: 'bob@student.com', full_name: 'Bob Student',
        status: 'STEP_6_QUALIFIED', internal_notes: 'Staff only', qualification_score: '24/25 (96%)' }
    ],
    enrollments: [],
    clients: []
  };
  writes.length = 0;
}

function queryBuilder(table) {
  const filters = [];
  let op = 'select';
  const run = () => {
    if (op !== 'select') { writes.push({ table, op }); return { data: null, error: null }; }
    return { data: (db[table] || []).filter((r) => filters.every((f) => f(r))).map((r) => ({ ...r })), error: null };
  };
  const b = {
    select: () => b,
    insert: () => { op = 'insert'; return b; },
    update: () => { op = 'update'; return b; },
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
      getUser: async (token) => {
        const users = {
          'student-alice-token': { id: 'uuid-student-alice', email: 'alice@student.com', app_metadata: { role: 'student' } },
          'student-bob-token': { id: 'uuid-student-bob', email: 'bob@student.com', app_metadata: { role: 'student' } },
          'instructor-token': { id: 'uuid-instructor', email: 'coach@example.test', app_metadata: { role: 'instructor' } }
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

const NOT_IMPLEMENTED = ['updateStudentStatus', 'adminEditStudent', 'adminEditClient', 'updateStudentTask',
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
  const wrapperSrc = extractFunction('callFifsBackend');
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

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  console.log('================================================================');
  if (fetchCalls.length) console.log(`(stubbed outbound calls: ${fetchCalls.length})`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => { console.error('Suite crashed:', err); process.exit(1); });
