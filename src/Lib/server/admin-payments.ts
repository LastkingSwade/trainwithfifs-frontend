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
