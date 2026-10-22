/**
 * TrainWithFIFS - the States tab: a direct button to the 50-State Reciprocity Hub, between Range and Hub (offline)
 * Six tabs that still fit a 320px phone, 44px targets, the right one marked current, and opening/closing without leaving other panels stacked behind it.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const T = require(path.join(ROOT, 'src/shell/tabLogic.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

(async () => {
  await test('the tab bar is Home, Vault, Armory, Range, States, Hub: the new tab sits exactly between Range and Hub, with a map emoji, and screen readers hear "Reciprocity Hub"', () => {
    eq(T.TABS.map((t) => t.label), ['Home', 'Vault', 'Armory', 'Range', 'States', 'Hub']); const i = T.TABS.findIndex((t) => t.key === 'reciprocity'); eq([T.TABS[i - 1].key, T.TABS[i + 1].key], ['range', 'hub']); assert(/\S/.test(T.TABS[i].emoji), 'emoji'); eq(T.TABS[i].aria, 'Reciprocity Hub');
    assert(T.TABS.filter((t) => t.aria).length === 1, 'only the shortened label needs a spoken name');
  });
  await test('every label is short enough for six tabs on the narrowest phone (320px gives 53px each, so 7 characters at most), and the bar is six columns on phones and six rows on the desktop rail', () => {
    for (const t of T.TABS) assert(t.label.length <= 7, t.label + ' is too long for six tabs'); assert(320 / T.TABS.length >= 44, 'tabs are at least 44px wide at 320px');
    const css = read('src/shell/tabShell.css'); assert(/grid-template-columns: repeat\(6, 1fr\)/.test(css) && /grid-template-rows: repeat\(6, 76px\)/.test(css) && !/repeat\(5/.test(css), 'six tracks everywhere');
  });
  await test('the States tab is current while the Reciprocity Hub is open, and every other rule is unchanged (a panel that is open wins; the default is Home)', () => {
    eq(T.currentTab({ journalOpen: false, walletOpen: false, hubOpen: false, armoryOpen: false, reciprocityOpen: true }), 'reciprocity'); eq(T.currentTab({ journalOpen: false, walletOpen: false, hubOpen: false, armoryOpen: false }), 'home');
    eq(T.currentTab({ journalOpen: true, walletOpen: false, hubOpen: false, armoryOpen: false, reciprocityOpen: true }), 'range'); eq(T.currentTab({ journalOpen: false, walletOpen: true, hubOpen: false, armoryOpen: false }), 'wallet'); eq(T.currentTab({ journalOpen: false, walletOpen: false, hubOpen: true, armoryOpen: false }), 'hub');
  });
  await test('tapping States opens the existing Reciprocity Hub (and a second tap closes it), closes the Vault, journal and Hub sheet first, and tapping any other tab closes the Hub again', () => {
    const c = code('src/shell/tabShell.ts'); const at = c.indexOf("if (key === 'reciprocity')"); assert(at > 0, 'handler'); const h = c.slice(at, c.indexOf('return; }', at) + 9);
    assert(/closeSheet\(\)/.test(h) && /\.vault-close, \.rj-close/.test(h) && /toggleReciprocityHubModal\?\.\(!reciprocityOpen\(\)\)/.test(h), 'closes others, then toggles'); assert(/key !== 'reciprocity' && reciprocityOpen\(\)\) w\.toggleReciprocityHubModal\?\.\(false\)/.test(c), 'other tabs close it');
    assert(/getElementById\('reciprocityHubModal'\)/.test(c) && /display !== 'none'/.test(c), 'knows whether it is open from the page'); assert(/reciprocityOpen: reciprocityOpen\(\) \}\)/.test(c), 'the highlight is fed by the real open state');
  });
  await test('it only opens something that already exists (the site\'s own Reciprocity Hub), adds no new screen, request, storage or HTML, and the Hub menu still has its own Reciprocity item', () => {
    const c = code('src/shell/tabShell.ts'); assert(!/fetch\(|localStorage|sessionStorage|innerHTML|callFifsBackend/.test(c), 'nothing sensitive'); assert(T.HUB_ITEMS.some((i) => i.key === 'recip'), 'Hub entry unchanged');
    assert(/aria-label', t\.aria|setAttribute\('aria-label', t\.aria\)/.test(c), 'spoken name applied'); assert(/getComputedStyle\(m\)/.test(c), 'reads state, does not guess');
  });
  await test('the public bottom bar (signed out) is untouched: still five tabs', () => {
    assert(/exactly five/i.test(read('scripts/test_public_nav.js')) && !/States|reciprocity/i.test(read('src/shell/publicNavLogic.ts').split('ITEMS')[1].slice(0, 700)), 'public bar unchanged');
  });
  console.log(`\nStates tab: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
