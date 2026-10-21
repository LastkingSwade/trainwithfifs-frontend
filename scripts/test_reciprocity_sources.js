/**
 * TrainWithFIFS - Reciprocity Hub: source and review line for every state (offline)
 * A link appears only for a state with a verified official source; every other state says plainly that none has been added. The hub's own numbers are untouched.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const R = require(path.join(ROOT, 'src/portal/reciprocitySources.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

(async () => {
  console.log('\n[Source line]');
  await test('Maryland shows its official State Police link; a state with no verified source says so and shows no link', () => {
    const md = R.sourceLine('MD'); assert(md.url && /^https:\/\/mdsp\.maryland\.gov\//.test(md.url) && /State Police/.test(md.label), 'Maryland official link');
    for (const code of ['HI', 'OR', 'KS', 'MA', 'MT', 'NH', 'RI', 'VT', 'ZZ', '', null]) { const l = R.sourceLine(code); assert(!l.url && /has not been added/.test(l.text), 'no link claimed for ' + code); }
    const ca = R.sourceLine('CA'); assert(ca.url && /^https:\/\/oag\.ca\.gov\//.test(ca.url), 'California now has its Attorney General link');
  });
  await test('every listed source is a plain https link, and a review date appears only when one is recorded', () => {
    for (const [code, s] of Object.entries(R.OFFICIAL_SOURCES)) assert(R.safeUrl(s.url) && /^https:/.test(s.url), code + ' needs an https link');
    for (const bad of ['http://x.gov', 'javascript:alert(1)', 'data:text/html,x', 'ftp://x', '', null, 'not a url']) eq(R.safeUrl(bad), null, String(bad));
    const withDay = R.sourceLine('MD', { MD: { label: 'x', url: 'https://x.gov', reviewedOn: '2026-10-20' } }, null); assert(/October 20, 2026/.test(withDay.text), 'its own date');
    const tableDay = R.sourceLine('MD', { MD: { label: 'x', url: 'https://x.gov' } }, '2026-11-02'); assert(/November 2, 2026/.test(tableDay.text), 'the table date');
    assert(!/Last reviewed/.test(R.sourceLine('MD', { MD: { label: 'x', url: 'https://x.gov' } }, null).text), 'no invented date');
    eq(R.RECIPROCITY_REVIEWED_ON, null, 'no review date is claimed until one is recorded');
    const urls = Object.values(R.OFFICIAL_SOURCES).map((x) => x.url); eq(new Set(urls).size, urls.length, 'no link is used for two states');
    const codes = Object.keys(R.OFFICIAL_SOURCES); assert(codes.length >= 40, 'the verified links are in: ' + codes.length); assert(codes.every((c) => /^[A-Z]{2}$/.test(c)), 'real state codes');
    for (const [c, x] of Object.entries(R.OFFICIAL_SOURCES)) assert(x.label && x.label.length > 8 && !/<|>/.test(x.label), c + ' needs a plain label');
  });
  await test('the hub notice always warns, says it is not legal advice, and shows a date only when one is recorded', () => {
    const n0 = R.hubNotice(null); assert(/not legal advice/.test(n0) && /confirm with the state's official source/i.test(n0) && !/last reviewed/i.test(n0), 'warning, no date');
    assert(/Table last reviewed March 3, 2027/.test(R.hubNotice('2027-03-03')), 'date when recorded'); assert(!/last reviewed/i.test(R.hubNotice('not-a-date')), 'a bad date is not shown');
  });

  console.log('\n[Wiring]');
  await test('it wraps the state window without changing it, is installed on page load, and is plain text with 44px links', () => {
    const m = read('src/portal/reciprocitySources.ts'); assert(!/innerHTML|insertAdjacentHTML/.test(m), 'text only'); assert(/min-height:44px/.test(m) && /rel = 'noopener noreferrer'/.test(m), 'links');
    assert(/orig\.call\(this, code/.test(m) && /try \{[\s\S]*dossierNotesVal/.test(m), 'the original window runs first and the box never breaks it');
    assert(/installReciprocitySources\(\)/.test(read('src/app/page.tsx')), 'installed');
    const data = read('public/scripts/TrainWithFIFS_scripts.js'); assert(/var RECIPROCITY_STATES_DATA = \{/.test(data), 'the hub data is unchanged and still there');
  });

  console.log(`\nReciprocity sources: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
