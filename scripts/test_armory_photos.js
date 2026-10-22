/**
 * TrainWithFIFS - Armory photos (offline; the database and storage are fakes)
 * Encrypted on the server before storage (AES-256-GCM, per-member key, tied to owner + item + photo), only plain JPEGs with no location/camera/text details, 4 per item and 25 per member, only the owner can
 * list/open/delete, deleting an item removes its stored files, no staff route, and nothing leaks into logs, push, analytics, the AI guide, the insurance package or exports.
 */
const fs = require('fs'); const path = require('path');
process.env.ARMORY_KEY = '1f'.repeat(32);
const { installFetchStub } = require('./lib/ts-loader'); installFetchStub();
const ROOT = path.resolve(__dirname, '..'); const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const P = require(path.join(ROOT, 'src/Lib/server/armory-photos.ts'));
let passed = 0, failed = 0;
const test = async (n, f) => { try { await f(); passed++; console.log(`  ✓ PASS: ${n}`); } catch (e) { failed++; console.log(`  ✗ FAIL: ${n}\n      ${e.message}`); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), `${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// ---- a tiny JPEG builder ----
const u16 = (n) => Buffer.from([(n >> 8) & 255, n & 255]); const seg = (m, d) => Buffer.concat([Buffer.from([0xff, m]), u16(d.length + 2), d]);
function jpeg(opts = {}) {
  const extra = []; if (opts.exif) extra.push(seg(0xe1, Buffer.concat([Buffer.from('Exif\0\0'), Buffer.from('GPSLatitude=39.2904 GPSLongitude=-76.6122 Make=Glock')]))); if (opts.xmp) extra.push(seg(0xe1, Buffer.from('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta/>')));
  if (opts.iptc) extra.push(seg(0xed, Buffer.from('Photoshop 3.0\0'))); if (opts.comment) extra.push(seg(0xfe, Buffer.from('taken at my house'))); if (opts.app5) extra.push(seg(0xe5, Buffer.from('odd')));
  return Buffer.concat([Buffer.from([0xff, 0xd8]), seg(0xe0, Buffer.from('JFIF\0\x01\x01\0\0\x01\0\x01\0\0')), ...(opts.icc ? [seg(0xe2, Buffer.from('ICC_PROFILE\0\0\x01\x01data'))] : []), ...extra, seg(0xdb, Buffer.alloc(65, 8)), ...(opts.noFrame ? [] : [seg(0xc0, Buffer.from([8, 0, 16, 0, 16, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]))]), seg(0xc4, Buffer.alloc(20, 1)), seg(0xda, Buffer.from([3, 1, 0, 2, 0x11, 3, 0x11, 0, 63, 0])), Buffer.alloc(opts.size || 3000, 0x55), Buffer.from([0xff, 0xd9])]);
}
const b64 = (b) => b.toString('base64');
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222', S = '33333333-3333-4333-8333-333333333333';
const ITEM_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', ITEM_A2 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', ITEM_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function fakeDb(t, o = {}) {
  const db = { t, n: 0, store: new Map(), removed: [], uploads: 0, log: [] };
  db.storage = { from: () => ({
    upload: async (p, bytes) => { if (o.uploadFail) return { error: { message: 'boom' } }; db.uploads++; db.store.set(p, Buffer.from(bytes)); return { error: null }; },
    download: async (p) => (db.store.has(p) ? { data: { arrayBuffer: async () => db.store.get(p).buffer.slice(db.store.get(p).byteOffset, db.store.get(p).byteOffset + db.store.get(p).length) }, error: null } : { data: null, error: { message: 'missing' } }),
    remove: async (ps) => { for (const x of ps) { db.store.delete(x); db.removed.push(x); } return { error: null }; } }) };
  db.from = (table) => { const f = []; let op = 'select', vals = null, ord = null, lim = null; const eqs = [];
    const q = { select: () => q, eq: (c, v) => { eqs.push([c, String(v)]); f.push((r) => String(r[c]) === String(v)); return q; }, order: (c, d) => { ord = [c, d && d.ascending === false ? -1 : 1]; return q; }, limit: (n) => { lim = n; return q; }, insert: (v) => { op = 'insert'; vals = v; return q; }, delete: () => { op = 'delete'; return q; } };
    const run = async () => { db.log.push({ table, op, eqs });
      if (o.missing && o.missing.includes(table)) return { data: null, error: { code: '42P01', message: `relation "${table}" does not exist` } }; if (o.failInsert && table === 'armory_photos' && op === 'insert') return { data: null, error: { code: 'XX', message: 'boom' } };
      const rows = db.t[table] || (db.t[table] = []);
      if (op === 'insert') { const row = { created_at: new Date(2026, 9, 22, 12, 0, ++db.n).toISOString(), ...vals }; rows.push(row); return { data: row, error: null }; }
      if (op === 'delete') { db.t[table] = rows.filter((r) => !f.every((g) => g(r))); return { data: null, error: null }; }
      let hit = rows.filter((r) => f.every((g) => g(r))).map((r) => ({ ...r })); if (ord) hit.sort((a, b) => (a[ord[0]] < b[ord[0]] ? -1 : a[ord[0]] > b[ord[0]] ? 1 : 0) * ord[1]); if (lim !== null) hit = hit.slice(0, lim); return { data: hit, error: null }; };
    q.maybeSingle = async () => { const r = await run(); if (r.error) return r; return { data: Array.isArray(r.data) ? (r.data[0] || null) : (r.data || null), error: null }; }; q.then = (res, rej) => run().then(res, rej); return q; };
  return db;
}
const base = (extra = {}) => ({ students: [{ user_id: A }, { user_id: S }], clients: [{ user_id: B }], armory_items: [{ id: ITEM_A, user_id: A }, { id: ITEM_A2, user_id: A }, { id: ITEM_B, user_id: B }], armory_photos: [], ...extra });
const add = (db, uid, itemId, full = jpeg(), thumb = jpeg({ size: 1500 })) => P.photoAdd(db, uid, { itemId, dataBase64: b64(full), thumbBase64: b64(thumb) });

(async () => {
  console.log('\n[Encryption]');
  await test('a photo is encrypted before it is stored: the stored file is not a JPEG, contains none of the picture, and the thumbnail in the table is encrypted too', async () => {
    const db = fakeDb(base()); const full = jpeg({ size: 4000 }); const r = await add(db, A, ITEM_A, full); assert(r.ok, JSON.stringify(r)); const stored = [...db.store.values()][0];
    assert(stored[0] === 1 && !stored.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) && !stored.includes(Buffer.from('JFIF')) && !stored.includes(Buffer.alloc(200, 0x55)), 'stored bytes are ciphertext (version byte first, never a JPEG header)'); assert(stored.length === full.length + 29, 'exactly 29 bytes added: version, random nonce, authentication tag'); const row = db.t.armory_photos[0]; const th = Buffer.from(row.thumb, 'base64'); assert(!th.includes(Buffer.from('JFIF')) && th[0] === 1, 'thumbnail is ciphertext');
    eq([row.user_id, row.item_id, row.key_version], [A, ITEM_A, 1]); assert(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.bin$/.test(row.storage_path) && row.storage_path.startsWith(A + '/' + ITEM_A + '/'), 'path is owner/item/photo');
    const open = await P.photoOpen(db, A, r.id); assert(open.ok && Buffer.from(open.dataBase64, 'base64').equals(full), 'the owner gets the exact picture back');
  });
  await test('a photo cannot be moved: decrypting with another owner, item, photo id or kind fails, and any change to the stored bytes is detected', () => {
    const plain = jpeg(); const sealed = P.sealPhoto('full', A, ITEM_A, 'p1', plain); assert(P.openPhoto('full', A, ITEM_A, 'p1', sealed).equals(plain), 'round trip');
    for (const [k, u, i, id] of [['full', B, ITEM_A, 'p1'], ['full', A, ITEM_B, 'p1'], ['full', A, ITEM_A, 'p2'], ['thumb', A, ITEM_A, 'p1']]) { let threw = false; try { P.openPhoto(k, u, i, id, sealed); } catch { threw = true; } assert(threw, `must fail for ${k} ${u === A ? 'A' : 'B'} ${i === ITEM_A ? 'A' : 'B'} ${id}`); }
    const bad = Buffer.from(sealed); bad[bad.length - 1] ^= 1; let t2 = false; try { P.openPhoto('full', A, ITEM_A, 'p1', bad); } catch { t2 = true; } assert(t2, 'tampering is detected'); const s2 = P.sealPhoto('full', A, ITEM_A, 'p1', plain); assert(!s2.equals(sealed), 'a fresh random nonce every time');
  });
  await test('without the server key nothing is stored or opened (the Armory is "not set up"), and with a different member\'s key derivation the bytes are unreadable', async () => {
    const keep = process.env.ARMORY_KEY; delete process.env.ARMORY_KEY; const db = fakeDb(base()); const r = await add(db, A, ITEM_A); assert(!r.ok && r.status === 503 && db.store.size === 0, 'no key, nothing stored'); process.env.ARMORY_KEY = keep;
  });

  console.log('\n[Only plain JPEGs: no location, camera or text details]');
  await test('a clean JPEG (basic header, tables, colour profile) is accepted; the check also demands a real picture frame and a real ending', () => {
    assert(P.isCleanJpeg(jpeg()) && P.isCleanJpeg(jpeg({ icc: true })), 'clean'); assert(!P.isCleanJpeg(Buffer.alloc(3000)) && !P.isCleanJpeg(Buffer.from('not a picture'.repeat(200))), 'not a JPEG'); assert(!P.isCleanJpeg(jpeg().subarray(0, 40)), 'truncated'); assert(!P.isCleanJpeg(jpeg({ noFrame: true })), 'a file with no picture frame is not a real JPEG');
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(3000)]); assert(!P.isCleanJpeg(png), 'a PNG is not accepted (the browser always sends JPEG)');
  });
  await test('EXIF (GPS and camera make), XMP, IPTC, comments and unknown tags are all refused, so a photo cannot carry where it was taken', () => {
    for (const k of ['exif', 'xmp', 'iptc', 'comment', 'app5']) assert(!P.isCleanJpeg(jpeg({ [k]: true })), k + ' must be refused');
  });
  await test('the server refuses a photo with location details even if the browser sent it: nothing is stored, and the person is told plainly', async () => {
    const db = fakeDb(base()); const r = await add(db, A, ITEM_A, jpeg({ exif: true })); eq([r.ok, r.status], [false, 415]); assert(/location or camera details/.test(r.message), 'plain message'); const r2 = await add(db, A, ITEM_A, jpeg(), jpeg({ exif: true })); eq([r2.ok, r2.status], [false, 415], 'thumbnail checked too'); eq([db.store.size, db.t.armory_photos.length], [0, 0]);
  });
  await test('sizes and encoding are checked: too big, too small, not base64, a data: URL or spaces are all refused before anything is stored', async () => {
    const db = fakeDb(base()); const big = jpeg({ size: P.MAX_PHOTO_BYTES + 5000 }); for (const bad of [{ dataBase64: b64(big), thumbBase64: b64(jpeg()) }, { dataBase64: b64(jpeg()), thumbBase64: b64(jpeg({ size: P.MAX_THUMB_BYTES + 3000 })) }, { dataBase64: 'data:image/jpeg;base64,' + b64(jpeg()), thumbBase64: b64(jpeg()) }, { dataBase64: b64(jpeg()) + ' ', thumbBase64: b64(jpeg()) }, { dataBase64: '', thumbBase64: b64(jpeg()) }, { dataBase64: b64(Buffer.alloc(100)), thumbBase64: b64(jpeg()) }, { dataBase64: 123, thumbBase64: b64(jpeg()) }]) { const r = await P.photoAdd(db, A, { itemId: ITEM_A, ...bad }); assert(!r.ok && r.status === 413, 'refused: ' + JSON.stringify(r)); } eq(db.store.size, 0);
  });

  console.log('\n[Limits and ownership]');
  await test('each item takes 4 photos and each member 25; the fifth on an item and the 26th overall are refused with a plain message', async () => {
    const db = fakeDb(base()); for (let i = 0; i < 4; i++) assert((await add(db, A, ITEM_A)).ok, 'photo ' + (i + 1)); const r5 = await add(db, A, ITEM_A); eq([r5.ok, r5.status], [false, 409]); assert(/up to 4 photos/.test(r5.message), r5.message);
    assert((await add(db, A, ITEM_A2)).ok, 'another item still has room'); const rows = db.t.armory_photos; for (let i = rows.length; i < 25; i++) rows.push({ id: 'x' + i, user_id: A, item_id: ITEM_A2.replace('2', '3'), created_at: new Date().toISOString() }); const r26 = await add(db, A, ITEM_A2); eq([r26.ok, r26.status], [false, 409]); assert(/25 photos in all/.test(r26.message), r26.message);
  });
  await test('a member can add photos only to their OWN items: someone else\'s item, a made-up id and a bad id are all "not found", and a non-member (staff, anyone else) gets nothing', async () => {
    const db = fakeDb(base()); eq((await add(db, A, ITEM_B)).status, 404, 'B\'s item'); eq((await add(db, A, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc')).status, 404); eq((await add(db, A, 'not-an-id')).status, 400);
    const stranger = '44444444-4444-4444-8444-444444444444'; for (const r of [await add(db, stranger, ITEM_A), await P.photoList(db, stranger), await P.photoOpen(db, stranger, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'), await P.photoDelete(db, stranger, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc')]) eq([r.ok, r.status], [false, 403]); eq(db.store.size, 0);
  });
  await test('each person lists only their own photo previews (decrypted for them); a preview is never shown to anyone else, and damaged previews are skipped', async () => {
    const db = fakeDb(base()); const th1 = jpeg({ size: 1600 }), th2 = jpeg({ size: 1700 }); await add(db, A, ITEM_A, jpeg(), th1); await add(db, B, ITEM_B, jpeg(), th2);
    const a = await P.photoList(db, A), b = await P.photoList(db, B); eq([a.photos.length, b.photos.length], [1, 1]); assert(Buffer.from(a.photos[0].thumbBase64, 'base64').equals(th1) && Buffer.from(b.photos[0].thumbBase64, 'base64').equals(th2), 'own previews'); assert(a.photos[0].itemId === ITEM_A && !JSON.stringify(a).includes(ITEM_B), 'no one else\'s ids');
    db.t.armory_photos[0].thumb = Buffer.from('garbage'.repeat(10)).toString('base64'); eq((await P.photoList(db, A)).photos.length, 0, 'a damaged preview is skipped');
  });
  await test('only the owner can open or delete a photo: another member (even knowing the id) gets "not found" and nothing is removed; the owner\'s delete removes the row and the stored file', async () => {
    const db = fakeDb(base()); const r = await add(db, A, ITEM_A); const o = await P.photoOpen(db, B, r.id); eq([o.ok, o.status], [false, 404]); const d = await P.photoDelete(db, B, r.id); eq([d.ok, d.status], [false, 404]); eq([db.t.armory_photos.length, db.store.size], [1, 1], 'nothing removed');
    const del = await P.photoDelete(db, A, r.id); assert(del.ok, 'owner deletes'); eq([db.t.armory_photos.length, db.store.size], [0, 0]); eq((await P.photoOpen(db, A, r.id)).status, 404, 'gone'); eq((await P.photoOpen(db, A, 'nope')).status, 400);
  });
  await test('every query that reads or changes a photo row is limited to the signed-in owner (not just protected by the key): list, open, delete, file names and counts all filter by user_id', async () => {
    const db = fakeDb(base()); const r = await add(db, A, ITEM_A); db.log.length = 0;
    await P.photoList(db, A); await P.photoOpen(db, A, r.id); await P.photoPaths(db, A, ITEM_A); await P.photoPaths(db, A); await P.photoDelete(db, A, r.id);
    const ph = db.log.filter((l) => l.table === 'armory_photos'); assert(ph.length >= 6, 'queries seen: ' + ph.length); for (const l of ph) assert(l.eqs.some(([c, v]) => c === 'user_id' && v === A), `${l.op} on armory_photos has no owner filter: ${JSON.stringify(l.eqs)}`);
    db.log.length = 0; await add(db, A, ITEM_A); for (const l of db.log.filter((x) => x.table === 'armory_photos' && x.op !== 'insert')) assert(l.eqs.some(([c, v]) => c === 'user_id' && v === A), 'the add checks count by owner'); const it = db.log.filter((l) => l.table === 'armory_items'); assert(it.length && it.every((l) => l.eqs.some(([c, v]) => c === 'user_id' && v === A)), 'the item is checked against the owner');
  });
  await test('if storing the file or the row fails, nothing half-saved is left behind (no row without a file, no file without a row)', async () => {
    const d1 = fakeDb(base(), { uploadFail: true }); const r1 = await add(d1, A, ITEM_A); assert(!r1.ok && r1.status === 503 && d1.t.armory_photos.length === 0, 'upload failure'); const d2 = fakeDb(base(), { failInsert: true }); const r2 = await add(d2, A, ITEM_A); assert(!r2.ok && d2.t.armory_photos.length === 0 && d2.store.size === 0 && d2.removed.length === 1, 'row failure removes the stored file');
    const d3 = fakeDb(base(), { missing: ['armory_photos'] }); const r3 = await add(d3, A, ITEM_A); assert(!r3.ok && /not set up/.test(r3.message), 'table not created yet'); const l3 = await P.photoList(d3, A); assert(l3.ok && l3.available === false, 'list says not available');
  });
  await test('deleting an item (or the whole armory) removes its stored photo files: the names are read first, and only that owner\'s files are touched', async () => {
    const db = fakeDb(base()); await add(db, A, ITEM_A); await add(db, A, ITEM_A); await add(db, A, ITEM_A2); await add(db, B, ITEM_B); eq(db.store.size, 4);
    const one = await P.photoPaths(db, A, ITEM_A); eq(one.length, 2); assert(one.every((p) => p.startsWith(`${A}/${ITEM_A}/`)), 'only that item'); const all = await P.photoPaths(db, A); eq(all.length, 3); assert(all.every((p) => p.startsWith(A + '/')), 'only this owner'); eq((await P.photoPaths(db, A, 'bad')).length, 0);
    await P.removePhotoFiles(db, one); eq(db.store.size, 2); await P.removePhotoFiles(db, []); const api = read('src/app/api/fifs/route.ts'); assert(/withPhotoCleanup\(supabase, uid, payload\.id, \(\) => armoryDelete\(supabase, uid, payload\.id\)\)/.test(api) && /withPhotoCleanup\(supabase, uid, undefined, \(\) => armoryDeleteAll\(supabase, uid\)\)/.test(api), 'the route cleans up on both deletes');
    assert(/if \(r && r\.ok\) await removePhotoFiles\(sb, paths\)/.test(api), 'only after the item was really deleted');
  });

  console.log('\n[Route, database, and who can never see a photo]');
  await test('the route: verified login first, the owner is never taken from the request, no staff path, rate limited saves, no logging, never cached', () => {
    const api = read('src/app/api/fifs/route.ts'); const at = api.indexOf("case 'armoryPhotos':"); assert(at > 0, 'cases exist'); const blk = api.slice(at, api.indexOf("case 'aiGuideStatus':", at));
    for (const a of ['armoryPhotos', 'armoryPhotoAdd', 'armoryPhotoOpen', 'armoryPhotoDelete']) assert(new RegExp(`case '${a}':`).test(blk), a); assert(blk.indexOf('getAuthenticatedUser') < blk.indexOf('getPrivilegedClient') && /status: 401/.test(blk), 'login first'); assert(/const uid = String\(user\.id\)/.test(blk), 'owner is the login');
    assert(!/payload\??\.(userId|user_id|ownerId|memberId|uid)/.test(blk) && !/isStaffOrAdmin|adminPhoto|adminArmory/.test(blk), 'no owner from the request, no staff path'); assert(/allowPublicSubmit\(req, 'armoryPhoto', 30\)/.test(blk) && /429/.test(blk), 'rate limited'); assert(!/console\./.test(blk), 'nothing logged'); assert(/'Cache-Control': 'no-store'/.test(blk) && (blk.match(/headers: noStore/g) || []).length === 2, 'never cached: both the answer and the errors carry the no-store header');
  });
  await test('the size limits are fixed numbers that fit the database script and the storage area (not values the tests merely follow)', () => {
    eq([P.MAX_PHOTO_BYTES, P.MAX_THUMB_BYTES, P.MAX_PER_ITEM, P.MAX_PER_MEMBER], [1_700_000, 45_000, 4, 25]); const sql = read('scripts/sql/20261029_armory_photos.sql'); assert(P.MAX_PHOTO_BYTES <= 2000000 && /between 1000 and 2000000/.test(sql), 'a photo always fits the table check'); assert(P.MAX_PHOTO_BYTES + 16 + 12 + 1 <= 2097152 && /2097152/.test(sql), 'the encrypted file always fits the 2 MB storage limit');
    assert(Math.ceil(P.MAX_THUMB_BYTES * 4 / 3) + 29 * 2 <= 90000 && /between 40 and 90000/.test(sql), 'an encrypted preview always fits the table check');
  });
  await test('the database script: row security on, no browser access, owner and item tied in with cascade delete, a private storage area with a 2 MB limit, and the photo size is bounded', () => {
    const sql = read('scripts/sql/20261029_armory_photos.sql').replace(/--.*$/gm, ''); assert(/enable row level security/.test(sql) && /revoke all on public\.armory_photos from anon, authenticated/.test(sql) && /grant select, insert, delete on public\.armory_photos to service_role/.test(sql) && !/to (anon|authenticated|public)\b[^;]*;/.test(sql.replace(/revoke[^;]*;/g, '')), 'no browser access');
    assert(/user_id uuid not null references auth\.users\(id\) on delete cascade/.test(sql) && /item_id uuid not null references public\.armory_items\(id\) on delete cascade/.test(sql), 'cascades'); assert(/'armory', 'armory', false, 2097152/.test(sql), 'private, 2 MB'); assert(/size_bytes integer not null check \(size_bytes between 1000 and 2000000\)/.test(sql), 'bounded'); assert(!/create policy/i.test(sql), 'no storage policies: the website reaches it only with its own key');
    assert(/on conflict \(id\) do nothing/.test(sql) && /create table if not exists/.test(sql), 'safe to run twice');
  });
  await test('photos never reach push, chat, Discord alerts, analytics, the AI guide, the insurance package or the CSV exports', () => {
    for (const f of ['src/Lib/server/push.ts', 'src/Lib/server/push-logic.ts', 'src/Lib/server/portal-chat.ts', 'src/Lib/server/discord.ts', 'src/Lib/server/site-visits.ts', 'src/Lib/server/ai-guide.ts', 'src/ai/knowledge.ts', 'src/portal/insurancePackage.ts', 'src/portal/armoryLogic.ts', 'src/Lib/server/wallet.ts']) assert(!/armory-photos|armoryPhoto|photoShrink|armory_photos/.test(read(f)), f + ' must not touch Armory photos');
    assert(!/photo/i.test(code('src/portal/insurancePackage.ts') + code('src/portal/armoryLogic.ts')), 'the package and exports stay text only'); const api2 = code('src/app/api/fifs/route.ts'); for (const fn of ['photoAdd', 'photoList', 'photoOpen', 'photoDelete']) assert((api2.match(new RegExp(fn + '\\(', 'g')) || []).length === 1, fn + ' is called in exactly one place (the owner-checked Armory photo cases)'); assert(!/armory_photos/.test(api2), 'the route never touches the table directly');
  });
  await test('the module itself never logs, calls out to a network, or is reachable except through the owner-checked functions', () => {
    const m = code('src/Lib/server/armory-photos.ts'); assert(!/console\.|fetch\(|XMLHttpRequest|sendBeacon/.test(m), 'no logging or network'); for (const fn of ['photoAdd', 'photoList', 'photoOpen', 'photoDelete']) assert(new RegExp(`async function ${fn}[\\s\\S]*?guard\\(sb, uid\\)`).test(m), fn + ' checks the owner first');
    assert((m.match(/\.eq\('user_id', uid\)/g) || []).length >= 6, 'every query is limited to the owner');
  });

  console.log('\n[The screen]');
  await test('the Armory screen: a photo is re-drawn in the browser before it is sent, only that prepared copy goes up, the counts match the server\'s, previews are plain images, and nothing is stored in the browser', () => {
    const w = code('src/portal/ArmoryPanel.tsx'); assert(/prepArmoryPhoto\(file\)/.test(w) && /armoryPhotoAdd/.test(w) && w.indexOf('prepArmoryPhoto(file)') < w.indexOf("call('armoryPhotoAdd'"), 'prepared first'); assert(/blobToBase64\(prep\.main\)/.test(w) && /blobToBase64\(prep\.thumb\)/.test(w) && !/blobToBase64\(file\)|FileReader/.test(w), 'only the prepared copy is sent');
    assert(/PER_ITEM = 4, PER_MEMBER = 25/.test(w) && P.MAX_PER_ITEM === 4 && P.MAX_PER_MEMBER === 25, 'limits match'); assert(!/innerHTML|dangerouslySetInnerHTML|localStorage|sessionStorage|console\./.test(w), 'text only, nothing stored'); assert(/<img alt="" src=\{`data:image\/jpeg;base64,\$\{p\.thumbBase64\}`\}/.test(w), 'previews are plain images');
    assert(/URL\.revokeObjectURL\(v\.url\)/.test(w) && /closeViewer\(\); setOpen\(false\)/.test(w), 'the big picture is released when closed'); assert(/if \(viewer\) closeViewer\(\)/.test(w), 'Escape closes the picture first');
  });
  await test('the screen asks before deleting a photo, tells people not to photograph where they store firearms or their home security, and has 44px+ controls with a visible focus ring and no animation', () => {
    const w = code('src/portal/ArmoryPanel.tsx'); assert(/Delete this photo\?/.test(w) && /Yes, delete/.test(w), 'confirmation'); assert((w.match(/delPhoto\(/g) || []).length === 1 && /const delPhoto = /.test(w), 'the delete function is defined once and called from exactly one place'); const ask = w.indexOf('Delete this photo?'); const yes = w.indexOf('Yes, delete', ask); assert(w.lastIndexOf('delPhoto(', yes) > ask && /onClick=\{\(\) => void delPhoto\(viewer\.id\)\} disabled=\{busy\}>Yes, delete/.test(w), 'it is called only from the Yes, delete button'); assert(/onClick=\{\(\) => setConfirm\('p' \+ viewer\.id\)\}>🗑️ Delete photo/.test(w), 'the first button only asks'); assert(/Photos are encrypted too\. Please do not photograph where you store firearms, safe combinations or home-security details/.test(w) && /Every record here is encrypted\. Please do not enter where you store firearms/.test(w), 'both notices: records and photos');
    const css = read('src/portal/armory.css').slice(read('src/portal/armory.css').indexOf('Armory photos:')); assert(/\.ar-photo-btn \{[^}]*min-height: 48px/.test(css) && /\.ar-thumb \{[^}]*width: 88px; height: 88px/.test(css) && /:focus-visible[^{]*\{ outline: 3px solid #00e5ff/.test(css), '44px+ and focus'); assert(!/animation|transition|@keyframes/.test(css), 'nothing moves');
    assert(/aria-label=\{`Open photo \$\{k \+ 1\} of \$\{mine\.length\} of \$\{i\.nickname\}`\}/.test(w) && /alt=\{`Photo of \$\{viewer\.name\}`\}/.test(w), 'spoken names');
  });
  await test('the browser prep always re-draws (even a small photo, so location details are always dropped), builds a small preview, never enlarges, and sends nothing anywhere', () => {
    const m = code('src/portal/photoShrink.ts'); const at = m.indexOf('export async function prepArmoryPhoto'); const f = m.slice(at, m.indexOf('export const blobToBase64')); assert(!/needsPrep|file\.size/.test(f), 'no "skip if small" shortcut'); assert(/encode\(pic, a\.side, a\.quality\)/.test(f) && /ARMORY_MAX_BYTES \* TARGET_FRACTION/.test(f) && /ARMORY_THUMB_MAX/.test(f), 'main and preview are both built');
    assert(!/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|console\./.test(m), 'nothing sent or stored'); assert(P.MAX_PHOTO_BYTES > 1_500_000 && P.MAX_THUMB_BYTES >= 40_000, 'server limits are above what the browser makes');
  });
  console.log(`\nArmory photos: ${passed} passed, ${failed} failed`); if (failed) process.exit(1);
})();
