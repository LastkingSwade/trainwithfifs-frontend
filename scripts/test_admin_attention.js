// "Needs attention" (offline): what the admin hub flags, from stored data. Read only, staff only, capped, and honest when something cannot be read.
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..'); const R = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
const load = (rel, mocks = {}) => { const m = { exports: {} }; const req = (id) => (id in mocks ? mocks[id] : require(id)); vm.runInNewContext(ts.transpileModule(R(rel), { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, require: req, Date, Math, Number, String, Array, Set, Promise, Error, JSON, console }); return m.exports; };
const pricing = load('src/Lib/pricing.ts'); const copy = load('src/group/groupCopy.ts');
const A = load('src/Lib/server/admin-attention.ts', { '@/Lib/pricing': pricing, '@/group/groupCopy': copy });
const NOW = new Date('2026-10-12T15:00:00Z'); const hoursAgo = (h) => new Date(NOW.getTime() - h * 3600000).toISOString(); const daysFromNow = (d) => new Date(NOW.getTime() + d * 86400000).toISOString().slice(0, 10);
const base = { now: NOW, invoices: [], students: [], clients: [], scoresheetStudentIds: new Set(), unreadThreads: 0 };
const group = (res, key) => res.groups.find((g) => g.key === key);

(async () => {
  console.log('\n[needs attention]');
  await test('Nothing to do means an empty list, not a made-up one', () => { const r = A.buildAttention(base); assert(r.total === 0 && r.groups.length === 0 && r.unavailable.length === 0, JSON.stringify(r)); });

  await test('Balance due: only deposits with money still owed, biggest first; paid-in-full and zero balances are ignored', () => {
    const r = A.buildAttention({ ...base, invoices: [
      { invoice_number: 'INV-1', email: 'a@x.test', course: 'Maryland Wear & Carry (CCW)', status: 'DEPOSIT_PAID', balance_due: 140, created_at: hoursAgo(50) },
      { invoice_number: 'INV-2', email: 'b@x.test', course: 'Maryland HQL', status: 'DEPOSIT_PAID', balance_due: 70, created_at: hoursAgo(50) },
      { invoice_number: 'INV-3', email: 'c@x.test', course: 'Maryland HQL', status: 'PAID', balance_due: 0, created_at: hoursAgo(50) },
      { invoice_number: 'INV-4', email: 'd@x.test', course: 'Maryland HQL', status: 'DEPOSIT_PAID', balance_due: 0, created_at: hoursAgo(50) },
    ] }); const g = group(r, 'balance');
    assert(g.count === 2 && g.items[0].ref === 'INV-1' && /\$140\.00 still due/.test(g.items[0].title) && g.items[1].ref === 'INV-2' && g.action === 'payments', JSON.stringify(g));
  });

  await test('Unpaid bookings: older than 2 hours and newer than 14 days, newest first; a person still paying (minutes old) and long-abandoned ones are left out', () => {
    const r = A.buildAttention({ ...base, invoices: ['1', '3', '30', '400', '19'].map((h, i) => ({ invoice_number: 'INV-P' + h, email: 'p' + i + '@x.test', course: 'Maryland HQL', status: 'PENDING', balance_due: 0, created_at: h === '1' ? hoursAgo(0.25) : hoursAgo(+h) })) });
    const g = group(r, 'unpaid'); assert(g.count === 3 && g.items.map((x) => x.ref).join() === 'INV-P3,INV-P19,INV-P30', g.items.map((x) => x.ref).join());
    assert(/3 hours ago/.test(g.items[0].detail) && /1 days ago|30 hours|ago/.test(g.items[2].detail), 'readable ages');
  });

  await test('Score sheets: only Wear & Carry style courses at live fire or later with no sheet saved; HQL and coaching never appear; a saved sheet clears it', () => {
    const mk = (id, course, status) => ({ student_id: id, full_name: 'Student ' + id, course, status });
    const r = A.buildAttention({ ...base, scoresheetStudentIds: new Set(['FIFS-3']), students: [
      mk('FIFS-1', 'Maryland Wear & Carry (CCW) Initial Course', 'STEP_6_CERTIFIED'), mk('FIFS-2', 'Maryland Wear & Carry (8-Hour Renewal)', 'STEP_5_LIVE_FIRE'),
      mk('FIFS-3', 'Maryland Wear & Carry (CCW) Initial Course', 'STEP_6_CERTIFIED'), mk('FIFS-4', 'Maryland HQL', 'STEP_6_CERTIFIED'), mk('FIFS-5', 'Personal 1-on-1 Private Firearms Coaching', 'STEP_8_LICENSED'),
      mk('FIFS-6', 'Maryland Wear & Carry (CCW) Initial Course', 'STEP_3_PREPARATION'), mk('FIFS-7', 'Mid-Atlantic Multi-State Mastery', 'STEP_7_MSP_PORTAL'),
    ] }); const g = group(r, 'scoresheets');
    assert(g.count === 3 && g.items.map((x) => x.ref).sort().join() === 'FIFS-1,FIFS-2,FIFS-7' && g.action === 'roster', g.items.map((x) => x.ref).join());
  });

  await test('Permits: expired and the next 90 days, soonest first, with plain wording; no date or a date beyond 90 days is skipped, never guessed', () => {
    const r = A.buildAttention({ ...base, clients: [
      { client_id: 'C1', full_name: 'Expired Ed', expiration_date: daysFromNow(-3) }, { client_id: 'C2', full_name: 'Soon Sam', expiration_date: daysFromNow(12) }, { client_id: 'C3', full_name: 'Today Tia', expiration_date: daysFromNow(0) },
      { client_id: 'C4', full_name: 'Later Lee', expiration_date: daysFromNow(91) }, { client_id: 'C5', full_name: 'No Date', expiration_date: null }, { client_id: 'C6', full_name: 'Bad Date', expiration_date: 'soon' }, { client_id: 'C7', full_name: 'Edge Eli', expiration_date: daysFromNow(90) },
    ] }); const g = group(r, 'renewals');
    assert(g.items.map((x) => x.ref).join() === 'C1,C3,C2,C7', g.items.map((x) => x.ref).join());
    assert(g.items[0].detail === 'Permit expired 3 days ago' && g.items[0].tone === 'urgent' && g.items[1].detail === 'Permit expires today' && g.items[2].detail === 'Permit expires in 12 days' && g.items[2].tone === 'soon' && g.items[3].tone === 'info', JSON.stringify(g.items.map((x) => [x.detail, x.tone])));
  });

  await test('Waiting for confirmation: still at step 1 after 2 days, oldest first; confirmed or newer students are left out', () => {
    const r = A.buildAttention({ ...base, students: [{ student_id: 'S1', full_name: 'Old One', course: 'Maryland HQL', status: 'STEP_1_REGISTERED', created_at: hoursAgo(24 * 5) }, { student_id: 'S2', full_name: 'New One', course: 'Maryland HQL', status: 'STEP_1_REGISTERED', created_at: hoursAgo(5) }, { student_id: 'S3', full_name: 'Done One', course: 'Maryland HQL', status: 'STEP_2_CONFIRMED', created_at: hoursAgo(24 * 9) }, { student_id: 'S4', full_name: 'Older', course: 'Maryland HQL', status: 'STEP_1_REGISTERED', created_at: hoursAgo(24 * 8) }] });
    const g = group(r, 'confirm'); assert(g.items.map((x) => x.ref).join() === 'S4,S1' && /8 days ago/.test(g.items[0].detail), g.items.map((x) => x.ref).join());
  });

  await test('Unread chats show as one line with the count; zero shows nothing; lists are capped at 8 but the true count is kept', () => {
    assert(group(A.buildAttention({ ...base, unreadThreads: 3 }), 'chats').items[0].title === '3 conversations with new messages' && group(A.buildAttention({ ...base, unreadThreads: 1 }), 'chats').items[0].title === '1 conversation with new messages' && !group(A.buildAttention(base), 'chats'), 'chat wording');
    const many = Array.from({ length: 30 }, (_, i) => ({ invoice_number: 'INV-' + i, email: 'x' + i + '@x.test', course: 'Maryland HQL', status: 'DEPOSIT_PAID', balance_due: 10 + i, created_at: hoursAgo(60) }));
    const g = group(A.buildAttention({ ...base, invoices: many }), 'balance'); assert(g.count === 30 && g.items.length === 8, 'capped list, full count');
  });

  await test('Hostile or odd stored values are neutralised (control characters, very long text, missing fields) and nothing throws', () => {
    const r = A.buildAttention({ ...base, invoices: [{ invoice_number: 'INV-X\u0000\n' + 'Z'.repeat(200), email: 'e'.repeat(300) + '@x.test', course: null, status: 'DEPOSIT_PAID', balance_due: '12.345', created_at: null }], clients: [{ client_id: null, full_name: '<img src=x onerror=alert(1)>', expiration_date: daysFromNow(2) }, null === 1 ? null : {}], students: [{}, { student_id: 'S', status: 'STEP_1_REGISTERED', created_at: 'garbage' }] });
    const g = group(r, 'balance'); assert(g.items[0].ref.length <= 40 && !/[\u0000\n]/.test(g.items[0].ref) && g.items[0].detail.length < 200, 'values trimmed and cleaned'); assert(/\$12\.35|\$12\.34/.test(g.items[0].title), 'money rounded to cents: ' + g.items[0].title);
    assert(group(r, 'renewals').items[0].title === '<img src=x onerror=alert(1)>', 'text is returned as plain text (the page sets it with textContent)');
  });

  console.log('\n[needs attention: reading the data]');
  const fakeDb = (tables, failing = []) => ({ from: (t) => { const q = { _t: t, select: () => q, in: () => q, eq: () => q, neq: () => q, order: () => q, limit: () => q, then: (res, rej) => (failing.includes(t) ? res({ data: null, error: { message: 'boom: internal detail' } }) : res({ data: tables[t] || [], error: null })) }; return q; } });
  const tables = { invoices: [{ invoice_number: 'INV-1', email: 'a@x.test', course: 'Maryland HQL', status: 'DEPOSIT_PAID', balance_due: 50, created_at: hoursAgo(80) }], students: [{ student_id: 'FIFS-1', full_name: 'Sam', course: 'Maryland Wear & Carry (CCW) Initial Course', status: 'STEP_6_CERTIFIED', created_at: hoursAgo(500) }], clients: [{ client_id: 'C1', full_name: 'Cal', expiration_date: daysFromNow(10) }], student_scoresheets: [], messages: [{ thread_id: 't1', sender: 'visitor', status: 'UNREAD' }, { thread_id: 't1', sender: 'visitor', status: 'UNREAD' }, { thread_id: 't2', sender: 'instructor', status: 'UNREAD' }, { thread_id: 't3', sender: 'visitor', status: 'UNREAD' }] };
  await test('All sources readable: every group appears; two messages in one thread count once; the instructor\'s own messages are not "unread"', async () => {
    const r = await A.loadAttention(fakeDb(tables), NOW, 'GUEST'); assert(r.groups.map((g) => g.key).sort().join() === 'balance,chats,renewals,scoresheets' && group(r, 'chats').items[0].title.startsWith('2 conversations') && r.unavailable.length === 0 && r.total === 5, JSON.stringify(r.groups.map((g) => [g.key, g.count])));
  });
  await test('If score sheets cannot be read, that card is withheld (never "everyone is missing one") and the rest still shows; no error detail leaks', async () => {
    const r = await A.loadAttention(fakeDb(tables, ['student_scoresheets']), NOW); assert(!group(r, 'scoresheets') && !!group(r, 'balance') && r.unavailable.includes('scoresheets') && !/boom|internal/.test(JSON.stringify(r)), JSON.stringify(r));
  });
  await test('If one table fails the others still show and it is listed as unavailable; if everything fails the answer is an empty, honest list', async () => {
    const r = await A.loadAttention(fakeDb(tables, ['clients']), NOW); assert(!!group(r, 'balance') && !group(r, 'renewals') && r.unavailable.join() === 'renewals', JSON.stringify(r.unavailable));
    const all = await A.loadAttention(fakeDb(tables, ['invoices', 'students', 'clients', 'student_scoresheets', 'messages']), NOW); assert(all.total === 0 && all.unavailable.length >= 5, JSON.stringify(all.unavailable));
    const thrower = { from: () => { throw new Error('db down'); } }; const t = await A.loadAttention(thrower, NOW); assert(t.total === 0 && t.unavailable.length >= 5, 'a thrown error is contained');
  });
  await test('It is read only: the module never writes, sends or selects card details', () => {
    const SRC = R('src/Lib/server/admin-attention.ts'), CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); assert(!/\.(insert|update|upsert|delete)\(|fetch\(|rpc\(|stripe/i.test(CODE), 'no writes, network calls or Stripe');
    assert(/select\('invoice_number, email, course, status, balance_due, created_at'\)/.test(SRC), 'invoice columns are an explicit short list');
  });
  console.log('\n[needs attention: the panel]');
  const U = load('src/portal/adminAttention.ts'); const PAGE = R('src/app/page.tsx'), UI = R('src/portal/adminAttention.ts'), PCSS = R('src/portal/portal.css');
  await test('Panel wording and ordering helpers: clear headline, urgent beats soon beats info, and "+N more" only when the list was cut', () => {
    assert(U.headline(0) === 'All clear' && U.headline(1) === '1 thing needs you' && U.headline(7) === '7 things need you', 'headlines');
    const it = (tone) => ({ ref: 'x', title: 't', detail: 'd', tone });
    assert(U.worstTone([it('info'), it('urgent'), it('soon')]) === 'urgent' && U.worstTone([it('info'), it('soon')]) === 'soon' && U.worstTone([it('info')]) === 'info', 'tone ranking');
    assert(U.moreText({ count: 30, items: new Array(8).fill(it('info')), action: 'payments' }) === '+22 more' && U.moreText({ count: 3, items: new Array(3).fill(it('info')), action: 'roster' }) === '' && U.moreText({ count: 2, items: [it('urgent')], action: 'chat' }) === '', 'more text (and the chat card never claims hidden items)');
  });
  await test('Panel is safe and accessible by construction: text only, native expandable sections, 44px buttons, a status for empty and error, and nothing is written', () => {
    assert(!/innerHTML|insertAdjacentHTML|outerHTML/.test(UI), 'no HTML from stored data');
    assert(/createElement\(tag\)/.test(UI) && /'details'/.test(UI) && /'summary'/.test(UI) && /setAttribute\('role', 'status'\)/.test(UI) && /aria-busy/.test(UI) && /aria-label', 'Open: '/.test(UI), 'details/summary, status roles, busy state, descriptive button names');
    const calls = UI.match(/callFifsBackend\('[A-Za-z]+'/g) || []; assert(calls.length === 1 && calls[0] === "callFifsBackend('adminNeedsAttention'" && !/fetch\(|XMLHttpRequest/.test(UI), 'the only server call is the read-only list');
    assert(/\.an-refresh, \.an-open \{ min-height: 44px;/.test(PCSS) && /\.an-summary \{[^}]*min-height: 56px/.test(PCSS) && !/animation|transition/.test(PCSS.slice(PCSS.indexOf('/* Admin hub: "Needs attention"')).replace(/\/\*[\s\S]*?\*\//g, '')), '44px+ targets and no animation');
  });
  await test('Panel is in the hub, above the four tab cards, filled in once, and refreshes only when the hub is showing (not on a timer)', () => {
    assert(PAGE.indexOf('id="an-host"') > 0 && PAGE.indexOf('id="an-host"') < PAGE.indexOf('admin-intel-cards-container msp-intel-deck-grid'), 'placed above the tab cards');
    assert((PAGE.match(/installAdminAttention\(\);/g) || []).length === 1, 'installed once');
    assert(!/setInterval/.test(UI) && /MutationObserver/.test(UI) && /visibilitychange/.test(UI), 'no polling timer');
    assert(/Date\.now\(\) - lastAt > 120000/.test(UI), 'not more often than every 2 minutes on show');
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
