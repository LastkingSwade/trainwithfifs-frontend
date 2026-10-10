// Group code confirmation email: content, escaping, and that it only sends with a key, a valid address and a real code.
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert'); const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..');
const load = (rel, extra = {}) => { const m = { exports: {} }; const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const req = (id) => (id === '@/group/groupCopy' ? loadCopy() : require(id));
  vm.runInNewContext(ts.transpileModule(src, { compilerOptions: { target: 'ES2020', module: 'commonjs' } }).outputText, { module: m, exports: m.exports, require: req, process, console, encodeURIComponent, String, Number, Array, Promise, Error, JSON, ...extra }); return m.exports; };
let copyCache; const loadCopy = () => (copyCache = copyCache || load('src/group/groupCopy.ts'));
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
(async () => {
  const calls = []; let status = 200;
  const fetchMock = async (url, init) => { calls.push({ url, init }); return { ok: status === 200, status }; };
  const mail = () => load('src/Lib/server/group-email.ts', { fetch: fetchMock });
  const meta = { code: 'FIFS-POD-A1B2', course: 'Maryland Wear & Carry (CCW) — VIP Turnkey ($279.99)', dates: 'Oct 25', size: 4, name: 'Pat <b>Leader</b>' };
  console.log('\n[group code email]');
  await test('The email carries the code, the four steps, a forwardable invite and help, and never shows the old VIP Turnkey wording or a price', () => {
    const { subject, html, text } = mail().buildGroupCodeEmail(meta);
    assert(subject === 'Your group code for Maryland Wear & Carry (CCW): FIFS-POD-A1B2', subject);
    for (const k of ['FIFS-POD-A1B2', 'Book and pay', 'Everyone joins', 'Forward this part to your party', "Cindy&#39;s Hot Shots", 'POD CODE', '443-990-1304', 'Oct 25']) assert(html.includes(k), 'html missing ' + k);
    assert(!/Turnkey|\$279/.test(html + text + subject) && /FIFS-POD-A1B2/.test(text));
  });
  await test('Names and details are HTML-escaped', () => {
    const { html } = mail().buildGroupCodeEmail(meta);
    assert(!html.includes('<b>Leader</b>') && html.includes('Hi Pat,'), 'the name must be escaped (only the first word is used)');
    assert(!mail().buildGroupCodeEmail({ ...meta, course: '<script>x</script>' }).html.includes('<script>'));
  });
  await test('It sends through Resend with the key, to the booker only, and reports success', async () => {
    process.env.RESEND_API_KEY = 're_test'; calls.length = 0; status = 200;
    assert.strictEqual(await mail().sendGroupCodeEmail('pat@example.com', meta), true);
    assert(calls.length === 1 && calls[0].url === 'https://api.resend.com/emails' && calls[0].init.headers.Authorization === 'Bearer re_test');
    const body = JSON.parse(calls[0].init.body); assert.deepStrictEqual(body.to, ['pat@example.com']); assert(body.html.includes('FIFS-POD-A1B2') && body.text);
  });
  await test('No email without a key, with a bad address, or with something that is not a group code; a provider error returns false and never throws', async () => {
    calls.length = 0; process.env.RESEND_API_KEY = '';
    assert.strictEqual(await mail().sendGroupCodeEmail('pat@example.com', meta), false);
    process.env.RESEND_API_KEY = 're_test';
    assert.strictEqual(await mail().sendGroupCodeEmail('not-an-email', meta), false);
    assert.strictEqual(await mail().sendGroupCodeEmail('pat@example.com', { ...meta, code: '<x>' }), false);
    assert.strictEqual(calls.length, 0);
    status = 500; assert.strictEqual(await mail().sendGroupCodeEmail('pat@example.com', meta), false); status = 200;
    const boom = load('src/Lib/server/group-email.ts', { fetch: async () => { throw new Error('network'); } });
    assert.strictEqual(await boom.sendGroupCodeEmail('pat@example.com', meta), false);
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
