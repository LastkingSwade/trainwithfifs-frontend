/**
 * TrainWithFIFS - Comms HUD thread ids, instructor bubble escaping, and pod invite code display (offline)
 *
 * Covers: the Comms HUD never invents thread ids (the server issues them with a secret), instructor chat bubbles are escaped,
 * the staff Discord reply alert template is intact, and the pod invite code survives the Stripe redirect and is shown on return.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const PAGE = fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf-8');
const SCRIPT = fs.readFileSync(path.join(ROOT, 'public/scripts/TrainWithFIFS_scripts.js'), 'utf-8');

let passed = 0, failed = 0;
const queue = [];
const section = (t) => queue.push({ title: t });
const test = (name, fn) => queue.push({ name, fn });
function assert(c, m) { if (!c) throw new Error(m); }

// Returns the index of the closing quote for the string/template literal that starts at src[i] (templates may nest ${ ... }).
function skipLiteral(src, i) {
  const q = src[i];
  for (i++; i < src.length; i++) {
    const c = src[i];
    if (c === '\\') { i++; continue; }
    if (q === '`' && c === '$' && src[i + 1] === '{') { i = skipBraces(src, i + 1); continue; }
    if (c === q) return i;
  }
  throw new Error('unterminated literal');
}
// Returns the index of the "}" matching the "{" at src[i].
function skipBraces(src, i) {
  let depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') { i = skipLiteral(src, i); continue; }
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue; }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i;
  }
  throw new Error('unbalanced');
}
function balanced(src, start) { const open = src.indexOf('{', start); return src.slice(start, skipBraces(src, open) + 1); }
const lastFunction = (name) => { const at = SCRIPT.lastIndexOf(`function ${name}(`); assert(at >= 0, 'missing ' + name); return balanced(SCRIPT, at); };

// ---- a tiny DOM recorder ----
function makeEnv() {
  const els = {};
  const mk = (id) => ({ id, style: {}, classList: { add() {}, remove() {} }, innerHTML: '', textContent: '', value: '', appendChild() {}, scrollTop: 0, scrollHeight: 0 });
  const doc = { getElementById: (id) => (els[id] = els[id] || mk(id)), body: { style: {}, className: '' }, createElement: () => mk('x') };
  const calls = [];
  const win = { __currentChatSession: null, __activeChatSession: null };
  win.callFifsBackend = (action, payload, ok) => { calls.push({ action, payload: JSON.parse(JSON.stringify(payload)) }); win.__reply && ok && ok(win.__reply(action, payload)); };
  const ctx = { window: win, document: doc, sessionStorage: { setItem() {}, getItem() { return null; } }, console, setInterval: () => 1, clearInterval() {}, setTimeout: (f) => 1 };
  ctx.callFifsBackend = win.callFifsBackend;
  return { ctx, win, calls, els, doc };
}
function runFns(env, names, extra) {
  const code = names.map(lastFunction).join('\n') + '\n' + extra;
  const pre = `function escapeChatHtml(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function appendOutgoingVisitorBubble(){} function renderLiveVisitorRoster(){} function renderLiveVisitorStream(){}`;
  vm.runInNewContext(pre + '\n' + code, env.ctx);
}

section('\n[SECTION A: the Comms HUD never invents thread ids]');
test('Source: no code path builds a "thread_<phone>" or "thread_<timestamp>" id for the HUD', () => {
  const hud = lastFunction('openP2pCommsHud') + lastFunction('submitCurrentMessage');
  assert(!/'thread_'|"thread_"|Date\.now\(\)/.test(hud), 'the HUD still invents a thread id');
});
test('A first HUD message sends no thread id; the server-issued id and secret are kept for later messages', () => {
  const env = makeEnv();
  env.win.__currentChatSession = { name: 'Pat', phone: '4105550100' };
  env.win.__activeChatSession = { name: 'Pat', phone: '4105550100' };
  env.win.__reply = () => ({ status: 'success', threadId: 'th_abc', threadSecret: 'sec_123', messages: [] });
  env.ctx.window.__reply = env.win.__reply;
  runFns(env, ['submitCurrentMessage'], "submitCurrentMessage('hello'); submitCurrentMessage('second');");
  assert(env.calls.length === 2, 'expected two backend calls, got ' + env.calls.length);
  const first = env.calls[0].payload, second = env.calls[1].payload;
  assert(!('threadId' in first) && !('threadSecret' in first), 'the first message must not carry an invented id: ' + JSON.stringify(first));
  assert(second.threadId === 'th_abc' && second.threadSecret === 'sec_123', 'the second message must reuse the server-issued credentials: ' + JSON.stringify(second));
  assert(env.win.__activeChatSession.threadId === 'th_abc', 'the active HUD session keeps the id');
});
test('Opening the HUD with an opening message sends no invented id, and reuses a server-issued thread only with its secret', () => {
  const a = makeEnv();
  a.win.__reply = () => ({ status: 'success', threadId: 'th_new', threadSecret: 'sec_new', messages: [] });
  runFns(a, ['openP2pCommsHud'], "openP2pCommsHud('Lee', '(410) 555-0199', 'Hi there');");
  const first = a.calls.find((c) => c.action === 'handleLiveChatMessage');
  assert(first && !('threadId' in first.payload), 'opening message must not carry an id: ' + JSON.stringify(first));
  assert(a.win.__currentChatSession.threadId === 'th_new' && a.win.__currentChatSession.threadSecret === 'sec_new', 'server credentials stored');
  const b = makeEnv();
  b.win.__currentChatSession = { name: 'Lee', phone: '4105550199', threadId: 'th_old', threadSecret: 'sec_old' };
  runFns(b, ['openP2pCommsHud'], "openP2pCommsHud('Lee', '4105550199', 'Again');");
  const again = b.calls.find((c) => c.action === 'handleLiveChatMessage');
  assert(again.payload.threadId === 'th_old' && again.payload.threadSecret === 'sec_old', 'an existing server thread is reused with its secret');
  const c = makeEnv();
  c.win.__currentChatSession = { name: 'Lee', phone: '4105550199', threadId: 'th_stale' };
  runFns(c, ['openP2pCommsHud'], "openP2pCommsHud('Lee', '4105550199', 'No secret');");
  assert(!('threadId' in c.calls.find((x) => x.action === 'handleLiveChatMessage').payload), 'an id without its secret is never sent');
});

section('\n[SECTION B: instructor chat bubbles are escaped]');
test('A reply containing HTML is shown as text in the visitor chat (instructor side)', () => {
  const env = makeEnv();
  const stream = { appendChild(row) { stream.rows.push(row); }, rows: [], scrollTop: 0, scrollHeight: 0 };
  env.doc.getElementById = (id) => (id === 'twoWayChatStream' ? stream : null);
  env.ctx.document.createElement = () => ({ style: {}, innerHTML: '' });
  const escAt = SCRIPT.lastIndexOf('function escapeHtml(');
  const escSrc = SCRIPT.slice(escAt, SCRIPT.indexOf(".replace(/'/g, '&#039;');", escAt) + ".replace(/'/g, '&#039;');".length) + '\n}';
  const code = escSrc + '\n' + lastFunction('appendTwoWayBubble') + '\nfunction fifsChatSetBubbleState(){}\n' +
    `appendTwoWayBubble('instructor', 'Coach <b>Kai</b>', '<img src=x onerror=alert(1)> & <script>bad()</script>', '9:00 AM');`;
  vm.runInNewContext(code, env.ctx);
  const html = stream.rows[0].innerHTML;
  assert(!/<img|<script|<b>/i.test(html), 'raw HTML reached the page: ' + html.replace(/\s+/g, ' ').slice(0, 300));
  assert(html.includes('&lt;img src=x onerror=alert(1)&gt;') && html.includes('&amp;'), 'the text should appear escaped: ' + html.replace(/\s+/g, ' ').slice(0, 300));
});
test('The staff reply Discord alert template is intact (name and phone are interpolated)', () => {
  assert(!/\*\*\{thread\.senderPhone\}\)/.test(SCRIPT), 'the damaged template is still present');
  assert(/student \*\*\$\{thread\.senderName\}\*\* \(\$\{thread\.senderPhone\}\)/.test(SCRIPT), 'the repaired template is missing');
});

section('\n[SECTION C: pod invite code is kept across the Stripe redirect and shown on return]');
test('The checkout response code is stored before the redirect to Stripe', () => {
  const at = PAGE.indexOf("sessionStorage.setItem('fifs_pod_invite_code'");
  const redirect = PAGE.indexOf('window.location.href = data.url;', at);
  assert(at > 0 && redirect > at, 'the code must be stored before window.location.href = data.url');
});
function runBanner(search, stored) {
  const at = PAGE.indexOf('// After Stripe returns to /?booking_confirmed=true');
  assert(at >= 0, 'banner effect missing');
  const body = balanced(PAGE, PAGE.indexOf('useEffect(() => ', at) + 'useEffect(() => '.length);
  const appended = [];
  const store = { fifs_pod_invite_code: stored };
  const mkEl = () => ({ style: {}, children: [], textContent: '', setAttribute() {}, addEventListener() {}, append(...k) { this.children.push(...k); }, remove() {} });
  const js = ts.transpileModule(`(function(){ const f = () => ${body}; f(); })()`, { compilerOptions: { target: 'ES2020' } }).outputText;
  vm.runInNewContext(js, {
    window: { location: { search } },
    URLSearchParams,
    sessionStorage: { getItem: (k) => (k in store ? store[k] : null), removeItem: (k) => { delete store[k]; } },
    document: { createElement: mkEl, body: { appendChild: (e) => appended.push(e) } },
  });
  return { appended, store };
}
test('Returning from Stripe shows the pod code once, as plain text, and clears it', () => {
  const r = runBanner('?session_id=cs_x&booking_confirmed=true&invoice=INV-1', 'FIFS-POD-A1B2');
  assert(r.appended.length === 1, 'banner not shown');
  const texts = r.appended[0].children.map((c) => c.textContent);
  assert(texts.includes('FIFS-POD-A1B2'), 'code missing from banner: ' + texts.join(' | '));
  assert(!('fifs_pod_invite_code' in r.store), 'the stored code should be cleared');
});
test('No banner without booking_confirmed, with no stored code, or with anything that is not a pod code', () => {
  assert(runBanner('?booking_cancelled=true', 'FIFS-POD-A1B2').appended.length === 0, 'shown on a cancelled booking');
  assert(runBanner('?booking_confirmed=true', null).appended.length === 0, 'shown with no code');
  assert(runBanner('?booking_confirmed=true', '<img src=x onerror=alert(1)>').appended.length === 0, 'a hostile value was displayed');
});

section('\n[SECTION D: the booking form\'s pod code box]');
function podBoxEnv(backend) {
  const at = PAGE.indexOf('// ---- Private pod code (group member joining a leader');
  const end = PAGE.indexOf('(window as any).confirmAndFinalizeBooking = function', at);
  assert(at > 0 && end > at, 'pod code functions not found');
  const mk = (extra = {}) => ({ style: {}, value: '', disabled: false, textContent: '', selectedIndex: 3, options: [], ...extra });
  const els = {
    podCodeInput: mk({ value: ' fifs-pod-ab12 ' }),
    podCodeStatus: mk(), btnClearPodCode: mk(),
    courseSelection: mk({ options: [{ value: 'Maryland HQL (Purchase License) — Base Track ($100.00)' }, { value: 'Maryland Wear & Carry (CCW) — Base Track ($199.99)' }] }),
    groupSize: mk(),
  };
  const priceUpdates = [];
  const win = { callFifsBackend: backend, updateFormPriceDisplay: () => priceUpdates.push(1) };
  const js = ts.transpileModule(`(function(){ ${PAGE.slice(at, end)} })()`, { compilerOptions: { target: 'ES2020' } }).outputText;
  vm.runInNewContext(js, { window: win, document: { getElementById: (id) => els[id] || null }, Array, String, Error });
  return { els, win, priceUpdates };
}
test('A valid code selects the pod\'s course, locks the course and group size, shows the seats left and offers Remove', async () => {
  const e = podBoxEnv(async (action, payload) => { assert(action === 'validatePodCode' && payload.code === 'FIFS-POD-AB12', 'wrong call: ' + JSON.stringify([action, payload])); return { valid: true, course: 'Maryland Wear & Carry (CCW) — Base Track ($199.99)', seatsLeft: 2 }; });
  await e.win.applyPodCode();
  assert(e.els.courseSelection.value === 'Maryland Wear & Carry (CCW) — Base Track ($199.99)' && e.els.courseSelection.disabled === true, 'course not selected/locked');
  assert(e.els.groupSize.disabled === true && e.els.groupSize.selectedIndex === 0, 'group size must be reset to 1 person and locked');
  assert(e.win.__fifsPodCode === 'FIFS-POD-AB12' && e.els.podCodeInput.disabled === true && e.els.btnClearPodCode.style.display === 'inline-block', 'code not applied');
  assert(/2 seat\(s\) left/.test(e.els.podCodeStatus.textContent) && /normal single-person price/.test(e.els.podCodeStatus.textContent), e.els.podCodeStatus.textContent);
  assert(e.priceUpdates.length >= 1, 'the price display must refresh');
});
test('A bad code shows the server\'s message and leaves the form untouched', async () => {
  const e = podBoxEnv(async () => { throw new Error('That pod code was not found.'); });
  await e.win.applyPodCode();
  assert(e.win.__fifsPodCode === '' && e.els.courseSelection.disabled === false && e.els.groupSize.disabled === false, 'form must stay editable');
  assert(e.els.podCodeStatus.textContent === 'That pod code was not found.' && e.els.podCodeStatus.style.color === '#f87171', e.els.podCodeStatus.textContent);
});
test('A pod for a course the form does not list is refused (never half-applied)', async () => {
  const e = podBoxEnv(async () => ({ valid: true, course: 'Some Unlisted Course', seatsLeft: 1 }));
  await e.win.applyPodCode();
  assert(e.win.__fifsPodCode === '' && e.els.courseSelection.disabled === false && /not available to book online/.test(e.els.podCodeStatus.textContent), e.els.podCodeStatus.textContent);
});
test('Remove puts the form back, and an empty box applies nothing', async () => {
  const e = podBoxEnv(async () => ({ valid: true, course: 'Maryland HQL (Purchase License) — Base Track ($100.00)', seatsLeft: 1 }));
  await e.win.applyPodCode();
  e.win.clearPodCode();
  assert(e.win.__fifsPodCode === '' && e.els.courseSelection.disabled === false && e.els.groupSize.disabled === false && e.els.podCodeInput.disabled === false && e.els.podCodeInput.value === '' && e.els.btnClearPodCode.style.display === 'none', 'form not restored');
  let called = false;
  const blank = podBoxEnv(async () => { called = true; return {}; });
  blank.els.podCodeInput.value = '   ';
  await blank.win.applyPodCode();
  assert(!called, 'an empty code must not call the server');
});
test('The code travels with the booking: form box exists, and both payloads carry podCode', () => {
  assert(/id="podCodeInput"/.test(PAGE) && /data-onclick="applyPodCode\(\)"/.test(PAGE) && /data-onclick="clearPodCode\(\)"/.test(PAGE), 'the form box is missing');
  assert(/podCode: \(window as any\)\.__fifsPodCode \|\| ''/.test(PAGE), 'the invoice step does not record the code');
  assert(/podCode: p\.podCode \|\| ''/.test(PAGE), 'the checkout request does not send the code');
});

(async () => {
  for (const item of queue) {
    if (item.title) { console.log(item.title); continue; }
    try { await item.fn(); passed++; console.log(`  ✓ PASS: ${item.name}`); }
    catch (err) { failed++; console.log(`  ✗ FAIL: ${item.name}\n    -> ${err.message}`); }
  }
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
})();
