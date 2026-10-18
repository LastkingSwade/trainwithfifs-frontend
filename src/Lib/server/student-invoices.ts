import { cleanCourse } from '@/group/groupCopy';
import { studentPaymentsFor } from './manual-payments';

// Receipts for the Student Portal. Only the signed-in student's own PAID or DEPOSIT_PAID invoices (found by the verified student id),
// and only the fields a receipt needs: never an email, a Stripe id or another person's row.
export interface StudentInvoice { invoiceNumber: string; course: string; status: 'Paid in full' | 'Deposit paid'; total: number; paid: number; balance: number; date: string; inPerson: { amount: number; method: string; date: string; recordedAt: string }[] }

const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0; };

export async function studentInvoices(supabase: any, studentId: string): Promise<StudentInvoice[]> {
  try {
    if (!studentId) return [];
    const { data, error } = await supabase.from('invoices')
      .select('invoice_number, course, status, total_amount, amount_paid, balance_due, created_at')
      .eq('student_id', studentId).in('status', ['PAID', 'DEPOSIT_PAID']).order('created_at', { ascending: false }).limit(25);
    if (error || !Array.isArray(data)) return [];
    // Payments the instructor recorded in person (cash, check...): shown as method, amount and date only. Best effort: if the records are not available the receipt still shows the correct totals.
    const inPerson = await studentPaymentsFor(supabase, data.map((r: any) => String(r.invoice_number)));
    return data.map((r: any) => ({
      invoiceNumber: String(r.invoice_number), course: cleanCourse(r.course), status: r.status === 'PAID' ? 'Paid in full' as const : 'Deposit paid' as const,
      total: money(r.total_amount), paid: money(r.amount_paid), balance: money(r.balance_due), date: String(r.created_at || ''),
      inPerson: inPerson.filter((p) => p.invoiceNumber === String(r.invoice_number)).map((p) => ({ amount: money(p.amount), method: p.methodLabel, date: p.receivedOn, recordedAt: p.recordedAt })),
    }));
  } catch (err: any) { console.warn('[Student invoices] unavailable:', err?.message); return []; }
}
