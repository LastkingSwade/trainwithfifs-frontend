// The signed safety & liability waiver, one record per student (scripts/sql/20261024_student_waivers.sql). Server only; a student reaches only their own record.
// If the table has not been created yet the portal is never locked: status says "unavailable" and the waiver is not required until it can be saved.
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
