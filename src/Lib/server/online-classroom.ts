import { getPrivilegedClient } from '@/Lib/server/supabase-admin';
import { ONLINE_ELIGIBLE_KEYS, ONLINE_PREMIUM_RATE, onlineEligible } from '@/Lib/pricing';

// Live Online Classroom rules, all enforced here on the server. The browser only guides the form.
//  - the classroom is taught live over video; Day 2 (hands-on range day) is always in person
//  - online bookings use the same calendar as in-person bookings: Day 1 = live online classroom, Day 2 = in-person range day
//  - THE DAY RULE: every calendar day is a web day or an in-person day, decided by whoever books it first. Day 1 of an online
//    booking claims its date as a web day; every other date (an online Day 2 and both dates of an in-person booking) claims its date
//    as an in-person day. A claim for the other kind is refused.
// Database trouble fails safe: online bookings are refused; ordinary in-person bookings still go through (and the problem is logged).

export { DAY2_ACK_TEXT, DAY2_STATEMENT } from '@/online/onlineCopy';

export type DayMode = 'online' | 'in_person';
export interface DayClaim { day: string; mode: DayMode; role: 'day1' | 'day2' }

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
export const todayET = (now: Date = new Date()): string => now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
export function validDay(s: unknown): s is string {
  const m = DAY_RE.exec(String(s ?? ''));
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}
export const prettyDay = (day: string): string => new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

/** What the browser needs to know: the fee rate and which classes can be taken online. No database, always on. */
export function getOnlineOptions(): { premiumRate: number; eligible: string[] } { return { premiumRate: ONLINE_PREMIUM_RATE, eligible: [...ONLINE_ELIGIBLE_KEYS] }; }

export type OnlinePlan = { ok: true; day1: string; day2: string } | { ok: false; status: number; message: string };
/** Checks everything about an online request that needs no database. */
export function planOnlineBooking(courseSelection: string, sel: { day1?: unknown; day2?: unknown; ack?: unknown }, now: Date = new Date()): OnlinePlan {
  if (!onlineEligible(courseSelection)) return { ok: false, status: 400, message: 'The live online classroom is not offered for this class.' };
  if (!(sel.ack === true || sel.ack === 'true')) return { ok: false, status: 400, message: 'Please confirm that Day 2 is mandatory, in person, at the range.' };
  const day1 = String(sel.day1 ?? ''), day2 = String(sel.day2 ?? '');
  if (!validDay(day1)) return { ok: false, status: 400, message: 'Please choose Day 1 (your live online classroom day) on the calendar.' };
  if (!validDay(day2)) return { ok: false, status: 400, message: 'Please choose Day 2 (your in-person range day) on the calendar. It is required.' };
  if (day1 >= day2) return { ok: false, status: 400, message: 'Day 2 (the in-person range day) must come after Day 1 (the live online classroom day).' };
  if (day1 < todayET(now)) return { ok: false, status: 400, message: 'Please choose dates that have not passed.' };
  return { ok: true, day1, day2 };
}

/** The days an ordinary in-person booking claims (best effort: an unreadable date is simply not claimed). */
export function inPersonClaims(sel: { day1?: unknown; day2?: unknown }, now: Date = new Date()): DayClaim[] {
  const out: DayClaim[] = [];
  if (validDay(sel.day1) && sel.day1 >= todayET(now)) out.push({ day: sel.day1, mode: 'in_person', role: 'day1' });
  if (validDay(sel.day2) && sel.day2 >= todayET(now) && sel.day2 !== sel.day1) out.push({ day: sel.day2, mode: 'in_person', role: 'day2' });
  return out;
}
export function onlineClaims(plan: { day1: string; day2: string }): DayClaim[] { return [{ day: plan.day1, mode: 'online', role: 'day1' }, { day: plan.day2, mode: 'in_person', role: 'day2' }]; }

export async function releaseDayClaims(invoiceNumber: unknown, supabase: any = getPrivilegedClient()): Promise<void> {
  try {
    if (!invoiceNumber) return;
    const { error } = await supabase.rpc('release_day_claims', { p_invoice: String(invoiceNumber) });
    if (error) console.warn('[Days] Release failed:', error.code || 'no code');
  } catch (err: any) { console.warn('[Days] Release unavailable:', err?.message); }
}

/**
 * Claims each day for the booking. If any day belongs to the other kind, nothing stays held and a plain message says which day.
 * strict=true (online bookings): a database problem refuses the booking. strict=false (in-person): a database problem is logged and the booking goes on.
 */
export async function claimBookingDays(supabase: any, invoiceNumber: string, claims: DayClaim[], strict: boolean): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  if (!claims.length) return { ok: true };
  try {
    for (const c of claims) {
      const r = await supabase.rpc('claim_day_mode', { p_invoice: invoiceNumber, p_day: c.day, p_mode: c.mode, p_role: c.role });
      if (r.error) {
        console.warn('[Days] Claim unavailable:', r.error.code || 'no code', r.error.message);
        await releaseDayClaims(invoiceNumber, supabase);
        return strict ? { ok: false, status: 503, message: 'Dates are temporarily unavailable. Please try again in a few minutes.' } : { ok: true };
      }
      if (r.data !== true) {
        await releaseDayClaims(invoiceNumber, supabase);
        const pretty = prettyDay(c.day);
        return c.mode === 'online'
          ? { ok: false, status: 409, message: `${pretty} is already an in-person day, so it cannot be a live online classroom day. Please choose a different Day 1.` }
          : { ok: false, status: 409, message: `${pretty} is already a live online classroom day, so it cannot be an in-person day. Please choose a different date.` };
      }
    }
    return { ok: true };
  } catch (err: any) {
    console.warn('[Days] Claim error:', err?.message);
    await releaseDayClaims(invoiceNumber, supabase);
    return strict ? { ok: false, status: 503, message: 'Dates are temporarily unavailable. Please try again in a few minutes.' } : { ok: true };
  }
}

/** Public: which days in a range are web days or in-person days right now. Returns only dates and kinds. */
export async function getDayModes(supabase: any, from: unknown, to: unknown): Promise<Record<string, DayMode>> {
  try {
    if (!validDay(from) || !validDay(to) || to < from) return {};
    const span = (Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000;
    if (span > 460) return {};
    const { data, error } = await supabase.rpc('day_modes', { p_from: from, p_to: to });
    if (error || !Array.isArray(data)) return {};
    const out: Record<string, DayMode> = {};
    for (const r of data) if (validDay(r.day) && (r.mode === 'online' || r.mode === 'in_person')) out[r.day] = r.mode;
    return out;
  } catch (err: any) { console.warn('[Days] Modes unavailable:', err?.message); return {}; }
}

// ---------------------------------------------------------------------------------------------------------------------------
// Admin and student sides. The route checks WHO is asking before calling any of these.
// ---------------------------------------------------------------------------------------------------------------------------
const PAID = ['PAID', 'DEPOSIT_PAID'];
export type AdminResult<T = {}> = ({ ok: true } & T) | { ok: false; status: number; message: string };
const isLive = (status: unknown, createdAt: unknown, now: number) => PAID.includes(String(status)) || (String(status) === 'PENDING' && now - Date.parse(String(createdAt)) < 2 * 3600 * 1000);

export interface AdminDay { day: string; mode: DayMode; bookings: number; attended: number; meetingUrl: string }
export async function adminOnlineOverview(supabase: any): Promise<AdminResult<{ days: AdminDay[] }>> {
  try {
    const from = new Date(Date.now() - 14 * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const claims = await supabase.from('day_claims').select('invoice_number, day, mode, role, attended_at, created_at').gte('day', from).order('day', { ascending: true });
    const links = await supabase.from('online_days').select('day, meeting_url').gte('day', from);
    if (claims.error || links.error) return { ok: false, status: 503, message: 'The day tables are not set up yet. Run the database script first.' };
    const nums = Array.from(new Set((claims.data || []).map((c: any) => String(c.invoice_number))));
    const inv = nums.length ? await supabase.from('invoices').select('invoice_number, status').in('invoice_number', nums) : { data: [] };
    const status = new Map<string, string>((inv.data || []).map((r: any) => [String(r.invoice_number), String(r.status)]));
    const now = Date.now(); const byDay = new Map<string, AdminDay>();
    for (const c of (claims.data || [])) {
      if (!isLive(status.get(String(c.invoice_number)) ?? '__none__', c.created_at, now) && status.get(String(c.invoice_number)) !== undefined) continue;
      const d = byDay.get(String(c.day)) || { day: String(c.day), mode: c.mode as DayMode, bookings: 0, attended: 0, meetingUrl: '' };
      d.bookings += 1; if (c.attended_at) d.attended += 1; byDay.set(String(c.day), d);
    }
    for (const l of (links.data || [])) { const d = byDay.get(String(l.day)) || { day: String(l.day), mode: 'online' as DayMode, bookings: 0, attended: 0, meetingUrl: '' }; d.meetingUrl = l.meeting_url || ''; byDay.set(String(l.day), d); }
    return { ok: true, days: Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day)) };
  } catch (err: any) { console.warn('[Online admin] overview:', err?.message); return { ok: false, status: 503, message: 'Could not load the online days.' }; }
}

export async function adminSetMeetingLink(supabase: any, day: unknown, url: unknown): Promise<AdminResult> {
  if (!validDay(day)) return { ok: false, status: 400, message: 'Choose a valid date.' };
  const link = String(url ?? '').trim();
  if (link && !/^https:\/\/[^\s<>"']{4,480}$/.test(link)) return { ok: false, status: 400, message: 'The meeting link must start with https://.' };
  try {
    const { error } = await supabase.from('online_days').upsert({ day, meeting_url: link || null, updated_at: new Date().toISOString() }, { onConflict: 'day' });
    if (error) return { ok: false, status: 503, message: 'Could not save the link. The day tables may not be set up yet.' };
    return { ok: true };
  } catch { return { ok: false, status: 503, message: 'Could not save the link.' }; }
}

export async function adminDayRoster(supabase: any, day: unknown): Promise<AdminResult<{ people: Array<{ invoiceNumber: string; email: string; status: string; role: string; attendedAt: string | null }> }>> {
  if (!validDay(day)) return { ok: false, status: 400, message: 'Choose a valid date.' };
  try {
    const c = await supabase.from('day_claims').select('invoice_number, role, attended_at').eq('day', day);
    if (c.error) return { ok: false, status: 503, message: 'Could not load the roster.' };
    const nums = (c.data || []).map((e: any) => String(e.invoice_number));
    const inv = nums.length ? await supabase.from('invoices').select('invoice_number, email, status').in('invoice_number', nums) : { data: [] };
    const by = new Map<string, any>((inv.data || []).map((r: any) => [String(r.invoice_number), r]));
    return { ok: true, people: (c.data || []).map((e: any) => ({ invoiceNumber: String(e.invoice_number), email: String(by.get(String(e.invoice_number))?.email || ''), status: String(by.get(String(e.invoice_number))?.status || ''), role: String(e.role), attendedAt: e.attended_at || null })) };
  } catch { return { ok: false, status: 503, message: 'Could not load the roster.' }; }
}

export async function adminMarkAttendance(supabase: any, invoiceNumber: unknown, day: unknown, attended: unknown, markedBy: string): Promise<AdminResult> {
  const inv = String(invoiceNumber ?? '').trim();
  if (!/^INV-[A-Za-z0-9-]{3,40}$/.test(inv) || !validDay(day) || typeof attended !== 'boolean') return { ok: false, status: 400, message: 'Choose a person, a day and whether they attended.' };
  try {
    const { data, error } = await supabase.from('day_claims').update({ attended_at: attended ? new Date().toISOString() : null, marked_by: attended ? String(markedBy).slice(0, 120) : null }).eq('invoice_number', inv).eq('day', day).select('invoice_number');
    if (error) return { ok: false, status: 503, message: 'Could not save attendance.' };
    if (!Array.isArray(data) || data.length === 0) return { ok: false, status: 404, message: 'That person is not booked on this day.' };
    return { ok: true };
  } catch { return { ok: false, status: 503, message: 'Could not save attendance.' }; }
}

export interface StudentOnlineClass { invoiceNumber: string; day1: { day: string; meetingUrl: string; attended: boolean } | null; day2: { day: string; attended: boolean } | null; day2Attended: boolean }
/** Live-online bookings of ONE student (found by the verified student id), only once paid. The join link is returned only for paid bookings. */
export async function studentOnlineClasses(supabase: any, studentId: string): Promise<StudentOnlineClass[]> {
  try {
    const inv = await supabase.from('invoices').select('invoice_number, status, delivery').eq('student_id', studentId).eq('delivery', 'live_online');
    if (inv.error || !Array.isArray(inv.data)) return [];
    const paid = inv.data.filter((r: any) => PAID.includes(String(r.status))).map((r: any) => String(r.invoice_number));
    if (!paid.length) return [];
    const cl = await supabase.from('day_claims').select('invoice_number, day, role, attended_at').in('invoice_number', paid);
    const claims: any[] = cl.error || !Array.isArray(cl.data) ? [] : cl.data;
    const days = Array.from(new Set(claims.filter((c) => c.role === 'day1').map((c) => String(c.day))));
    const lk = days.length ? await supabase.from('online_days').select('day, meeting_url').in('day', days) : { data: [] };
    const link = new Map<string, string>((lk.data || []).map((r: any) => [String(r.day), String(r.meeting_url || '')]));
    return paid.map((n: string) => {
      const mine = claims.filter((c) => c.invoice_number === n); const d1 = mine.find((c) => c.role === 'day1'), d2 = mine.find((c) => c.role === 'day2');
      return { invoiceNumber: n, day1: d1 ? { day: String(d1.day), meetingUrl: link.get(String(d1.day)) || '', attended: !!d1.attended_at } : null, day2: d2 ? { day: String(d2.day), attended: !!d2.attended_at } : null, day2Attended: !!(d2 && d2.attended_at) };
    });
  } catch (err: any) { console.warn('[Online] student classes:', err?.message); return []; }
}

/** True when this student has a paid live-online booking whose Day 2 range attendance is not recorded yet. */
export async function day2Pending(supabase: any, studentId: string): Promise<boolean> {
  return (await studentOnlineClasses(supabase, studentId)).some((c) => !c.day2Attended);
}
