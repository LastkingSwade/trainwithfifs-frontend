// Owner requests batch (offline): back button steps, chat bubble, client setup link, score sheet pad, catalog wording, online pitch.
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const ts = require('typescript');
const R = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
let passed = 0, failed = 0;
function test(n, f) { try { f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
console.log('\n[owner requests]');
const POLISH = R('src/polish/polish.ts'), CSS = R('src/polish/polish.css'), PAGE = R('src/app/page.tsx'), ROUTE = R('src/app/api/fifs/route.ts'), JS = R('public/scripts/TrainWithFIFS_scripts.js');
test('Back button: one step closes only the front-most pop-up; with none open it goes back as before; it never closes everything and jumps home', () => {
  assert(/const front = frontOverlay\(\);\s*if \(front\) \{ closeOverlay\(front\); return; \}\s*return original\.apply\(this, args\);/.test(POLISH), 'wrapper');
  assert(/CLOSERS: Record<string, string> = \{[^}]*adminSubpanelModalOverlay: 'closeAdminSubpanelModal'[^}]*adminEditStudentModal: 'closeAdminEditStudentModal'/.test(POLISH), 'known closers');
  assert(/zz >= bestZ/.test(POLISH) && /original\.__fifsStep/.test(POLISH) && /installBackStep\(\);/.test(POLISH), 'front-most by z-index, installed once');
  assert(/installPolish\(\);/.test(PAGE), 'wired');
});
test('Chat bubble: the whole bubble (chat pill and its ✕) steps aside while a pop-up is open; closing lasts for the visit and the old permanent flag is cleared', () => {
  assert(/body\.modal-open #floatingCommWrapper \{ display: none !important; \}/.test(CSS));
  assert(/localStorage\.removeItem\(CHAT_FLAG\)/.test(POLISH) && /sessionStorage\.setItem\('fifs\.chatDismissed', '1'\)/.test(POLISH) && /installChatBubble\(\);/.test(POLISH));
  assert(/try \{ window\.localStorage\.removeItem\(CHAT_FLAG\); \} catch/.test(POLISH), 'storage in try/catch');
});
test('Client setup link: staff only, uses the email on the client record, never creates or relinks a sign-in, refuses staff accounts, button on every client row', () => {
  const at = ROUTE.indexOf("case 'adminResendClientSetupLink':"), body = ROUTE.slice(at, ROUTE.indexOf("case 'adminEnrollStudent':", at));
  assert(body.indexOf('isStaffOrAdmin(user)') > 0 && body.indexOf('isStaffOrAdmin(user)') < body.indexOf('getPrivilegedClient()') && /status: 401/.test(body), 'staff check first');
  assert(!/createUser|\.update\(|\.insert\(|\.delete\(/.test(body), 'it must not create, relink or change anything');
  assert(/isStaffOrAdmin\(cAuth\)/.test(body) && /crow\.user_id !== cAuth\.id/.test(body) && /payload\.clientId/.test(body) && !/payload\.email/.test(body), 'guards, and the email comes from the record');
  assert(/function resendClientSetupLink\(clientId, btnEl\)/.test(JS) && /window\.resendClientSetupLink = resendClientSetupLink/.test(JS) && /onclick="resendClientSetupLink\('\$\{fifsSafeId\(c\.clientId\)\}', this\)"[^>]*>✉️ Setup link/.test(JS.slice(JS.lastIndexOf('function renderAdminClientTerminal'))), 'button in the live client row');
});
test('Score sheet pen pad: replaces "Choose file" with the real form from private storage (never from the repo), Pencil writes, finger scrolls and pinches, typed text and stamps are movable items, the server flattens it, the upload fallback stays', () => {
  const PAD = R('src/portal/scoresheetPad.ts');
  assert(!fs.existsSync(path.join(__dirname, '..', 'public/forms')) && !/forms\/msp-29-14|\/forms\//.test(PAD), 'no form file in public/ and no URL into it');
  assert(/call\('scoresheetTemplate'\)/.test(PAD) && /previewUrl/.test(PAD) && /call\('scoresheetStamp'/.test(PAD) && /call\('getStudentScoresheet'/.test(PAD), 'the form picture, stamps and saved strokes all come from the server');
  assert(/editScoresheetFileInput/.test(PAD) && /Upload a file instead/.test(PAD) && /ssp-fold/.test(PAD) && /input\.addEventListener\('change'/.test(PAD), 'the old file box stays, folded away');
  assert(/pointerType === 'touch'/.test(PAD) && /scroller\.scrollLeft -=/.test(PAD) && /Math\.hypot/.test(PAD) && /getCoalescedEvents/.test(PAD) && /touch-action: none/.test(R('src/portal/portal.css')), 'pencil writes, finger scrolls, two fingers pinch');
  assert(/inkLayerBase64/.test(PAD) && /inkStrokes/.test(PAD) && /fifsScoresheetInkPayload/.test(PAD) && /fifsScoresheetAfterSave/.test(PAD) && !/innerHTML/.test(PAD), 'hands the transparent layer to the existing Save button; text only');
  assert(/installScoresheetPad\(\);/.test(PAGE) && /Save score sheet/.test(PAGE), 'wired; the existing Save button is kept');
  const JSS = R('public/scripts/TrainWithFIFS_scripts.js'); assert(/window\.fifsScoresheetInkPayload\(\)/.test(JSS) && /payload\.inkLayerBase64 = extra\.inkLayerBase64/.test(JSS) && /window\.fifsScoresheetAfterSave\(\)/.test(JSS), 'the Save button sends the pen page');
  const m = { exports: {} }; vm.runInNewContext(ts.transpileModule(PAD, { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, window: undefined, document: undefined, Math, Image: undefined, Map, JSON, String, Array, Number, Promise });
  const X = m.exports; const sm = { exports: {} };
  vm.runInNewContext(ts.transpileModule(R('src/Lib/server/scoresheet-ink.ts').replace("import crypto from 'crypto';", "const crypto = require('crypto');").replace("import { PDFDocument } from 'pdf-lib';", "const { PDFDocument } = require('pdf-lib');"), { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: sm, exports: sm.exports, require, Buffer, Number, String, JSON, Math, Date, Array, Object, RegExp });
  assert(X.strokeWidth(3, 1, 'pen') > X.strokeWidth(3, 0.2, 'pen') && X.strokeWidth(3, 0, 'mouse') === X.strokeWidth(3, 1, 'mouse') && X.strokeWidth(3, 0.5, 'pen') >= 0.8, 'pressure');
  assert(X.drawsWith('pen', false) && X.drawsWith('mouse', false) && !X.drawsWith('touch', false) && X.drawsWith('touch', true) && !X.drawsWith('other', true), 'palm rejection: only pen and mouse unless the finger toggle is on');
  assert(X.clampZoom(0.2) === 1 && X.clampZoom(99) === 4 && X.clampZoom(2) === 2 && X.formDate('2026-10-01') === '10/01/2026' && X.formDate('x') === 'x' && X.formDate('') === '');
  for (const sl of X.SLOTS) assert(sl.x > 0 && sl.x < X.FORM_W && sl.y > 0 && sl.y < X.FORM_H, 'slot inside the form: ' + sl.id);
  const items = X.buildItems({ name: 'Alice Student', hits: '48', rounds: '50', percent: '96%', date: '10/01/2026', instructor: 'Kai Wade', number: 'QHIL-1', renewal: false, place: 'Range' });
  assert(items.find((i) => i.id === 'initial').on === true && items.find((i) => i.id === 'renewal').on === false && items.find((i) => i.id === 'applicant').text === 'Alice Student' && items.find((i) => i.id === 'score').text === '48', 'typed items from the page');
  assert(X.buildItems({ name: '', hits: '', rounds: '', percent: '', date: '', instructor: '', number: '', renewal: true, place: '' }).find((i) => i.id === 'renewal').on === true, 'a renewal course ticks B');
  const json = X.inkToJson([{ c: '#0b2a8a', s: 3, e: 0, p: [[1, 2, 0.5], [3, 4, 0.6]] }], items.concat([{ id: 'stamp-signature', kind: 'stamp', stamp: 'signature', x: 150, y: 1346, size: 60, on: true, w: 400 }]));
  const clean = sm.exports.sanitizeInk(json); assert(clean.ok && clean.data.strokes.length === 1 && clean.data.items.length === items.length + 1, 'what the pad produces is exactly what the server accepts: ' + (clean.error || ''));
  const m2 = { exports: {} }; assert(X.MAX_LAYER_BASE64 < 2500000 * 4 / 3 && X.EXPORT_SCALES[0] === 1 && X.EXPORT_SCALES.length === 3, 'the layer is sized under the server limit');
});
test('Catalog heading: the run-on sentence is replaced by a clear headline and three eye-catching chips (Standard, VIP, Live Online)', () => {
  assert(/Choose Your Class\. Choose Your Level\./.test(PAGE) && /Clear Prices\. No Surprises\./.test(PAGE) && !/Toggle between/.test(PAGE), 'new wording, old run-on gone');
  for (const k of ['chip-standard', 'chip-vip', 'chip-online']) assert(PAGE.includes('catalog-chip ' + k) && CSS.includes('.catalog-chip.' + k), k);
  assert(/role="list" aria-label="Ways to train"/.test(PAGE) && /grid-template-columns: repeat\(auto-fit, minmax\(220px, 1fr\)\)/.test(CSS), 'accessible and wraps on a phone');
});
test('Live online pitch: sells learning from home, and explains plainly why Day 2 is mandatory and in person (no claim about state approval)', () => {
  const C = R('src/online/onlineCopy.ts');
  assert(/Skip the drive/.test(C) && /A real instructor, live/.test(C) && /Then the hands-on day/.test(C), 'benefits');
  assert(/Why Day 2 is mandatory and in person/.test(C) && /cannot learn to load, hold, aim or clear a jam through a screen/.test(C) && /live-fire qualification shots have to be shot at the range/.test(C), 'why Day 2');
  assert(!/approved by|MSP approved|legal(ly)? (allowed|approved)|no rules|not breaking/i.test(C), 'no compliance claims');
  assert(/ONLINE_BENEFITS\.map/.test(PAGE) && /online-day2-callout/.test(PAGE) && /Learn Day 1 From Home/.test(PAGE) && /Learn Day 1 from home\. Day 2 is hands-on at the range\./.test(R('src/online/onlineForm.ts')), 'shown on the form and on the class cards');
  assert(/DAY2_ACK_TEXT/.test(PAGE) && /onlineDay2Ack/.test(PAGE), 'the Day 2 box is still required');
});
console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
process.exit(failed ? 1 : 0);
