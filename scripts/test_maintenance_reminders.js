/**
 * TrainWithFIFS - Armory service reminders (offline)
 * An optional service interval (1 to 60 months) lives inside each encrypted record. Reminders show only when the Armory opens: never pushed, emailed, logged or sent.
 */
const fs = require('fs'); const path = require('path'); const Module = require('module');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const origLoad = Module._load;
Module._load = function (request, parent, ...rest) { if (request === './push' && parent && /portal-chat\.ts$/.test(parent.filename || '')) return { sendToUsers: async () => ({ sent: 0 }), notifyStaff: async () => ({ sent: 0 }) }; return origLoad.call(this, request, parent, ...rest); };
const L = require(path.join(ROOT, 'src/portal/armoryLogic.ts')); const AR = require(path.join(ROOT, 'src/Lib/server/armory.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const T = '2026-10-22';
const it = (o = {}) => ({ purchasedOn: '2024-01-10', maintenance: [], serviceEveryMonths: 12, ...o });

(async () => {
  console.log('\n[The date arithmetic]');
  await test('adding months keeps the day, and clamps to the last day of a shorter month, leap years included', () => {
    eq(L.addMonths('2026-10-22', 12), '2027-10-22'); eq(L.addMonths('2026-01-31', 1), '2026-02-28', 'clamp'); eq(L.addMonths('2028-01-31', 1), '2028-02-29', 'leap'); eq(L.addMonths('2028-02-29', 12), '2029-02-28', 'leap to non-leap'); eq(L.addMonths('2026-11-15', 3), '2027-02-15', 'year wrap');
  });
  console.log('\n[When the next service is due]');
  await test('no interval, or no date to count from, means no reminder', () => {
    eq(L.reminderFor(it({ serviceEveryMonths: null }), T).state, 'none'); eq(L.reminderFor(it({ purchasedOn: '' }), T).state, 'none'); eq(L.reminderFor({ maintenance: [] }, T).state, 'none', 'old records without the field');
  });
  await test('the count starts from the latest service, or from purchase if never serviced; past is due, 30 days or less is soon, more is ok', () => {
    eq(L.reminderFor(it({ maintenance: [{ on: '2025-10-01' }] }), T), { state: 'due', dueOn: '2026-10-01', days: -21 }, 'overdue from the last service');
    eq(L.reminderFor(it({ purchasedOn: '2025-11-01' }), T), { state: 'soon', dueOn: '2026-11-01', days: 10 }, 'never serviced: from purchase');
    eq(L.reminderFor(it({ maintenance: [{ on: '2025-05-01' }, { on: '2026-06-01' }] }), T).dueOn, '2027-06-01', 'latest service counts');
    eq(L.reminderFor(it({ purchasedOn: '2026-01-22' }), T).state, 'ok', 'months away is ok'); eq(L.reminderFor(it({ purchasedOn: '2025-10-22' }), T).state, 'soon', 'due today is soon, not ok'); eq(L.reminderFor(it({ purchasedOn: '2025-11-22' }), T).days, 31, '31 days'); eq(L.reminderFor(it({ purchasedOn: '2025-11-22' }), T).state, 'ok', '31 days is ok, not soon');
    eq(L.reminderFor(it({ purchasedOn: '2025-11-21' }), T).state, 'soon', '30 days is soon');
  });
  await test('the words for each reminder are plain, with the date and days where it helps', () => {
    eq(L.reminderText({ state: 'due', dueOn: '2026-10-01', days: -21 }), 'Service due since 2026-10-01'); eq(L.reminderText({ state: 'soon', dueOn: '2026-11-01', days: 1 }), 'Service due 2026-11-01 (in 1 day)'); eq(L.reminderText({ state: 'ok', dueOn: '2027-01-01', days: 90 }), 'Next service 2027-01-01'); eq(L.reminderText({ state: 'none' }), '');
  });
  console.log('\n[What a member can enter]');
  await test('the interval is optional, a whole number of months from 1 to 60, and anything else is refused with a clear message', () => {
    const base = { nickname: 'Range pistol' }; eq(AR.cleanItem({ ...base, serviceEveryMonths: '' }, new Date(T)).data.serviceEveryMonths, null, 'blank is none'); eq(AR.cleanItem({ ...base, serviceEveryMonths: 12 }, new Date(T)).data.serviceEveryMonths, 12); eq(AR.cleanItem({ ...base, serviceEveryMonths: '60' }, new Date(T)).data.serviceEveryMonths, 60, 'text number');
    for (const bad of [0, 61, 1.5, 'abc', -3, '12.5']) { const r = AR.cleanItem({ ...base, serviceEveryMonths: bad }, new Date(T)); assert(!r.ok && /whole number of months from 1 to 60/.test(r.message), 'refused: ' + bad); }
  });
  console.log('\n[Nothing is pushed or sent]');
  await test('the reminder code and the Armory screen never use push, notifications, email or a network call', () => {
    const code = (read('src/portal/armoryLogic.ts') + read('src/portal/ArmoryPanel.tsx') + read('src/Lib/server/armory.ts')).replace(/\/\/.*$/gm, '');
    assert(!/sendToUsers|web-push|pushManager|Notification\(|serviceWorker|sendBeacon|localStorage|fetch\(\s*['"`]https?:/i.test(code.replace(/callFifsBackend/g, '')), 'a push, storage or outside call appeared');
    assert(!/from '\.\/push'|from '\.\.\/push'|push-logic/.test(read('src/Lib/server/armory.ts')), 'the armory does not import push');
  });
  await test('the new field is saved from the form and passed on by the server route; old records simply have no reminder', () => {
    const route = read('src/app/api/fifs/route.ts'); assert(/serviceEveryMonths: payload\.serviceEveryMonths/.test(route), 'route passes the field'); const p = read('src/portal/ArmoryPanel.tsx'); assert(/Service every \(months, optional\)/.test(p) && /serviceEveryMonths: i\.serviceEveryMonths \? String\(i\.serviceEveryMonths\) : ''/.test(p), 'form field and edit');
  });
  console.log(`\nMaintenance reminders: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
