// Student Portal score sheet card (offline): only https links, text only, own sheet only (the request carries no id).
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert'); const ts = require('typescript');
const R = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
let passed = 0, failed = 0;
function test(n, f) { try { f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
console.log('\n[student score sheet card]');
const SRC = R('src/portal/studentScoresheet.ts');
const els = {}; const mk = (id) => (els[id] = { id, style: {}, textContent: '', attrs: {}, removeAttribute(k) { delete this.attrs[k]; delete this[k]; }, setAttribute(k, v) { this.attrs[k] = v; }, set href(v) { this.attrs.href = v; }, get href() { return this.attrs.href; } });
for (const id of ['dash-scoresheet-pending', 'dash-scoresheet-active', 'dash-scoresheet-score-badge', 'dash-scoresheet-fullscreen-btn', 'dash-scoresheet-download-btn']) mk(id);
mk('dash-scoresheet-body'); els['dash-scoresheet-body'].appendChild = (c) => { els[c.id] = c; return c; };
const m = { exports: {} }; vm.runInNewContext(ts.transpileModule(SRC, { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, window: undefined, document: { getElementById: (id) => els[id] || null, createElement: () => { const e = { style: {}, children: [], textContent: '', className: '', id: '', appendChild(c) { this.children.push(c); if (c.id) els[c.id] = c; return c; }, append(...cs) { cs.forEach((c) => this.appendChild(c)); } }; return e; } }, URL, String, Object, Promise, MutationObserver: function () { this.observe = () => {}; }, getComputedStyle: () => ({ display: 'block' }) });
const { paintScoresheet, safeHttps, badgeText } = m.exports;
test('Only https links are ever used; javascript:, data: and plain http are dropped', () => {
  assert(safeHttps('https://x.supabase.co/a?token=1') && safeHttps('http://x.co') === '' && safeHttps('javascript:alert(1)') === '' && safeHttps('data:text/html,hi') === '' && safeHttps('') === '' && safeHttps(null) === '');
});
test('A sheet with a file shows the active card, the link on both buttons, a pass badge and the right download name; no sheet shows the pending notice', () => {
  paintScoresheet({ score: '48/50 (96%)', passed: true, result: 'pass', qualificationDate: '2026-10-01', hasFile: true, fileUrl: 'https://f.example.test/signed/FIFS-1001/x.pdf?token=1', fileKind: 'pdf' });
  assert(els['dash-scoresheet-active'].style.display === 'block' && els['dash-scoresheet-pending'].style.display === 'none' && els['dash-scoresheet-fullscreen-btn'].attrs.href.startsWith('https://') && els['dash-scoresheet-download-btn'].attrs.download.endsWith('.pdf'));
  assert(els['dash-scoresheet-score-badge'].textContent === 'PASSED • 48/50 (96%)' && badgeText({ score: '', result: null }) === 'PENDING' && badgeText({ score: '1/2', result: 'fail' }) === 'NOT PASSED • 1/2');
  paintScoresheet({ score: '', passed: null, result: null, qualificationDate: null, hasFile: true, fileUrl: 'https://f.example.test/view', downloadUrl: 'https://f.example.test/dl?download=x.pdf', fileKind: 'pdf' });
  assert(els['dash-scoresheet-fullscreen-btn'].attrs.href === 'https://f.example.test/view' && els['dash-scoresheet-download-btn'].attrs.href === 'https://f.example.test/dl?download=x.pdf', 'download button uses the forced-download link');
  paintScoresheet({ score: '', passed: null, result: null, qualificationDate: null, hasFile: true, fileUrl: 'https://f.example.test/view', downloadUrl: 'javascript:alert(1)', fileKind: 'pdf' });
  assert(els['dash-scoresheet-download-btn'].attrs.href === 'https://f.example.test/view', 'an unsafe download link falls back to the view link');
  paintScoresheet(null);
  assert(els['dash-scoresheet-active'].style.display === 'none' && els['dash-scoresheet-pending'].style.display === 'block' && !els['dash-scoresheet-fullscreen-btn'].attrs.href && els['dash-scoresheet-score-badge'].style.display === 'none');
  paintScoresheet({ score: '', passed: null, result: null, qualificationDate: null, hasFile: true, fileUrl: 'javascript:alert(1)', fileKind: 'pdf' });
  assert(els['dash-scoresheet-active'].style.display === 'none', 'an unsafe link must show the pending notice, never a link');
});
test('Locked until the class is paid: the card says the sheet is ready and what unlocks it, shows no file, link, score or badge, and goes back to normal once paid', () => {
  paintScoresheet({ locked: true, ready: true, balance: 175, invoices: [{ invoiceNumber: 'INV-1', course: 'Maryland CCW', balance: 175 }], hasFile: false, score: '', passed: null, result: null, qualificationDate: null, fileUrl: null, fileKind: null });
  assert(els['dash-scoresheet-active'].style.display === 'none' && els['dash-scoresheet-pending'].style.display === 'none' && els['dash-scoresheet-score-badge'].style.display === 'none', 'nothing else is shown');
  const box = els['dash-scoresheet-locked']; assert(box && box.style.display === 'block', 'locked box');
  const text = box.children.map((c) => c.textContent).join(' '); assert(/ready/.test(text) && /unlocks when your class is paid in full/.test(text) && /\$175\.00/.test(text) && /Coach Kai will record it/.test(text), text);
  assert(!els['dash-scoresheet-fullscreen-btn'].attrs.href && !els['dash-scoresheet-download-btn'].attrs.href, 'no link while locked');
  paintScoresheet({ score: '', passed: null, result: null, qualificationDate: null, hasFile: true, fileUrl: 'https://f.example.test/view', fileKind: 'pdf' });
  assert(els['dash-scoresheet-locked'].style.display === 'none' && els['dash-scoresheet-active'].style.display === 'block', 'paid: the lock box is gone and the sheet shows');
  paintScoresheet({ locked: true, balance: 10, invoices: [], hasFile: false, score: '', passed: null, result: null, qualificationDate: null, fileUrl: null, fileKind: null }); paintScoresheet(null); assert(els['dash-scoresheet-locked'].style.display === 'none', 'null hides it too');
  assert(/sheet-locked/.test(R('src/portal/dashboard.css')) && /fifsPayButton/.test(SRC) && /fifsPayButton = payButton/.test(R('src/portal/payBalance.ts')), 'styled and wired to the same Pay button');
});
test('The request carries no id, is wired once, and uses textContent only', () => {
  assert(/callFifsBackend\('studentScoresheet', \{\}\)/.test(SRC) && !/innerHTML/.test(SRC) && !/studentId|student_id/.test(SRC));
  const PAGE = R('src/app/page.tsx'); assert((PAGE.match(/installStudentScoresheet\(\);/g) || []).length === 1);
});
console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
process.exit(failed ? 1 : 0);
