/**
 * TrainWithFIFS - My FIFS sign-in, the Vault tab and the Range Journal card (offline)
 * My FIFS opens its own single sign-in (not the portal chooser) when nobody is signed in, and still goes straight to the portal when a login is saved. The tab that said Wallet says Vault
 * (its behaviour is unchanged). The Range Journal card is a large, colourful feature card instead of a small box.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const T = require(path.join(ROOT, 'src/shell/tabLogic.ts')); const N = require(path.join(ROOT, 'src/shell/publicNavLogic.ts')); const LA = require(path.join(ROOT, 'src/pwa/launch.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const code = (p) => read(p).replace(/\/\/.*$/gm, '');

(async () => {
  await test('the tab bar has exactly six tabs in order (the new States tab sits between Range and Hub), and the second one now says Vault (its key and what it opens are unchanged)', () => {
    eq(T.TABS.map((t) => t.key), ['home', 'wallet', 'armory', 'range', 'reciprocity', 'hub']); eq(T.TABS.map((t) => t.label), ['Home', 'Vault', 'Armory', 'Range', 'States', 'Hub']); assert(!/Wallet/.test(JSON.stringify(T.TABS)), 'no Wallet label left on the tabs');
    assert(/key === 'wallet'\) \{[^}]*w\.openWallet\?\.\(\)/.test(read('src/shell/tabShell.ts')), 'the Vault tab still opens the same screen'); assert(!/Wallet/.test(T.ARMORY_TEXT.body), 'tab copy says Vault');
  });
  await test('signed out, My FIFS opens its own sign-in window; with a saved student or client login it still goes to that portal', () => {
    eq(N.myFifsHref(null), '/?open=login'); eq(N.myFifsHref('student'), '/?open=student'); eq(N.myFifsHref('client'), '/?open=client');
    const nav = code('src/shell/PublicNav.tsx'); const at = nav.indexOf("item.key === 'myfifs'"); const blk = nav.slice(at, nav.indexOf('\n    }', at));
    assert(/snap\.portal === 'student'\) w\.openAndSwitch\('portal'\); else if \(snap\.portal === 'client'\) w\.openAndSwitch\('fi-portal'\)/.test(blk), 'saved login goes to its portal'); assert(/openMyFifsLogin\)? ?(=== 'function')?/.test(blk) && blk.indexOf('openMyFifsLogin') < blk.indexOf('openPortalSelectionModal'), 'login first, chooser only as a fallback');
  });
  await test('the address ?open=login opens the sign-in only when nobody is signed in, and the deep-link list stays exact words', () => {
    eq(LA.launchTarget('?open=login'), 'login'); eq(LA.launchTarget('?open=admin'), null); eq(LA.launchTarget('?open=staff'), null);
    const l = code('src/pwa/launch.ts'); assert(/t === 'login'\) \{ if \(!document\.body\.classList\.contains\('fifs-tabs-on'\) && typeof w\.openMyFifsLogin === 'function'\) w\.openMyFifsLogin\(\); \}/.test(l), 'guarded handler');
  });
  await test('the sign-in window reuses the header\'s single sign-in form, is a labelled dialog that closes with the button, Escape or a tap outside, keeps the keyboard inside, and gives focus back', () => {
    const m = code('src/shell/myFifsLogin.ts'); assert(/fifsRenderSignInPanel/.test(m), 'reuses the header form'); assert(/role', 'dialog'/.test(m) && /aria-modal/.test(m) && /aria-label', 'Sign in to My FIFS'/.test(m), 'dialog');
    assert(/e\.key === 'Escape'/.test(m) && /e\.target === overlay/.test(m) && /close\.addEventListener\('click', shut\)/.test(m), 'three ways to close'); assert(/e\.key !== 'Tab'/.test(m) && /last\.focus\(\)/.test(m) && /first\.focus\(\)/.test(m), 'focus kept inside'); assert(/prev\.focus/.test(m), 'focus returns');
    assert(/getElementById\('fifsMyLogin'\)\) return/.test(m), 'only one at a time'); assert(/overlay\.setAttribute\('data-organic', 'skip'\)/.test(m), 'opaque: the site glass script is told to skip this window');
  });
  await test('the window handles no passwords itself: no storage, network, HTML injection or logging (the header form does the sign-in with its own rules)', () => {
    const m = code('src/shell/myFifsLogin.ts'); assert(!/localStorage|sessionStorage|fetch\(|callFifsBackend|innerHTML|insertAdjacentHTML|console\.|document\.cookie|password/i.test(m), 'nothing sensitive handled here');
    assert(/installMyFifsLogin\(\)/.test(read('src/app/page.tsx')), 'installed');
  });
  await test('the sign-in window has a 48px close button, a visible focus ring, company colours, and fits a phone (16px side gutter, scrolls if short)', () => {
    const c = read('src/shell/myFifsLogin.css'); assert(/\.fml-close \{[^}]*min-width: 48px; min-height: 48px/.test(c), '48px'); assert(/\.fml-close:focus-visible \{ outline: 3px solid #00e5ff/.test(c), 'focus'); assert(/\.fml-overlay \{[^}]*padding: 16px/.test(c) && /\.fml-box \{[^}]*max-height: 92vh; overflow-y: auto/.test(c), 'phone fit'); assert(/#ffb703/.test(c) && /rgba\(0, 229, 255/.test(c), 'amber and cyan');
  });
  await test('the Range Journal card is a large feature card: big amber title, big icon, full-width 56px amber button on phones, set out in a row on wide screens; same text and same action as before', () => {
    const j = code('src/portal/rangeLauncher.ts'); assert(/rj-launch/.test(j) && /rj-launch-ico/.test(j) && /rj-launch-btn/.test(j), 'new classes'); assert(/openRangeJournal\?\.\(\)/.test(j), 'still opens the journal'); assert(/data-organic', 'skip'/.test(j), 'the glass-styling script leaves the card alone'); assert(/Private to you: staff cannot see it\./.test(j), 'privacy line kept');
    assert(!/innerHTML|insertAdjacentHTML/.test(j), 'text only'); const c = read('src/portal/rangeJournal.css'); assert(/\.rj-launch-btn \{[^}]*min-height: 56px/.test(c) && /\.rj-launch-btn \{[^}]*width: 100%/.test(c) && /:root:root \.pcard\.rj-launch \.rj-launch-btn \{/.test(c), 'big button'); assert(/\.rj-launch-btn \{[^}]*color: #111 !important[^}]*background: linear-gradient\(135deg, #ffb703/.test(c), 'dark text on the amber button, whatever the site button rule says'); assert(/\.rj-launch-text h3 \{[^}]*font-size: clamp\(1\.45rem[^}]*color: #ffb703/.test(c), 'big amber title');
    assert(/\.pcard\.rj-launch \{[^}]*border: 2px solid rgba\(255, 183, 3/.test(c) && /@container \(min-width: 640px\)/.test(c) && /\[data-range-journal-launch\] \{ container-type: inline-size; \}/.test(c), 'amber edge, and the layout follows the width of its own grid cell'); assert(/\.rj-launch-btn:focus-visible \{ outline: 3px solid #00e5ff/.test(c), 'focus'); assert(!/animation|transition/.test(c.slice(c.indexOf('The Range Journal card on the dashboards'))), 'nothing moves');
  });
  console.log(`\nMy FIFS login + Vault + journal card: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
