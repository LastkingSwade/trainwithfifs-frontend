/**
 * TrainWithFIFS - insurance package (offline)
 * A list, not an appraisal. Serial numbers only when ticked; notes and document files never included; unreadable items left out; formula-safe; built in the browser, nothing stored or sent.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const P = require(path.join(ROOT, 'src/portal/insurancePackage.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const item = (o = {}) => ({ id: 'a', nickname: 'Range pistol', type: 'handgun', make: 'Glock', model: '19', caliber: '9mm', serial: 'SECRET123', purchasedOn: '2024-03-01', price: 549.99, notes: 'private note', maintenance: [{ id: 'm', on: '2026-09-01', kind: 'cleaning', note: 'x' }], ...o });
const docs = [{ kindLabel: 'Permit card', createdAt: '2026-10-01T10:00:00Z', expiresOn: '2027-10-01' }];
const base = { items: [item()], docs, today: '2026-10-22' };

(async () => {
  await test('by default the package has no serial numbers, no notes and no column for them', () => {
    const csv = P.buildInsurancePackage({ ...base, includeSerials: false }); assert(!csv.includes('SECRET123'), 'serial leaked'); assert(!csv.includes('Serial number'), 'serial column present'); assert(!csv.includes('private note'), 'notes leaked');
  });
  await test('serial numbers appear only when ticked, in their own column', () => {
    const csv = P.buildInsurancePackage({ ...base, includeSerials: true }); assert(csv.includes('Serial number') && csv.includes('SECRET123'), 'ticked serial shown'); assert(!csv.includes('private note'), 'notes still left out');
  });
  await test('the package lists items with their purchase, price, maintenance count and last service, plus the names of documents, never their files', () => {
    const csv = P.buildInsurancePackage({ ...base, includeSerials: false }); for (const s of ['Range pistol', 'Glock', '2024-03-01', '549.99', '2026-09-01', 'Permit card', '2027-10-01', 'files are not included', 'not an appraisal']) assert(csv.includes(s), 'missing ' + s);
    assert(!/base64|%PDF|data:/.test(csv), 'no file contents');
  });
  await test('items that could not be read are left out; an empty set still says what is missing', () => {
    const csv = P.buildInsurancePackage({ items: [item(), item({ id: 'b', nickname: 'Broken', unreadable: true })], docs: [], includeSerials: false, today: '2026-10-22' }); assert(!csv.includes('Broken'), 'unreadable included'); assert(csv.includes('No documents on file yet'), 'empty docs line');
  });
  await test('spreadsheet formulas are neutralised (a nickname starting with = cannot run)', () => {
    const csv = P.buildInsurancePackage({ ...base, items: [item({ nickname: '=HYPERLINK("x")' })], includeSerials: false }); assert(!/(^|,)=HYPERLINK/m.test(csv), 'formula not neutralised'); assert(csv.includes("'=HYPERLINK"), 'apostrophe guard');
  });
  await test('the package is built in the browser from data already loaded, offered as a download, and nothing is stored or sent', () => {
    const p = read('src/portal/ArmoryPanel.tsx'); assert(/buildInsurancePackage\(\{ items, docs, includeSerials: withSerials/.test(p), 'built from loaded items'); assert(/const \[withSerials, setWithSerials\] = useState\(false\)/.test(p) && !/setWithSerials\] = useState\(true\)/.test(p), 'serials default off');
    const code = (read('src/portal/insurancePackage.ts') + p.slice(p.indexOf('Insurance package (CSV)') - 1200, p.indexOf('Insurance package (CSV)') + 40)).replace(/\/\/.*$/gm, ''); assert(!/localStorage|sessionStorage|document\.cookie|console\.|innerHTML/.test(code), 'nothing stored or injected');
    assert(/call\('walletStatus'\)/.test(p), 'the document names come through the existing signed-in call');
  });
  await test('the serial box is labelled plainly and is large enough to tap', () => {
    const p = read('src/portal/ArmoryPanel.tsx'); assert(/Include serial numbers in the insurance package \(off unless you tick this\)/.test(p), 'label'); assert(/\.ar-pkg-check \{[^}]*min-height: 44px/.test(read('src/portal/armory.css')) && /\.ar-pkg-check input \{ width: 24px; height: 24px/.test(read('src/portal/armory.css')), 'size');
  });
  console.log(`\nInsurance package: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
