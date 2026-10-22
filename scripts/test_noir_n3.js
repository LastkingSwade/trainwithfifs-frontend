/**
 * TrainWithFIFS - FIFS NOIR, stage N3 (offline)
 * Identity moments: arrival, vault entrance, screen motion, milestone ring, ambient light. They must never block or hide anything, never repeat on every screen, never run with reduced motion,
 * never touch sensitive content, and the milestone must come only from badges the member has really earned.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const L = require(path.join(ROOT, 'src/noir/momentsLogic.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const full = read('src/noir/noir.css'); const at = full.indexOf('/* ---- Stage N3'); assert(at > 0, 'stage N3 section present');
const n3 = full.slice(at).replace(/\/\*[\s\S]*?\*\//g, '');
const css = n3.replace(/@keyframes[^{]+\{(?:[^{}]*\{[^}]*\})+\s*\}/g, '');
const frames = {}; { const re = /@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^}]*\})+)\s*\}/g; let m; while ((m = re.exec(n3))) frames[m[1]] = m[2]; }
const rules = []; { const re = /([^{}@][^{}]*)\{([^{}]*)\}/g; let m; while ((m = re.exec(css))) rules.push({ sel: m[1].trim(), body: m[2] }); }
const base = { flagOn: true, reducedMotion: false, alreadyArrived: false, tabsOn: true, booting: false };

(async () => {
  await test('every N3 selector is scoped to [data-noir="on"], so nothing changes while the flag is off', () => {
    assert(rules.length >= 6, 'rules: ' + rules.length); for (const r of rules) for (const s of r.sel.split(',')) assert(/^\s*:root\[data-noir="on"\]/.test(s), 'unscoped: ' + s.trim());
  });
  await test('the arrival plays only when the flag is on, a member\'s tabs are showing, motion is allowed, it has not played this session and the boot intro is not running', () => {
    assert(L.shouldArrive(base) === true, 'plays in the normal case');
    for (const k of ['flagOn', 'tabsOn']) assert(L.shouldArrive({ ...base, [k]: false }) === false, k + ' false must stop it');
    for (const k of ['reducedMotion', 'alreadyArrived', 'booting']) assert(L.shouldArrive({ ...base, [k]: true }) === false, k + ' true must stop it');
  });
  await test('the arrival is one short, self-removing attribute: set once per session, removed in under a second, and the component is only mounted when the flag is on', () => {
    const c = read('src/noir/NoirMoments.tsx'); assert(/sessionStorage\.setItem\(ARRIVE_KEY/.test(c) && /removeAttribute\('data-noir-arrive'\)/.test(c), 'once and self-removing'); assert(L.ARRIVE_MS <= 1000, 'under a second');
    assert(/process\.env\.NEXT_PUBLIC_NOIR === "on" && <NoirMoments \/>/.test(read('src/app/layout.tsx')), 'mounted only with the flag');
    const code = c.replace(/\/\/.*$/gm, ''); assert(!/fetch\(|callFifsBackend|localStorage|innerHTML|document\.cookie|console\./.test(code), 'reads and sends nothing');
    assert(/\[data-noir-arrive\][^{]*\{[^}]*animation/.test(n3), 'the settle only exists while the attribute is present');
  });
  await test('nothing waits and nothing loops: no animation delay, no infinite iteration, durations are 160-650ms', () => {
    assert(!/animation-delay|infinite/.test(n3), 'no delay or loop');
    for (const m of n3.matchAll(/animation:\s*([^;]+);/g)) { const d = /(var\(--noir-motion-(?:fast|standard|panel|ceremony)\)|\d+ms)/.exec(m[1]); assert(d, 'duration in ' + m[1]); const ms = /var\(--noir-motion-fast\)/.test(d[1]) ? 160 : /standard/.test(d[1]) ? 240 : /panel/.test(d[1]) ? 340 : /ceremony/.test(d[1]) ? 650 : parseInt(d[1], 10); assert(ms >= 160 && ms <= 650, 'duration ' + ms + 'ms'); }
  });
  await test('keyframes change only opacity and transform, and every one ends on the normal visible state', () => {
    assert(Object.keys(frames).length >= 5, 'keyframes found');
    for (const [name, body] of Object.entries(frames)) { for (const d of body.matchAll(/([\w-]+)\s*:/g)) assert(/^(opacity|transform)$/.test(d[1]), name + ' animates ' + d[1]); const to = /to\s*\{([^}]*)\}/.exec(body); assert(to, name + ' has an end state'); assert(/opacity:\s*[01](\.0)?\b/.test(to[1]) || /transform: none/.test(to[1]), name + ' end state'); if (name !== 'noir-gold-ring') assert(/opacity:\s*1/.test(to[1]), name + ' must end fully visible'); }
  });
  await test('the vault entrance animates only the screen frame: it does not target records, serials, photos or any text, and uses no attr() or generated text from data', () => {
    for (const r of rules) if (/vault-overlay/.test(r.sel) && /animation/.test(r.body)) assert(/^(:root\[data-noir="on"\]) \.(vault-overlay|ar-overlay)(,\s*:root\[data-noir="on"\] \.(vault-overlay|ar-overlay))?$/.test(r.sel), 'vault animation target: ' + r.sel);
    assert(!/attr\(|content:\s*["'][^"']+["']|serial|\.ar-card|\.vault-card|\.ad-item/i.test(n3.replace(/content:\s*"";?/g, '')), 'no data, serial or record selectors in N3');
  });
  await test('the milestone ring sits only on earned badges, is decorative and cannot be clicked, and no script creates achievements', () => {
    assert(/\.rj-badge-list li\.earned::after/.test(n3) && !/\.locked/.test(n3), 'earned only'); const r = rules.find((x) => /li\.earned::after/.test(x.sel)); assert(r && /pointer-events:\s*none/.test(r.body) && /content:\s*""/.test(r.body), 'decorative');
    assert(/earned: h >= r\.target/.test(read('src/portal/badges.ts')), 'earned is computed from the member\'s own numbers');
  });
  await test('ambient light is one still layer: behind everything, not clickable, no animation or blur, and only for signed-in members\' screens', () => {
    const r = rules.find((x) => /body\.fifs-tabs-on::before/.test(x.sel)); assert(r, 'ambient rule'); assert(/z-index:\s*-1/.test(r.body) && /pointer-events:\s*none/.test(r.body) && !/animation|filter|backdrop/.test(r.body), 'still, behind, inert');
    assert((r.body.match(/radial-gradient/g) || []).length <= 2, 'at most two gradients');
  });
  await test('stage N3 adds no dependency, script tag, import of third-party code or globals.css change', () => {
    assert(!/noir/i.test(read('src/app/globals.css')), 'globals.css untouched'); const c = read('src/noir/NoirMoments.tsx'); assert(/^import .* from '(react|\.\/momentsLogic)';$/m.test(c) && (c.match(/^import /gm) || []).length === 2, 'imports are react and the local logic only');
  });
  console.log(`\nFIFS NOIR stage N3: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
