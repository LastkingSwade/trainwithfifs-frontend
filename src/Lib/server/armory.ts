// Armory: a member's private equipment records (table: scripts/sql/20261028_armory_items.sql). Every item is ONE encrypted blob (AES-256-GCM). The make, model, caliber, serial number, notes and
// maintenance log are inside it; the database sees only an id, the owner, a key version and ciphertext. A different key is derived for every member from one server secret (ARMORY_KEY), and each
// blob is bound to its owner, item id and key version, so a blob cannot be moved to another person or item and any change is detected.
// Honest limit: this is server-side encryption (like the Document Vault). The website decrypts to show a member their own records; staff have no route to them, nothing here is logged, sent
// in a notification, or given to analytics or the AI guide. Someone holding BOTH the server secret and the database could decrypt. If the secret is lost, the records cannot be recovered.
import crypto from 'crypto';
import { memberRole } from './portal-chat';
import { gcmSeal, gcmOpen } from './gcm';

export const KEY_VERSION = 1, MAX_ITEMS = 50, MAX_MAINTENANCE = 100, MAX_JSON = 12000;
export const TYPES = { handgun: 'Handgun', rifle: 'Rifle', shotgun: 'Shotgun', other: 'Other equipment' } as const;
export const MAINT_KINDS = { cleaning: 'Cleaning', inspection: 'Inspection', repair: 'Repair', parts: 'Parts or upgrade', other: 'Other' } as const;
export type ItemType = keyof typeof TYPES; export type MaintKind = keyof typeof MAINT_KINDS;
export type AResult<T = {}> = ({ ok: true } & T) | { ok: false; status: number; message: string };
export interface Maintenance { id: string; on: string; kind: MaintKind; note: string }
export interface ItemData { nickname: string; type: ItemType; make: string; model: string; caliber: string; serial: string; purchasedOn: string; price: number | null; notes: string; maintenance: Maintenance[]; serviceEveryMonths: number | null }
export interface Item extends ItemData { id: string; createdAt: string; updatedAt: string; unreadable?: boolean }

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const missingTable = (e: any) => !!e && (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|schema cache/i.test(String(e.message || '')));
const NOT_READY = 'The armory is not set up yet. Please check back soon.';
const FAIL = 'That could not be saved right now. Nothing was changed.';

// --- the key: one server secret, a different derived key per member ---
function master(version: number): Buffer | null {
  const hex = version === 1 ? process.env.ARMORY_KEY || '' : '';
  return /^[0-9a-fA-F]{64}$/.test(hex) ? Buffer.from(hex, 'hex') : null;
}
export const armoryEnabled = (): boolean => master(KEY_VERSION) !== null;
export function memberKey(userId: string, version: number): Buffer {
  const m = master(version); if (!m) throw new Error('armory key missing');
  return Buffer.from(crypto.hkdfSync('sha256', m, Buffer.from(userId), Buffer.from(`fifs-armory-v${version}`), 32));
}
const aad = (userId: string, itemId: string, version: number) => Buffer.from(`armory|v${version}|${userId}|${itemId}`);

/** Layout of the stored text: base64 of  12-byte nonce | 16-byte tag | ciphertext. */
export function encryptItem(userId: string, itemId: string, data: ItemData, version = KEY_VERSION): string {
  return gcmSeal(memberKey(userId, version), aad(userId, itemId, version), Buffer.from(JSON.stringify(data), 'utf8')).toString('base64');
}
export function decryptItem(userId: string, itemId: string, payload: string, version = KEY_VERSION): ItemData {
  const raw = Buffer.from(payload, 'base64'); if (raw.length < 29) throw new Error('bad armory record');
  return JSON.parse(gcmOpen(memberKey(userId, version), aad(userId, itemId, version), raw, false).toString('utf8'));
}

// --- what a member may type ---
const clean = (v: unknown) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ').replace(/\r\n?/g, '\n').trim();
const validDay = (s: string) => DAY.test(s) && !Number.isNaN(Date.parse(s + 'T12:00:00Z')) && new Date(s + 'T12:00:00Z').toISOString().slice(0, 10) === s;
function field(v: unknown, max: number, label: string, required = false): { ok: true; value: string } | { ok: false; message: string } {
  const s = clean(v); if (required && !s) return { ok: false, message: `${label} is required.` }; if (s.length > max) return { ok: false, message: `${label} can be up to ${max} characters.` }; return { ok: true, value: s };
}
export function cleanItem(input: any, now: Date = new Date()): { ok: true; data: ItemData } | { ok: false; message: string } {
  const nick = field(input?.nickname, 40, 'The nickname', true); if (!nick.ok) return nick;
  const type = String(input?.type ?? 'handgun'); if (!(type in TYPES)) return { ok: false, message: 'Choose what kind of item this is.' };
  const make = field(input?.make, 60, 'The make'); if (!make.ok) return make; const model = field(input?.model, 60, 'The model'); if (!model.ok) return model;
  const cal = field(input?.caliber, 30, 'The caliber'); if (!cal.ok) return cal; const serial = field(input?.serial, 40, 'The serial number'); if (!serial.ok) return serial;
  const notes = field(input?.notes, 1000, 'Notes'); if (!notes.ok) return notes;
  const rawEvery = input?.serviceEveryMonths; let serviceEveryMonths: number | null = null;
  if (rawEvery !== '' && rawEvery !== null && rawEvery !== undefined) { const n = Number(rawEvery); if (!Number.isInteger(n) || n < 1 || n > 60) return { ok: false, message: 'The service interval must be a whole number of months from 1 to 60.' }; serviceEveryMonths = n; }
  const pon = clean(input?.purchasedOn); if (pon && (!validDay(pon) || pon < '1900-01-01' || pon > new Date(now.getTime() + 86400000).toISOString().slice(0, 10))) return { ok: false, message: 'The purchase date is not valid.' };
  let price: number | null = null; const praw = input?.price; if (praw !== '' && praw !== null && praw !== undefined) { const n = Number(String(praw).replace(/[$,\s]/g, '')); if (!Number.isFinite(n) || n < 0 || n > 1000000) return { ok: false, message: 'The price must be an amount from $0 to $1,000,000.' }; price = Math.round(n * 100) / 100; }
  const mIn = Array.isArray(input?.maintenance) ? input.maintenance : []; if (mIn.length > MAX_MAINTENANCE) return { ok: false, message: `A maintenance log can hold up to ${MAX_MAINTENANCE} entries.` };
  const maintenance: Maintenance[] = [];
  for (const m of mIn) {
    const on = clean(m?.on); if (!validDay(on) || on < '1900-01-01' || on > new Date(now.getTime() + 86400000).toISOString().slice(0, 10)) return { ok: false, message: 'A maintenance date is not valid.' };
    const kind = String(m?.kind ?? 'other'); if (!(kind in MAINT_KINDS)) return { ok: false, message: 'Choose a maintenance type.' };
    const note = field(m?.note, 200, 'A maintenance note'); if (!note.ok) return note;
    maintenance.push({ id: UUID.test(String(m?.id ?? '')) ? String(m.id) : crypto.randomUUID(), on, kind: kind as MaintKind, note: note.value });
  }
  const data: ItemData = { nickname: nick.value, type: type as ItemType, make: make.value, model: model.value, caliber: cal.value, serial: serial.value, purchasedOn: pon, price, notes: notes.value, maintenance, serviceEveryMonths };
  if (JSON.stringify(data).length > MAX_JSON) return { ok: false, message: 'That item is too long to store. Shorten the notes or the maintenance log.' };
  return { ok: true, data };
}

async function guard(sb: any, uid: string): Promise<AResult> {
  if (!armoryEnabled()) return { ok: false, status: 503, message: NOT_READY };
  try { return (await memberRole(sb, uid)) ? { ok: true } : { ok: false, status: 403, message: 'The armory is for students and clients.' }; }
  catch { return { ok: false, status: 503, message: 'The armory is unavailable right now. Please try again in a minute.' }; }
}

export async function armoryList(sb: any, uid: string): Promise<AResult<{ enabled: boolean; available: boolean; items: Item[] }>> {
  if (!armoryEnabled()) return { ok: true, enabled: false, available: false, items: [] };
  const g = await guard(sb, uid); if (!g.ok) return g;
  try {
    const r = await sb.from('armory_items').select('id, key_version, payload, created_at, updated_at').eq('user_id', uid).order('created_at', { ascending: true }).limit(MAX_ITEMS);
    if (r.error) return missingTable(r.error) ? { ok: true, enabled: true, available: false, items: [] } : { ok: false, status: 503, message: 'Could not load your armory right now.' };
    const items: Item[] = (r.data || []).map((row: any) => {
      try { return { id: String(row.id), createdAt: String(row.created_at || ''), updatedAt: String(row.updated_at || ''), ...decryptItem(uid, String(row.id), String(row.payload), Number(row.key_version) || 1) }; }
      catch { return { id: String(row.id), createdAt: String(row.created_at || ''), updatedAt: String(row.updated_at || ''), unreadable: true, nickname: 'Unreadable record', type: 'other' as ItemType, make: '', model: '', caliber: '', serial: '', purchasedOn: '', price: null, notes: '', maintenance: [] }; }
    });
    return { ok: true, enabled: true, available: true, items };
  } catch { return { ok: false, status: 503, message: 'Could not load your armory right now.' }; }
}

/** Add a new item (no id) or replace one of this person's own items (with its id). */
export async function armorySave(sb: any, uid: string, input: any, now: Date = new Date()): Promise<AResult<{ id: string }>> {
  const v = cleanItem(input, now); if (!v.ok) return { ok: false, status: 400, message: v.message };
  const g = await guard(sb, uid); if (!g.ok) return g;
  try {
    const existingId = input?.id ? String(input.id) : '';
    if (existingId) {
      if (!UUID.test(existingId)) return { ok: false, status: 400, message: 'That item could not be found.' };
      const f = await sb.from('armory_items').select('id').eq('id', existingId).eq('user_id', uid).maybeSingle();
      if (f.error) return { ok: false, status: 503, message: missingTable(f.error) ? NOT_READY : FAIL }; if (!f.data) return { ok: false, status: 404, message: 'That item could not be found.' };
      const up = await sb.from('armory_items').update({ payload: encryptItem(uid, existingId, v.data), key_version: KEY_VERSION, updated_at: now.toISOString() }).eq('id', existingId).eq('user_id', uid).select('id');
      return up.error || !Array.isArray(up.data) || !up.data.length ? { ok: false, status: 503, message: FAIL } : { ok: true, id: existingId };
    }
    const have = await sb.from('armory_items').select('id').eq('user_id', uid).limit(MAX_ITEMS + 1);
    if (have.error) return { ok: false, status: 503, message: missingTable(have.error) ? NOT_READY : FAIL };
    if ((have.data || []).length >= MAX_ITEMS) return { ok: false, status: 409, message: `You can keep up to ${MAX_ITEMS} items. Delete one or export your records first.` };
    const id = crypto.randomUUID();
    const ins = await sb.from('armory_items').insert({ id, user_id: uid, key_version: KEY_VERSION, payload: encryptItem(uid, id, v.data), created_at: now.toISOString(), updated_at: now.toISOString() });
    return ins.error ? { ok: false, status: 503, message: FAIL } : { ok: true, id };
  } catch { return { ok: false, status: 503, message: FAIL }; }
}

/** Does this item belong to this person? (Used by the photo code, so this file stays the only one that touches the armory table.) */
export async function armoryOwnsItem(sb: any, uid: string, itemId: string): Promise<AResult<{ owned: boolean }>> {
  try { const f = await sb.from('armory_items').select('id').eq('id', itemId).eq('user_id', uid).maybeSingle(); if (f.error) return { ok: false, status: 503, message: missingTable(f.error) ? NOT_READY : FAIL }; return { ok: true, owned: !!f.data }; }
  catch { return { ok: false, status: 503, message: FAIL }; }
}
export async function armoryDelete(sb: any, uid: string, id: unknown): Promise<AResult> {
  const itemId = String(id ?? ''); if (!UUID.test(itemId)) return { ok: false, status: 400, message: 'That item could not be found.' };
  const g = await guard(sb, uid); if (!g.ok) return g;
  try {
    const f = await sb.from('armory_items').select('id').eq('id', itemId).eq('user_id', uid).maybeSingle();
    if (f.error) return { ok: false, status: 503, message: missingTable(f.error) ? NOT_READY : FAIL }; if (!f.data) return { ok: false, status: 404, message: 'That item could not be found.' };
    const d = await sb.from('armory_items').delete().eq('id', itemId).eq('user_id', uid); return d.error ? { ok: false, status: 503, message: FAIL } : { ok: true };
  } catch { return { ok: false, status: 503, message: FAIL }; }
}
/** When staff permanently delete a person, their Armory records go too. Best effort, never throws, and no membership check (the person's record is already gone by then). Only that person's rows are touched. */
export async function armoryPurgeRows(sb: any, uid: unknown): Promise<void> {
  try { const id = String(uid ?? ''); if (!UUID.test(id)) return; await sb.from('armory_items').delete().eq('user_id', id); } catch { /* the rows are removed with the sign-in anyway */ }
}
export async function armoryDeleteAll(sb: any, uid: string): Promise<AResult> {
  const g = await guard(sb, uid); if (!g.ok) return g;
  try { const d = await sb.from('armory_items').delete().eq('user_id', uid); return d.error ? { ok: false, status: 503, message: missingTable(d.error) ? NOT_READY : FAIL } : { ok: true }; } catch { return { ok: false, status: 503, message: FAIL }; }
}
