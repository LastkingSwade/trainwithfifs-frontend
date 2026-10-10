// Guard rules for the boot-sequence intro (src/boot/*): timing budget, brand colours, first-visit-only gating, skip, reduced motion, fail-safes.
const fs = require('fs'); const path = require('path');
const R = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CFG = R('src/boot/bootConfig.ts'), COMP = R('src/boot/BootIntro.tsx'), CSS = R('src/boot/boot.css').replace(/\/\*[\s\S]*?\*\//g, ''), LAYOUT = R('src/app/layout.tsx'), HUD = R('src/animations/HudIntro.tsx');
let passed = 0, failed = 0;
function test(n, f) { try { f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
const num = (k) => Number((CFG.match(new RegExp(k + ':\\s*(\\d+)')) || [])[1]);
console.log('\n[boot intro]');
test('Timing: every value is a constant in bootConfig.ts, the sequence (title, ACCESS GRANTED, WELCOME AGENT) always plays to the end with no ceiling, and the fail-safe is far above it', () => {
  const title = 'FUTURE INITIATIVE FIREARM SERVICES'.length, granted = 'ACCESS GRANTED'.length;
  const welcome = 'WELCOME AGENT'.length;
  const total = num('blankMs') + title * num('typeMsPerChar') + num('holdAfterTitleMs') + granted * num('grantedMsPerChar') + num('holdAfterGrantedMs') + welcome * num('welcomeMsPerChar') + num('holdAfterWelcomeMs') + num('fadeMs');
  assert(total >= 3500 && total <= 5000, 'default total is ' + total + ' ms');
  assert(!/maxTotalMs|minRunMs/.test(CFG + COMP), 'no ceiling may cut the sequence short');
  assert(num('failsafeMs') >= total * 2.5, 'fail-safe must sit far above the sequence');
  assert(/BOOT_WELCOME = 'WELCOME AGENT'/.test(CFG) && /typeOut\(BOOT_WELCOME/.test(COMP) && COMP.indexOf('typeOut(BOOT_GRANTED') < COMP.indexOf('typeOut(BOOT_WELCOME'), 'WELCOME AGENT must be typed after ACCESS GRANTED');
  assert(num('typeMsPerChar') >= 30 && num('typeMsPerChar') <= 40, 'typing speed outside 30-40 ms');
  assert(!/\b\d{3,4}\b/.test(COMP.replace(/\d+px/g, '')), 'BootIntro.tsx has a loose timing number');
});
test('Colours come from the site variables (cyan for the title and cursor, amber for ACCESS GRANTED); the background is pure black; no hardcoded green', () => {
  assert(/--boot-color:\s*var\(--accent-cyan/.test(CSS) && /--boot-accent:\s*var\(--accent-amber/.test(CSS), 'brand variables not used');
  assert(/\.boot-title \{ color: var\(--boot-color\)/.test(CSS) && /\.boot-granted \{[^}]*color: var\(--boot-accent\)/.test(CSS), 'text colours not from the brand');
  assert(/background: #000;/.test(CSS), 'background must be pure black');
  assert(!/#0f0\b|#00ff00|lime|green/i.test(CSS), 'a green slipped in');
  assert((CSS.match(/color-mix\(in srgb, var\(--boot-(color|accent)\)/g) || []).length >= 6, 'glow, sweep and halo must be tinted from the variables');
});
test('The CRT look is tunable by CSS variables and uses only opacity and transform in its animations', () => {
  for (const v of ['--boot-glow-near', '--boot-glow-far', '--boot-scan-opacity', '--boot-flicker']) assert(CSS.includes(v + ':'), v + ' missing');
  for (const m of CSS.matchAll(/@keyframes\s+(\w+)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g)) for (const d of m[2].matchAll(/([a-z-]+)\s*:/g)) assert(['opacity', 'transform', 'visibility', 'pointer-events'].includes(d[1]), `keyframes ${m[1]} animates ${d[1]}`);
  assert(/repeating-linear-gradient/.test(CSS) && /radial-gradient\(ellipse at center, transparent 55%/.test(CSS) && /bootSweep 5s linear infinite/.test(CSS), 'scanlines, vignette or 5 s sweep missing');
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
  assert(/animation: bootFailsafe 0s linear 16s forwards/.test(CSS) && /animation: bootBackup 0s linear 16s forwards/.test(CSS), 'CSS backup missing');
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
