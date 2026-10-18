import Stripe from 'stripe';
import { displayCourseLabel } from '../pricing';
import { getAuthenticatedUser, getPrivilegedClient, resolveStripeSecretKey } from './supabase-admin';
import { ConfigurationError, resolveSiteUrl } from '../config/environment';
import { STRIPE_API_VERSION } from './booking-checkout';

// "Pay my remaining balance" for the Student Portal. The amount is NEVER taken from the browser: it is the balance written on the student's own invoice
// (found from the verified login), and only a deposit-paid invoice with a balance can be paid this way. The payment is applied by the Stripe webhook
// (src/app/api/stripe/webhook/route.ts, handleBalancePayment), never by this request or by the page the student returns to.
export type BalanceResult = { status: number; body: Record<string, unknown> };
const cents = (v: unknown) => Math.round(Number(v) * 100);
const SESSION_MINUTES = 60;

export async function createBalanceCheckout(req: { headers: { get(name: string): string | null } }, invoiceNumberInput: unknown): Promise<BalanceResult> {
  const fail = (status: number, error: string): BalanceResult => ({ status, body: { success: false, status: 'error', error } });
  const { user, error: authErr } = await getAuthenticatedUser(req);
  if (authErr || !user?.id) return fail(401, 'Please sign in to the Student Portal to pay your balance.');
  const invoiceNumber = String(invoiceNumberInput || '').trim();
  if (!/^[A-Za-z0-9-]{4,60}$/.test(invoiceNumber)) return fail(400, 'That invoice could not be found.');

  let stripeKey: string | null, baseUrl: string, supabase: any;
  try { stripeKey = resolveStripeSecretKey(); baseUrl = resolveSiteUrl(); supabase = getPrivilegedClient(); }
  catch (err) { if (err instanceof ConfigurationError) return fail(503, 'Online payment is not set up for this environment. Please contact FIFS.'); throw err; }
  if (!stripeKey) return fail(503, 'Online payment is not available right now. Please contact FIFS.');

  const me = await supabase.from('students').select('student_id, email').eq('user_id', user.id).maybeSingle();
  if (me.error) return fail(503, 'We could not check your account right now. Please try again in a minute.');
  if (!me.data?.student_id) return fail(404, 'That invoice could not be found.');
  const inv = await supabase.from('invoices').select('invoice_number, course, status, total_amount, amount_paid, balance_due, email').eq('invoice_number', invoiceNumber).eq('student_id', me.data.student_id).maybeSingle();
  if (inv.error) return fail(503, 'We could not load your invoice right now. Please try again in a minute.');
  const row = inv.data;
  if (!row) return fail(404, 'That invoice could not be found.');
  if (row.status === 'PAID') return fail(409, 'This invoice is already paid in full. Thank you!');
  if (row.status !== 'DEPOSIT_PAID') return fail(409, 'Your deposit has not been confirmed yet, so there is no balance to pay online. Please contact FIFS if you think this is a mistake.');
  const balance = cents(row.balance_due), total = cents(row.total_amount), paid = cents(row.amount_paid);
  // The three numbers on the invoice must agree before any money is requested.
  if (![balance, total, paid].every(Number.isFinite) || balance <= 0 || balance > total || Math.abs(total - paid - balance) > 1) {
    console.error('[Balance checkout] Invoice amounts do not agree:', invoiceNumber);
    return fail(409, 'We could not confirm the balance on this invoice. Please contact FIFS and we will take care of it.');
  }

  const stripe = new Stripe(stripeKey, { apiVersion: STRIPE_API_VERSION });
  const email = String(row.email || me.data.email || user.email || '').trim().toLowerCase();
  const bucket = Math.floor(Date.now() / (30 * 60 * 1000)); // a repeated tap within 30 minutes gets the SAME checkout back, so no one is asked to pay twice
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      ...(email ? { customer_email: email } : {}),
      client_reference_id: invoiceNumber,
      metadata: { invoiceId: invoiceNumber, isBalancePayment: 'true', linkedUserId: String(user.id), courseSelection: String(row.course || '').slice(0, 200) },
      line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: balance, product_data: {
        name: `${displayCourseLabel(String(row.course || 'Firearms Training Course'))} — Remaining Balance`,
        description: `Invoice: ${invoiceNumber} • Total $${(total / 100).toFixed(2)} • Already paid $${(paid / 100).toFixed(2)}`,
      } } }],
      expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
      success_url: `${baseUrl}/?balance_paid=true&invoice=${encodeURIComponent(invoiceNumber)}`,
      cancel_url: `${baseUrl}/?balance_cancelled=true&invoice=${encodeURIComponent(invoiceNumber)}`,
    }, { idempotencyKey: `balance-${invoiceNumber}-${balance}-${bucket}` });
    if (!session?.url) return fail(502, 'Stripe did not return a checkout link. Please try again or contact FIFS.');
    return { status: 200, body: { success: true, status: 'success', url: session.url, amount: balance / 100 } };
  } catch (err: any) {
    console.error('[Balance checkout] Stripe session creation failed:', err?.message);
    return fail(502, 'We could not open secure checkout. Please try again in a minute or contact FIFS.');
  }
}
