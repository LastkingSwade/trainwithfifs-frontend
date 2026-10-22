/**
 * TrainWithFIFS - when staff permanently delete a student or client, their stored files and records go too (offline; database and storage are fakes)
 * The Document Vault already did this. The Armory (items and encrypted photos) now does as well: the stored photo files are removed first (their names are read before the rows disappear), then the rows,
 * only that person's data is touched, it never throws, and it runs before the person's sign-in is removed (removing the sign-in deletes the rows that name the files).
 */
const fs = require('fs'); const path = require('path');
process.env.ARMORY_KEY = '2e'.repeat(32);
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const P = require(path.join(ROOT, 'src/Lib/server/armory-photos.ts')); const AR = require(path.join(ROOT, 'src/Lib/server/armory.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222';
const IA1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', IA2 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', IB1 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';

function fakeDb(rows, o = {}) {
  const t = rows; const db = { t, removed: [], files: new Set(), log: [] };
  db.storage = { from: () => ({ remove: async (ps) => { if (o.storageDown) throw new Error('storage down'); for (const p of ps) { db.files.delete(p); db.removed.push(p); } return { error: null }; } }) };
  db.from = (table) => { const f = []; let op = 'select', lim = null; const eqs = [];
    const q = { select: () => q, eq: (c, v) => { eqs.push([c, String(v)]); f.push((r) => String(r[c]) === String(v)); return q; }, limit: (n) => { lim = n; return q; }, delete: () => { op = 'delete'; return q; } };
    const run = async () => { db.log.push({ table, op, eqs }); if (o.down) throw new Error('db down'); if (o.missing && o.missing.includes(table)) return { data: null, error: { code: '42P01', message: 'missing' } };
      const r = t[table] || (t[table] = []); if (op === 'delete') { t[table] = r.filter((x) => !f.every((g) => g(x))); return { data: null, error: null }; } let hit = r.filter((x) => f.every((g) => g(x))).map((x) => ({ ...x })); if (lim !== null) hit = hit.slice(0, lim); return { data: hit, error: null }; };
    q.then = (res, rej) => run().then(res, rej); return q; };
  return db;
}
const data = () => ({ armory_items: [{ id: IA1, user_id: A }, { id: IA2, user_id: A }, { id: IB1, user_id: B }],
  armory_photos: [{ id: 'p1', user_id: A, item_id: IA1, storage_path: `${A}/${IA1}/p1.bin` }, { id: 'p2', user_id: A, item_id: IA2, storage_path: `${A}/${IA2}/p2.bin` }, { id: 'p3', user_id: B, item_id: IB1, storage_path: `${B}/${IB1}/p3.bin` }] });

(async () => {
  await test('purging a person removes every one of their stored photo files, their photo rows and their item rows, and nothing belonging to anyone else', async () => {
    const db = fakeDb(data()); await P.purgeArmory(db, A);
    eq(db.removed.sort(), [`${A}/${IA1}/p1.bin`, `${A}/${IA2}/p2.bin`].sort(), 'both of A\'s files removed'); eq(db.t.armory_photos.map((r) => r.id), ['p3'], 'only B\'s photo row remains'); eq(db.t.armory_items.map((r) => r.id), [IB1], 'only B\'s item remains');
    assert(!db.removed.some((p) => p.startsWith(B)), 'none of B\'s files were touched');
  });
  await test('the file names are read BEFORE any row is deleted (the rows are what name the files), and every query is limited to that one person', async () => {
    const db = fakeDb(data()); await P.purgeArmory(db, A); const firstDelete = db.log.findIndex((l) => l.op === 'delete'); const firstRead = db.log.findIndex((l) => l.table === 'armory_photos' && l.op === 'select'); assert(firstRead >= 0 && firstRead < firstDelete, 'names read first');
    for (const l of db.log) assert(l.eqs.some(([c, v]) => c === 'user_id' && v === A), `${l.op} on ${l.table} is not limited to the person: ${JSON.stringify(l.eqs)}`); assert(db.log.some((l) => l.table === 'armory_items' && l.op === 'delete'), 'item rows removed too');
  });
  await test('it never throws and never blocks a deletion: a down database, down storage, missing tables, a bad id and nonsense all just return', async () => {
    for (const o of [{ down: true }, { storageDown: true }, { missing: ['armory_photos'] }, { missing: ['armory_items', 'armory_photos'] }]) { const db = fakeDb(data(), o); await P.purgeArmory(db, A); } for (const bad of [undefined, null, '', 'not-a-uuid', 12345, {}]) { const db = fakeDb(data()); await P.purgeArmory(db, bad); eq([db.removed.length, db.t.armory_items.length, db.t.armory_photos.length], [0, 3, 3], 'a bad id removes nothing'); }
    await P.purgeArmory({ from() { throw new Error('boom'); }, storage: { from() { throw new Error('boom'); } } }, A);
  });
  await test('purging a person with no Armory at all is a quiet no-op, and purging twice is harmless', async () => {
    const db = fakeDb({ armory_items: [], armory_photos: [] }); await P.purgeArmory(db, A); await P.purgeArmory(db, A); const d2 = fakeDb(data()); await P.purgeArmory(d2, A); await P.purgeArmory(d2, A); eq(d2.t.armory_items.map((r) => r.id), [IB1]);
  });
  await test('the row purge in the Armory file removes only that person\'s items, needs no membership (their record is already gone), and ignores a bad id', async () => {
    const db = fakeDb(data()); await AR.armoryPurgeRows(db, A); eq(db.t.armory_items.map((r) => r.id), [IB1]); await AR.armoryPurgeRows(db, 'nope'); eq(db.t.armory_items.length, 1); assert(!/memberRole|guard\(/.test(read('src/Lib/server/armory.ts').slice(read('src/Lib/server/armory.ts').indexOf('export async function armoryPurgeRows'), read('src/Lib/server/armory.ts').indexOf('export async function armoryDeleteAll'))), 'no membership check');
  });
  await test('both permanent-delete paths (student and client) purge the Armory right after the Vault and before the sign-in is removed, and only when a record was really removed', () => {
    const api = read('src/app/api/fifs/route.ts');
    for (const who of ['Student', 'Client']) { const w = `if (found${who}?.user_id && Array.isArray(removedRows) && removedRows.length > 0) await purgeWallet(supabase, found${who}.user_id);`; const a = `if (found${who}?.user_id && Array.isArray(removedRows) && removedRows.length > 0) await purgeArmory(supabase, found${who}.user_id);`;
      assert(api.includes(w) && api.includes(a), who + ' purge lines present'); const iw = api.indexOf(w), ia = api.indexOf(a), ir = api.indexOf('removeLinkedAuthUser(supabase, found' + who, iw); assert(iw < ia && ia < ir, who + ': Vault, then Armory, then the sign-in is removed'); }
    assert((api.match(/await purgeArmory\(supabase,/g) || []).length === 2, 'exactly the two delete paths');
  });
  await test('only the Armory file touches the armory table: the photo file purges through it, and no other file names the table', () => {
    const m = read('src/Lib/server/armory-photos.ts'); assert(!/armory_items/.test(m), 'the photo file does not name the armory table'); assert(/armoryPurgeRows\(sb, uid\)/.test(m), 'it uses the Armory file\'s function');
  });
  await test('the keys-and-backups guide names the two irreplaceable keys, states the backup finding, explains deletion, and contains no secret values (no 64-character keys, no provider tokens)', () => {
    const d = read('docs/KEYS-AND-BACKUPS.md'); for (const k of ['WALLET_KEY', 'ARMORY_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_SECRET_KEY', 'VAPID_PRIVATE_KEY', 'INVOICE_LINK_SECRET', 'CRON_SECRET']) assert(d.includes(k), k + ' is covered');
    assert(/\| `WALLET_KEY` \|/.test(d) && /\| `ARMORY_KEY` \|/.test(d), 'both irreplaceable keys have their own row in the table');
    assert(/Free\*\* plan/.test(d) && /do \*\*not\*\* get automatic daily backups/.test(d) && /Pro plan/.test(d) && /restore drill/i.test(d), 'the backup finding and the drill are there'); assert(/permanently delete/.test(d) && /Armory/.test(d) && /Document Vault/.test(d), 'deletion is explained');
    assert(!/\b[0-9a-fA-F]{64}\b/.test(d) && !/\b(sk_live|sk_test|whsec_|re_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}|eyJ[A-Za-z0-9_-]{20,})/.test(d), 'no secret values in the document');
  });
  console.log(`\nMember file purge: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
