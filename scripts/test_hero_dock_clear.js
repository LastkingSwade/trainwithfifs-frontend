/**
 * TrainWithFIFS - the home page action buttons sit on no frosted glass (offline)
 * The panel behind the buttons at the bottom of the first screen loses its blur and its see-through fill, and nothing else about it or its buttons changes.
 */
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const css = read('src/polish/heroDockClear.css').replace(/\/\*[\s\S]*?\*\//g, '');

(async () => {
  await test('the panel loses its blur (both spellings) and its fill, each with !important so the site\'s older and newer panel rules cannot bring them back', () => {
    const m = /html body #hero-landing \.hero-command-dock \{([^}]*)\}/.exec(css); assert(m, 'rule'); const b = m[1];
    assert(/(^|[; ])backdrop-filter: none !important/.test(b) && /-webkit-backdrop-filter: none !important/.test(b), 'blur removed'); assert(/background: transparent !important/.test(b) && /background-image: none !important/.test(b), 'fill removed'); assert(/box-shadow: none !important/.test(b), 'glow removed');
  });
  await test('the rule outranks every rule that styles this panel (an id plus classes beats the site\'s !important panel rules)', () => {
    assert(/^html body #hero-landing \.hero-command-dock/m.test(css), 'id-based selector'); assert(css.trim().split('}').filter(Boolean).length === 1, 'exactly one rule, nothing else restyled');
  });
  await test('nothing else changes: no size, spacing, position, colour, font or button rules, and no blur or glass is added anywhere', () => {
    assert(!/(width|height|padding|margin|position|display|color|font|border|gap|transform)\s*:/.test(css.replace(/background[^;]*;|box-shadow[^;]*;/g, '')), 'only the glass properties'); assert(!/blur\(/.test(css), 'no blur added');
  });
  await test('the stylesheet is loaded after the main one (and wins on strength regardless of order), and the older panel rules were not edited', () => {
    const lay = read('src/app/layout.tsx'); assert(lay.indexOf('heroDockClear.css') > lay.indexOf('globals.css'), 'loads after the main stylesheet'); assert(!/heroDockClear/.test(read('src/app/globals.css') + read('src/design/organic.css') + read('src/animations/heroWide.css')), 'older files untouched');
  });
  console.log(`\nHome dock without frosted glass: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
