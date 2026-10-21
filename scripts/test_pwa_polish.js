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
  console.log('\n[Install button]');
  const IP = require(path.join(ROOT, 'src/pwa/installPrompt.ts'));
  await test('the button shows only when the browser can install it or on an iPhone/iPad, and never in the installed app', () => {
    eq(IP.installOffer({ standalone: false, hasPrompt: true, ios: false }), 'prompt'); eq(IP.installOffer({ standalone: false, hasPrompt: false, ios: true }), 'ios'); eq(IP.installOffer({ standalone: false, hasPrompt: false, ios: false }), 'none', 'no install possible');
    eq(IP.installOffer({ standalone: true, hasPrompt: true, ios: true }), 'none', 'already installed'); eq(IP.installOffer({ standalone: false, hasPrompt: true, ios: true }), 'prompt', 'the real prompt wins over the instructions');
  });
  await test('iPhone, iPod, iPad and touch-screen "Mac" iPads are recognised; Macs, Windows and Android are not', () => {
    for (const [ua, pf, tp] of [['Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)', 'iPhone', 5], ['Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X)', 'iPad', 5], ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 5]]) assert(IP.isIos(ua, pf, tp), ua);
    for (const [ua, pf, tp] of [['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 0], ['Mozilla/5.0 (Windows NT 10.0)', 'Win32', 0], ['Mozilla/5.0 (Linux; Android 14)', 'Linux armv8l', 5], ['', '', 0], [undefined, undefined, undefined]]) assert(!IP.isIos(ua, pf, tp), String(ua));
    eq(IP.IOS_STEPS.length, 3); assert(/Share/.test(IP.IOS_STEPS[0]) && /Add to Home Screen/.test(IP.IOS_STEPS[1]), 'the two taps Apple needs');
  });
  await test('wiring: the browser prompt is captured and used on tap, the button and help card are real 44px+ controls drawn without innerHTML, hidden in the installed app, stores nothing', () => {
    const src = read('src/pwa/installPrompt.ts'), css = read('src/pwa/pwa.css'), reg = read('src/pwa/ServiceWorkerRegister.tsx'); const code = src.replace(/\/\/.*$/gm, '');
    assert(/'beforeinstallprompt'[\s\S]*e\.preventDefault\(\); deferred = e/.test(src) && /await p\.prompt\(\); await p\.userChoice/.test(src) && /'appinstalled'/.test(src), 'prompt captured, used, cleared'); assert(!/innerHTML/.test(code) && !/localStorage|sessionStorage|fetch\(/.test(code), 'safe DOM, nothing stored');
    assert(/\.fifs-install \{[^}]*min-height: 44px/.test(css) && /\.fifs-install-help button \{ min-height: 44px/.test(css) && /display-mode: standalone\) \{ \.fifs-install, \.fifs-install-help \{ display: none; \}/.test(css), 'touch size + hidden when installed');
    assert(/installInstallPrompt\(\)/.test(reg) && /import '\.\/pwa\.css'/.test(reg), 'mounted from the layout component'); assert(/key === 'Escape'|\.key === 'Escape'/.test(src), 'Escape closes the help card');
  });
  console.log('\n[New version notice]');
  const UN = require(path.join(ROOT, 'src/pwa/updateNotice.ts'));
  await test('the notice is offered only when an older version is already running and a newer one is installed or waiting; checks are at most every 30 minutes', () => {
    assert(UN.shouldOffer(true, 'installed') && UN.shouldOffer(true, 'waiting'), 'offered'); assert(!UN.shouldOffer(false, 'installed') && !UN.shouldOffer(true, 'installing') && !UN.shouldOffer(true, 'activated') && !UN.shouldOffer(true, 'redundant'), 'first install and other states stay quiet');
    eq(UN.CHECK_EVERY_MS, 1800000); assert(UN.dueForCheck(0, 1800000) && !UN.dueForCheck(1000, 1800999) && UN.dueForCheck(1000, 1801000) && UN.dueForCheck(NaN, 5), 'timing');
  });
  await test('nothing reloads by itself: the worker only takes over on the person\'s tap (SKIP_WAITING), the notice can be dismissed, it is a real 44px control, and it is drawn without innerHTML', () => {
    const un = read('src/pwa/updateNotice.ts'), reg = read('src/pwa/ServiceWorkerRegister.tsx'), sw = read('public/sw.js'), css = read('src/pwa/pwa.css'); const code = un.replace(/\/\/.*$/gm, '');
    assert(/go\.addEventListener\('click'[\s\S]*postMessage\(\{ type: 'SKIP_WAITING' \}\)/.test(un) && /controllerchange', \(\) => location\.reload\(\), \{ once: true \}/.test(un), 'reload only after the tap'); assert(!/skipWaiting/.test(reg) && !/location\.reload/.test(reg), 'the register code never forces it');
    assert(/data\.type === 'SKIP_WAITING'\) \{ self\.skipWaiting\(\); return; \}/.test(sw), 'worker waits for the message'); assert(!/self\.skipWaiting\(\);\s*\n?\}\);?\s*\nself\.addEventListener\('activate'/.test(sw) && (sw.match(/skipWaiting/g) || []).length === 1, 'skipWaiting only inside the message handler');
    assert(!/innerHTML/.test(code) && /role', 'status'/.test(un) && /\.fifs-update button \{ min-height: 44px/.test(css), 'safe DOM, announced, 44px');
    assert(/registered\.addEventListener\('updatefound'/.test(reg) && /registered\.waiting && shouldOffer/.test(reg) && /visibilityState === 'visible' && dueForCheck/.test(reg), 'detects a new version at load, while open, and when the app is brought back');
  });
  console.log(`\nPWA polish: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
