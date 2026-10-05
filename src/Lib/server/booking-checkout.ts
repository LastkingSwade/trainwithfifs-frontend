import crypto from 'node:crypto';
import Stripe from 'stripe';
import { calculatePricingBreakdown, parseAttendeeCount } from '../pricing';
import { getAuthenticatedUser, getPrivilegedClient, hasBearerToken } from './supabase-admin';
import { sendDiscordAlert } from './discord';

export const STRIPE_API_VERSION = '2023-10-16' as any;
const FACILITY = "Cindy's Hot Shots (115 Holsum Way, Glen Burnie, MD 21060)";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Trusted public site origin for Stripe return URLs. Never derived from request
 * Origin/Referer headers, which callers control.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || 'https://trainwithfifs.com';
  try {
    const url = new URL(configured);
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.origin;
  } catch {}
  return 'https://trainwithfifs.com';
}

// Server-generated identifiers. Request-supplied invoice/student IDs are ignored.
function generateInvoiceId(): string {
  return `INV-FI-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function generateGuestStudentId(): string {
  return `GUEST-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
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

  const stripeKey = process.env.STRIPE_SECRET_KEY;
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

  const invoiceId = generateInvoiceId();
  const pricing = calculatePricingBreakdown(courseSelection, attendees, isPayFull);
  const baseUrl = getSiteUrl();

  let session: Stripe.Checkout.Session;
  try {
    const stripe = new Stripe(stripeKey, { apiVersion: STRIPE_API_VERSION });
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      client_reference_id: invoiceId,
      metadata: {
        invoiceId,
        studentId,
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

  // Record the PENDING invoice (insert-only). Failure does not block the customer, but staff are
  // alerted so the payment can be reconciled manually when the webhook cannot find the invoice.
  let invoiceRecorded = false;
  let supabase: any = null;
  try {
    supabase = getPrivilegedClient();
    const { error: invoiceErr } = await supabase.from('invoices').insert({
      invoice_number: invoiceId,
      student_id: studentId,
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
      console.error('[Checkout] Pending invoice insert failed:', invoiceErr.message || invoiceErr);
    } else {
      invoiceRecorded = true;
    }
  } catch (dbErr: any) {
    console.error('[Checkout] Pending invoice could not be recorded:', dbErr?.message);
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
    invoiceRecorded
      ? `${isGuest ? 'Guest (no linked portal account)' : 'Linked student portal account'} started checkout for ${courseSelection}.`
      : `⚠️ Checkout started but the pending invoice could NOT be recorded. Reconcile Stripe session ${session.id} manually.`,
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
    invoiceRecorded ? (isGuest ? 0xF59E0B : 0x00E5FF) : 0xEF4444
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
