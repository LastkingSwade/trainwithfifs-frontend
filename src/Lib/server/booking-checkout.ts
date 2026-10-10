import crypto from 'node:crypto';
import Stripe from 'stripe';
import { recordPodCodeOnInvoice } from './group-status';
import { calculatePricingBreakdown, displayCourseLabel, isAlumniCourse, parseAttendeeCount } from '../pricing';
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

// Roles allowed to reserve the alumni clinic: Client Portal members, and staff booking for them.
const ALUMNI_BOOKING_ROLES = ['client', 'admin', 'instructor', 'staff'];

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

  let attendees = parseAttendeeCount(input.groupSize);
  if (attendees === null) {
    return { status: 400, body: { success: false, status: 'error', error: 'Group size must be a whole number of attendees from 1 to 5.' } };
  }

  const fullName = text(input.fullName, 'FIFS Training Student', 100);
  const phone = text(input.phone, '', 30);
  let courseSelection = text(input.courseSelection, 'Maryland Firearms Training Course', 200);
  let preferredDates = text(input.preferredDates, 'Coordinated with Lead Instructor Kai Wade', 200);
  let groupSize = text(input.groupSize, '1', 60);
  const comments = text(input.comments, '', 400);
  const classId = text(input.classId, '', 64);
  const isPayFull = Boolean(input.payInFull || input.pay_in_full);

  // Joining a leader's private pod: the pod decides the course, track and dates; the member books ONE seat at the normal
  // single-person price (no group discount), whatever group size or course the browser sent. The seat is claimed just before
  // payment starts (below) and given back if checkout cannot start or the unpaid session expires.
  const podCodeInput = normalizePodCode(input.podCode);
  let podMember: PodInfo | null = null;
  if (podCodeInput) {
    const found = await lookupPod(podCodeInput);
    if (!found.ok) return { status: found.status, body: { success: false, status: 'error', error: found.message } };
    podMember = found.pod;
    attendees = 1;
    groupSize = '1 (Private One-on-One)';
    if (podMember.course) courseSelection = podMember.course.slice(0, 200);
    if (podMember.preferredDates) preferredDates = podMember.preferredDates.slice(0, 200);
  }

  // The alumni clinic is for signed-in Client Portal members (staff may book on a member's behalf). The website shows a sign-in
  // pop-up; this is the server's own check, made before any invoice or Stripe session exists, so the pop-up cannot be bypassed.
  if (isAlumniCourse(courseSelection)) {
    const alumniUser = hasBearerToken(req) ? (await getAuthenticatedUser(req)).user : null;
    const alumniRole = String(alumniUser?.app_metadata?.role || '').toLowerCase();
    if (!alumniUser?.id || !ALUMNI_BOOKING_ROLES.includes(alumniRole)) {
      return { status: 401, body: { success: false, status: 'error', requiresClientLogin: true, error: 'You need to be logged in to the Future Initiative Client Portal to reserve the FIFS Graduate Alumni clinic.' } };
    }
  }

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

  let podSeatClaimed = false;
  if (podMember) {
    const claim = await claimPodSeat(podMember.code);
    if (!claim.ok) return { status: claim.status, body: { success: false, status: 'error', error: claim.message } };
    podSeatClaimed = true;
  }
  const releaseClaimedPodSeat = async () => {
    if (podMember && podSeatClaimed) { podSeatClaimed = false; await releasePodSeat(podMember.code); }
  };

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
        isDepositPayment: String(!isPayFull),
        ...(podMember ? { podCode: podMember.code, podRole: 'member' } : {})
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: pricing.chargeCents,
            product_data: {
              name: `${displayCourseLabel(courseSelection)} — ${isPayFull ? 'Full Tuition & Range Fee' : '30% Reservation Deposit'}`,
              description: `Invoice: ${invoiceId} • Total Course Investment: $${pricing.grandTotal.toFixed(2)} (Tuition + ${pricing.isVip ? 'VIP Range Perk' : "$45 Cindy's Range Fee"} + 6% MD Tax) • ${isPayFull ? 'Paid in Full' : 'Deposit: $' + pricing.depositDueNow.toFixed(2) + ' (Remaining $' + pricing.balanceDueClass.toFixed(2) + ' due on class day)'}`,
            },
          },
          quantity: 1,
        },
      ],
      ...(podMember ? { expires_at: Math.floor(Date.now() / 1000) + POD_MEMBER_SESSION_MINUTES * 60 } : {}),
      success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}&booking_confirmed=true&invoice=${encodeURIComponent(invoiceId)}`,
      cancel_url: `${baseUrl}/?booking_cancelled=true&session_id={CHECKOUT_SESSION_ID}&invoice=${encodeURIComponent(invoiceId)}`,
    });
  } catch (stripeErr: any) {
    console.error('[Checkout] Stripe session creation failed:', stripeErr?.message);
    await releaseClaimedPodSeat();
    return { status: 502, body: { success: false, status: 'error', error: 'Failed to create secure checkout session. Please try again or contact FIFS.' } };
  }

  if (!session?.url || !session.id) {
    await releaseClaimedPodSeat();
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
      // A member's booking is tagged with the group code so the organizer's view can list it (best effort; never blocks the booking).
      if (podMember) await recordPodCodeOnInvoice(supabase, invoiceId, podMember.code);
    }
  } catch (dbErr: any) {
    invoiceFailure = `unavailable: ${dbErr?.message}`;
    console.error('[Checkout] Pending invoice could not be recorded:', dbErr?.message);
  }

  if (!invoiceRecorded) {
    // A payment without a recorded invoice cannot be reconciled reliably, so stop here.
    await releaseClaimedPodSeat();
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
      { name: 'Course Track', value: courseSelection + (pricing.isVip ? ' (VIP)' : ' (Standard Base)'), inline: false },
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


/**
 * Creates the private pod invite code (FIFS-POD-XXXX) for a booking of two or more people, with the server key.
 * Never throws: the booking and payment link already exist, so a missing pod code is logged and returned as null.
 * Used by both booking entry points (/api/checkout, which the website calls, and the /api/fifs submitBooking action).
 */
export async function createPodInviteCode(payload: any, result: { attendees?: number; isVip?: boolean; sessionId?: string; invoiceId?: string }): Promise<string | null> {
  if (!result || !(Number(result.attendees) > 1)) return null;
  try {
    const pricingCourse = String(payload?.courseSelection || 'Maryland Firearms Training Course').trim().slice(0, 200);
    const { data: codeData, error: podRpcErr } = await getPrivilegedClient().rpc('create_booking_group', {
      p_leader_name: String(payload?.fullName || 'FIFS Training Student').trim().slice(0, 100),
      p_leader_email: String(payload?.email || '').trim().toLowerCase(),
      p_leader_phone: String(payload?.phone || '').trim().slice(0, 30) || null,
      p_course: pricingCourse,
      p_track: result.isVip ? 'VIP' : 'Base',
      p_preferred_dates: String(payload?.preferredDates || 'Coordinated with Lead Instructor Kai Wade').trim().slice(0, 200),
      p_max_seats: result.attendees
    });
    if (podRpcErr) {
      console.warn('[FIFS] Pod invite code was not created:', podRpcErr.code || 'no code', podRpcErr.message);
      return null;
    }
    const podCode: string | null = codeData ?? null;
    // Tag the organizer's own invoice with the group code too (best effort).
    if (podCode && result.invoiceId) await recordPodCodeOnInvoice(getPrivilegedClient(), result.invoiceId, podCode);
    // Tag the leader's open Stripe session with the pod, so the checkout.session.expired webhook can cancel a pod whose
    // leader never paid. Best effort: the booking and payment link already exist.
    if (podCode && typeof result.sessionId === 'string' && result.sessionId) {
      try {
        const stripeKey = resolveStripeSecretKey();
        if (stripeKey) {
          await new Stripe(stripeKey, { apiVersion: STRIPE_API_VERSION }).checkout.sessions.update(result.sessionId, { metadata: { podCode, podRole: 'leader' } });
        }
      } catch (tagErr: any) {
        console.warn('[FIFS] Pod code could not be attached to the Stripe session:', tagErr?.message);
      }
    }
    return podCode;
  } catch (podErr) {
    console.warn('[FIFS] Pod generation note:', podErr);
    return null;
  }
}


// ---- Private pod codes: members join a leader's pod (they pay the normal single-person price) ----
export const POD_CODE_PATTERN = /^FIFS-POD-[A-Z0-9]{4}$/;
// A member's checkout session expires 30 minutes after it starts (Stripe's minimum), so a seat claimed by a checkout that is
// never paid is released soon after by the checkout.session.expired webhook.
export const POD_MEMBER_SESSION_MINUTES = 31;

export function normalizePodCode(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

export interface PodInfo {
  code: string;
  course: string;
  track: string;
  preferredDates: string;
  maxSeats: number;
  claimedSeats: number;
}
export type PodLookup = { ok: true; pod: PodInfo } | { ok: false; status: number; message: string };

/** Read-only check that a pod code exists, is ACTIVE and has a free seat. Uses the server key; never throws. */
export async function lookupPod(rawCode: unknown): Promise<PodLookup> {
  const code = normalizePodCode(rawCode);
  if (!POD_CODE_PATTERN.test(code)) return { ok: false, status: 400, message: 'That pod code is not valid.' };
  try {
    const { data, error } = await getPrivilegedClient()
      .from('booking_groups')
      .select('invite_code, course, track, preferred_dates, max_seats, claimed_seats, status')
      .eq('invite_code', code)
      .maybeSingle();
    if (error) {
      console.warn('[Pod] Lookup failed:', error.code || 'no code', error.message);
      return { ok: false, status: 503, message: 'Pod codes are temporarily unavailable. Please try again in a few minutes.' };
    }
    if (!data) return { ok: false, status: 404, message: 'That pod code was not found.' };
    if (data.status !== 'ACTIVE') return { ok: false, status: 409, message: 'This private pod is no longer active.' };
    const maxSeats = Number(data.max_seats) || 0;
    const claimedSeats = Number(data.claimed_seats) || 0;
    if (claimedSeats >= maxSeats) return { ok: false, status: 409, message: 'This private pod is already full.' };
    return { ok: true, pod: { code, course: String(data.course || ''), track: String(data.track || ''), preferredDates: String(data.preferred_dates || ''), maxSeats, claimedSeats } };
  } catch (err: any) {
    console.warn('[Pod] Lookup unavailable:', err?.message);
    return { ok: false, status: 503, message: 'Pod codes are temporarily unavailable. Please try again in a few minutes.' };
  }
}

/** Claims one seat atomically: the update only matches if claimed_seats is still the value just read, so two members cannot take the last seat. */
export async function claimPodSeat(rawCode: unknown): Promise<PodLookup> {
  const code = normalizePodCode(rawCode);
  for (let attempt = 0; attempt < 3; attempt++) {
    const found = await lookupPod(code);
    if (!found.ok) return found;
    try {
      const { data, error } = await getPrivilegedClient()
        .from('booking_groups')
        .update({ claimed_seats: found.pod.claimedSeats + 1, updated_at: new Date().toISOString() })
        .eq('invite_code', code)
        .eq('status', 'ACTIVE')
        .eq('claimed_seats', found.pod.claimedSeats)
        .select('invite_code');
      if (error) {
        console.warn('[Pod] Seat claim failed:', error.code || 'no code', error.message);
        return { ok: false, status: 503, message: 'Pod codes are temporarily unavailable. Please try again in a few minutes.' };
      }
      if (Array.isArray(data) && data.length === 1) return { ok: true, pod: { ...found.pod, claimedSeats: found.pod.claimedSeats + 1 } };
    } catch (err: any) {
      console.warn('[Pod] Seat claim unavailable:', err?.message);
      return { ok: false, status: 503, message: 'Pod codes are temporarily unavailable. Please try again in a few minutes.' };
    }
  }
  return { ok: false, status: 409, message: 'That seat was just taken. Please try again.' };
}

/** Gives a claimed seat back (never below the leader's own seat). Best effort: logs and returns false instead of throwing. */
export async function releasePodSeat(rawCode: unknown): Promise<boolean> {
  const code = normalizePodCode(rawCode);
  if (!POD_CODE_PATTERN.test(code)) return false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const client = getPrivilegedClient();
      const { data, error } = await client.from('booking_groups').select('claimed_seats').eq('invite_code', code).maybeSingle();
      if (error || !data) return false;
      const claimed = Number(data.claimed_seats) || 0;
      if (claimed <= 1) return true;
      const { data: updated, error: updateErr } = await client
        .from('booking_groups')
        .update({ claimed_seats: claimed - 1, updated_at: new Date().toISOString() })
        .eq('invite_code', code)
        .eq('claimed_seats', claimed)
        .select('invite_code');
      if (updateErr) { console.warn('[Pod] Seat release failed:', updateErr.code || 'no code', updateErr.message); return false; }
      if (Array.isArray(updated) && updated.length === 1) return true;
    } catch (err: any) {
      console.warn('[Pod] Seat release unavailable:', err?.message);
      return false;
    }
  }
  return false;
}

/** Marks a leader's pod CANCELLED when their checkout expired unpaid and nobody else has joined. Best effort; never throws. */
export async function cancelUnpaidLeaderPod(rawCode: unknown): Promise<boolean> {
  const code = normalizePodCode(rawCode);
  if (!POD_CODE_PATTERN.test(code)) return false;
  try {
    const { data, error } = await getPrivilegedClient()
      .from('booking_groups')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('invite_code', code)
      .eq('status', 'ACTIVE')
      .lte('claimed_seats', 1)
      .select('invite_code');
    if (error) { console.warn('[Pod] Leader pod cancel failed:', error.code || 'no code', error.message); return false; }
    return Array.isArray(data) && data.length === 1;
  } catch (err: any) {
    console.warn('[Pod] Leader pod cancel unavailable:', err?.message);
    return false;
  }
}
