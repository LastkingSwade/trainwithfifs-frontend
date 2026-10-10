import crypto from 'crypto';

// Document wallet: a private place for a signed-in person's OWN documents (permit card, class certificate, HQL approval, other ID).
//  - Opt-in: nothing can be stored until the person accepts the notice.
//  - Only the owner can list, open or delete a file. The caller's id comes from the verified token, never from the request.
//  - Every file is encrypted here (AES-256-GCM, key WALLET_KEY kept only in Vercel) BEFORE it reaches storage.
//  - Only four document types, no free-text labels, and a short "never upload" notice: no firearm serials, gun photos, storage or registry data.
export const WALLET_KINDS = { permit_card: 'Permit card', class_certificate: 'Class certificate', hql_approval: 'HQL approval', other_id: 'Other ID' } as const;
export type WalletKind = keyof typeof WALLET_KINDS;
export const WALLET_BUCKET = 'wallet';
export const NOTICE_VERSION = 1;
export const MAX_BYTES = 3 * 1024 * 1024;   // keeps the request under the host's 4.5 MB body limit once base64-encoded
export const MAX_DOCS = 20;

export type WalletResult<T = {}> = ({ ok: true } & T) | { ok: false; status: number; message: string };
export interface WalletDoc { id: string; kind: WalletKind; kindLabel: string; mime: string; sizeBytes: number; expiresOn: string | null; createdAt: string }

function key(): Buffer | null {
  const hex = process.env.WALLET_KEY || '';
  return /^[0-9a-fA-F]{64}$/.test(hex) ? Buffer.from(hex, 'hex') : null;
}
export const walletEnabled = (): boolean => key() !== null;

/** Layout: 1 byte version, 12 byte nonce, 16 byte tag, ciphertext. The owner and document ids are bound in, so a file cannot be swapped between people. */
export function encryptBytes(plain: Buffer, owner: string, docId: string): Buffer {
  const k = key(); if (!k) throw new Error('wallet key missing');
  const iv = crypto.randomBytes(12); const c = crypto.createCipheriv('aes-256-gcm', k, iv); c.setAAD(Buffer.from(`${owner}:${docId}`));
  const body = Buffer.concat([c.update(plain), c.final()]);
  return Buffer.concat([Buffer.from([1]), iv, c.getAuthTag(), body]);
}
export function decryptBytes(blob: Buffer, owner: string, docId: string): Buffer {
  const k = key(); if (!k) throw new Error('wallet key missing');
  if (blob.length < 29 || blob[0] !== 1) throw new Error('bad wallet file');
  const d = crypto.createDecipheriv('aes-256-gcm', k, blob.subarray(1, 13)); d.setAAD(Buffer.from(`${owner}:${docId}`)); d.setAuthTag(blob.subarray(13, 29));
  return Buffer.concat([d.update(blob.subarray(29)), d.final()]);
}

/** The file type is decided from the file's own first bytes, never from what the browser says. */
export function sniffMime(b: Buffer): 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp' | null {
  if (b.length > 12 && b.subarray(0, 4).toString('latin1') === '%PDF') return 'application/pdf';
  if (b.length > 12 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}
const EXT: Record<string, string> = { 'application/pdf': 'bin', 'image/png': 'bin', 'image/jpeg': 'bin', 'image/webp': 'bin' };
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function walletStatus(supabase: any, userId: string): Promise<WalletResult<{ enabled: boolean; consented: boolean; docs: WalletDoc[]; maxBytes: number; kinds: Record<string, string> }>> {
  if (!walletEnabled()) return { ok: true, enabled: false, consented: false, docs: [], maxBytes: MAX_BYTES, kinds: WALLET_KINDS };
  try {
    const c = await supabase.from('wallet_consent').select('accepted_at, notice_version').eq('user_id', userId).maybeSingle();
    if (c.error) return { ok: false, status: 503, message: 'The document wallet is not set up yet.' };
    const consented = !!c.data && Number(c.data.notice_version) >= NOTICE_VERSION;
    let docs: WalletDoc[] = [];
    if (consented) {
      const d = await supabase.from('wallet_documents').select('id, kind, mime, size_bytes, expires_on, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(MAX_DOCS);
      if (d.error || !Array.isArray(d.data)) return { ok: false, status: 503, message: 'Could not load your documents.' };
      docs = d.data.map((r: any) => ({ id: String(r.id), kind: r.kind, kindLabel: (WALLET_KINDS as any)[r.kind] || 'Document', mime: String(r.mime), sizeBytes: Number(r.size_bytes) || 0, expiresOn: r.expires_on || null, createdAt: String(r.created_at || '') }));
    }
    return { ok: true, enabled: true, consented, docs, maxBytes: MAX_BYTES, kinds: WALLET_KINDS };
  } catch (err: any) { console.warn('[Wallet] status unavailable:', err?.message); return { ok: false, status: 503, message: 'The document wallet is not available right now.' }; }
}

export async function walletConsent(supabase: any, userId: string): Promise<WalletResult> {
  if (!walletEnabled()) return { ok: false, status: 503, message: 'The document wallet is not available yet.' };
  try {
    const { error } = await supabase.from('wallet_consent').upsert({ user_id: userId, accepted_at: new Date().toISOString(), notice_version: NOTICE_VERSION }, { onConflict: 'user_id' });
    return error ? { ok: false, status: 503, message: 'Could not save your choice.' } : { ok: true };
  } catch { return { ok: false, status: 503, message: 'Could not save your choice.' }; }
}

export async function walletUpload(supabase: any, userId: string, input: { kind?: unknown; dataBase64?: unknown; expiresOn?: unknown }): Promise<WalletResult<{ id: string }>> {
  if (!walletEnabled()) return { ok: false, status: 503, message: 'The document wallet is not available yet.' };
  const kind = String(input.kind ?? '');
  if (!(kind in WALLET_KINDS)) return { ok: false, status: 400, message: 'Choose what kind of document this is.' };
  const exp = input.expiresOn ? String(input.expiresOn) : null;
  if (exp && (!DAY.test(exp) || Number.isNaN(Date.parse(exp + 'T12:00:00Z')))) return { ok: false, status: 400, message: 'The expiration date is not valid.' };
  const b64 = typeof input.dataBase64 === 'string' ? input.dataBase64.replace(/^data:[^,]*,/, '') : '';
  if (!b64 || b64.length > Math.ceil(MAX_BYTES * 4 / 3) + 8 || !/^[A-Za-z0-9+/=\s]+$/.test(b64)) return { ok: false, status: 413, message: 'Choose a PDF or photo no larger than 3 MB.' };
  const bytes = Buffer.from(b64, 'base64');
  if (!bytes.length || bytes.length > MAX_BYTES) return { ok: false, status: 413, message: 'Choose a PDF or photo no larger than 3 MB.' };
  const mime = sniffMime(bytes);
  if (!mime) return { ok: false, status: 415, message: 'Only PDF, PNG, JPG or WEBP files can be stored.' };
  try {
    const st = await walletStatus(supabase, userId);
    if (!st.ok) return st;
    if (!st.consented) return { ok: false, status: 403, message: 'Please accept the document wallet notice first.' };
    if (st.docs.length >= MAX_DOCS) return { ok: false, status: 409, message: `You can keep up to ${MAX_DOCS} documents. Delete one first.` };
    const docId = crypto.randomUUID(); const path = `${userId}/${docId}.${EXT[mime]}`;
    const up = await supabase.storage.from(WALLET_BUCKET).upload(path, encryptBytes(bytes, userId, docId), { contentType: 'application/octet-stream', upsert: false });
    if (up.error) return { ok: false, status: 502, message: 'The file could not be stored. Nothing was saved.' };
    const ins = await supabase.from('wallet_documents').insert({ id: docId, user_id: userId, kind, storage_path: path, mime, size_bytes: bytes.length, expires_on: exp });
    if (ins.error) { await supabase.storage.from(WALLET_BUCKET).remove([path]); return { ok: false, status: 500, message: 'The file could not be saved. Nothing was stored.' }; }
    return { ok: true, id: docId };
  } catch (err: any) { console.warn('[Wallet] upload failed:', err?.message); return { ok: false, status: 500, message: 'The file could not be saved. Nothing was stored.' }; }
}

export async function walletOpen(supabase: any, userId: string, id: unknown): Promise<WalletResult<{ dataBase64: string; mime: string; fileName: string }>> {
  if (!walletEnabled()) return { ok: false, status: 503, message: 'The document wallet is not available yet.' };
  if (!UUID.test(String(id ?? ''))) return { ok: false, status: 400, message: 'Choose a document.' };
  try {
    // Scoped to the caller: another person's id behaves exactly like a missing one.
    const { data, error } = await supabase.from('wallet_documents').select('id, kind, mime, storage_path').eq('id', String(id)).eq('user_id', userId).maybeSingle();
    if (error) return { ok: false, status: 503, message: 'Could not open that document.' };
    if (!data) return { ok: false, status: 404, message: 'That document was not found.' };
    const dl = await supabase.storage.from(WALLET_BUCKET).download(data.storage_path);
    if (dl.error || !dl.data) return { ok: false, status: 502, message: 'Could not open that document.' };
    const plain = decryptBytes(Buffer.from(await dl.data.arrayBuffer()), userId, data.id);
    const ext = data.mime === 'application/pdf' ? 'pdf' : data.mime === 'image/png' ? 'png' : data.mime === 'image/webp' ? 'webp' : 'jpg';
    return { ok: true, dataBase64: plain.toString('base64'), mime: data.mime, fileName: `${(WALLET_KINDS as any)[data.kind] || 'document'}.${ext}`.replace(/\s+/g, '-') };
  } catch (err: any) { console.warn('[Wallet] open failed:', err?.message); return { ok: false, status: 500, message: 'Could not open that document.' }; }
}

export async function walletDelete(supabase: any, userId: string, id: unknown): Promise<WalletResult> {
  if (!UUID.test(String(id ?? ''))) return { ok: false, status: 400, message: 'Choose a document.' };
  try {
    const { data, error } = await supabase.from('wallet_documents').select('id, storage_path').eq('id', String(id)).eq('user_id', userId).maybeSingle();
    if (error) return { ok: false, status: 503, message: 'Could not delete that document.' };
    if (!data) return { ok: false, status: 404, message: 'That document was not found.' };
    const rm = await supabase.storage.from(WALLET_BUCKET).remove([data.storage_path]);
    if (rm.error) return { ok: false, status: 502, message: 'Could not delete that document.' };
    const del = await supabase.from('wallet_documents').delete().eq('id', data.id).eq('user_id', userId);
    return del.error ? { ok: false, status: 503, message: 'Could not delete that document.' } : { ok: true };
  } catch { return { ok: false, status: 500, message: 'Could not delete that document.' }; }
}

/** When a person is deleted by staff, their wallet files go too (they are not part of "Recently deleted"). Best effort, never throws. */
export async function purgeWallet(supabase: any, userId: unknown): Promise<void> {
  try {
    if (!UUID.test(String(userId ?? ''))) return;
    const { data } = await supabase.from('wallet_documents').select('storage_path').eq('user_id', String(userId));
    const paths = (Array.isArray(data) ? data : []).map((r: any) => r.storage_path).filter(Boolean);
    if (paths.length) await supabase.storage.from(WALLET_BUCKET).remove(paths);
    await supabase.from('wallet_documents').delete().eq('user_id', String(userId));
    await supabase.from('wallet_consent').delete().eq('user_id', String(userId));
  } catch (err: any) { console.warn('[Wallet] purge note:', err?.message); }
}
