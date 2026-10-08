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

  console.log('\n[SECTION A3: Client roster contact cell]');
  const clientRows = (clients) => {
    const src = findFunction(SCRIPT, 'function renderAdminClientTerminal(data) {', 'last');
    return runRoster(src, `renderAdminClientTerminal({ clients: ${JSON.stringify(clients)} });`);
  };
  const rowCells = (html) => [...html.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
  const textOf = (cellHtml) => cellHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  await test('Client roster: each row shows the client\'s full name, then the email and phone, in the contact cell', async () => {
    const html = clientRows([{ clientId: 'CLI-1001', fullName: 'Marcus Client', email: 'marcus@client.example', phone: '(410) 555-0111', permitState: 'Maryland Wear & Carry', expirationDate: '2027-03-15', status: 'ACTIVE_REGISTERED' }]);
    const cells = rowCells(html);
    assert(cells.length === 7, 'expected 7 cells per row, found ' + cells.length);
    const contact = cells[1];
    assert(/<div style="font-weight: 700; color: #fff;">Marcus Client<\/div>/.test(contact), 'the full name must be shown in bold: ' + contact);
    assert(textOf(contact) === 'Marcus Client marcus@client.example • (410) 555-0111', 'contact cell text: ' + textOf(contact));
    assert(textOf(cells[0]) === 'CLI-1001' && /Maryland Wear & Carry|Maryland Wear &amp; Carry/.test(cells[2]) && textOf(cells[3]) === '2027-03-15', 'the other cells must be intact');
  });
  await test('Client roster: no raw template syntax or stray closing tag leaks into any row, and the markup is balanced', async () => {
    const html = clientRows([{ clientId: 'CLI-1001', fullName: 'Marcus Client', email: 'marcus@client.example', phone: '410-555-0111', permitState: 'Maryland Wear & Carry', expirationDate: '2027-03-15', status: 'ACTIVE_REGISTERED' }]);
    assert(!/\$\{|(?<![\w$])\{escape|\{c\.|undefined|\[object/.test(html), 'a template placeholder or undefined leaked: ' + (html.match(/.{20}(\$\{|\{escape|\{c\.|undefined|\[object).{20}/) || [''])[0]);
    const count = (re) => (html.match(re) || []).length;
    for (const tag of ['td', 'div', 'span', 'strong', 'button']) assert(count(new RegExp('<' + tag + '[\\s>]', 'g')) === count(new RegExp('</' + tag + '>', 'g')), `unbalanced <${tag}> tags`);
  });
  await test('Client roster: a missing phone shows no bullet, a missing name shows the fallback, and a missing email shows nothing odd', async () => {
    const noPhone = rowCells(clientRows([{ clientId: 'CLI-2', fullName: 'No Phone', email: 'np@client.example', permitState: 'Maryland Wear & Carry', status: 'ACTIVE_REGISTERED' }]))[1];
    assert(textOf(noPhone) === 'No Phone np@client.example' && !/•/.test(noPhone), 'no phone, no bullet: ' + textOf(noPhone));
    const noName = rowCells(clientRows([{ clientId: 'CLI-3', email: 'nn@client.example', status: 'ACTIVE_REGISTERED' }]))[1];
    assert(/Valued Client/.test(noName) && /nn@client\.example/.test(noName), 'the name fallback must show: ' + textOf(noName));
    const noEmail = rowCells(clientRows([{ clientId: 'CLI-4', fullName: 'No Email', status: 'ACTIVE_REGISTERED' }]))[1];
    assert(/No Email/.test(noEmail) && !/undefined|null/.test(noEmail), 'a missing email must not print undefined: ' + textOf(noEmail));
  });
  await test('Client roster: hostile names, emails, and phones are escaped in the contact cell', async () => {
    const html = clientRows([{ clientId: 'CLI-9', fullName: HOSTILE.tag, email: HOSTILE.svg, phone: HOSTILE.script, permitState: 'Maryland Wear & Carry', status: 'ACTIVE_REGISTERED' }]);
    const contact = rowCells(html)[1];
    assert(!LIVE_MARKUP.test(contact), 'live markup reached the contact cell: ' + contact);
    assert(contact.includes('&lt;img src=x onerror=alert(1)&gt;') && contact.includes('&lt;script&gt;alert(1)&lt;/script&gt;') && contact.includes('&quot;&gt;&lt;svg onload=alert(1)&gt;'), 'expected escaped name, phone, and email: ' + contact);
    const apostrophe = rowCells(clientRows([{ clientId: 'CLI-8', fullName: "Sean O'Connor", email: 'sean@client.example', status: 'ACTIVE_REGISTERED' }]))[1];
    assert(textOf(apostrophe).startsWith('Sean O&#039;Connor') || textOf(apostrophe).startsWith("Sean O'Connor"), 'an apostrophe must survive: ' + textOf(apostrophe));
  });
  await test('The live client roster has no escape call that is missing its $, and no stray closing tag in the contact cell', async () => {
    const src = findFunction(SCRIPT, 'function renderAdminClientTerminal(data) {', 'last');
    assert(!/(?<![\w$])\{escapeHtml\(/.test(src), 'a {escapeHtml(...)} without a $ remains in the client roster');
    assert(!/<strong style="color: #fff;">\{/.test(src), 'the old broken contact cell is back');
  });

  console.log('\n[SECTION A4: Empty client list, portal conflict message, and registration alert banners]');
  function runRosterFull(extraSource, call) {
    const b = fakeBrowser();
    const sandbox = { window: b.window, document: b.document, console: { error() {}, warn() {}, log() {} }, Promise, Object, JSON, Array, String, Number, Math, Date, isNaN };
    vm.createContext(sandbox);
    vm.runInContext(state + '\n' + helpers + '\n' + extraSource + '\n' + call, sandbox);
    return { html: b.html(), sandbox };
  }
  const liveClientRoster = () => findFunction(SCRIPT, 'function renderAdminClientTerminal(data) {', 'last');
  const A = { clientId: 'CLI-1', fullName: 'Alpha Client', email: 'alpha@client.example', phone: '', permitState: 'Maryland Wear & Carry', expirationDate: '2027-01-01', status: 'ACTIVE_REGISTERED' };
  const B = { clientId: 'CLI-2', fullName: 'Bravo Client', email: 'bravo@client.example', phone: '', permitState: 'Maryland Wear & Carry', expirationDate: '2027-02-01', status: 'ACTIVE_REGISTERED' };
  await test('Client roster: an empty client list from the server clears the cache and shows the empty state (a deleted last client disappears)', async () => {
    const { html, sandbox } = runRosterFull(liveClientRoster(), `renderAdminClientTerminal({ clients: ${JSON.stringify([A, B])} }); renderAdminClientTerminal({ clients: [] }); this.__cache = adminCachedClients.length; this.__win = window.adminCachedClients.length;`);
    assert(sandbox.__cache === 0 && sandbox.__win === 0, `the cache must be empty, got ${sandbox.__cache} / ${sandbox.__win}`);
    assert(/No client permit records found/.test(html), 'the empty state must show: ' + html.slice(0, 200));
    assert(!/Alpha Client|Bravo Client|alpha@client|bravo@client/.test(html), 'no deleted client may remain on screen');
    const first = runRosterFull(liveClientRoster(), 'renderAdminClientTerminal({ clients: [] }); this.__n = adminCachedClients.length;');
    assert(first.sandbox.__n === 0 && /No client permit records found/.test(first.html), 'an empty list on first load also shows the empty state');
  });
  await test('Client roster: a call with no list (or a non-list) leaves the cached clients alone and still draws them', async () => {
    const calls = ['renderAdminClientTerminal()', 'renderAdminClientTerminal({})', 'renderAdminClientTerminal({ clients: null })', "renderAdminClientTerminal({ clients: 'x' })", 'renderAdminClientTerminal({ clients: { length: 3 } })', 'renderAdminClientTerminal({ students: [] })'];
    for (const call of calls) {
      const { html, sandbox } = runRosterFull(liveClientRoster(), `renderAdminClientTerminal({ clients: ${JSON.stringify([A])} }); ${call}; this.__n = adminCachedClients.length;`);
      assert(sandbox.__n === 1 && /Alpha Client/.test(html) && !/No client permit records found/.test(html), `${call} must keep the cached client: n=${sandbox.__n}`);
    }
  });
  await test('Client roster: a non-empty list still replaces the old one', async () => {
    const { html, sandbox } = runRosterFull(liveClientRoster(), `renderAdminClientTerminal({ clients: ${JSON.stringify([A, B])} }); renderAdminClientTerminal({ clients: ${JSON.stringify([B])} }); this.__n = adminCachedClients.length;`);
    assert(sandbox.__n === 1 && /Bravo Client/.test(html) && !/Alpha Client/.test(html), 'the new list replaces the old: ' + html.slice(0, 160));
  });

  // ---- portal conflict message: both copies in the script (the later one is the live one) ----
  const conflictCopies = [['earlier copy', findFunction(SCRIPT, 'function showPortalConflictModal(', 'first')], ['live copy', findFunction(SCRIPT, 'function showPortalConflictModal(', 'last')]];
  function runConflict(src, direction, name, id) {
    const el = (extra = {}) => ({ innerHTML: '', textContent: '', style: { setProperty() {} }, classList: { add() {}, remove() {} }, ...extra });
    const els = { portalConflictModal: el(), conflictModalMessage: el(), 'btn-conflict-switch': el() };
    const sandbox = { document: { getElementById: (i) => els[i] || null, body: { classList: { add() {}, remove() {} }, style: {} } }, logoutStudent() {}, logoutClient() {}, closePortalConflictModal() {}, openAndSwitch() {} };
    vm.createContext(sandbox);
    vm.runInContext(findFunction(SCRIPT, 'function escapeHtml(str) {') + '\n' + src + `\nshowPortalConflictModal(${JSON.stringify(direction)}, ${JSON.stringify(name)}, ${JSON.stringify(id)});`, sandbox);
    return els.conflictModalMessage.innerHTML;
  }
  assert(SCRIPT.split('function showPortalConflictModal(').length - 1 === 2, 'the script is expected to declare showPortalConflictModal twice; update this test if one is removed');
  for (const [label, src] of conflictCopies) {
    await test(`Portal conflict message (${label}): shows the name and ID in bold, closes its tags, and leaks no placeholder`, async () => {
      for (const direction of ['student_to_client', 'client_to_student']) {
        const html = runConflict(src, direction, 'Marcus Vance', 'FIFS-1001');
        assert(html.includes('as <strong>Marcus Vance (FIFS-1001)</strong>.<br><br>'), `${direction}: name and ID expected: ${html.replace(/\s+/g, ' ').slice(0, 260)}`);
        assert(!/\$\{|(?<![\w$])\{\w|\)\.<br>|undefined|\[object/.test(html), `${direction}: a placeholder leaked: ${html.replace(/\s+/g, ' ')}`);
        assert((html.match(/<strong/g) || []).length === (html.match(/<\/strong>/g) || []).length, `${direction}: unbalanced <strong> tags`);
        const noName = runConflict(src, direction, '', 'FIFS-1001');
        assert(noName.includes('as <strong>FIFS-1001</strong>.<br><br>') && !/\(\s*FIFS/.test(noName.split('as <strong>')[1].split('</strong>')[0]), `${direction}: without a name only the ID shows: ${noName.replace(/\s+/g, ' ').slice(0, 220)}`);
      }
    });
    await test(`Portal conflict message (${label}): hostile names and IDs are escaped`, async () => {
      const html = runConflict(src, 'student_to_client', HOSTILE.tag, HOSTILE.breakout);
      assert(!LIVE_MARKUP.test(html) && !html.includes(HOSTILE.breakout), 'live markup or an unescaped quote reached the message: ' + html.replace(/\s+/g, ' ').slice(0, 300));
      assert(html.includes('&lt;img src=x onerror=alert(1)&gt;'), 'the hostile name should appear escaped');
      const apostrophe = runConflict(src, 'client_to_student', "Sean O'Connor", 'FI-CLIENT-9');
      assert(apostrophe.includes('Sean O&#039;Connor (FI-CLIENT-9)'), 'an apostrophe must be escaped, not break the markup: ' + apostrophe.replace(/\s+/g, ' ').slice(0, 220));
    });
  }

  // ---- registration alert banners ----
  function runAlert(fnName, storageKey, payload) {
    const els = { box: { style: {} }, badge: { style: {} }, desc: { innerHTML: '' } };
    const idMap = fnName === 'checkNewClientAlert'
      ? { 'admin-new-client-alert-box': els.box, 'admin-client-alert-pill': els.badge, 'admin-client-alert-desc': els.desc }
      : { 'admin-new-student-alert-box': els.box, 'admin-roster-alert-pill': els.badge, 'admin-alert-desc': els.desc };
    const sandbox = { document: { getElementById: (i) => idMap[i] || null }, _fifsMemStorage: { getItem: (k) => (k === storageKey ? payload : null) } };
    vm.createContext(sandbox);
    vm.runInContext(findFunction(SCRIPT, 'function escapeHtml(str) {') + '\n' + findFunction(SCRIPT, 'function ' + fnName + '(') + `\n${fnName}();`, sandbox);
    return els;
  }
  for (const [fnName, key, field, fallback] of [['checkNewClientAlert', 'fifs_new_client_alert', 'permitState', 'Client Registration'], ['checkNewStudentAlert', 'fifs_new_student_alert', 'course', 'Course Registration']]) {
    await test(`${fnName}: the banner shows "<item> at <ID>" with the ID in <code>, falls back cleanly, and is escaped`, async () => {
      const ok = runAlert(fnName, key, JSON.stringify({ [field]: 'Maryland Wear & Carry', id: 'FI-1042' }));
      assert(ok.desc.innerHTML === '<strong>Maryland Wear &amp; Carry</strong> at <code>FI-1042</code>' && ok.box.style.display === 'flex' && ok.badge.style.display === 'inline-block', 'banner: ' + ok.desc.innerHTML);
      const bare = runAlert(fnName, key, JSON.stringify({}));
      assert(bare.desc.innerHTML === `<strong>${fallback}</strong> at <code></code>`, 'fallbacks: ' + bare.desc.innerHTML);
      const evil = runAlert(fnName, key, JSON.stringify({ [field]: HOSTILE.tag, id: HOSTILE.script }));
      assert(!LIVE_MARKUP.test(evil.desc.innerHTML) && evil.desc.innerHTML.includes('&lt;img src=x onerror=alert(1)&gt;') && evil.desc.innerHTML.includes('&lt;script&gt;'), 'hostile values must be escaped: ' + evil.desc.innerHTML);
      assert(!/\$\{|(?<![\w$])\{/.test(ok.desc.innerHTML + bare.desc.innerHTML), 'no placeholder may leak');
    });
    await test(`${fnName}: no alert, bad data, or a missing banner is ignored without errors`, async () => {
      const none = runAlert(fnName, key, null);
      assert(none.desc.innerHTML === '' && none.box.style.display === undefined, 'no stored alert shows nothing');
      let threw = null; try { runAlert(fnName, key, '{not json'); } catch (e) { threw = e; }
      assert(!threw, 'malformed stored data must not throw');
    });
  }
  await test('No escape call or placeholder in the script is missing its $ on a line of markup (state law pill reported separately)', async () => {
    const bad = SCRIPT.split('\n').map((l, i) => ({ l, n: i + 1 })).filter(({ l }) => l.includes('<') && /(^|[^\w$'"`\\])\{(escapeHtml\(|activeId\}|item\.(?!ans\}))/.test(l));
    assert(bad.length === 0, 'damaged placeholders at line(s) ' + bad.map((x) => x.n).join(', '));
  });

  console.log('\n[SECTION A5: State law accordion pills]');
  function runStateModal(statutes) {
    const cards = [];
    const mkEl = () => ({ textContent: '', innerHTML: '', style: { setProperty() {} }, classList: { add() {}, remove() {} } });
    const els = {};
    const accordion = { set innerHTML(v) { if (v === '') cards.length = 0; }, get innerHTML() { return cards.map((c) => c.innerHTML).join(''); }, appendChild(c) { cards.push(c); } };
    const sandbox = {
      STATES_DATA: { MD: { name: 'Maryland', statutes, summary: 's', duty: 'd', mag_limit: '10', vehicle: 'v' } }, currentStateFocus: 'MD', window: {},
      evaluateState: () => ({ verdictText: 'OK', canCarry: true, status: 'ok' }), switchModalTab() {},
      document: { getElementById: (id) => (id === 'statuteAccordionList' ? accordion : (els[id] = els[id] || mkEl())), createElement: () => ({ className: '', innerHTML: '' }) }
    };
    vm.createContext(sandbox);
    vm.runInContext(findFunction(SCRIPT, 'function escapeHtml(str) {') + '\n' + findFunction(SCRIPT, 'function openStateModal(') + "\nopenStateModal('MD');", sandbox);
    return cards;
  }
  const pillOf = (card) => (card.innerHTML.match(/<span class="statute-status-pill ([^"]*)">([^<]*)<\/span>/) || []);
  await test('State law accordion: each pill carries its badge class and the answer text, for YES, NO, and INFO', async () => {
    const cards = runStateModal({
      weapons_other: { ans: 'YES', badge: 'badge-yes', desc: 'Allowed.' }, licensure: { ans: 'NO', badge: 'badge-no', desc: 'No.' }, mag_limits: { ans: 'INFO', badge: 'badge-info', desc: 'See code.' }
    });
    assert(cards.length === 9, 'one card per question expected, got ' + cards.length);
    assert(JSON.stringify(pillOf(cards[0]).slice(1)) === '["badge-yes","YES"]', 'YES pill: ' + pillOf(cards[0]));
    assert(JSON.stringify(pillOf(cards[1]).slice(1)) === '["badge-no","NO"]', 'NO pill: ' + pillOf(cards[1]));
    assert(JSON.stringify(pillOf(cards[2]).slice(1)) === '["badge-info","INFO"]', 'INFO pill: ' + pillOf(cards[2]));
    assert(/WEAPONS OTHER THAN HANDGUNS ALLOWED\?/.test(cards[0].innerHTML) && /Allowed\./.test(cards[0].innerHTML), 'the question and description must still show');
  });
  await test('State law accordion: a missing or empty answer falls back to INFO, and hostile values are escaped', async () => {
    const cards = runStateModal({ weapons_other: { ans: '', badge: '', desc: 'x' }, licensure: { desc: 'y' }, mag_limits: { ans: '<img src=x onerror=alert(1)>', badge: 'x" onmouseover="alert(1)', desc: 'z' } });
    assert(JSON.stringify(pillOf(cards[0]).slice(1)) === '["badge-info","INFO"]', 'empty values: ' + pillOf(cards[0]));
    assert(JSON.stringify(pillOf(cards[1]).slice(1)) === '["badge-info","INFO"]', 'missing values: ' + pillOf(cards[1]));
    assert(cards[3] && JSON.stringify(pillOf(cards[3]).slice(1)) === '["badge-info","INFO"]', 'a key that is absent from the data uses the built-in fallback');
    const evil = cards[2].innerHTML;
    assert(!LIVE_MARKUP.test(evil) && !/class="[^"]*" onmouseover=/.test(evil), 'hostile values broke out of the markup: ' + evil.replace(/\s+/g, ' ').slice(0, 260));
    assert(evil.includes('&lt;img src=x onerror=alert(1)&gt;') && evil.includes('x&quot; onmouseover=&quot;alert(1)'), 'hostile values must appear escaped');
  });
  await test('State law accordion: every card is well-formed: balanced tags and no leaked placeholder', async () => {
    const cards = runStateModal({ weapons_other: { ans: 'YES', badge: 'badge-yes', desc: 'Allowed.' } });
    for (const card of cards) {
      const html = card.innerHTML;
      for (const tag of ['button', 'div', 'span']) assert((html.match(new RegExp('<' + tag + '[\\s>]', 'g')) || []).length === (html.match(new RegExp('</' + tag + '>', 'g')) || []).length, `unbalanced <${tag}> in a card`);
      assert(!/\$\{|(?<![\w$])\{item|\{label|undefined|\[object/.test(html), 'placeholder leaked: ' + html.replace(/\s+/g, ' ').slice(0, 200));
      assert(/<span class="statute-status-pill [^"]+">[^<]+<\/span>/.test(html), 'the pill must be a complete element');
    }
  });
  await test('State law data and styles agree: only YES/badge-yes, NO/badge-no, INFO/badge-info are used, and each class has a style', async () => {
    const allPairs = [...SCRIPT.matchAll(/"ans": "([A-Z]+)",\s*"badge": "(badge-[a-z]+)"/g)].map((m) => m[1] + '/' + m[2]);
    assert(allPairs.length > 400, 'expected to find the answer/badge pairs in the state data, found ' + allPairs.length);
    const pairs = new Set(allPairs);
    const loose = new Set([...SCRIPT.matchAll(/"ans": "([A-Z]+)"/g)].map((m) => m[1]));
    assert(JSON.stringify([...loose].sort()) === JSON.stringify(['INFO', 'NO', 'YES']), 'unexpected answers in the data: ' + [...loose]);
    assert(JSON.stringify([...pairs].sort()) === JSON.stringify(['INFO/badge-info', 'NO/badge-no', 'YES/badge-yes']), 'answers and badges are not paired as expected: ' + [...pairs]);
    const css = fs.readFileSync(path.resolve(__dirname, '../src/app/globals.css'), 'utf-8');
    for (const cls of ['badge-yes', 'badge-no', 'badge-info']) assert(new RegExp('\\.' + cls + '\\s*\\{').test(css), `${cls} has no style rule`);
    assert(/\.statute-status-pill\s*\{/.test(css), 'the pill itself has no style rule');
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
