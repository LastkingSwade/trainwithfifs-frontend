/**
 * TrainWithFIFS - installed-app polish (offline checks)
 * Back button steps through screens instead of leaving the app; an Install button where the browser offers one; a "new version ready" notice the person chooses to act on;
 * iPhone launch screens; an offline page that returns by itself. Nothing private is cached, stored or sent.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const SCRIPT = read('public/scripts/TrainWithFIFS_scripts.js'), PAGE = read('src/app/page.tsx');

(async () => {
  console.log('\n[Back button]');
  const VH = require(path.join(ROOT, 'src/pwa/viewHistory.ts'));
  await test('a history step names its screen; anything missing or odd means home; depth is a small whole number', () => {
    eq(VH.viewOf({ fifsView: 'faq' }), 'faq'); eq(VH.viewOf({ fifsView: 'fi-portal', __NA: true }), 'fi-portal'); for (const bad of [null, undefined, {}, 'faq', 5, { fifsView: '' }, { fifsView: 'a b' }, { fifsView: '<x>' }, { fifsView: 'x'.repeat(41) }, { fifsView: 7 }]) eq(VH.viewOf(bad), 'home', JSON.stringify(bad));
    eq(VH.depthOf({ fifsDepth: 3 }), 3); for (const bad of [null, {}, { fifsDepth: -1 }, { fifsDepth: 1.5 }, { fifsDepth: '2' }, { fifsDepth: 99999 }]) eq(VH.depthOf(bad), 0, JSON.stringify(bad));
  });
  await test('every screen change adds one step (the page script and the page both report it), the in-app Back uses the same steps, the framework\'s own step data is kept, and nothing is stored or sent', () => {
    assert(/window\.fifsViewChanged\(tabId\); \/\/ one Back-button step per screen/.test(SCRIPT) && /window\.fifsViewChanged\('home'\);\s*\} catch \(err\) \{\s*console\.error\('Error in returnToHome:'/.test(SCRIPT), 'script hooks');
    assert(/fifsViewHistory\.canGoBack\(\)\) \{ window\.fifsViewHistory\.back\(\); return; \}/.test(SCRIPT) && /fifsViewHistory\?\.canGoBack\(\)/.test(PAGE) && /fifsViewChanged\('home'\)/.test(PAGE), 'in-app back + page hooks');
    const src = read('src/pwa/viewHistory.ts'); assert(/\.\.\.history\.state/.test(src) && /replaceState/.test(src) && /pushState/.test(src), 'keeps the framework step data'); assert(!/localStorage|sessionStorage|fetch\(|document\.cookie/.test(src), 'stores and sends nothing');
    assert(/installViewHistory\(\);/.test(PAGE) && /from "@\/pwa\/viewHistory"/.test(PAGE), 'installed once from the page');
  });

  await test('behaviour with a fake browser history: steps are added per screen, Back and Forward move between screens without adding steps, Back from home is left to the browser', () => {
    const calls = []; const entries = [{ state: { __NA: true } }]; let idx = 0; const listeners = {};
    const win = { addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); }, openAndSwitch: (v) => { calls.push('open:' + v); win.fifsViewChanged(v); }, returnToHome: () => { calls.push('home'); win.fifsViewChanged('home'); } };
    const hist = { get state() { return entries[idx].state; }, pushState(st) { entries.splice(idx + 1); entries.push({ state: st }); idx++; }, replaceState(st) { entries[idx].state = st; }, back() { if (idx > 0) { idx--; listeners.popstate.forEach((f) => f({ state: entries[idx].state })); } }, forward() { if (idx < entries.length - 1) { idx++; listeners.popstate.forEach((f) => f({ state: entries[idx].state })); } } };
    global.window = win; global.history = hist; global.location = { href: 'https://x.test/' }; const file = require.resolve(path.join(ROOT, 'src/pwa/viewHistory.ts')); delete require.cache[file];
    try {
      const m = require(file); m.installViewHistory(); m.installViewHistory(); eq(listeners.popstate.length, 1, 'installed once'); assert(entries[0].state.__NA === true && entries[0].state.fifsView === 'home', 'the framework\'s data is kept');
      assert(!win.fifsViewHistory.canGoBack(), 'nothing to go back to at first'); win.fifsViewChanged('faq'); win.fifsViewChanged('faq'); win.fifsViewChanged('portal'); eq(entries.length, 3, 'one step per new screen, none for the same screen twice');
      assert(entries[2].state.__NA === true && entries[2].state.fifsView === 'portal' && entries[2].state.fifsDepth === 2, 'step data'); assert(win.fifsViewHistory.canGoBack(), 'can go back');
      win.fifsViewHistory.back(); eq(calls, ['open:faq'], 'Back shows the screen before'); eq(entries.length, 3, 'Back adds nothing'); win.fifsViewHistory.back(); eq(calls, ['open:faq', 'home']); assert(!win.fifsViewHistory.canGoBack(), 'at home: Back now belongs to the browser');
      hist.forward(); eq(calls[calls.length - 1], 'open:faq'); win.fifsViewChanged('booking'); eq(entries.length, 3, 'a new screen after Back replaces the forward steps'); eq(entries[2].state.fifsView, 'booking');
      for (const bad of [undefined, 5, '', 'a b', '<x>']) { const n = entries.length; win.fifsViewChanged(bad); eq(entries.length, n, 'ignored: ' + bad); }
    } finally { delete global.window; delete global.history; delete global.location; delete require.cache[file]; }
  });
  console.log(`\nPWA polish: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
