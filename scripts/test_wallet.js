// Document wallet: opt-in, owner-only, encrypted before storage, file checks, limits, purge on delete (offline).
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert'); const ts = require('typescript'); const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const load = (rel) => { const m = { exports: {} }; vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { compilerOptions: { target: 'ES2020', module: 'commonjs', esModuleInterop: true } }).outputText, { module: m, exports: m.exports, require, process, console, Date, Object, Array, String, Number, Math, Promise, JSON, Buffer, RegExp }); return m.exports; };
let passed = 0, failed = 0;
async function test(n, f) { try { await f(); console.log('  ✓ PASS: ' + n); passed++; } catch (e) { console.log('  ✗ FAIL: ' + n + '\n    -> ' + e.message); failed++; } }
const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PDF = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('hello wallet document, serial-free')]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40, 7)]);
function mem() {
  const t = { wallet_consent: [], wallet_documents: [] }; const files = {};
  const from = (table) => { const f = []; let op = 'select', vals = null;
    const q = { select: () => q, eq: (c, v) => { f.push((r) => r[c] === v); return q; }, order: () => q, limit: () => q, upsert: (v) => { op = 'upsert'; vals = v; return q; }, insert: (v) => { op = 'insert'; vals = v; return q; }, delete: () => { op = 'delete'; return q; },
      maybeSingle: async () => ({ data: t[table].filter((r) => f.every((x) => x(r)))[0] ? { ...t[table].filter((r) => f.every((x) => x(r)))[0] } : null, error: null }),
      then: (res) => { if (op === 'upsert') { const i = t[table].findIndex((r) => r.user_id === vals.user_id); if (i >= 0) Object.assign(t[table][i], vals); else t[table].push({ ...vals }); return res({ error: null }); }
        if (op === 'insert') { t[table].push({ created_at: new Date().toISOString(), ...vals }); return res({ error: null }); }
        const hit = t[table].filter((r) => f.every((x) => x(r))); if (op === 'delete') { t[table] = t[table].filter((r) => !hit.includes(r)); return res({ error: null }); }
        return res({ data: hit.map((r) => ({ ...r })), error: null }); } }; return q; };
  const storage = { from: () => ({ upload: async (p, b) => { files[p] = Buffer.from(b); return { error: null }; }, download: async (p) => (files[p] ? { data: { arrayBuffer: async () => files[p].buffer.slice(files[p].byteOffset, files[p].byteOffset + files[p].length) }, error: null } : { data: null, error: { m: 'none' } }), remove: async (ps) => { ps.forEach((p) => delete files[p]); return { error: null }; } }) };
  return { t, files, from, storage };
}
(async () => {
  console.log('\n[document wallet]');
  const w = load('src/Lib/server/wallet.ts');
  await test('Without WALLET_KEY the wallet is off and refuses everything; a bad key is treated as missing', async () => {
    delete process.env.WALLET_KEY; const db = mem();
    assert(w.walletEnabled() === false && (await w.walletStatus(db, A)).enabled === false && (await w.walletUpload(db, A, { kind: 'permit_card', dataBase64: PDF.toString('base64') })).status === 503);
    process.env.WALLET_KEY = 'short'; assert(w.walletEnabled() === false);
  });
  process.env.WALLET_KEY = crypto.randomBytes(32).toString('hex');
  await test('Encryption: round trip works; the stored bytes hold no plaintext; another owner or document id cannot decrypt; tampering is detected', () => {
    const blob = w.encryptBytes(PDF, A, 'doc1');
    assert(w.decryptBytes(blob, A, 'doc1').equals(PDF) && !blob.includes(Buffer.from('hello wallet')) && !blob.includes(Buffer.from('%PDF')));
    assert.throws(() => w.decryptBytes(blob, B, 'doc1')); assert.throws(() => w.decryptBytes(blob, A, 'doc2'));
    const bad = Buffer.from(blob); bad[bad.length - 1] ^= 1; assert.throws(() => w.decryptBytes(bad, A, 'doc1'));
    assert(!w.encryptBytes(PDF, A, 'doc1').equals(blob), 'fresh nonce every time');
  });
  await test('Opt-in: uploads are refused until the notice is accepted', async () => {
    const db = mem(); const r = await w.walletUpload(db, A, { kind: 'permit_card', dataBase64: PDF.toString('base64') });
    assert(!r.ok && r.status === 403 && Object.keys(db.files).length === 0);
    assert((await w.walletConsent(db, A)).ok && (await w.walletStatus(db, A)).consented === true);
  });
  await test('Upload: the file type comes from its own bytes, size and kinds are limited, no free-text labels, bad dates refused', async () => {
    const db = mem(); await w.walletConsent(db, A);
    const up = (o) => w.walletUpload(db, A, { kind: 'permit_card', ...o });
    assert((await up({ dataBase64: PDF.toString('base64'), expiresOn: '2027-05-01' })).ok && (await up({ dataBase64: PNG.toString('base64') })).ok);
    assert((await up({ dataBase64: Buffer.from('MZ not an allowed file type....').toString('base64') })).status === 415, 'executables refused');
    assert((await up({ dataBase64: Buffer.from('<script>alert(1)</script>.....').toString('base64') })).status === 415);
    assert((await up({ dataBase64: Buffer.alloc(w.MAX_BYTES + 10, 1).toString('base64') })).status === 413 && (await up({ dataBase64: '' })).status === 413 && (await up({ dataBase64: '!!!' })).status === 413);
    assert((await up({ kind: 'gun_registration', dataBase64: PDF.toString('base64') })).status === 400 && (await up({ kind: 'serial_numbers', dataBase64: PDF.toString('base64') })).status === 400, 'only the four kinds');
    assert((await up({ dataBase64: PDF.toString('base64'), expiresOn: 'tomorrow' })).status === 400);
    assert(JSON.stringify(Object.keys(w.WALLET_KINDS)) === JSON.stringify(['permit_card', 'class_certificate', 'hql_approval', 'other_id']));
  });
  await test('What is stored is ciphertext in an opaque path under the owner id; the owner can open it and gets the original back', async () => {
    const db = mem(); await w.walletConsent(db, A); const r = await w.walletUpload(db, A, { kind: 'class_certificate', dataBase64: PDF.toString('base64') });
    const [p, blob] = Object.entries(db.files)[0]; assert(p.startsWith(A + '/') && p.endsWith('.bin') && !blob.includes(Buffer.from('hello wallet')));
    const o = await w.walletOpen(db, A, r.id); assert(o.ok && Buffer.from(o.dataBase64, 'base64').equals(PDF) && o.mime === 'application/pdf' && o.fileName === 'Class-certificate.pdf', JSON.stringify(o).slice(0, 120));
  });
  await test('Owner only: another person cannot open or delete a file, and the answer is the same as for a missing file', async () => {
    const db = mem(); await w.walletConsent(db, A); const r = await w.walletUpload(db, A, { kind: 'permit_card', dataBase64: PDF.toString('base64') });
    const open = await w.walletOpen(db, B, r.id), del = await w.walletDelete(db, B, r.id), missing = await w.walletOpen(db, B, '33333333-3333-4333-8333-333333333333');
    assert(open.status === 404 && del.status === 404 && missing.status === 404 && open.message === missing.message && Object.keys(db.files).length === 1 && db.t.wallet_documents.length === 1, 'untouched');
    assert((await w.walletStatus(db, B)).docs.length === 0, 'B sees nothing of A');
    assert((await w.walletOpen(db, A, 'not-a-uuid')).status === 400);
  });
  await test('Delete removes the file and the record; the 20-document limit holds; purge removes everything for a person', async () => {
    const db = mem(); await w.walletConsent(db, A); const ids = [];
    for (let i = 0; i < w.MAX_DOCS; i += 1) ids.push((await w.walletUpload(db, A, { kind: 'other_id', dataBase64: PNG.toString('base64') })).id);
    assert((await w.walletUpload(db, A, { kind: 'other_id', dataBase64: PNG.toString('base64') })).status === 409, 'limit');
    assert((await w.walletDelete(db, A, ids[0])).ok && Object.keys(db.files).length === 19 && db.t.wallet_documents.length === 19);
    await w.purgeWallet(db, A); assert(Object.keys(db.files).length === 0 && db.t.wallet_documents.length === 0 && db.t.wallet_consent.length === 0);
    await w.purgeWallet(db, 'not-a-uuid'); await w.purgeWallet({ from() { throw new Error('down'); } }, A);
  });
  await test('Wiring: signed-in only, owner id from the verified token, staff delete purges the wallet, no free text, no logging of file contents', () => {
    const ROUTE = fs.readFileSync(path.join(ROOT, 'src/app/api/fifs/route.ts'), 'utf8'), SRV = fs.readFileSync(path.join(ROOT, 'src/Lib/server/wallet.ts'), 'utf8');
    const at = ROUTE.indexOf("case 'walletStatus':"), body = ROUTE.slice(at, ROUTE.indexOf("case 'adminTrashList':", at));
    assert(/const uid = String\(user\.id\)/.test(body) && !/payload\.(userId|user_id|ownerId|email)/.test(body) && /status: 401/.test(body) && body.indexOf('getAuthenticatedUser') < body.indexOf('getPrivilegedClient()'));
    assert((ROUTE.match(/purgeWallet\(supabase,/g) || []).length === 2, 'both delete paths purge');
    assert(!/console\.(log|warn|error)\([^)]*(base64|bytes|dataBase64)/i.test(SRV), 'file contents never logged');
    const UI = fs.readFileSync(path.join(ROOT, 'src/portal/WalletPanel.tsx'), 'utf8'); assert(/Do not upload/.test(UI) && /serial numbers/.test(UI) && /type="checkbox"/.test(UI) && !/placeholder=/.test(UI), 'notice shown, no free-text field');
    assert(/walletCard\(\)/.test(fs.readFileSync(path.join(ROOT, 'src/portal/clientExtras.ts'), 'utf8')) && /walletCard\(\)/.test(fs.readFileSync(path.join(ROOT, 'src/portal/studentExtras.ts'), 'utf8')) && /WalletPanel/.test(fs.readFileSync(path.join(ROOT, 'src/app/layout.tsx'), 'utf8')));
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
