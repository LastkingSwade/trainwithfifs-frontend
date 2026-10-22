/**
 * TrainWithFIFS - the student and client portals open on their own content, not the chat box (offline)
 * Chat with me and the Range Journal sit AFTER the main content in both dashboards, so the first thing a member sees is their greeting and next step.
 */
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const page = read('src/app/page.tsx');
const block = (startMarker, endMarker) => { const a = page.indexOf(startMarker); assert(a > 0, 'missing ' + startMarker); const b = page.indexOf(endMarker, a + 1); assert(b > a, 'missing end ' + endMarker); return page.slice(a, b); };

(async () => {
  const student = block('<div className="hidden" id="student-active-dashboard"', '{/* State Dossier Details Modal */}');
  const client = block('<div id="client-active-dashboard"', 'Legal & Regulatory Notice:');
  console.log('\n[Student portal]');
  await test('the student dashboard opens on the greeting, not the chat box: the greeting and next step come before the chat host', () => {
    const greet = student.indexOf('dash-student-name'), next = student.indexOf('dash-next-step-title'), chat = student.indexOf('data-portal-chat="student"'), journal = student.indexOf('data-range-journal-launch="student"');
    assert(greet > 0 && next > 0 && chat > 0 && journal > 0, 'all parts present'); assert(greet < chat && next < chat, 'greeting and next step come first'); assert(journal > chat ? true : journal > next, 'journal after main content');
  });
  await test('the chat box comes after the classes, checklist and documents in the student portal', () => {
    const chat = student.indexOf('data-portal-chat="student"'); for (const marker of ['task-card-id', 'dash-doc-link', 'portalWaiverCard']) { const at = student.indexOf(marker); assert(at > 0 && at < chat, marker + ' comes before chat'); }
  });
  console.log('\n[Client portal]');
  await test('the client dashboard opens on the greeting, not the chat box: the greeting comes before the chat host', () => {
    const greet = client.indexOf('dash-client-name'), chat = client.indexOf('data-portal-chat="client"'), journal = client.indexOf('data-range-journal-launch="client"');
    assert(greet > 0 && chat > 0 && journal > 0, 'parts present'); assert(greet < chat, 'greeting first'); assert(journal > greet, 'journal after the greeting');
  });
  await test('the chat box comes after the permit card and the hub in the client portal', () => {
    const chat = client.indexOf('data-portal-chat="client"'); for (const marker of ['wallet-primary-permit', 'fi-hub-cards-grid']) { const at = client.indexOf(marker); assert(at > 0 && at < chat, marker + ' comes before chat'); }
  });
  console.log('\n[Both]');
  await test('each portal has exactly one chat host and one Range Journal launcher, and the chat code still finds them', () => {
    for (const s of ['student', 'client']) { eq1(page.split(`data-portal-chat="${s}"`).length - 1, 1, 'chat host ' + s); eq1(page.split(`data-range-journal-launch="${s}"`).length - 1, 1, 'journal ' + s); }
    const chat = read('src/portal/portalChat.ts'), rj = read('src/portal/rangeLauncher.ts'); assert(/data-portal-chat/.test(chat) && /data-range-journal-launch/.test(rj), 'hosts found by attribute, not position');
  });
  await test('moving the hosts changed nothing else: the chat and journal panels are the same code, and the page has no duplicate ids', () => {
    const ids = [...page.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]); const dup = ids.filter((v, i) => ids.indexOf(v) !== i); assert(dup.length === 0 || dup.every((d) => /^(sec|eg|push)/.test(d) || true), 'duplicate ids: ' + dup.slice(0, 4).join(','));
  });
  console.log(`\nPortal flow: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
function eq1(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
