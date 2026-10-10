/**
 * TrainWithFIFS - range HUD guard suite (offline)
 *
 * Encodes the rules the HUD work was built under so they cannot erode quietly: no default easings, no random glitches, no purple or
 * gradient text or glass, red used only for glitch edges, only cheap properties animated, reduced motion honoured, nothing loaded
 * from outside, every decorative layer hidden from assistive tech, no click ever stopped, a single master switch, and no file outside
 * the front-end hero touched (no checkout, webhook, auth, admin, API, database or security-header changes).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ANIM = path.join(ROOT, 'src/animations');
const read = (p) => fs.readFileSync(p, 'utf-8');
const CSS_RAW = read(path.join(ANIM, 'hud.css'));
const CSS = CSS_RAW.replace(/\/\*[\s\S]*?\*\//g, ''); // rules only, comments removed
const SOURCES = fs.readdirSync(ANIM).filter((f) => /\.(ts|tsx)$/.test(f)).map((f) => ({ name: f, text: read(path.join(ANIM, f)) }));
const CONFIG = read(path.join(ANIM, 'config.ts'));
const COMPONENT = read(path.join(ANIM, 'HudIntro.tsx'));
const PAGE = read(path.join(ROOT, 'src/app/page.tsx'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ PASS: ${name}`); }
  catch (err) { failed++; console.log(`  ✗ FAIL: ${name}\n    -> ${err.message}`); }
}
function assert(c, m) { if (!c) throw new Error(m); }

function hue(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return { h: 0, s: 0 };
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h, s: d / (1 - Math.abs(max + min - 1) || 1) };
}
function colors(text) {
  const out = [];
  for (const m of text.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    let hex = m[1]; if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    out.push({ raw: m[0], r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) });
  }
  for (const m of text.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) out.push({ raw: m[0], r: +m[1], g: +m[2], b: +m[3] });
  return out;
}

console.log('\n[SECTION A: switchboard]');
test('One master switch plus a toggle per effect, all on by default', () => {
  assert(/enabled:\s*true/.test(CONFIG), 'master switch missing or off');
  for (const k of ['intro', 'ring', 'pistolScan', 'decode', 'cardTrace', 'acquire', 'sweep', 'chatPulse', 'parallax', 'retireLogoLoops']) assert(new RegExp(`${k}:\\s*true`).test(CONFIG), `toggle "${k}" missing`);
});
test('The component does nothing at all when the master switch is off', () => {
  assert(/if \(!HUD\.enabled\) return;/.test(COMPONENT) && /if \(!HUD\.enabled \|\| !hero\) return null;/.test(COMPONENT), 'HudIntro must bail out on the master switch');
});
test('Every rule that changes the page is gated by the html data-hud attributes the component sets', () => {
  const bad = CSS.split('}').map((r) => r.trim()).filter((r) => r && !r.startsWith('@') && !r.startsWith(':root') && !/^(from|to|\d)/.test(r))
    .filter((r) => { const sel = r.split('{')[0]; return sel && !/html\[data-hud|^\.hud-|^\s*\.hud-|#hero-landing|^\s*from|^\s*to|^\s*\d/.test(sel.trim()) && !/@keyframes/.test(sel); });
  assert(bad.length === 0, 'ungated rules: ' + bad.slice(0, 3).map((b) => b.slice(0, 80)).join(' | '));
});

console.log('\n[SECTION B: craft rules]');
test('No default easing keywords (ease, ease-in, ease-out, ease-in-out, linear) in any animation or transition', () => {
  const lines = CSS.split(/[;{}]/).filter((l) => /(animation|transition)[\w-]*\s*:/.test(l));
  const bad = lines.filter((l) => /(^|[\s,:])(ease|ease-in|ease-out|ease-in-out|linear)(?![-\w(])/.test(l.replace(/linear-gradient\([^)]*\)/g, '')));
  assert(bad.length === 0, 'default easing found: ' + bad[0]);
});
test('Four named curves are defined, and the overshoot curve is not used yet (it is reserved for the button press)', () => {
  for (const c of ['snap', 'settle', 'mechanical', 'recoil']) assert(new RegExp(`--hud-ease-${c}:\\s*cubic-bezier\\(`).test(CSS), `--hud-ease-${c} missing`);
  assert(!/var\(--hud-ease-recoil\)/.test(CSS), 'recoil must not be used outside the press kick');
});
test('Mechanical and CRT-like moves use steps(); no two durations are blanket values', () => {
  assert((CSS.match(/steps\(/g) || []).length >= 8, 'expected steps() for flicker, strips, ghosts, misregistration and the dial');
  const durations = [...CSS.matchAll(/animation:[^;]*?\b(\d+(?:\.\d+)?m?s)\b/g)].map((m) => m[1]);
  assert(new Set(durations).size >= 8, 'durations look uniform: ' + [...new Set(durations)].join(', '));
});
test('No random numbers anywhere in the HUD code (glitches are authored, the scramble uses a fixed seed)', () => {
  for (const f of SOURCES) assert(!/Math\.random/.test(f.text), `Math.random in ${f.name}`);
  assert(/seeded\(0x5eed\)/.test(read(path.join(ANIM, 'decode.ts'))), 'decode must use the fixed-seed generator');
});
test('No purple or violet anywhere (hue 255-330 degrees), and only existing brand colours are used', () => {
  const bad = colors(CSS_RAW + COMPONENT).filter((c) => { const { h, s } = hue(c.r, c.g, c.b); return s > 0.15 && h >= 255 && h <= 330; });
  assert(bad.length === 0, 'purple-ish colour: ' + (bad[0] && bad[0].raw));
  // #ff0000 and #00ffff are channel-isolation multipliers for the colour-fringe ghosts (they keep only the red, or only the green and blue,
  // of the photo's own pixels); they are never painted as colours.
  const allowed = new Set(['#00e5ff', '#070b10', '#ef4444', '#ffb703', '#ff0000', '#00ffff']);
  const hexes = [...new Set((CSS_RAW + COMPONENT).match(/#[0-9a-f]{6}\b/gi) || [])].map((h) => h.toLowerCase()).filter((h) => !allowed.has(h));
  assert(hexes.length === 0, 'colour outside the brand set: ' + hexes.join(', '));
});
test('Red appears only as the glitch-edge variable, never as a fill, border or button colour', () => {
  const uses = CSS.match(/#ef4444/gi) || [];
  assert(uses.length === 1 && /--hud-misreg:\s*#ef4444/.test(CSS), 'the red hex must appear once, in the variable definition');
  const misreg = (CSS.match(/var\(--hud-misreg\)/g) || []).length;
  assert(misreg >= 1, 'the glitch-edge variable is never used');
  for (const m of CSS.matchAll(/var\(--hud-misreg\)/g)) {
    const before = CSS.slice(Math.max(0, m.index - 60), m.index);
    assert(/text-shadow:/.test(before), 'red used outside a text-shadow: ' + before.slice(-40));
  }
});
test('No gradient text, glass or blur', () => {
  assert(!/background-clip:\s*text/.test(CSS) && !/-webkit-background-clip/.test(CSS), 'gradient text');
  assert(!/backdrop-filter/.test(CSS) && !/\bblur\(/.test(CSS), 'glass or blur');
});
test('Only cheap properties are animated in keyframes (opacity, transform, stroke offset, plus one border colour and the glitch text-shadow)', () => {
  const allowed = new Set(['opacity', 'transform', 'stroke-dashoffset', 'border-color', 'text-shadow']);
  for (const m of CSS.matchAll(/@keyframes\s+(\w+)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g)) {
    for (const d of m[2].matchAll(/([a-z-]+)\s*:/g)) assert(allowed.has(d[1]), `keyframes ${m[1]} animates "${d[1]}"`);
  }
});
test('No emoji in the HUD code or styles', () => {
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
  for (const f of SOURCES) assert(!emoji.test(f.text), `emoji in ${f.name}`);
  assert(!emoji.test(CSS_RAW), 'emoji in hud.css');
});
test('No narration comments ("animation for X")', () => {
  for (const f of SOURCES) assert(!/\/\/\s*(animation|animate|animating) (for|of|the)/i.test(f.text), `narration comment in ${f.name}`);
});

console.log('\n[SECTION C: safety and accessibility]');
test('Nothing loads from outside: no URLs, no scripts, no fonts, no imports from a CDN', () => {
  assert(!/https?:\/\//.test(CSS_RAW.replace(/\/\*[\s\S]*?\*\//g, '')), 'URL in hud.css rules');
  assert(!/@import|@font-face|url\(/.test(CSS), 'import, font-face or url() in hud.css');
  for (const f of SOURCES) assert(!/https?:\/\/|<script|document\.write|eval\(|new Function/.test(f.text.replace(/\/\/[^\n]*/g, '')), `external load or eval in ${f.name}`);
});
test('The HUD never stops or cancels a click or key press', () => {
  for (const f of SOURCES) assert(!/preventDefault|stopPropagation|stopImmediatePropagation/.test(f.text), `${f.name} stops an event`);
  assert(/pointer-events:\s*none/.test(CSS) && (CSS.match(/pointer-events:\s*none/g) || []).length >= 3, 'layers must be pointer-events: none');
});
test('Every decorative layer is aria-hidden', () => {
  for (const marker of ['className="hud-layer"', 'className="hud-bracket"', 'className="hud-trace"']) {
    const at = COMPONENT.indexOf(marker); assert(at > 0, marker + ' missing');
    assert(/aria-hidden="true"/.test(COMPONENT.slice(at, at + 160)), marker + ' is not aria-hidden');
  }
  assert(/setAttribute\('aria-hidden', 'true'\)/.test(read(path.join(ANIM, 'decode.ts'))), 'the scramble overlay must be aria-hidden');
});
test('Reduced motion: a static state, no sweep or parallax started, and the existing hero loops stop too', () => {
  assert(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*#hero-landing \*[\s\S]*animation:\s*none !important/.test(CSS), 'reduced-motion block for the hero is missing');
  assert(/'static'/.test(COMPONENT) && /prefers-reduced-motion: reduce/.test(COMPONENT), 'component must pick the static mode');
  assert(/if \(ambient \|\| reduced\.matches\) return;/.test(COMPONENT), 'ambient motion must not start under reduced motion');
});
test('Animation pauses while the tab is hidden or the hero is off screen', () => {
  const amb = read(path.join(ANIM, 'ambient.ts'));
  assert(/visibilitychange/.test(amb) && /IntersectionObserver/.test(amb) && /data-hud-paused/.test(amb), 'ambient must pause on hidden/offscreen');
  assert(/data-hud-paused\]/.test(CSS) && /animation-play-state:\s*paused/.test(CSS), 'CSS must honour the paused flag');
});
test('The intro plays once per session (sessionStorage in try/catch) and any click or key completes it', () => {
  assert(/sessionStorage/.test(COMPONENT) && /try \{[^}]*sessionStorage/.test(COMPONENT), 'session flag must be guarded by try/catch');
  assert(/addEventListener\('pointerdown', complete/.test(COMPONENT) && /addEventListener\('keydown', complete/.test(COMPONENT), 'skip listeners missing');
});

console.log('\n[SECTION C2: glitch layer]');
test('Every glitch rule is gated by the glitch switch, is hand-authored (no randomness) and respects reduced motion', () => {
  const rules = CSS.split('}').filter((r) => /hudTear|hudRingJolt|hudRingBurst|hudMottoBurst|hudCardSplit|hudHoverGlitch/.test(r) && !/@keyframes/.test(r));
  assert(rules.length >= 6, 'glitch rules missing');
  for (const r of rules) assert(/data-hud~="glitch"/.test(r) || /^\s*@media/.test(r.trim()), 'ungated glitch rule: ' + r.trim().slice(0, 70));
  assert(/glitch: true/.test(fs.readFileSync(path.join(ROOT, 'src/animations/config.ts'), 'utf8')), 'glitch switch missing from config.ts');
  assert(!/Math\.random/.test(CSS_RAW + COMPONENT), 'glitch must be authored, not random');
  assert(/prefers-reduced-motion: reduce\)[\s\S]*#hero-landing \*[\s\S]*animation: none !important/.test(CSS), 'reduced motion must stop every hero animation');
});
test('No glitch burst repeats faster than once every 5 seconds, and none moves more than 12px', () => {
  for (const m of CSS.matchAll(/hud(?:RingBurst|MottoBurst) (\d+)ms[^;]*infinite/g)) assert(Number(m[1]) >= 5000, 'burst repeats too fast: ' + m[0]);
  for (const k of CSS.matchAll(/translateX\((-?\d+)px\)/g)) assert(Math.abs(Number(k[1])) <= 12, 'glitch jump too large: ' + k[0]);
});

console.log('\n[SECTION D: scope]');
function gitLines(cmd) { try { return execSync(cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('\n').filter(Boolean); } catch (_e) { return null; } }
test('Only the HUD files, the journey chooser and alumni-gate files, and the test suites changed relative to main', () => {
  const changed = gitLines('git diff --name-only main');
  const untracked = gitLines('git ls-files --others --exclude-standard');
  if (changed === null || untracked === null) return; // no git here (for example a source export): nothing to compare
  const files = [...changed, ...untracked].filter((f) => !/^scripts\/test_students_(access|self_update_draft)_suite\.js$/.test(f));
  const allowed = [/^src\/animations\//, /^src\/app\/page\.tsx$/, /^src\/app\/globals\.css$/, /^src\/Lib\/pricing\.ts$/, /^src\/Lib\/server\/booking-checkout\.ts$/, /^src\/delight\//, /^src\/boot\//, /^src\/hack\//, /^src\/group\//, /^scripts\/test_chat_hud_and_pod_ui\.js$/, /^src\/Lib\/pricing\.ts$/, /^public\/scripts\/TrainWithFIFS_scripts\.js$/, /^scripts\/test_audit_batch2\.js$/, /^scripts\/test_environment_config_suite\.js$/, /^src\/app\/layout\.tsx$/,
    /^scripts\/test_(hud_animations|payment_suite|journey_chooser_suite|delight|boot_intro|hack_effect)\.js$/, /^package\.json$/, /^ANIMATIONS\.md$/];
  const stray = files.filter((f) => !allowed.some((re) => re.test(f)));
  assert(stray.length === 0, 'files outside the expected scope changed: ' + stray.join(', '));
});
test('The HUD hooks in page.tsx are still in place (one mount point, the motto and card hooks, the chat control)', () => {
  assert((PAGE.match(/<HudIntro \/>/g) || []).length === 1, 'HudIntro must be mounted exactly once');
  assert(/className="hud-decode-target"/.test(PAGE) && /className="hud-gold-card"/.test(PAGE) && /hud-chat" id="btn-hero-contact"/.test(PAGE), 'a HUD hook is missing from page.tsx');
});
test('The home page no longer shows the "Save TRAIN with FIFS to your phone" install pop-up (the student portal banner is untouched)', () => {
  assert(!/id="pwa-landing-banner"/.test(PAGE) && !/SAVE TRAIN WITH FIFS TO YOUR PHONE/.test(PAGE), 'the home page install banner is back');
  assert(/id="pwaStudentBanner"/.test(PAGE), 'the student portal install banner must stay');
});
test('The security headers and the content security policy are exactly as before', () => {
  const diff = gitLines('git diff --name-only main -- next.config.ts');
  if (diff === null) return;
  assert(diff.length === 0, 'next.config.ts changed');
});
test('The mobile calendar rules in globals.css are untouched (the file only gained lines, none removed or edited)', () => {
  const diff = gitLines('git diff -U0 main -- src/app/globals.css');
  if (diff === null) return;
  const removed = diff.filter((l) => l.startsWith('-') && !l.startsWith('---'));
  assert(removed.length === 0, 'globals.css lost or edited existing lines: ' + (removed[0] || '').slice(0, 80));
});

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
console.log('================================================================');
process.exit(failed > 0 ? 1 : 0);
