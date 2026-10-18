import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPrivilegedClient } from '@/Lib/server/supabase-admin';
import { sendDiscordAlert } from '@/Lib/server/discord';
import { sendGroupCodeEmail } from '@/Lib/server/group-email';
import { releaseDayClaims } from '@/Lib/server/online-classroom';
import { sendOnlineConfirmationForSession } from '@/Lib/server/online-email';
import { ensurePortalAccessAfterPayment } from '@/Lib/server/portal-access';
import { cancelUnpaidLeaderPod, releasePodSeat } from '@/Lib/server/booking-checkout';

// Signature verification is local (HMAC); this key is never used for API calls in this route.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_build_placeholder', {
  apiVersion: '2023-10-16' as any,
});

// Invoice states that may still transition to paid. A session the customer cancelled or that
// was marked abandoned can still be paid while the Stripe session remains open.
const PAYABLE_STATUSES = ['PENDING', 'ABANDONED', 'CANCELLED'];
const PAID_STATUSES = ['PAID', 'DEPOSIT_PAID'];
const INVOICE_COLUMNS = 'invoice_number, status, total_amount, deposit_due, amount_paid, balance_due, stripe_session_id';

const toCents = (value: unknown) => Math.round(Number(value) * 100);

class RetryableWebhookError extends Error {}
class InvoiceSessionConflictError extends RetryableWebhookError {}

// Session-first lookup: the invoice recorded for this exact Checkout Session wins. Legacy invoices
// without a saved session ID fall back to the exact invoice number from Checkout metadata (never a
// multi-row student lookup), and an invoice bound to a different session is never overwritten.
async function findInvoice(supabase: any, sessionId: string, invoiceNumber?: string | null) {
  const bySession = await supabase
    .from('invoices')
    .select(INVOICE_COLUMNS)
    .eq('stripe_session_id', sessionId)
    .maybeSingle();
  if (bySession.error) throw new RetryableWebhookError('Invoice lookup by Stripe session failed: ' + (bySession.error.message || 'unknown error'));
  if (bySession.data) return bySession.data;
  if (!invoiceNumber) return null;

  const byInvoiceNumber = await supabase
    .from('invoices')
    .select(INVOICE_COLUMNS)
    .eq('invoice_number', invoiceNumber)
    .maybeSingle();
  if (byInvoiceNumber.error) throw new RetryableWebhookError('Invoice lookup by invoice number failed: ' + (byInvoiceNumber.error.message || 'unknown error'));
  if (byInvoiceNumber.data?.stripe_session_id && byInvoiceNumber.data.stripe_session_id !== sessionId) {
    throw new InvoiceSessionConflictError('Invoice is already associated with a different Stripe Checkout session.');
  }
  return byInvoiceNumber.data;
}

// A student paying the REMAINING BALANCE of a booking they already paid the deposit on (see src/Lib/server/balance-checkout.ts). This is deliberately a
// separate path: the deposit/full-payment path above treats a DEPOSIT_PAID invoice as "already applied", and must not change. Applied only when the invoice is
// DEPOSIT_PAID and the amount paid equals the balance recorded on the invoice; applied once (the update is conditional); a second payment is flagged for refund.
async function handleBalancePayment(supabase: any, session: Stripe.Checkout.Session) {
  const invoiceNumber = String(session.metadata?.invoiceId || '');
  const paidCents = session.amount_total ?? 0;
  const fields = [
    { name: 'Stripe Session', value: session.id, inline: false },
    { name: 'Invoice', value: invoiceNumber || 'N/A', inline: true },
    { name: 'Amount Paid', value: `$${(paidCents / 100).toFixed(2)}`, inline: true },
  ];
  const found = invoiceNumber
    ? await supabase.from('invoices').select(INVOICE_COLUMNS + ', payment_method').eq('invoice_number', invoiceNumber).maybeSingle()
    : { data: null, error: null };
  if (found.error) throw new RetryableWebhookError('Balance invoice lookup failed: ' + (found.error.message || 'unknown error'));
  const invoice = found.data;
  if (!invoice) {
    await sendDiscordAlert('⚠️ Balance payment needs manual reconciliation', 'A paid balance checkout did not match any recorded invoice. Stripe will retry this delivery.', fields, 0xEF4444);
    throw new RetryableWebhookError(`No invoice found for balance session ${session.id}.`);
  }
  if (String(invoice.status) === 'PAID') {
    // The same delivery repeated (this session is already written on the invoice) is ignored; a DIFFERENT paid session means the student paid twice.
    if (String(invoice.payment_method || '').includes(session.id)) return;
    await sendDiscordAlert('⚠️ Balance paid twice: refund needed', `Invoice **${invoiceNumber}** was already paid in full when this second balance payment arrived. Refund it in Stripe.`, fields, 0xEF4444);
    return;
  }
  const expectedCents = toCents(invoice.balance_due);
  if (String(invoice.status) !== 'DEPOSIT_PAID' || !Number.isFinite(expectedCents) || expectedCents <= 0 || paidCents !== expectedCents || (session.currency || 'usd').toLowerCase() !== 'usd') {
    await sendDiscordAlert('⚠️ Balance payment amount mismatch', 'The amount paid does not match the balance on the invoice, or the invoice is not waiting on a balance. The invoice was NOT changed.', [...fields, { name: 'Expected', value: `$${(Math.max(expectedCents, 0) / 100).toFixed(2)}`, inline: true }, { name: 'Invoice status', value: String(invoice.status), inline: true }], 0xEF4444);
    return;
  }
  const { data: updated, error: updateErr } = await supabase
    .from('invoices')
    .update({
      status: 'PAID',
      amount_paid: (toCents(invoice.total_amount) / 100).toFixed(2),
      balance_due: '0.00',
      payment_method: `Stripe Checkout + balance ${session.id}`.slice(0, 200),
      updated_at: new Date().toISOString(),
    })
    .eq('invoice_number', invoiceNumber)
    .eq('status', 'DEPOSIT_PAID')
    .eq('balance_due', invoice.balance_due)
    .select('invoice_number');
  if (updateErr) throw new RetryableWebhookError('Balance payment update failed: ' + (updateErr.message || 'unknown error'));
  if (!Array.isArray(updated) || updated.length === 0) return;
  await sendDiscordAlert('💳 Remaining Balance Paid', `The remaining balance for invoice **${invoiceNumber}** (${session.customer_email || 'Student'}) was paid online. The invoice is now paid in full.`, [
    { name: 'Amount Paid', value: `$${(paidCents / 100).toFixed(2)}`, inline: true },
    { name: 'Total', value: `$${(toCents(invoice.total_amount) / 100).toFixed(2)}`, inline: true },
  ], 0x10b981);
}

async function handlePaidSession(supabase: any, session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') {
    // Delayed payment methods report success later via checkout.session.async_payment_succeeded.
    return;
  }
  if (session.metadata?.isBalancePayment === 'true') { await handleBalancePayment(supabase, session); return; }

  const metadataInvoiceNumber = session.metadata?.invoiceId || '';
  const isDeposit = session.metadata?.isDepositPayment === 'true';
  const paidCents = session.amount_total ?? 0;
  const reconcileFields = [
    { name: 'Stripe Session', value: session.id, inline: false },
    { name: 'Invoice', value: metadataInvoiceNumber || 'N/A', inline: true },
    { name: 'Amount Paid', value: `$${(paidCents / 100).toFixed(2)}`, inline: true }
  ];

  let invoice: any;
  try {
    invoice = await findInvoice(supabase, session.id, metadataInvoiceNumber || null);
  } catch (err) {
    if (err instanceof InvoiceSessionConflictError) {
      console.error('[Stripe Webhook] Invoice is bound to a different Stripe session:', metadataInvoiceNumber);
      await sendDiscordAlert('⚠️ Payment needs manual reconciliation', 'A paid Stripe checkout does not match the session recorded on its invoice. It was NOT applied; Stripe will retry.', reconcileFields, 0xEF4444);
    }
    throw err;
  }
  if (!invoice) {
    // Never acknowledge a paid session without a recorded invoice: return 500 so Stripe retries
    // (and the failed delivery stays visible) while staff reconcile it.
    console.error('[Stripe Webhook] No invoice found for paid session:', session.id);
    await sendDiscordAlert('⚠️ Payment needs manual reconciliation', 'A paid Stripe checkout did not match any recorded invoice. Stripe will retry this delivery.', reconcileFields, 0xEF4444);
    throw new RetryableWebhookError(`No invoice found for Stripe session ${session.id}.`);
  }
  const invoiceNumber = String(invoice.invoice_number);

  if (PAID_STATUSES.includes(String(invoice.status))) {
    // Duplicate delivery of an event that was already applied.
    return;
  }

  const totalCents = toCents(invoice.total_amount);
  const expectedCents = isDeposit ? toCents(invoice.deposit_due) : totalCents;
  if (!Number.isFinite(expectedCents) || paidCents !== expectedCents || (session.currency || 'usd').toLowerCase() !== 'usd') {
    console.error('[Stripe Webhook] Paid amount does not match invoice:', invoiceNumber);
    await sendDiscordAlert(
      '⚠️ Payment amount mismatch',
      'The amount paid in Stripe does not match the invoice. The invoice was NOT marked paid.',
      [...reconcileFields, { name: 'Expected', value: `$${(expectedCents / 100).toFixed(2)}`, inline: true }],
      0xEF4444
    );
    return;
  }

  // Confirm the linked student first: it is safe to repeat, so a later invoice failure can be retried.
  // Only the server-written, signature-verified linkedUserId metadata is used — never an email or a
  // browser-supplied student ID.
  const linkedUserId = session.metadata?.linkedUserId || '';
  if (linkedUserId) {
    const { error: studentErr } = await supabase
      .from('students')
      .update({ status: 'CONFIRMED', updated_at: new Date().toISOString() })
      .eq('user_id', linkedUserId);
    if (studentErr) throw new RetryableWebhookError('Student confirmation failed: ' + (studentErr.message || 'unknown error'));
  }

  const balanceCents = Math.max(totalCents - paidCents, 0);
  // Conditional on the current status, so concurrent or repeated deliveries apply the payment once.
  const { data: updated, error: updateErr } = await supabase
    .from('invoices')
    .update({
      status: balanceCents === 0 ? 'PAID' : 'DEPOSIT_PAID',
      amount_paid: (paidCents / 100).toFixed(2),
      balance_due: (balanceCents / 100).toFixed(2),
      stripe_session_id: session.id,
      updated_at: new Date().toISOString(),
    })
    .eq('invoice_number', invoiceNumber)
    .in('status', PAYABLE_STATUSES)
    .select('invoice_number');
  if (updateErr) throw new RetryableWebhookError('Invoice payment update failed: ' + (updateErr.message || 'unknown error'));
  if (!Array.isArray(updated) || updated.length === 0) return;

  await sendDiscordAlert(
    isDeposit ? '💳 Reservation Deposit Received' : '💳 Payment in Full Received',
    `${isDeposit ? 'Deposit' : 'Full payment'} received for invoice **${invoiceNumber}** (${session.customer_email || 'Student'}).`,
    [
      { name: 'Course', value: session.metadata?.courseSelection || 'Firearms Training Course', inline: true },
      { name: 'Amount Paid', value: `$${(paidCents / 100).toFixed(2)}`, inline: true },
      { name: 'Balance Due', value: `$${(balanceCents / 100).toFixed(2)}`, inline: true },
      { name: 'Linked Portal Account', value: linkedUserId ? 'Yes' : 'No (guest)', inline: true },
    ],
    0x10b981
  );

  await sendOnlineConfirmation(supabase, session);

  // Guests get a secure link by email to create their Student Portal password. Best effort: it can never change the payment result.
  try { await ensurePortalAccessAfterPayment(supabase, session as any); } catch (accessErr: any) { console.warn('[Stripe Webhook] Portal access not set up:', accessErr?.message || 'unknown error'); }

  // The person who booked a group gets their group code by email, once, right after the payment is applied. Best effort: it can
  // never change the payment result (the helper never throws, and this is wrapped as well).
  if (session.metadata?.podRole === 'leader' && session.metadata?.podCode) {
    try {
      await sendGroupCodeEmail(session.customer_email || session.customer_details?.email || '', {
        code: session.metadata.podCode,
        course: session.metadata.courseSelection,
        dates: session.metadata.preferredDates,
        size: Number(session.metadata.attendees) || undefined,
        name: session.metadata.fullName,
      });
    } catch (emailErr: any) {
      console.warn('[Stripe Webhook] Group code email not sent:', emailErr?.message || 'unknown error');
    }
  }
}

// Live-online bookings: confirmation with both dates, the Day 2 statement and the join link, once the payment is applied. Best effort.
async function sendOnlineConfirmation(supabase: any, session: Stripe.Checkout.Session) {
  if (session.metadata?.delivery !== 'live_online') return;
  try { await sendOnlineConfirmationForSession(supabase, session as any); } catch (err: any) { console.warn('[Stripe Webhook] Online confirmation not sent:', err?.message || 'unknown error'); }
}

async function handleExpiredSession(supabase: any, session: Stripe.Checkout.Session) {
  const invoiceNumber = session.metadata?.invoiceId;
  if (!invoiceNumber) return;

  const { data: updated, error } = await supabase
    .from('invoices')
    .update({ status: 'ABANDONED', updated_at: new Date().toISOString() })
    .eq('invoice_number', invoiceNumber)
    .eq('stripe_session_id', session.id)
    .eq('status', 'PENDING')
    .select('invoice_number');
  if (error) throw new RetryableWebhookError('Invoice expiry update failed: ' + (error.message || 'unknown error'));
  if (!Array.isArray(updated) || updated.length === 0) return;

  // The invoice went PENDING -> ABANDONED just now (never paid), so this runs once. Give back a pod member's seat, or cancel a
  // pod whose leader never paid and nobody joined. Best effort: these helpers never throw and never change payment state.
  // Any booking that never got paid gives its calendar days back (best effort; never changes payment state).
  await releaseDayClaims(invoiceNumber);
  const podCode = session.metadata?.podCode;
  if (podCode) {
    if (session.metadata?.podRole === 'member') await releasePodSeat(podCode);
    else if (session.metadata?.podRole === 'leader') await cancelUnpaidLeaderPod(podCode);
  }

  await sendDiscordAlert(
    '⚠️ Checkout Session Abandoned / Expired',
    `Invoice **${invoiceNumber}** was abandoned prior to completion.`,
    [
      { name: 'Customer Email', value: session.customer_email || 'N/A', inline: true },
      { name: 'Course', value: session.metadata?.courseSelection || 'N/A', inline: true },
    ],
    0xf59e0b
  );
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Stripe Webhook Error]: STRIPE_WEBHOOK_SECRET is not configured.');
    return NextResponse.json({ error: 'Webhook secret is unconfigured on server.' }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook Signature Verification Failed]: ${err?.message}`);
    return NextResponse.json({ error: 'Signature verification failed.' }, { status: 400 });
  }

  const handled = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.expired'];
  if (!handled.includes(event.type)) {
    return NextResponse.json({ received: true });
  }

  let supabase: any;
  try {
    supabase = getPrivilegedClient();
  } catch (e: any) {
    console.error('[Supabase Init Error in Webhook]:', e?.message);
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    if (event.type === 'checkout.session.expired') {
      await handleExpiredSession(supabase, session);
    } else {
      await handlePaidSession(supabase, session);
    }
    return NextResponse.json({ received: true });
  } catch (err: any) {
    // Non-2xx so Stripe retries the delivery.
    console.error('[Stripe Webhook Processing Error]:', err?.message);
    return NextResponse.json({ error: 'Webhook processing failed; will retry.' }, { status: 500 });
  }
}
