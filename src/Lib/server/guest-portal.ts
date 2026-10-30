import { ensurePortalAccessAfterPayment, type AccessDeps } from './portal-access';
import { sendDiscordAlert } from './discord';

// Staff: give a paying GUEST a Student Portal after their payment was recorded by hand (Zelle, cash...). An online payment does this by itself (see portal-access.ts); a payment recorded in
// the Admin Hub does not, so this does the same thing on request: the student record (marked Confirmed), the invoice moved onto it so the receipt shows in their portal, their sign-in, and an email
// with a secure link for THEM to create their own password. STAFF ONLY: the route checks the staff role first. Rules, all inherited from the online path:
//  - only an invoice that is already PAID or DEPOSIT_PAID, and only one still on the shared guest record (so it can be done once, and never for someone who already has a record);
//  - anyone who already has a student record, client record or sign-in is left completely alone (no second account, no password change, no email);
//  - the invoice's own email is the one used (never an email typed here); a random throw-away password is never shown, stored or emailed.
export type GResult = { ok: true; message: string } | { ok: false; status: number; message: string };
const GUEST = 'GUEST-CHECKOUT';
const INVOICE_NO = /^INV-[A-Za-z0-9-]{3,40}$/;
const clean = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

export async function createPortalForGuestInvoice(supabase: any, input: { invoiceNumber: unknown; fullName: unknown; phone?: unknown }, by: string, deps: AccessDeps = {}): Promise<GResult> {
  const invoiceNumber = String(input.invoiceNumber || '').trim(); if (!INVOICE_NO.test(invoiceNumber)) return { ok: false, status: 400, message: 'That invoice could not be found.' };
  const fullName = clean(input.fullName, 100); if (fullName.length < 2 || !/[A-Za-z\u00C0-\u024F]/.test(fullName)) return { ok: false, status: 400, message: 'Enter the student\'s full name.' };
  const phoneRaw = clean(input.phone, 30); if (phoneRaw && !/^[0-9+()\-. ]{7,30}$/.test(phoneRaw)) return { ok: false, status: 400, message: 'Enter the phone number with digits only, or leave it empty.' };
  try {
    const f = await supabase.from('invoices').select('invoice_number, status, student_id, email, course, due_date').eq('invoice_number', invoiceNumber).maybeSingle();
    if (f.error) return { ok: false, status: 503, message: 'Could not load that invoice right now. Nothing was created.' };
    const inv = f.data; if (!inv) return { ok: false, status: 404, message: 'That invoice was not found.' };
    if (!['PAID', 'DEPOSIT_PAID'].includes(String(inv.status))) return { ok: false, status: 409, message: 'Record the payment first. A portal is only created for a booking that has been paid.' };
    if (String(inv.student_id) !== GUEST) return { ok: false, status: 409, message: 'This booking is already on a student\'s record, so nothing was created.' };
    const email = String(inv.email || '').trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, status: 409, message: 'This invoice has no valid email address, so a portal cannot be created.' };
    const r = await ensurePortalAccessAfterPayment(supabase, { customer_email: email, metadata: { invoiceId: invoiceNumber, fullName, phone: phoneRaw, courseSelection: String(inv.course || ''), preferredDates: String(inv.due_date || '') } }, deps);
    if (r === 'created') {
      try { await sendDiscordAlert('🎓 Student portal created by hand', `A Student Portal was created for invoice **${invoiceNumber}** by ${String(by || 'staff').slice(0, 120)}. They were emailed a link to set their password.`, [], 0x10b981); } catch { /* an alert problem never changes the result */ }
      return { ok: true, message: `Portal created for ${fullName}. A link to create their password was emailed to ${email}. If it does not arrive in a few minutes, use "Setup link" on the roster.` };
    }
    if (r === 'skipped-existing') return { ok: false, status: 409, message: 'This person already has a student record, client record or sign-in, so nothing was created. Find them on the roster.' };
    if (r === 'skipped-not-paid') return { ok: false, status: 409, message: 'Record the payment first. A portal is only created for a booking that has been paid.' };
    if (r === 'skipped-no-email' || r === 'skipped-linked') return { ok: false, status: 409, message: 'A portal cannot be created from this invoice.' };
    return { ok: false, status: 503, message: 'Could not create the portal right now. Nothing was changed. Please try again.' };
  } catch { return { ok: false, status: 503, message: 'Could not create the portal right now. Nothing was changed. Please try again.' }; }
}
