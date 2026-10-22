/**
 * TrainWithFIFS - waiver card and Admin Hub waiver records (offline; the database is a fake)
 * The student's card pulses red while the waiver is unsigned and disappears once it is signed. Staff can see who has signed and read one signed waiver; the list carries no waiver contents,
 * both calls are staff only, nothing is written, and everything from students is drawn as text.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const W = require(path.join(ROOT, 'src/Lib/server/waivers.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

const ROW = { student_id: 'FIFS-1', signed_name: 'Ada Lovelace', initials: 'AL', signature: 'Ada Lovelace', emergency_name: 'Bob', emergency_relation: 'Spouse', emergency_phone: '555-0100', phone: '555-0101', email: 'ada@example.com', under_18: false, waiver_version: '2026', signed_at: '2026-10-22T14:30:00Z' };
function fakeDb(o = {}) { const calls = []; return { calls, from: (t) => { const st = { t, writes: false }; const q = { select: (c) => { st.cols = c; return q; }, order: () => q, limit: (n) => { st.limit = n; return q; }, eq: (c, v) => { st.eq = [c, v]; return q; },
  maybeSingle: async () => { calls.push(st); return o.error ? { data: null, error: o.error } : { data: (o.rows || []).find((r) => !st.eq || String(r[st.eq[0]]) === String(st.eq[1])) || null, error: null }; },
  then: (res) => { calls.push(st); res(o.error ? { data: null, error: o.error } : { data: o.rows || [], error: null }); }, insert: () => { st.writes = true; return q; }, update: () => { st.writes = true; return q; }, upsert: () => { st.writes = true; return q; }, delete: () => { st.writes = true; return q; } }; return q; } }; }

(async () => {
  await test('the staff list has only name, date and version per student: no signature, initials, emergency contact, phone or email', async () => {
    const r = await W.listWaivers(fakeDb({ rows: [ROW] })); assert(r.ok && r.available, 'ok'); eq(Object.keys(r.waivers[0]).sort(), ['signedAt', 'signedName', 'studentId', 'version'], 'list fields');
    assert(!/signature|emergency|555-|@example/.test(JSON.stringify(r.waivers)), 'no private fields in the list');
  });
  await test('one waiver opens in full for staff, and a student with no waiver says so instead of failing', async () => {
    const r = await W.getWaiver(fakeDb({ rows: [ROW] }), 'FIFS-1'); assert(r.ok && r.waiver, 'found'); eq([r.waiver.signedName, r.waiver.initials, r.waiver.emergencyName, r.waiver.emergencyPhone, r.waiver.under18], ['Ada Lovelace', 'AL', 'Bob', '555-0100', false]);
    const none = await W.getWaiver(fakeDb({ rows: [ROW] }), 'FIFS-9'); assert(none.ok && none.waiver === null, 'not signed is not an error');
    const bad = await W.getWaiver(fakeDb(), '   '); assert(!bad.ok && bad.status === 400, 'blank id rejected');
  });
  await test('missing table means "not set up", a database error is a calm 503 with no raw error text, and neither call ever writes', async () => {
    const miss = await W.listWaivers(fakeDb({ error: { code: '42P01', message: 'relation "student_waivers" does not exist' } })); assert(miss.ok && miss.available === false && miss.waivers.length === 0, 'unavailable');
    const err = await W.listWaivers(fakeDb({ error: { code: 'XX', message: 'secret internal detail' } })); assert(!err.ok && err.status === 503 && !/secret/.test(err.message), 'calm error');
    const db = fakeDb({ rows: [ROW] }); await W.listWaivers(db); await W.getWaiver(db, 'FIFS-1'); assert(db.calls.length === 2 && db.calls.every((c) => !c.writes), 'read only');
  });
  await test('both actions are staff only on the server: the role is checked before the database client is created, and a non-staff caller gets 401', () => {
    const api = read('src/app/api/fifs/route.ts'); const at = api.indexOf("case 'adminWaiverList'"); assert(at > 0, 'cases exist'); const blk = api.slice(at, api.indexOf("case 'multiStateGet'", at));
    assert(/isStaffOrAdmin\(user\)/.test(blk) && /status: 401/.test(blk), 'staff check and 401'); assert(blk.indexOf('isStaffOrAdmin') < blk.indexOf('getPrivilegedClient'), 'check comes first'); assert(!/console\./.test(blk), 'nothing logged');
  });
  await test('the roster shows each student\'s waiver status, drawn as text only, and the window is a labelled, closable dialog', () => {
    const m = read('src/portal/adminWaivers.ts').replace(/\/\/.*$/gm, ''); assert(!/innerHTML|insertAdjacentHTML|dangerouslySetInnerHTML|document\.write/.test(m), 'text only'); assert(/role', 'dialog'/.test(m) && /aria-modal/.test(m) && /aria-labelledby/.test(m) && /Escape/.test(m), 'dialog');
    const page = read('src/app/page.tsx'); assert(/data-admin-waiver="\$\{escHtml\(s\.studentId \|\| ''\)\}"/.test(page), 'roster cell escaped'); assert(/installAdminWaivers\(\)/.test(page), 'installed');
    assert((m.match(/callFifsBackend\('([a-zA-Z]+)'/g) || []).every((c) => /adminWaiver(List|Get)/.test(c)), 'only the two read actions are called');
  });
  await test('NOT SIGNED is red, signed is green, actions are 44px with a visible focus ring', () => {
    const c = read('src/portal/adminWaivers.css'); assert(/\.fwv-no \{[^}]*#ff6b6b/.test(c) && /\.fwv-yes \{[^}]*#34d399/.test(c), 'colours'); assert(/\.fwv-view \{[^}]*min-height: 44px/.test(c) && /\.fwv-close \{[^}]*min-height: 48px/.test(c), 'targets'); assert(/:focus-visible \{ outline: 3px solid/.test(c), 'focus');
  });
  await test('the waiver card pulses RED while unsigned: a red glow animation on the card, no !important inside the keyframes, not green', () => {
    const c = read('src/portal/waiverCard.css'); const kf = /@keyframes waiverNeedsAttention \{([\s\S]*?)\n\}/.exec(c); assert(kf, 'keyframes'); assert(!/!important/.test(kf[1]), '!important is ignored in keyframes'); assert(/rgba\(239, 68, 68/.test(kf[1]) && !/16, 185, 129|10b981|34d399/.test(kf[1]), 'red, not green');
    assert(/#portalWaiverCard\.waiver-card-pending-blink \{ animation: waiverNeedsAttention [\d.]+s ease-in-out infinite !important; \}/.test(c), 'pending pulses'); assert(/box-shadow/.test(kf[1]) && !/border/.test(kf[1]) && !/transform|scale/.test(kf[1]), 'glow only, no resizing');
  });
  await test('a signed card disappears (display none, no animation), and reduced motion keeps a steady red ring instead of the pulse', () => {
    const c = read('src/portal/waiverCard.css'); assert(/#portalWaiverCard\.waiver-card-completed \{ display: none !important; animation: none !important; \}/.test(c), 'completed hidden'); const rm = c.slice(c.indexOf('prefers-reduced-motion')); assert(/animation: none !important; box-shadow: 0 0 0 4px rgba\(239, 68, 68/.test(rm), 'reduced motion');
    const lay = read('src/app/layout.tsx'); assert(lay.indexOf('waiverCard.css') > lay.indexOf('globals.css'), 'loads after the old rules');
  });
  await test('the signing flow still marks the card done (the card gets the completed class) and nothing about saving or the gate changed', () => {
    const s = read('public/scripts/TrainWithFIFS_scripts.js'); assert(/card\.classList\.remove\('waiver-card-pending-blink'\);\s*card\.classList\.add\('waiver-card-completed'\)/.test(s), 'class swap'); assert(/markWaiverCardComplete\?\.\(\)/.test(read('src/portal/waiverGate.ts')), 'gate marks it');
  });
  console.log(`\nWaiver card + admin records: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
