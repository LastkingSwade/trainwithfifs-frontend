/**
 * TrainWithFIFS - the client dashboard's Wear & Carry card never shows made-up credential facts (offline)
 * The static card used to show a sample name, a sample permit number, an expiry date that had passed, "VERIFIED" and "MSP 5-101 QUALIFIED" stamps and a nationwide claim.
 * These must never come back: a client sees only their own uploaded permit or a plain "not on file yet".
 */
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const page = read('src/app/page.tsx'); const i = page.indexOf('<div id="wallet-photo-box"'); const card = page.slice(i - 200, page.indexOf('id="wallet-days-left"', i) + 300);

(async () => {
  console.log('\n[No made-up facts on the static card]');
  await test('no sample name, permit number, expiry or status is shown by default', () => {
    for (const bad of ['MARCUS VANCE', 'MD-WCP-1042-88', 'Oct 15, 2026', 'ACTIVE CARRIER', 'Active (90+ Days)']) assert(!card.includes(bad), 'sample still shown: ' + bad);
  });
  await test('the client header shows no sample client ID or passed expiry date either (the signed-in record replaces these when it loads)', () => {
    const hdr = page.slice(page.indexOf('id="dash-client-id"') - 60, page.indexOf('id="dash-client-exp-badge"') + 200); assert(!/FI-CLIENT-1042/.test(page), 'sample client ID still in the page'); assert(!/Expiration: Oct 15, 2026/.test(page), 'passed sample expiry still in the page'); assert(/Registered client/.test(hdr) && /not on file yet/.test(hdr), 'neutral placeholders');
  });
  await test('on a narrow phone the permit values wrap inside their columns instead of running off the card', () => {
    assert(page.includes('className="wallet-permit-fields"') && page.includes('className="wallet-permit-body"'), 'hooks'); const css = read('src/portal/vault.css'); assert(/\.wallet-permit-fields \{ min-width: 0; \}/.test(css) && /overflow-wrap: anywhere/.test(css) && /@media \(max-width: 420px\) \{ \.wallet-permit-fields \{ grid-template-columns: 1fr !important; \} \}/.test(css), 'wrap and one column on narrow phones');
  });
  await test('no "VERIFIED" or "MSP 5-101 QUALIFIED" stamp and no instructor-certification line on the card (the card is a copy the client uploaded, not an official check)', () => {
    assert(!/>\s*VERIFIED\s*</.test(card), 'VERIFIED stamp'); assert(!/MSP § 5-101 QUALIFIED/.test(card), 'qualified stamp'); assert(!/Certified Lead Instructor/.test(card), 'certification line');
  });
  await test('no nationwide claim: the card never says "34+ States" (the Reciprocity Hub is the source for each state)', () => {
    assert(!/34\+ States Recognized/.test(card), 'static nationwide claim'); assert(!/34\+ States Recognized/.test(read('src/portal/permitCardLive.ts')), 'live nationwide claim');
    assert(/See the Reciprocity Hub/.test(card) && /See the Reciprocity Hub for each state/.test(read('src/portal/permitCardLive.ts')), 'points to the hub');
  });
  await test('the card shows plain "not on file" wording until the client uploads a permit, and the live script never writes a name or number it did not read from the client\'s own record', () => {
    assert(/Your name appears here/.test(card) && /Not on file yet/.test(card) && /Upload to your Wallet|Shows the copy you upload/.test(card), 'placeholders');
    const live = read('src/portal/permitCardLive.ts'); assert(/if \(rec\.fullName\) setText\('wallet-cardholder-name'/.test(live), 'name only from the record');
  });
})().then(() => { console.log(`\nPermit card (no sample data): ${passed} passed, ${failed} failed`); if (failed) process.exit(1); });
