/**
 * TrainWithFIFS - Admin Hub "Remind to sign" for the safety waiver (offline; the database is a fake)
 * One tap puts a short fixed note in that student's portal chat (and the usual generic phone alert when they have one). Staff only, only for students who have not signed, never twice in 24 hours,
 * nothing personal in the text, honest about what happened (phone alerted, held for the morning, or saved only), and nothing is claimed sent when it was not.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const W = require(path.join(ROOT, 'src/Lib/server/waivers.ts')); const UI = require(path.join(ROOT, 'src/portal/adminWaivers.ts')); const CHAT = require(path.join(ROOT, 'src/Lib/server/portal-chat.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const NOON = new Date('2026-10-22T16:00:00Z');        // 12:00 Eastern: inside the 8 am to 8 pm send window
const LATE = new Date('2026-10-23T03:00:00Z');        // 11 pm Eastern: outside it
const U1 = '11111111-1111-4111-8111-111111111111', U2 = '22222222-2222-4222-8222-222222222222';

function fakeDb(t, o = {}) {
  const db = { t, n: 0 };
  db.from = (table) => {
    const f = []; let op = 'select', vals = null, ord = null, lim = null;
    const q = { select: () => q, eq: (c, v) => { f.push((r) => String(r[c]) === String(v)); return q; }, like: (c, v) => { const pre = String(v).replace(/%$/, ''); f.push((r) => String(r[c]).startsWith(pre)); return q; }, gte: (c, v) => { f.push((r) => String(r[c]) >= String(v)); return q; },
      order: (c, d) => { ord = [c, d && d.ascending === false ? -1 : 1]; return q; }, limit: (n) => { lim = n; return q; }, insert: (v) => { op = 'insert'; vals = v; return q; }, update: (v) => { op = 'update'; vals = v; return q; }, delete: () => { op = 'delete'; return q; } };
    const run = async () => {
      if (o.missing && o.missing.includes(table)) return { data: null, error: { code: '42P01', message: `relation "${table}" does not exist` } };
      if (o.fail && o.fail.includes(table + ':' + op)) return { data: null, error: { code: 'XX', message: 'secret internal detail' } };
      const rows = db.t[table] || (db.t[table] = []);
      if (op === 'insert') { const row = { id: `00000000-0000-4000-8000-${String(++db.n).padStart(12, '0')}`, read_at: null, notified_at: null, ...vals }; rows.push(row); return { data: row, error: null }; }
      if (op === 'update') { const hit = rows.filter((r) => f.every((g) => g(r))); hit.forEach((r) => Object.assign(r, vals)); return { data: hit.map((r) => ({ ...r })), error: null }; }
      let hit = rows.filter((r) => f.every((g) => g(r))).map((r) => ({ ...r })); if (ord) hit.sort((a, b) => (a[ord[0]] < b[ord[0]] ? -1 : a[ord[0]] > b[ord[0]] ? 1 : 0) * ord[1]); if (lim !== null) hit = hit.slice(0, lim); return { data: hit, error: null };
    };
    q.maybeSingle = async () => { const r = await run(); if (r.error) return r; return { data: Array.isArray(r.data) ? (r.data[0] || null) : (r.data || null), error: null }; };
    q.then = (res, rej) => run().then(res, rej); return q;
  };
  return db;
}
const base = (extra = {}) => ({ students: [{ student_id: 'FIFS-1', user_id: U1 }, { student_id: 'FIFS-2', user_id: null }, { student_id: 'FIFS-3', user_id: U2 }], clients: [], student_waivers: [{ student_id: 'FIFS-3', signed_at: '2026-10-20T12:00:00Z' }], portal_messages: [], ...extra });

(async () => {
  await test('an unsigned student with a portal login gets the fixed reminder as a message from staff in their own chat, and the answer says it was sent', async () => {
    const db = fakeDb(base()); const r = await W.remindToSignWaiver(db, 'FIFS-1', NOON); eq([r.ok, r.sent], [true, true]); const m = db.t.portal_messages; eq(m.length, 1); eq([m[0].member_user_id, m[0].sender, m[0].body], [U1, 'staff', W.REMIND_TEXT]);
  });
  await test('the text is fixed and carries nothing personal: no name, email, phone, date or firearm detail; it fits the chat limit and names the waiver and where to complete it', () => {
    assert(W.REMIND_TEXT.startsWith(W.REMIND_PREFIX), 'starts with the marker'); assert(W.REMIND_TEXT.length <= CHAT.CHAT_MAX, 'fits'); assert(/waiver/i.test(W.REMIND_TEXT) && /Complete Digital Waiver/.test(W.REMIND_TEXT), 'says what to do');
    assert(!/@|\d{3}[-. ]?\d{4}|\$|firearm|gun|serial|store/i.test(W.REMIND_TEXT.replace('Student Portal', '')), 'nothing personal or sensitive');
    const textSrc = read('src/Lib/server/waivers.ts'); const decl = textSrc.slice(textSrc.indexOf('export const REMIND_TEXT'), textSrc.indexOf('export const REMIND_EVERY_MS')).replace('${REMIND_PREFIX}', ''); assert(!/\$\{|studentName|fullName|email/i.test(decl), 'no variables (other than the fixed marker) are put into the text');
  });
  await test('a student who has already signed gets no reminder, and the answer says so (so the owner is not misled)', async () => {
    const db = fakeDb(base()); const r = await W.remindToSignWaiver(db, 'FIFS-3', NOON); eq([r.ok, r.sent, r.reason], [true, false, 'signed']); eq(db.t.portal_messages.length, 0, 'nothing was written');
  });
  await test('pressing it again within 24 hours sends nothing more and says when the last one went; after 24 hours it can be sent again', async () => {
    const db = fakeDb(base()); await W.remindToSignWaiver(db, 'FIFS-1', NOON); const again = await W.remindToSignWaiver(db, 'FIFS-1', new Date(NOON.getTime() + 3600e3)); eq([again.ok, again.sent, again.reason], [true, false, 'recent']); assert(!!again.at, 'says when'); eq(db.t.portal_messages.length, 1, 'no second message');
    const next = await W.remindToSignWaiver(db, 'FIFS-1', new Date(NOON.getTime() + 25 * 3600e3)); eq([next.ok, next.sent], [true, true]); eq(db.t.portal_messages.length, 2, 'a new day, a new reminder');
  });
  await test('an ordinary chat message from the instructor does not count as a reminder (only the waiver reminder blocks a repeat), and one student\'s reminder never blocks another\'s', async () => {
    const db = fakeDb(base({ students: [{ student_id: 'FIFS-1', user_id: U1 }, { student_id: 'FIFS-4', user_id: U2 }], student_waivers: [], portal_messages: [{ member_user_id: U1, sender: 'staff', body: 'See you Saturday!', created_at: NOON.toISOString() }] }));
    eq((await W.remindToSignWaiver(db, 'FIFS-1', NOON)).sent, true, 'ordinary chat does not block'); eq((await W.remindToSignWaiver(db, 'FIFS-4', NOON)).sent, true, 'another student is independent');
  });
  await test('a student with no portal login, an unknown student, a blank choice and missing waiver records each get a clear refusal and nothing is written', async () => {
    const db = fakeDb(base()); const a = await W.remindToSignWaiver(db, 'FIFS-2', NOON); eq([a.ok, a.status], [false, 409]); assert(/portal login/.test(a.message), 'explains'); const b = await W.remindToSignWaiver(db, 'FIFS-99', NOON); eq([b.ok, b.status], [false, 404]); const c = await W.remindToSignWaiver(db, '  ', NOON); eq([c.ok, c.status], [false, 400]);
    const d = await W.remindToSignWaiver(fakeDb(base(), { missing: ['student_waivers'] }), 'FIFS-1', NOON); eq([d.ok, d.status], [false, 409]); eq(db.t.portal_messages.length, 0, 'nothing written');
  });
  await test('if the database fails at any step the owner is told nothing was sent, with no raw error text, and nothing is written', async () => {
    for (const fail of [['students:select'], ['portal_messages:select'], ['portal_messages:insert']]) { const db = fakeDb(base(), { fail }); const r = await W.remindToSignWaiver(db, 'FIFS-1', NOON); assert(!r.ok && r.status === 503 && !/secret/.test(r.message), fail.join() + ' -> ' + JSON.stringify(r)); eq(db.t.portal_messages.length, 0, 'nothing written for ' + fail.join()); }
  });
  await test('the answer is honest about the phone alert: with no phone alerts on, it says saved only; outside 8 am to 8 pm it says held for the morning; nothing says "notified" unless a device was reached', async () => {
    const db1 = fakeDb(base()); const r1 = await W.remindToSignWaiver(db1, 'FIFS-1', NOON); eq([r1.sent, r1.pushed, r1.held], [true, false, false]);
    const db2 = fakeDb(base()); const r2 = await W.remindToSignWaiver(db2, 'FIFS-1', LATE); eq([r2.sent, r2.pushed, r2.held], [true, false, true]);
    assert(/phone was notified/.test(UI.remindMessage({ success: true, sent: true, pushed: true, held: false }).text), 'pushed says notified'); for (const r of [r1, r2]) assert(!/phone was notified/.test(UI.remindMessage({ success: true, ...r }).text), 'not claimed when no device was reached');
    assert(/morning/.test(UI.remindMessage({ success: true, sent: true, pushed: false, held: true }).text) && /not turned on phone alerts/.test(UI.remindMessage({ success: true, sent: true, pushed: false, held: false }).text), 'plain reasons');
  });
  await test('the phone alert stays the generic one (it says there is a message, never what it says), so the reminder text itself is never in a notification', () => {
    const p = CHAT.chatPayload('student'); assert(p.body === 'Open your portal to read it.' && !p.body.includes('waiver') && !p.title.includes('waiver'), 'generic alert'); assert(/staffSend\(supabase, String\(student\.user_id\), REMIND_TEXT, now\)/.test(code('src/Lib/server/waivers.ts')), 'uses the chat send, not a custom push');
  });
  await test('the route is staff only (the role is checked before the database is touched), rate limited, takes only a student id from the request, and writes nothing else', () => {
    const api = read('src/app/api/fifs/route.ts'); const at = api.indexOf("case 'adminWaiverRemind'"); assert(at > 0, 'case exists'); const blk = api.slice(at, api.indexOf("case 'multiStateGet'", at) > 0 ? api.indexOf('// Mid-Atlantic Multi-State', at) : at + 1500);
    assert(/isStaffOrAdmin\(user\)/.test(blk) && /status: 401/.test(blk) && blk.indexOf('isStaffOrAdmin') < blk.indexOf('getPrivilegedClient'), 'staff check first'); assert(/allowPublicSubmit\(req, 'waiverRemind'/.test(blk) && /429/.test(blk), 'rate limited'); assert(/payload\?\.studentId/.test(blk) && !/payload\?\.(userId|text|message|body|email)/.test(blk), 'only a student id comes from the request'); assert(!/console\./.test(blk), 'nothing logged');
  });
  await test('the button shows only beside NOT SIGNED, is at least 44px with a visible focus ring, announces its result, and the owner sees one of: sent, saved, held, already signed, already reminded, or the error', () => {
    const m = code('src/portal/adminWaivers.ts'); const notSigned = m.slice(m.indexOf("'✍️ Waiver: NOT SIGNED'"), m.indexOf("host.append(el('span', 'fwv-yes'")); assert(/Remind to sign/.test(notSigned) && /adminWaiverRemind/.test(m), 'beside NOT SIGNED'); assert(!/Remind to sign/.test(m.slice(m.indexOf("host.append(el('span', 'fwv-yes'"), m.indexOf('function row('))), 'not shown for signed students');
    assert(/role', 'status'\)[^;]*;[^;]*aria-live', 'polite'/.test(notSigned) || (/setAttribute\('role', 'status'\)/.test(notSigned) && /aria-live', 'polite'/.test(notSigned)), 'announced'); assert(/btn\.disabled = true; say\.textContent = 'Sending…'/.test(m) && /btn\.disabled = out\.done/.test(m), 'no double press; stays off once done');
    assert(!/innerHTML|insertAdjacentHTML/.test(m), 'text only'); const css = read('src/portal/adminWaivers.css'); assert(/\.fwv-view \{[^}]*min-height: 44px/.test(css) && /\.fwv-remind \{/.test(css) && /:focus-visible \{ outline: 3px solid/.test(css), '44px and focus'); assert(/\.fwv-remind:disabled \{ opacity: 0\.55/.test(css), 'a sent button looks done');
    eq(UI.remindMessage({ success: true, sent: false, reason: 'signed' }).refresh, true); assert(/already sent/.test(UI.remindMessage({ success: true, sent: false, reason: 'recent', at: '2026-10-22T16:00:00Z' }).text), 'recent'); eq(UI.remindMessage({ success: false, error: 'No portal login yet.' }).text, 'No portal login yet.'); eq(UI.remindMessage({ success: false, error: 'x' }).done, false, 'an error leaves the button usable');
  });
  console.log(`\nWaiver reminder: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
