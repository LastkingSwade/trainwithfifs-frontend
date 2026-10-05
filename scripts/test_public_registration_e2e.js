'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
// Resolves the "@/..." alias and .ts files for modules the route imports (src/Lib/server/*).
require('./lib/ts-loader');

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
const repo = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(repo, 'public/scripts/TrainWithFIFS_scripts.js'), 'utf8');
const start = source.indexOf('    async function handleClientRegisterSubmit(e) {');
const endMarker = '    window.handleClientRegisterSubmit = handleClientRegisterSubmit;';
const end = source.indexOf(endMarker, start);
assert(start >= 0 && end >= 0, 'public client registration handler must exist');
const browserHandler = source.slice(start, end + endMarker.length);

const verifiedUser = { id: 'auth-user-verified-123', email: 'new.client@example.test' };
const insertedRows = [];
function supabaseMock() {
  return {
    auth: {
      async getUser(token) {
        return { data: { user: token === 'valid-access-token' ? verifiedUser : null }, error: token === 'valid-access-token' ? null : new Error('invalid token') };
      }
    },
    from(table) {
      assert.equal(table, 'clients');
      let operation = 'select';
      let record;
      const query = {
        select() { return query; },
        eq() { return query; },
        async maybeSingle() { return { data: null, error: null }; },
        insert(value) { operation = 'insert'; record = value; return query; },
        async single() {
          assert.equal(operation, 'insert');
          insertedRows.push({ ...record });
          return { data: { ...record }, error: null };
        }
      };
      return query;
    }
  };
}

const NextResponse = { json(body, init = {}) { return { status: init.status || 200, async json() { return body; } }; } };
const routePath = path.join(repo, 'src/app/api/fifs/route.ts');
const routeTs = fs.readFileSync(routePath, 'utf8');
const compiled = ts.transpileModule(routeTs, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
const routeModule = new Module(routePath, module);
routeModule.filename = routePath;
routeModule.paths = Module._nodeModulePaths(path.dirname(routePath));
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'next/server') return { NextRequest: class {}, NextResponse };
  if (request === '@supabase/supabase-js') return { createClient: () => supabaseMock() };
  return originalLoad.call(this, request, parent, isMain);
};
try { routeModule._compile(compiled, routePath); } finally { Module._load = originalLoad; }

async function apiFetch(_url, init) {
  const body = JSON.parse(init.body);
  const headers = new Map(Object.entries(init.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
  const request = { headers: { get(name) { return headers.get(name.toLowerCase()) || null; } }, async json() { return body; } };
  const response = await routeModule.exports.POST(request);
  return { ok: response.status >= 200 && response.status < 300, status: response.status, json: () => response.json() };
}

function makeBrowserContext({ auth, onDashboard }) {
  const elements = {
    regClientName: { value: 'New Client' }, regClientEmail: { value: verifiedUser.email }, regClientPhone: { value: '555-0100' },
    regClientPermitState: { value: 'Maryland Wear & Carry' }, regClientExpDate: { value: '2027-10-04' },
    regClientPassword: { value: 'SafePassword123!' }, regClientPasswordConfirm: { value: 'SafePassword123!' },
    regClientOptIn: { checked: true },
    'client-register-status': { style: {}, innerText: '', textContent: '' },
    'btn-client-register-submit': { disabled: false }
  };
  const window = { supabaseClient: { auth }, handleClientRegisterSubmit: null };
  const context = {
    window,
    document: { getElementById(id) { return elements[id] || null; } },
    fetch: apiFetch,
    showStatus(el, message, type) { if (el) { el.innerText = message; el.type = type; } },
    fifsSetClientSession(value) { window.__clientSession = value; },
    renderClientDashboard(value) { assert.ok(value, 'dashboard receives the created client profile'); onDashboard?.(value); },
    console,
    Boolean,
    String,
    Error,
    Promise,
    setTimeout,
    clearTimeout
  };
  vm.createContext(context);
  vm.runInContext(browserHandler, context);
  return { context, window, elements };
}

async function testPublicSignupAwaitingEmailConfirmation() {
  insertedRows.length = 0;
  let fetchCalls = 0;
  const auth = {
    async getSession() { return { data: { session: null } }; },
    async signUp() { return { data: { session: null }, error: null }; }
  };
  const { context, elements } = makeBrowserContext({ auth });
  context.fetch = async (...args) => { fetchCalls++; return apiFetch(...args); };
  await context.window.handleClientRegisterSubmit({ preventDefault() {} });
  assert.match(elements['client-register-status'].innerText, /Check your email to confirm/i);
  assert.equal(fetchCalls, 0, 'unconfirmed signup must not call the profile API');
  assert.equal(insertedRows.length, 0, 'unconfirmed signup must not create a client row');
}

async function testEmailConfirmationReturnCompletesProfileAndDashboard() {
  insertedRows.length = 0;
  let dashboard = null;
  const auth = {
    async getSession() { return { data: { session: { access_token: 'valid-access-token', user: verifiedUser } } }; },
    async signUp() { throw new Error('confirmed-return should reuse the authenticated session'); }
  };
  const { context, window } = makeBrowserContext({ auth, onDashboard(value) { dashboard = value; } });
  await window.handleClientRegisterSubmit({ preventDefault() {} });
  assert.equal(insertedRows.length, 1);
  assert.equal(insertedRows[0].user_id, verifiedUser.id);
  assert.ok(dashboard, 'the confirmed user should see the client dashboard');
  assert.equal(dashboard.clientId, insertedRows[0].client_id);
  assert.ok(window.__clientSession, 'created profile is stored for the current session');
}

async function testVerifiedAuthUidCannotBeOverridden() {
  insertedRows.length = 0;
  const request = {
    headers: { get(name) { return name.toLowerCase() === 'authorization' ? 'Bearer valid-access-token' : null; } },
    async json() { return { action: 'registerClient', fullName: 'New Client', email: verifiedUser.email, phone: '555-0100', permitType: 'Maryland Wear & Carry', user_id: 'attacker-controlled-uid' }; }
  };
  const response = await routeModule.exports.POST(request);
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.success, true);
  assert.equal(insertedRows.at(-1).user_id, verifiedUser.id, 'database row must use the UID returned by verified Supabase Auth');
  assert.notEqual(insertedRows.at(-1).user_id, 'attacker-controlled-uid');
}

(async () => {
  const tests = [
    ['public signup waits for email confirmation', testPublicSignupAwaitingEmailConfirmation],
    ['email-confirmation return creates profile and renders dashboard', testEmailConfirmationReturnCompletesProfileAndDashboard],
    ['client row links only to verified Supabase user_id', testVerifiedAuthUidCannotBeOverridden]
  ];
  let failures = 0;
  for (const [name, test] of tests) {
    try { await test(); console.log(`PASS ${name}`); }
    catch (error) { failures++; console.error(`FAIL ${name}\n${error.stack || error}`); }
  }
  console.log(`${tests.length - failures}/${tests.length} end-to-end tests passed`);
  if (failures) process.exitCode = 1;
})();
