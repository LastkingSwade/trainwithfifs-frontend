// Student Portal extras: class-day card, rebook, receipts, Maryland guide (offline).
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..'); const cache = {};
const load = (rel, extra = {}) => { const key = rel; if (cache[key]) return cache[key]; const m = { exports: {} }; const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const req = (id) => (id === './walletCard' ? load('src/portal/walletCard.ts') : id === './portalCopy' ? load('src/portal/portalCopy.ts') : id === '@/group/groupCopy' ? load('src/group/groupCopy.ts') : id === './courseCards' ? load('src/portal/courseCards.ts') : id === '@/Lib/pricing' ? load('src/Lib/pricing.ts') : require(id));
  vm.runInNewContext(ts.transpileModule(src, { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, require: req, console, Date, Math, Number, String, Array, Promise, Error, RegExp, encodeURIComponent, document: {}, ...extra }); return (cache[key] = m.exports); };
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
const ROUTE = fs.readFileSync(path.join(ROOT, 'src/app/api/fifs/route.ts'), 'utf8'), PAGE = fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf8');
function memDb(rows) { return { from: () => { const f = []; const q = { select: () => q, eq: (c, v) => { f.push((r) => r[c] === v); return q; }, in: (c, vs) => { f.push((r) => vs.includes(r[c])); return q; }, order: () => q, limit: () => q, then: (res) => res({ data: rows.filter((r) => f.every((x) => x(r))).map((r) => ({ ...r })), error: null }) }; return q; } }; }
(async () => {
  console.log('\n[student portal]');
  const ex = load('src/portal/studentExtras.ts', { window: undefined });
  await test('Countdown: counts whole days to the class date, says tomorrow and today, and stays quiet for past or unreadable dates', () => {
    const now = new Date(2026, 9, 20, 15, 0);
    assert(ex.daysUntil('Oct 25, 2026', now) === 5 && ex.daysUntil('Oct 21, 2026 at 9:00 AM', now) === 1 && ex.daysUntil('Oct 20, 2026', now) === 0 && ex.daysUntil('Oct 1, 2026', now) === -19);
    assert(ex.daysUntil('TBD', now) === null && ex.daysUntil('', now) === null);
    assert(ex.countdownText(5) === 'Your class is in 5 days.' && ex.countdownText(1) === 'Your class is tomorrow.' && ex.countdownText(0) === 'Your class is today.' && ex.countdownText(-3) === '' && ex.countdownText(null) === '');
  });
  await test('The guide is clearly informational, links only to official Maryland State Police pages, and gives no fee or term that can go stale', () => {
    const pc = load('src/portal/portalCopy.ts');
    assert(/Informational only/.test(pc.GUIDE_DISCLAIMER) && /not legal advice/.test(pc.GUIDE_DISCLAIMER) && /confirm on the official/.test(pc.GUIDE_DISCLAIMER));
    for (const g of pc.GUIDE_ITEMS) { assert(/^https:\/\/mdsp\.maryland\.gov\//.test(g.href), 'non-official link: ' + g.href); assert(!/\$\d/.test(g.body), 'a dollar figure can go stale: ' + g.title); }
    assert(pc.GUIDE_ITEMS.length === 3 && /Wear and Carry/.test(pc.GUIDE_ITEMS[1].title) && /HQL/.test(pc.GUIDE_ITEMS[0].title));
  });
  await test('Class-day content is practical: ID, ammo, eye and ear protection, directions to the range; the maps link is https', () => {
    const pc = load('src/portal/portalCopy.ts'); const all = pc.BRING.join(' ') + pc.EXPECT.join(' ');
    for (const k of ['photo ID', 'ammunition', 'hearing protection', '9:00 AM']) assert(all.includes(k), 'missing ' + k);
    assert(/^https:\/\/www\.google\.com\/maps\/search\//.test(pc.MAPS_URL) && pc.MAPS_URL.includes(encodeURIComponent("Cindy's Hot Shots")));
  });
  await test('Receipts: only that student, only paid or deposit-paid, only receipt fields, readable course names', async () => {
    const si = load('src/Lib/server/student-invoices.ts');
    const rows = [{ invoice_number: 'INV-FI-2026-1', student_id: 'FIFS-1', course: 'Maryland CCW — VIP Turnkey ($279.99)', status: 'PAID', total_amount: '297.19', amount_paid: '297.19', balance_due: '0.00', created_at: '2026-10-01T00:00:00Z', email: 'a@x.com', stripe_session_id: 'cs_secret' },
      { invoice_number: 'INV-FI-2026-2', student_id: 'FIFS-1', course: 'Maryland HQL', status: 'DEPOSIT_PAID', total_amount: '106.00', amount_paid: '31.80', balance_due: '74.20', created_at: '2026-10-02T00:00:00Z' },
      { invoice_number: 'INV-FI-2026-3', student_id: 'FIFS-1', course: 'x', status: 'PENDING', total_amount: '1', amount_paid: '0', balance_due: '1', created_at: '2026-10-03T00:00:00Z' },
      { invoice_number: 'INV-FI-2026-4', student_id: 'FIFS-2', course: 'Other person', status: 'PAID', total_amount: '9', amount_paid: '9', balance_due: '0', created_at: '2026-10-04T00:00:00Z' }];
    const out = await si.studentInvoices(memDb(rows), 'FIFS-1');
    assert(out.length === 2 && out[0].course === 'Maryland CCW' && out[0].status === 'Paid in full' && out[1].status === 'Deposit paid' && out[1].balance === 74.2, JSON.stringify(out));
    const txt = JSON.stringify(out); assert(!/a@x\.com|cs_secret|Other person|FIFS-2|Turnkey/.test(txt), 'something that is not a receipt field leaked');
    assert((await si.studentInvoices(memDb(rows), '')).length === 0 && (await si.studentInvoices({ from: () => { throw new Error('db'); } }, 'FIFS-1')).length === 0, 'fails safe');
  });
  await test('Route: receipts need a verified student token and are found only by that token\'s user id; the page mounts the cards', () => {
    const at = ROUTE.indexOf("case 'studentInvoices':"); const body = ROUTE.slice(at, ROUTE.indexOf("case 'studentOnlineClass':", at));
    assert(/getAuthenticatedUser\(req\)/.test(body) && /status: 401/.test(body) && /eq\('user_id', user\.id\)/.test(body) && !/payload\.(studentId|email)/.test(body));
    assert(/id="dash-extras"/.test(PAGE) && /installStudentExtras\(\);/.test(PAGE));
  });
  // ---- "Your class" section: made for the course each student booked ----
  const CC = load('src/portal/courseCards.ts'); const CCSRC = fs.readFileSync(path.join(ROOT, 'src/portal/courseCards.ts'), 'utf8');
  const norm = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '');
  const CONFIG = {}; { const at = PAGE.indexOf('const COURSE_TIER_CONFIG'); const end = PAGE.indexOf('};', PAGE.indexOf('alumni:', at)); const body = PAGE.slice(at, end);
    for (const m of body.matchAll(/\n\s{6}([a-z]+): \{([\s\S]*?)\n\s{6}\}/g)) { const f = (k) => { const r = new RegExp(k + ': "((?:[^"\\\\]|\\\\.)*)"').exec(m[2]); return r ? r[1].replace(/\\"/g, '"') : ''; }; CONFIG[m[1]] = { baseTitle: f('baseTitle'), baseBadge: f('baseBadge'), baseDesc: f('baseDesc'), vipDesc: f('vipDesc'), baseValue: f('baseValue'), vipValue: f('vipValue') }; } }
  await test('Your class: every one of the 9 courses is recognised from the real booking text (Standard and VIP) and shows the right course and tier', () => {
    assert(Object.keys(CONFIG).length === 9 && Object.keys(CC.COURSES).length === 9, 'expected 9 courses, got ' + Object.keys(CONFIG).length);
    for (const [key, c] of Object.entries(CONFIG)) {
      const std = CC.buildCourseView(c.baseValue), vip = CC.buildCourseView(c.vipValue);
      assert(std && std.key === key && std.vip === false, key + ' standard: ' + JSON.stringify(std && [std.key, std.vip]));
      assert(vip && vip.key === key && vip.vip === true, key + ' VIP');
    }
    assert(CC.buildCourseView('') === null && CC.buildCourseView(null) === null && CC.buildCourseView('Underwater basket weaving') === null && CC.buildCourseView(undefined) === null, 'an unknown or empty course shows nothing');
    assert(CC.buildCourseView('Maryland Wear & Carry (8-Hour Renewal) — Base Track ($149.99)').key === 'renewal' && CC.buildCourseView('Maryland Wear & Carry (CCW) Initial Course').key === 'ccw', 'renewal and initial are told apart');
  });
  await test('Your class: the wording is the site\'s own (titles, badges and descriptions match the course catalog on the page; nothing invented)', () => {
    for (const [key, c] of Object.entries(CONFIG)) {
      const k = CC.COURSES[key];
      assert(norm(k.name) === norm(c.baseTitle), key + ' name: ' + k.name + ' vs ' + c.baseTitle);
      assert(norm(k.badge) === norm(c.baseBadge), key + ' badge');
      assert(norm(k.about) === norm(c.baseDesc), key + ' about');
      assert(norm(k.vipAbout) === norm(c.vipDesc), key + ' VIP about');
    }
  });
  await test('Your class: each course gets cards that fit it (law only for licensing courses, a class-day card only for range classes, youth steps for the youth class)', () => {
    const ids = (text) => CC.buildCourseView(text).tiles.map((t) => t.id);
    assert(JSON.stringify(ids(CONFIG.ccw.baseValue)) === JSON.stringify(['covers', 'bring', 'day', 'law', 'after']), 'ccw: ' + ids(CONFIG.ccw.baseValue));
    assert(JSON.stringify(ids(CONFIG.hql.baseValue)) === JSON.stringify(['covers', 'bring', 'day', 'law', 'next']), 'hql: ' + ids(CONFIG.hql.baseValue));
    assert(JSON.stringify(ids(CONFIG.children.baseValue)) === JSON.stringify(['covers', 'bring', 'eddie', 'next']), 'children: ' + ids(CONFIG.children.baseValue));
    assert(JSON.stringify(ids(CONFIG.cleaning.baseValue)) === JSON.stringify(['covers', 'bring', 'next']) && JSON.stringify(ids(CONFIG.coaching.baseValue)) === JSON.stringify(['covers', 'bring', 'next']), 'cleaning and coaching have no range-day or law card');
    assert(JSON.stringify(ids(CONFIG.alumni.baseValue)) === JSON.stringify(['covers', 'bring', 'day', 'next']), 'alumni: ' + ids(CONFIG.alumni.baseValue));
    for (const k of ['mastery', 'combo', 'renewal']) assert(ids(CONFIG[k].baseValue).includes('law') && ids(CONFIG[k].baseValue).includes('after'), k + ' needs law and after-class cards');
    const eddie = CC.buildCourseView(CONFIG.children.baseValue).tiles.find((t) => t.id === 'eddie');
    assert(JSON.stringify(eddie.secs[1].ul) === JSON.stringify(['Stop.', "Don't touch.", 'Run away.', 'Tell an adult.']), 'the 4 Eddie Eagle steps');
  });
  await test('Your class: Standard and VIP differ where they should (VIP shows what is included; Standard shows your own gear; classes with no range never tell you to bring ammunition)', () => {
    const bring = (text) => JSON.stringify(CC.buildCourseView(text).tiles.find((t) => t.id === 'bring').secs);
    assert(/Included with VIP/.test(bring(CONFIG.ccw.vipValue)) && /Loaner|loaner/.test(bring(CONFIG.ccw.vipValue)) && !/Your gear/.test(bring(CONFIG.ccw.vipValue)), 'ccw VIP');
    assert(/Your gear \(standard track\)/.test(bring(CONFIG.ccw.baseValue)) && /A holster/.test(bring(CONFIG.ccw.baseValue)) && /50 rounds/.test(bring(CONFIG.ccw.baseValue)) && !/Included with VIP/.test(bring(CONFIG.ccw.baseValue)), 'ccw Standard');
    for (const k of ['cleaning', 'coaching', 'children']) assert(!/ammunition|rounds/i.test(bring(CONFIG[k].baseValue)) && /Kai will confirm/.test(bring(CONFIG[k].baseValue)) && /443-990-1304/.test(bring(CONFIG[k].baseValue)), k + ' must not promise gear it never mentioned');
    assert(CC.buildCourseView(CONFIG.ccw.vipValue).tiles[0].secs[0].p === CC.COURSES.ccw.vipAbout && CC.buildCourseView(CONFIG.ccw.baseValue).tiles[0].secs[0].p === CC.COURSES.ccw.about, 'the first card shows the tier\'s own description');
  });
  await test('Your class: law cards are informational, link only to official https pages, and the after-class card points to the score sheet card', () => {
    for (const k of ['ccw', 'combo', 'hql', 'mastery', 'renewal']) {
      const law = CC.buildCourseView(CONFIG[k].baseValue).tiles.find((t) => t.id === 'law'); const text = JSON.stringify(law.secs);
      assert(/not legal advice/i.test(text) && /confirm on the official Maryland State Police page/.test(text), k + ' keeps the disclaimer');
      for (const s of law.secs) if (s.link) assert(/^https:\/\/mdsp\.maryland\.gov\//.test(s.link.href), k + ' link: ' + s.link.href);
    }
    assert(/HQL|Handgun Qualification/.test(JSON.stringify(CC.buildCourseView(CONFIG.hql.baseValue).tiles.find((t) => t.id === 'law'))) && !/Wear and Carry permit/.test(JSON.stringify(CC.buildCourseView(CONFIG.hql.baseValue).tiles.find((t) => t.id === 'law'))), 'HQL students get the HQL card, not the carry card');
    const after = CC.buildCourseView(CONFIG.ccw.baseValue).tiles.find((t) => t.id === 'after'); assert(/Score Sheet card/.test(JSON.stringify(after.secs)), 'after-class card names the Score Sheet card');
  });
  await test('Your class: safe by construction (text only, https links only, accessible dialog with Escape and a focus trap) and mounted first in the dashboard', () => {
    assert(!/innerHTML|insertAdjacentHTML|outerHTML/.test(CCSRC), 'no HTML from data');
    assert(/aria-modal', 'true'/.test(CCSRC) && /role', 'dialog'/.test(CCSRC) && /aria-labelledby/.test(CCSRC) && /e\.key === 'Escape'/.test(CCSRC) && /e\.key !== 'Tab'/.test(CCSRC) && /opener\.focus\(\)/.test(CCSRC), 'dialog semantics, Escape, focus trap and focus return');
    assert(/protocol === 'https:'/.test(CCSRC) && /rel = 'noopener noreferrer'/.test(CCSRC), 'https only, noopener');
    const SE = fs.readFileSync(path.join(ROOT, 'src/portal/studentExtras.ts'), 'utf8');
    assert(SE.indexOf('courseSection()') > 0 && SE.indexOf('courseSection()') < SE.indexOf('host.appendChild(classDayCard())'), 'the section is added before the generic cards');
    assert(!/StudentId|studentId|fetch\(|callFifsBackend/.test(CCSRC), 'it reads the signed-in record already in memory and sends nothing');
    assert(/\.cc-tile \{[^}]*min-height: 64px/.test(fs.readFileSync(path.join(ROOT, 'src/portal/portal.css'), 'utf8')) && /\.cc-close \{[^}]*min-height: 44px/.test(fs.readFileSync(path.join(ROOT, 'src/portal/portal.css'), 'utf8')), '44px+ touch targets');
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
