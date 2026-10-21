/**
 * TrainWithFIFS - the four FIFS secrets and the course-card reticle (offline)
 * Pure rules (grading, the par time, the random wait, the key words, never listening inside a text box), the console banner, and the structure that keeps them safe:
 * reduced motion, 44px targets, nothing stored but a best time, and an owner reference file.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const L = require(path.join(ROOT, 'src/secrets/logic.ts')); const K = require(path.join(ROOT, 'src/secrets/kernel.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

(async () => {
  console.log('\n[Tier 1: the Kernel signature]');
  await test('the banner names FIFS and Instructor Wade [The Kernel] and lists exactly the 4 universal safety rules', () => {
    const all = K.kernelLines().map((l) => l.text).join('\n'); assert(/FUTURE INITIATIVE FIREARM SERVICES/.test(all) && /Instructor Wade\s+\[ The Kernel \]/.test(all), 'names');
    eq(L.SAFETY_RULES.length, 4); for (const [i, r] of L.SAFETY_RULES.entries()) assert(all.includes(`${i + 1}. ${r}`), 'rule ' + (i + 1));
    assert(/loaded/i.test(L.SAFETY_RULES[0]) && /muzzle/i.test(L.SAFETY_RULES[1]) && /finger off the trigger/i.test(L.SAFETY_RULES[2]) && /beyond it/i.test(L.SAFETY_RULES[3]), 'the four classic rules');
  });
  await test('the banner prints once, uses styled console lines, and reads nothing from the visitor', () => {
    const logs = []; const g = global; const old = { w: g.window, i: console.info }; g.window = {}; console.info = (...a) => logs.push(a);
    try { K.printKernelBanner(); K.printKernelBanner(); } finally { console.info = old.i; g.window = old.w; }
    eq(logs.length, K.kernelLines().length, 'printed once'); assert(logs.every((a) => /^%c/.test(a[0]) && typeof a[1] === 'string'), 'styled');
    const src = read('src/secrets/kernel.ts'); assert(!/fetch\(|localStorage|document\.cookie|navigator\./.test(src), 'must not read or send anything');
  });

  console.log('\n[Tier 2: Night-Ops]');
  await test('"fifs" and "nvg" are recognised (any case), inside the time limit, and nothing else is', () => {
    const m = L.createSequenceMatcher({ ops: 'fifs', ops2: 'nvg' }); const feed = (s, t0 = 0, gap = 100) => { let r = null; [...s].forEach((c, i) => { r = m.feed(c, t0 + i * gap) || r; }); return r; };
    eq(feed('fifs'), 'ops'); eq(feed('NVG', 1000), 'ops2'); eq(feed('hello fifs there', 5000), 'ops'); eq(feed('fif', 9000), null); eq(feed('s', 9000 + 5000), null, 'too slow between letters');
    m.reset(); eq(feed('fis'), null); eq(feed('ff', 20000), null);
    eq(m.feed('Shift', 30000), null); eq(m.feed('', 30001), null);
  });
  await test('it never listens inside a text box, a text area, a menu or an editable area', () => {
    for (const el of [{ tagName: 'INPUT' }, { tagName: 'textarea' }, { tagName: 'SELECT' }, { tagName: 'DIV', isContentEditable: true }, { tagName: 'DIV', getAttribute: () => 'true' }]) assert(L.isTypingTarget(el), JSON.stringify(el));
    for (const el of [null, undefined, {}, { tagName: 'DIV' }, { tagName: 'BUTTON' }, 'x']) assert(!L.isTypingTarget(el), String(el));
    const src = read('src/secrets/nightOps.ts'); assert(/e\.ctrlKey \|\| e\.metaKey \|\| e\.altKey \|\| e\.repeat/.test(src) && /typingInVisibleField\(e\.target\)/.test(src) && /terminalGatewayOverlay:not\(\.active\)/.test(src), 'browser shortcuts and held keys are ignored; the hidden terminal box does not count as typing');
  });
  await test('typing it again cycles off, green, red, off; Escape and the Exit button leave; the bar never blocks the page', () => {
    eq(['off', 'green', 'red'].map(L.nextOpsMode), ['green', 'red', 'off']); const ui = read('src/secrets/nightOps.ts'), css = read('src/secrets/secrets.css');
    assert(/key === 'Escape' && mode !== 'off'/.test(ui) && /fifs-ops-exit/.test(ui), 'a way out'); assert(/#fifs-ops-tint \{[^}]*pointer-events: none/.test(css) && /mix-blend-mode: hue/.test(css), 'tint does not intercept taps');
    assert(/#fifs-ops-exit \{ min-width: 44px; min-height: 44px/.test(css) && /min-height: 44px; padding: 0 12px calc\(env\(safe-area-inset-bottom/.test(css), '44px targets'); assert(!/localStorage|sessionStorage|fetch\(/.test(ui), 'nothing stored or sent');
  });

  console.log('\n[Tier 3: Shot Timer]');
  await test('grades: 0.60 s or faster is Grandmaster, within the 1.25 s par is Maryland Qualified, slower needs dry-fire practice', () => {
    eq(L.PAR_MS, 1250); eq(L.gradeShot(180).label, 'Grandmaster'); eq(L.gradeShot(600).label, 'Grandmaster'); eq(L.gradeShot(601).label, 'Maryland Qualified'); eq(L.gradeShot(1250).label, 'Maryland Qualified');
    eq(L.gradeShot(1251).label, 'Needs Dry-Fire Practice'); eq(L.gradeShot(9999).key, 'dryfire'); eq(L.formatSeconds(873), '0.87 s'); eq(L.formatSeconds(-5), '0.00 s');
  });
  await test('the standby wait is always between 1.5 and 3.5 seconds', () => {
    eq(L.randomStandbyMs(() => 0), 1500); eq(L.randomStandbyMs(() => 0.999999), 3500); eq(L.randomStandbyMs(() => 5), 3500); eq(L.randomStandbyMs(() => -1), 1500);
    for (let i = 0; i < 500; i++) { const v = L.randomStandbyMs(); assert(v >= 1500 && v <= 3500, String(v)); }
  });
  await test('three quick clicks open it; two, or three slow ones, do not', () => {
    const t = L.createTripleClick(650); eq([t.click(0), t.click(200), t.click(400)], [false, false, true]); eq([t.click(1000), t.click(1200)], [false, false]); eq(t.click(2500), false, 'a slow third click is not enough'); eq([t.click(2600), t.click(2700)], [false, true]);
  });
  await test('structure: footer badge is the trigger, false starts and Escape are handled, the beep can be muted, only a best time is kept, targets are 44px', () => {
    const ui = read('src/secrets/shotTimer.ts'), css = read('src/secrets/secrets.css');
    assert(/createTripleClick/.test(ui) && /id="fifs-badge"/.test(ui) && /openShotTimer\(badge\)/.test(ui), 'footer badge opens it'); assert(/state === 'standby'\) \{[^}]*state = 'false'/.test(ui), 'false start'); assert(/key === 'Escape'/.test(ui) && /aria-pressed/.test(ui), 'escape + mute');
    assert(/localStorage\.setItem\(BEST/.test(ui) && (ui.match(/localStorage\./g) || []).length === 2 && !/fetch\(/.test(ui), 'only the best time, only locally'); assert(/\.shot-head button \{ min-width: 44px; min-height: 44px/.test(css) && /\.shot-pad \{ width: 100%; min-height: 96px/.test(css), 'touch sizes');
    assert(!/@keyframes/.test(css) && !/animation:/.test(css), 'no flashing animation: the BEEP is one colour change');
  });

  console.log('\n[Tier 4: Off-Paper 404]');
  await test('the 404 page exists, is not indexed, links back to the firing line and the course roster, and is an accessible target', () => {
    const nf = read('src/app/not-found.tsx'), op = read('src/secrets/OffPaper.tsx');
    assert(/export default function NotFound/.test(nf) && /robots: \{ index: false/.test(nf), 'not-found page'); assert(/Return to the firing line/.test(op) && /href="\/"/.test(op) && /href="\/#enrollment"/.test(op) && /Course roster/.test(op), 'ctas');
    assert(/role="status" aria-live="polite"/.test(op) && /role="img"/.test(op) && /onKeyDown=\{key\}/.test(op) && /MSP FORM 29-14/.test(op) && /off-paper/i.test(op), 'live status, keyboard, theme');
  });
  await test('the shot starts off paper; each click moves it; it reaches the paper and then the center; the screen text follows', () => {
    const O = L; const start = { x: 478, y: 96 };
    assert(!O.onPaper(start) && !O.zeroed(start) && /off-paper/.test(O.statusFor(start)), 'starts off paper'); const mid = { x: 300, y: 100 }; assert(O.onPaper(mid) && !O.zeroed(mid) && /On paper/.test(O.statusFor(mid)), 'on paper');
    const center = { x: 260, y: 205 }; assert(O.zeroed(center) && /Zeroed/.test(O.statusFor(center)), 'zeroed'); let h = { ...start }; let n = 0; while (!O.zeroed(h) && n < 60) { h = { x: h.x + Math.sign(260 - h.x) * Math.min(28, Math.abs(260 - h.x)), y: h.y + Math.sign(205 - h.y) * Math.min(28, Math.abs(205 - h.y)) }; n++; } assert(O.zeroed(h) && n <= 14, 'reachable in a few clicks: ' + n);
  });

  console.log('\n[Reticle, wiring and the owner reference]');
  await test('course cards get corner brackets on hover and keyboard focus, with motion only when allowed; the secrets are mounted once in the layout; globals.css is untouched', () => {
    const css = read('src/secrets/secrets.css'); assert(/\.tuition-card::before/.test(css) && /\.tuition-card:focus-within::before \{ opacity: 0\.9; \}/.test(css) && /hover: hover\) and \(pointer: fine\)/.test(css), 'reticle'); assert(/prefers-reduced-motion: no-preference/.test(css) && /prefers-reduced-motion: reduce/.test(css), 'reduced motion');
    const lay = read('src/app/layout.tsx'); eq((lay.match(/<Secrets \/>/g) || []).length, 1); assert(/secrets\/secrets\.css/.test(lay), 'css imported'); assert(/'use client'/.test(read('src/secrets/Secrets.tsx')) && /installSecrets\(\)/.test(read('src/secrets/Secrets.tsx')), 'client mount');
  });
  await test('EASTER_EGGS.md tells the owner how to trigger every secret, and how to leave each one', () => {
    const md = read('EASTER_EGGS.md'); for (const w of ['Kernel', 'fifs', 'nvg', 'Esc', 'Triple-click', 'FIFS badge', 'Grandmaster', 'Maryland Qualified', 'Needs Dry-Fire Practice', '1.25', 'missed-the-target', 'Return to the firing line']) assert(md.includes(w), 'missing in EASTER_EGGS.md: ' + w);
  });
  console.log(`\nSecrets: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
