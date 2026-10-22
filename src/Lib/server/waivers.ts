// The signed safety & liability waiver, one record per student (scripts/sql/20261024_student_waivers.sql). Server only; a student reaches only their own record.
// If the table has not been created yet the portal is never locked: status says "unavailable" and the waiver is not required until it can be saved.
import { staffSend } from './portal-chat';
export const WAIVER_VERSION = '2026';
export type WaiverStatus = { available: boolean; signed: boolean; signedAt?: string };
const missingTable = (e: any) => !!e && (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|schema cache/i.test(String(e.message || '')));
const clean = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

export async function waiverStatus(supabase: any, studentId: string): Promise<WaiverStatus> {
  try {
    const r = await supabase.from('student_waivers').select('signed_at').eq('student_id', studentId).maybeSingle();
    if (r.error) {
      if (!missingTable(r.error)) console.warn('[Waiver] status unavailable:', r.error.code || 'no code');
      return { available: false, signed: false };
    }
    return r.data ? { available: true, signed: true, signedAt: String(r.data.signed_at || '') } : { available: true, signed: false };
  } catch { return { available: false, signed: false }; }
}

export type WaiverInput = { studentName?: unknown; studentPhone?: unknown; studentEmail?: unknown; emergencyContact?: unknown; emergencyRelation?: unknown; emergencyPhone?: unknown; initials?: unknown; signature?: unknown; under18?: unknown };
export async function saveWaiver(supabase: any, studentId: string, w: WaiverInput): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const signedName = clean(w.studentName, 100), signature = clean(w.signature, 100), initials = clean(w.initials, 6), emName = clean(w.emergencyContact, 100), emPhone = clean(w.emergencyPhone, 30);
  if (!signedName || !signature || !initials || !emName || !emPhone) return { ok: false, status: 400, error: 'Please fill in your name, initials, signature and emergency contact.' };
  const row = { student_id: studentId, signed_name: signedName, initials, signature, emergency_name: emName, emergency_relation: clean(w.emergencyRelation, 60) || null, emergency_phone: emPhone, phone: clean(w.studentPhone, 30) || null, email: clean(w.studentEmail, 150) || null, under_18: w.under18 === true, waiver_version: WAIVER_VERSION, signed_at: new Date().toISOString() };
  try {
    const r = await supabase.from('student_waivers').upsert(row, { onConflict: 'student_id' });
    if (r.error) return { ok: false, status: 503, error: 'Your waiver could not be saved right now, so it was NOT recorded. Please try again or call 443-990-1304.' };
    return { ok: true };
  } catch { return { ok: false, status: 503, error: 'Your waiver could not be saved right now, so it was NOT recorded. Please try again or call 443-990-1304.' }; }
}

// ---- Staff view. The Admin Hub lists who has signed and opens one signed waiver, read only. The route checks the staff role before calling these; they never write. ----
export type WaiverSummary = { studentId: string; signedName: string; signedAt: string; version: string };
export type WaiverRecord = WaiverSummary & { initials: string; signature: string; emergencyName: string; emergencyRelation: string; emergencyPhone: string; phone: string; email: string; under18: boolean };
const summary = (r: any): WaiverSummary => ({ studentId: String(r.student_id || ''), signedName: String(r.signed_name || ''), signedAt: String(r.signed_at || ''), version: String(r.waiver_version || '') });

export async function listWaivers(supabase: any): Promise<{ ok: true; available: boolean; waivers: WaiverSummary[] } | { ok: false; status: number; message: string }> {
  try {
    const r = await supabase.from('student_waivers').select('student_id, signed_name, signed_at, waiver_version').order('signed_at', { ascending: false }).limit(2000);
    if (r.error) { if (missingTable(r.error)) return { ok: true, available: false, waivers: [] }; return { ok: false, status: 503, message: 'Waivers could not be loaded right now.' }; }
    return { ok: true, available: true, waivers: (r.data || []).map(summary) };
  } catch { return { ok: false, status: 503, message: 'Waivers could not be loaded right now.' }; }
}

export async function getWaiver(supabase: any, studentId: unknown): Promise<{ ok: true; waiver: WaiverRecord | null } | { ok: false; status: number; message: string }> {
  const id = clean(studentId, 80); if (!id) return { ok: false, status: 400, message: 'Choose a student first.' };
  try {
    const r = await supabase.from('student_waivers').select('*').eq('student_id', id).maybeSingle();
    if (r.error) return { ok: false, status: 503, message: 'This waiver could not be loaded right now.' };
    if (!r.data) return { ok: true, waiver: null };
    const d = r.data;
    return { ok: true, waiver: { ...summary(d), initials: String(d.initials || ''), signature: String(d.signature || ''), emergencyName: String(d.emergency_name || ''), emergencyRelation: String(d.emergency_relation || ''), emergencyPhone: String(d.emergency_phone || ''), phone: String(d.phone || ''), email: String(d.email || ''), under18: d.under_18 === true } };
  } catch { return { ok: false, status: 503, message: 'This waiver could not be loaded right now.' }; }
}

// ---- Staff: remind a student to sign. One tap in the Admin Hub sends a short note into that student's portal chat (and, when they have phone alerts on, the usual generic "New message from Kai"
// alert, which never shows the text). Staff only; the route checks the role first. Never more than one reminder per student per 24 hours. The text is fixed: it carries no names or details. ----
export const REMIND_PREFIX = '✍️ Waiver reminder:';
export const REMIND_TEXT = `${REMIND_PREFIX} please complete your safety waiver before class. Open your Student Portal and tap "Complete Digital Waiver". It takes about two minutes. Thank you! - Kai`;
export const REMIND_EVERY_MS = 24 * 3600 * 1000;
export type RemindResult =
  | { ok: true; sent: false; reason: 'signed' }
  | { ok: true; sent: false; reason: 'recent'; at: string }
  | { ok: true; sent: true; pushed: boolean; held: boolean }
  | { ok: false; status: number; message: string };

export async function remindToSignWaiver(supabase: any, studentId: unknown, now: Date = new Date()): Promise<RemindResult> {
  const id = clean(studentId, 80); if (!id) return { ok: false, status: 400, message: 'Choose a student first.' };
  const FAIL = { ok: false as const, status: 503, message: 'The reminder could not be sent right now. Nothing was sent.' };
  let student: any;
  try { const r = await supabase.from('students').select('student_id, user_id').eq('student_id', id).maybeSingle(); if (r.error) return FAIL; student = r.data; } catch { return FAIL; }
  if (!student) return { ok: false, status: 404, message: 'That student was not found.' };
  const st = await waiverStatus(supabase, id);
  if (!st.available) return { ok: false, status: 409, message: 'Waiver records are not set up yet, so no waiver is required right now.' };
  if (st.signed) return { ok: true, sent: false, reason: 'signed' };
  if (!student.user_id) return { ok: false, status: 409, message: 'This student has not set up their portal login yet, so there is nowhere to send a reminder. Please email or call them.' };
  const since = new Date(now.getTime() - REMIND_EVERY_MS).toISOString();
  try {
    const r = await supabase.from('portal_messages').select('created_at').eq('member_user_id', String(student.user_id)).eq('sender', 'staff').like('body', REMIND_PREFIX + '%').gte('created_at', since).order('created_at', { ascending: false }).limit(1);
    if (r.error) return FAIL; if (Array.isArray(r.data) && r.data.length) return { ok: true, sent: false, reason: 'recent', at: String(r.data[0].created_at) };
  } catch { return FAIL; }
  const sent = await staffSend(supabase, String(student.user_id), REMIND_TEXT, now);
  if (!sent.ok) return { ok: false, status: sent.status, message: sent.error };
  return { ok: true, sent: true, pushed: sent.pushed, held: sent.held };
}
