/**
 * TrainWithFIFS - the wide-screen hero (offline)
 * The wide picture is a small file served from the site itself, only wide screens use it, the old tall picture and HUD stay for phones, every light is placed in the picture's own
 * units, and everything that moves is transform/opacity only and switched off for reduced motion.
 */
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0, failed = 0;
const test = (n, f) => { try { f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const CSS = read('src/animations/heroWide.css'), TSX = read('src/animations/HeroWide.tsx'), PAGE = read('src/app/page.tsx'), LAYOUT = read('src/app/layout.tsx');

test('the wide picture is a small WebP kept on the site itself (not on a third-party host), 1376 x 768', () => {
  const f = path.join(ROOT, 'public/hero/fifs-hero-wide.webp'); assert(fs.existsSync(f), 'file missing'); const b = fs.readFileSync(f);
  assert(b.length < 150 * 1024, 'too heavy for a hero picture: ' + b.length); assert(b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP', 'not a WebP');
  const w = b.readUInt16LE(26) & 0x3fff, h = b.readUInt16LE(28) & 0x3fff; assert(w === 1376 && h === 768, `size ${w}x${h}`); assert(/url\(\/hero\/fifs-hero-wide\.webp\)/.test(CSS) && !/googleusercontent|drive\.google/.test(CSS + TSX), 'local path only');
});
test('only 900px and wider uses it: the tall picture, its overlay and the HUD layer are hidden there and untouched below; wide screens preload it, phones do not', () => {
  assert(/@media \(min-width: 900px\) \{[\s\S]*\.hero-bg-layer > \.hero-bg-artwork, \.hero-bg-layer > \.hero-holo-overlay-svg, \.hero-bg-layer > \.hud-layer \{ display: none !important; \}/.test(CSS), 'old art hidden on wide screens');
  assert(/^\.hw \{ display: none; \}/m.test(CSS), 'the wide layer does not exist below 900px');
  assert(/<link rel="preload" as="image" href="\/hero\/fifs-hero-wide\.webp" media="\(min-width: 900px\)"/.test(LAYOUT), 'preload only for wide screens');
  assert(/<HeroWide \/>\s*<img alt="Future Initiative Firearms Training Background" className="hero-bg-artwork"/.test(PAGE) && /<HudIntro \/>/.test(PAGE), 'old picture and HUD still rendered for phones');
});
test('one scale number places everything: picture and lights use the same cover maths, and the page text is pushed below the wordmark with it', () => {
  assert(/--hw-s: max\(calc\(100vw \/ 1376\), min\(calc\(100vh \/ 768\), calc\(100vw \/ 1100\)\)\)/.test(CSS) && /--hero-title-bottom: calc\(334 \* var\(--hw-s\)\)/.test(CSS), 'scale + title clearance');
  assert(/\.hw-art \{[^}]*left: calc\(50% - 688 \* var\(--hw-s\)\); width: calc\(1376 \* var\(--hw-s\)\); height: calc\(768 \* var\(--hw-s\)\)/.test(CSS), 'picture placement');
  assert(/\.hw-o \{[^}]*left: calc\(50% \+ \(var\(--x\) - 688\) \* var\(--hw-s\)\); top: calc\(var\(--y\) \* var\(--hw-s\)\)/.test(CSS), 'light placement');
});
test('the centre of every light is on the picture (1376 x 768), the layer is hidden from screen readers and takes no clicks', () => {
  const boxes = [...TSX.matchAll(/'--x' as string\]: (\d+), \['--y' as string\]: (\d+), \['--w' as string\]: (\d+), \['--h' as string\]: (\d+)/g)].map((m) => m.slice(1).map(Number)); assert(boxes.length >= 7, 'lights found: ' + boxes.length);
  for (const [x, y, w, h] of boxes) assert(x >= 0 && x <= 1376 && y >= 0 && y <= 768 && w <= 700 && h <= 700, `light at ${x},${y} ${w}x${h} is off the picture`);
  assert(/className="hw" aria-hidden="true"/.test(TSX) && /\.hw \{ display: block; position: absolute; inset: 0; overflow: hidden; pointer-events: none; \}/.test(CSS), 'hidden + click-through');
});
test('motion is safe: only transform and opacity change, nothing runs without the no-preference check, and it pauses with the rest of the HUD', () => {
  const frames = CSS.match(/@keyframes hw\w+ \{[^\n]*\}/g) || []; assert(frames.length >= 8, 'keyframes: ' + frames.length);
  for (const f of frames) { const props = [...f.matchAll(/([a-z-]+):/g)].map((m) => m[1]).filter((p) => !['from', 'to'].includes(p)); for (const p of props) assert(['transform', 'opacity', 'left'].indexOf(p) >= 0 && p !== 'left', `${f.slice(0, 20)} animates ${p}`); }
  const anim = CSS.slice(CSS.indexOf('@media (min-width: 900px) and (prefers-reduced-motion: no-preference)')); assert(/animation: hwBreath/.test(anim) && /animation: hwSpin/.test(anim) && /animation: hwPing/.test(anim), 'animations live inside the no-preference block');
  assert(!/animation:/.test(CSS.slice(0, CSS.indexOf('@media (min-width: 900px) and (prefers-reduced-motion: no-preference)'))), 'no animation outside it'); assert(/html\[data-hud-paused\] \.hw/.test(CSS), 'pauses with the tab');
});
test('the page text on wide screens is centred (the command box and motto were stuck to the left) and the box is softened; tall iPads fill the screen too', () => {
  assert(/#hero-landing \.hero-top-hud, #hero-landing \.hero-command-dock \{ margin-left: auto; margin-right: auto; \}/.test(CSS) && /\.hero-command-dock \{ border-radius: 18px !important; background: linear-gradient/.test(CSS), 'centred + softened');
  assert(/@media \(min-width: 601px\) and \(max-width: 899px\) \{ \.hero-bg-artwork \{ object-fit: cover; \} \}/.test(CSS), 'upright iPads');
});
console.log(`\nHero wide: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
