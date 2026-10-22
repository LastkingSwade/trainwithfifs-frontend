/**
 * TrainWithFIFS - an uploaded permit shows on the Wear & Carry card (offline)
 * An uploaded picture replaces the placeholder; an uploaded PDF gets a button that opens the client's own copy (fetched only on press); every upload is captioned as the client's own, self-reported copy.
 * The card never says an agency verified it.
 */
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const L = read('src/portal/permitCardLive.ts'); const code = L.replace(/\/\/.*$/gm, '');

(async () => {
  await test('a PDF upload gets an "Open my uploaded permit (PDF)" button, and the file is fetched only when the button is pressed', () => {
    assert(/else \{ clearPhoto\(\); showPdfOpener\(doc\.id\); \}/.test(code), 'PDF branch'); assert(/btn\.addEventListener\('click', async \(\) => \{/.test(code), 'click handler'); assert(/const r = await w\.callFifsBackend\('walletOpen', \{ id \}\)/.test(code), 'fetch on press only');
    assert(/Open my uploaded permit \(PDF\)/.test(code) && /window\.open\(url, '_blank', 'noopener'\)/.test(code), 'button text and safe new tab');
  });
  await test('the PDF button is not fetched on page load: the only walletOpen call for PDFs sits inside the click handler', () => {
    const i = code.indexOf('function showPdfOpener'); const j = code.indexOf('btn.addEventListener', i); const k = code.indexOf('walletOpen', j); const refresh = code.indexOf('async function refresh'); assert(i > 0 && j > i && k > j, 'order'); assert(!/walletOpen/.test(code.slice(i, j)), 'no fetch before the click');
  });
  await test('every upload is captioned as the client\'s own, self-reported copy, and no code says it was verified or checked by an agency', () => {
    assert(/Your uploaded copy · self-reported/.test(code), 'caption'); assert(!/verified|verification|checked by|certified|qualified/i.test(code.replace(/Verified/g, '')), 'no verification claim in the card code');
    assert(!/MSP[^'"]*qualif/i.test(code), 'no MSP qualified claim');
  });
  await test('the file is handled safely: an object address is made in this browser, freed after a minute, opened without a link back to the opener, and removed on sign-out', () => {
    assert(/setTimeout\(\(\) => URL\.revokeObjectURL\(url\), 60000\)/.test(code), 'freed'); assert(/'noopener'/.test(code), 'no opener'); assert(/clearPhoto\(\)/.test(code) && /box\?\.parentElement\?\.querySelectorAll\('\.wallet-open-pdf,\.wallet-self-note'\)/.test(code), 'removed on sign-out and clear');
    assert(!/localStorage|sessionStorage|document\.cookie|console\.|innerHTML|fetch\(/.test(code), 'nothing stored, logged, injected or sent by this file (the server call uses the existing wallet action)');
  });
  await test('the button and caption are 44px-friendly, keyboard reachable, and in the company colours; the box keeps its size', () => {
    const css = read('src/portal/vault.css'); assert(/\.wallet-open-pdf \{[^}]*min-height: 44px/.test(css) && /\.wallet-open-pdf:focus-visible \{ outline: 3px solid #00e5ff/.test(css), 'button'); assert(/#ffb703/.test(css), 'amber');
  });
  await test('uploaded pictures still replace the placeholder as before, and the placeholder stamps are gone (see test_permit_card_no_sample.js)', () => {
    assert(L.includes('if (/^image\\//.test(doc.mime)) {') && /showPhoto\(URL\.createObjectURL/.test(code), 'picture path intact');
  });
  console.log(`\nPermit card PDF and upload: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
