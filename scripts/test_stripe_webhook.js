const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Module = require('node:module');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '../src/app/api/stripe/webhook/route.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

function makeHarness({ event, invoices, students = [], failUpdateTable = null, failEmail = false }) {
  let eventToReturn = event;
  const tables = { invoices: structuredClone(invoices), students: structuredClone(students) };
  const alerts = [];
  const podCalls = [];
  const dayCalls = [];
  const emails = [];
  const mockRequire = (id) => {
    if (id === 'next/server') return { NextResponse: { json: (body, init = {}) => ({ status: init.status || 200, body }) } };
    if (id === 'stripe') return { __esModule: true, default: class Stripe { constructor() { this.webhooks = { constructEvent: () => eventToReturn }; } } };
    if (id === '@supabase/supabase-js') return { createClient: () => ({ from: (table) => makeQuery(table) }) };
    // Shared server modules used by the webhook: service-role client and Discord alerts (recorded, never sent).
    if (id === '@/Lib/server/supabase-admin') return { getPrivilegedClient: () => ({ from: (table) => makeQuery(table) }) };
    if (id === '@/Lib/server/discord') return { sendDiscordAlert: async (title) => { alerts.push(title); return true; } };
    // Group code email (recorded, never sent). failEmail makes it throw, to prove a mail problem cannot affect the payment.
    if (id === '@/Lib/server/group-email') return { sendGroupCodeEmail: async (to, meta) => { if (failEmail) throw new Error('mail down'); emails.push({ to, meta }); return true; } };
    if (id === '@/Lib/server/online-email') return { sendOnlineConfirmationForSession: async (sb, session) => { emails.push({ online: true, to: session.customer_email, md: session.metadata }); return true; } };
    // Online-classroom seat release (recorded, never run): called only when an unpaid live-online checkout expires.
    if (id === '@/Lib/server/online-classroom') return { releaseDayClaims: async (inv) => { dayCalls.push(inv); } };
    // Pod seat helpers (recorded, never run): the webhook calls them only when an unpaid member/leader checkout expires.
    if (id === '@/Lib/server/booking-checkout') return { releasePodSeat: async (code) => { podCalls.push(['release', code]); return true; }, cancelUnpaidLeaderPod: async (code) => { podCalls.push(['cancelLeader', code]); return true; } };
    return require(id);
  };

  function makeQuery(table) {
    const query = { table, operation: 'select', filters: [], values: null, returning: false };
    query.select = () => { query.returning = true; return query; };
    query.update = (values) => { query.operation = 'update'; query.values = values; return query; };
    query.eq = (column, value) => { query.filters.push((row) => row[column] === value); return query; };
    query.neq = (column, value) => { query.filters.push((row) => row[column] !== value); return query; };
    query.in = (column, values) => { query.filters.push((row) => values.includes(row[column])); return query; };
    query.maybeSingle = async () => {
      const result = await execute(query);
      if (result.error) return result;
      return { data: Array.isArray(result.data) ? result.data[0] || null : result.data, error: null };
    };
    query.then = (resolve, reject) => execute(query).then(resolve, reject);
    return query;
  }

  async function execute(query) {
    if (failUpdateTable === query.table && query.operation === 'update') return { data: null, error: { message: 'injected update failure' } };
    const rows = tables[query.table] || [];
    const matched = rows.filter((row) => query.filters.every((filter) => filter(row)));
    if (query.operation === 'update') {
      for (const row of matched) Object.assign(row, query.values);
      return { data: query.returning ? matched : null, error: null };
    }
    return { data: matched, error: null };
  }

  const sandbox = { exports: {}, require: mockRequire, process, console: { error() {}, warn() {}, log() {} }, fetch: async () => ({ ok: true, status: 200 }), Date };
  vm.runInNewContext(compiled, sandbox, { filename: sourcePath });
  return {
    tables,
    alerts,
    emails,
    podCalls,
    dayCalls,
    async post() {
      return sandbox.exports.POST({ text: async () => 'signed raw payload', headers: { get: (key) => key === 'stripe-signature' ? 'valid-signature' : null } });
    },
    setEvent(nextEvent) { eventToReturn = nextEvent; },
  };
}

// Invoice rows carry the amounts the webhook verifies against ($250.00 total, $75.00 deposit).
function invoiceRow(overrides = {}) {
  return { id: 'invoice-uuid', invoice_number: 'INV-1', status: 'PENDING', stripe_session_id: 'cs_test_123', total_amount: '250.00', deposit_due: '75.00', amount_paid: '0.00', balance_due: '250.00', ...overrides };
}

function sessionEvent(type, overrides = {}) {
  return { type, data: { object: { id: 'cs_test_123', client_reference_id: 'FIFS-1001', amount_total: 25000, payment_status: 'paid', customer_email: 'guest@example.com', metadata: { invoiceId: 'INV-1', studentId: 'FIFS-1001', courseSelection: 'Test Course' }, ...overrides } } };
}

(async () => {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';

  {
    const h = makeHarness({ event: sessionEvent('checkout.session.completed'), invoices: [invoiceRow()], students: [] });
    const response = await h.post();
    assert.equal(response.status, 200, 'paid guest checkout should succeed without a student row');
    assert.equal(h.tables.invoices[0].status, 'PAID');
    assert.equal(h.tables.invoices[0].balance_due, '0.00', 'full payment leaves no balance');
    assert.equal(h.tables.invoices[0].amount_paid, '250.00');
  }
  {
    const h = makeHarness({ event: sessionEvent('checkout.session.completed'), invoices: [invoiceRow()], failUpdateTable: 'invoices' });
    assert.equal((await h.post()).status, 500, 'invoice write failure must be retryable');
  }
  {
    const h = makeHarness({ event: sessionEvent('checkout.session.completed'), invoices: [] });
    assert.equal((await h.post()).status, 500, 'missing invoice must not be acknowledged as success');
    assert.ok(h.alerts.some((t) => /manual reconciliation/i.test(t)), 'missing invoice must alert staff');
  }
  {
    // Pod cleanup on expiry: only when the invoice really goes PENDING -> ABANDONED, and by role.
    const member = { metadata: { invoiceId: 'INV-1', podCode: 'FIFS-POD-AB12', podRole: 'member' } };
    const leader = { metadata: { invoiceId: 'INV-1', podCode: 'FIFS-POD-AB12', podRole: 'leader' } };
    const ev = (extra) => sessionEvent('checkout.session.expired', extra);
    const m = makeHarness({ event: ev(member), invoices: [invoiceRow()] });
    assert.equal((await m.post()).status, 200);
    assert.deepEqual(m.podCalls, [['release', 'FIFS-POD-AB12']], 'an unpaid member checkout gives its seat back');
    const l = makeHarness({ event: ev(leader), invoices: [invoiceRow()] });
    await l.post();
    assert.deepEqual(l.podCalls, [['cancelLeader', 'FIFS-POD-AB12']], 'an unpaid leader checkout cancels the pod');
    const paid = makeHarness({ event: ev(member), invoices: [invoiceRow({ status: 'PAID' })] });
    await paid.post();
    assert.deepEqual(paid.podCalls, [], 'a paid invoice never releases a seat');
    const replay = makeHarness({ event: ev(member), invoices: [invoiceRow({ status: 'ABANDONED' })] });
    await replay.post();
    assert.deepEqual(replay.podCalls, [], 'a replayed expiry event never releases twice');
    const plain = makeHarness({ event: sessionEvent('checkout.session.expired'), invoices: [invoiceRow()] });
    await plain.post();
    assert.deepEqual(plain.podCalls, [], 'a booking without a pod touches no pod');
  }
  {
    const h = makeHarness({ event: sessionEvent('checkout.session.expired'), invoices: [invoiceRow({ status: 'PAID' })] });
    assert.equal((await h.post()).status, 200);
    assert.equal(h.tables.invoices[0].status, 'PAID', 'expiration must not overwrite a paid invoice');
  }
  {
    const h = makeHarness({ event: sessionEvent('checkout.session.expired'), invoices: [invoiceRow()], failUpdateTable: 'invoices' });
    assert.equal((await h.post()).status, 500, 'expiration write failure must be retryable');
  }
  {
    const h = makeHarness({ event: sessionEvent('checkout.session.completed'), invoices: [invoiceRow({ stripe_session_id: 'cs_test_other' })] });
    assert.equal((await h.post()).status, 500, 'invoice/session conflict must not overwrite another session');
    assert.equal(h.tables.invoices[0].status, 'PENDING', 'conflicting invoice must not be modified');
  }
  {
    // Session-first lookup: a legacy invoice without a saved session ID is matched by exact invoice number.
    const h = makeHarness({ event: sessionEvent('checkout.session.completed'), invoices: [invoiceRow({ stripe_session_id: null })] });
    assert.equal((await h.post()).status, 200);
    assert.equal(h.tables.invoices[0].status, 'PAID');
    assert.equal(h.tables.invoices[0].stripe_session_id, 'cs_test_123', 'session ID is recorded on the invoice');
  }
  {
    // Session-first lookup: the invoice saved with this session wins even if metadata names another invoice.
    const h = makeHarness({ event: sessionEvent('checkout.session.completed', { metadata: { invoiceId: 'INV-OTHER' } }), invoices: [invoiceRow()] });
    assert.equal((await h.post()).status, 200);
    assert.equal(h.tables.invoices[0].status, 'PAID');
  }
  {
    // Deposit accounting: the remaining balance is preserved, never zeroed.
    const h = makeHarness({ event: sessionEvent('checkout.session.completed', { amount_total: 7500, metadata: { invoiceId: 'INV-1', isDepositPayment: 'true' } }), invoices: [invoiceRow()] });
    assert.equal((await h.post()).status, 200);
    assert.equal(h.tables.invoices[0].status, 'DEPOSIT_PAID');
    assert.equal(h.tables.invoices[0].amount_paid, '75.00');
    assert.equal(h.tables.invoices[0].balance_due, '175.00');
  }
  {
    // Amount mismatch: acknowledged (a retry cannot fix it) but never marked paid; staff alerted.
    const h = makeHarness({ event: sessionEvent('checkout.session.completed', { amount_total: 100 }), invoices: [invoiceRow()] });
    assert.equal((await h.post()).status, 200);
    assert.equal(h.tables.invoices[0].status, 'PENDING', 'underpayment must not mark the invoice paid');
    assert.ok(h.alerts.some((t) => /amount mismatch/i.test(t)), 'mismatch must alert staff');
  }
  {
    // Duplicate delivery: the payment is applied and announced once.
    const h = makeHarness({ event: sessionEvent('checkout.session.completed'), invoices: [invoiceRow()] });
    assert.equal((await h.post()).status, 200);
    assert.equal((await h.post()).status, 200);
    assert.equal(h.alerts.filter((t) => /Payment in Full Received/.test(t)).length, 1, 'duplicate event must not re-apply or re-alert');
  }
  {
    // Group organizer: the group code email goes out once, to the booker, after the payment is applied.
    const leaderMeta = { invoiceId: 'INV-1', podRole: 'leader', podCode: 'FIFS-POD-A1B2', courseSelection: 'Maryland CCW — VIP Turnkey ($279.99)', preferredDates: 'Oct 25', attendees: '4', fullName: 'Pat Leader' };
    const h = makeHarness({ event: sessionEvent('checkout.session.completed', { metadata: leaderMeta }), invoices: [invoiceRow()] });
    assert.equal((await h.post()).status, 200);
    assert.equal((await h.post()).status, 200);
    assert.equal(h.emails.length, 1, 'a duplicate delivery must not send a second email');
    assert.deepEqual([h.emails[0].to, h.emails[0].meta.code, h.emails[0].meta.size], ['guest@example.com', 'FIFS-POD-A1B2', 4]);
  }
  {
    // Members and ordinary bookings get no group email; an unpaid or mismatched payment sends nothing.
    const member = makeHarness({ event: sessionEvent('checkout.session.completed', { metadata: { invoiceId: 'INV-1', podRole: 'member', podCode: 'FIFS-POD-A1B2' } }), invoices: [invoiceRow()] });
    await member.post();
    const plain = makeHarness({ event: sessionEvent('checkout.session.completed'), invoices: [invoiceRow()] });
    await plain.post();
    const under = makeHarness({ event: sessionEvent('checkout.session.completed', { amount_total: 100, metadata: { invoiceId: 'INV-1', podRole: 'leader', podCode: 'FIFS-POD-A1B2' } }), invoices: [invoiceRow()] });
    await under.post();
    assert.equal(member.emails.length + plain.emails.length + under.emails.length, 0, 'only a paid organizer gets the email');
  }
  {
    // Live online booking: the confirmation goes out once after the payment is applied; ordinary bookings send none.
    const online = makeHarness({ event: sessionEvent('checkout.session.completed', { metadata: { invoiceId: 'INV-1', delivery: 'live_online', classroomSessionId: 'a', rangeSessionId: 'b', fullName: 'Remote' } }), invoices: [invoiceRow()] });
    assert.equal((await online.post()).status, 200);
    assert.equal((await online.post()).status, 200);
    assert.equal(online.emails.filter((e) => e.online).length, 1, 'one online confirmation, even if Stripe repeats the event');
    const plain = makeHarness({ event: sessionEvent('checkout.session.completed'), invoices: [invoiceRow()] });
    await plain.post();
    assert.equal(plain.emails.filter((e) => e.online).length, 0, 'in-person bookings get no online confirmation');
    const expired = makeHarness({ event: sessionEvent('checkout.session.expired', { metadata: { invoiceId: 'INV-1', delivery: 'live_online' } }), invoices: [invoiceRow({ status: 'PENDING' })] });
    await expired.post();
    assert.ok(expired.dayCalls.length === 1, 'an expired unpaid checkout gives its calendar days back');
  }
  {
    // A mail failure never changes the payment result.
    const h = makeHarness({ failEmail: true, event: sessionEvent('checkout.session.completed', { metadata: { invoiceId: 'INV-1', podRole: 'leader', podCode: 'FIFS-POD-A1B2' } }), invoices: [invoiceRow()] });
    assert.equal((await h.post()).status, 200);
    assert.equal(h.tables.invoices[0].status, 'PAID', 'the payment must still be recorded');
  }
  {
    // A browser-supplied studentId in metadata never confirms a student; only verified linkedUserId does.
    const students = [{ student_id: 'FIFS-1001', user_id: 'uuid-other', status: 'STEP_1_REGISTERED' }, { student_id: 'FIFS-2002', user_id: 'uuid-linked', status: 'STEP_1_REGISTERED' }];
    const h = makeHarness({ event: sessionEvent('checkout.session.completed', { metadata: { invoiceId: 'INV-1', studentId: 'FIFS-1001', linkedUserId: 'uuid-linked' } }), invoices: [invoiceRow()], students });
    assert.equal((await h.post()).status, 200);
    assert.equal(h.tables.students[0].status, 'STEP_1_REGISTERED', 'studentId from metadata must not confirm a student');
    assert.equal(h.tables.students[1].status, 'CONFIRMED', 'verified linked user is confirmed');
  }

  console.log('Stripe webhook regression tests passed (12 cases).');
})().catch((err) => { console.error(err); process.exitCode = 1; });
