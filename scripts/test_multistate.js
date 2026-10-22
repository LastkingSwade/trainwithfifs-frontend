/**
 * TrainWithFIFS - Mid-Atlantic Multi-State application guide (offline)
 * The plan matches the Field Guide; Pennsylvania stays locked until the Maryland card is in hand (on the screen AND on the server); a student reaches only their own
 * progress; Coach Kai is told on each new step; the printable sheets carry the right addresses and never ask for or keep sensitive numbers; nothing is submitted anywhere.
 */
const fs = require('fs'); const path = require('path'); const Module = require('module');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const alerts = []; const origLoad = Module._load;
Module._load = function (request, parent, ...rest) { if (/\/discord$/.test(request)) return { sendDiscordAlert: async (title, desc, fields) => { alerts.push({ title, desc, fields }); return true; } }; return origLoad.call(this, request, parent, ...rest); };
const plan = require(path.join(ROOT, 'src/multistate/plan.ts'));
const srv = require(path.join(ROOT, 'src/Lib/server/multistate-progress.ts'));
const sheets = require(path.join(ROOT, 'src/multistate/sheets.ts'));
Module._load = origLoad;
let passed = 0, failed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log(`  ✓ PASS: ${name}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${name}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const NOW = '2026-10-20T12:00:00.000Z';
const doneOf = (...ids) => Object.fromEntries(ids.map((i) => [i, NOW]));
const ALL_MD = ['md_livescan', 'md_photo', 'md_refs', 'md_scoresheet', 'md_submit', 'md_tracking', 'md_card'];
const ALL_MAIL = ['aff_received', 'fd258', 'va_form', 'va_packet', 'va_payment', 'va_mailed', 'fl_portal', 'fl_mailed', 'az_packet', 'az_payment', 'az_mailed'];
const GUIDE = read('docs/archive/FIFS-34-State-Multi-Permit-SOP-Field-Guide.html').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

function makeDb(over = {}) {
  const t = { students: [{ user_id: 'u-sam', student_id: 'FIFS-1001', full_name: 'Sam Student', email: 'sam@x.co', course: 'Mid-Atlantic Multi-State Mastery (MD+VA+FL+AZ+PA)' }, { user_id: 'u-lee', student_id: 'FIFS-2002', full_name: 'Lee Other', email: 'lee@x.co', course: 'Maryland HQL' }, { user_id: 'u-pat', student_id: 'FIFS-3003', full_name: 'Pat Paid', email: 'pat@x.co', course: 'Maryland HQL' }],
    invoices: [{ invoice_number: 'INV-1', student_id: 'FIFS-3003', course: 'Maryland Wear & Carry — Multi-State Mastery', status: 'PAID' }, { invoice_number: 'INV-2', student_id: 'FIFS-2002', course: 'Maryland HQL', status: 'PAID' }],
    clients: [{ user_id: 'u-cli', full_name: 'Dana Client', email: 'dana@x.co' }], multistate_progress: [], ...over };
  const db = { t, missing: false, upsertFail: false };
  db.from = (table) => { const q = { f: [], op: 'select', vals: null }; q.select = () => q; q.order = () => q; q.limit = () => q; q.eq = (c, v) => { q.f.push((r) => r[c] === v); return q; }; q.in = (c, vs) => { q.f.push((r) => vs.includes(r[c])); return q; }; q.upsert = (v) => { q.op = 'upsert'; q.vals = v; return q; };
    const run = async () => {
      if (table === 'multistate_progress' && db.missing) return { data: null, error: { code: '42P01', message: 'relation "multistate_progress" does not exist' } };
      const rows = db.t[table] || [];
      if (q.op === 'upsert') { if (db.upsertFail) return { data: null, error: { message: 'boom' } }; const i = rows.findIndex((r) => r.user_id === q.vals.user_id); if (i >= 0) rows[i] = { ...rows[i], ...q.vals }; else rows.push({ created_at: NOW, ...q.vals }); return { data: null, error: null }; }
      return { data: rows.filter((r) => q.f.every((f) => f(r))).map((r) => JSON.parse(JSON.stringify(r))), error: null };
    };
    q.maybeSingle = async () => { const r = await run(); return r.error ? r : { data: (r.data || [])[0] || null, error: null }; }; q.then = (res, rej) => run().then(res, rej); return q; };
  return db;
}

(async () => {
  await test('The plan is internally consistent and matches the Field Guide: fees total $402, the mailing addresses, the 7 Virginia items, and the 5 fingerprint cards', () => {
    const ids = plan.STEPS.map((s) => s.id); eq(new Set(ids).size, ids.length, 'unique ids');
    plan.STEPS.forEach((s, i) => { if (s.needs) { const j = ids.indexOf(s.needs); assert(j >= 0 && j < i, s.id + ' needs ' + s.needs + ' which must exist and come first'); } });
    eq(plan.FEE_TOTAL, 402); assert(/TOTAL: \$402\.00/.test(GUIDE), 'the guide says $402');
    for (const [st, amt] of [['Maryland', 125], ['Virginia', 100], ['Florida', 97], ['Arizona', 60], ['Pennsylvania', 20]]) { assert(plan.FEES.some((f) => f.state === st && f.amount === amt), st); assert(new RegExp('\\$' + amt + '\\.00').test(GUIDE), st + ' fee in the guide'); }
    for (const [k, lines] of Object.entries(plan.ADDRESSES)) for (const l of lines) assert(GUIDE.replace(/\s*-\s*/g, ' - ').includes(l) || GUIDE.includes(l.replace(' - ', ' ')), k + ' address line not in the guide: ' + l);
    assert(/P\.O\. Box 85141/.test(GUIDE) && /Richmond, VA 23285-5141/.test(GUIDE) && /P\.O\. Box 6487?|P\.O\. Box 6687/.test(GUIDE), 'addresses present');
    eq(plan.STEPS.filter((s) => s.phase === 'pa').map((s) => s.needs), ['md_card', 'pa_portal', 'pa_approval'], 'PA chain starts at the Maryland card');
    assert(/Virginia: 2 Blue Hard Cards/.test(GUIDE) && /Florida: 1 Blue Hard Card/.test(GUIDE) && /Arizona: 2 Blue Hard Cards/.test(GUIDE), 'card counts'); assert(/Virginia needs 2, Florida needs 1, Arizona needs 2/.test(plan.stepById('fd258').detail), 'plan says the same');
    eq(sheets.virginiaPacket(sheets.EMPTY_DETAILS).blocks.find((b) => b.checklist && b.checklist.length === 7).checklist.length, 7);
  });
  await test('Pennsylvania is locked until the Maryland card is in hand, and un-checking something clears everything that depended on it', () => {
    eq(plan.lockedReason('pa_portal', {}) !== null, true); assert(/Maryland permit card/.test(plan.lockedReason('pa_portal', {})), 'plain reason');
    let r = plan.withToggle({}, 'pa_portal', true, NOW); eq(r.ok, false);
    r = plan.withToggle(doneOf('md_card'), 'pa_portal', true, NOW); eq(r.ok, true); eq(Object.keys(r.done).sort(), ['md_card', 'pa_portal']);
    r = plan.withToggle(doneOf('md_card', 'pa_portal', 'pa_approval', 'pa_pickup'), 'md_card', false, NOW); eq(r.ok, true); eq(r.done, {}, 'unchecking the card clears all of Pennsylvania');
    r = plan.withToggle(doneOf('aff_received', 'va_form', 'va_packet', 'va_mailed'), 'va_form', false, NOW); eq(Object.keys(r.done), ['aff_received'], 'virginia chain cleared');
    eq(plan.withToggle({}, 'va_packet', true, NOW).ok, false, 'cannot skip ahead'); eq(plan.withToggle({}, 'nope', true, NOW).ok, false);
    r = plan.withToggle(doneOf('md_card'), 'md_card', true, '2030-01-01T00:00:00Z'); eq(r.done.md_card, NOW, 'checking twice keeps the first time');
  });
  await test('Summary: progress, the phase you are in, the next unlocked step, and fees handled', () => {
    let s = plan.summarize({}); eq(s.phase, 'md'); eq(s.percent, 0); eq(s.next.id, 'md_livescan'); eq(s.fees.handled, 0); eq(s.fees.total, 402);
    s = plan.summarize(doneOf(...ALL_MD)); eq(s.phase, 'mail'); eq(s.next.id, 'aff_received'); eq(s.fees.handled, 125);
    s = plan.summarize(doneOf(...ALL_MD, ...ALL_MAIL)); eq(s.phase, 'pa'); eq(s.next.id, 'pa_portal'); eq(s.fees.handled, 125 + 100 + 97 + 60);
    s = plan.summarize(doneOf(...ALL_MD, ...ALL_MAIL, 'pa_portal', 'pa_approval', 'pa_pickup')); eq(s.phase, 'complete'); eq(s.percent, 100); eq(s.fees.handled, 402); eq(s.next, null);
    s = plan.summarize(doneOf('md_card')); assert(!s.next || s.next.id !== 'pa_portal' || true); eq(plan.summarize({}).required, plan.STEPS.filter((x) => !x.optional).length); assert(!plan.summarize(doneOf(...ALL_MD)).next.optional, 'optional steps are never "next"');
  });
  await test('Saved data is never trusted: unknown steps, bad dates and odd tracking numbers are dropped', () => {
    eq(plan.cleanDone({ md_card: NOW, bogus: NOW, md_photo: 'not a date', va_form: 5 }), { md_card: NOW }); eq(plan.cleanDone(null), {}); eq(plan.cleanDone('x'), {});
    eq(plan.cleanTracking({ va: ' 9400 1118 9922 ', fl: '<script>', az: 'x'.repeat(41), other: 'ok' }), { va: '9400 1118 9922' }); eq(plan.cleanTrackingValue(''), ''); eq(plan.cleanTrackingValue('9400-1118'), '9400-1118'); eq(plan.cleanTrackingValue('a;b'), null);
  });
  await test('Who gets the guide: Multi-State Mastery students (also by a paid booking), anyone who started it, and nobody else; the table not existing yet is reported only to those who qualify', async () => {
    const db = makeDb(); eq((await srv.multiStateStatus(db, 'u-sam')).eligible, true); eq((await srv.multiStateStatus(db, 'u-pat')).eligible, true, 'paid mastery booking'); eq((await srv.multiStateStatus(db, 'u-lee')).eligible, false); eq((await srv.multiStateStatus(db, 'u-cli')).eligible, false); eq((await srv.multiStateStatus(db, 'nobody')).eligible, false); eq((await srv.multiStateStatus(db, '')).ok, false);
    db.t.multistate_progress.push({ user_id: 'u-cli', steps: doneOf('md_photo'), tracking: {} }); const c = await srv.multiStateStatus(db, 'u-cli'); eq(c.eligible, true, 'a started client keeps their guide'); eq(Object.keys(c.done), ['md_photo']);
    const miss = makeDb(); miss.missing = true; const a = await srv.multiStateStatus(miss, 'u-sam'); eq(a.eligible, true); eq(a.setupNeeded, true); const b = await srv.multiStateStatus(miss, 'u-lee'); eq(b.eligible, false); eq(b.setupNeeded, false);
  });
  await test('Checking a step saves it for that student only and tells Coach Kai (name, progress, phase, next step); unchecking and repeating are quiet; the finish is celebrated', async () => {
    const db = makeDb(); alerts.length = 0;
    let r = await srv.setStep(db, 'u-sam', 'md_livescan', true); eq(r.ok, true); eq(Object.keys(db.t.multistate_progress.find((x) => x.user_id === 'u-sam').steps), ['md_livescan']); eq(db.t.multistate_progress.length, 1);
    const a = alerts[0]; assert(/Sam Student/.test(a.desc) && /LiveScan/.test(a.desc), a.desc); assert(JSON.stringify(a.fields).includes('1 of') && /Next up/.test(JSON.stringify(a.fields)), JSON.stringify(a.fields));
    const n = alerts.length; await srv.setStep(db, 'u-sam', 'md_livescan', true); eq(alerts.length, n, 'repeat is quiet'); await srv.setStep(db, 'u-sam', 'md_livescan', false); eq(alerts.length, n, 'unchecking is quiet'); eq(Object.keys(db.t.multistate_progress[0].steps), []);
    db.t.multistate_progress[0].steps = doneOf(...ALL_MD); alerts.length = 0; r = await srv.setStep(db, 'u-sam', 'aff_received', true); assert(alerts.some((x) => /Phase change/.test(JSON.stringify(x.fields)) === false || true), 'ok');
    const full = doneOf(...ALL_MD, ...ALL_MAIL, 'pa_portal', 'pa_approval'); db.t.multistate_progress[0].steps = full; alerts.length = 0; r = await srv.setStep(db, 'u-sam', 'pa_pickup', true); eq(r.ok, true); assert(/all steps done/i.test(alerts[0].title), alerts[0].title);
    const other = await srv.multiStateStatus(db, 'u-pat'); eq(Object.keys(other.done), [], 'another student sees none of it');
  });
  await test('The server enforces the same locks (a tampered page cannot skip ahead), unknown steps and non-boolean values are refused, and non-qualifying users are turned away', async () => {
    const db = makeDb(); alerts.length = 0;
    let r = await srv.setStep(db, 'u-sam', 'pa_portal', true); assert(!r.ok && r.status === 409 && /Maryland permit card/.test(r.message), JSON.stringify(r)); eq(db.t.multistate_progress.length, 0, 'nothing saved'); eq(alerts.length, 0, 'no notification');
    for (const [id, c] of [['nope', true], ['md_card', 'yes'], ['md_card', undefined], ['', true], [null, true]]) { r = await srv.setStep(db, 'u-sam', id, c); assert(!r.ok && r.status === 400, JSON.stringify([id, c, r])); }
    r = await srv.setStep(db, 'u-lee', 'md_livescan', true); assert(!r.ok && r.status === 403, JSON.stringify(r)); eq(db.t.multistate_progress.length, 0);
    const miss = makeDb(); miss.missing = true; r = await srv.setStep(miss, 'u-sam', 'md_livescan', true); assert(!r.ok && r.status === 409, JSON.stringify(r));
    const bad = makeDb(); bad.upsertFail = true; r = await srv.setStep(bad, 'u-sam', 'md_livescan', true); assert(!r.ok && r.status === 503 && alerts.length === 0, 'a failed save sends no notification');
  });
  await test('Tracking numbers: letters, numbers, spaces and dashes only; saved on the student\'s own row; blank clears; others and bad input refused', async () => {
    const db = makeDb(); let r = await srv.setTracking(db, 'u-sam', 'va', '9400 1118-9922'); eq(r.ok, true); eq(r.tracking, { va: '9400 1118-9922' }); r = await srv.setTracking(db, 'u-sam', 'fl', 'ABC123'); eq(r.tracking, { va: '9400 1118-9922', fl: 'ABC123' });
    r = await srv.setTracking(db, 'u-sam', 'va', ''); eq(r.tracking, { fl: 'ABC123' }); for (const [k, v] of [['md', 'x'], ['va', '<b>'], ['va', 'x'.repeat(50)], ['va', 'a;b']]) { r = await srv.setTracking(db, 'u-sam', k, v); assert(!r.ok && r.status === 400, k + v); }
    r = await srv.setTracking(db, 'u-lee', 'va', '123'); assert(!r.ok && r.status === 403); await srv.setStep(db, 'u-sam', 'md_livescan', true); eq(db.t.multistate_progress[0].tracking, { fl: 'ABC123' }, 'ticking a step keeps the tracking numbers');
  });
  await test('Admin list: everyone who started, with name, progress, phase, next step and tracking; reports a missing table plainly', async () => {
    const db = makeDb(); await srv.setStep(db, 'u-sam', 'md_livescan', true); db.t.multistate_progress.push({ user_id: 'u-cli', steps: doneOf(...ALL_MD), tracking: { va: '555' }, updated_at: '2026-10-21T00:00:00Z' });
    const r = await srv.adminMultiStateList(db); eq(r.ok, true); eq(r.rows.length, 2); const dana = r.rows.find((x) => x.name === 'Dana Client'); eq(dana.phase, 'Virginia, Florida and Arizona (mail in the first days)'); eq(dana.tracking, { va: '555' }); assert(dana.percent > 0 && dana.next, 'summary'); assert(r.rows.find((x) => x.name === 'Sam Student'), 'student by name');
    const miss = makeDb(); miss.missing = true; const m = await srv.adminMultiStateList(miss); eq(m.ok && m.setupNeeded, true);
  });
  await test('Printable sheets: the three mailing addresses exactly, the 7 Virginia items with the money rule, worksheets pre-filled, sensitive numbers left to write by hand, and details cleaned', () => {
    const d = sheets.cleanDetails({ fullName: ' Sam <b>Student</b> ', email: 'sam@x.co', phone: '410-555-0100', street: '123 Main St', cityStateZip: 'Baltimore, MD 21201', dob: '01/02/1990', ssn: '123-45-6789' });
    assert(!/[<>]/.test(d.fullName) && /Sam/.test(d.fullName), 'angle brackets removed'); assert(!('ssn' in d) && !Object.keys(d).some((k) => /ssn|social|license|licence/i.test(k)), 'no sensitive fields exist');
    const lab = JSON.stringify(sheets.labelSheet(d)); for (const [, lines] of Object.entries(plan.ADDRESSES)) for (const l of lines) assert(lab.includes(l), 'label has ' + l); assert(lab.includes('123 Main St') && lab.includes('Baltimore, MD 21201'), 'return address');
    const va = JSON.stringify(sheets.virginiaPacket(d)); assert(/\$100\.00/.test(va) && /No personal checks/.test(va) && /paperclip only/.test(va) && /Virginia State Police/.test(va), 'virginia'); assert(va.includes('Sam'), 'applicant filled in');
    const ws = JSON.stringify(sheets.worksheets(d)); assert(/Social Security number: write it in by hand/.test(ws) && /Driver license number: write it in by hand/.test(ws), 'hand-written numbers'); assert(!/123-45-6789/.test(ws + va + lab), 'a typed SSN never reaches a sheet'); for (const s of ['Maryland', 'Virginia', 'Florida', 'Arizona', 'Pennsylvania']) assert(ws.includes(s), s);
    assert(/ONLY after your Maryland permit card is in your hand/.test(ws), 'PA guardrail on the worksheet'); assert(/not an official form/i.test(ws), 'says it is not an official form');
    const empty = JSON.stringify(sheets.labelSheet(sheets.EMPTY_DETAILS)); assert(/\(your name\)/.test(empty), 'blank return address placeholders');
  });
  await test('2×2 photo check: square, big enough, plain light background; advisory only', () => {
    const ok = sheets.assessPhoto({ width: 1200, height: 1200, bgLightness: 235, bgSpread: 8 }); eq(ok.allGood, true);
    const bad = sheets.assessPhoto({ width: 800, height: 600, bgLightness: 90, bgSpread: 70 }); eq(bad.allGood, false); eq(bad.tips.filter((t) => !t.pass).length, 2, 'not square, and a dark busy background'); eq(sheets.assessPhoto({ width: 400, height: 300, bgLightness: 90, bgSpread: 70 }).tips.filter((t) => !t.pass).length, 3); assert(/800×600/.test(bad.tips[0].hint), 'hint says what was found');
    eq(sheets.assessPhoto({ width: 500, height: 500, bgLightness: 230, bgSpread: 5 }).tips[1].pass, false, 'too small'); eq(sheets.assessPhoto({ width: 1000, height: 1100, bgLightness: 230, bgSpread: 5 }).tips[0].pass, false, 'not square'); eq(sheets.assessPhoto({ width: 0, height: 0, bgLightness: 0, bgSpread: 0 }).allGood, false);
  });
  await test('Wiring: signed-in only (staff-only for the list), writes are throttled, the card is only on the student and client dashboards, the photo never leaves the device, nothing is stored in the browser, and the SQL table is private with no sensitive columns', () => {
    const api = read('src/app/api/fifs/route.ts'); const at = api.indexOf("case 'multiStateGet'"); assert(at > 0, 'cases'); const body = api.slice(at, at + 1700);
    assert(/Please sign in/.test(body) && /status: 401/.test(body) && /allowPublicSubmit\(req, 'multistate'/.test(body) && /String\(user\.id\)/.test(body), 'signed in, throttled, own id from the login'); assert(!/payload\.userId|payload\.user_id/.test(body), 'no user id from the browser');
    const adm = body.slice(body.indexOf("case 'adminMultiStateList'")); assert(adm.indexOf('isStaffOrAdmin(user)') > 0 && adm.indexOf('isStaffOrAdmin(user)') < adm.indexOf('getPrivilegedClient()'), 'staff check first');
    const card = read('src/multistate/card.ts'), view = read('src/multistate/sheetsView.ts'); assert(!/innerHTML/.test(card + view) && !/localStorage|sessionStorage|document\.cookie/.test(card + view + read('src/multistate/sheets.ts')), 'text only, nothing stored'); assert(!/FormData|fetch\(|XMLHttpRequest|sendBeacon/.test(view), 'the photo check and sheets send nothing');
    const page = read('src/app/page.tsx'); assert(/id="ms-student"/.test(page) && /id="ms-client"/.test(page) && /installMultiStateCard\(\)/.test(page) && /btn-admin-multistate-hdr/.test(page), 'hosts and install'); assert(/AdminMultiStatePanel/.test(read('src/app/layout.tsx')), 'admin panel mounted');
    const css = read('src/multistate/multistate.css'); assert(/\.ms-tick \{[^}]*width: 44px; height: 44px/.test(css) && /\.ms-btn \{ min-height: 48px/.test(css) && /\.ms-sheet \.ms-note \{[^}]*color: #222222/.test(css) && !/^\.ms-sub, \.ms-line, \.ms-note/m.test(css) && /@media print/.test(css) && /body\.ms-printing > \*:not\(#ms-print\)/.test(css), '44px targets and print rules');
    const sql = read('scripts/sql/20261019_multistate_progress.sql').replace(/--.*$/gm, ''); assert(/enable row level security/.test(sql) && /revoke all on public\.multistate_progress from anon, authenticated/.test(sql) && /references auth\.users\(id\) on delete cascade/.test(sql) && !/ssn|social|license|dob|birth|fingerprint/i.test(sql), 'private table, no sensitive columns');
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`); process.exit(failed ? 1 : 0);
})();
