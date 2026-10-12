import { courseKeyFor } from '@/Lib/pricing';
import { cleanCourse } from '@/group/groupCopy';

// Staff-only "Needs attention" list for the admin hub. READ ONLY: it looks at data that is already stored (invoices, students, clients, score sheets,
// unread chats) and returns what a person should look at next. The route checks the staff role BEFORE calling this. Nothing is written or sent, no
// card or Stripe details are selected, and every list is capped so the answer stays small.

export type AttentionKey = 'chats' | 'balance' | 'unpaid' | 'scoresheets' | 'renewals' | 'confirm';
export type AttentionAction = 'chat' | 'payments' | 'roster' | 'clients';
export interface AttentionItem { ref: string; title: string; detail: string; tone: 'urgent' | 'soon' | 'info' }
export interface AttentionGroup { key: AttentionKey; title: string; hint: string; action: AttentionAction; count: number; items: AttentionItem[] }
export interface AttentionResult { generatedAt: string; total: number; groups: AttentionGroup[]; unavailable: AttentionKey[] }

export const MAX_ITEMS = 8;
const DAY = 86400000;
const HOUR = 3600000;
// Booking started but not paid: ignore the first 2 hours (people are still paying) and anything older than 14 days (long gone).
export const UNPAID_AFTER_HOURS = 2;
export const UNPAID_UNTIL_DAYS = 14;
export const CONFIRM_AFTER_HOURS = 48;
export const RENEWAL_WINDOW_DAYS = 90;
const SCORE_SHEET_COURSES = new Set(['ccw', 'renewal', 'combo', 'mastery']); // the courses that end with an MSP 29-14 score sheet
const LATE_STEPS = ['STEP_5_LIVE_FIRE', 'STEP_6_CERTIFIED', 'STEP_7_MSP_PORTAL', 'STEP_8_LICENSED'];

const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0; };
const dollars = (n: number) => '$' + n.toFixed(2);
const text = (v: unknown, max = 60) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const ms = (v: unknown) => { const t = Date.parse(String(v ?? '')); return Number.isFinite(t) ? t : null; };
export function wholeDaysUntil(dateText: unknown, now: Date): number | null {
  const t = /^\d{4}-\d{2}-\d{2}/.test(String(dateText ?? '')) ? Date.parse(String(dateText).slice(0, 10) + 'T12:00:00Z') : null; // a stored day, not a moment
  if (t === null || !Number.isFinite(t)) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + 12 * HOUR;
  return Math.round((t - today) / DAY);
}
const cap = (items: AttentionItem[]) => items.slice(0, MAX_ITEMS);

export interface AttentionInput {
  now: Date;
  invoices: any[]; students: any[]; clients: any[]; scoresheetStudentIds: ReadonlySet<string>; unreadThreads: number;
}

// Pure: turns the stored rows into the list. Everything unusual (missing dates, odd values) is skipped, never guessed.
export function buildAttention(input: AttentionInput, unavailable: AttentionKey[] = []): AttentionResult {
  const { now } = input; const nowMs = now.getTime(); const groups: AttentionGroup[] = [];
  const add = (g: AttentionGroup) => { if (g.count > 0) groups.push(g); };

  add({ key: 'chats', title: 'Unread chats', hint: 'Visitors waiting for a reply', action: 'chat', count: Math.max(0, Math.floor(input.unreadThreads || 0)),
    items: [{ ref: 'chat', title: `${Math.max(0, Math.floor(input.unreadThreads || 0))} conversation${input.unreadThreads === 1 ? '' : 's'} with new messages`, detail: 'Open the Chat tab to reply', tone: 'urgent' }] });

  const balance = input.invoices.filter((r) => r.status === 'DEPOSIT_PAID' && money(r.balance_due) > 0)
    .sort((a, b) => money(b.balance_due) - money(a.balance_due))
    .map((r): AttentionItem => ({ ref: text(r.invoice_number, 40), title: `${dollars(money(r.balance_due))} still due`, detail: `${cleanCourse(r.course)} · ${text(r.email, 80)}`, tone: 'soon' }));
  add({ key: 'balance', title: 'Balance due after deposit', hint: 'Deposit paid, the rest is owed on class day', action: 'payments', count: balance.length, items: cap(balance) });

  const unpaid = input.invoices.filter((r) => { const t = ms(r.created_at); return r.status === 'PENDING' && t !== null && nowMs - t >= UNPAID_AFTER_HOURS * HOUR && nowMs - t <= UNPAID_UNTIL_DAYS * DAY; })
    .sort((a, b) => (ms(b.created_at) || 0) - (ms(a.created_at) || 0))
    .map((r): AttentionItem => { const hrs = Math.floor((nowMs - (ms(r.created_at) || nowMs)) / HOUR); return { ref: text(r.invoice_number, 40), title: 'Started booking, not paid', detail: `${cleanCourse(r.course)} · ${text(r.email, 80)} · ${hrs < 48 ? hrs + ' hours' : Math.floor(hrs / 24) + ' days'} ago`, tone: 'info' }; });
  add({ key: 'unpaid', title: 'Bookings started, not paid', hint: 'Might need a nudge, or are just abandoned', action: 'payments', count: unpaid.length, items: cap(unpaid) });

  const missing = input.students.filter((s) => {
    const id = text(s.student_id, 40); if (!id || input.scoresheetStudentIds.has(id)) return false;
    const key = courseKeyFor(String(s.course || s.course_name || s.course_selection || ''));
    return !!key && SCORE_SHEET_COURSES.has(key) && LATE_STEPS.includes(String(s.status || ''));
  }).map((s): AttentionItem => ({ ref: text(s.student_id, 40), title: text(s.full_name || s.name || 'Student', 60), detail: `${cleanCourse(s.course || s.course_name || s.course_selection)} · no score sheet saved yet`, tone: 'soon' }));
  add({ key: 'scoresheets', title: 'Score sheets not saved yet', hint: 'At the live-fire step or later, with no MSP 29-14 on file', action: 'roster', count: missing.length, items: cap(missing) });

  const renewals = input.clients.map((c) => ({ c, days: wholeDaysUntil(c.expiration_date, now) })).filter((x) => x.days !== null && (x.days as number) <= RENEWAL_WINDOW_DAYS)
    .sort((a, b) => (a.days as number) - (b.days as number))
    .map(({ c, days }): AttentionItem => { const d = days as number; return { ref: text(c.client_id, 40), title: text(c.full_name || c.name || 'Client', 60),
      detail: d < 0 ? `Permit expired ${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'} ago` : d === 0 ? 'Permit expires today' : `Permit expires in ${d} day${d === 1 ? '' : 's'}`, tone: d <= 0 ? 'urgent' : d <= 30 ? 'soon' : 'info' }; });
  add({ key: 'renewals', title: 'Permits expired or expiring', hint: 'Within 90 days: your easiest repeat bookings', action: 'clients', count: renewals.length, items: cap(renewals) });

  const confirm = input.students.filter((s) => { const t = ms(s.created_at); return String(s.status || '') === 'STEP_1_REGISTERED' && t !== null && nowMs - t >= CONFIRM_AFTER_HOURS * HOUR; })
    .sort((a, b) => (ms(a.created_at) || 0) - (ms(b.created_at) || 0))
    .map((s): AttentionItem => ({ ref: text(s.student_id, 40), title: text(s.full_name || s.name || 'Student', 60), detail: `${cleanCourse(s.course || s.course_name || s.course_selection)} · registered ${Math.floor((nowMs - (ms(s.created_at) || nowMs)) / DAY)} days ago, not confirmed`, tone: 'info' }));
  add({ key: 'confirm', title: 'Waiting for confirmation', hint: 'Registered more than 2 days ago and still at step 1', action: 'roster', count: confirm.length, items: cap(confirm) });

  return { generatedAt: now.toISOString(), total: groups.reduce((n, g) => n + g.count, 0), groups, unavailable };
}

// Reads what is needed. A part that cannot be read is reported as "unavailable" and the rest still shows (never a blank panel because one table is slow).
export async function loadAttention(supabase: any, now: Date = new Date(), guestStudentId = ''): Promise<AttentionResult> {
  const unavailable: AttentionKey[] = [];
  const rows = async (key: AttentionKey | AttentionKey[], run: () => Promise<{ data: any; error: any }>): Promise<any[]> => {
    try { const r = await run(); if (r.error || !Array.isArray(r.data)) { for (const k of ([] as AttentionKey[]).concat(key)) unavailable.push(k); return []; } return r.data; }
    catch (_e) { for (const k of ([] as AttentionKey[]).concat(key)) unavailable.push(k); return []; }
  };
  const invoices = await rows(['balance', 'unpaid'], async () => await supabase.from('invoices').select('invoice_number, email, course, status, balance_due, created_at').in('status', ['DEPOSIT_PAID', 'PENDING']).order('created_at', { ascending: false }).limit(300));
  const students = await rows(['scoresheets', 'confirm'], async () => {
    let q = supabase.from('students').select('*').order('created_at', { ascending: false }).limit(1000);
    if (guestStudentId) q = q.neq('student_id', guestStudentId);
    return await q;
  });
  const clients = await rows('renewals', async () => await supabase.from('clients').select('client_id, full_name, expiration_date, status').limit(2000));
  const sheets = await rows('scoresheets', async () => await supabase.from('student_scoresheets').select('student_id').limit(3000));
  const unread = await rows('chats', async () => await supabase.from('messages').select('thread_id, sender, status').eq('status', 'UNREAD').limit(1000));
  const threads = new Set(unread.filter((m: any) => m.sender !== 'instructor').map((m: any) => String(m.thread_id || 'unknown')));
  const uniqueUnavailable = Array.from(new Set(unavailable));
  const result = buildAttention({ now, invoices, students, clients, scoresheetStudentIds: new Set(sheets.map((r: any) => text(r.student_id, 40))), unreadThreads: threads.size }, uniqueUnavailable);
  // If score sheets could not be read we must not claim that every student is missing one.
  if (uniqueUnavailable.includes('scoresheets')) { result.groups = result.groups.filter((g) => g.key !== 'scoresheets'); result.total = result.groups.reduce((n, g) => n + g.count, 0); }
  return result;
}
