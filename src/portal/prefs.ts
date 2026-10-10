// Remembered preferences, kept only in this browser (localStorage). A short allow-list of harmless choices: never a name, email, id or anything
// typed into a search box. Every read and write is wrapped, so a blocked or full browser store simply means nothing is remembered.
const KEY = 'fifs.prefs.v1';
export const PREF_VALUES = { paymentsFilter: ['all', 'PAID', 'DEPOSIT_PAID', 'PENDING', 'ABANDONED', 'CANCELLED'] } as const;
export type PrefName = keyof typeof PREF_VALUES;

function readAll(): Record<string, string> {
  try { const raw = window.localStorage.getItem(KEY); const o = raw ? JSON.parse(raw) : {}; return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch { return {}; }
}
export function getPref(name: PrefName, fallback: string): string {
  const v = readAll()[name];
  return typeof v === 'string' && (PREF_VALUES[name] as readonly string[]).includes(v) ? v : fallback;
}
export function setPref(name: PrefName, value: string): void {
  try { if (!(PREF_VALUES[name] as readonly string[]).includes(value)) return; window.localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [name]: value })); } catch { /* nothing is remembered */ }
}
export function clearPrefs(): void { try { window.localStorage.removeItem(KEY); } catch { /* ignore */ } }
