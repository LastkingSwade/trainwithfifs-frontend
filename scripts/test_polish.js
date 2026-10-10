// Skeleton loading and remembered preferences (offline): safe storage, allow-list, no personal data, skeleton rows ignored by search, time-limited.
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..');
const load = (rel, win) => { const m = { exports: {} }; vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, require, window: win, console, JSON, Object, Array, String }); return m.exports; };
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
const store = () => { const d = {}; return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); }, removeItem: (k) => { delete d[k]; }, d }; };
(async () => {
  console.log('\n[skeleton loading and remembered preferences]');
  await test('Preferences: only allow-listed values are stored and read back; junk, tampered or unknown values fall back', () => {
    const ls = store(); const pr = load('src/portal/prefs.ts', { localStorage: ls });
    assert(pr.getPref('paymentsFilter', 'all') === 'all');
    pr.setPref('paymentsFilter', 'PAID'); assert(pr.getPref('paymentsFilter', 'all') === 'PAID');
    pr.setPref('paymentsFilter', '<script>'); assert(pr.getPref('paymentsFilter', 'all') === 'PAID', 'junk never stored');
    ls.setItem('fifs.prefs.v1', JSON.stringify({ paymentsFilter: 'DROP' })); assert(pr.getPref('paymentsFilter', 'all') === 'all', 'tampered value ignored');
    ls.setItem('fifs.prefs.v1', 'not json'); assert(pr.getPref('paymentsFilter', 'PENDING') === 'PENDING');
    pr.setPref('paymentsFilter', 'PAID'); pr.clearPrefs(); assert(ls.getItem('fifs.prefs.v1') === null);
  });
  await test('Preferences never fail when the browser blocks storage, and hold no names, emails or search text', () => {
    const boom = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
    const pr = load('src/portal/prefs.ts', { localStorage: boom }); pr.setPref('paymentsFilter', 'PAID'); pr.clearPrefs(); assert(pr.getPref('paymentsFilter', 'all') === 'all');
    const src = fs.readFileSync(path.join(ROOT, 'src/portal/prefs.ts'), 'utf8'); assert(/PREF_VALUES = \{ paymentsFilter: \[/.test(src) && !/setItem\([^)]*(email|name|search)/i.test(src), 'a short allow-list only');
    const ui = fs.readFileSync(path.join(ROOT, 'src/portal/AdminPaymentsPanel.tsx'), 'utf8'); assert(/setPref\('paymentsFilter'/.test(ui) && !/setPref\([^)]*search/i.test(ui), 'only the filter is remembered');
  });
  await test('Skeleton rows: single-cell (the search box ignores them), hidden from screen readers, shimmer only when motion is allowed, removed on a timer', () => {
    const SK = fs.readFileSync(path.join(ROOT, 'src/portal/skeleton.ts'), 'utf8'), CSS = fs.readFileSync(path.join(ROOT, 'src/online/online.css'), 'utf8'), EXTRA = fs.readFileSync(path.join(ROOT, 'src/portal/adminExtras.ts'), 'utf8');
    assert(/colSpan = cols/.test(SK) && /aria-hidden/.test(SK) && /MAX_MS = 10000/.test(SK) && /window\.setTimeout\(stop, MAX_MS\)/.test(SK));
    assert(/r\.cells\.length > 1/.test(EXTRA), 'search must skip one-cell rows');
    assert(/prefers-reduced-motion: no-preference\) \{ \.fifs-skel \{ animation/.test(CSS), 'no shimmer under reduced motion');
    assert(/installSkeletons\(\);/.test(fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf8')));
  });
  await test('Skeleton behaviour: rows appear for an empty table, vanish when real rows arrive, and are not added twice', () => {
    const rows = []; const tbody = { querySelector: (s) => rows.find((r) => r.className === 'fifs-skel-row') || null, querySelectorAll: () => rows.filter((r) => r.className === 'fifs-skel-row'), appendChild: (r) => rows.push(r) };
    let mutate = null; const doc = { createElement: (t) => ({ tagName: t, className: '', setAttribute() {}, appendChild() {}, remove() { const i = rows.indexOf(this); if (i >= 0) rows.splice(i, 1); } }), getElementById: (id) => (id === 'admin-roster-tbody' ? tbody : null), addEventListener() {} };
    const timers = []; const win = { setTimeout: (f) => timers.push(f), clearTimeout() {} };
    const m = { exports: {} }; vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(ROOT, 'src/portal/skeleton.ts'), 'utf8'), { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText.replace(/new MutationObserver/g, 'new FakeObs'), { module: m, exports: m.exports, window: win, document: doc, MutationObserver: null, FakeObs: function (cb) { mutate = cb; this.observe = () => {}; this.disconnect = () => {}; }, Array, Object, console });
    m.exports.installSkeletons(); assert(rows.length === 4, 'four placeholder rows');
    m.exports.installSkeletons(); assert(rows.length === 4, 'installed once');
    mutate([{ addedNodes: [{ classList: { contains: () => false } }] }]); assert(rows.length === 0, 'removed when real rows land');
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
