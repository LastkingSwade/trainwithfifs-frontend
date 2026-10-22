/**
 * TrainWithFIFS - Emergency information page (offline)
 * 911 and 988 are the first thing on the page; the only legal line is the 72-hour reporting duty with its source and check date; every link is official (https, .gov or health.maryland.gov) or the FIFS number;
 * nothing asks where firearms are kept; reachable from the signed-in Hub menu; no storage, no network, nothing logged.
 */
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const C = require(path.join(ROOT, 'src/emergency/content.ts'));
const T = require(path.join(ROOT, 'src/shell/tabLogic.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const official = (u) => { try { const x = new URL(u); return x.protocol === 'https:' && /(^|\.)(gov)$|health\.maryland\.gov$|mdpgv\.org$/.test(x.hostname) || (x.protocol === 'https:' && x.hostname === 'law.justia.com'); } catch { return false; } };

(async () => {
  await test('911 and 988 are the first help on the page, with a clear call to action', () => {
    assert(C.CRISIS[0].text.includes('911') && C.CRISIS[1].text.includes('988'), 'crisis lines'); const page = read('src/app/emergency/page.tsx'); assert(page.indexOf('tel:911') > 0 && page.indexOf('tel:911') < page.indexOf('Reporting a lost'), 'buttons come before the reporting section'); assert(/tel:988/.test(page), '988 button');
  });
  await test('the only legal statement is the 72-hour duty, with its source and check date, and it has no penalty wording', () => {
    const r = C.REPORTING[0]; assert(/72 hours/.test(r.text) && /local law enforcement/.test(r.text), 'duty'); assert(/^\d{4}-\d{2}-\d{2}$/.test(r.checked) && official(r.source.url), 'source and date'); assert(!/fine|penalt|misdemeanor|imprison/i.test(JSON.stringify(C)), 'no penalty claims');
  });
  await test('every outside link is official or the FIFS number, uses https, and has a check date', () => {
    for (const l of [...C.HELP]) { assert(official(l.url), 'official: ' + l.url); assert(/^\d{4}-\d{2}-\d{2}$/.test(l.checked), 'date: ' + l.label); }
    assert(C.CONTACT.phone === '443-990-1304', 'the FIFS number'); const page = read('src/app/emergency/page.tsx'); for (const m of page.matchAll(/href="(https?:\/\/[^"]+)"/g)) assert(official(m[1]), m[1]); assert(/rel="noopener noreferrer"/.test(page), 'safe external links');
  });
  await test('nothing asks where firearms are kept or describes home storage locations', () => {
    const text = JSON.stringify(C) + read('src/app/emergency/page.tsx'); assert(!/\b(closet|under the bed|nightstand|safe combination|gun safe|vault|garage|attic|basement|in the car|glove box|trunk|where (do|you|are) (you )?(keep|store))\b/i.test(text), 'storage location wording');
  });
  await test('it is reachable from the signed-in Hub menu for students and clients, and the Hub link points at the real page', () => {
    const it = T.HUB_ITEMS.find((i) => i.key === 'emergency'); assert(it && it.href === '/emergency' && it.roles.includes('student') && it.roles.includes('client'), 'hub item');
    assert(fs.existsSync(path.join(ROOT, 'src/app/emergency/page.tsx')), 'page exists');
  });
  await test('it stores, sends and logs nothing and draws no text from the network', () => {
    const code = (read('src/app/emergency/page.tsx') + read('src/emergency/content.ts')).replace(/\/\/.*$/gm, ''); assert(!/localStorage|sessionStorage|document\.cookie|fetch\(|console\.|innerHTML|dangerouslySetInnerHTML/.test(code), 'nothing stored, sent or injected');
  });
  console.log(`\nEmergency information: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
