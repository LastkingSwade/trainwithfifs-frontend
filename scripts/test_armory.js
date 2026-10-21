/**
 * TrainWithFIFS - the Armory: each member's private, encrypted equipment records (offline; the database is a fake)
 * One encrypted blob per item, a different key per member, bound to owner and item, tamper-evident; nothing readable in the database; each person reaches only their own items; no staff route.
 */
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const Module = require('module');
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const origLoad = Module._load;
Module._load = function (request, parent, ...rest) { if (request === './push' && parent && /portal-chat\.ts$/.test(parent.filename || '')) return { sendToUsers: async () => ({ sent: 0, failed: 0, removed: 0 }), notifyStaff: async () => ({ sent: 0, failed: 0, removed: 0 }) }; return origLoad.call(this, request, parent, ...rest); };
const KEY = crypto.randomBytes(32).toString('hex'); process.env.ARMORY_KEY = KEY;
const AR = require(path.join(ROOT, 'src/Lib/server/armory.ts')); const L = require(path.join(ROOT, 'src/portal/armoryLogic.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const NOW = new Date('2026-10-22T16:00:00Z');
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222', S = '33333333-3333-4333-8333-333333333333';
const ITEM = { nickname: 'Range pistol', type: 'handgun', make: 'Glock', model: '19 Gen5', caliber: '9mm', serial: 'ABCD123456', purchasedOn: '2024-03-01', price: 549.99, notes: 'Bought at the local shop', maintenance: [{ on: '2026-09-01', kind: 'cleaning', note: 'Full strip and clean' }] };

function fakeDb(t, o = {}) {
  const db = { t }; db.from = (table) => {
    const f = []; let op = 'select', vals = null, ord = null, lim = null;
    const q = { select: () => q, eq: (c, v) => { f.push((r) => String(r[c]) === String(v)); return q; }, order: (c, d) => { ord = [c, d && d.ascending === false ? -1 : 1]; return q; }, limit: (n) => { lim = n; return q; }, insert: (v) => { op = 'insert'; vals = v; return q; }, update: (v) => { op = 'update'; vals = v; return q; }, delete: () => { op = 'delete'; return q; } };
    const run = async () => {
      if (o.missing === table) return { data: null, error: { code: '42P01', message: `relation "${table}" does not exist` } };
      const rows = db.t[table] || (db.t[table] = []);
      if (op === 'insert') { rows.push({ ...vals }); return { data: null, error: null }; }
      if (op === 'update') { const hit = rows.filter((r) => f.every((g) => g(r))); hit.forEach((r) => Object.assign(r, vals)); return { data: hit.map((r) => ({ ...r })), error: null }; }
      if (op === 'delete') { db.t[table] = rows.filter((r) => !f.every((g) => g(r))); return { data: null, error: null }; }
      let hit = rows.filter((r) => f.every((g) => g(r))).map((r) => ({ ...r })); if (ord) hit.sort((a, b) => (a[ord[0]] < b[ord[0]] ? -1 : 1) * ord[1]); if (lim !== null) hit = hit.slice(0, lim); return { data: hit, error: null };
    };
    q.maybeSingle = async () => { const r = await run(); if (r.error) return r; const d = Array.isArray(r.data) ? (r.data[0] || null) : (r.data || null); return { data: d, error: null }; };
    q.then = (res, rej) => run().then(res, rej); return q;
  }; return db;
};
const base = (extra = {}) => ({ students: [{ user_id: A }], clients: [{ user_id: B }], armory_items: [], ...extra });
const walk = (d) => fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : /\.(ts|tsx|js)$/.test(e.name) ? [path.join(d, e.name)] : []);

(async () => {
  console.log('\n[Encryption]');
  await test('an item survives encrypt then decrypt for its owner, and the stored text contains nothing readable (not the make, model, caliber, serial, notes or nickname)', () => {
    const id = crypto.randomUUID(); const enc = AR.encryptItem(A, id, { ...ITEM, price: 549.99, maintenance: ITEM.maintenance }); eq(AR.decryptItem(A, id, enc).serial, 'ABCD123456');
    const raw = Buffer.from(enc, 'base64').toString('latin1') + enc; for (const word of ['Glock', '19 Gen5', '9mm', 'ABCD123456', 'local shop', 'Range pistol', 'cleaning']) assert(!raw.includes(word), 'readable: ' + word);
  });
  await test('the same item encrypts differently every time, and two members never share a key: B cannot read A\'s blob even with the right item id', () => {
    const id = crypto.randomUUID(); const a1 = AR.encryptItem(A, id, ITEM), a2 = AR.encryptItem(A, id, ITEM); assert(a1 !== a2, 'fresh nonce'); let threw = false; try { AR.decryptItem(B, id, a1); } catch { threw = true; } assert(threw, 'another member cannot decrypt');
  });
  await test('every member has their own key: derived keys are 256-bit, repeatable for one member, different for every member and every key version\'s label, and never the server secret itself', () => {
    const ka = AR.memberKey(A, 1), kb = AR.memberKey(B, 1); eq([ka.length, kb.length], [32, 32]); assert(ka.equals(AR.memberKey(A, 1)), 'repeatable'); assert(!ka.equals(kb), 'members differ'); assert(!ka.equals(Buffer.from(KEY, 'hex')) && !kb.equals(Buffer.from(KEY, 'hex')), 'never the secret itself');
    const id = crypto.randomUUID(); const enc = AR.encryptItem(A, id, ITEM); const raw = Buffer.from(enc, 'base64'); const aad = Buffer.from(`armory|v1|${A}|${id}`);
    const open = (key) => { const d = crypto.createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12)); d.setAAD(aad); d.setAuthTag(raw.subarray(12, 28)); return Buffer.concat([d.update(raw.subarray(28)), d.final()]); };
    assert(JSON.parse(open(ka).toString()).serial === 'ABCD123456', 'A\'s own key opens it'); let threw = false; try { open(kb); } catch { threw = true; } assert(threw, 'B\'s key cannot open it even with the correct binding');
  });
  await test('a blob cannot be moved to another item, another owner or another key version, and any change to it is detected', () => {
    const id = crypto.randomUUID(), other = crypto.randomUUID(); const enc = AR.encryptItem(A, id, ITEM); const bad = (f) => { let t = false; try { f(); } catch { t = true; } return t; };
    assert(bad(() => AR.decryptItem(A, other, enc)), 'other item id'); assert(bad(() => AR.decryptItem(A, id, enc, 2)), 'other key version'); const raw = Buffer.from(enc, 'base64');
    for (const pos of [0, 5, 12, 20, 28, raw.length - 1]) { const c = Buffer.from(raw); c[pos] ^= 1; assert(bad(() => AR.decryptItem(A, id, c.toString('base64'))), 'tampered byte ' + pos); } assert(bad(() => AR.decryptItem(A, id, 'AAAA')), 'too short');
  });
  await test('without a valid ARMORY_KEY the armory is off and refuses everything; a short or non-hex key counts as missing', async () => {
    const saved = process.env.ARMORY_KEY; for (const bad of ['', 'short', 'z'.repeat(64), KEY.slice(0, 62)]) { process.env.ARMORY_KEY = bad; assert(AR.armoryEnabled() === false, 'disabled for ' + bad.slice(0, 6)); }
    process.env.ARMORY_KEY = ''; const db = fakeDb(base()); const l = await AR.armoryList(db, A); eq([l.ok, l.enabled, l.items.length], [true, false, 0]); const s = await AR.armorySave(db, A, ITEM, NOW); eq([s.ok, s.status], [false, 503]); assert(db.t.armory_items.length === 0, 'nothing stored'); process.env.ARMORY_KEY = saved; assert(AR.armoryEnabled(), 'back on');
  });

  console.log('\n[Saving and listing]');
  await test('the database holds only the id, owner, key version, encrypted blob and timestamps; the owner gets the item back exactly', async () => {
    const db = fakeDb(base()); const r = await AR.armorySave(db, A, ITEM, NOW); assert(r.ok, JSON.stringify(r)); const row = db.t.armory_items[0];
    eq(Object.keys(row).sort(), ['created_at', 'id', 'key_version', 'payload', 'updated_at', 'user_id']); assert(!JSON.stringify(row).match(/Glock|ABCD|9mm|pistol|cleaning/), 'nothing readable in the row');
    const l = await AR.armoryList(db, A); eq(l.items.length, 1); const it = l.items[0]; eq([it.nickname, it.make, it.model, it.caliber, it.serial, it.purchasedOn, it.price, it.type], ['Range pistol', 'Glock', '19 Gen5', '9mm', 'ABCD123456', '2024-03-01', 549.99, 'handgun']); eq(it.maintenance[0].note, 'Full strip and clean'); assert(/^[0-9a-f-]{36}$/.test(it.maintenance[0].id), 'maintenance id');
  });
  await test('editing keeps the same id and created time, re-encrypts with a new nonce, and moves the updated time', async () => {
    const db = fakeDb(base()); const r = await AR.armorySave(db, A, ITEM, NOW); const before = { ...db.t.armory_items[0] }; const later = new Date('2026-10-23T10:00:00Z');
    const u = await AR.armorySave(db, A, { ...ITEM, id: r.id, notes: 'Updated notes' }, later); assert(u.ok && u.id === r.id, JSON.stringify(u)); const row = db.t.armory_items[0]; eq([db.t.armory_items.length, row.created_at, row.updated_at], [1, before.created_at, later.toISOString()]); assert(row.payload !== before.payload, 're-encrypted'); eq((await AR.armoryList(db, A)).items[0].notes, 'Updated notes');
  });
  await test('each person sees only their own items, a login that is not a student or client gets nothing, and the answer to a stranger is the same as for a missing item', async () => {
    const db = fakeDb(base()); const a = await AR.armorySave(db, A, ITEM, NOW); await AR.armorySave(db, B, { ...ITEM, nickname: 'B private' }, NOW);
    const la = await AR.armoryList(db, A), lb = await AR.armoryList(db, B); eq([la.items.length, lb.items.length], [1, 1]); assert(!JSON.stringify(la).includes('B private') && !JSON.stringify(lb).includes('Range pistol'), 'no cross reading');
    for (const r of [await AR.armoryList(db, S), await AR.armorySave(db, S, ITEM, NOW), await AR.armoryDeleteAll(db, S)]) eq([r.ok, r.status], [false, 403]);
    const ghost = '99999999-9999-4999-8999-999999999999'; const edit = await AR.armorySave(db, B, { ...ITEM, id: a.id, nickname: 'hijack' }, NOW), del = await AR.armoryDelete(db, B, a.id), miss = await AR.armoryDelete(db, B, ghost);
    eq([edit.status, del.status, miss.status], [404, 404, 404]); eq(del.message, miss.message); eq((await AR.armoryList(db, A)).items[0].nickname, 'Range pistol', 'A\'s item untouched'); eq(db.t.armory_items.filter((r) => r.user_id === A).length, 1);
  });
  await test('delete removes one item; delete-all removes only the caller\'s items', async () => {
    const db = fakeDb(base()); const a1 = await AR.armorySave(db, A, ITEM, NOW); await AR.armorySave(db, A, { ...ITEM, nickname: 'Second' }, NOW); await AR.armorySave(db, B, ITEM, NOW);
    assert((await AR.armoryDelete(db, A, a1.id)).ok && db.t.armory_items.length === 2, 'one deleted'); assert((await AR.armoryDeleteAll(db, A)).ok && db.t.armory_items.length === 1 && db.t.armory_items[0].user_id === B, 'only A\'s'); eq((await AR.armoryDelete(db, A, 'not-a-uuid')).status, 400);
  });
  await test('a damaged or foreign record shows as "Unreadable record" without hiding the person\'s other items or crashing', async () => {
    const db = fakeDb(base()); await AR.armorySave(db, A, ITEM, NOW); const r2 = await AR.armorySave(db, A, { ...ITEM, nickname: 'Good two' }, NOW);
    const c = Buffer.from(db.t.armory_items[0].payload, 'base64'); c[30] ^= 1; db.t.armory_items[0].payload = c.toString('base64'); const l = await AR.armoryList(db, A);
    eq(l.items.length, 2); assert(l.items[0].unreadable === true && l.items[0].nickname === 'Unreadable record' && l.items[0].serial === '', 'flagged'); eq(l.items[1].nickname, 'Good two'); void r2;
  });
  await test('a member can keep up to 50 items, then is asked to delete or export', async () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({ id: crypto.randomUUID(), user_id: A, key_version: 1, payload: 'x'.repeat(60), created_at: 't' + i, updated_at: 't' + i })); const db = fakeDb(base({ armory_items: rows }));
    const r = await AR.armorySave(db, A, ITEM, NOW); eq([r.ok, r.status], [false, 409]); assert(/Delete one or export/.test(r.message));
  });
  await test('before the SQL is run the armory says it is not set up and claims nothing is saved', async () => {
    const db = fakeDb(base(), { missing: 'armory_items' }); const l = await AR.armoryList(db, A); assert(l.ok && l.enabled && l.available === false && l.items.length === 0, JSON.stringify(l));
    for (const r of [await AR.armorySave(db, A, ITEM, NOW), await AR.armoryDeleteAll(db, A)]) assert(!r.ok && r.status === 503 && /not set up/.test(r.message), JSON.stringify(r));
  });

  console.log('\n[What a member may type]');
  await test('valid items are accepted as typed (control characters removed), and each bad field is refused with a clear message', () => {
    const v = AR.cleanItem({ ...ITEM, notes: 'a\u0000b\r\nc' }, NOW); assert(v.ok && v.data.notes === 'a b\nc', JSON.stringify(v)); const min = AR.cleanItem({ nickname: 'x' }, NOW); assert(min.ok && min.data.type === 'handgun' && min.data.price === null && min.data.maintenance.length === 0, 'minimal');
    for (const bad of [{ ...ITEM, nickname: '' }, { ...ITEM, nickname: '  ' }, { ...ITEM, nickname: 'x'.repeat(41) }, { ...ITEM, type: 'cannon' }, { ...ITEM, make: 'x'.repeat(61) }, { ...ITEM, model: 'x'.repeat(61) }, { ...ITEM, caliber: 'x'.repeat(31) }, { ...ITEM, serial: 'x'.repeat(41) }, { ...ITEM, notes: 'x'.repeat(1001) }, { ...ITEM, purchasedOn: 'last year' }, { ...ITEM, purchasedOn: '2026-02-30' }, { ...ITEM, purchasedOn: '2030-01-01' }, { ...ITEM, price: -5 }, { ...ITEM, price: 'cheap' }, { ...ITEM, price: 1000001 }]) { const r = AR.cleanItem(bad, NOW); assert(!r.ok && r.message.length > 10, JSON.stringify(bad).slice(0, 60)); }
    eq(AR.cleanItem({ ...ITEM, price: '$1,299.50' }, NOW).data.price, 1299.5);
  });
  await test('maintenance entries need a real date and a known type, notes are capped at 200, the log holds up to 100, and an item cannot grow past the storage limit', () => {
    const m = (o) => ({ ...ITEM, maintenance: [{ on: '2026-09-01', kind: 'repair', note: 'ok', ...o }] });
    for (const bad of [m({ on: 'x' }), m({ on: '2026-13-01' }), m({ on: '2030-01-01' }), m({ kind: 'magic' }), m({ note: 'x'.repeat(201) })]) assert(!AR.cleanItem(bad, NOW).ok, JSON.stringify(bad.maintenance)); assert(AR.cleanItem(m({ note: 'x'.repeat(200) }), NOW).ok, '200 is fine');
    assert(AR.cleanItem({ ...ITEM, maintenance: Array.from({ length: 100 }, () => ({ on: '2026-09-01', kind: 'cleaning', note: 'x' })) }, NOW).ok, '100 fine'); assert(!AR.cleanItem({ ...ITEM, maintenance: Array.from({ length: 101 }, () => ({ on: '2026-09-01', kind: 'cleaning', note: 'x' })) }, NOW).ok, '101 refused');
    assert(!AR.cleanItem({ ...ITEM, notes: 'n'.repeat(1000), maintenance: Array.from({ length: 100 }, () => ({ on: '2026-09-01', kind: 'cleaning', note: 'y'.repeat(200) })) }, NOW).ok, 'too long overall');
  });

  console.log('\n[Where the data can and cannot go]');
  await test('only one file touches the armory table, the key is never in browser code, nothing is logged, and no alert, push, analytics or chat file mentions the armory', () => {
    for (const f of walk('src')) { const s = read(f); if (/armory_items/.test(s)) assert(/Lib\/server\/armory\.ts$/.test(f), f + ' must not touch the armory table directly'); if (/ARMORY_KEY/.test(s)) assert(/Lib\/server\/armory\.ts$/.test(f), f + ' must not read the key'); assert(!/NEXT_PUBLIC_ARMORY/.test(s), 'key must never be public'); }
    const m = read('src/Lib/server/armory.ts').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''); assert(!/console\./.test(m), 'nothing logged');
    for (const f of ['src/Lib/server/push.ts', 'src/Lib/server/push-logic.ts', 'src/Lib/server/discord.ts', 'src/Lib/server/portal-chat.ts', 'src/Lib/server/site-visits.ts', 'src/analytics/VisitBeacon.tsx']) assert(!/armory/i.test(read(f)), f + ' must not mention the armory');
  });
  await test('the route: the owner is always the verified login, there is no staff path, saves are rate limited, and no request field names an owner', () => {
    const r = read('src/app/api/fifs/route.ts'); const i = r.indexOf("case 'armoryList':"); assert(i > 0, 'actions exist'); const seg = r.slice(i, r.indexOf("case 'aiGuideStatus':", i));
    assert(/getAuthenticatedUser\(req\)/.test(seg) && /const uid = String\(user\.id\)/.test(seg) && /allowPublicSubmit\(req, 'armory', 40\)/.test(seg), 'login, owner, limit'); assert(!/payload\??\.(userId|user_id|ownerId|memberId)/.test(seg) && !/isStaffOrAdmin/.test(seg), 'no owner from the request, no staff route');
    for (const a of ['armoryList', 'armorySave', 'armoryDelete', 'armoryDeleteAll']) assert(new RegExp(`case '${a}':`).test(seg), a); assert((seg.match(/'Cache-Control': 'no-store'/g) || []).length === 1 && /headers: noStore/.test(seg), 'answers carrying records are never cached');
  });
  await test('the table: server only, one encrypted blob per row, owned by a login and removed with it, and no readable columns', () => {
    const q = read('scripts/sql/20261028_armory_items.sql').replace(/--.*$/gm, '');
    assert(/enable row level security/.test(q) && /revoke all on public\.armory_items from anon, authenticated/.test(q) && /to service_role/.test(q) && /references auth\.users\(id\) on delete cascade/.test(q), 'locked, owned, cascading');
    assert(/payload text not null/.test(q) && /key_version smallint/.test(q), 'blob and version'); assert(!/\b(make|model|caliber|serial|nickname|notes)\b/i.test(q.replace(/char_length\(payload\)/g, '')), 'no readable columns');
  });
  await test('the key script prints a 256-bit key and the setup guide says the key must be backed up and never shared', () => {
    const out = require('child_process').execFileSync('node', [path.join(ROOT, 'scripts/make_armory_key.js')]).toString().trim(); assert(/^ARMORY_KEY=[0-9a-f]{64}$/.test(out), 'format'); const again = require('child_process').execFileSync('node', [path.join(ROOT, 'scripts/make_armory_key.js')]).toString().trim(); assert(out !== again, 'random');
    const d = read('docs/ARMORY-SETUP.md'); assert(/password manager/i.test(d) && /cannot be (read|recovered)/i.test(d) && /not end-to-end/i.test(d), 'honest setup guide');
  });

  console.log('\n[The screen]');
  await test('the serial number stays hidden (dots only, never a partial reveal), prices and last service read correctly, and search can never reveal a serial number', () => {
    eq(L.maskSerial('ABCD123456'), '••••••••••'); eq(L.maskSerial('AB'), '••••••'); eq(L.maskSerial('x'.repeat(40)).length, 12); eq(L.maskSerial(''), ''); assert(!/[A-Za-z0-9]/.test(L.maskSerial('ABCD123456')), 'no characters leak');
    eq(L.money(549.99), '$549.99'); eq(L.money(1299.5), '$1,299.50'); eq(L.money(1234567), '$1,234,567.00'); eq(L.money(null), ''); eq(L.lastService({ maintenance: [{ on: '2026-01-02' }, { on: '2026-09-01' }, { on: '2025-12-31' }] }), '2026-09-01'); eq(L.lastService({ maintenance: [] }), null);
    const items = [{ id: '1', nickname: 'Range pistol', type: 'handgun', make: 'Glock', model: '19', caliber: '9mm', serial: 'SECRET123', maintenance: [] }, { id: '2', nickname: 'Deer rifle', type: 'rifle', make: 'Ruger', model: 'American', caliber: '.308', serial: 'ZZZ999', maintenance: [] }];
    eq(L.filterItems(items, 'glock').map((i) => i.id), ['1']); eq(L.filterItems(items, '.308').map((i) => i.id), ['2']); eq(L.filterItems(items, 'rifle').map((i) => i.id), ['2']); eq(L.filterItems(items, '').length, 2); eq(L.filterItems(items, 'SECRET123').length, 0, 'a serial number is never searchable'); eq(L.filterItems(items, 'zzz').length, 0);
  });
  await test('the export includes every readable item and its maintenance, neutralises spreadsheet formulas, quotes commas, and leaves out records that could not be read', () => {
    const csv = L.toCsv([{ id: '1', nickname: 'Range, pistol', type: 'handgun', make: 'Glock', model: '19', caliber: '9mm', serial: '=1+1', purchasedOn: '2024-03-01', price: 549.99, notes: 'say "hi"', maintenance: [{ id: 'm', on: '2026-09-01', kind: 'cleaning', note: '+cmd' }] }, { id: '2', nickname: 'BAD', unreadable: true, type: 'other', maintenance: [] }]);
    assert(csv.startsWith('Nickname,Type,Make,Model,Caliber,Serial number,Purchased,Price,Notes\n"Range, pistol",Handgun,Glock,19,9mm,\'=1+1,2024-03-01,549.99,"say ""hi"""\n'), csv); assert(csv.includes('Maintenance\nItem,Date,Type,Note\n"Range, pistol",2026-09-01,Cleaning,\'+cmd'), 'maintenance'); assert(!csv.includes('BAD'), 'unreadable left out');
  });
  await test('the panel: text only, nothing stored in the browser, records dropped from memory on close, serial hidden until tapped, a privacy notice, delete with confirmation, export, and the key is never mentioned', () => {
    const p = read('src/portal/ArmoryPanel.tsx'); assert(!/innerHTML|dangerouslySetInnerHTML/.test(p), 'text only'); assert(!/localStorage|sessionStorage|indexedDB|document\.cookie/.test(p), 'nothing stored in the browser'); assert(!/console\./.test(p), 'nothing logged');
    assert(/const close = useCallback\(\(\) => \{ setOpen\(false\); setData\(null\); setForm\(null\); setRevealed\(\{\}\)/.test(p), 'dropped from memory on close'); assert(/maskSerial\(i\.serial\)/.test(p) && /aria-pressed=\{!!revealed\[i\.id\]\}/.test(p), 'serial hidden until tapped');
    assert(/Every record here is encrypted/.test(p) && /do not enter where you store firearms, safe combinations or home-security details/.test(p) && /Staff cannot see it/.test(p), 'privacy'); assert(/Yes, delete everything/.test(p) && /Delete your whole armory\? This cannot be undone\./.test(p) && /Export my records \(CSV\)/.test(p) && /role="dialog"/.test(p) && /aria-modal="true"/.test(p) && /data-organic="skip"/.test(p), 'controls');
    assert(/data\.enabled/.test(p) && /ARMORY_TEXT/.test(p), 'coming soon when the key is not set'); assert(!/ARMORY_KEY/.test(p), 'the key is never in browser code');
  });
  await test('the Armory tab opens the real panel (the "coming soon" sheet stays only as a fallback), and the panel is mounted for every page in the company colours with 44px controls and no animation', () => {
    const t = read('src/shell/tabShell.ts'); assert(/typeof w\.openArmory === 'function'/.test(t) && /w\.openArmory\(\)/.test(t) && /openSheet\('armory'\)/.test(t), 'tab opens the panel');
    assert(/<ArmoryPanel \/>/.test(read('src/app/layout.tsx')), 'mounted'); const c = read('src/portal/armory.css').replace(/\/\*[\s\S]*?\*\//g, ''); assert(/min-height: 44px/.test(c) && /font-size: 16px/.test(c) && /#ffb703/.test(c) && /#00e5ff/.test(c), 'sizes and colours'); assert(!/animation|transition|@keyframes/.test(c), 'no motion');
  });

  console.log(`\nArmory: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
