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
  for (const which of ['first', 'last']) {
    await test(`Student roster (${which} copy): hostile text is escaped and attributes cannot be broken out of`, async () => {
      const src = findFunction(SCRIPT, 'function renderAdminTerminal(data) {', which) + '\n' + findFunction(SCRIPT, 'function renderAdminClientTerminal(data) {', which);
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
