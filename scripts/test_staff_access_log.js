// Staff access log: records who opened waivers or sent reminders, never what a waiver says; never blocks the staff action; administrator-only to read; old entries cleared (offline).
const fs = require('fs'); const path = require('path'); const assert = require('assert');
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const L = require(path.join(ROOT, 'src/Lib/server/access-log.ts'));
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
const U = '11111111-1111-4111-8111-111111111111';
function db({ rows = [], error = null, insertThrows = false, deleteThrows = false } = {}) {
  const calls = { inserts: [], deletes: [] };
  return { calls, from: (t) => { assert.strictEqual(t, 'staff_access_log'); const q = { insert: async (v) => { if (insertThrows) throw new Error('down'); calls.inserts.push(v); return { error: null }; }, delete: () => ({ lt: async (c, v) => { if (deleteThrows) throw new Error('x'); calls.deletes.push([c, v]); return { error: null }; } }),
    select: () => q, order: () => q, limit: async (n) => { calls.limit = n; return error ? { data: null, error } : { data: rows, error: null }; } }; return q; } };
}
(async () => {
  console.log('\n[writing the log]');
  await test('one row per action with only who, which student, what and the outcome; text is cleaned and limited; a bad staff id is stored as none', async () => {
    const d = db(); await L.logStaffAccess(d, { staffId: U, staffLabel: 'kai@example.com\u0000\n', action: 'waiver_view', studentId: 'FIFS-4081', outcome: 'ok' });
    await L.logStaffAccess(d, { staffId: 'not-a-uuid', staffLabel: 'x'.repeat(500), action: 'waiver_list', outcome: 'ok' });
    assert.deepStrictEqual(Object.keys(d.calls.inserts[0]).sort(), ['action', 'outcome', 'staff_label', 'staff_user_id', 'student_id']);
    assert.strictEqual(d.calls.inserts[0].staff_user_id, U); assert.strictEqual(d.calls.inserts[0].staff_label, 'kai@example.com'); assert.strictEqual(d.calls.inserts[0].student_id, 'FIFS-4081');
    assert.strictEqual(d.calls.inserts[1].staff_user_id, null); assert.strictEqual(d.calls.inserts[1].staff_label.length, 120); assert.strictEqual(d.calls.inserts[1].student_id, null);
  });
  await test('an unknown action or a free-text outcome is never written (so nothing but fixed words can land in the table)', async () => {
    const d = db(); await L.logStaffAccess(d, { staffId: U, action: 'read_everything' }); await L.logStaffAccess(d, { staffId: U, action: 'waiver_view', outcome: 'Jane Doe signed on 2026-01-02' });
    assert.strictEqual(d.calls.inserts.length, 1); assert.strictEqual(d.calls.inserts[0].outcome, 'ok');
  });
  await test('if the log cannot be written the staff action is not affected (no error is thrown)', async () => { await L.logStaffAccess(db({ insertThrows: true }), { staffId: U, action: 'waiver_remind', studentId: 'S1', outcome: 'sent' }); });
  await test('outcome words come only from the result\'s shape, never from its contents', () => {
    const o = L.outcomeOf; assert.strictEqual(o({ ok: true, sent: true }), 'sent'); assert.strictEqual(o({ ok: true, sent: false, reason: 'signed' }), 'already_signed'); assert.strictEqual(o({ ok: true, sent: false, reason: 'recent' }), 'too_soon');
    assert.strictEqual(o({ ok: false, message: 'Jane Doe' }), 'failed'); assert.strictEqual(o({ ok: true, waiver: { signedName: 'Jane Doe' } }), 'ok'); assert.strictEqual(o(null), 'failed');
  });
  console.log('\n[reading the log]');
  await test('newest entries come back as plain text rows with a readable action, at most 200, and unknown actions are dropped', async () => {
    const d = db({ rows: [{ id: 'a', at: '2026-10-01T10:00:00Z', staff_label: 'kai@example.com', action: 'waiver_remind', student_id: 'S1', outcome: 'sent' }, { id: 'b', at: '2026-09-01T10:00:00Z', staff_label: null, action: 'bogus', student_id: null, outcome: 'ok' }, { id: 'c', at: '2026-08-01T10:00:00Z', staff_label: null, action: 'waiver_list', student_id: null, outcome: 'ok' }] });
    const r = await L.listAccessLog(d, new Date('2026-10-22T00:00:00Z')); assert(r.ok && r.available); assert.strictEqual(d.calls.limit, 200); assert.deepStrictEqual(r.entries.map((e) => e.id), ['a', 'c']);
    assert.strictEqual(r.entries[0].actionLabel, 'Sent a waiver reminder'); assert.strictEqual(r.entries[1].staff, 'staff'); assert.deepStrictEqual(Object.keys(r.entries[0]).sort(), ['action', 'actionLabel', 'at', 'id', 'outcome', 'staff', 'studentId']);
  });
  await test('entries older than 12 months are cleared when the log is read (cutoff is exactly 12 months back)', async () => {
    const d = db(); await L.listAccessLog(d, new Date('2026-10-22T00:00:00Z')); assert.deepStrictEqual(d.calls.deletes, [['at', '2025-10-22T00:00:00.000Z']]); await L.listAccessLog(db({ deleteThrows: true }));
  });
  await test('before the SQL is run it says so instead of failing; a real database error is a plain 503', async () => {
    const miss = await L.listAccessLog(db({ error: { code: '42P01', message: 'relation does not exist' } })); assert(miss.ok && miss.available === false && miss.entries.length === 0);
    const bad = await L.listAccessLog(db({ error: { code: 'XX', message: 'boom secret detail' } })); assert(!bad.ok && bad.status === 503 && !/boom|secret/.test(bad.message));
  });
  console.log('\n[the routes, the table and the screen]');
  await test('every waiver view, list and reminder is logged after it runs, with only ids and the outcome word; the log call carries no waiver data', () => {
    const r = read('src/app/api/fifs/route.ts'); const a = r.indexOf("case 'adminWaiverList':"), b = r.indexOf("case 'adminWaiverRemind':"), c = r.indexOf("case 'adminAccessLogList':");
    const strip = (t) => t.replace(/^\s*\/\/.*$/gm, ''); const view = strip(r.slice(a, b)), rem = strip(r.slice(b, c));
    assert(view.indexOf('getWaiver(sb') < view.indexOf('logStaffAccess(sb') && /action === 'adminWaiverList' \? 'waiver_list' : 'waiver_view'/.test(view), 'view/list logged after');
    assert(rem.indexOf('remindToSignWaiver(sbRemind') < rem.indexOf("logStaffAccess(sbRemind") && /action: 'waiver_remind'/.test(rem), 'reminder logged after');
    for (const call of [...r.slice(a, c).matchAll(/logStaffAccess\([^;]*;/g)].map((m) => m[0])) assert(!/\br\.(waiver|waivers|data)\b|signature|initials|emergency/i.test(call), 'log call carries waiver data: ' + call.slice(0, 80));
  });
  await test('only the administrator can read the log (the staff check is not enough), and it is checked before the database is touched; reading is the only thing offered', () => {
    const r = read('src/app/api/fifs/route.ts'); const a = r.indexOf("case 'adminAccessLogList':"); const seg = r.slice(a, r.indexOf('// Mid-Atlantic Multi-State', a));
    assert(/!isAdmin\(user\)/.test(seg) && !/isStaffOrAdmin/.test(seg), 'admin only'); assert(seg.indexOf('!isAdmin(user)') < seg.indexOf('getPrivilegedClient()'), 'checked first'); assert(!/insert\(|delete\(|update\(/.test(seg), 'read only');
    assert(!/adminAccessLog/.test(read('src/Lib/server/waivers.ts')));
  });
  await test('the SQL adds exactly one table, locked to the server only (row security on, nothing granted to the browser roles), with fixed action words and no free-text columns for waiver data', () => {
    const s = read('scripts/sql/20261030_staff_access_log.sql'); assert.strictEqual((s.match(/create table/gi) || []).length, 1); assert(/enable row level security/.test(s) && /revoke all on public\.staff_access_log from anon, authenticated/.test(s), 'locked');
    assert(!/create policy|grant /i.test(s), 'no policy or grant'); assert(/check \(action in \('waiver_list', 'waiver_view', 'waiver_remind'\)\)/.test(s), 'fixed actions'); assert(!/\b(drop|alter table public\.(?!staff_access_log))/i.test(s.replace(/--.*$/gm, '')), 'touches nothing else');
    for (const bad of ['signature', 'initials', 'emergency', 'phone', 'password', 'serial']) assert(!new RegExp('^\\s+' + bad, 'm').test(s), 'column ' + bad);
  });
  await test('the Admin Hub window is text only, reads through the server, closes with the button or Escape, and nothing in it is stored in the browser; the button and the mount exist', () => {
    const p = read('src/portal/AdminAccessLogPanel.tsx'); assert(!/dangerouslySetInnerHTML|innerHTML|localStorage|sessionStorage|document\.cookie/.test(p), 'text only, nothing stored'); assert(/callFifsBackend/.test(p) && /'adminAccessLogList'/.test(p) && /role="dialog"/.test(p) && /aria-modal="true"/.test(p) && /Escape/.test(p), 'dialog');
    assert(!/adminWaiver|studentId[^;]*waiver/i.test(p), 'never asks for waiver contents'); assert(/<AdminAccessLogPanel \/>/.test(read('src/app/layout.tsx')), 'mounted'); assert(/id="btn-admin-accesslog-hdr"/.test(read('src/app/page.tsx')) && /openAdminAccessLog/.test(read('src/app/page.tsx')), 'button');
  });
  console.log(`\nStaff access log: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
