// Recently deleted (undo for delete student / client): the copy is complete before the delete, restore is safe, expiry and staff-only (offline).
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..');
const load = (rel) => { const m = { exports: {} }; vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, require, console, Date, Object, Array, String, Number, Math, Promise, JSON }); return m.exports; };
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
function memDb(seed, { failTables = [] } = {}) {
  const t = JSON.parse(JSON.stringify(seed)); let n = 0;
  return { t, from(table) { const f = []; let op = 'select', vals = null, ret = false;
    const q = { select: () => { if (op !== 'select') ret = true; return q; }, eq: (c, v) => { f.push((r) => r[c] === v); return q; }, is: (c, v) => { f.push((r) => (v === null ? r[c] == null : r[c] === v)); return q; }, lt: (c, v) => { f.push((r) => r[c] < v); return q; }, order: () => q, limit: () => q,
      insert: (v) => { op = 'insert'; vals = v; return q; }, update: (v) => { op = 'update'; vals = v; return q; }, delete: () => { op = 'delete'; return q; },
      maybeSingle: async () => { const hit = (t[table] || []).filter((r) => f.every((x) => x(r)))[0] || null; if (op === 'insert') { const r = await new Promise((res) => q.then(res)); return r.error ? r : { data: r.data ? r.data[0] : null, error: null }; } return { data: hit ? { ...hit } : null, error: null }; },
      then: (res) => { t[table] = t[table] || []; if (failTables.includes(table)) return res({ data: null, error: { code: 'x', message: 'boom' } });
        if (op === 'insert') { const rows = (Array.isArray(vals) ? vals : [vals]).map((r) => ({ id: `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`, created_at: new Date().toISOString(), ...r })); t[table].push(...rows); return res({ data: ret ? rows : null, error: null }); }
        const hit = t[table].filter((r) => f.every((x) => x(r))); if (op === 'update') { hit.forEach((r) => Object.assign(r, vals)); return res({ data: null, error: null }); }
        if (op === 'delete') { t[table] = t[table].filter((r) => !hit.includes(r)); return res({ data: null, error: null }); }
        return res({ data: hit.map((r) => ({ ...r })), error: null }); } };
    return q; } };
}
const UID = '11111111-1111-4111-8111-111111111111', SID = '22222222-2222-4222-8222-222222222222';
const seed = () => ({ students: [{ id: SID, student_id: 'FIFS-1001', email: 's@x.com', full_name: 'Sam Student', user_id: UID }], invoices: [{ id: 'i1', invoice_number: 'INV-1', student_id: 'FIFS-1001', total_amount: '100.00' }, { id: 'i2', invoice_number: 'INV-2', student_id: 'FIFS-2002' }], enrollments: [{ id: 'e1', user_id: UID, class_id: 'c1' }], messages: [{ id: 'm1', student_id: 'FIFS-1001', body: 'hi' }], clients: [], user_permits: [], admin_trash: [] });
(async () => {
  const tr = load('src/Lib/server/admin-trash.ts');
  console.log('\n[recently deleted]');
  await test('The copy holds the record and only THAT person\'s related rows, with a 30-day expiry', async () => {
    const db = memDb(seed()); const id = await tr.saveToTrash(db, 'student', db.t.students[0], 'Sam (FIFS-1001)', 'kai@x.com');
    const row = db.t.admin_trash[0];
    assert(id && row.kind === 'student' && row.bundle.students.length === 1 && row.bundle.invoices.length === 1 && row.bundle.invoices[0].invoice_number === 'INV-1' && row.bundle.enrollments.length === 1 && row.bundle.messages.length === 1, JSON.stringify(row.bundle));
    const days = (Date.parse(row.expires_at) - Date.now()) / 86400000; assert(days > 29.9 && days < 30.1);
  });
  await test('If the copy cannot be saved the answer is null (so the route can say undo is unavailable), never a half copy', async () => {
    assert(await tr.saveToTrash(memDb(seed(), { failTables: ['invoices'] }), 'student', seed().students[0], 'x', 'y') === null);
    assert(await tr.saveToTrash(memDb(seed(), { failTables: ['admin_trash'] }), 'student', seed().students[0], 'x', 'y') === null);
    assert(await tr.saveToTrash(memDb(seed()), 'student', null, 'x', 'y') === null);
  });
  await test('Restore puts back the record and its rows without the sign-in link, and cannot be done twice', async () => {
    const db = memDb(seed()); const id = await tr.saveToTrash(db, 'student', db.t.students[0], 'Sam', 'kai');
    db.t.students = []; db.t.invoices = db.t.invoices.filter((r) => r.student_id !== 'FIFS-1001'); db.t.enrollments = []; db.t.messages = [];
    const r = await tr.restoreFromTrash(db, id, 'kai'); assert(r.ok && r.restored.students === 1 && r.restored.invoices === 1 && r.restored.enrollments === 1 && r.restored.messages === 1 && /new invite/.test(r.note), JSON.stringify(r));
    assert(db.t.students[0].student_id === 'FIFS-1001' && db.t.students[0].user_id === null && db.t.enrollments[0].user_id === null, 'sign-in link must be cleared');
    const again = await tr.restoreFromTrash(db, id, 'kai'); assert(!again.ok && again.status === 404, 'second restore refused');
  });
  await test('Restore refuses when the same student, ID or email exists now, and changes nothing', async () => {
    const db = memDb(seed()); const id = await tr.saveToTrash(db, 'student', db.t.students[0], 'Sam', 'kai');
    const r = await tr.restoreFromTrash(db, id, 'kai'); assert(!r.ok && r.status === 409, JSON.stringify(r)); assert(db.t.students.length === 1 && db.t.admin_trash[0].restored_at == null);
    db.t.students = [{ id: 'other', student_id: 'FIFS-9', email: 's@x.com' }]; assert((await tr.restoreFromTrash(db, id, 'kai')).status === 409, 'same email');
  });
  await test('Expired items cannot be restored and are purged from the list; bad ids are refused', async () => {
    const db = memDb(seed()); const id = await tr.saveToTrash(db, 'student', db.t.students[0], 'Sam', 'kai'); db.t.students = [];
    db.t.admin_trash[0].expires_at = new Date(Date.now() - 1000).toISOString();
    assert((await tr.restoreFromTrash(db, id, 'kai')).status === 410);
    const l = await tr.listTrash(db); assert(l.ok && l.items.length === 0 && db.t.admin_trash.length === 0, 'purged');
    assert((await tr.restoreFromTrash(db, 'nope', 'k')).status === 400 && (await tr.restoreFromTrash(db, '33333333-3333-4333-8333-333333333333', 'k')).status === 404);
  });
  await test('The list shows labels and counts only (never the saved data); a missing table is a clear 503', async () => {
    const db = memDb(seed()); await tr.saveToTrash(db, 'student', db.t.students[0], 'Sam (FIFS-1001)', 'kai');
    const l = await tr.listTrash(db); assert(l.ok && l.items[0].label === 'Sam (FIFS-1001)' && l.items[0].counts.invoices === 1 && !JSON.stringify(l).includes('s@x.com') && !JSON.stringify(l).includes('hi'), JSON.stringify(l));
    const bad = await tr.listTrash(memDb(seed(), { failTables: ['admin_trash'] })); assert(!bad.ok && bad.status === 503);
  });
  await test('Clients restore with their permits; Route wiring: staff check first, copy taken BEFORE the delete, undo flag returned', async () => {
    const db = memDb({ ...seed(), clients: [{ id: 'cc', client_id: 'CLI-1', email: 'c@x.com', user_id: UID }], user_permits: [{ id: 'p1', client_id: 'CLI-1' }] });
    const id = await tr.saveToTrash(db, 'client', db.t.clients[0], 'Cat', 'kai'); db.t.clients = []; db.t.user_permits = [];
    const r = await tr.restoreFromTrash(db, id, 'kai'); assert(r.ok && r.restored.clients === 1 && r.restored.user_permits === 1);
    const ROUTE = fs.readFileSync(path.join(ROOT, 'src/app/api/fifs/route.ts'), 'utf8');
    const stu = ROUTE.slice(ROUTE.indexOf("case 'adminDeleteStudent':"), ROUTE.indexOf("case 'adminDeleteClient':")), cli = ROUTE.slice(ROUTE.indexOf("case 'adminDeleteClient':"), ROUTE.indexOf("case 'deletePermit':"));
    for (const [body, del] of [[stu, "supabase.from('invoices').delete()"], [cli, "supabase.from('user_permits').delete()"]]) assert(body.indexOf('isStaffOrAdmin(user)') < body.indexOf('saveToTrash(') && body.indexOf('saveToTrash(') < body.indexOf(del) && /undoAvailable: !!undoId/.test(body), 'copy before delete');
    const tb = ROUTE.slice(ROUTE.indexOf("case 'adminTrashList':"), ROUTE.indexOf("case 'adminPayments':")); assert(tb.indexOf('isStaffOrAdmin(user)') > 0 && tb.indexOf('isStaffOrAdmin(user)') < tb.indexOf('getPrivilegedClient()') && /status: 401/.test(tb));
    assert(/id="btn-admin-trash-hdr"/.test(fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf8')) && /AdminTrashPanel/.test(fs.readFileSync(path.join(ROOT, 'src/app/layout.tsx'), 'utf8')));
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
