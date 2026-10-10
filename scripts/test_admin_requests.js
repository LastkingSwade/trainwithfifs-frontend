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
test('Score sheet pad (switched off for now): the module keeps its rules (file box kept in a fold-away, Pencil writes, finger scrolls, PNG output) but the form image is gone from public/ and the pad is not installed', () => {
  const PAD = R('src/portal/scoresheetPad.ts');
  assert(/editScoresheetFileInput/.test(PAD) && /ssp-fold/.test(PAD) && /Prefer to upload a file instead\?/.test(PAD) && /input\.files = dt\.files/.test(PAD) && /type: 'image\/png'/.test(PAD), 'attaches through the existing file box');
  assert(/pointerType === 'touch'/.test(PAD) && /scroller\.scrollLeft -=/.test(PAD) && /getCoalescedEvents/.test(PAD) && /touch-action: none/.test(R('src/portal/portal.css')), 'pencil writes, finger scrolls');
  assert(!fs.existsSync(path.join(__dirname, '..', 'public')) || !fs.existsSync(path.join(__dirname, '..', 'public/forms')), 'the form image must not live in public/ (anything there is reachable by URL)');
  assert(!/installScoresheetPad\(\);/.test(PAGE) && /Save score sheet/.test(PAGE), 'the pad stays switched off until it loads the real form from private storage; the old file box and the existing Save button remain');
  const m = { exports: {} }; vm.runInNewContext(ts.transpileModule(PAD, { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, window: undefined, document: undefined, Math, Image: undefined });
  const w = m.exports.strokeWidth;
  assert(w(3, 1, 'pen') > w(3, 0.2, 'pen') && w(3, 0, 'mouse') === w(3, 1, 'mouse') && w(3, 0.5, 'pen') >= 0.8, 'pressure: a firm press is thicker, a mouse is constant');
  assert(m.exports.MAX_STROKES === 4000 && m.exports.ZOOMS.length === 3 && m.exports.PEN_COLORS.length === 3);
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
