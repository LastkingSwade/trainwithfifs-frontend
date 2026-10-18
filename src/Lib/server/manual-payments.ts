import { sendDiscordAlert } from './discord';

// Payments received outside the website (cash, check, Zelle, a card on the day...). STAFF ONLY: the route checks the staff role BEFORE any of this runs.
// The invoice is the source of truth for money (amount_paid, balance_due, status); every change is also written to the invoice_payments ledger (who, how, when),
// and a mistake is VOIDED, never deleted. Amounts are whole cents; a payment can never be more than the balance. Only a deposit-paid invoice can take one:
// an invoice still waiting on its online payment (PENDING) is left alone so a customer's open Stripe checkout can never be double-counted.
export const METHODS: Record<string, string> = { cash: 'Cash', check: 'Check', money_order: 'Money order', zelle: 'Zelle', venmo: 'Venmo', cash_app: 'Cash App', card_in_person: 'Card in person', other: 'Other' };
export interface LedgerRow { id: string; amount: number; method: string; methodLabel: string; receivedOn: string; note: string; recordedBy: string; createdAt: string; voided: boolean; voidReason: string }
export type Result<T = {}> = ({ ok: true } & T) | { ok: false; status: number; message: string };
const SETUP = 'One-time setup needed: run scripts/sql/20261019_invoice_payments.sql in the SQL editor of your database, then try again.';
const toCents = (v: unknown) => Math.round(Number(v) * 100);
const fromCents = (c: number) => (c / 100).toFixed(2);
const INVOICE_NO = /^[A-Za-z0-9-]{4,60}$/;
const isMissingTable = (e: any) => !!e && (e.code === '42P01' || /invoice_payments|relation|does not exist|schema cache/i.test(String(e.message || '')));

/** "175", "175.00", "$1,175.5" -> cents; anything else (negative, zero, 3 decimals, text) -> null. */
export function parseAmount(v: unknown): number | null {
  const s = String(v ?? '').trim().replace(/^\$/, '').replace(/,/g, '');
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(s)) return null;
  const c = Math.round(Number(s) * 100);
  return c > 0 ? c : null;
}
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
export function cleanDate(v: unknown): string | null {
  const s = String(v || '').trim() || today();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s + 'T12:00:00Z'))) return null;
  const t = Date.parse(s + 'T12:00:00Z'), now = Date.parse(today() + 'T12:00:00Z');
  return t > now + 86400000 || t < now - 400 * 86400000 ? null : s; // not in the future, not more than ~13 months back
}
const cleanNote = (v: unknown) => String(v ?? '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);

const rowOut = (r: any): LedgerRow => ({ id: String(r.id), amount: Number(r.amount), method: String(r.method), methodLabel: METHODS[r.method] || 'Other', receivedOn: String(r.received_on || ''), note: String(r.note || ''), recordedBy: String(r.recorded_by || ''), createdAt: String(r.created_at || ''), voided: !!r.voided_at, voidReason: String(r.void_reason || '') });

export async function listInvoicePayments(supabase: any, invoiceNumber: unknown): Promise<Result<{ payments: LedgerRow[]; setupNeeded: boolean }>> {
  const inv = String(invoiceNumber || '').trim(); if (!INVOICE_NO.test(inv)) return { ok: false, status: 400, message: 'That invoice could not be found.' };
  try {
    const r = await supabase.from('invoice_payments').select('id, amount, method, received_on, note, recorded_by, created_at, voided_at, void_reason').eq('invoice_number', inv).order('created_at', { ascending: true });
    if (r.error) return isMissingTable(r.error) ? { ok: true, payments: [], setupNeeded: true } : { ok: false, status: 503, message: 'Could not load the payment history right now.' };
    return { ok: true, payments: (r.data || []).map(rowOut), setupNeeded: false };
  } catch { return { ok: false, status: 503, message: 'Could not load the payment history right now.' }; }
}

export async function recordManualPayment(supabase: any, input: { invoiceNumber: unknown; amount: unknown; method: unknown; receivedOn: unknown; note: unknown }, by: string): Promise<Result<{ status: string; paid: number; balance: number; amount: number }>> {
  const invoiceNumber = String(input.invoiceNumber || '').trim(); if (!INVOICE_NO.test(invoiceNumber)) return { ok: false, status: 400, message: 'That invoice could not be found.' };
  const cents = parseAmount(input.amount); if (cents === null) return { ok: false, status: 400, message: 'Enter the amount received, like 175 or 175.00.' };
  const method = String(input.method || ''); if (!METHODS[method]) return { ok: false, status: 400, message: 'Choose how it was paid.' };
  const receivedOn = cleanDate(input.receivedOn); if (!receivedOn) return { ok: false, status: 400, message: 'The date received must be a real date, not in the future.' };
  const note = cleanNote(input.note); const who = String(by || 'staff').slice(0, 120);
  try {
    // The ledger table must exist first, so no money change can ever happen without its record.
    const probe = await supabase.from('invoice_payments').select('id').limit(1);
    if (probe.error) return { ok: false, status: isMissingTable(probe.error) ? 409 : 503, message: isMissingTable(probe.error) ? SETUP : 'Could not check the payment records right now.' };
    const found = await supabase.from('invoices').select('invoice_number, status, total_amount, amount_paid, balance_due, email, course').eq('invoice_number', invoiceNumber).maybeSingle();
    if (found.error) return { ok: false, status: 503, message: 'Could not load that invoice right now.' };
    const inv = found.data; if (!inv) return { ok: false, status: 404, message: 'That invoice was not found.' };
    if (inv.status === 'PAID') return { ok: false, status: 409, message: 'That invoice is already paid in full.' };
    if (inv.status !== 'DEPOSIT_PAID') return { ok: false, status: 409, message: 'Only a booking with a confirmed online deposit can take a payment here. This one has not been paid online yet.' };
    const total = toCents(inv.total_amount), paid = toCents(inv.amount_paid), balance = toCents(inv.balance_due);
    if (![total, paid, balance].every(Number.isFinite) || balance <= 0 || Math.abs(total - paid - balance) > 1) return { ok: false, status: 409, message: 'The amounts on this invoice do not add up, so nothing was changed. Check the invoice first.' };
    if (cents > balance) return { ok: false, status: 400, message: `That is more than the balance of $${fromCents(balance)}. Enter $${fromCents(balance)} or less.` };
    const newPaid = paid + cents, newBalance = balance - cents, newStatus = newBalance === 0 ? 'PAID' : 'DEPOSIT_PAID';
    // Conditional on the amounts we just read: if anything changed in the meantime (an online payment, another staff member) nothing is written.
    const upd = await supabase.from('invoices').update({ amount_paid: fromCents(newPaid), balance_due: fromCents(newBalance), status: newStatus, updated_at: new Date().toISOString() })
      .eq('invoice_number', invoiceNumber).eq('status', 'DEPOSIT_PAID').eq('balance_due', inv.balance_due).eq('amount_paid', inv.amount_paid).select('invoice_number');
    if (upd.error) return { ok: false, status: 503, message: 'Could not save the payment. Nothing was changed.' };
    if (!Array.isArray(upd.data) || upd.data.length === 0) return { ok: false, status: 409, message: 'This invoice just changed (another payment came in). Reload it and try again. Nothing was changed.' };
    const led = await supabase.from('invoice_payments').insert({ invoice_number: invoiceNumber, amount: fromCents(cents), method, received_on: receivedOn, note: note || null, recorded_by: who });
    if (led.error) {
      // No record, no change: put the invoice back exactly as it was.
      await supabase.from('invoices').update({ amount_paid: inv.amount_paid, balance_due: inv.balance_due, status: 'DEPOSIT_PAID', updated_at: new Date().toISOString() }).eq('invoice_number', invoiceNumber).eq('amount_paid', fromCents(newPaid));
      console.error('[Manual payment] ledger write failed; invoice restored:', invoiceNumber);
      return { ok: false, status: 503, message: 'Could not record the payment, so nothing was changed. Please try again.' };
    }
    await sendDiscordAlert('💵 Payment recorded in person', `${METHODS[method]} payment of **$${fromCents(cents)}** recorded on invoice **${invoiceNumber}** by ${who}.`, [
      { name: 'Now paid', value: `$${fromCents(newPaid)} of $${fromCents(total)}`, inline: true }, { name: 'Balance', value: `$${fromCents(newBalance)}`, inline: true }, { name: 'Status', value: newStatus === 'PAID' ? 'Paid in full' : 'Deposit paid', inline: true },
    ], 0x10b981);
    return { ok: true, status: newStatus, paid: newPaid / 100, balance: newBalance / 100, amount: cents / 100 };
  } catch (err: any) { console.error('[Manual payment] failed:', err?.message); return { ok: false, status: 503, message: 'Could not save the payment. Nothing was changed.' }; }
}

/** A recorded payment was a mistake: mark it void (kept in the history) and give the amount back to the balance. */
export async function voidManualPayment(supabase: any, paymentId: unknown, reason: unknown, by: string): Promise<Result<{ status: string; paid: number; balance: number }>> {
  const id = String(paymentId || '').trim(); if (!/^[0-9a-fA-F-]{36}$/.test(id)) return { ok: false, status: 400, message: 'That payment could not be found.' };
  const why = cleanNote(reason); if (why.length < 3) return { ok: false, status: 400, message: 'Add a short reason (a few words) so the history shows why.' };
  const who = String(by || 'staff').slice(0, 120);
  try {
    const f = await supabase.from('invoice_payments').select('id, invoice_number, amount, voided_at').eq('id', id).maybeSingle();
    if (f.error) return { ok: false, status: isMissingTable(f.error) ? 409 : 503, message: isMissingTable(f.error) ? SETUP : 'Could not load that payment right now.' };
    const row = f.data; if (!row) return { ok: false, status: 404, message: 'That payment was not found.' };
    if (row.voided_at) return { ok: false, status: 409, message: 'That payment was already voided.' };
    const iv = await supabase.from('invoices').select('invoice_number, status, total_amount, amount_paid, balance_due').eq('invoice_number', row.invoice_number).maybeSingle();
    if (iv.error || !iv.data) return { ok: false, status: 503, message: 'Could not load the invoice. Nothing was changed.' };
    const inv = iv.data; const total = toCents(inv.total_amount), paid = toCents(inv.amount_paid), balance = toCents(inv.balance_due), cents = toCents(row.amount);
    if (![total, paid, balance, cents].every(Number.isFinite) || paid < cents || Math.abs(total - paid - balance) > 1) return { ok: false, status: 409, message: 'The amounts on this invoice do not add up, so nothing was changed. Check the invoice first.' };
    const newPaid = paid - cents, newBalance = balance + cents;
    if (!['PAID', 'DEPOSIT_PAID'].includes(String(inv.status))) return { ok: false, status: 409, message: 'This invoice is not in a state where a payment can be voided.' };
    const upd = await supabase.from('invoices').update({ amount_paid: fromCents(newPaid), balance_due: fromCents(newBalance), status: 'DEPOSIT_PAID', updated_at: new Date().toISOString() })
      .eq('invoice_number', row.invoice_number).eq('amount_paid', inv.amount_paid).eq('balance_due', inv.balance_due).select('invoice_number');
    if (upd.error) return { ok: false, status: 503, message: 'Could not change the invoice. Nothing was changed.' };
    if (!Array.isArray(upd.data) || upd.data.length === 0) return { ok: false, status: 409, message: 'This invoice just changed. Reload it and try again. Nothing was changed.' };
    const mark = await supabase.from('invoice_payments').update({ voided_at: new Date().toISOString(), voided_by: who, void_reason: why }).eq('id', id).is('voided_at', null).select('id');
    if (mark.error || !Array.isArray(mark.data) || mark.data.length === 0) {
      await supabase.from('invoices').update({ amount_paid: inv.amount_paid, balance_due: inv.balance_due, status: inv.status, updated_at: new Date().toISOString() }).eq('invoice_number', row.invoice_number).eq('amount_paid', fromCents(newPaid));
      return { ok: false, status: 503, message: 'Could not mark that payment as voided, so nothing was changed. Please try again.' };
    }
    await sendDiscordAlert('↩️ In-person payment voided', `A recorded payment of **$${fromCents(cents)}** on invoice **${row.invoice_number}** was voided by ${who}. Reason: ${why}`, [{ name: 'Balance now', value: `$${fromCents(newBalance)}`, inline: true }], 0xf59e0b);
    return { ok: true, status: 'DEPOSIT_PAID', paid: newPaid / 100, balance: newBalance / 100 };
  } catch (err: any) { console.error('[Manual payment] void failed:', err?.message); return { ok: false, status: 503, message: 'Could not void that payment. Nothing was changed.' }; }
}

/** What a STUDENT sees on their own receipt: method, amount and date of each in-person payment. Never the note, who recorded it, or voided entries. */
export interface StudentPayment { invoiceNumber: string; amount: number; methodLabel: string; receivedOn: string }
export async function studentPaymentsFor(supabase: any, invoiceNumbers: string[]): Promise<StudentPayment[]> {
  try {
    if (!invoiceNumbers.length) return [];
    const r = await supabase.from('invoice_payments').select('invoice_number, amount, method, received_on, voided_at').in('invoice_number', invoiceNumbers).is('voided_at', null).order('received_on', { ascending: true });
    if (r.error || !Array.isArray(r.data)) return [];
    return r.data.map((x: any) => ({ invoiceNumber: String(x.invoice_number), amount: Number(x.amount), methodLabel: METHODS[x.method] || 'Other', receivedOn: String(x.received_on || '') }));
  } catch { return []; }
}
