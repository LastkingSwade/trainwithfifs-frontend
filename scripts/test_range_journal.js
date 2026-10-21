/**
 * TrainWithFIFS - private range journal for students and clients (offline; the database is a fake)
 * Each person reaches only their own rows; staff have no route to them; input is validated and capped; missing tables never crash; totals and the CSV export are exact.
 */
const fs = require('fs'); const path = require('path'); const Module = require('module');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const origLoad = Module._load;
Module._load = function (request, parent, ...rest) { if (request === './push' && parent && /portal-chat\.ts$/.test(parent.filename || '')) return { sendToUsers: async () => ({ sent: 0, failed: 0, removed: 0 }), notifyStaff: async () => ({ sent: 0, failed: 0, removed: 0 }) }; return origLoad.call(this, request, parent, ...rest); };
const J = require(path.join(ROOT, 'src/Lib/server/range-journal.ts')); const L = require(path.join(ROOT, 'src/portal/rangeLogic.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const NOW = new Date('2026-10-22T16:00:00Z');
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222', S = '33333333-3333-4333-8333-333333333333';

function fakeDb(t, o = {}) {
  const db = { t, n: 0 };
  db.from = (table) => {
    const f = []; let op = 'select', vals = null, ord = null, lim = null;
    const q = { select: () => q, eq: (c, v) => { f.push((r) => String(r[c]) === String(v)); return q; }, order: (c, d) => { ord = [c, d && d.ascending === false ? -1 : 1]; return q; }, limit: (n) => { lim = n; return q; },
      insert: (v) => { op = 'insert'; vals = v; return q; }, update: (v) => { op = 'update'; vals = v; return q; }, delete: () => { op = 'delete'; return q; } };
    const run = async () => {
      if (o.missing && o.missing.includes(table)) return { data: null, error: { code: '42P01', message: `relation "${table}" does not exist` } };
      const rows = db.t[table] || (db.t[table] = []);
      if (op === 'insert') { const row = { id: `00000000-0000-4000-8000-${String(++db.n).padStart(12, '0')}`, created_at: new Date().toISOString(), done_at: null, ...vals }; rows.push(row); return { data: row, error: null }; }
      if (op === 'update') { const hit = rows.filter((r) => f.every((g) => g(r))); hit.forEach((r) => Object.assign(r, vals)); return { data: hit.map((r) => ({ ...r })), error: null }; }
      if (op === 'delete') { db.t[table] = rows.filter((r) => !f.every((g) => g(r))); return { data: null, error: null }; }
      let hit = rows.filter((r) => f.every((g) => g(r))).map((r) => ({ ...r }));
      if (ord) hit.sort((a, b) => (a[ord[0]] < b[ord[0]] ? -1 : a[ord[0]] > b[ord[0]] ? 1 : 0) * ord[1]); if (lim !== null) hit = hit.slice(0, lim);
      return { data: hit, error: null };
    };
    q.maybeSingle = async () => { const r = await run(); if (r.error) return r; const d = Array.isArray(r.data) ? (r.data[0] || null) : (r.data || null); return { data: d, error: null }; };
    q.then = (res, rej) => run().then(res, rej); return q;
  };
  return db;
}
const base = (extra = {}) => ({ students: [{ user_id: A }], clients: [{ user_id: B }], range_sessions: [], range_goals: [], ...extra });
const ok = { on: '2026-10-20', range: "Cindy's Hot Shots", rounds: 100, focus: 'Accuracy', score: '23/25', notes: 'Good day' };

(async () => {
  console.log('\n[Input rules]');
  await test('a valid session is saved as typed; control characters are removed; empty optional fields become null; rounds default to 0', () => {
    const v = J.cleanSession({ ...ok, notes: 'line one\u0000\r\nline two\u0007' }, NOW); assert(v.ok, JSON.stringify(v)); eq(v.row, { session_on: '2026-10-20', range_name: "Cindy's Hot Shots", rounds: 100, focus: 'Accuracy', score_text: '23/25', notes: 'line one \nline two' });
    const min = J.cleanSession({ on: '2026-10-22' }, NOW); assert(min.ok); eq([min.row.rounds, min.row.range_name, min.row.focus, min.row.score_text, min.row.notes], [0, null, null, null, null]);
  });
  await test('bad dates, impossible dates, the future, bad round counts and over-long text are refused with a clear message', () => {
    for (const bad of [{ on: '' }, { on: 'yesterday' }, { on: '2026-02-30' }, { on: '2026-13-01' }, { on: '1980-01-01' }, { on: '2026-11-30' }, { ...ok, rounds: -1 }, { ...ok, rounds: 5001 }, { ...ok, rounds: 12.5 }, { ...ok, rounds: 'lots' }, { ...ok, range: 'x'.repeat(81) }, { ...ok, focus: 'x'.repeat(61) }, { ...ok, score: 'x'.repeat(41) }, { ...ok, notes: 'x'.repeat(1001) }]) { const v = J.cleanSession(bad, NOW); assert(!v.ok && v.message.length > 10, JSON.stringify(bad)); }
    assert(J.cleanSession({ ...ok, on: '2026-10-23' }, NOW).ok, 'tomorrow is allowed (timezones)'); assert(J.cleanSession({ ...ok, rounds: 5000, notes: 'x'.repeat(1000) }, NOW).ok, 'the limits themselves are fine');
  });

  console.log('\n[Only your own journal]');
  await test('each person lists only their own sessions and goals, a login that is not a student or client gets nothing, and staff have no way in', async () => {
    const db = fakeDb(base()); await J.addSession(db, A, ok, NOW); await J.addSession(db, B, { ...ok, notes: 'B private' }, NOW); await J.addGoal(db, A, { goal: 'A goal' });
    const a = await J.journalList(db, A), b = await J.journalList(db, B); eq(a.sessions.length, 1); eq(b.sessions.length, 1); assert(!JSON.stringify(a).includes('B private') && !JSON.stringify(b).includes('Good day'), 'no cross reading'); eq([a.goals.length, b.goals.length], [1, 0]);
    for (const r of [await J.journalList(db, S), await J.addSession(db, S, ok, NOW), await J.addGoal(db, S, { goal: 'x' }), await J.deleteAll(db, S)]) eq([r.ok, r.status], [false, 403]);
  });
  await test('nobody can delete, finish or wipe another person\'s items, and the answer is the same as for a missing item', async () => {
    const db = fakeDb(base()); const s = await J.addSession(db, A, ok, NOW); const g = await J.addGoal(db, A, { goal: 'Keep this' }); const ghost = '99999999-9999-4999-8999-999999999999';
    const d1 = await J.deleteSession(db, B, s.session.id), d2 = await J.deleteGoal(db, B, g.goal.id), d3 = await J.setGoalDone(db, B, g.goal.id, true), miss = await J.deleteSession(db, B, ghost);
    eq([d1.status, d2.status, d3.status], [404, 404, 404]); eq(d1.message, miss.message); eq([db.t.range_sessions.length, db.t.range_goals.length, db.t.range_goals[0].done_at], [1, 1, null], 'A\'s items are untouched');
    await J.addSession(db, B, ok, NOW); assert((await J.deleteAll(db, B)).ok && db.t.range_sessions.length === 1 && db.t.range_sessions[0].user_id === A && db.t.range_goals.length === 1, 'wiping B leaves A alone');
    eq((await J.deleteSession(db, A, 'not-a-uuid')).status, 400);
  });
  await test('the owner can finish a goal and un-finish it, delete a session, and delete everything', async () => {
    const db = fakeDb(base()); const s = await J.addSession(db, A, ok, NOW); const g = await J.addGoal(db, A, { goal: 'Do it', targetOn: '2026-12-31' });
    assert((await J.setGoalDone(db, A, g.goal.id, true, NOW)).ok && db.t.range_goals[0].done_at === NOW.toISOString(), 'finished'); assert((await J.setGoalDone(db, A, g.goal.id, false)).ok && db.t.range_goals[0].done_at === null, 'un-finished');
    assert((await J.deleteSession(db, A, s.session.id)).ok && db.t.range_sessions.length === 0, 'deleted'); await J.addSession(db, A, ok, NOW); assert((await J.deleteAll(db, A)).ok && db.t.range_sessions.length === 0 && db.t.range_goals.length === 0, 'all gone');
  });
  await test('goals: text up to 140 characters and a sensible target date only', async () => {
    const db = fakeDb(base()); for (const bad of [{ goal: '' }, { goal: '   ' }, { goal: 'x'.repeat(141) }, { goal: 'ok', targetOn: 'soon' }, { goal: 'ok', targetOn: '1999-01-01' }, { goal: 'ok', targetOn: '2101-01-01' }]) eq((await J.addGoal(db, A, bad)).status, 400, JSON.stringify(bad));
    assert((await J.addGoal(db, A, { goal: 'x'.repeat(140), targetOn: '2027-06-01' })).ok);
  });
  await test('the journal holds up to 1000 sessions and 50 goals, then asks the person to delete or export', async () => {
    const rows = Array.from({ length: 1000 }, (_, i) => ({ id: 's' + i, user_id: A, session_on: '2026-01-01', rounds: 1 })); const db = fakeDb(base({ range_sessions: rows }));
    const r = await J.addSession(db, A, ok, NOW); eq([r.ok, r.status], [false, 409]); assert(/Delete old ones or export/.test(r.message));
    const g = fakeDb(base({ range_goals: Array.from({ length: 50 }, (_, i) => ({ id: 'g' + i, user_id: A, goal: 'g' })) })); eq((await J.addGoal(g, A, { goal: 'one more' })).status, 409);
  });

  console.log('\n[When the tables are missing]');
  await test('before the SQL has been run the journal says it is not set up, and nothing crashes or is claimed saved', async () => {
    const db = fakeDb(base(), { missing: ['range_sessions', 'range_goals'] });
    const l = await J.journalList(db, A); assert(l.ok && l.available === false && l.sessions.length === 0, 'list is "unavailable"');
    for (const r of [await J.addSession(db, A, ok, NOW), await J.addGoal(db, A, { goal: 'x' }), await J.deleteAll(db, A)]) { assert(!r.ok && r.status === 503 && /not set up/.test(r.message), JSON.stringify(r)); }
  });

  console.log('\n[Totals, chart and export]');
  await test('totals count sessions, rounds, the average, the last day and this month\'s sessions', () => {
    const s = [{ on: '2026-10-20', rounds: 100 }, { on: '2026-10-02', rounds: 50 }, { on: '2026-09-15', rounds: 200 }]; const t = L.totals(s, NOW);
    eq(t, { sessions: 3, rounds: 350, avg: 117, last: '2026-10-20', thisMonth: 2 }); eq(L.totals([], NOW), { sessions: 0, rounds: 0, avg: 0, last: null, thisMonth: 0 });
  });
  await test('the monthly chart covers the last six months oldest first, includes empty months, and crosses a year boundary', () => {
    const s = [{ on: '2026-10-20', rounds: 100 }, { on: '2026-10-02', rounds: 50 }, { on: '2026-05-31', rounds: 999 }, { on: '2025-12-10', rounds: 77 }];
    const m = L.monthlySeries(s, NOW); eq(m.map((b) => b.label), ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']); eq(m.map((b) => b.rounds), [999, 0, 0, 0, 0, 150]); eq(m[5].sessions, 2);
    const y = L.monthlySeries([{ on: '2025-12-10', rounds: 77 }, { on: '2026-02-01', rounds: 5 }], new Date('2026-02-15T12:00:00')); eq(y.map((b) => b.key), ['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02']); eq([y[3].rounds, y[5].rounds], [77, 5]);
    eq([L.barPct(0, 100), L.barPct(1, 1000), L.barPct(50, 100), L.barPct(100, 100), L.barPct(5, 0)], [0, 4, 50, 100, 0]);
  });
  await test('the CSV export is complete, quotes commas and quotes, and cannot run as a spreadsheet formula', () => {
    const csv = L.toCsv([{ id: '1', on: '2026-10-20', range: 'Range, "North"', rounds: 100, focus: null, score: '=SUM(A1)', notes: 'line1\nline2' }], [{ id: 'g', goal: '+cmd', targetOn: '2026-12-31', doneAt: '2026-11-01T10:00:00Z' }]);
    assert(csv.includes('Sessions\nDate,Range,Rounds,Focus,Score,Notes\n') && csv.includes('2026-10-20,"Range, ""North""",100,,\'=SUM(A1),"line1\nline2"'), csv); assert(csv.includes("Goals\nGoal,Target date,Finished\n'+cmd,2026-12-31,2026-11-01"), 'goals');
    eq(L.csvCell('-5+3'), "'-5+3"); eq(L.csvCell('@x'), "'@x"); eq(L.csvCell(null), ''); eq(L.csvCell(7), '7');
  });
  await test('"today" is the person\'s own calendar day, so an evening session is not dated tomorrow', () => { eq(L.todayISO(new Date(2026, 9, 22, 21, 30)), '2026-10-22'); eq(L.todayISO(new Date(2026, 0, 1, 0, 5)), '2026-01-01'); });

  console.log('\n[Wiring and security]');
  await test('the route: the owner is always the verified login, only sign-in is needed (no staff path), saves are rate limited, and no request field names an owner', () => {
    const r = read('src/app/api/fifs/route.ts'); const i = r.indexOf("case 'journalList':"); const seg = r.slice(i, r.indexOf('// Website telemetry (staff only)', i));
    assert(/getAuthenticatedUser\(req\)/.test(seg) && /const uid = String\(user\.id\)/.test(seg) && /allowPublicSubmit\(req, 'journal', 60\)/.test(seg), 'login, owner, limit'); assert(!/payload\??\.(userId|user_id|ownerId|memberId)/.test(seg), 'no owner from the request');
    for (const a of ['journalList', 'journalAddSession', 'journalDeleteSession', 'journalAddGoal', 'journalSetGoal', 'journalDeleteGoal', 'journalDeleteAll']) assert(new RegExp(`case '${a}':`).test(seg), a); assert(!/isStaffOrAdmin|adminJournal/.test(seg), 'no staff route to journals');
    for (const f of walk('src')) { const s = read(f); if (/range_sessions|range_goals/.test(s)) assert(/range-journal\.ts$/.test(f), f + ' must not touch the journal tables directly'); }
  });
  await test('the screen: text only, the "no serial numbers or storage details" notice, private for you, export and delete with a confirmation, in the company colours with 44px controls and no animation', () => {
    const p = read('src/portal/RangeJournalPanel.tsx'), c = read('src/portal/rangeJournal.css').replace(/\/\*[\s\S]*?\*\//g, '');
    assert(!/innerHTML|dangerouslySetInnerHTML/.test(p), 'text only'); assert(/data-organic="skip"/.test(p), 'the design layer\'s glass film must not turn the panel see-through'); assert(/do not enter firearm serial numbers, where you store firearms, or home-security details/.test(p) && /Staff cannot see it/.test(p), 'notice and privacy');
    assert(/Yes, delete everything/.test(p) && /Delete your whole journal\? This cannot be undone\./.test(p) && /Export my journal \(CSV\)/.test(p) && /role="dialog"/.test(p) && /aria-modal="true"/.test(p) && /role="img"/.test(p) && /aria-live="polite"/.test(p), 'controls and accessibility');
    assert(/\.rj-close \{ min-width: 48px; min-height: 48px/.test(c) && /\.rj-ghost \{ min-width: 44px; min-height: 44px/.test(c) && /\.rj input\[type="text"\][^{]*\{ min-height: 44px[^}]*font-size: 16px/.test(c) && /#ffb703/.test(c) && /#00e5ff/.test(c), 'sizes and colours');
    assert(!/animation|transition|@keyframes/.test(c), 'no animation'); assert(/:focus-visible \{ outline: 3px solid #00e5ff/.test(c), 'focus');
  });
  await test('the journal card sits inside each signed-in dashboard (not beside a sign-in form), and the panel is mounted for every page', () => {
    const pg = read('src/app/page.tsx'); const stud = pg.indexOf('id="student-active-dashboard"'), cli = pg.indexOf('id="client-active-dashboard"');
    const sl = pg.indexOf('data-range-journal-launch="student"'), cl = pg.indexOf('data-range-journal-launch="client"'); assert(stud > 0 && sl > stud && cli > 0 && cl > cli, 'inside dashboards');
    assert(!/data-range-journal-launch/.test(pg.slice(pg.indexOf('id="student-login-box"'), stud)) && !/data-range-journal-launch/.test(pg.slice(pg.indexOf('id="client-auth-box"'), cli)), 'not in sign-in boxes');
    assert(/installRangeLauncher\(\)/.test(pg) && /<RangeJournalPanel \/>/.test(read('src/app/layout.tsx')), 'installed and mounted'); assert(!/innerHTML/.test(read('src/portal/rangeLauncher.ts')), 'launcher is text only');
  });
  await test('the tables: server only (row security on, no browser access), owned by a login and removed with it, with the same limits the server enforces', () => {
    const q = read('scripts/sql/20261027_range_journal.sql').replace(/--.*$/gm, '');
    assert(/enable row level security/.test(q) && (q.match(/revoke all on public\.range_(sessions|goals) from anon, authenticated/g) || []).length === 2 && (q.match(/to service_role/g) || []).length === 2, 'locked to the server');
    assert((q.match(/references auth\.users\(id\) on delete cascade/g) || []).length === 2, 'cascade'); assert(/rounds between 0 and 5000/.test(q) && /char_length\(notes\) <= 1000/.test(q) && /char_length\(goal\) between 1 and 140/.test(q), 'limits match');
    assert(!/serial|storage_location|make|model/i.test(q), 'no firearm details'); assert(!/NOT RUN YET/.test(read('scripts/sql/20261027_range_journal.sql')), 'the header no longer says it is waiting for approval');
  });
  function walk(d) { return fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [path.join(d, e.name)] : []); }

  console.log(`\nRange journal: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
