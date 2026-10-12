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
    const UI = fs.readFileSync(path.join(ROOT, 'src/portal/WalletPanel.tsx'), 'utf8'); assert(/Do not upload/.test(UI) && /serial numbers/.test(UI) && /type="checkbox"/.test(UI), 'notice shown');
    // No way to type a private title or note that gets stored: no text inputs or text areas. The only text box is the local search (type="search"); its words are never sent anywhere.
    assert(!/<textarea/.test(UI) && !/type="text"/.test(UI) && (UI.match(/type="search"/g) || []).length === 1, 'no free-text field (only the local search box)');
    assert(!/call\('[a-zA-Z]+',[^)]*query/.test(UI) && !/walletUpload[^;]*query/.test(UI), 'the search words are never sent to the server');
    assert(/id="fi-vault-launch"/.test(fs.readFileSync(path.join(ROOT, 'src/app/page.tsx'), 'utf8')) && /WalletPanel/.test(fs.readFileSync(path.join(ROOT, 'src/app/layout.tsx'), 'utf8')), 'the client portal keeps a Document Vault hub card next to the Reciprocity Hub');
    // Students have no documents yet (they come to the owner to get them), so the student portal no longer shows the wallet card.
    const STU = fs.readFileSync(path.join(ROOT, 'src/portal/studentExtras.ts'), 'utf8'); assert(!/walletCard/.test(STU) && !/document wallet/i.test(STU), 'the student portal must not show the wallet card');
  });
  // ---- Document Vault screen: logic and structure (offline) ----
  const VL = load('src/portal/vaultLogic.ts'); const VUI = fs.readFileSync(path.join(ROOT, 'src/portal/WalletPanel.tsx'), 'utf8'); const VCSS = fs.readFileSync(path.join(ROOT, 'src/portal/vault.css'), 'utf8');
  const doc = (id, kind, created, expires) => ({ id, kind, kindLabel: { permit_card: 'Permit card', class_certificate: 'Class certificate', hql_approval: 'HQL approval', other_id: 'Other ID' }[kind], mime: 'application/pdf', sizeBytes: 150000, expiresOn: expires || null, createdAt: created });
  const DOCS = [doc('1', 'class_certificate', '2026-05-12T10:00:00Z'), doc('2', 'permit_card', '2026-04-03T10:00:00Z', '2026-12-01'), doc('3', 'hql_approval', '2026-02-18T10:00:00Z'), doc('4', 'other_id', '2026-06-01T10:00:00Z', '2026-01-01')];
  await test('Vault: tabs sort every document type (certificates = class certificate + HQL approval, permits, other) and the chip counts add up', () => {
    assert(VL.tabOf('class_certificate') === 'certificates' && VL.tabOf('hql_approval') === 'certificates' && VL.tabOf('permit_card') === 'permits' && VL.tabOf('other_id') === 'other' && VL.tabOf('anything_new') === 'other', 'tab rules');
    const c = VL.counts(DOCS); assert(c.all === 4 && c.certificates === 2 && c.permits === 1 && c.other === 1, JSON.stringify(c));
    assert(VL.TABS.map((t) => t.label).join() === 'All documents,Certificates,Permits,Other records', 'tab names match the design');
  });
  await test('Vault: filtering by tab and by search words, case-insensitive, trimmed, capped; nothing matched gives an empty list, never an error', () => {
    assert(VL.filterDocs(DOCS, 'all', '').length === 4 && VL.filterDocs(DOCS, 'certificates', '').map((d) => d.id).join() === '1,3' && VL.filterDocs(DOCS, 'permits', '').length === 1, 'tabs');
    assert(VL.filterDocs(DOCS, 'all', '  PERMIT ').map((d) => d.id).join() === '2' && VL.filterDocs(DOCS, 'all', 'may 12').map((d) => d.id).join() === '1' && VL.filterDocs(DOCS, 'permits', 'certificate').length === 0, 'search by type and by date, within the tab');
    assert(VL.filterDocs(DOCS, 'all', 'x'.repeat(500)).length === 0 && VL.filterDocs([], 'all', '').length === 0 && VL.filterDocs(DOCS, 'all', null).length === 4, 'odd input is safe');
  });
  await test('Vault: expiry wording is plain and honest: expired, today, within 90 days (soon), later, or nothing when no date was given', () => {
    const now = new Date('2026-10-12T15:00:00Z');
    assert(VL.expiryState(null, now).state === 'none' && VL.expiryState('', now).state === 'none' && VL.expiryState('garbage', now).state === 'none', 'no date, no label');
    assert(VL.expiryState('2026-10-09', now).text === 'Expired 3 days ago' && VL.expiryState('2026-10-09', now).state === 'expired' && VL.expiryState('2026-10-11', now).text === 'Expired 1 day ago', 'expired');
    assert(VL.expiryState('2026-10-12', now).text === 'Expires today' && VL.expiryState('2026-10-13', now).text === 'Expires in 1 day' && VL.expiryState('2026-12-01', now).text === 'Expires in 50 days' && VL.expiryState('2026-12-01', now).state === 'soon', 'soon');
    assert(VL.expiryState('2027-02-10', now).state === 'ok' && VL.expiryState('2027-02-10', now).text === 'Expires Feb 10, 2027' && VL.expiryState('2027-01-10', now).state === 'soon', 'later, and exactly 90 days still counts as soon');
  });
  await test('Vault: recently added shows the newest three; the card picture depends only on the document type (never the file); titles are the type, so no private text can be typed into one', () => {
    assert(VL.recent(DOCS).map((d) => d.id).join() === '4,1,2' && VL.recent(DOCS, 1)[0].id === '4' && VL.recent([]).length === 0, 'newest first');
    assert(VL.artFor('class_certificate').seal === true && VL.artFor('permit_card').seal === false && VL.artFor('other_id').label === 'RECORD', 'art by type');
    assert(VL.docTitle({ kindLabel: 'Permit card' }) === 'Permit card', 'title = type');
  });
  await test('Vault screen: it follows the mockup (title, tagline, search, four chips with counts, Add document, cards with View document and a menu, Recently added, a Done toast) in the business colors', () => {
    assert(/Your Document Vault/.test(VUI) && /Your training\. Your records\. All together\./.test(VUI) && /Search your documents/.test(VUI) && /Add document/.test(VUI) && /View document/.test(VUI) && /Recently added/.test(VUI) && /Your document has been added to your vault\./.test(VUI), 'copy from the design');
    assert(/role="tablist"/.test(VUI) && /aria-selected/.test(VUI) && /\(\{c\[t\.key\]\}\)/.test(VUI), 'filter chips with counts');
    assert(/#ffd166/.test(VCSS) && /#ffb703/.test(VCSS) && /rgba\(0, 229, 255/.test(VCSS) && /#19e6ff/.test(VCSS), 'gold and cyan business colors');
    assert(/\.vault h2 \{[^}]*Georgia[^}]*color: #ffffff/.test(VCSS) && /\.vault-bar \{[^}]*background: #ffb703/.test(VCSS), 'the title is white serif over a short gold bar, as in the mockup');
  });
  await test('Vault screen keeps every safety rule: consent notice and checkbox first, "do not upload" gun records, owner-only calls, private open, delete needs a confirmation, and nothing is logged', () => {
    assert(/Do not upload/.test(VUI) && /serial numbers/.test(VUI) && /<input type="checkbox" checked=\{agree\}/.test(VUI) && /disabled=\{!agree\}/.test(VUI), 'consent first');
    for (const a of ['walletStatus', 'walletConsent', 'walletUpload', 'walletOpen', 'walletDelete']) assert(new RegExp("call\\('" + a + "'").test(VUI), a + ' still used');
    assert(/setConfirmId\(d\.id\)/.test(VUI) && /Delete this document\? This cannot be undone\./.test(VUI) && /role="alert"/.test(VUI) && /Yes, delete/.test(VUI), 'delete asks first');
    assert(!/console\./.test(VUI) && !/localStorage|sessionStorage/.test(VUI), 'nothing logged or stored in the browser');
    assert(/maxBytes/.test(VUI) && /accept="application\/pdf,image\/png,image\/jpeg,image\/webp"/.test(VUI), 'file type and size limits');
  });
  await test('Vault screen is accessible and phone-friendly: dialog semantics, Escape and focus trap, labelled buttons, 44px+ targets, a single-column layout on phones, reduced motion respected', () => {
    assert(/role="dialog" aria-modal="true" aria-labelledby="vault-title"/.test(VUI) && /e\.key === 'Escape'/.test(VUI) && /e\.key !== 'Tab'/.test(VUI) && /aria-label="Close your vault"/.test(VUI) && /aria-haspopup="menu"/.test(VUI) && /aria-expanded/.test(VUI), 'dialog, keyboard, labels');
    for (const sel of ['\\.vault-add', '\\.vault-close', '\\.vault-chip', '\\.vault-view', '\\.vault-dots']) assert(new RegExp(sel + ' \\{[^}]*min-(height|width): (4[4-9]|5\\d)px').test(VCSS), sel + ' is at least 44px');
    assert(/@media \(max-width: 640px\)[\s\S]*\.vault-grid \{ grid-template-columns: 1fr;/.test(VCSS) && /prefers-reduced-motion: reduce/.test(VCSS), 'phone layout and reduced motion');
  });
  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} total tests.`);
  process.exit(failed ? 1 : 0);
})();
