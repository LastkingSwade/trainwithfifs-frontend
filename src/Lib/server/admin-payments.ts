import { cleanCourse } from '@/group/groupCopy';

// Staff-only payments view. Read only. The route checks the staff role BEFORE calling this. Returns the fields staff need to follow
// the money; Stripe ids and card details are never selected.
export interface PaymentRow { invoiceNumber: string; email: string; course: string; status: string; total: number; paid: number; balance: number; date: string; delivery: string }
export interface PaymentSummary { collected: number; outstanding: number; paidInFull: number; deposits: number; pending: number; other: number }
export type PaymentResult = { ok: true; rows: PaymentRow[]; summary: PaymentSummary; truncated: boolean } | { ok: false; status: number; message: string };

const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0; };
export const PAYMENT_FILTERS = ['all', 'PAID', 'DEPOSIT_PAID', 'PENDING', 'ABANDONED', 'CANCELLED'] as const;
const LIMIT = 500;

export function summarize(rows: Array<{ status: string; paid: number; balance: number }>): PaymentSummary {
  const s: PaymentSummary = { collected: 0, outstanding: 0, paidInFull: 0, deposits: 0, pending: 0, other: 0 };
  for (const r of rows) {
    s.collected += r.paid;
    if (r.status === 'PAID') s.paidInFull += 1;
    else if (r.status === 'DEPOSIT_PAID') { s.deposits += 1; s.outstanding += r.balance; }
    else if (r.status === 'PENDING') s.pending += 1;
    else s.other += 1;
  }
  s.collected = money(s.collected); s.outstanding = money(s.outstanding);
  return s;
}

export async function adminPayments(supabase: any, filter: unknown, search: unknown): Promise<PaymentResult> {
  const f = (PAYMENT_FILTERS as readonly string[]).includes(String(filter)) ? String(filter) : 'all';
  const q = String(search ?? '').trim().toLowerCase().slice(0, 80);
  try {
    // The delivery column exists only after the online-classroom database script; fall back without it so this view never depends on that script.
    const run = (cols: string) => { let query = supabase.from('invoices').select(cols).order('created_at', { ascending: false }).limit(LIMIT + 1); if (f !== 'all') query = query.eq('status', f); return query; };
    const base = 'invoice_number, email, course, status, total_amount, amount_paid, balance_due, created_at';
    let { data, error } = await run(base + ', delivery');
    if (error) ({ data, error } = await run(base));
    if (error || !Array.isArray(data)) return { ok: false, status: 503, message: 'Could not load payments right now.' };
    const truncated = data.length > LIMIT;
    let rows: PaymentRow[] = data.slice(0, LIMIT).map((r: any) => ({
      invoiceNumber: String(r.invoice_number), email: String(r.email || ''), course: cleanCourse(r.course), status: String(r.status || ''),
      total: money(r.total_amount), paid: money(r.amount_paid), balance: money(r.balance_due), date: String(r.created_at || ''), delivery: r.delivery === 'live_online' ? 'Live online' : 'In person',
    }));
    if (q) rows = rows.filter((r) => `${r.invoiceNumber} ${r.email} ${r.course}`.toLowerCase().includes(q));
    return { ok: true, rows, summary: summarize(rows), truncated };
  } catch (err: any) { console.warn('[Admin payments] unavailable:', err?.message); return { ok: false, status: 503, message: 'Could not load payments right now.' }; }
}

// ---------------------------------------------------------------------------------------------------------------------------
// Staff-only delete of payment records (used to clear test attempts). The route checks the staff role BEFORE calling this.
// It removes the invoice rows from Supabase and gives back any calendar days those bookings were holding. It does NOT touch Stripe:
// money already taken stays in Stripe and must be refunded there.
// ---------------------------------------------------------------------------------------------------------------------------
const INVOICE_NO = /^INV-[A-Za-z0-9-]{3,40}$/;
export const MAX_DELETE = 50;
export type DeleteResult = { ok: true; deleted: number; paidDeleted: number } | { ok: false; status: number; message: string; needsPaidConfirm?: boolean; paidCount?: number };

export async function adminDeletePayments(supabase: any, ids: unknown, confirmPaid: unknown, by: string): Promise<DeleteResult> {
  const list = Array.isArray(ids) ? Array.from(new Set(ids.map((v) => String(v ?? '').trim()))) : [];
  if (!list.length || list.length > MAX_DELETE || !list.every((v) => INVOICE_NO.test(v))) return { ok: false, status: 400, message: `Choose between 1 and ${MAX_DELETE} payments to delete.` };
  try {
    const found = await supabase.from('invoices').select('invoice_number, status').in('invoice_number', list);
    if (found.error || !Array.isArray(found.data)) return { ok: false, status: 503, message: 'Could not check those payments. Nothing was deleted.' };
    if (found.data.length === 0) return { ok: false, status: 404, message: 'Those payments were not found. They may already be deleted.' };
    const paid = found.data.filter((r: any) => r.status === 'PAID' || r.status === 'DEPOSIT_PAID');
    if (paid.length && confirmPaid !== true) {
      return { ok: false, status: 409, needsPaidConfirm: true, paidCount: paid.length, message: `${paid.length} of these show money received. Deleting them does not refund anything in Stripe. Confirm to delete them anyway.` };
    }
    const numbers = found.data.map((r: any) => String(r.invoice_number));
    // Days first, so a failure here never leaves a deleted invoice holding a calendar day. (A missing table is fine: the online script may not be installed.)
    const days = await supabase.from('day_claims').delete().in('invoice_number', numbers);
    if (days.error && !/day_claims|relation|does not exist|schema cache/i.test(String(days.error.message || ''))) return { ok: false, status: 503, message: 'Could not free the calendar days. Nothing was deleted.' };
    const del = await supabase.from('invoices').delete().in('invoice_number', numbers);
    if (del.error) return { ok: false, status: 503, message: 'Could not delete those payments. Please try again.' };
    console.warn(`[Admin payments] ${numbers.length} payment record(s) deleted by ${String(by).slice(0, 80)} (${paid.length} showed money received).`);
    return { ok: true, deleted: numbers.length, paidDeleted: paid.length };
  } catch (err: any) { console.warn('[Admin payments] delete failed:', err?.message); return { ok: false, status: 503, message: 'Could not delete those payments. Please try again.' }; }
}
