// The safe-storage checklist: HABITS only (what to do), taken from the Maryland Department of Health "Safe and Secure Storage for Firearm Owners" handout (checked 2026-10-22).
// It never asks where a firearm, ammunition or key is kept. Ticks are saved on this device only, under one key; nothing is sent or stored on the server.
export const CHECKED = '2026-10-22';
export const STORAGE_KEY = 'fifs-storage-checklist-v1';
export const SOURCE = { label: 'Maryland Department of Health, Office of Suicide Prevention (its safe storage handout)', url: 'https://health.maryland.gov/bha/suicideprevention/Pages/home.aspx', checked: CHECKED };
export const ITEMS: readonly { id: string; text: string; why: string }[] = [
  { id: 'unloaded', text: 'Store and lock firearms unloaded.', why: 'An unloaded, locked firearm is much harder to use by mistake or by someone else.' },
  { id: 'ammo-separate', text: 'Store and lock ammunition separately from firearms.', why: 'Separating them makes a quick, unsafe use much harder.' },
  { id: 'keys', text: 'Keep keys and combinations away from anyone in the household who may be in crisis.', why: 'Access is the main barrier. Keys and combinations need the same care as the firearm.' },
  { id: 'crisis-removal', text: 'If someone in the home is in crisis, remove firearms from the home for now.', why: 'Taking firearms out of the home for a while is one of the most effective steps.' },
  { id: 'vehicles', text: 'Do not leave firearms unattended in a vehicle.', why: 'Vehicles are a common target for theft.' },
  { id: 'locking-device', text: 'Use a locking device that fits your firearms: a cable lock, trigger lock, lock box or safe.', why: 'A trigger lock does not stop a loaded firearm from being fired, so never use one on a loaded firearm.' },
  { id: 'regular-check', text: 'Check your locks and keys on a regular schedule.', why: 'A lock you have forgotten about is no barrier at all.' },
];
export const LEGAL_LINE = 'This checklist is a set of habits, not legal advice. Follow the law where you live and the manufacturer’s instructions for your locks.';
export function readTicks(store: { getItem(k: string): string | null } | null): Record<string, boolean> {
  try { if (!store) return {}; const raw = store.getItem(STORAGE_KEY); const v = raw ? JSON.parse(raw) : {}; const out: Record<string, boolean> = {}; for (const i of ITEMS) out[i.id] = v && v[i.id] === true; return out; } catch { return {}; }
}
export function writeTicks(store: { setItem(k: string, v: string): void } | null, ticks: Record<string, boolean>): boolean {
  try { if (!store) return false; const clean: Record<string, boolean> = {}; for (const i of ITEMS) clean[i.id] = ticks[i.id] === true; store.setItem(STORAGE_KEY, JSON.stringify(clean)); return true; } catch { return false; }
}
export const doneCount = (t: Record<string, boolean>): number => ITEMS.filter((i) => t[i.id]).length;
