// Armory screen helpers: pure functions (no browser needed) for what is shown, masked and exported. The records themselves are decrypted by the server for their owner only.
import { csvCell } from './rangeLogic';
export type ItemType = 'handgun' | 'rifle' | 'shotgun' | 'other';
export type MaintKind = 'cleaning' | 'inspection' | 'repair' | 'parts' | 'other';
export interface Maint { id: string; on: string; kind: MaintKind; note: string }
export interface AItem { id: string; nickname: string; type: ItemType; make: string; model: string; caliber: string; serial: string; purchasedOn: string; price: number | null; notes: string; maintenance: Maint[]; unreadable?: boolean }

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
