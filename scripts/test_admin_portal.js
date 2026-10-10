// Admin Hub extras: search, shortcuts, empty states (offline).
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const ts = require('typescript'); const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'src/portal/adminExtras.ts'), 'utf8'); const m = { exports: {} };
vm.runInNewContext(ts.transpileModule(src, { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, console, Date, Math, String, Array, window: undefined, document: {} });
const ax = m.exports; const PAGE = fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf8');
let passed = 0, failed = 0; const test = (n, f) => { try { f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } };
console.log('\n[admin portal]');
test('Search matches any part of a row, ignores case and spaces at the ends, and an empty box shows everything', () => {
  assert(ax.rowMatches('FIFS-1001 Sam Lee sam@x.com Maryland CCW', ' LEE ') && ax.rowMatches('FIFS-1001 Sam Lee', 'fifs-1001') && !ax.rowMatches('FIFS-1001 Sam Lee', 'kim') && ax.rowMatches('anything', '') && ax.rowMatches('x', null));
});
test('Shortcuts never fire while typing in a field or with Ctrl, Command or Alt held (so browser shortcuts keep working)', () => {
  assert(!ax.isShortcutTarget({ tagName: 'INPUT' }, {}) && !ax.isShortcutTarget({ tagName: 'textarea' }, {}) && !ax.isShortcutTarget({ tagName: 'SELECT' }, {}) && !ax.isShortcutTarget({ tagName: 'DIV', isContentEditable: true }, {}));
  assert(!ax.isShortcutTarget({ tagName: 'BODY' }, { metaKey: true }) && !ax.isShortcutTarget({ tagName: 'BODY' }, { ctrlKey: true }) && !ax.isShortcutTarget({ tagName: 'BODY' }, { altKey: true }) && ax.isShortcutTarget({ tagName: 'BODY' }, {}) && ax.isShortcutTarget(null, {}));
});
test('The shortcut list covers the four tabs, search, help and Escape; shortcuts only run while the admin dashboard is showing', () => {
  const keys = ax.SHORTCUTS.map((s) => s[0]).join(' | ');
  for (const k of ['g then r', 'g then c', 'g then m', 'g then t', '/', '?', 'Esc']) assert(keys.includes(k), 'missing ' + k);
  assert(/admin-command-dashboard/.test(src) && /switchAdminTab/.test(src) && !/innerHTML/.test(src));
  assert(/installAdminExtras\(\);/.test(PAGE));
});
test('Empty states are plain sentences, and a search with no hits says so', () => {
  assert(/No students yet\. New bookings and invites will appear here\./.test(src) && /No clients yet\./.test(src) && /No match\. Try a different name, email or course\./.test(src));
});
console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`); process.exit(failed ? 1 : 0);
