// Staff access log (table: scripts/sql/20261030_staff_access_log.sql). Records WHO on the staff opened the waiver list, opened one student's waiver, or sent a waiver reminder, and WHEN.
// It never stores what a waiver says, a password, or anything from the Armory. Writing is best-effort: if the log cannot be written (or the table is not set up yet) the staff action still goes through.
// Only the administrator can read it (the route checks the role); entries older than 12 months are removed whenever it is read.
export const LOG_ACTIONS = { waiver_list: 'Opened the waiver list', waiver_view: 'Opened a student\'s waiver', waiver_remind: 'Sent a waiver reminder' } as const;
export type LogAction = keyof typeof LOG_ACTIONS;
export const KEEP_MONTHS = 12, LIST_LIMIT = 200;
export interface LogEntry { id: string; at: string; staff: string; action: LogAction; actionLabel: string; studentId: string; outcome: string }

const OUTCOME = /^[a-z_]{1,40}$/;
const cut = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);

/** Best-effort: never throws, never blocks the staff action. */
export async function logStaffAccess(sb: any, e: { staffId?: unknown; staffLabel?: unknown; action: LogAction; studentId?: unknown; outcome?: string }): Promise<void> {
  try {
    if (!(e.action in LOG_ACTIONS)) return;
    const uid = String(e.staffId ?? ''); const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid);
    await sb.from('staff_access_log').insert({ staff_user_id: isUuid ? uid : null, staff_label: cut(e.staffLabel, 120) || null, action: e.action, student_id: cut(e.studentId, 80) || null, outcome: OUTCOME.test(e.outcome || '') ? e.outcome : 'ok' });
  } catch { /* the staff action must never fail because the log could not be written */ }
}

/** The outcome word for a finished waiver action, never anything the waiver contains. */
export function outcomeOf(r: any): string {
  if (!r || r.ok === false) return 'failed';
  if (r.sent === true) return 'sent';
  if (r.sent === false) return r.reason === 'signed' ? 'already_signed' : r.reason === 'recent' ? 'too_soon' : 'not_sent';
  return 'ok';
}

export async function listAccessLog(sb: any, now: Date = new Date()): Promise<{ ok: true; available: boolean; entries: LogEntry[]; keepMonths: number } | { ok: false; status: number; message: string }> {
  try {
    const cutoff = new Date(now.getTime()); cutoff.setUTCMonth(cutoff.getUTCMonth() - KEEP_MONTHS);
    try { await sb.from('staff_access_log').delete().lt('at', cutoff.toISOString()); } catch { /* clearing old entries is best-effort */ }
    const r = await sb.from('staff_access_log').select('id, at, staff_label, action, student_id, outcome').order('at', { ascending: false }).limit(LIST_LIMIT);
    if (r.error) { if (r.error.code === '42P01' || r.error.code === 'PGRST205' || /does not exist|schema cache/i.test(String(r.error.message || ''))) return { ok: true, available: false, entries: [], keepMonths: KEEP_MONTHS }; return { ok: false, status: 503, message: 'The access log could not be loaded right now.' }; }
    const entries = (r.data || []).filter((x: any) => x.action in LOG_ACTIONS).map((x: any): LogEntry => ({ id: String(x.id), at: String(x.at), staff: String(x.staff_label || 'staff'), action: x.action, actionLabel: LOG_ACTIONS[x.action as LogAction], studentId: String(x.student_id || ''), outcome: String(x.outcome || 'ok') }));
    return { ok: true, available: true, entries, keepMonths: KEEP_MONTHS };
  } catch { return { ok: false, status: 503, message: 'The access log could not be loaded right now.' }; }
}
