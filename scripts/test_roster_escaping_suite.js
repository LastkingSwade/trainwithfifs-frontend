/**
 * TrainWithFIFS - Offline Roster Escaping Suite
 *
 * Staff see student- and client-controlled text in the Admin Hub rosters. This suite runs the real rendering
 * code from public/scripts/TrainWithFIFS_scripts.js and src/app/page.tsx in a sandbox with a fake DOM, feeds it
 * hostile data, and checks that nothing becomes live markup, that handler arguments and attributes cannot be
 * broken out of, and that links are only ever http(s). Nothing is sent anywhere.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = fs.readFileSync(path.join(ROOT, 'public/scripts/TrainWithFIFS_scripts.js'), 'utf-8');
const PAGE = fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf-8');

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ PASS: ${name}`); }
  catch (e) { failed++; console.log(`  ✗ FAIL: ${name}\n      ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

// ---- Source extraction ------------------------------------------------------------------------------------
/** Text of the function that starts at `startIdx`: up to the first line that closes it at the same indent. */
function functionAt(src, startIdx) {
  const lineStart = src.lastIndexOf('\n', startIdx) + 1;
  const indent = src.slice(lineStart).match(/^ */)[0];
  const closing = '\n' + indent + '}';
  const end = src.indexOf(closing + '\n', startIdx);
  if (end < 0) throw new Error('could not find the end of the function at ' + startIdx);
  return src.slice(lineStart, end + closing.length);
}
function findFunction(src, signature, which = 'first') {
  const idx = which === 'last' ? src.lastIndexOf(signature) : src.indexOf(signature);
  if (idx < 0) throw new Error('missing function: ' + signature);
  return functionAt(src, idx);
}

// ---- Fake browser -----------------------------------------------------------------------------------------
function fakeBrowser() {
  const bodies = { 'admin-roster-tbody': [], 'admin-client-tbody': [] };
  const makeBody = (id) => ({ set innerHTML(v) { if (v === '') bodies[id].length = 0; else bodies[id].push(v); }, get innerHTML() { return bodies[id].join(''); }, appendChild(tr) { bodies[id].push(tr.innerHTML); } });
  const bodyEls = { 'admin-roster-tbody': makeBody('admin-roster-tbody'), 'admin-client-tbody': makeBody('admin-client-tbody') };
  // Any element the renderer touches besides the roster bodies: accepts any property read, call, or write.
  const tolerant = () => new Proxy(function () {}, { get: (_t, k) => (k === Symbol.toPrimitive ? () => '' : tolerant()), set: () => true, apply: () => tolerant() });
  const stub = tolerant;
  const document = {
    getElementById: (id) => bodyEls[id] || stub(),
    createElement: () => { let html = ''; const row = { set innerHTML(v) { html = v; }, get innerHTML() { return html; }, style: {}, dataset: {}, className: '', setAttribute() {}, addEventListener() {} }; return row; }
  };
  const window = { location: { origin: 'https://trainwithfifs.example' }, open() {} };
  return { document, window, bodies, html: () => Object.values(bodies).flat().join('\n') };
}

const HOSTILE = {
  tag: '<img src=x onerror=alert(1)>',
  script: '<script>alert(1)</script>',
  breakout: 'x" onmouseover="alert(1)',
  quote: "x');alert(1);//",
  svg: 'a@b.test"><svg onload=alert(1)>',
  iframe: '<iframe src=javascript:alert(1)>'
};
const LIVE_MARKUP = /<(img|script|svg|iframe)\b/i;

async function main() {
  const helpers = [
    findFunction(SCRIPT, 'function fifsSafeHttpUrl('), findFunction(SCRIPT, 'function fifsSafeId('),
    findFunction(SCRIPT, 'function escapeHtml(str) {'),
    findFunction(SCRIPT, 'function getStepNumberFromStatus('), findFunction(SCRIPT, 'function formatStepLabel(')
  ].join('\n');
  const state = 'var adminCachedStudents = []; var adminCachedClients = []; var _fifsMemStorage = { getItem: function() { return null; } };';

  /** Runs one extracted roster function in a sandbox and returns the HTML it produced. */
  function runRoster(extraSource, call) {
    const b = fakeBrowser();
    const sandbox = { window: b.window, document: b.document, console: { error() {}, warn() {}, log() {} }, Promise, Object, JSON, Array, String, Number, Math, Date, isNaN };
    vm.createContext(sandbox);
    vm.runInContext(state + '\n' + helpers + '\n' + extraSource + '\n' + call, sandbox);
    return b.html();
  }

  const hostileStudent = { studentId: HOSTILE.breakout, fullName: HOSTILE.script, name: HOSTILE.tag, email: HOSTILE.svg, phone: HOSTILE.iframe, course: HOSTILE.tag, assignedDate: HOSTILE.script, status: 'STEP_1', profileDocUrl: 'javascript:alert(1)' };
  const hostileClient = { clientId: HOSTILE.breakout, fullName: HOSTILE.tag, email: HOSTILE.svg, phone: HOSTILE.script, permitState: HOSTILE.iframe, expirationDate: '2099-01-01', status: 'ACTIVE' };

  console.log('\n[SECTION A: Script rosters (both copies of each render function)]');
  const rowFn = () => findFunction(SCRIPT, 'function fifsRosterRowHtml(s) {');
  await test('There is exactly one student roster renderer and one row builder', async () => {
    assert((SCRIPT.match(/function renderAdminTerminal\(/g) || []).length === 1, 'duplicate renderAdminTerminal');
    assert((SCRIPT.match(/function fifsRosterRowHtml\(/g) || []).length === 1, 'expected one row builder');
  });
  for (const which of ['first', 'last']) {
    await test(`Student roster (${which} copy): hostile text is escaped and attributes cannot be broken out of`, async () => {
      const src = rowFn() + '\n' + findFunction(SCRIPT, 'function renderAdminTerminal(data) {', 'last') + '\n' + findFunction(SCRIPT, 'function renderAdminClientTerminal(data) {', which);
      const html = runRoster(src, `renderAdminTerminal({ students: [${JSON.stringify(hostileStudent)}], clients: [${JSON.stringify(hostileClient)}] });`);
      assert(html.length > 200, 'the roster rendered nothing');
      assert(!LIVE_MARKUP.test(html), `live markup reached the roster: ${html.match(LIVE_MARKUP)}`);
      assert(!html.includes(HOSTILE.breakout) && !html.includes('" onmouseover="alert(1)'), 'an attribute value was not escaped');
      assert(!html.includes(HOSTILE.quote), 'an unescaped quote reached an attribute or handler');
      assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;') || html.includes('&lt;img src=x onerror=alert(1)&gt;'), 'expected the hostile text to appear escaped');
    });
    await test(`Client roster (${which} copy): every text field is escaped, including IDs`, async () => {
      const src = findFunction(SCRIPT, 'function renderAdminClientTerminal(data) {', which);
      const html = runRoster(src, `renderAdminClientTerminal({ clients: [${JSON.stringify(hostileClient)}] });`);
      assert(html.length > 100, 'the client roster rendered nothing');
      assert(!LIVE_MARKUP.test(html), `live markup reached the client roster: ${html.match(LIVE_MARKUP)}`);
      assert(!html.includes('" onmouseover="alert(1)'), 'a client ID broke out of an attribute');
      // Every copy must escape the ID and permit state it renders; the first copy also renders name and phone.
      assert(html.includes('&quot;') && html.includes('&lt;iframe src=javascript:alert(1)&gt;'), 'expected the escaped client ID and permit state');
      if (which === 'first') assert(html.includes('&lt;img src=x onerror=alert(1)&gt;') && html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'expected escaped client name and phone');
    });
  }

  console.log('\n[SECTION A2: Student roster row structure and modal triggers]');
  const NAMES = ["Sean O'Connor", 'Mary-Ann "Mac" Quinn', "D'Angelo <b>Smith</b>", 'A&B Tactical', "x');alert(1);//", '\\\\', 'Zoë Núñez'];
  const renderRows = (students) => runRoster(rowFn() + '\n' + findFunction(SCRIPT, 'function renderAdminTerminal(data) {', 'last'), `renderAdminTerminal({ students: ${JSON.stringify(students)} });`);
  await test('Each row shows the full name with the email directly beneath it, escaped', async () => {
    for (const name of NAMES) {
      const html = renderRows([{ studentId: 'FIFS-1001', fullName: name, email: 'kai+test@example.com', course: 'HQL (8 hr)', status: 'STEP_2_CONFIRMED' }]);
      const esc = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
      const cell = html.match(/<td><a[^>]*openAdminEditStudentModal[^>]*><strong>([\s\S]*?)<\/strong><\/a><br><span[^>]*>([\s\S]*?)<\/span><\/td>/);
      assert(cell, 'name cell is malformed for ' + name + ': ' + html.slice(0, 400));
      assert(cell[1] === esc && cell[2] === 'kai+test@example.com', `name/email not shown correctly for ${name}: ${cell[1]} / ${cell[2]}`);
    }
  });
  await test('No inline handler ever contains a name: every row action passes only the student ID', async () => {
    for (const name of NAMES) {
      const html = renderRows([{ studentId: 'FIFS-1001', fullName: name, email: 'a@example.com', course: 'c', status: 'STEP_1_REGISTERED' }]);
      const handlers = [...html.matchAll(/on(?:click|change)="([^"]*)"/g)].map((m) => m[1]);
      assert(handlers.length >= 8, 'expected the row handlers, found ' + handlers.length);
      for (const h of handlers) assert(!h.includes('O&#039;Connor') && !/Connor|Quinn|Tactical|alert\(1\)|Núñez/.test(h), 'a name reached an inline handler: ' + h);
      const calls = handlers.map((h) => h.match(/^(\w+)\('([^']*)'/));
      assert(calls.every(Boolean), 'a handler is not a simple call: ' + handlers.join(' | '));
      assert(calls.every((c) => c[2] === 'FIFS-1001'), 'a handler does not pass the student ID: ' + calls.map((c) => c[0]).join(' | '));
    }
    const html = renderRows([{ studentId: 'FIFS-1001', fullName: "Sean O'Connor", status: 'STEP_1_REGISTERED' }]);
    for (const fn of ['openStudentScoresheetModal', 'openAdminEditStudentModal', 'dispatchRangeBriefing', 'dispatchReviewRequest', 'deleteStudentFromRoster', 'openStudentDossierModal', 'updateStudentJourneyStep', 'resendStudentSetupLink']) {
      assert(html.includes(`${fn}('FIFS-1001'`), `${fn} is not wired to the student ID`);
    }
  });
  await test('The step dropdown has all eight intact options with the right one selected, plus a status chip and save indicator', async () => {
    const want = ['STEP_1_REGISTERED', 'STEP_2_CONFIRMED', 'STEP_3_PREPARATION', 'STEP_4_CLASSROOM', 'STEP_5_LIVE_FIRE', 'STEP_6_CERTIFIED', 'STEP_7_MSP_PORTAL', 'STEP_8_LICENSED'];
    want.forEach((value, i) => {
      const html = renderRows([{ studentId: 'FIFS-1001', fullName: 'A', status: value }]);
      const opts = [...html.matchAll(/<option value="([^"]*)"( selected)?>([^<]*)<\/option>/g)];
      assert(JSON.stringify(opts.map((o) => o[1])) === JSON.stringify(want), 'options are damaged: ' + opts.map((o) => JSON.stringify(o[1])).join(','));
      assert(opts.filter((o) => o[2]).length === 1 && opts[i][2], `exactly option ${i + 1} should be selected for ${value}`);
      assert(opts.every((o) => /^\d\. \S/.test(o[3])), 'an option label is missing: ' + opts.map((o) => o[3]).join('|'));
      assert(html.includes('id="chip-status-FIFS-1001"') && html.includes('id="save-ind-FIFS-1001"'), 'chip or save indicator id missing');
      assert(/<\/select>/.test(html) && !/\bL\s+<\/select>/.test(html), 'dropdown is truncated');
    });
  });
  await test('The roster markup is well-formed: no leftover template placeholders or stray braces', async () => {
    const html = renderRows([{ studentId: 'FIFS-1001', fullName: 'Tanae Test', email: 'qa.test.student@example.com', course: 'HQL', status: 'STEP_3_PREPARATION' }]);
    assert(!/\$\{|(?<![\w$])\{[a-zA-Z(]/.test(html.replace(/style="[^"]*"/g, '')), 'a template placeholder leaked into the page: ' + (html.match(/.{20}\$\{.{20}|.{20}(?<![\w$])\{[a-zA-Z(].{20}/) || [''])[0]);
    const count = (re) => (html.match(re) || []).length;
    for (const tag of ['td', 'select', 'a', 'div']) assert(count(new RegExp('<' + tag + '[\\s>]', 'g')) === count(new RegExp('</' + tag + '>', 'g')), `unbalanced <${tag}> tags`);
    assert(count(/<td[\s>]/g) === 8, 'expected 8 cells, found ' + count(/<td[\s>]/g));
  });
  await test('No row or modal trigger in the script builds an onclick from a name', async () => {
    const offenders = [];
    SCRIPT.split('\n').forEach((line, i) => {
      if (/onclick="[^"]*\(\s*'?\$\{[^}]*(fullName|\.name\b)/.test(line) || /onclick="[^"]*\('\{\(/.test(line) || /onclick="[^"]*\('\{[a-z]/i.test(line)) offenders.push(i + 1);
    });
    assert(offenders.length === 0, 'name or damaged placeholder in an inline handler at lines ' + offenders.join(', '));
  });

  await test('The delete confirmation names the student and ID instead of printing a broken placeholder', async () => {
    const src = findFunction(SCRIPT, 'function deleteStudentFromRoster(');
    assert(!/\{studentId\}\)/.test(src) && /' \(' \+ studentId \+ '\)/.test(src), 'delete confirmation text is damaged');
    const asked = [];
    const sandbox = { adminCachedStudents: [{ studentId: 'FIFS-1001', fullName: "Sean O'Connor" }], confirm: (m) => { asked.push(m); return false; }, getStaffSessionToken() {}, fifsSaveOrReport() { throw new Error('must not delete when cancelled'); }, renderAdminTerminal() {} };
    vm.createContext(sandbox);
    vm.runInContext(src + '\nthis.fn = deleteStudentFromRoster;', sandbox);
    sandbox.fn('FIFS-1001');
    assert(asked.length === 1 && asked[0].includes("Sean O'Connor") && asked[0].includes('FIFS-1001') && !/[{}]/.test(asked[0]), 'confirmation text: ' + asked[0]);
  });

  console.log('\n[SECTION B: page.tsx roster]');
  await test('Staff roster in page.tsx escapes text and only links http(s) dossier URLs', async () => {
    const start = PAGE.indexOf('    const escHtml = (value: unknown): string');
    const fnStart = PAGE.indexOf('(window as any).renderAdminTerminal = function(data: any) {');
    assert(start > 0 && fnStart > start, 'could not find the page.tsx roster renderer');
    const end = PAGE.indexOf('\n    };\n', fnStart) + '\n    };\n'.length;
    const js = ts.transpileModule(PAGE.slice(start, end), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
    const urls = ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)', 'https://files.example/doc.pdf'];
    for (const url of urls) {
      const b = fakeBrowser();
      const sandbox = { window: b.window, document: b.document, console: { error() {}, warn() {}, log() {} }, URL, Object, JSON, Array, String, Number, Math, Date, Promise, setTimeout, window_: null };
      vm.createContext(sandbox);
      vm.runInContext(js, sandbox);
      sandbox.window.renderAdminTerminal({ students: [{ ...hostileStudent, profileDocUrl: url }] });
      const html = b.html();
      assert(html.length > 100, 'the page.tsx roster rendered nothing');
      assert(!LIVE_MARKUP.test(html), `live markup reached the page.tsx roster: ${html.match(LIVE_MARKUP)}`);
      const hrefs = [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
      for (const href of hrefs) assert(href === '#' || /^https?:\/\//.test(href), `unsafe link in roster: ${href}`);
      if (url.startsWith('https://')) assert(hrefs.includes('https://files.example/doc.pdf'), 'a valid https dossier link must be kept');
    }
  });

  console.log('\n[SECTION C: Links shown to staff are http(s) only]');
  await test('Every staff-visible link assignment in the script goes through fifsSafeHttpUrl', async () => {
    const offenders = [];
    SCRIPT.split('\n').forEach((line, i) => {
      if (/(viewLink|currentLink|editLink)\.href\s*=/.test(line) && !/fifsSafeHttpUrl|safe/i.test(line)) offenders.push(i + 1);
    });
    assert(offenders.length === 0, `unchecked link assignments at lines ${offenders.join(', ')}`);
    assert(!/indexOf\(["']javascript["']\)/.test(SCRIPT), 'a substring check for "javascript" is not a safe URL test');
  });
  await test('handleDossierClick opens only http(s) URLs (with noopener) and treats other values as IDs', async () => {
    const calls = { opened: [], modal: [], alerts: [] };
    const sandbox = {
      window: { location: { origin: 'https://trainwithfifs.example' }, open: (...a) => calls.opened.push(a) },
      alert: (m) => calls.alerts.push(m), openStudentDossierModal: (id) => calls.modal.push(id), URL, String
    };
    vm.createContext(sandbox);
    vm.runInContext(findFunction(SCRIPT, 'function fifsSafeHttpUrl(') + '\n' + findFunction(SCRIPT, 'function handleDossierClick(') + '\nthis.fn = handleDossierClick;', sandbox);
    for (const v of ['javascript:alert(1)', 'JAVASCRIPT:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:x', '//evil.example/x', 'FIFS-1002']) sandbox.fn(v);
    assert(calls.opened.length === 0, `non-http values were opened: ${JSON.stringify(calls.opened)}`);
    assert(calls.modal.includes('FIFS-1002'), 'a Student ID must still open the dossier modal');
    sandbox.fn('https://files.example/doc.pdf'); sandbox.fn('HTTP://files.example/doc.pdf');
    assert(calls.opened.length === 2 && calls.opened.every((c) => c[2] === 'noopener,noreferrer'), `http(s) links must open with noopener: ${JSON.stringify(calls.opened)}`);
  });

  console.log('\n[SECTION D: Template guard]');
  await test('No roster or staff-list template interpolates a student-controlled field without escaping', async () => {
    const props = /(fullName|full_name|email|phone|course|course_selection|assignedDate|studentId|student_id|clientId|client_id|internalNotes|profileDocUrl|permitState|permit_state|expirationDate)\b/;
    const safe = /(escapeHtml|escHtml|fifsSafe|safeHttpUrl)/;
    const offenders = [];
    for (const [file, text] of [['TrainWithFIFS_scripts.js', SCRIPT]]) {
      text.split('\n').forEach((line, i) => {
        if (!line.includes('<') || !line.includes('${')) return;
        for (const m of line.matchAll(/\$\{([^}]*)\}/g)) {
          const expr = m[1];
          if (/^\s*(c|s)\.(clientId|studentId|fullName|email|phone|permitState|expirationDate)\b/.test(expr) && !safe.test(expr)) offenders.push(`${file}:${i + 1}`);
        }
      });
    }
    assert(offenders.length === 0, `unescaped student/client fields in templates at ${offenders.join(', ')}`);
  });

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Suite crashed:', e && e.stack); process.exit(1); });
