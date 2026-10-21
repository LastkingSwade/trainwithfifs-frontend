// Range journal: the numbers and the export. Pure functions (no browser needed), so the totals, the monthly chart and the CSV can be tested exactly.
export interface Session { id: string; on: string; range: string | null; rounds: number; focus: string | null; score: string | null; notes: string | null }
export interface Goal { id: string; goal: string; targetOn: string | null; doneAt: string | null }

export interface Totals { sessions: number; rounds: number; avg: number; last: string | null; thisMonth: number }
/** Totals across every session. `avg` is whole rounds per session; `thisMonth` counts sessions in the current calendar month. */
export function totals(sessions: readonly Session[], now: Date = new Date()): Totals {
  const month = monthKey(now); let rounds = 0; let last: string | null = null; let thisMonth = 0;
  for (const s of sessions) { rounds += Number(s.rounds) || 0; if (!last || s.on > last) last = s.on; if (s.on.slice(0, 7) === month) thisMonth += 1; }
  return { sessions: sessions.length, rounds, avg: sessions.length ? Math.round(rounds / sessions.length) : 0, last, thisMonth };
}

export const monthKey = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export interface Bucket { key: string; label: string; rounds: number; sessions: number }
/** The last `months` calendar months ending with the current one, oldest first, each with its rounds and session count (empty months show as zero). */
export function monthlySeries(sessions: readonly Session[], now: Date = new Date(), months = 6): Bucket[] {
  const out: Bucket[] = [];
  for (let i = months - 1; i >= 0; i -= 1) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); out.push({ key: monthKey(d), label: MONTHS[d.getMonth()], rounds: 0, sessions: 0 }); }
  const by = new Map(out.map((b) => [b.key, b] as const));
  for (const s of sessions) { const b = by.get(s.on.slice(0, 7)); if (b) { b.rounds += Number(s.rounds) || 0; b.sessions += 1; } }
  return out;
}
/** Bar height as a whole percent of the busiest month (never below 4% when there is something to show, so a small month is still visible). */
export const barPct = (value: number, max: number): number => (max > 0 && value > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0);

/** Today as YYYY-MM-DD in the person's own timezone (not UTC, so an evening session is not dated tomorrow). */
export const todayISO = (d: Date = new Date()): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function prettyDay(iso: string | null | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''; const t = new Date(iso + 'T12:00:00Z'); return Number.isNaN(t.getTime()) ? '' : t.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
}

// --- the export (CSV the person can open in a spreadsheet) ---
/** A cell that starts with = + - @ would run as a formula in a spreadsheet, so it gets a leading apostrophe; quotes are doubled. */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
export function toCsv(sessions: readonly Session[], goals: readonly Goal[]): string {
  const rows: string[] = ['Sessions', ['Date', 'Range', 'Rounds', 'Focus', 'Score', 'Notes'].join(',')];
  for (const s of sessions) rows.push([s.on, s.range, s.rounds, s.focus, s.score, s.notes].map(csvCell).join(','));
  rows.push('', 'Goals', ['Goal', 'Target date', 'Finished'].join(','));
  for (const g of goals) rows.push([g.goal, g.targetOn, g.doneAt ? g.doneAt.slice(0, 10) : ''].map(csvCell).join(','));
  return rows.join('\n') + '\n';
}
export const PRESET_FOCUS = ['Accuracy', 'Draw and presentation', 'Reloads', 'Malfunction drills', 'Low-light', 'Qualification practice'] as const;
