/**
 * TrainWithFIFS - Offline Payment, Notification & Secret-Handling Regression Suite
 *
 * Covers /api/checkout, /api/stripe/webhook, src/Lib/pricing.ts, the removed Discord relay,
 * dedicated cron/chat secrets, and HTML escaping in staff emails.
 *
 * Every integration is mocked: Supabase, Stripe, and global fetch (Discord/Resend) never leave
 * this process, and no real credentials are read or required.
 */

const fs = require('fs');
const path = require('path');
const Module = require('module');
const { installFetchStub } = require('./lib/ts-loader');

// ---- Safe, fake environment (never real credentials) ----
for (const key of ['DISCORD_WEBHOOK_URL', 'RESEND_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'CRON_SECRET', 'CHAT_HMAC_SECRET']) {
  delete process.env[key];
}
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.example.test';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-secret-key-32chars!';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_offline_only';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_offline_only';
process.env.NEXT_PUBLIC_SITE_URL = 'https://trainwithfifs.example';
const fetchCalls = installFetchStub();
const stubFetch = global.fetch;

// ---- Mock Next.js server primitives ----
const mockNextServer = {
  NextResponse: {
    json: (body, init) => ({ status: (init && init.status) || 200, _body: body, json: async () => body })
  },
  NextRequest: class {}
};

function makeRequest(url, { headers = {}, body } = {}) {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  const raw = body === undefined ? '' : (typeof body === 'string' ? body : JSON.stringify(body));
  return {
    url,
    headers: { get: (name) => (lower[String(name).toLowerCase()] ?? null) },
    json: async () => JSON.parse(raw),
    text: async () => raw
  };
}

// ---- Mock Supabase (query builder with filters, conditional updates, and error injection) ----
let db;
let failures; // e.g. failures['invoices.select'] = { message: 'boom' }
const writes = [];

function resetDb() {
  db = {
    invoices: [
      {
        invoice_number: 'INV-FI-2026-1234', student_id: 'FIFS-1001', status: 'PAID', email: 'victim@student.com',
        total_amount: '259.69', deposit_due: '77.91', amount_paid: '259.69', balance_due: '0.00', stripe_session_id: 'cs_test_victim'
      }
    ],
    students: [
      { id: 'uuid-row-alice', user_id: 'uuid-student-alice', student_id: 'FIFS-1001', email: 'alice@student.com', status: 'STEP_1_REGISTERED' },
      { id: 'uuid-row-bob', user_id: 'uuid-student-bob', student_id: 'FIFS-1002', email: 'bob@student.com', status: 'STEP_1_REGISTERED' }
    ],
    leads: [],
    enrollments: [
      { id: 'enr-1', student_email: 'alice@student.com', scheduled_date: '2026-10-25T14:00:00Z', duration_hours: 8, previous_dates: [], classes: { title: 'Maryland Wear & Carry (CCW)' } }
    ],
    messages: []
  };
  failures = {};
  writes.length = 0;
}

function queryBuilder(table, clientKey) {
  const filters = [];
  let op = 'select';
  let payload = null;
  let returning = false;
  const matches = (row) => filters.every((f) => f(row));
  const run = () => {
    const injected = failures[`${table}.${op}`];
    if (injected) return { data: null, error: injected };
    const rows = db[table] || (db[table] = []);
    if (op === 'insert') {
      const list = Array.isArray(payload) ? payload : [payload];
      for (const row of list) {
        if (table === 'invoices' && rows.some((r) => r.invoice_number === row.invoice_number)) {
          return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
        }
      }
      rows.push(...list.map((r) => ({ ...r })));
      writes.push({ table, op, payload, clientKey });
      return { data: returning ? list : null, error: null };
    }
    if (op === 'update') {
      const hit = rows.filter(matches);
      hit.forEach((r) => Object.assign(r, payload));
      writes.push({ table, op, payload, count: hit.length, clientKey });
      return { data: returning ? hit.map((r) => ({ ...r })) : null, error: null };
    }
    return { data: rows.filter(matches).map((r) => ({ ...r })), error: null };
  };
  const b = {
    select: () => { if (op !== 'select') returning = true; return b; },
    insert: (rows) => { op = 'insert'; payload = rows; return b; },
    upsert: () => { throw new Error('upsert must not be used for invoices (overwrite risk)'); },
    update: (values) => { op = 'update'; payload = values; return b; },
    delete: () => { op = 'delete'; return b; },
    eq: (col, val) => { filters.push((r) => r[col] === val); return b; },
    in: (col, vals) => { filters.push((r) => vals.includes(r[col])); return b; },
    gte: (col, val) => { filters.push((r) => r[col] >= val); return b; },
    lte: (col, val) => { filters.push((r) => r[col] <= val); return b; },
    or: () => b,
    order: () => b,
    maybeSingle: async () => { const r = run(); return { data: r.error ? null : (r.data || [])[0] || null, error: r.error }; },
    single: async () => { const r = run(); const row = r.error ? null : (r.data || [])[0] || null; return { data: row, error: r.error || (row ? null : { message: 'Not found' }) }; },
    then: (resolve, reject) => Promise.resolve(run()).then(resolve, reject)
  };
  return b;
}

const createdClientKeys = [];
const mockSupabase = {
  createClient: (url, key) => ({
    _record: createdClientKeys.push(key),
    from: (table) => queryBuilder(table, key),
    rpc: async () => ({ data: 'POD-TEST', error: null }),
    storage: { from: () => ({ createSignedUrl: async () => ({ data: null, error: { message: 'none' } }) }) },
    auth: {
      getUser: async (token) => {
        const users = {
          'student-alice-token': { id: 'uuid-student-alice', email: 'alice@student.com', app_metadata: { role: 'student' } },
          'admin-bearer-token': { id: 'uuid-admin', email: 'admin@example.test', app_metadata: { role: 'admin' } }
        };
        return users[token] ? { data: { user: users[token] }, error: null } : { data: { user: null }, error: { message: 'Invalid token' } };
      }
    }
  })
};

// ---- Mock Stripe ----
let stripeSessions = {};
let lastCreateParams = null;
let expiredSessionIds = [];
let failStripeExpire = false;
class MockStripe {
  constructor() {
    this.checkout = {
      sessions: {
        create: async (params) => {
          lastCreateParams = params;
          const id = 'cs_test_' + Math.random().toString(36).slice(2, 10);
          const session = {
            id, url: 'https://checkout.stripe.com/c/pay/' + id, status: 'open', payment_status: 'unpaid',
            amount_total: params.line_items[0].price_data.unit_amount, currency: 'usd',
            customer_email: params.customer_email, metadata: params.metadata
          };
          stripeSessions[id] = session;
          return session;
        },
        retrieve: async (id) => {
          if (!stripeSessions[id]) throw new Error('No such checkout.session');
          return stripeSessions[id];
        },
        expire: async (id) => {
          expiredSessionIds.push(id);
          if (failStripeExpire) throw new Error('Stripe expire unavailable');
          if (!stripeSessions[id]) throw new Error('No such checkout.session');
          stripeSessions[id].status = 'expired';
          return stripeSessions[id];
        }
      }
    };
    this.webhooks = {
      constructEvent: (raw, signature, secret) => {
        if (signature !== 'valid-test-signature' || secret !== process.env.STRIPE_WEBHOOK_SECRET) {
          throw new Error('No signatures found matching the expected signature for payload');
        }
        return JSON.parse(raw);
      }
    };
  }
}

const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'next/server') return mockNextServer;
  if (id === '@supabase/supabase-js') return mockSupabase;
  if (id === 'stripe') return MockStripe;
  return originalRequire.apply(this, arguments);
};

const SRC = path.resolve(__dirname, '../src');
const checkoutRoute = require(path.join(SRC, 'app/api/checkout/route.ts'));
const webhookRoute = require(path.join(SRC, 'app/api/stripe/webhook/route.ts'));
const fifsRoute = require(path.join(SRC, 'app/api/fifs/route.ts'));
const pricing = require(path.join(SRC, 'Lib/pricing.ts'));
const { sendDiscordAlert } = require(path.join(SRC, 'Lib/server/discord.ts'));

// ---- Runner ----
let passed = 0;
let failed = 0;
async function test(name, fn) {
  resetDb();
  fetchCalls.length = 0;
  delete process.env.DISCORD_WEBHOOK_URL;
  try {
    await fn();
    passed++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ FAIL: ${name}\n    -> ${err.message}`);
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

async function checkoutPost(body, headers = {}) {
  const res = await checkoutRoute.POST(makeRequest('https://trainwithfifs.example/api/checkout', { headers, body }));
  return { status: res.status, body: res._body };
}
async function checkoutGet(query) {
  const res = await checkoutRoute.GET(makeRequest('https://trainwithfifs.example/api/checkout?' + query));
  return { status: res.status, body: res._body };
}
async function webhook(event, signature = 'valid-test-signature') {
  const headers = signature ? { 'stripe-signature': signature } : {};
  const res = await webhookRoute.POST(makeRequest('https://trainwithfifs.example/api/stripe/webhook', { headers, body: JSON.stringify(event) }));
  return { status: res.status, body: res._body };
}
async function fifs(action, payload = {}, headers = {}) {
  const res = await fifsRoute.POST(makeRequest('https://trainwithfifs.example/api/fifs', { headers, body: { action, ...payload } }));
  return { status: res.status, body: res._body };
}

function pendingInvoice(overrides = {}) {
  const inv = {
    invoice_number: 'INV-FI-2026-AAAA0001', student_id: 'GUEST-0001', status: 'PENDING', email: 'buyer@example.com',
    total_amount: '259.69', deposit_due: '77.91', amount_paid: '0.00', balance_due: '259.69', stripe_session_id: 'cs_test_pending',
    ...overrides
  };
  db.invoices.push(inv);
  return inv;
}
function paidEvent({ id = 'evt_1', sessionId = 'cs_test_pending', amount = 7791, deposit = true, invoiceId = 'INV-FI-2026-AAAA0001', metadata = {}, paymentStatus = 'paid', type = 'checkout.session.completed' } = {}) {
  return {
    id, type,
    data: { object: { id: sessionId, payment_status: paymentStatus, amount_total: amount, currency: 'usd', customer_email: 'buyer@example.com',
      metadata: { invoiceId, isDepositPayment: String(deposit), courseSelection: 'Maryland CCW', ...metadata } } }
  };
}

async function main() {
  console.log('================================================================');
  console.log('🔒 PAYMENT, NOTIFICATION & SECRET-HANDLING REGRESSION SUITE (offline)');
  console.log('================================================================\n');

  console.log('[SECTION A: Discord relay & webhook exposure]');
  await test('Unauthenticated Discord relay route no longer exists (Next.js serves 404)', async () => {
    assert(!fs.existsSync(path.join(SRC, 'app/api/notifications')), 'src/app/api/notifications must not exist');
    assert(!fs.existsSync(path.join(SRC, 'Lib/discord_notifications.ts')), 'module with hardcoded webhook fallback must be removed');
  });
  await test('No Discord webhook URL is hardcoded in src/ or public/', async () => {
    const hits = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (/\.(ts|tsx|js|mjs|html)$/.test(entry.name) && /discord(app)?\.com\/api\/webhooks\//.test(fs.readFileSync(p, 'utf-8'))) hits.push(path.relative(SRC, p));
      }
    };
    walk(SRC);
    walk(path.resolve(__dirname, '../public'));
    assert(hits.length === 0, 'Hardcoded webhook found in: ' + hits.join(', '));
  });
  await test('Discord alerts are skipped (no network call) when DISCORD_WEBHOOK_URL is unset', async () => {
    const sent = await sendDiscordAlert('t', 'd');
    assert(sent === false && fetchCalls.length === 0, 'expected no outbound call');
  });
  await test('Discord alerts disable @everyone/role mentions from user-supplied text', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.example.test/webhook';
    await sendDiscordAlert('@everyone hi', 'x');
    const payload = JSON.parse(fetchCalls[0].init.body);
    assert(Array.isArray(payload.allowed_mentions.parse) && payload.allowed_mentions.parse.length === 0, 'allowed_mentions must be empty');
  });

  console.log('\n[SECTION B: Pricing & attendee counts]');
  await test('Valid group sizes parse to the matching attendee count (group of 4 = 4)', async () => {
    const cases = [[undefined, 1], ['', 1], ['1 (Private One-on-One)', 1], ['2 (Paired Session — 5% Discount)', 2],
      ['3 (Small Group / Family — 10% Discount)', 3], ['4 (Small Group / Family — 10% Discount)', 4], ['5+', 5], ['5', 5], [4, 4]];
    for (const [input, expected] of cases) {
      const got = pricing.parseAttendeeCount(input);
      assert(got === expected, `groupSize ${JSON.stringify(input)} -> ${got}, expected ${expected}`);
    }
  });
  await test('Invalid group sizes are rejected', async () => {
    for (const input of ['0', '6', '10', '-1', 'abc', '4.5', '2x', 'NaN']) {
      assert(pricing.parseAttendeeCount(input) === null, `groupSize ${JSON.stringify(input)} should be rejected`);
    }
  });
  await test('Catalog prices unchanged: single Maryland CCW base = $259.69 total, $77.91 deposit', async () => {
    const p = pricing.calculatePricingBreakdown('Maryland CCW', 1, false);
    assert(p.grandTotal === 259.69 && p.depositDueNow === 77.91 && p.chargeCents === 7791, JSON.stringify(p));
  });
  await test('Group of 4 is charged for 4 attendees with the 10% small-group discount', async () => {
    const p = pricing.calculatePricingBreakdown('Maryland CCW', 4, true);
    // 4 x 199.99 = 799.96, -10% = 719.96 (rounded), + 4 x $45 range = 899.96, + 6% tax 54.00 = 953.96
    assert(p.attendees === 4 && p.grandTotal === 953.96 && p.chargeCents === 95396, JSON.stringify(p));
  });
  await test('Checkout rejects an invalid group size with 400 and creates no Stripe session', async () => {
    lastCreateParams = null;
    const { status } = await checkoutPost({ email: 'buyer@example.com', courseSelection: 'Maryland CCW', groupSize: '12' });
    assert(status === 400 && lastCreateParams === null, `expected 400 without session, got ${status}`);
  });

  console.log('\n[SECTION C: Checkout identifiers, linking & return URLs]');
  await test('Client-supplied invoiceId cannot overwrite an existing (PAID) invoice', async () => {
    const { status, body } = await checkoutPost({ email: 'attacker@example.com', courseSelection: 'Maryland CCW', invoiceId: 'INV-FI-2026-1234' });
    assert(status === 200, `expected 200, got ${status}`);
    assert(body.invoiceId !== 'INV-FI-2026-1234' && /^INV-FI-\d{4}-[0-9A-F]{8}$/.test(body.invoiceId), 'server must generate the invoice id: ' + body.invoiceId);
    const victim = db.invoices.find((i) => i.invoice_number === 'INV-FI-2026-1234');
    assert(victim.status === 'PAID' && victim.email === 'victim@student.com' && victim.amount_paid === '259.69', 'victim invoice was modified');
    assert(writes.some((w) => w.table === 'invoices' && w.op === 'insert'), 'invoice must be inserted (insert-only)');
  });
  await test('Client-supplied studentId and user_id are ignored for guests', async () => {
    const { body } = await checkoutPost({ email: 'attacker@example.com', courseSelection: 'Maryland CCW', studentId: 'FIFS-1001', user_id: 'uuid-student-alice' });
    assert(body.studentId.startsWith('GUEST-'), 'guest must get a server-generated id, got ' + body.studentId);
    assert(lastCreateParams.metadata.linkedUserId === '', 'guest must not be linked to a user');
    assert(lastCreateParams.metadata.studentId === body.studentId, 'metadata must carry the server id');
  });
  await test('A verified bearer token links the booking to the caller\'s own student record (by user_id)', async () => {
    const { body } = await checkoutPost({ email: 'someone-else@example.com', courseSelection: 'Maryland CCW', studentId: 'FIFS-1002' }, { Authorization: 'Bearer student-alice-token' });
    assert(body.studentId === 'FIFS-1001', 'expected Alice\'s own record, got ' + body.studentId);
    assert(lastCreateParams.metadata.linkedUserId === 'uuid-student-alice', 'expected verified user id in metadata');
  });
  await test('An invalid bearer token falls back to an unlinked guest checkout', async () => {
    const { status, body } = await checkoutPost({ email: 'buyer@example.com', courseSelection: 'Maryland CCW' }, { Authorization: 'Bearer forged-token' });
    assert(status === 200 && body.studentId.startsWith('GUEST-') && lastCreateParams.metadata.linkedUserId === '', 'forged token must not link');
  });
  await test('Stripe return URLs use NEXT_PUBLIC_SITE_URL, not Origin/Referer headers', async () => {
    await checkoutPost({ email: 'buyer@example.com', courseSelection: 'Maryland CCW' }, { Origin: 'https://evil.example', Referer: 'https://evil.example/phish' });
    assert(lastCreateParams.success_url.startsWith('https://trainwithfifs.example/?'), 'success_url: ' + lastCreateParams.success_url);
    assert(lastCreateParams.cancel_url.startsWith('https://trainwithfifs.example/?'), 'cancel_url: ' + lastCreateParams.cancel_url);
  });
  await test('Client-supplied totals are ignored; Stripe is charged the server deposit', async () => {
    await checkoutPost({ email: 'buyer@example.com', courseSelection: 'Maryland CCW', amount: 1, totalAmount: 1, depositAmount: 0.1 });
    assert(lastCreateParams.line_items[0].price_data.unit_amount === 7791, 'charged ' + lastCreateParams.line_items[0].price_data.unit_amount);
  });
  await test('Invoice save failure blocks checkout: no payment link, Stripe session expired, staff alerted', async () => {
    expiredSessionIds = [];
    failures['invoices.insert'] = { message: 'insert failed' };
    process.env.DISCORD_WEBHOOK_URL = 'https://alerts.example.test/hook';
    const { status, body } = await checkoutPost({ email: 'buyer@example.com', courseSelection: 'Maryland CCW' });
    assert(status === 503, `expected 503, got ${status}`);
    assert(!body.url && !body.checkoutUrl && !body.sessionId, 'no payment link may be returned');
    assert(expiredSessionIds.length === 1, 'the created Stripe session must be expired');
    assert(stripeSessions[expiredSessionIds[0]].status === 'expired', 'session must be marked expired');
    assert(!db.leads.length, 'no guest lead is captured for a blocked checkout');
    assert(fetchCalls.length === 1 && /could not be recorded/.test(JSON.stringify(fetchCalls[0])), 'staff must be alerted once');
  });
  await test('Invoice save failure still blocks checkout when the Stripe session cannot be expired', async () => {
    expiredSessionIds = [];
    failStripeExpire = true;
    failures['invoices.insert'] = { message: 'insert failed' };
    process.env.DISCORD_WEBHOOK_URL = 'https://alerts.example.test/hook';
    try {
      const { status, body } = await checkoutPost({ email: 'buyer@example.com', courseSelection: 'Maryland CCW' });
      assert(status === 503 && !body.url && !body.checkoutUrl, `expected 503 without a link, got ${status}`);
      assert(expiredSessionIds.length === 1, 'expiry must be attempted');
      assert(/could NOT be expired/.test(JSON.stringify(fetchCalls[0] || {})), 'staff alert must say the session is still open');
    } finally { failStripeExpire = false; }
  });
  await test('/api/fifs submitBooking also refuses to proceed when the invoice cannot be saved', async () => {
    failures['invoices.insert'] = { message: 'insert failed' };
    const { status, body } = await fifs('submitBooking', { email: 'buyer@example.com', courseSelection: 'Maryland CCW', groupSize: '2 (Paired)' });
    assert(status === 503 && !body.checkoutUrl && !body.podInviteCode, `expected 503 without link or pod code, got ${status}`);
  });
  await test('Checkout writes invoices only with the service-role client, never the anon key', async () => {
    createdClientKeys.length = 0;
    const { status } = await checkoutPost({ email: 'buyer@example.com', courseSelection: 'Maryland CCW' });
    assert(status === 200, `expected 200, got ${status}`);
    const invoiceWrites = writes.filter((w) => w.table === 'invoices');
    assert(invoiceWrites.length === 1, 'expected one invoice insert');
    assert(invoiceWrites.every((w) => w.clientKey === process.env.SUPABASE_SERVICE_ROLE_KEY), 'invoice must be written with the service-role key');
    assert(!writes.some((w) => w.clientKey === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), 'no write may use the anon key');
  });
  for (const env of ['production', 'preview']) {
    await test(`Missing service-role key fails checkout closed (503) before Stripe, without the anon key (VERCEL_ENV=${env})`, async () => {
      const saved = { role: process.env.SUPABASE_SERVICE_ROLE_KEY, vercel: process.env.VERCEL_ENV };
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_SERVICE_KEY;
      process.env.VERCEL_ENV = env;
      lastCreateParams = null;
      createdClientKeys.length = 0;
      try {
        const { status, body } = await checkoutPost({ email: 'buyer@example.com', courseSelection: 'Maryland CCW' });
        assert(status === 503 && !body.url && !body.checkoutUrl, `expected 503 without a link, got ${status}`);
        assert(lastCreateParams === null, 'no Stripe session may be created');
        assert(!writes.length, 'nothing may be written');
        assert(!createdClientKeys.includes(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), 'checkout must not create an anon-key client');
        assert(!JSON.stringify(body).includes('service-role-test-secret'), 'no key value in the response');
      } finally {
        process.env.SUPABASE_SERVICE_ROLE_KEY = saved.role;
        if (saved.vercel === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = saved.vercel;
      }
    });
  }
  await test('Missing Stripe configuration fails closed with 503', async () => {
    const saved = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    try {
      const { status, body } = await checkoutPost({ email: 'buyer@example.com' });
      assert(status === 503 && !body.url, `expected 503, got ${status}`);
    } finally { process.env.STRIPE_SECRET_KEY = saved; }
  });
  await test('/api/fifs submitBooking uses the same protections (server IDs, no overwrite)', async () => {
    const { status, body } = await fifs('submitBooking', { email: 'attacker@example.com', courseSelection: 'Maryland CCW', invoiceId: 'INV-FI-2026-1234', studentId: 'FIFS-1001' });
    assert(status === 200 && body.invoiceId !== 'INV-FI-2026-1234' && body.studentId.startsWith('GUEST-'), JSON.stringify(body));
    assert(db.invoices.find((i) => i.invoice_number === 'INV-FI-2026-1234').status === 'PAID', 'victim invoice was modified');
  });

  console.log('\n[SECTION D: Checkout cancellation & status check]');
  await test('Cancelling by invoice number alone is rejected and changes nothing', async () => {
    const { status } = await checkoutGet('action=cancel&invoice=INV-FI-2026-1234');
    assert(status === 400, `expected 400, got ${status}`);
    assert(db.invoices[0].status === 'PAID', 'paid invoice was cancelled');
  });
  await test('A paid Stripe session cannot be cancelled', async () => {
    stripeSessions.cs_test_victim = { id: 'cs_test_victim', status: 'complete', payment_status: 'paid', amount_total: 25969 };
    const { body } = await checkoutGet('action=cancel&session_id=cs_test_victim');
    assert(body.cancelled === false && db.invoices[0].status === 'PAID', 'paid invoice must stay PAID');
  });
  await test('An open, unpaid session cancels only its own PENDING invoice', async () => {
    pendingInvoice();
    stripeSessions.cs_test_pending = { id: 'cs_test_pending', status: 'open', payment_status: 'unpaid', amount_total: 7791 };
    const { body } = await checkoutGet('action=cancel&session_id=cs_test_pending');
    const inv = db.invoices.find((i) => i.stripe_session_id === 'cs_test_pending');
    assert(body.cancelled === true && inv.status === 'CANCELLED', 'expected CANCELLED, got ' + inv.status);
    assert(db.invoices[0].status === 'PAID', 'other invoices must not change');
  });
  await test('Cancellation never overrides a non-PENDING invoice even if Stripe shows unpaid', async () => {
    db.invoices[0].stripe_session_id = 'cs_test_reused';
    stripeSessions.cs_test_reused = { id: 'cs_test_reused', status: 'open', payment_status: 'unpaid' };
    await checkoutGet('action=cancel&session_id=cs_test_reused');
    assert(db.invoices[0].status === 'PAID', 'PAID invoice was cancelled');
  });
  await test('Cancellation database error returns 500 (not a false success)', async () => {
    pendingInvoice();
    stripeSessions.cs_test_pending = { id: 'cs_test_pending', status: 'open', payment_status: 'unpaid' };
    failures['invoices.update'] = { message: 'connection reset' };
    const { status } = await checkoutGet('action=cancel&session_id=cs_test_pending');
    assert(status === 500, `expected 500, got ${status}`);
  });
  await test('Status check is read-only (never marks invoices paid)', async () => {
    pendingInvoice();
    stripeSessions.cs_test_pending = { id: 'cs_test_pending', status: 'complete', payment_status: 'paid', amount_total: 7791 };
    const { status, body } = await checkoutGet('session_id=cs_test_pending');
    assert(status === 200 && body.session.paymentStatus === 'paid', 'expected session summary');
    assert(writes.length === 0, 'status check must not write to the database');
    assert(!('customerEmail' in body.session), 'status check must not expose customer email');
  });

  console.log('\n[SECTION E: Stripe webhook]');
  await test('Missing stripe-signature header is rejected with 400', async () => {
    const { status } = await webhook(paidEvent(), null);
    assert(status === 400, `expected 400, got ${status}`);
  });
  await test('Invalid signature is rejected with 400 and nothing is written', async () => {
    pendingInvoice();
    const { status } = await webhook(paidEvent(), 'forged-signature');
    assert(status === 400 && writes.length === 0, `expected 400 without writes, got ${status}`);
  });
  await test('Deposit payment records DEPOSIT_PAID and preserves the remaining balance', async () => {
    pendingInvoice();
    const { status } = await webhook(paidEvent({ amount: 7791, deposit: true }));
    const inv = db.invoices.find((i) => i.invoice_number === 'INV-FI-2026-AAAA0001');
    assert(status === 200, `expected 200, got ${status}`);
    assert(inv.status === 'DEPOSIT_PAID' && inv.amount_paid === '77.91' && inv.balance_due === '181.78', JSON.stringify(inv));
  });
  await test('Full payment records PAID with zero balance', async () => {
    pendingInvoice();
    await webhook(paidEvent({ amount: 25969, deposit: false }));
    const inv = db.invoices.find((i) => i.invoice_number === 'INV-FI-2026-AAAA0001');
    assert(inv.status === 'PAID' && inv.amount_paid === '259.69' && inv.balance_due === '0.00', JSON.stringify(inv));
  });
  await test('Amount mismatch leaves the invoice unpaid and alerts staff', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.example.test/webhook';
    pendingInvoice();
    const { status } = await webhook(paidEvent({ amount: 100, deposit: true }));
    const inv = db.invoices.find((i) => i.invoice_number === 'INV-FI-2026-AAAA0001');
    assert(status === 200 && inv.status === 'PENDING', 'invoice must stay PENDING, got ' + inv.status);
    assert(fetchCalls.some((c) => /amount mismatch/i.test(c.init.body)), 'expected a mismatch alert');
  });
  await test('Unpaid completed session (delayed payment) does not mark the invoice paid', async () => {
    pendingInvoice();
    await webhook(paidEvent({ paymentStatus: 'unpaid' }));
    assert(db.invoices.find((i) => i.invoice_number === 'INV-FI-2026-AAAA0001').status === 'PENDING', 'must stay PENDING');
  });
  await test('Payment from a different Stripe session than the invoice\'s is not applied (500 so Stripe retries)', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.example.test/webhook';
    pendingInvoice({ stripe_session_id: 'cs_test_other' });
    const { status } = await webhook(paidEvent({ sessionId: 'cs_test_pending' }));
    assert(status === 500, `expected 500, got ${status}`);
    assert(db.invoices.find((i) => i.invoice_number === 'INV-FI-2026-AAAA0001').status === 'PENDING', 'must stay PENDING');
    assert(fetchCalls.some((c) => /manual reconciliation/i.test(c.init.body)), 'expected reconciliation alert');
  });
  await test('Duplicate event delivery applies the payment once and alerts once', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.example.test/webhook';
    pendingInvoice();
    const first = await webhook(paidEvent({ id: 'evt_dup' }));
    const second = await webhook(paidEvent({ id: 'evt_dup' }));
    const invoiceUpdates = writes.filter((w) => w.table === 'invoices' && w.op === 'update' && w.count > 0);
    assert(first.status === 200 && second.status === 200, 'both deliveries should be acknowledged');
    assert(invoiceUpdates.length === 1, `expected 1 applied update, got ${invoiceUpdates.length}`);
    assert(fetchCalls.filter((c) => /Deposit Received/.test(c.init.body)).length === 1, 'expected exactly one payment alert');
  });
  await test('Invoice lookup failure returns 500 so Stripe retries', async () => {
    pendingInvoice();
    failures['invoices.select'] = { message: 'timeout' };
    const { status } = await webhook(paidEvent());
    assert(status === 500, `expected 500, got ${status}`);
  });
  await test('Invoice update failure returns 500 so Stripe retries', async () => {
    pendingInvoice();
    failures['invoices.update'] = { message: 'timeout' };
    const { status } = await webhook(paidEvent());
    assert(status === 500, `expected 500, got ${status}`);
  });
  await test('Student confirmation failure returns 500 before the invoice is changed', async () => {
    pendingInvoice();
    failures['students.update'] = { message: 'timeout' };
    const { status } = await webhook(paidEvent({ metadata: { linkedUserId: 'uuid-student-alice' } }));
    assert(status === 500, `expected 500, got ${status}`);
    assert(db.invoices.find((i) => i.invoice_number === 'INV-FI-2026-AAAA0001').status === 'PENDING', 'invoice must stay PENDING for retry');
  });
  await test('Webhook never confirms a student from a metadata studentId alone', async () => {
    pendingInvoice();
    await webhook(paidEvent({ metadata: { studentId: 'FIFS-1002', linkedUserId: '' } }));
    assert(db.students.find((s) => s.student_id === 'FIFS-1002').status === 'STEP_1_REGISTERED', 'Bob was confirmed by an unverified id');
  });
  await test('Webhook confirms only the verified linked student (by user_id)', async () => {
    pendingInvoice();
    await webhook(paidEvent({ metadata: { studentId: 'FIFS-1002', linkedUserId: 'uuid-student-alice' } }));
    assert(db.students.find((s) => s.user_id === 'uuid-student-alice').status === 'CONFIRMED', 'Alice should be confirmed');
    assert(db.students.find((s) => s.user_id === 'uuid-student-bob').status === 'STEP_1_REGISTERED', 'Bob must not change');
  });
  await test('Paid session with no matching invoice alerts staff and returns 500 so Stripe retries', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.example.test/webhook';
    const { status } = await webhook(paidEvent({ sessionId: 'cs_test_unknown', invoiceId: 'INV-FI-2026-MISSING1' }));
    assert(status === 500, `expected 500, got ${status}`);
    assert(fetchCalls.some((c) => /manual reconciliation/i.test(c.init.body)), 'expected reconciliation alert');
  });
  await test('Session-first lookup applies payment to the invoice saved with that session', async () => {
    pendingInvoice();
    const { status } = await webhook(paidEvent({ invoiceId: 'INV-FI-2026-NOTTHIS1' }));
    const inv = db.invoices.find((i) => i.invoice_number === 'INV-FI-2026-AAAA0001');
    assert(status === 200 && inv.status === 'DEPOSIT_PAID', 'expected payment applied via session match, got ' + inv.status);
  });
  await test('Expired session marks only its PENDING invoice ABANDONED', async () => {
    pendingInvoice();
    await webhook({ id: 'evt_exp', type: 'checkout.session.expired', data: { object: { id: 'cs_test_pending', metadata: { invoiceId: 'INV-FI-2026-AAAA0001' } } } });
    await webhook({ id: 'evt_exp2', type: 'checkout.session.expired', data: { object: { id: 'cs_test_victim', metadata: { invoiceId: 'INV-FI-2026-1234' } } } });
    assert(db.invoices.find((i) => i.invoice_number === 'INV-FI-2026-AAAA0001').status === 'ABANDONED', 'pending invoice should be ABANDONED');
    assert(db.invoices[0].status === 'PAID', 'PAID invoice must not be abandoned');
  });

  console.log('\n[SECTION F: Dedicated secrets & email escaping]');
  await test('Service-role key is not accepted as the cron secret', async () => {
    process.env.CRON_SECRET = 'cron-secret-for-tests-only-0123456789';
    try {
      const { status } = await fifs('check24HourReminders', {}, { 'x-cron-secret': process.env.SUPABASE_SERVICE_ROLE_KEY });
      assert(status === 401, `expected 401, got ${status}`);
    } finally { delete process.env.CRON_SECRET; }
  });
  await test('Cron fails closed when CRON_SECRET is unset', async () => {
    const { status } = await fifs('check24HourReminders', {}, { 'x-cron-secret': '' });
    assert(status === 401, `expected 401, got ${status}`);
  });
  await test('A cron credential with no CRON_SECRET configured fails closed with 503, even if it equals a service key', async () => {
    process.env.SUPABASE_SERVICE_KEY = 'legacy-service-key-alias-32chars-long!';
    try {
      for (const presented of ['anything', process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.SUPABASE_SERVICE_KEY]) {
        const { status, body } = await fifs('check24HourReminders', {}, { 'x-cron-secret': presented });
        assert(status === 503 && /CRON_SECRET/.test(body.error), `expected 503, got ${status}`);
      }
      assert(!writes.length, 'nothing may be written');
    } finally { delete process.env.SUPABASE_SERVICE_KEY; }
  });
  await test('Cron secrets of different lengths are compared safely and refused', async () => {
    process.env.CRON_SECRET = 'cron-secret-for-tests-only-0123456789';
    try {
      for (const presented of ['c', 'cron-secret-for-tests-only-012345678', 'cron-secret-for-tests-only-0123456789X', process.env.SUPABASE_SERVICE_ROLE_KEY]) {
        const { status } = await fifs('check24HourReminders', {}, { 'x-cron-secret': presented });
        assert(status === 401, `length ${presented.length}: expected 401, got ${status}`);
      }
    } finally { delete process.env.CRON_SECRET; }
  });
  await test('Correct CRON_SECRET is accepted', async () => {
    process.env.CRON_SECRET = 'cron-secret-for-tests-only-0123456789';
    process.env.RESEND_API_KEY = 're_test_dummy_key_not_real';
    try {
      const { status } = await fifs('check24HourReminders', {}, { 'x-cron-secret': 'cron-secret-for-tests-only-0123456789' });
      assert(status === 200, `expected 200, got ${status}`);
    } finally { delete process.env.CRON_SECRET; delete process.env.RESEND_API_KEY; }
  });

  console.log('\n[SECTION: 24-hour reminders are marked sent only after the email succeeds]');
  const REMINDER_CRON = 'cron-secret-for-tests-only-0123456789';
  const REMINDER_RESEND_KEY = 're_test_dummy_key_not_real';
  const PROVIDER_ERROR_TEXT = 'PROVIDER_SENTINEL domain is not verified';
  const dueEnrollment = (id, overrides = {}) => ({
    id, student_email: `${id}@student.test`, status: 'confirmed', reminder_sent: false,
    scheduled_date: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), duration_hours: 8, previous_dates: [],
    classes: { title: 'Maryland Wear & Carry (CCW)' }, ...overrides
  });
  /** Runs the reminder action with a fake Resend. behavior(to) returns 'ok' | 'fail' | 'throw'. */
  async function runReminders(enrollments, behavior = () => 'ok', { resendKey = REMINDER_RESEND_KEY } = {}) {
    db.enrollments = enrollments;
    if (resendKey) process.env.RESEND_API_KEY = resendKey; else delete process.env.RESEND_API_KEY;
    process.env.CRON_SECRET = REMINDER_CRON;
    const resendCalls = [];
    const logs = [];
    const savedWarn = console.warn;
    console.warn = (...args) => { logs.push(args.join(' ')); };
    global.fetch = async (url, init = {}) => {
      if (String(url).includes('api.resend.com')) {
        const to = JSON.parse(init.body).to[0];
        resendCalls.push(to);
        const outcome = behavior(to);
        if (outcome === 'throw') throw new Error('network down ' + to);
        if (outcome === 'fail') return { ok: false, status: 422, text: async () => PROVIDER_ERROR_TEXT, json: async () => ({}) };
        return { ok: true, status: 200, text: async () => '', json: async () => ({ id: 'email_fake' }) };
      }
      return stubFetch(url, init);
    };
    try {
      const res = await fifs('check24HourReminders', {}, { 'x-cron-secret': REMINDER_CRON });
      return { ...res, resendCalls, logs: logs.filter((l) => l.startsWith('[Reminders]')) };
    } finally {
      global.fetch = stubFetch;
      console.warn = savedWarn;
      delete process.env.RESEND_API_KEY;
      delete process.env.CRON_SECRET;
    }
  }
  const marked = (id) => db.enrollments.find((e) => e.id === id).reminder_sent === true;

  await test('Reminder email succeeds: row is marked sent and the response reports it', async () => {
    const { status, body, resendCalls } = await runReminders([dueEnrollment('enr-a')]);
    assert(status === 200 && body.success === true, `expected 200 success, got ${status}`);
    assert(body.processedCount === 1 && body.sentIds.join() === 'enr-a' && body.failedCount === 0 && body.failedIds.length === 0, 'unexpected counts: ' + JSON.stringify(body));
    assert(resendCalls.length === 1 && resendCalls[0] === 'enr-a@student.test', 'exactly one email to the student');
    assert(marked('enr-a'), 'row must be marked sent after success');
  });
  await test('Provider failure: row stays unmarked, 502, failed id reported with a generic reason', async () => {
    const { status, body } = await runReminders([dueEnrollment('enr-a')], () => 'fail');
    assert(status === 502 && body.success === false, `expected 502, got ${status}`);
    assert(body.processedCount === 0 && body.sentIds.length === 0 && body.failedCount === 1 && body.failedIds.join() === 'enr-a', 'unexpected counts: ' + JSON.stringify(body));
    assert(body.failures[0].reason === 'send_failed', 'reason code: ' + body.failures[0].reason);
    assert(!marked('enr-a'), 'a failed send must not mark the reminder sent');
  });
  await test('Thrown network error: row stays unmarked and the run reports 502 instead of crashing', async () => {
    const { status, body } = await runReminders([dueEnrollment('enr-a')], () => 'throw');
    assert(status === 502 && body.failedIds.join() === 'enr-a' && body.sentIds.length === 0, `got ${status} ${JSON.stringify(body)}`);
    assert(!marked('enr-a'), 'row must stay unmarked');
  });
  await test('Missing RESEND_API_KEY: 503 before any query, email, or write', async () => {
    createdClientKeys.length = 0;
    const { status, body, resendCalls } = await runReminders([dueEnrollment('enr-a')], () => 'ok', { resendKey: '' });
    assert(status === 503 && body.success === false && body.failedCount === 0 && body.sentIds.length === 0, `got ${status} ${JSON.stringify(body)}`);
    assert(resendCalls.length === 0, 'nothing may be sent');
    assert(createdClientKeys.length === 0, 'no database client may be created, so nothing is queried');
    assert(!writes.length && !marked('enr-a'), 'nothing may be written or marked');
  });
  await test('A missing API key does not bypass authorization (unauthenticated request still gets 401)', async () => {
    delete process.env.RESEND_API_KEY;
    const { status } = await fifs('check24HourReminders', {}, {});
    assert(status === 401, `expected 401, got ${status}`);
  });
  await test('Mixed batch: one failure does not stop the others; only successful rows are marked', async () => {
    const { status, body, resendCalls } = await runReminders(
      [dueEnrollment('enr-1x'), dueEnrollment('enr-2x'), dueEnrollment('enr-3x')],
      (to) => (to.startsWith('enr-2x') ? 'fail' : 'ok')
    );
    assert(status === 502 && body.sentIds.join() === 'enr-1x,enr-3x' && body.failedIds.join() === 'enr-2x' && body.failedCount === 1, `got ${status} ${JSON.stringify(body)}`);
    assert(resendCalls.length === 3, 'all three rows must be attempted');
    assert(marked('enr-1x') && !marked('enr-2x') && marked('enr-3x'), 'only the successful rows are marked');
  });
  await test('Missing student email is counted as failed and left unmarked without sending', async () => {
    const { status, body, resendCalls } = await runReminders([
      dueEnrollment('enr-empty', { student_email: '' }), dueEnrollment('enr-null', { student_email: null }),
      dueEnrollment('enr-blank', { student_email: '   ' }), dueEnrollment('enr-ok')
    ]);
    assert(status === 502 && body.failedCount === 3 && body.sentIds.join() === 'enr-ok', `got ${status} ${JSON.stringify(body)}`);
    assert(body.failures.every((f) => f.reason === 'missing_recipient'), 'reason must be missing_recipient');
    assert(resendCalls.length === 1 && resendCalls[0] === 'enr-ok@student.test', 'only the row with an address is emailed');
    assert(!marked('enr-empty') && !marked('enr-null') && !marked('enr-blank') && marked('enr-ok'), 'only the emailed row is marked');
  });
  await test('Marking failure after a successful send is reported and the row stays unmarked', async () => {
    failures['enrollments.update'] = { message: 'update failed' };
    const { status, body, resendCalls } = await runReminders([dueEnrollment('enr-a')]);
    assert(resendCalls.length === 1, 'the email was sent');
    assert(status === 502 && body.sentIds.length === 0 && body.failedIds.join() === 'enr-a' && body.failures[0].reason === 'mark_failed', `got ${status} ${JSON.stringify(body)}`);
    assert(!marked('enr-a'), 'the row must remain unmarked so it is not silently lost');
  });
  await test('Retry: failed rows are sent on the next run, already-sent rows are never resent', async () => {
    const rows = [dueEnrollment('enr-1x'), dueEnrollment('enr-2x')];
    const first = await runReminders(rows, (to) => (to.startsWith('enr-2x') ? 'fail' : 'ok'));
    assert(first.status === 502 && marked('enr-1x') && !marked('enr-2x'), 'first run: one sent, one failed');
    const second = await runReminders(db.enrollments, () => 'ok');
    assert(second.status === 200 && second.body.sentIds.join() === 'enr-2x', `retry should send only the failed row, got ${JSON.stringify(second.body)}`);
    assert(second.resendCalls.join() === 'enr-2x@student.test', 'the already-sent row must not be emailed again');
    assert(marked('enr-1x') && marked('enr-2x'), 'both rows are now marked');
    const third = await runReminders(db.enrollments, () => 'ok');
    assert(third.status === 200 && third.body.processedCount === 0 && third.resendCalls.length === 0, 'a further run must send nothing');
  });
  await test('Already-sent, cancelled, and out-of-window enrollments are not emailed (existing selection unchanged)', async () => {
    const { status, body, resendCalls } = await runReminders([
      dueEnrollment('enr-sent', { reminder_sent: true }), dueEnrollment('enr-cancelled', { status: 'cancelled' }),
      dueEnrollment('enr-soon', { scheduled_date: new Date(Date.now() + 3 * 3600 * 1000).toISOString() }),
      dueEnrollment('enr-late', { scheduled_date: new Date(Date.now() + 72 * 3600 * 1000).toISOString() }), dueEnrollment('enr-due')
    ]);
    assert(status === 200 && body.sentIds.join() === 'enr-due' && resendCalls.join() === 'enr-due@student.test', `got ${status} ${JSON.stringify(body)}`);
  });
  await test('Reminder responses and logs never contain email addresses, provider text, or secrets', async () => {
    const scenarios = [
      () => runReminders([dueEnrollment('enr-a')], () => 'fail'),
      () => runReminders([dueEnrollment('enr-a')], () => 'throw'),
      () => runReminders([dueEnrollment('enr-a', { student_email: '' }), dueEnrollment('enr-b')]),
      () => runReminders([dueEnrollment('enr-a')], () => 'ok', { resendKey: '' }),
      async () => { failures['enrollments.update'] = { message: 'update failed PROVIDER_SENTINEL' }; return runReminders([dueEnrollment('enr-a')]); }
    ];
    const forbidden = ['@', 'student.test', PROVIDER_ERROR_TEXT, 'PROVIDER_SENTINEL', REMINDER_RESEND_KEY, REMINDER_CRON, process.env.SUPABASE_SERVICE_ROLE_KEY, 'network down'];
    for (const run of scenarios) {
      resetDb();
      const { body, logs } = await run();
      const text = JSON.stringify(body) + '\n' + logs.join('\n');
      for (const bad of forbidden) assert(!text.includes(bad), `output leaked "${bad === process.env.SUPABASE_SERVICE_ROLE_KEY ? '<service key>' : bad}"`);
    }
  });
  await test('Visitor chat does not fall back to the service-role key for thread signing', async () => {
    process.env.SUPABASE_SERVICE_KEY = 'legacy-service-key-alias-32chars-long!';
    try {
      const { status } = await fifs('handleLiveChatMessage', { message: 'hello' });
      assert(status === 503 && db.messages.length === 0, `expected fail-closed 503, got ${status}`);
    } finally { delete process.env.SUPABASE_SERVICE_KEY; }
  });
  await test('Missing CHAT_HMAC_SECRET is a server error (503), never a "wrong credential" on existing threads', async () => {
    const cont = await fifs('handleLiveChatMessage', { message: 'again', threadId: 'th_0123456789abcdef0123456789abcdef', threadSecret: 'ab'.repeat(32) });
    assert(cont.status === 503 && db.messages.length === 0, `continue thread: expected 503, got ${cont.status}`);
    const read = await fifs('getVisitorChatMessages', { threadId: 'th_0123456789abcdef0123456789abcdef', threadSecret: 'ab'.repeat(32) });
    assert(read.status === 503, `read thread: expected 503, got ${read.status}`);
  });
  await test('A weak (short) CHAT_HMAC_SECRET is rejected as unconfigured', async () => {
    process.env.CHAT_HMAC_SECRET = 'too-short';
    try {
      const { status } = await fifs('handleLiveChatMessage', { message: 'hello' });
      assert(status === 503 && db.messages.length === 0, `expected 503, got ${status}`);
    } finally { delete process.env.CHAT_HMAC_SECRET; }
  });
  await test('Thread credentials of the wrong length are refused safely (403, no exception)', async () => {
    process.env.CHAT_HMAC_SECRET = 'chat-hmac-secret-for-tests-only-0123456789';
    try {
      for (const bad of ['ab', 'ab'.repeat(40), 'not-hex-at-all']) {
        const { status } = await fifs('getVisitorChatMessages', { threadId: 'th_0123456789abcdef0123456789abcdef', threadSecret: bad });
        assert(status === 403, `secret ${bad.length} chars: expected 403, got ${status}`);
      }
    } finally { delete process.env.CHAT_HMAC_SECRET; }
  });
  await test('Staff reschedule email escapes HTML in class title and instructor note', async () => {
    process.env.RESEND_API_KEY = 're_test_dummy_key_not_real';
    try {
      db.enrollments[0].classes.title = '<img src=x onerror=alert(1)>';
      await fifs('adminRescheduleEnrollment', { enrollmentId: 'enr-1', newScheduledDate: '2026-11-01T14:00:00Z', reason: '<script>alert(1)</script>' }, { Authorization: 'Bearer admin-bearer-token' });
      const mail = fetchCalls.find((c) => c.url.includes('resend'));
      assert(mail, 'expected an email to the (stubbed) Resend API');
      const html = JSON.parse(mail.init.body).html;
      assert(!html.includes('<script>') && !html.includes('<img'), 'raw HTML leaked into email: ' + html);
      assert(html.includes('&lt;script&gt;'), 'expected escaped note');
    } finally { delete process.env.RESEND_API_KEY; }
  });

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Suite crashed:', err);
  process.exit(1);
});
