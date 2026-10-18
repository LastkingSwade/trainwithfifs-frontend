// The signed MSP 29-14 score sheet is released to a student only when everything they owe for their class is paid. While a deposit-paid booking still has a balance,
// the student sees that the sheet is READY and how much unlocks it, but gets no file, no score and no link. Staff are never locked out (this is only applied to the
// student's own view), and recording the balance as paid (online, or in person in the Admin Hub) unlocks it immediately because this reads the invoice every time.
export interface LockInfo { locked: boolean; checked: boolean; balance: number; invoices: { invoiceNumber: string; course: string; balance: number }[] }
const cents = (v: unknown) => Math.round(Number(v) * 100);

/** `checked: false` means the invoices could not be read: callers must then treat the sheet as locked rather than hand it out. */
export async function scoresheetLock(supabase: any, studentId: string): Promise<LockInfo> {
  const none: LockInfo = { locked: false, checked: true, balance: 0, invoices: [] };
  if (!studentId) return none;
  try {
    const r = await supabase.from('invoices').select('invoice_number, course, status, balance_due').eq('student_id', studentId).eq('status', 'DEPOSIT_PAID');
    if (r.error || !Array.isArray(r.data)) return { locked: true, checked: false, balance: 0, invoices: [] };
    const owing = r.data.map((x: any) => ({ invoiceNumber: String(x.invoice_number), course: String(x.course || ''), c: cents(x.balance_due) })).filter((x: any) => !Number.isFinite(x.c) || x.c > 0);
    // An unreadable balance on a deposit-paid booking counts as owing: nothing is released on a guess.
    const invoices = owing.map((x: any) => ({ invoiceNumber: x.invoiceNumber, course: x.course, balance: Number.isFinite(x.c) ? x.c / 100 : 0 }));
    return { locked: owing.length > 0, checked: true, balance: Math.round(invoices.reduce((n: number, x: any) => n + x.balance * 100, 0)) / 100, invoices };
  } catch { return { locked: true, checked: false, balance: 0, invoices: [] }; }
}
