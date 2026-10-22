/**
 * TrainWithFIFS - safe storage checklist (offline)
 * Habits only, from the Maryland Office of Suicide Prevention handout; never asks where anything is kept; ticks saved only on this device, under one key, and it survives a blocked store.
 */
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const C = require(path.join(ROOT, 'src/safety/storageChecklist.ts')); const T = require(path.join(ROOT, 'src/shell/tabLogic.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
function memStore() { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }; }

(async () => {
  await test('seven habit items with unique ids, each with a reason; the wording is a habit, not a question about where anything is', () => {
    eq(C.ITEMS.length, 7); assert(new Set(C.ITEMS.map((i) => i.id)).size === 7, 'ids'); for (const i of C.ITEMS) { assert(i.text.length > 20 && i.why.length > 20, i.id); assert(!/\?/.test(i.text), 'not a question: ' + i.id); }
    const all = JSON.stringify(C.ITEMS) + read('src/app/safe-storage/page.tsx'); assert(!/\b(where (do|are|is|you) .{0,20}(keep|store|kept|stored)|closet|under the bed|nightstand|safe combination|garage|attic|basement|glove box|trunk|in the car)\b/i.test(all), 'storage-location wording');
  });
  await test('the checklist cites its official source with a check date, and the legal line says it is not legal advice', () => {
    assert(/^https:\/\/health\.maryland\.gov\//.test(C.SOURCE.url) && /^\d{4}-\d{2}-\d{2}$/.test(C.SOURCE.checked), 'source'); assert(/not legal advice/.test(C.LEGAL_LINE), 'legal line');
  });
  await test('ticks are saved on this device only, under one key, and read back; unknown keys and bad data are ignored', () => {
    const s = memStore(); assert(C.writeTicks(s, { unloaded: true, 'made-up': true, vehicles: true }), 'saved'); eq([...s.m.keys()], [C.STORAGE_KEY]); const back = C.readTicks(s);
    eq(back.unloaded, true); eq(back.vehicles, true); eq(back['made-up'], undefined, 'unknown ignored'); eq(C.doneCount(back), 2); s.setItem(C.STORAGE_KEY, '{not json'); eq(C.doneCount(C.readTicks(s)), 0, 'bad data is zero');
  });
  await test('a blocked or missing store never breaks the checklist: it reads as empty and reports that nothing was saved', () => {
    const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } }; eq(C.readTicks(blocked), C.readTicks(null)); eq(C.writeTicks(blocked, { unloaded: true }), false); eq(C.writeTicks(null, { unloaded: true }), false);
    assert(/this browser will not save ticks/.test(read('src/app/safe-storage/page.tsx')), 'the page says so');
  });
  await test('nothing is sent, fetched or logged, and the storage calls are wrapped so a blocked store cannot crash the page', () => {
    const code = (read('src/safety/storageChecklist.ts') + read('src/app/safe-storage/page.tsx')).replace(/\/\/.*$/gm, ''); assert(!/fetch\(|console\.|innerHTML|dangerouslySetInnerHTML|sendBeacon|XMLHttpRequest/.test(code), 'no sending or injection');
    assert(/try \{[\s\S]*localStorage/.test(read('src/safety/storageChecklist.ts')) || /try \{ if \(!store\)/.test(read('src/safety/storageChecklist.ts')), 'wrapped');
  });
  await test('reachable from the signed-in Hub menu, and the checkboxes are large, labelled and keyboard reachable', () => {
    const it = T.HUB_ITEMS.find((i) => i.key === 'storage'); assert(it && it.href === '/safe-storage' && it.roles.includes('client'), 'hub'); const css = read('src/permits/permits.css'); assert(/\.ss-row \{[^}]*min-height: 52px/.test(css) && /\.ss-row input:focus-visible/.test(css), 'sizes and focus');
    assert(/<label className="ss-row"><input type="checkbox"/.test(read('src/app/safe-storage/page.tsx')), 'labels wrap the boxes');
  });
  console.log(`\nSafe storage checklist: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
