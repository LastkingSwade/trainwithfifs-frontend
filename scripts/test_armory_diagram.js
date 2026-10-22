/**
 * TrainWithFIFS - Armory parts view: a generic, labelled exploded view of a handgun (offline)
 * Original drawing with numbered parts; notes describe parts and never give disassembly steps; accessible and keyboard-usable; nothing stored or sent; handguns only.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const D = require(path.join(ROOT, 'src/portal/armoryDiagramData.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

(async () => {
  console.log('\n[The parts]');
  await test('there are 13 numbered parts, numbered 1 to 13 in order, with unique ids', () => {
    eq(D.HANDGUN_PARTS.map((p) => p.n), [...Array(13)].map((_, i) => i + 1)); eq(new Set(D.HANDGUN_PARTS.map((p) => p.id)).size, 13);
  });
  await test('every part has a plain name and a note, and the note describes the part (no step-by-step instructions)', () => {
    for (const p of D.HANDGUN_PARTS) { assert(p.name.length >= 3 && p.note.length >= 30 && p.note.length <= 160, p.id); assert(!/\b(remove|unscrew|disassemble|take apart|press|pull the|push the|lift|slide the|rotate|insert|reinstall|field strip)\b/i.test(p.note), 'instruction-like note: ' + p.id); }
  });
  await test('the drawing stays inside its box, and every number badge sits inside it too', () => {
    for (const p of D.HANDGUN_PARTS) { for (const s of p.shapes) { if (s.t === 'rect') { assert(s.x >= 0 && s.y >= 0 && s.x + s.w <= D.VIEW_W && s.y + s.h <= D.VIEW_H, p.id + ' rect'); } else if (s.t === 'line') { for (const v of [s.x1, s.x2]) assert(v >= 0 && v <= D.VIEW_W, p.id); } } assert(p.anchor[0] >= 21 && p.anchor[0] <= D.VIEW_W - 21 && p.anchor[1] >= 21 && p.anchor[1] <= D.VIEW_H - 21, p.id + ' badge'); assert(p.shapes.length >= 1, p.id + ' has a drawing'); }
  });
  await test('the picture is labelled as a generic, original illustration: not to scale, not a model, and points to the owner\'s manual; the drawing is not copied from any product (no product or manufacturer names in it)', () => {
    assert(/Generic handgun illustration/.test(D.DIAGRAM_NOTICE) && /Not to scale/.test(D.DIAGRAM_NOTICE) && /not a specific model/.test(D.DIAGRAM_NOTICE) && /owner[’']s manual/.test(D.DIAGRAM_NOTICE), 'notice');
    const src = read('src/portal/armoryDiagramData.ts'); assert(!/\b(glock|smith|wesson|sig|ruger|beretta|colt|springfield|tekmat|tactical|radian|holosun)\b/i.test(src), 'no brand names');
    assert(/ORIGINAL, generic illustration/.test(src) && /not copied from any manufacturer or product diagram/.test(src), 'origin stated in the source');
  });

  console.log('\n[The view]');
  await test('it is accessible: an labelled picture, each part is a keyboard-reachable button with its name and pressed state, and the chosen part is read aloud', () => {
    const c = read('src/portal/ArmoryDiagram.tsx'); assert(/role="img" aria-label="Exploded view of a generic handgun/.test(c), 'picture label'); assert(/role="button" tabIndex=\{0\} className="ad-part" aria-label=\{`\$\{p\.n\}\. \$\{p\.name\}`\} aria-pressed=\{sel === p\.n\}/.test(c), 'part buttons');
    assert(/e\.key === 'Enter' \|\| e\.key === ' '/.test(c) && /onKeyDown=\{onKey\(p\.n\)\}/.test(c) && /aria-live="polite"/.test(c) && /aria-label="Parts"/.test(c), 'keys wired to the part buttons and a live region'); assert(/ad-item[^}]*min-height: 44px/.test(read('src/portal/armory.css')) || /\.ad-item \{[^}]*min-height: 44px/.test(read('src/portal/armory.css')), '44px list buttons');
    assert(/\.ad-item:focus-visible, \.ad-part:focus-visible \{ outline: 3px solid #00e5ff/.test(read('src/portal/armory.css')), 'focus');
  });
  await test('it stores, sends and logs nothing, uses no HTML injection and no network, and draws its picture itself', () => {
    const code = (read('src/portal/ArmoryDiagram.tsx') + read('src/portal/armoryDiagramData.ts')).replace(/\/\/.*$/gm, '');
    assert(!/innerHTML|dangerouslySetInnerHTML|localStorage|sessionStorage|document\.cookie|fetch\(|console\.|<img|src=|https?:\/\//.test(code), 'private, text-only, no network'); assert(/<svg /.test(read('src/portal/ArmoryDiagram.tsx')), 'drawn in code');
  });
  await test('the Parts view button appears only for handguns and never on a record that could not be read; the panel is otherwise unchanged', () => {
    const p = read('src/portal/ArmoryPanel.tsx'); assert(/!i\.unreadable && i\.type === 'handgun' && <button type="button" className="rj-secondary ar-parts-btn"/.test(p), 'handgun only'); assert(/aria-expanded=\{partsFor === i\.id\}/.test(p) && /aria-controls=\{`ar-parts-\$\{i\.id\}`\}/.test(p), 'disclosure');
    assert(/import ArmoryDiagram from '\.\/ArmoryDiagram';/.test(p), 'import');
  });

  console.log(`\nArmory parts view: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
