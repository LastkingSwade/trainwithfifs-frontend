// Guard rules for the boot-sequence intro (src/boot/*): timing budget, brand colours, first-visit-only gating, skip, reduced motion, fail-safes.
const fs = require('fs'); const path = require('path');
const R = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CFG = R('src/boot/bootConfig.ts'), COMP = R('src/boot/BootIntro.tsx'), CSS = R('src/boot/boot.css').replace(/\/\*[\s\S]*?\*\//g, ''), LAYOUT = R('src/app/layout.tsx'), HUD = R('src/animations/HudIntro.tsx');
let passed = 0, failed = 0;
function test(n, f) { try { f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
const num = (k) => Number((CFG.match(new RegExp(k + ':\\s*(\\d+)')) || [])[1]);
console.log('\n[boot intro]');
test('Timing: every value is a constant in bootConfig.ts, the sequence always plays to the end with no ceiling, the fail-safe is far above it, and the text matches the spec', () => {
  const A = 'Access Granted'.length, D = ' .....'.length, L = 'Loading Future Initiative Training Grounds'.length, W = 'Welcome Agent'.length;
  const total = num('blankMs') + A * num('accessMsPerChar') + D * num('dotMsPerChar') + num('holdAfterAccessMs') + L * num('loadingMsPerChar') + num('holdAfterLoadingMs') + num('clearMs') + W * num('welcomeMsPerChar') + num('holdAfterWelcomeMs') + num('glitchMs') + num('dissolveMs') + num('crtMs') + num('fadeMs');
  assert(total >= 7000 && total <= 11000, 'default total is ' + total + ' ms');
  assert(!/maxTotalMs|minRunMs/.test(CFG + COMP), 'no ceiling may cut the sequence short');
  assert(num('failsafeMs') >= total * 2, 'fail-safe must sit far above the sequence');
  assert(num('blankMs') >= 1000 && num('blankMs') <= 3000, 'the blinking-cursor beat should be a few seconds');
  assert(/BOOT_ACCESS = 'Access Granted'/.test(CFG) && /BOOT_DOTS = ' \.\.\.\.\.'/.test(CFG) && /BOOT_LOADING = 'Loading '/.test(CFG) && /BOOT_BRAND = 'Future Initiative Training Grounds'/.test(CFG) && /BOOT_WELCOME = 'Welcome Agent'/.test(CFG), 'wording');
  assert(num('accessMsPerChar') >= 25 && num('accessMsPerChar') <= 60, 'typing speed out of range');
  assert(!/\b\d{3,4}\b/.test(COMP.replace(/\d+px/g, '').replace(/SCATTER[\s\S]*?\];/, '')), 'BootIntro.tsx has a loose timing number');
});
test('The order is exact: blinking cursor, Access Granted with dots, Loading line, clear, Welcome Agent, glitch, dissolve, CRT switch-off, reveal', () => {
  const order = ['typeOut(accessText', 'typeOut(loadingText', "setPhase('welcome')", 'typeOut(BOOT_WELCOME', "setPhase('glitch')", "setPhase('dissolve')", "setPhase('crt')", 'finish(BOOT.fadeMs)'];
  let at = -1; for (const k of order) { const i = COMP.indexOf(k); assert(i > at, 'out of order or missing: ' + k); at = i; }
  assert(/loadingPlain/.test(COMP) && /className="boot-brand"/.test(COMP), 'only the business words get the brand class');
});
test('Colours: terminal text is plain light gray; only "Future Initiative Training Grounds" uses the business colour; the background is pure black; no green', () => {
  assert(/--boot-text:\s*#d9dde3/.test(CSS) && /--boot-color:\s*var\(--accent-cyan/.test(CSS), 'variables');
  assert(/\.boot-brand \{ color: var\(--boot-color\)/.test(CSS) && /\.boot-term \{[^}]*color: var\(--boot-text\)/.test(CSS), 'only the brand words are coloured');
  assert(!/\.boot-line[^{]*\{[^}]*color: var\(--boot-(color|accent)\)/.test(CSS), 'terminal lines must not be coloured');
  assert(/background: #000;/.test(CSS), 'background must be pure black');
  assert(!/#0f0\b|#00ff00|lime|green/i.test(CSS), 'a green slipped in');
});
test('Terminal look: left aligned monospace text with a blinking block cursor', () => {
  assert(/\.boot-term \{[^}]*text-align: left/.test(CSS) && /font-family: var\(--font-mono/.test(CSS) && /bootBlink 1s steps\(1, end\) infinite/.test(CSS) && /\.boot-cursor \{[^}]*background: var\(--boot-text\)/.test(CSS), 'terminal styling');
});
test('Glitch, dissolve and CRT switch-off exist and use only opacity and transform', () => {
  for (const k of ['bootJitter', 'bootSplitA', 'bootSplitB', 'bootDissolve', 'bootCrtSquash', 'bootCrtLine']) assert(CSS.includes('@keyframes ' + k), k + ' missing');
  assert(/\.phase-crt \.boot-screen \{ animation: bootCrtSquash/.test(CSS) && /scale\(1, 0\.006\)/.test(CSS), 'the picture must squash to a line');
});
test('The CRT look is tunable by CSS variables and uses only opacity and transform in its animations', () => {
  for (const v of ['--boot-glow-near', '--boot-glow-far', '--boot-scan-opacity']) assert(CSS.includes(v + ':'), v + ' missing');
  for (const m of CSS.matchAll(/@keyframes\s+(\w+)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g)) for (const d of m[2].matchAll(/([a-z-]+)\s*:/g)) assert(['opacity', 'transform', 'visibility', 'pointer-events'].includes(d[1]), `keyframes ${m[1]} animates ${d[1]}`);
  assert(/repeating-linear-gradient/.test(CSS) && /radial-gradient\(ellipse at center, transparent 55%/.test(CSS), 'scanlines or vignette missing');
});
test('Plays on every full page load: no stored flag anywhere; the gate checks the route, hashes, tokens, reduced motion and bots; it is a plain inline <head> script; a module-level guard stops a replay on route changes', () => {
  for (const k of ["pathname!=='/'", 'prefers-reduced-motion', 'access_token', 'lighthouse']) assert(CFG.includes(k), 'gate missing: ' + k);
  assert(!/localStorage|fifs_intro_seen|BOOT_FLAG/.test(CFG + COMP), 'the seen flag must be gone');
  assert(/^let introFinished = false;/m.test(COMP) && /introFinished \|\|/.test(COMP), 'module-level replay guard missing');
  assert(/<head>[\s\S]*<script dangerouslySetInnerHTML=\{\{ __html: BOOT_GATE_SCRIPT \}\} \/>[\s\S]*<\/head>/.test(LAYOUT), 'gate must be an inline script in <head>');
  assert(!/strategy="beforeInteractive"[^>]*>\s*\{BOOT_GATE_SCRIPT/.test(LAYOUT), 'next/script would run too late');
});
test('SSR safe: no browser APIs outside effects and handlers; the server renders only the static shell', () => {
  const body = COMP.split('export default function BootIntro')[1];
  const beforeEffect = body.split('useEffect(')[0];
  assert(!/window|document|localStorage|navigator/.test(beforeEffect), 'browser API used during render');
  assert(/useState\(true\)/.test(body) && /setActive\(false\)/.test(body), 'initial render must match for everyone');
});
test('Skip: click, tap, any key (including Escape) end it; the hint is shown; focus is never trapped', () => {
  assert(/addEventListener\('pointerdown', skip/.test(COMP) && /addEventListener\('keydown', skip\)/.test(COMP), 'skip listeners missing');
  assert(/Press any key to skip/.test(COMP) && /Tap to skip/.test(COMP));
  assert(!/tabIndex|autoFocus|focus\(\)/.test(COMP), 'must not take focus');
  assert(/aria-live="polite"/.test(COMP) && /role="status"/.test(COMP), 'text must be a live region');
});
test('Reduced motion: no boot is set, and every boot rule is behind prefers-reduced-motion: no-preference', () => {
  assert(/prefers-reduced-motion: no-preference\) \{[\s\S]*html\[data-boot\]/.test(CSS));
  assert(/^\.boot-intro \{ display: none; \}/m.test(CSS), 'overlay must be hidden by default');
});
test('Cannot get stuck: a timer in the gate script, a CSS-only backup, and the page keeps its layout (no layout shift)', () => {
  assert(/setTimeout\(function\(\)\{if\(d\.hasAttribute\('data-boot'\)\)/.test(CFG), 'gate timer missing');
  assert(/animation: bootFailsafe 0s linear 26s forwards/.test(CSS) && /animation: bootBackup 0s linear 26s forwards/.test(CSS), 'CSS backup missing');
  assert(/html\[data-boot="on"\] body \{ visibility: hidden/.test(CSS) && !/html\[data-boot[^{]*\{[^}]*display: none/.test(CSS), 'page must be hidden with visibility, not removed');
});
test('The existing animations wait for the intro: paused behind it, and the HUD intro waits for the hand-off event', () => {
  assert(/animation-play-state: paused !important/.test(CSS));
  assert(/fifs:boot-complete/.test(HUD) && /hasAttribute\('data-boot'\)/.test(HUD) && /bootDone/.test(HUD));
  assert(/removeAttribute\('data-boot'\);[\s\S]{0,200}dispatchEvent\(new Event\(BOOT_DONE_EVENT\)\)/.test(COMP), 'animations must start only after the overlay is gone');
  assert(!/Math\.random/.test(COMP + CSS + CFG), 'must be hand-authored');
});
console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
process.exit(failed ? 1 : 0);
