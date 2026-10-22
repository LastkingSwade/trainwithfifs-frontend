// Armory screen helpers: pure functions (no browser needed) for what is shown, masked and exported. The records themselves are decrypted by the server for their owner only.
import { csvCell } from './rangeLogic';
export type ItemType = 'handgun' | 'rifle' | 'shotgun' | 'other';
export type MaintKind = 'cleaning' | 'inspection' | 'repair' | 'parts' | 'other';
export interface Maint { id: string; on: string; kind: MaintKind; note: string }
export interface AItem { id: string; nickname: string; type: ItemType; make: string; model: string; caliber: string; serial: string; purchasedOn: string; price: number | null; notes: string; maintenance: Maint[]; unreadable?: boolean; serviceEveryMonths?: number | null }

export const TYPE_INFO: Record<ItemType, { label: string; emoji: string }> = { handgun: { label: 'Handgun', emoji: '🔫' }, rifle: { label: 'Rifle', emoji: '🎯' }, shotgun: { label: 'Shotgun', emoji: '🦆' }, other: { label: 'Other equipment', emoji: '🧰' } };
export const MAINT_LABEL: Record<MaintKind, string> = { cleaning: 'Cleaning', inspection: 'Inspection', repair: 'Repair', parts: 'Parts or upgrade', other: 'Other' };

/** The serial number is hidden until the person taps "Show": dots of the same length (capped), never a partial reveal. */
export const maskSerial = (serial: string): string => (serial ? '•'.repeat(Math.min(12, Math.max(6, serial.length))) : '');
export const money = (n: number | null): string => (n === null || n === undefined ? '' : '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
export function lastService(item: Pick<AItem, 'maintenance'>): string | null { let last: string | null = null; for (const m of item.maintenance || []) if (!last || m.on > last) last = m.on; return last; }
export function describe(item: Pick<AItem, 'make' | 'model' | 'caliber'>): string { return [item.make, item.model, item.caliber].filter(Boolean).join(' · '); }
/** Items matching a search word (name, make, model, caliber, type); the serial number is NOT searched, so a typed word can never reveal it. */
export function filterItems(items: readonly AItem[], q: string): AItem[] {
  const w = q.trim().toLowerCase(); if (!w) return items.slice();
  return items.filter((i) => [i.nickname, i.make, i.model, i.caliber, TYPE_INFO[i.type]?.label].some((v) => String(v || '').toLowerCase().includes(w)));
}

/** The member's own export (opens in a spreadsheet; useful for insurance). Cells that could run as a formula are neutralised. */
export function toCsv(items: readonly AItem[]): string {
  const rows = [['Nickname', 'Type', 'Make', 'Model', 'Caliber', 'Serial number', 'Purchased', 'Price', 'Notes'].join(',')];
  for (const i of items) if (!i.unreadable) rows.push([i.nickname, TYPE_INFO[i.type]?.label, i.make, i.model, i.caliber, i.serial, i.purchasedOn, i.price === null ? '' : i.price.toFixed(2), i.notes].map(csvCell).join(','));
  rows.push('', 'Maintenance', ['Item', 'Date', 'Type', 'Note'].join(','));
  for (const i of items) if (!i.unreadable) for (const m of i.maintenance) rows.push([i.nickname, m.on, MAINT_LABEL[m.kind], m.note].map(csvCell).join(','));
  return rows.join('\n') + '\n';
}

// --- service reminders (in the app only: shown when the Armory opens; nothing is pushed or sent) ---
const iso = (y: number, m: number, d: number): string => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
/** The date a given number of months after an ISO day, on the same day of the month or the last day of a shorter month. */
export function addMonths(day: string, months: number): string {
  const [y, m, d] = day.split('-').map(Number); const total = y * 12 + (m - 1) + months; const ny = Math.floor(total / 12); const nm = (total % 12) + 1;
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate(); return iso(ny, nm, Math.min(d, last));
}
export interface Reminder { state: 'none' | 'ok' | 'soon' | 'due'; dueOn: string | null; days: number | null }
/** When the next service is due: interval after the last service (or after purchase if never serviced). Within 30 days is "soon"; past is "due". */
export function reminderFor(item: Pick<AItem, 'maintenance' | 'purchasedOn' | 'serviceEveryMonths'>, today: string): Reminder {
  const every = item.serviceEveryMonths; const base = lastService(item as AItem) || item.purchasedOn || '';
  if (!every || !/^\d{4}-\d{2}-\d{2}$/.test(base) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return { state: 'none', dueOn: null, days: null };
  const dueOn = addMonths(base, every); const days = Math.round((Date.parse(dueOn + 'T12:00:00Z') - Date.parse(today + 'T12:00:00Z')) / 86400000);
  return { state: days < 0 ? 'due' : days <= 30 ? 'soon' : 'ok', dueOn, days };
}
export function reminderText(r: Reminder): string {
  if (r.state === 'none') return '';
  if (r.state === 'due') return `Service due since ${r.dueOn}`;
  if (r.state === 'soon') return `Service due ${r.dueOn} (in ${r.days} day${r.days === 1 ? '' : 's'})`;
  return `Next service ${r.dueOn}`;
}
