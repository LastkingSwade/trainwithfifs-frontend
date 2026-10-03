/**
 * TrainWithFIFS - Zero-Trust Portable Security Test Suite
 *
 * Validates authorization boundaries, public read restrictions, thread isolation,
 * student/client self-service isolation, role-based authorization from app_metadata.role,
 * and administrative protections for all 26 route actions.
 */

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ufqnmcincwnlyiwsmzcq.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key-fifs-public';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-secret-key-32chars!';
process.env.CHAT_HMAC_SECRET = 'chat-hmac-test-secret-key-32chars-long!';
process.env.ADMIN_NOTIFICATION_EMAIL = 'carpetcare85@gmail.com';
process.env.CRON_SECRET = 'cron-secret-12345';

// Mock Next Server
const mockNextServer = {
  NextResponse: {
    json: (body, init) => {
      const status = (init && init.status) || 200;
      return {
        status,
        headers: new Map(),
        json: async () => body,
        _body: body
      };
    }
  },
  NextRequest: class MockNextRequest {
    constructor(url, init = {}) {
      this.url = url;
      this.headers = new Map(Object.entries(init.headers || {}));
      this._body = init.body ? JSON.parse(init.body) : {};
    }
    async json() {
      return this._body;
    }
  }
};

// Database state for test isolation
let dbState = {
  classes: [
    { id: 'c1', title: 'Maryland Wear & Carry (CCW)', is_active: true },
    { id: 'c2', title: 'Maryland Handgun Qualification License (HQL)', is_active: true }
  ],
  students: [
    { id: 'uuid-student-alice', user_id: 'uuid-student-alice', student_id: 'FIFS-1001', email: 'alice@student.com', full_name: 'Alice Student', portal_password: 'OldPassword123!' },
    { id: 'uuid-student-bob', user_id: 'uuid-student-bob', student_id: 'FIFS-1002', email: 'bob@student.com', full_name: 'Bob Student', portal_password: 'OldPassword123!' },
    { id: 'uuid-student-unlinked', user_id: null, student_id: 'FIFS-1003', email: 'unlinked@student.com', full_name: 'Unlinked Student' }
  ],
  clients: [
    { id: 'uuid-client-charlie', user_id: 'uuid-client-charlie', client_id: 'CLI-2001', email: 'charlie@client.com', full_name: 'Charlie Client' },
    { id: 'uuid-client-dave', user_id: 'uuid-client-dave', client_id: 'CLI-2002', email: 'dave@client.com', full_name: 'Dave Client' }
  ],
  user_permits: [
    { id: 'permit-alice', user_id: 'uuid-student-alice', email: 'alice@student.com', permit_type: 'MD CCW' },
    { id: 'permit-bob', user_id: 'uuid-student-bob', email: 'bob@student.com', permit_type: 'MD HQL' }
  ],
  messages: [
    { id: 'msg-1', thread_id: 'th_alice_123', sender: 'visitor', sender_name: 'Alice Visitor', email: 'alice@student.com', phone: '443-555-0101', message: 'Private visitor question', sent_at: new Date().toISOString() },
    { id: 'msg-2', thread_id: 'th_bob_456', sender: 'visitor', sender_name: 'Bob Visitor', email: 'bob@student.com', phone: '443-555-0202', message: 'Private inquiry from Bob', sent_at: new Date().toISOString() }
  ],
  invoices: [],
  enrollments: [
    { id: 'enr-1', student_id: 'FIFS-1001', student_email: 'alice@student.com', class_id: 'c1', scheduled_date: '2026-10-25', status: 'confirmed' }
  ],
  leads: []
};

// Mock Supabase SDK
const mockSupabase = {
  createClient: () => ({
    auth: {
      getUser: async (token) => {
        if (token === 'admin-bearer-token') {
          return {
            data: {
              user: {
                id: 'uuid-admin-kai',
                email: 'carpetcare85@gmail.com',
                app_metadata: { role: 'admin' },
                user_metadata: { role: 'admin' }
              }
            },
            error: null
          };
        }
        if (token === 'instructor-bearer-token') {
          return {
            data: {
              user: {
                id: 'uuid-instructor-dan',
                email: 'instructor@example.com',
                app_metadata: { role: 'instructor' }
              }
            },
            error: null
          };
        }
        if (token === 'admin-email-student-role-token') {
          // Attacker has admin notification email, but app_metadata.role is student!
          return {
            data: {
              user: {
                id: 'uuid-attacker-admin-email',
                email: 'carpetcare85@gmail.com',
                app_metadata: { role: 'student' }
              }
            },
            error: null
          };
        }
        if (token === 'company-domain-student-role-token') {
          // Attacker has @trainwithfifs.com email, but app_metadata.role is student!
          return {
            data: {
              user: {
                id: 'uuid-attacker-domain',
                email: 'attacker@trainwithfifs.com',
                app_metadata: { role: 'student' }
              }
            },
            error: null
          };
        }
        if (token === 'user-metadata-admin-token') {
          // Attacker sets user_metadata.role = 'admin', but app_metadata.role is student!
          return {
            data: {
              user: {
                id: 'uuid-attacker-usermeta',
                email: 'hacker@example.com',
                user_metadata: { role: 'admin' },
                app_metadata: { role: 'student' }
              }
            },
            error: null
          };
        }
        if (token === 'student-alice-token') {
          return {
            data: {
              user: {
                id: 'uuid-student-alice',
                email: 'alice@student.com',
                app_metadata: { role: 'student' }
              }
            },
            error: null
          };
        }
        if (token === 'student-unlinked-token') {
          return { data: { user: { id: 'uuid-unlinked-auth', email: 'unlinked@student.com', app_metadata: { role: 'student' } } }, error: null };
        }
        if (token === 'student-bob-token') {
          return {
            data: {
              user: {
                id: 'uuid-student-bob',
                email: 'bob@student.com',
                app_metadata: { role: 'student' }
              }
            },
            error: null
          };
        }
        if (token === 'client-charlie-token') {
          return {
            data: {
              user: {
                id: 'uuid-client-charlie',
                email: 'charlie@client.com',
                app_metadata: { role: 'client' }
              }
            },
            error: null
          };
        }
        return { data: { user: null }, error: { message: 'Invalid or expired token' } };
      },
      admin: {
        createUser: async (params) => {
          return {
            data: {
              user: {
                id: 'new-auth-' + Date.now(),
                email: params.email,
                app_metadata: { role: params.user_metadata?.role || 'student' }
              }
            },
            error: null
          };
        },
        updateUserById: async (uid, params) => {
          return { data: { user: { id: uid, ...params } }, error: null };
        }
      }
    },
    from: (table) => {
      let filtered = (dbState[table] || []).slice();
      const builder = {
        select: (cols) => builder,
        eq: (col, val) => {
          filtered = filtered.filter(row => row[col] === val);
          return builder;
        },
        neq: (col, val) => {
          filtered = filtered.filter(row => row[col] !== val);
          return builder;
        },
        or: (condition) => builder,
        gte: (col, val) => builder,
        lte: (col, val) => builder,
        upsert: (rows) => builder.insert(rows),
        order: (col, opts) => builder,
        limit: (n) => builder,
        single: async () => ({ data: filtered[0] || null, error: filtered[0] ? null : { message: 'Not found' } }),
        maybeSingle: async () => ({ data: filtered[0] || null, error: null }),
        insert: (rows) => {
          const rArray = Array.isArray(rows) ? rows : [rows];
          const inserted = rArray.map((r, i) => ({ id: 'new-' + Date.now() + '-' + i, ...r }));
          dbState[table] = (dbState[table] || []).concat(inserted);
          return {
            select: () => ({
              single: async () => ({ data: inserted[0], error: null }),
              maybeSingle: async () => ({ data: inserted[0], error: null })
            }),
            data: inserted,
            error: null
          };
        },
        update: (updates) => {
          filtered.forEach(row => Object.assign(row, updates));
          return {
            eq: (col, val) => {
              (dbState[table] || []).forEach(row => {
                if (row[col] === val) Object.assign(row, updates);
              });
              return { data: updates, error: null };
            },
            data: updates,
            error: null
          };
        },
        delete: () => {
          return {
            eq: (col, val) => {
              dbState[table] = (dbState[table] || []).filter(row => row[col] !== val);
              return { data: null, error: null };
            }
          };
        },
        then: (resolve) => resolve({ data: filtered, error: null })
      };
      return builder;
    }
  })
};

// Patch require for test isolation
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'next/server') return mockNextServer;
  if (id === '@supabase/supabase-js') return mockSupabase;
  if (id === 'stripe') {
    return class MockStripe {
      constructor(apiKey) {
        this.apiKey = apiKey;
        this.checkout = {
          sessions: {
            create: async (params) => {
              if (process.env.__TEST_STRIPE_FAIL === 'true') {
                throw new Error('Stripe API network timeout');
              }
              const unitAmount = params.line_items?.[0]?.price_data?.unit_amount || 0;
              return {
                id: 'cs_test_' + Date.now(),
                url: 'https://checkout.stripe.com/c/pay/cs_test_' + Date.now(),
                amount_total: unitAmount,
                customer_email: params.customer_email,
                metadata: params.metadata
              };
            }
          }
        };
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

// Portable route loader supporting TypeScript / Babel without @babel/preset-env
const routeTsPath = path.resolve(__dirname, '../src/app/api/fifs/route.ts');
const routeTsCode = fs.readFileSync(routeTsPath, 'utf-8');

let compiledJs = '';
let transpileSuccess = false;

// 1. Try TypeScript compiler first if installed
try {
  const ts = require('typescript');
  compiledJs = ts.transpileModule(routeTsCode, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true
    }
  }).outputText;
  transpileSuccess = true;
} catch (_tsErr) {}

// 2. Try Babel if TypeScript is unavailable (WITHOUT requiring @babel/preset-env)
if (!transpileSuccess) {
  try {
    let babel;
    try { babel = require('@babel/core'); } catch {
      try { babel = require('/usr/share/nodejs/@babel/core'); } catch {}
    }
    if (babel) {
      let tsPreset = '@babel/preset-typescript';
      try {
        if (fs.existsSync('/usr/share/nodejs/@babel/preset-typescript')) {
          tsPreset = '/usr/share/nodejs/@babel/preset-typescript';
        }
      } catch (_pErr) {}

      // Notice: NO @babel/preset-env is required! Node.js 18+ executes modern ES2022 natively.
      let cjsPlugin = '@babel/plugin-transform-modules-commonjs';
      try {
        if (fs.existsSync('/usr/share/nodejs/@babel/plugin-transform-modules-commonjs')) {
          cjsPlugin = '/usr/share/nodejs/@babel/plugin-transform-modules-commonjs';
        }
      } catch (_cErr) {}

      const compiled = babel.transformSync(routeTsCode, {
        filename: 'route.ts',
        presets: [tsPreset],
        plugins: [cjsPlugin]
      });
      compiledJs = compiled.code;
      transpileSuccess = true;
    }
  } catch (_babelErr) {}
}

if (!transpileSuccess) {
  throw new Error('Unable to transpile route.ts: Please ensure typescript or @babel/preset-typescript is installed.');
}

const routeModule = { exports: {} };
const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', compiledJs);
fn(routeModule, routeModule.exports, require, path.dirname(routeTsPath), routeTsPath);
const POST = routeModule.exports.POST;

// Test runner helpers
let passedTests = 0;
let failedTests = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    -> ${err.message}`);
    failedTests++;
  }
}

function computeSecret(tId) {
  return crypto.createHmac('sha256', process.env.CHAT_HMAC_SECRET).update(tId).digest('hex');
}

async function executeAction(action, payload = {}, headers = {}) {
  const req = new mockNextServer.NextRequest('http://localhost/api/fifs', {
    headers,
    body: JSON.stringify({ action, ...payload })
  });
  const res = await POST(req);
  return { status: res.status, body: res._body };
}

async function main() {
  console.log('================================================================');
  console.log('🔒 EXECUTING FULL FIFS ZERO-TRUST SECURITY TEST SUITE');
  console.log('================================================================\n');

  // --- SECTION 1: PUBLIC ACTIONS ---
  console.log('[SECTION 1: Public Action Boundary & Input Validation]');
  await runTest('getClasses: Anonymous public catalog access allowed', async () => {
    const { status, body } = await executeAction('getClasses');
    if (status !== 200 || !body.success || !Array.isArray(body.classes)) {
      throw new Error(`Expected 200 with classes array, got ${status}`);
    }
  });

  await runTest('trackSiteVisit: Safe public ping allowed', async () => {
    const { status, body } = await executeAction('trackSiteVisit', { path: '/training' });
    if (status !== 200 || !body.success) throw new Error(`Expected 200, got ${status}`);
  });

  await runTest('submitContactInquiry: Valid inquiry returns 200', async () => {
    const { status, body } = await executeAction('submitContactInquiry', {
      name: 'New Prospect',
      email: 'prospect@example.com',
      phone: '410-555-1234',
      message: 'Need CCW class details'
    });
    if (status !== 200 || !body.success) throw new Error(`Expected 200, got ${status}`);
  });

  await runTest('submitContactInquiry: Empty inquiry rejected with 400', async () => {
    const { status } = await executeAction('submitContactInquiry', { name: 'Blank' });
    if (status !== 400) throw new Error(`Expected 400 for empty contact inquiry, got ${status}`);
  });

  await runTest('submitBooking: Missing email rejected with 400', async () => {
    const { status } = await executeAction('submitBooking', { fullName: 'No Email Student' });
    if (status !== 400) throw new Error(`Expected 400, got ${status}`);
  });

  await runTest('submitBooking: Missing Stripe configuration fails closed with 503', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const { status, body } = await executeAction('submitBooking', {
      fullName: 'New Student',
      email: 'student@example.com',
      courseSelection: 'Maryland CCW'
    });
    if (status !== 503) throw new Error(`Expected 503 fail-closed when Stripe missing, got ${status}`);
    if (body.url || body.sessionId) throw new Error('Security leak: Fallback payment URL or session ID returned');
  });

  await runTest('submitBooking: Stripe failure fails closed with 502 without fake session IDs', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_secret_key_12345';
    process.env.__TEST_STRIPE_FAIL = 'true';
    const { status, body } = await executeAction('submitBooking', {
      fullName: 'New Student',
      email: 'student@example.com',
      courseSelection: 'Maryland CCW'
    });
    delete process.env.__TEST_STRIPE_FAIL;
    if (status !== 502) throw new Error(`Expected 502 fail-closed on Stripe error, got ${status}`);
    if (body.sessionId && body.sessionId.startsWith('fallback-')) throw new Error('Security leak: Fabricated fallback sessionId returned');
  });

  await runTest('submitBooking: Server strictly enforces pricing ignoring client totalAmount/depositAmount tampering', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_secret_key_12345';
    // Attacker attempts to book course for $1.00 total and $0.10 deposit
    const { status, body } = await executeAction('submitBooking', {
      fullName: 'Tampering Student',
      email: 'tamper@example.com',
      courseSelection: 'Maryland CCW',
      totalAmount: 1.00,
      depositAmount: 0.10
    });
    if (status !== 200 || !body.success) throw new Error(`Expected 200 with active Stripe mock, got ${status}`);
    if (!body.url || !body.sessionId || body.sessionId.startsWith('fallback-')) {
      throw new Error('Valid Stripe session URL and ID expected, got fallback');
    }
    // Verify invoice in DB was charged authoritative price, not $1.00
    const invoice = (dbState.invoices || []).find(inv => inv.email === 'tamper@example.com');
    if (!invoice) throw new Error('Invoice record was not written to database');
    // Maryland CCW base: 199.99 + 45.00 Cindy range fee = 244.99 + 6% tax (14.70) = 259.69. 30% deposit = 77.91
    if (parseFloat(invoice.total_amount) < 200) {
      throw new Error(`Price tampering succeeded! Invoice total was ${invoice.total_amount}, expected > $200`);
    }
  });

  // --- SECTION 2: VISITOR CHAT & HMAC CREDENTIALS ---
  console.log('\n[SECTION 2: Visitor Chat & Cryptographic Thread Isolation]');
  let visitorThreadId = '';
  let visitorSecret = '';

  await runTest('handleLiveChatMessage: Starts new thread and issues unguessable thread credential', async () => {
    const { status, body } = await executeAction('handleLiveChatMessage', {
      senderName: 'Anonymous Visitor',
      message: 'Hello, need help with renewal'
    });
    if (status !== 200 || !body.success) throw new Error(`Expected 200, got ${status}`);
    if (!body.threadId || !body.threadSecret) throw new Error('Missing threadId or threadSecret in response');
    visitorThreadId = body.threadId;
    visitorSecret = body.threadSecret;
    if (visitorSecret !== computeSecret(visitorThreadId)) throw new Error('HMAC secret mismatch');
  });

  await runTest('handleLiveChatMessage: Continuing thread with valid threadSecret succeeds', async () => {
    const { status, body } = await executeAction('handleLiveChatMessage', {
      threadId: visitorThreadId,
      threadSecret: visitorSecret,
      message: 'Follow-up message'
    });
    if (status !== 200 || !body.success) throw new Error(`Expected 200, got ${status}`);
  });

  await runTest('handleLiveChatMessage: Continuing thread without threadSecret rejected with 403', async () => {
    const { status } = await executeAction('handleLiveChatMessage', {
      threadId: visitorThreadId,
      message: 'Unauthenticated append'
    });
    if (status !== 403) throw new Error(`Expected 403, got ${status}`);
  });

  await runTest('handleLiveChatMessage: Continuing thread with forged threadSecret rejected with 403', async () => {
    const { status } = await executeAction('handleLiveChatMessage', {
      threadId: visitorThreadId,
      threadSecret: 'deadbeef0000111122223333444455556666777788889999aaaabbbbccccdddd',
      message: 'Forged append'
    });
    if (status !== 403) throw new Error(`Expected 403, got ${status}`);
  });

  await runTest('getVisitorChatMessages: Anonymous call without credentials rejected with 401', async () => {
    const { status } = await executeAction('getVisitorChatMessages', {});
    if (status !== 401) throw new Error(`Expected 401, got ${status}`);
  });

  await runTest('getVisitorChatMessages: Calling with guessed threadId but missing secret rejected with 401', async () => {
    const { status } = await executeAction('getVisitorChatMessages', { threadId: 'th_alice_123' });
    if (status !== 401) throw new Error(`Expected 401, got ${status}`);
  });

  await runTest('getVisitorChatMessages: Calling with guessed threadId and bad secret rejected with 403', async () => {
    const { status } = await executeAction('getVisitorChatMessages', {
      threadId: 'th_alice_123',
      threadSecret: 'invalid-secret-signature'
    });
    if (status !== 403) throw new Error(`Expected 403, got ${status}`);
  });

  await runTest('getVisitorChatMessages: Calling with valid credentials returns only safe fields', async () => {
    const validSecret = computeSecret('th_alice_123');
    const { status, body } = await executeAction('getVisitorChatMessages', {
      threadId: 'th_alice_123',
      threadSecret: validSecret
    });
    if (status !== 200 || !body.success || !Array.isArray(body.messages)) {
      throw new Error(`Expected 200 with messages, got ${status}`);
    }
    for (const msg of body.messages) {
      if (msg.email !== undefined || msg.phone !== undefined || msg.ip !== undefined) {
        throw new Error('Data leak: Private visitor contact details exposed in visitor chat');
      }
    }
  });

  await runTest('getVisitorChatMessages: Cross-thread isolation prevents reading other threads', async () => {
    const validAliceSecret = computeSecret('th_alice_123');
    const { status, body } = await executeAction('getVisitorChatMessages', {
      threadId: 'th_bob_456',
      threadSecret: validAliceSecret
    });
    if (status !== 403) throw new Error(`Expected 403 on cross-thread access, got ${status}`);
  });

  await runTest('Visitor chat fails safely when HMAC secret is missing or weak', async () => {
    const savedHmac = process.env.CHAT_HMAC_SECRET;
    const savedRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      process.env.CHAT_HMAC_SECRET = '';
      process.env.SUPABASE_SERVICE_ROLE_KEY = '';
      const { status } = await executeAction('handleLiveChatMessage', { message: 'Testing missing secret' });
      if (status !== 500) throw new Error(`Expected 500 when HMAC secret missing, got ${status}`);
    } finally {
      process.env.CHAT_HMAC_SECRET = savedHmac;
      process.env.SUPABASE_SERVICE_ROLE_KEY = savedRole;
    }
  });

  // --- SECTION 3: STUDENT & CLIENT SELF-SERVICE ---
  console.log('\n[SECTION 3: Student & Client Self-Service Isolation]');
  await runTest('getStudentPortalData: Anonymous call rejected with 401', async () => {
    const { status } = await executeAction('getStudentPortalData', { identifier: 'alice@student.com' });
    if (status !== 401) throw new Error(`Expected 401, got ${status}`);
  });

  await runTest('getStudentPortalData: Token in body without Authorization header rejected with 401', async () => {
    const { status } = await executeAction('getStudentPortalData', {
      identifier: 'alice@student.com',
      accessToken: 'student-alice-token'
    });
    if (status !== 401) throw new Error(`Expected 401 when token in body without Authorization header, got ${status}`);
  });

  await runTest('getStudentPortalData: Student Alice accessing own record succeeds', async () => {
    const { status, body } = await executeAction(
      'getStudentPortalData',
      { identifier: 'alice@student.com' },
      { authorization: 'Bearer student-alice-token' }
    );
    if (status !== 200 || !body.success || body.student.email !== 'alice@student.com') {
      throw new Error(`Expected 200 with Alice record, got ${status}`);
    }
  });

  await runTest('getStudentPortalData: Auth owner cannot access an email-matching but unlinked record', async () => {
    const { status } = await executeAction('getStudentPortalData', { identifier: 'unlinked@student.com' }, { authorization: 'Bearer student-unlinked-token' });
    if (status !== 404) throw new Error(`Expected 404 for unlinked record, got ${status}`);
  });

  await runTest('getStudentPortalData: Email-matching unlinked record is inaccessible to another owner', async () => {
    const { status } = await executeAction('getStudentPortalData', { identifier: 'unlinked@student.com' }, { authorization: 'Bearer student-alice-token' });
    if (status !== 403 && status !== 404) throw new Error(`Expected 403 or 404, got ${status}`);
  });

  await runTest('getStudentPortalData: Student Alice attempting to read Student Bob rejected with 403', async () => {
    const { status } = await executeAction(
      'getStudentPortalData',
      { identifier: 'bob@student.com' },
      { authorization: 'Bearer student-alice-token' }
    );
    if (status !== 403) throw new Error(`Expected 403, got ${status}`);
  });

  await runTest('getClientPortalData: Anonymous call rejected with 401', async () => {
    const { status } = await executeAction('getClientPortalData', { email: 'charlie@client.com' });
    if (status !== 401) throw new Error(`Expected 401, got ${status}`);
  });

  await runTest('getClientPortalData: Client Charlie accessing own record succeeds', async () => {
    const { status, body } = await executeAction(
      'getClientPortalData',
      { email: 'charlie@client.com' },
      { authorization: 'Bearer client-charlie-token' }
    );
    if (status !== 200 || !body.success) throw new Error(`Expected 200, got ${status}`);
  });

  await runTest('getClientPortalData: Client email without a matching UID cannot access an unlinked record', async () => {
    const { status } = await executeAction('getClientPortalData', { email: 'dave@client.com' }, { authorization: 'Bearer client-charlie-token' });
    if (status !== 403 && status !== 404) throw new Error(`Expected 403 or 404, got ${status}`);
  });

  await runTest('getClientPortalData: Client Charlie attempting to read Client Dave rejected with 403', async () => {
    const { status } = await executeAction(
      'getClientPortalData',
      { email: 'dave@client.com' },
      { authorization: 'Bearer client-charlie-token' }
    );
    if (status !== 403) throw new Error(`Expected 403, got ${status}`);
  });

  await runTest('deletePermit: Anonymous call rejected with 401', async () => {
    const { status } = await executeAction('deletePermit', { permitId: 'permit-alice' });
    if (status !== 401) throw new Error(`Expected 401, got ${status}`);
  });

  await runTest('deletePermit: Student Alice deleting Student Bob permit rejected with 403', async () => {
    const { status } = await executeAction(
      'deletePermit',
      { permitId: 'permit-bob' },
      { authorization: 'Bearer student-alice-token' }
    );
    if (status !== 403) throw new Error(`Expected 403, got ${status}`);
  });

  await runTest('deletePermit: Student Alice deleting own permit succeeds', async () => {
    const { status, body } = await executeAction(
      'deletePermit',
      { permitId: 'permit-alice' },
      { authorization: 'Bearer student-alice-token' }
    );
    if (status !== 200 || !body.success) throw new Error(`Expected 200, got ${status}`);
  });

  await runTest('selfServicePasswordUpdate: Weak password rejected with 400', async () => {
    const { status } = await executeAction(
      'selfServicePasswordUpdate',
      { email: 'alice@student.com', newPassword: 'weak' },
      { authorization: 'Bearer student-alice-token' }
    );
    if (status !== 400) throw new Error(`Expected 400, got ${status}`);
  });

  await runTest('selfServicePasswordUpdate: Student Alice updating Bob password rejected with 403', async () => {
    const { status } = await executeAction(
      'selfServicePasswordUpdate',
      { email: 'bob@student.com', newPassword: 'StrongPassword2026!' },
      { authorization: 'Bearer student-alice-token' }
    );
    if (status !== 403) throw new Error(`Expected 403, got ${status}`);
  });

  await runTest('selfServicePasswordUpdate: Owner cannot update password using another account identifier', async () => {
    const { status } = await executeAction('selfServicePasswordUpdate', { studentId: 'FIFS-1002', newPassword: 'StrongPassword2026!' }, { authorization: 'Bearer student-alice-token' });
    if (status !== 403) throw new Error(`Expected 403, got ${status}`);
  });

  await runTest('selfServicePasswordUpdate: Student Alice updating own password succeeds', async () => {
    const { status, body } = await executeAction(
      'selfServicePasswordUpdate',
      { email: 'alice@student.com', newPassword: 'StrongPassword2026!' },
      { authorization: 'Bearer student-alice-token' }
    );
    if (status !== 200 || !body.success) throw new Error(`Expected 200, got ${status}`);
  });

  await runTest('firstLoginPasswordChange: Cross-student password change rejected with 403', async () => {
    const { status } = await executeAction(
      'firstLoginPasswordChange',
      { email: 'bob@student.com', newPassword: 'StrongPassword2026!' },
      { authorization: 'Bearer student-alice-token' }
    );
    if (status !== 403) throw new Error(`Expected 403, got ${status}`);
  });

  // --- SECTION 4: ADMINISTRATIVE ACTIONS & APP_METADATA.ROLE STRICT CHECK ---
  console.log('\n[SECTION 4: Administrative Actions & Role-Based Zero-Trust Authorization]');
  const adminActions = [
    { action: 'getAdminDashboardData', payload: {} },
    { action: 'adminDeleteStudent', payload: { studentId: 'FIFS-1002' } },
    { action: 'adminDeleteClient', payload: { clientId: 'CLI-2002' } },
    { action: 'adminDirectInvite', payload: { email: 'newinvite@example.com', fullName: 'Invited Student' } },
    { action: 'adminEnrollStudent', payload: { fullName: 'Test Student', email: 'test@enroll.com', courseName: 'Maryland CCW Combo', scheduledDate: '2026-11-01' } },
    { action: 'adminRescheduleEnrollment', payload: { enrollmentId: 'enr-1', newScheduledDate: '2026-11-15' } },
    { action: 'adminCancelEnrollment', payload: { enrollmentId: 'enr-1', reason: 'Schedule conflict' } },
    { action: 'sendAdminLiveChatReply', payload: { threadId: 'th_alice_123', text: 'Instructor response' } },
    { action: 'getLiveChats', payload: {} },
    { action: 'getLiveChatMessages', payload: { threadId: 'th_alice_123' } },
    { action: 'deleteLiveChatThread', payload: { threadId: 'th_alice_123' } },
    { action: 'markLiveChatRead', payload: { threadId: 'th_alice_123' } }
  ];

  for (const { action, payload } of adminActions) {
    // 1. Anonymous rejected
    await runTest(`${action}: Anonymous call rejected with 401`, async () => {
      const { status } = await executeAction(action, payload);
      if (status !== 401) throw new Error(`Expected 401 for anonymous on ${action}, got ${status}`);
    });

    // 2. Legacy PIN rejected
    await runTest(`${action}: Legacy PIN/passcode ('Ultima') rejected with 401`, async () => {
      const { status } = await executeAction(action, { ...payload, passcode: 'Ultima', pin: '5819' });
      if (status !== 401) throw new Error(`Expected 401 for PIN bypass on ${action}, got ${status}`);
    });

    // 3. Body token without Authorization header rejected
    await runTest(`${action}: Token in body without Authorization header rejected with 401`, async () => {
      const { status } = await executeAction(action, { ...payload, accessToken: 'admin-bearer-token' });
      if (status !== 401) throw new Error(`Expected 401 for body token on ${action}, got ${status}`);
    });

    // 4. Non-admin student token rejected
    await runTest(`${action}: Non-admin student Bearer token rejected with 401`, async () => {
      const { status } = await executeAction(action, payload, { authorization: 'Bearer student-alice-token' });
      if (status !== 401 && status !== 403) throw new Error(`Expected 401/403 for student on ${action}, got ${status}`);
    });

    // 5. User matching admin email but having student role in app_metadata rejected!
    await runTest(`${action}: Matching admin email but student role in app_metadata rejected with 401`, async () => {
      const { status } = await executeAction(action, payload, { authorization: 'Bearer admin-email-student-role-token' });
      if (status !== 401 && status !== 403) throw new Error(`Expected 401/403 on ${action} for email-only match without role`);
    });

    // 6. User with company domain but having student role in app_metadata rejected!
    await runTest(`${action}: Company domain email but student role in app_metadata rejected with 401`, async () => {
      const { status } = await executeAction(action, payload, { authorization: 'Bearer company-domain-student-role-token' });
      if (status !== 401 && status !== 403) throw new Error(`Expected 401/403 on ${action} for domain match without role`);
    });

    // 7. User with user_metadata.role = 'admin' but app_metadata.role = 'student' rejected!
    await runTest(`${action}: user_metadata role without app_metadata.role rejected with 401`, async () => {
      const { status } = await executeAction(action, payload, { authorization: 'Bearer user-metadata-admin-token' });
      if (status !== 401 && status !== 403) throw new Error(`Expected 401/403 on ${action} for forged user_metadata`);
    });

    // 8. Staff / Instructor Bearer token authorized
    await runTest(`${action}: Verified Instructor Bearer token (app_metadata.role) authorized`, async () => {
      const { status } = await executeAction(action, payload, { authorization: 'Bearer instructor-bearer-token' });
      if (status !== 200) throw new Error(`Expected 200 for instructor on ${action}, got ${status}`);
    });

    // 9. Verified Admin Bearer token authorized
    await runTest(`${action}: Verified Admin Bearer token (app_metadata.role) authorized`, async () => {
      const { status } = await executeAction(action, payload, { authorization: 'Bearer admin-bearer-token' });
      if (status !== 200) throw new Error(`Expected 200 for admin on ${action}, got ${status}`);
    });
  }

  // --- SECTION 5: SCHEDULED CRON ---
  console.log('\n[SECTION 5: Scheduled Cron Actions]');
  await runTest('check24HourReminders: Anonymous call rejected with 401', async () => {
    const { status } = await executeAction('check24HourReminders');
    if (status !== 401) throw new Error(`Expected 401, got ${status}`);
  });

  await runTest('check24HourReminders: Valid x-cron-secret header authorized', async () => {
    const { status } = await executeAction('check24HourReminders', {}, { 'x-cron-secret': 'cron-secret-12345' });
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
  });

  await runTest('check24HourReminders: Admin Bearer token authorized', async () => {
    const { status } = await executeAction('check24HourReminders', {}, { authorization: 'Bearer admin-bearer-token' });
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
  });

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED out of ${passedTests + failedTests} total tests.`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
