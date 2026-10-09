import crypto from 'node:crypto';
import Stripe from 'stripe';
import { calculatePricingBreakdown, parseAttendeeCount } from '../pricing';
import { getAuthenticatedUser, getPrivilegedClient, hasBearerToken, resolveStripeSecretKey } from './supabase-admin';
import { sendDiscordAlert } from './discord';
import { ConfigurationError, resolveSiteUrl } from '../config/environment';

export const STRIPE_API_VERSION = '2023-10-16' as any;
const FACILITY = "Cindy's Hot Shots (115 Holsum Way, Glen Burnie, MD 21060)";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Trusted public site origin for Stripe return URLs. Never derived from request
 * Origin/Referer headers, which callers control. Outside Production it must be configured
 * and must not be the Production site (see resolveSiteUrl).
 */
export function getSiteUrl(): string {
  return resolveSiteUrl();
}

// Server-generated identifiers. Request-supplied invoice/student IDs are ignored.
function generateInvoiceId(): string {
  return `INV-FI-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function generateGuestStudentId(): string {
  return `GUEST-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * invoices.student_id is NOT NULL and has a foreign key to students(student_id), so an invoice cannot point at a
 * per-visitor GUEST-XXXXXXXX id that has no students row. Guest invoices therefore all reference ONE fixed system
 * record, created on first use by the service-role client. It holds no personal data: the guest's own details stay on
 * the invoice (email), in the Stripe session metadata (the GUEST-XXXXXXXX reference) and in the Discord alert.
 * Creating a students row per visitor was rejected on purpose: it would let anyone add rows to the roster and pre-seed
 * a row with someone else's email for the sign-up linking trigger to attach later.
 * Deleting this record would delete every guest invoice (ON DELETE CASCADE), so the delete handler refuses it and the
 * admin roster hides it.
 */
export const GUEST_CHECKOUT_STUDENT_ID = 'GUEST-CHECKOUT';
export const GUEST_CHECKOUT_STUDENT_EMAIL = 'guest-checkout@fifs.invalid';

export function isGuestCheckoutRecord(studentId?: unknown, email?: unknown): boolean {
  return String(studentId ?? '').trim().toUpperCase() === GUEST_CHECKOUT_STUDENT_ID
    || String(email ?? '').trim().toLowerCase() === GUEST_CHECKOUT_STUDENT_EMAIL;
}

/** Makes sure the guest-checkout system record exists. Fails closed: callers must not start payment if this is false. */
async function ensureGuestCheckoutStudent(): Promise<{ ok: boolean; detail?: string }> {
  try {
    const supabase = getPrivilegedClient();
    const existing = await supabase.from('students').select('student_id').eq('student_id', GUEST_CHECKOUT_STUDENT_ID).maybeSingle();
    if (existing.error) return { ok: false, detail: `lookup failed (${existing.error.code || 'no code'}): ${existing.error.message}` };
    if (existing.data) return { ok: true };
    const created = await supabase.from('students').insert({
      student_id: GUEST_CHECKOUT_STUDENT_ID,
      full_name: 'Guest Checkout (system record)',
      email: GUEST_CHECKOUT_STUDENT_EMAIL,
      phone: 'N/A',
      course_name: 'Guest checkout',
      internal_notes: 'System record that holds the invoices of visitors who book without signing in. Do not edit or delete: deleting it deletes those invoices.'
    });
    if (created.error) {
      if (created.error.code === '23505') {
        // A concurrent checkout created it first; confirm it is really there before relying on it.
        const again = await supabase.from('students').select('student_id').eq('student_id', GUEST_CHECKOUT_STUDENT_ID).maybeSingle();
        if (!again.error && again.data) return { ok: true };
      }
      return { ok: false, detail: `create failed (${created.error.code || 'no code'}): ${created.error.message}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, detail: `unavailable: ${err?.message}` };
  }
}

const text = (value: unknown, fallback: string, max: number) => {
  const s = String(value ?? '').trim();
  return (s || fallback).slice(0, max);
};

export interface BookingCheckoutResult {
  status: number;
  body: Record<string, any>;
}

/**
 * Creates a Stripe Checkout Session for a course booking and records a PENDING invoice.
 *
 * Security properties:
 * - Prices come only from src/Lib/pricing.ts; client totals are ignored.
 * - Invoice and student identifiers are generated here; client-supplied IDs are ignored.
 * - The invoice is inserted, never upserted, so a request cannot overwrite an existing invoice.
 * - A student record is linked only through a verified Supabase bearer token (students.user_id),
 *   never by email or a browser-supplied identifier.
 */
export async function createBookingCheckout(
  req: { headers: { get(name: string): string | null } },
  input: Record<string, any>
): Promise<BookingCheckoutResult> {
  const email = String(input.email || '').trim().toLowerCase().slice(0, 150);
  if (!email || !EMAIL_PATTERN.test(email)) {
    return { status: 400, body: { success: false, status: 'error', error: 'Valid student email address is required to initiate Stripe checkout.' } };
  }

  const attendees = parseAttendeeCount(input.groupSize);
  if (attendees === null) {
    return { status: 400, body: { success: false, status: 'error', error: 'Group size must be a whole number of attendees from 1 to 5.' } };
  }

  const fullName = text(input.fullName, 'FIFS Training Student', 100);
  const phone = text(input.phone, '', 30);
  const courseSelection = text(input.courseSelection, 'Maryland Firearms Training Course', 200);
  const preferredDates = text(input.preferredDates, 'Coordinated with Lead Instructor Kai Wade', 200);
  const groupSize = text(input.groupSize, '1', 60);
  const comments = text(input.comments, '', 400);
  const classId = text(input.classId, '', 64);
  const isPayFull = Boolean(input.payInFull || input.pay_in_full);

  // Validate environment configuration before any Stripe session or database write.
  let stripeKey: string | null;
  let baseUrl: string;
  try {
    stripeKey = resolveStripeSecretKey();
    baseUrl = getSiteUrl();
    // Confirm the service-role database client up front (no network call) in every environment.
    // Checkout writes invoices only with this client; it never falls back to the public anon key.
    getPrivilegedClient();
  } catch (err) {
    if (err instanceof ConfigurationError) {
      console.error('[Checkout] Configuration error:', err.message);
      return { status: 503, body: { success: false, status: 'error', error: 'Checkout is not configured for this environment. ' + err.message } };
    }
    throw err;
  }
  if (!stripeKey) {
    console.error('[Checkout] STRIPE_SECRET_KEY is not configured.');
    return { status: 503, body: { success: false, status: 'error', error: 'Payment processing is not configured on the server. Please contact FIFS directly.' } };
  }

  // Optional authenticated linking. An absent or invalid token simply means a guest checkout;
  // it never grants access to another student's record.
  let linkedUserId: string | null = null;
  let studentId = generateGuestStudentId();
  if (hasBearerToken(req)) {
    const { user } = await getAuthenticatedUser(req);
    if (user?.id) {
      try {
        const { data: student, error } = await getPrivilegedClient()
          .from('students')
          .select('student_id, user_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) {
          console.warn('[Checkout] Linked student lookup failed; continuing as guest:', error.message);
        } else if (student && student.user_id === user.id && student.student_id) {
          studentId = String(student.student_id);
          linkedUserId = user.id;
        }
      } catch (err: any) {
        console.warn('[Checkout] Linked student lookup unavailable; continuing as guest:', err?.message);
      }
    }
  }

  // The student_id the invoice will carry: the linked student's own id, or the fixed guest-checkout record.
  // Done BEFORE the Stripe session exists, so a database problem here can never leave an open payment session behind.
  let invoiceStudentId = studentId;
  if (!linkedUserId) {
    const ensured = await ensureGuestCheckoutStudent();
    if (!ensured.ok) {
      console.error('[Checkout] Guest checkout record unavailable; payment not started:', ensured.detail);
      await sendDiscordAlert(
        '⚠️ Checkout blocked: guest checkout record unavailable',
        'The system record that guest invoices attach to could not be read or created, so payment was not started. No Stripe session was created.',
        [
          { name: 'Email', value: email, inline: true },
          { name: 'Course Track', value: courseSelection, inline: false },
          { name: 'Database error', value: String(ensured.detail || 'unknown').slice(0, 300), inline: false }
        ],
        0xEF4444
      );
      return { status: 503, body: { success: false, status: 'error', error: 'We could not record your booking, so payment was not started. Please try again in a few minutes or contact FIFS directly.' } };
    }
    invoiceStudentId = GUEST_CHECKOUT_STUDENT_ID;
  }

  const invoiceId = generateInvoiceId();
  const pricing = calculatePricingBreakdown(courseSelection, attendees, isPayFull);

  const stripe = new Stripe(stripeKey, { apiVersion: STRIPE_API_VERSION });
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      client_reference_id: invoiceId,
      metadata: {
        invoiceId,
        studentId,
        invoiceStudentId,
        linkedUserId: linkedUserId || '',
        fullName,
        phone,
        courseSelection,
        preferredDates,
        groupSize,
        attendees: String(attendees),
        comments,
        classId,
        isVip: String(pricing.isVip),
        rangeFee: pricing.rangeFee.toFixed(2),
        mdTax: pricing.mdTax.toFixed(2),
        grandTotal: pricing.grandTotal.toFixed(2),
        depositDueNow: pricing.depositDueNow.toFixed(2),
        balanceDueClass: pricing.balanceDueClass.toFixed(2),
        isDepositPayment: String(!isPayFull)
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: pricing.chargeCents,
            product_data: {
              name: `${courseSelection} — ${isPayFull ? 'Full Tuition & Range Fee' : '30% Reservation Deposit'}`,
              description: `Invoice: ${invoiceId} • Total Course Investment: $${pricing.grandTotal.toFixed(2)} (Tuition + ${pricing.isVip ? 'VIP Range Perk' : "$45 Cindy's Range Fee"} + 6% MD Tax) • ${isPayFull ? 'Paid in Full' : 'Deposit: $' + pricing.depositDueNow.toFixed(2) + ' (Remaining $' + pricing.balanceDueClass.toFixed(2) + ' due on class day)'}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}&booking_confirmed=true&invoice=${encodeURIComponent(invoiceId)}`,
      cancel_url: `${baseUrl}/?booking_cancelled=true&session_id={CHECKOUT_SESSION_ID}&invoice=${encodeURIComponent(invoiceId)}`,
    });
  } catch (stripeErr: any) {
    console.error('[Checkout] Stripe session creation failed:', stripeErr?.message);
    return { status: 502, body: { success: false, status: 'error', error: 'Failed to create secure checkout session. Please try again or contact FIFS.' } };
  }

  if (!session?.url || !session.id) {
    return { status: 502, body: { success: false, status: 'error', error: 'Stripe did not return a valid checkout session.' } };
  }

  // Record the PENDING invoice (insert-only). If it cannot be saved, the customer is not sent to
  // payment: the Stripe session is expired and the request fails (see below).
  let invoiceRecorded = false;
  let invoiceFailure = '';
  let supabase: any = null;
  try {
    supabase = getPrivilegedClient();
    const { error: invoiceErr } = await supabase.from('invoices').insert({
      invoice_number: invoiceId,
      student_id: invoiceStudentId,
      course: courseSelection,
      total_amount: pricing.grandTotal.toFixed(2),
      tuition_amount: pricing.discountedTuition.toFixed(2),
      tax_amount: pricing.mdTax.toFixed(2),
      deposit_due: pricing.depositDueNow.toFixed(2),
      amount_paid: '0.00',
      balance_due: pricing.grandTotal.toFixed(2),
      status: 'PENDING',
      due_date: preferredDates || 'Upon Class Date',
      stripe_session_id: session.id,
      email,
      facility: FACILITY,
      payment_method: 'Stripe Checkout',
      updated_at: new Date().toISOString()
    });
    if (invoiceErr) {
      invoiceFailure = `${invoiceErr.code || 'no code'}: ${invoiceErr.message || 'unknown error'}`;
      const hint = invoiceErr.code === '23503' ? ' (foreign key: the invoice student_id has no matching students row)'
        : invoiceErr.code === '23502' ? ' (a required invoice column was empty)' : '';
      console.error('[Checkout] Pending invoice insert failed:', invoiceFailure + hint);
    } else {
      invoiceRecorded = true;
    }
  } catch (dbErr: any) {
    invoiceFailure = `unavailable: ${dbErr?.message}`;
    console.error('[Checkout] Pending invoice could not be recorded:', dbErr?.message);
  }

  if (!invoiceRecorded) {
    // A payment without a recorded invoice cannot be reconciled reliably, so stop here.
    let sessionExpired = false;
    try {
      await stripe.checkout.sessions.expire(session.id);
      sessionExpired = true;
    } catch (expireErr: any) {
      console.error('[Checkout] Could not expire Stripe session after invoice failure:', expireErr?.message);
    }
    await sendDiscordAlert(
      '⚠️ Checkout blocked: invoice could not be recorded',
      sessionExpired
        ? 'The pending invoice could not be saved, so the Stripe session was expired and the customer was not sent to payment.'
        : `The pending invoice could not be saved and Stripe session ${session.id} could NOT be expired. Check Stripe and reconcile manually if it is paid.`,
      [
        { name: 'Student Name', value: fullName, inline: true },
        { name: 'Email', value: email, inline: true },
        { name: 'Course Track', value: courseSelection, inline: false },
        { name: 'Invoice', value: invoiceId, inline: true },
        { name: 'Database error', value: (invoiceFailure || 'unknown').slice(0, 300), inline: false }
      ],
      0xEF4444
    );
    return { status: 503, body: { success: false, status: 'error', error: 'We could not record your booking, so payment was not started. Please try again in a few minutes or contact FIFS directly.' } };
  }

  const isGuest = !linkedUserId;
  if (isGuest && supabase) {
    try {
      const { error: leadErr } = await supabase.from('leads').insert([{
        full_name: fullName,
        email,
        source: 'Guest Checkout Lead: ' + courseSelection
      }]);
      if (leadErr) console.warn('[Checkout] Lead capture failed:', leadErr.message || leadErr);
    } catch (leadErr: any) {
      console.warn('[Checkout] Lead capture failed:', leadErr?.message);
    }
  }

  await sendDiscordAlert(
    isGuest ? `🚨 New Guest Checkout: ${fullName}` : `🎯 New Course Enrollment Checkout: ${fullName}`,
    `${isGuest ? 'Guest (no linked portal account)' : 'Linked student portal account'} started checkout for ${courseSelection}.`,
    [
      { name: 'Student Name', value: fullName, inline: true },
      { name: 'Classification', value: isGuest ? 'Guest' : 'Verified Student', inline: true },
      { name: 'Email', value: email, inline: true },
      { name: 'Phone', value: phone || 'Not provided', inline: true },
      { name: 'Course Track', value: courseSelection + (pricing.isVip ? ' (VIP Turnkey)' : ' (Standard Base)'), inline: false },
      { name: 'Attendees', value: String(attendees), inline: true },
      { name: isPayFull ? 'Charged Now (Full)' : 'Deposit Due Now', value: '$' + (pricing.chargeCents / 100).toFixed(2), inline: true },
      { name: 'Total Investment', value: '$' + pricing.grandTotal.toFixed(2), inline: true },
      { name: 'Invoice', value: invoiceId, inline: true }
    ],
    isGuest ? 0xF59E0B : 0x00E5FF
  );

  return {
    status: 200,
    body: {
      success: true,
      status: 'success',
      url: session.url,
      checkoutUrl: session.url,
      sessionId: session.id,
      invoiceId,
      studentId,
      attendees,
      isVip: pricing.isVip,
      invoiceRecorded
    }
  };
}
