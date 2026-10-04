const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Module = require('node:module');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '../src/app/api/stripe/webhook/route.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

function makeHarness({ event, invoices, students = [], failUpdateTable = null }) {
  let eventToReturn = event;
  const tables = { invoices: structuredClone(invoices), students: structuredClone(students) };
  const mockRequire = (id) => {
    if (id === 'next/server') return { NextResponse: { json: (body, init = {}) => ({ status: init.status || 200, body }) } };
    if (id === 'stripe') return { __esModule: true, default: class Stripe { constructor() { this.webhooks = { constructEvent: () => eventToReturn }; } } };
    if (id === '@supabase/supabase-js') return { createClient: () => ({ from: (table) => makeQuery(table) }) };
    return require(id);
  };

  function makeQuery(table) {
    const query = { table, operation: 'select', filters: [], values: null, returning: false };
    query.select = () => { query.returning = true; return query; };
    query.update = (values) => { query.operation = 'update'; query.values = values; return query; };
    query.eq = (column, value) => { query.filters.push((row) => row[column] === value); return query; };
    query.neq = (column, value) => { query.filters.push((row) => row[column] !== value); return query; };
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
    async post() {
      return sandbox.exports.POST({ text: async () => 'signed raw payload', headers: { get: (key) => key === 'stripe-signature' ? 'valid-signature' : null } });
    },
    setEvent(nextEvent) { eventToReturn = nextEvent; },
  };
}

function sessionEvent(type, overrides = {}) {
  return { type, data: { object: { id: 'cs_test_123', client_reference_id: 'FIFS-1001', amount_total: 25000, payment_status: 'paid', customer_email: 'guest@example.com', metadata: { invoiceId: 'INV-1', studentId: 'FIFS-1001', courseSelection: 'Test Course' }, ...overrides } } };
}

(async () => {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';

  {
    const h = makeHarness({ event: sessionEvent('checkout.session.completed'), invoices: [{ id: 'invoice-uuid', invoice_number: 'INV-1', status: 'PENDING', stripe_session_id: 'cs_test_123' }], students: [] });
    const response = await h.post();
    assert.equal(response.status, 200, 'paid guest checkout should succeed without a student row');
    assert.equal(h.tables.invoices[0].status, 'PAID');
  }
  {
    const h = makeHarness({ event: sessionEvent('checkout.session.completed'), invoices: [{ id: 'invoice-uuid', invoice_number: 'INV-1', status: 'PENDING', stripe_session_id: 'cs_test_123' }], failUpdateTable: 'invoices' });
    assert.equal((await h.post()).status, 500, 'invoice write failure must be retryable');
  }
  {
    const h = makeHarness({ event: sessionEvent('checkout.session.completed'), invoices: [] });
    assert.equal((await h.post()).status, 500, 'missing invoice must not be acknowledged as success');
  }
  {
    const h = makeHarness({ event: sessionEvent('checkout.session.expired'), invoices: [{ id: 'invoice-uuid', invoice_number: 'INV-1', status: 'PAID', stripe_session_id: 'cs_test_123' }] });
    assert.equal((await h.post()).status, 200);
    assert.equal(h.tables.invoices[0].status, 'PAID', 'expiration must not overwrite a paid invoice');
  }
  {
    const h = makeHarness({ event: sessionEvent('checkout.session.expired'), invoices: [{ id: 'invoice-uuid', invoice_number: 'INV-1', status: 'PENDING', stripe_session_id: 'cs_test_123' }], failUpdateTable: 'invoices' });
    assert.equal((await h.post()).status, 500, 'expiration write failure must be retryable');
  }
  {
    const h = makeHarness({ event: sessionEvent('checkout.session.completed'), invoices: [{ id: 'invoice-uuid', invoice_number: 'INV-1', status: 'PENDING', stripe_session_id: 'cs_test_other' }] });
    assert.equal((await h.post()).status, 500, 'invoice/session conflict must not overwrite another session');
  }

  console.log('Stripe webhook regression tests passed (6 cases).');
})().catch((err) => { console.error(err); process.exitCode = 1; });
