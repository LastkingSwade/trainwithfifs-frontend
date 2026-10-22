/**
 * TrainWithFIFS - FIFS ONE tabs: Home, Wallet, Armory, Range, Hub (offline)
 * Exactly five tabs; shown only to a signed-in student or client; every tab and Hub item opens something that exists; nothing is a dead button; text only; 44px+ controls.
 */
const fs = require('fs'); const path = require('path');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const T = require(path.join(ROOT, 'src/shell/tabLogic.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

(async () => {
  console.log('\n[The five tabs]');
  await test('there are exactly six tabs, in this order, each with an emoji and a plain label', () => {
    eq(T.TABS.map((t) => t.key), ['home', 'wallet', 'armory', 'range', 'reciprocity', 'hub']); eq(T.TABS.map((t) => t.label), ['Home', 'Vault', 'Armory', 'Range', 'States', 'Hub']); assert(T.TABS.every((t) => t.emoji.length >= 1 && /\S/.test(t.emoji)), 'emoji');
  });
  await test('tabs show only for a signed-in student or client: a student dashboard, a client dashboard, or nothing', () => {
    eq(T.roleFrom(true, false), 'student'); eq(T.roleFrom(false, true), 'client'); eq(T.roleFrom(false, false), null, 'signed out: no tabs'); eq(T.roleFrom(true, true), 'student');
  });
  await test('the current tab is the open panel, then the open sheet, otherwise Home', () => {
    const base = { journalOpen: false, walletOpen: false, hubOpen: false, armoryOpen: false };
    eq(T.currentTab(base), 'home'); eq(T.currentTab({ ...base, walletOpen: true }), 'wallet'); eq(T.currentTab({ ...base, journalOpen: true }), 'range'); eq(T.currentTab({ ...base, hubOpen: true }), 'hub'); eq(T.currentTab({ ...base, armoryOpen: true }), 'armory'); eq(T.currentTab({ ...base, journalOpen: true, hubOpen: true }), 'range');
  });

  console.log('\n[The Hub menu]');
  await test('the Hub offers what each person can really use: clients get permit and profile, everyone gets chat, booking, travel pages and a call link (the reciprocity hub has its own States tab, so it is not repeated here)', () => {
    const s = T.hubItemsFor('student').map((i) => i.key), c = T.hubItemsFor('client').map((i) => i.key);
    for (const k of ['chat', 'guide', 'book', 'drive', 'fly', 'call']) assert(s.includes(k) && c.includes(k), k); assert(!s.includes('recip') && !c.includes('recip'), 'the Reciprocity Hub is a tab, so the Hub menu does not repeat it'); assert(!s.includes('permit') && !s.includes('profile'), 'students do not get the permit and client profile items'); assert(c.includes('permit') && c.includes('profile'), 'clients do');
  });
  await test('every Hub item opens something: a function the page really defines, a chat scroll, or a call link, and a call link is a real phone number', () => {
    const script = read('public/scripts/TrainWithFIFS_scripts.js') + read('src/app/page.tsx') + read('src/portal/AiGuidePanel.tsx');
    for (const it of T.HUB_ITEMS) { assert(it.call || it.scrollTo || it.href, it.key + ' does nothing'); if (it.call) assert(new RegExp('window( as any\\))?\\.' + it.call + '\\s*=|function ' + it.call + '\\b').test(script), it.call + ' is not defined by the page'); if (it.href && it.href.startsWith('tel:')) assert(/^tel:\+1\d{10}$/.test(it.href), 'phone link'); else if (it.href) assert(it.href.startsWith('/') && !it.href.startsWith('//'), 'internal page link'); if (it.label) assert(it.label.length > 3 && it.hint.length > 3, 'labels'); }
    eq(new Set(T.HUB_ITEMS.map((i) => i.key)).size, T.HUB_ITEMS.length, 'no duplicate keys');
  });
  await test('Armory is honest: a clear "coming soon" sheet with a way back, never a dead button and never a promise of serial-number storage', () => {
    assert(/coming soon/i.test(T.ARMORY_TEXT.title) && T.ARMORY_TEXT.body.length > 60 && !/serial/i.test(T.ARMORY_TEXT.body), 'honest');
    const m = read('src/shell/tabShell.ts'); assert(/Back to my portal/.test(m) && /openSheet\('armory'\)/.test(m), 'opens a sheet with a way back');
  });

  console.log('\n[Wiring and look]');
  await test('it is installed on page load, text only, a labelled navigation landmark with the current tab marked, and excluded from the design layer\'s glass film', () => {
    assert(/installTabShell\(\)/.test(read('src/app/page.tsx')) && /import \{ installTabShell \} from "@\/shell\/tabShell"/.test(read('src/app/page.tsx')), 'installed');
    const m = read('src/shell/tabShell.ts'); assert(!/innerHTML|insertAdjacentHTML/.test(m), 'text only'); assert(/aria-label', 'Main tabs'/.test(m) && /aria-current', 'page'/.test(m) && /role', 'dialog'/.test(m) && /aria-modal', 'true'/.test(m), 'accessibility');
    assert((m.match(/data-organic', 'skip'/g) || []).length >= 2, 'the bar and the sheets are skipped by the glass film'); assert(!/localStorage|sessionStorage|document\.cookie|fetch\(/.test(m), 'stores and sends nothing');
  });
  await test('it only appears while a signed-in dashboard is on screen and hides itself again', () => {
    const m = read('src/shell/tabShell.ts'); assert(/shown\('student-active-dashboard'\)/.test(m) && /shown\('client-active-dashboard'\)/.test(m) && /nav\.hidden = !on/.test(m) && /closeSheet\(\)/.test(m), 'follows sign-in');
  });
  await test('phones get a bottom bar and larger screens a left rail under the header; every tab is 56px+ tall, 44px+ wide, with a visible focus ring, safe-area padding and no animation', () => {
    const c = read('src/shell/tabShell.css').replace(/\/\*[\s\S]*?\*\//g, '');
    assert(/@media \(max-width: 899px\)/.test(c) && /grid-template-columns: repeat\(6, 1fr\)/.test(c) && /env\(safe-area-inset-bottom/.test(c), 'phone bar'); assert(/@media \(min-width: 900px\)/.test(c) && /top: var\(--fts-rail-top/.test(c) && /width: 84px/.test(c), 'desktop rail under the header');
    assert(/\.fts-tab \{[^}]*min-width: 44px; min-height: 56px/.test(c) && /\.fts-item \{[^}]*min-height: 56px/.test(c) && /\.fts-close \{ min-width: 48px; min-height: 48px/.test(c), 'sizes'); assert(/:focus-visible[^{]*\{ outline: 3px solid #00e5ff/.test(c), 'focus'); assert(!/animation|transition|@keyframes/.test(c), 'no motion');
    assert(/#ffb703/.test(c) && /#00e5ff/.test(c), 'company colours');
  });
  await test('the floating chat button and the text-size button move out of the way instead of hiding behind the bar, and the page gets room so nothing is covered', () => {
    const c = read('src/shell/tabShell.css'); assert(/body\.fifs-tabs-on #floatingCommWrapper, body\.fifs-tabs-on \.fifs-float \{ transform: translateY/.test(c) && /body\.fifs-tabs-on \{ padding-bottom: calc\(60px/.test(c) && /body\.fifs-tabs-on \{ padding-left: 84px/.test(c), 'room made');
    assert(read('src/app/page.tsx').includes('id="floatingCommWrapper"') && /fifs-float/.test(read('src/polish/polish.css')), 'the buttons it moves exist');
  });

  console.log(`\nTabs: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
