// Armory photos (table and private storage area: scripts/sql/20261029_armory_photos.sql). A member can attach up to 4 photos to each of their own Armory items (25 in all).
// Every photo is encrypted here, on the server, BEFORE it reaches storage (AES-256-GCM, a different key per member derived from the Armory's one server secret, the same as the Armory records), and is bound to its owner,
// item and photo id, so a file cannot be moved to another person or item and any change is detected. A small preview of each photo is kept encrypted in the table so the list shows fast.
// Rules: only the owner reaches a photo (the owner is the verified login, never anything from the request); staff have no route to them; nothing here is logged, sent in a notification, or given to
// analytics or the AI guide. A photo must be a plain JPEG that carries no location, camera or text details (the browser re-draws every photo first; this checks it again).
// Honest limit: server-side encryption, like the Document Vault and the Armory records. Someone holding BOTH the server secret and the data could decrypt; if the secret is lost the photos cannot be recovered.
import crypto from 'crypto';
import { armoryEnabled, memberKey, armoryOwnsItem, armoryPurgeRows, KEY_VERSION } from './armory';
import { memberRole } from './portal-chat';

export const PHOTO_BUCKET = 'armory';
export const MAX_PER_ITEM = 4, MAX_PER_MEMBER = 25;
export const MAX_PHOTO_BYTES = 1_700_000, MAX_THUMB_BYTES = 45_000, MIN_BYTES = 1_000;
export type PResult<T = {}> = ({ ok: true } & T) | { ok: false; status: number; message: string };
export interface PhotoMeta { id: string; itemId: string; createdAt: string; thumbBase64: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const B64 = /^[A-Za-z0-9+/]+={0,2}$/;
const missing = (e: any) => !!e && (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|schema cache|Bucket not found/i.test(String(e.message || '')));
const NOT_READY = 'Photos are not set up yet. Please check back soon.';
const FAIL = 'That could not be done right now. Nothing was changed.';

// ---- encryption (layout: 1 byte version, 12 byte nonce, 16 byte tag, ciphertext) ----
const aad = (kind: 'full' | 'thumb', uid: string, itemId: string, photoId: string, v: number) => Buffer.from(`armory-photo:${kind}:${uid}:${itemId}:${photoId}:${v}`);
export function sealPhoto(kind: 'full' | 'thumb', uid: string, itemId: string, photoId: string, plain: Buffer, v = KEY_VERSION): Buffer {
  const iv = crypto.randomBytes(12); const c = crypto.createCipheriv('aes-256-gcm', memberKey(uid, v), iv); c.setAAD(aad(kind, uid, itemId, photoId, v));
  const body = Buffer.concat([c.update(plain), c.final()]); return Buffer.concat([Buffer.from([v]), iv, c.getAuthTag(), body]);
}
export function openPhoto(kind: 'full' | 'thumb', uid: string, itemId: string, photoId: string, blob: Buffer): Buffer {
  if (blob.length < 29) throw new Error('bad photo'); const v = blob[0]; if (v < 1 || v > 99) throw new Error('bad photo');
  const d = crypto.createDecipheriv('aes-256-gcm', memberKey(uid, v), blob.subarray(1, 13)); d.setAAD(aad(kind, uid, itemId, photoId, v)); d.setAuthTag(blob.subarray(13, 29));
  return Buffer.concat([d.update(blob.subarray(29)), d.final()]);
}

// ---- the file must be a plain JPEG with no location, camera or text details ----
/** Walks the JPEG's header segments. Allowed: the basic header (JFIF), colour profile and Adobe colour tags. Refused: EXIF (where GPS and camera details live), XMP, IPTC, comments and any other tag. */
export function isCleanJpeg(b: Buffer): boolean {
  if (b.length < MIN_BYTES || b[0] !== 0xff || b[1] !== 0xd8 || b[2] !== 0xff) return false;
  let i = 2, sawFrame = false;
  while (i + 3 < b.length) {
    if (b[i] !== 0xff) return false; let m = b[i + 1]; while (m === 0xff && i + 2 < b.length) { i += 1; m = b[i + 1]; }
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    if (m === 0xd9) return sawFrame;
    const len = b.readUInt16BE(i + 2); if (len < 2 || i + 2 + len > b.length) return false;
    if (m === 0xda) return sawFrame;                       // the picture data starts: nothing before this point was refused
    if (m === 0xc0 || m === 0xc1 || m === 0xc2) sawFrame = true;
    const ok = m === 0xe0 || m === 0xe2 || m === 0xee || m === 0xdb || m === 0xc4 || m === 0xc0 || m === 0xc1 || m === 0xc2 || m === 0xdd;
    if (!ok) return false;                                  // EXIF/XMP (E1), IPTC (ED), comments (FE), other tags, and anything unknown
    i += 2 + len;
  }
  return false;
}
/** Decodes plain base64 only (no data: prefix, no spaces), within a size limit. */
function decode(v: unknown, maxBytes: number): Buffer | null {
  if (typeof v !== 'string' || !v || v.length > Math.ceil(maxBytes * 4 / 3) + 8 || !B64.test(v)) return null;
  const buf = Buffer.from(v, 'base64'); return buf.length >= MIN_BYTES && buf.length <= maxBytes ? buf : null;
}

async function guard(sb: any, uid: string): Promise<PResult> {
  if (!armoryEnabled()) return { ok: false, status: 503, message: NOT_READY };
  try { return (await memberRole(sb, uid)) ? { ok: true } : { ok: false, status: 403, message: 'The armory is for students and clients.' }; }
  catch { return { ok: false, status: 503, message: 'The armory is unavailable right now. Please try again in a minute.' }; }
}

export async function photoAdd(sb: any, uid: string, input: any): Promise<PResult<{ id: string }>> {
  const itemId = String(input?.itemId ?? ''); if (!UUID.test(itemId)) return { ok: false, status: 400, message: 'That item could not be found.' };
  const full = decode(input?.dataBase64, MAX_PHOTO_BYTES), thumb = decode(input?.thumbBase64, MAX_THUMB_BYTES);
  if (!full || !thumb) return { ok: false, status: 413, message: 'That photo is too large or not valid. Please choose another.' };
  if (!isCleanJpeg(full) || !isCleanJpeg(thumb)) return { ok: false, status: 415, message: 'Only plain JPEG photos without location or camera details can be stored. Please choose the photo again.' };
  const g = await guard(sb, uid); if (!g.ok) return g;
  try {
    const it = await armoryOwnsItem(sb, uid, itemId); if (!it.ok) return { ok: false, status: it.status, message: it.message }; if (!it.owned) return { ok: false, status: 404, message: 'That item could not be found.' };
    const mine = await sb.from('armory_photos').select('id, item_id').eq('user_id', uid).limit(MAX_PER_MEMBER + 1); if (mine.error) return { ok: false, status: 503, message: missing(mine.error) ? NOT_READY : FAIL };
    const all = mine.data || []; if (all.length >= MAX_PER_MEMBER) return { ok: false, status: 409, message: `You can keep up to ${MAX_PER_MEMBER} photos in all. Delete one first.` };
    if (all.filter((r: any) => String(r.item_id) === itemId).length >= MAX_PER_ITEM) return { ok: false, status: 409, message: `Each item can have up to ${MAX_PER_ITEM} photos. Delete one first.` };
    const id = crypto.randomUUID(); const path = `${uid}/${itemId}/${id}.bin`;
    const up = await sb.storage.from(PHOTO_BUCKET).upload(path, sealPhoto('full', uid, itemId, id, full), { contentType: 'application/octet-stream', upsert: false });
    if (up.error) return { ok: false, status: 503, message: missing(up.error) ? NOT_READY : FAIL };
    const ins = await sb.from('armory_photos').insert({ id, user_id: uid, item_id: itemId, key_version: KEY_VERSION, storage_path: path, thumb: sealPhoto('thumb', uid, itemId, id, thumb).toString('base64'), size_bytes: full.length });
    if (ins.error) { try { await sb.storage.from(PHOTO_BUCKET).remove([path]); } catch { /* the stored file is encrypted and unreachable without its row */ } return { ok: false, status: 503, message: FAIL }; }
    return { ok: true, id };
  } catch { return { ok: false, status: 503, message: FAIL }; }
}

/** The member's own photo previews (decrypted for them). */
export async function photoList(sb: any, uid: string): Promise<PResult<{ available: boolean; photos: PhotoMeta[] }>> {
  const g = await guard(sb, uid); if (!g.ok) return g.status === 503 && g.message === NOT_READY ? { ok: true, available: false, photos: [] } : g;
  try {
    const r = await sb.from('armory_photos').select('id, item_id, key_version, thumb, created_at').eq('user_id', uid).order('created_at', { ascending: true }).limit(MAX_PER_MEMBER);
    if (r.error) return missing(r.error) ? { ok: true, available: false, photos: [] } : { ok: false, status: 503, message: 'Could not load your photos right now.' };
    const photos: PhotoMeta[] = [];
    for (const row of r.data || []) { try { photos.push({ id: String(row.id), itemId: String(row.item_id), createdAt: String(row.created_at || ''), thumbBase64: openPhoto('thumb', uid, String(row.item_id), String(row.id), Buffer.from(String(row.thumb), 'base64')).toString('base64') }); } catch { /* a damaged preview is skipped, not shown */ } }
    return { ok: true, available: true, photos };
  } catch { return { ok: false, status: 503, message: 'Could not load your photos right now.' }; }
}

export async function photoOpen(sb: any, uid: string, id: unknown): Promise<PResult<{ dataBase64: string; mime: 'image/jpeg' }>> {
  const pid = String(id ?? ''); if (!UUID.test(pid)) return { ok: false, status: 400, message: 'That photo could not be found.' };
  const g = await guard(sb, uid); if (!g.ok) return g;
  try {
    const r = await sb.from('armory_photos').select('id, item_id, storage_path').eq('id', pid).eq('user_id', uid).maybeSingle();
    if (r.error) return { ok: false, status: 503, message: missing(r.error) ? NOT_READY : FAIL }; if (!r.data) return { ok: false, status: 404, message: 'That photo could not be found.' };
    const dl = await sb.storage.from(PHOTO_BUCKET).download(String(r.data.storage_path)); if (dl.error || !dl.data) return { ok: false, status: 503, message: 'This photo could not be opened right now.' };
    const blob = Buffer.from(await dl.data.arrayBuffer());
    try { return { ok: true, dataBase64: openPhoto('full', uid, String(r.data.item_id), pid, blob).toString('base64'), mime: 'image/jpeg' }; } catch { return { ok: false, status: 500, message: 'This photo could not be read. It may be damaged. You can delete it.' }; }
  } catch { return { ok: false, status: 503, message: FAIL }; }
}

export async function photoDelete(sb: any, uid: string, id: unknown): Promise<PResult> {
  const pid = String(id ?? ''); if (!UUID.test(pid)) return { ok: false, status: 400, message: 'That photo could not be found.' };
  const g = await guard(sb, uid); if (!g.ok) return g;
  try {
    const r = await sb.from('armory_photos').select('id, storage_path').eq('id', pid).eq('user_id', uid).maybeSingle();
    if (r.error) return { ok: false, status: 503, message: missing(r.error) ? NOT_READY : FAIL }; if (!r.data) return { ok: false, status: 404, message: 'That photo could not be found.' };
    const d = await sb.from('armory_photos').delete().eq('id', pid).eq('user_id', uid); if (d.error) return { ok: false, status: 503, message: FAIL };
    try { await sb.storage.from(PHOTO_BUCKET).remove([String(r.data.storage_path)]); } catch { /* the file is encrypted and no longer reachable */ }
    return { ok: true };
  } catch { return { ok: false, status: 503, message: FAIL }; }
}

/** The stored files that belong to one item (or all of this member's items). Read BEFORE the item is deleted, because deleting the item removes the rows. */
export async function photoPaths(sb: any, uid: string, itemId?: unknown): Promise<string[]> {
  try { let q = sb.from('armory_photos').select('storage_path').eq('user_id', uid); if (itemId !== undefined) { const i = String(itemId ?? ''); if (!UUID.test(i)) return []; q = q.eq('item_id', i); } const r = await q.limit(MAX_PER_MEMBER + 5); return r.error ? [] : (r.data || []).map((x: any) => String(x.storage_path)).filter(Boolean); } catch { return []; }
}
export async function removePhotoFiles(sb: any, paths: string[]): Promise<void> { if (!paths.length) return; try { await sb.storage.from(PHOTO_BUCKET).remove(paths); } catch { /* the files are encrypted and no longer reachable */ } }

/** When staff permanently delete a person, ALL of their Armory goes: the encrypted photo files first (their names are read before the rows disappear), then the photo rows, then the item rows.
 *  Best effort, never throws. Runs before the person's sign-in is removed (removing the sign-in deletes the rows that list the files). Only that person's files and rows are touched. */
export async function purgeArmory(sb: any, userId: unknown): Promise<void> {
  try {
    const uid = String(userId ?? ''); if (!UUID.test(uid)) return;
    const paths = await photoPaths(sb, uid); await removePhotoFiles(sb, paths);
    try { await sb.from('armory_photos').delete().eq('user_id', uid); } catch { /* removed with the item rows below */ }
    await armoryPurgeRows(sb, uid);
  } catch { /* nothing more can be done here */ }
}
