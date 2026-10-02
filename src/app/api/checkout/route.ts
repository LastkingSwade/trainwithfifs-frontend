import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Server-side Supabase client using Service Role key
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ufqnmcincwnlyiwsmzcq.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

// Course pricing synchronization constants
const COURSE_PRICING: Record<string, { base: number; vip: number }> = {
  mastery: { base: 425.00, vip: 550.00 },
  combo: { base: 249.99, vip: 375.00 },
  ccw: { base: 249.99, vip: 375.00 },
  renewal: { base: 149.99, vip: 249.99 },
  hql: { base: 100.00, vip: 165.00 },
  coaching: { base: 125.00, vip: 195.00 },
  cleaning: { base: 75.00, vip: 115.00 },
  children: { base: 199.99, vip: 265.00 },
  alumni: { base: 65.00, vip: 115.00 }
};

export function calculatePricingBreakdown(courseSelection: string, groupSize: string = '1', isPayFull: boolean = false) {
  const isVip = /VIP/i.test(courseSelection || '');
  const clean = (courseSelection || '').toLowerCase();

  let baseTuitionPerPerson = 249.99;
  if (clean.includes('mastery') || clean.includes('multi-state') || clean.includes('multistate')) {
    baseTuitionPerPerson = isVip ? COURSE_PRICING.mastery.vip : COURSE_PRICING.mastery.base;
  } else if (clean.includes('renewal')) {
    baseTuitionPerPerson = isVip ? COURSE_PRICING.renewal.vip : COURSE_PRICING.renewal.base;
  } else if (clean.includes('combo')) {
    baseTuitionPerPerson = isVip ? COURSE_PRICING.combo.vip : COURSE_PRICING.combo.base;
  } else if (clean.includes('hql')) {
    baseTuitionPerPerson = isVip ? COURSE_PRICING.hql.vip : COURSE_PRICING.hql.base;
  } else if (clean.includes('ccw') || clean.includes('wear & carry')) {
    baseTuitionPerPerson = isVip ? COURSE_PRICING.ccw.vip : COURSE_PRICING.ccw.base;
  } else if (clean.includes('coaching')) {
    baseTuitionPerPerson = isVip ? COURSE_PRICING.coaching.vip : COURSE_PRICING.coaching.base;
  } else if (clean.includes('cleaning')) {
    baseTuitionPerPerson = isVip ? COURSE_PRICING.cleaning.vip : COURSE_PRICING.cleaning.base;
  } else if (clean.includes('children')) {
    baseTuitionPerPerson = isVip ? COURSE_PRICING.children.vip : COURSE_PRICING.children.base;
  } else if (clean.includes('alumni')) {
    baseTuitionPerPerson = isVip ? COURSE_PRICING.alumni.vip : COURSE_PRICING.alumni.base;
  }

  // Attendees & discount
  let attendees = 1;
  let discountPercent = 0;
  const str = String(groupSize || '1');
  if (/^2|2 \(paired/i.test(str)) {
    attendees = 2;
    discountPercent = 0.05;
  } else if (/^[34]|[34] \(small/i.test(str)) {
    attendees = 3;
    discountPercent = 0.10;
  } else if (/5\+/i.test(str) || /^5/i.test(str)) {
    attendees = 5;
    discountPercent = 0.15;
  }

  const rawTuition = baseTuitionPerPerson * attendees;
  const discountAmount = rawTuition * discountPercent;
  const discountedTuition = rawTuition - discountAmount;
  // Cindy's Hot Shots range lane fee: $45.00 per person if Base track, $0.00 if VIP Turnkey
  const rangeFee = isVip ? 0 : (45.00 * attendees);
  const subtotal = discountedTuition + rangeFee;
  // Maryland 6% sales tax
  const mdTax = subtotal * 0.06;
  const grandTotal = subtotal + mdTax;
  // Required 30% deposit due now
  const depositDueNow = grandTotal * 0.30;
  const balanceDueClass = grandTotal - depositDueNow;

  return {
    isVip,
    attendees,
    baseTuitionPerPerson,
    rawTuition,
    discountPercent,
    discountAmount,
    discountedTuition,
    rangeFee,
    subtotal,
    mdTax,
    grandTotal,
    depositDueNow,
    balanceDueClass,
    chargeAmount: isPayFull ? grandTotal : depositDueNow
  };
}

/**
 * POST /api/checkout - Create Stripe Checkout Session with Abandonment Protection
 */
export async function POST(req: NextRequest) {
  try {
    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY environment variable on server.');
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Stripe configuration missing on server. Set STRIPE_SECRET_KEY in environment variables.' 
        },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16' as any,
    });

    let body: any = {};
    try {
      body = await req.json();
    } catch (_parseErr) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Invalid or malformed JSON payload in checkout request.' 
        },
        { status: 400 }
      );
    }

    const {
      invoiceId = 'INV-FI-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      studentId = 'FIFS-' + Math.floor(1000 + Math.random() * 9000),
      fullName = 'FIFS Training Student',
      email,
      phone = '',
      courseSelection = 'Maryland Firearms Training Course',
      preferredDates = 'Coordinated with Lead Instructor Kai Wade',
      amount,
      groupSize = '1',
      comments = '',
      classId = ''
    } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Valid student email address is required to initiate Stripe checkout.' 
        },
        { status: 400 }
      );
    }

    const isPayFull = Boolean(body.payInFull || body.pay_in_full);
    const pricing = calculatePricingBreakdown(courseSelection, groupSize, isPayFull);
    const unitAmountCents = Math.round(pricing.chargeAmount * 100);

    const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://trainwithfifs.com';
    const baseUrl = origin.replace(/\/+$/, '');

    // 1. Initialize Stripe Checkout Session
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: email,
        client_reference_id: studentId,
        metadata: {
          invoiceId,
          studentId,
          fullName,
          phone,
          courseSelection,
          preferredDates,
          groupSize: String(groupSize),
          comments: String(comments).slice(0, 400),
          classId: classId || '',
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
              unit_amount: unitAmountCents,
              product_data: {
                name: `${courseSelection} — ${isPayFull ? 'Full Tuition & Range Fee' : '30% Reservation Deposit'}`,
                description: `Invoice: ${invoiceId} • Total Course Investment: $${pricing.grandTotal.toFixed(2)} (Tuition + ${pricing.isVip ? 'VIP Range Perk' : '$45 Cindy\'s Range Fee'} + 6% MD Tax) • ${isPayFull ? 'Paid in Full' : 'Deposit: $' + pricing.depositDueNow.toFixed(2) + ' (Remaining $' + pricing.balanceDueClass.toFixed(2) + ' due on class day)'}`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}&booking_confirmed=true&invoice=${encodeURIComponent(invoiceId)}`,
        cancel_url: `${baseUrl}/?booking_cancelled=true&session_id={CHECKOUT_SESSION_ID}&invoice=${encodeURIComponent(invoiceId)}`,
      });
    } catch (stripeErr: any) {
      console.error('Stripe SDK session creation failure:', stripeErr);
      return NextResponse.json(
        { 
          status: 'error',
          error: stripeErr?.message || 'Payment provider rejected session configuration.' 
        },
        { status: 502 }
      );
    }

    if (!session || !session.url) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Stripe did not return a valid session redirect URL.' 
        },
        { status: 502 }
      );
    }

    // 2. Pre-record invoice in Supabase with 'PENDING' status for state tracking and abandonment recovery
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('invoices')
          .upsert({
            invoice_number: invoiceId,
            student_id: studentId,
            course: courseSelection,
            total_amount: pricing.grandTotal.toFixed(2),
            tuition_amount: pricing.discountedTuition.toFixed(2),
            tax_amount: pricing.mdTax.toFixed(2),
            deposit_due: pricing.depositDueNow.toFixed(2),
            amount_paid: '0.00',
            balance_due: pricing.balanceDueClass.toFixed(2),
            status: 'PENDING',
            due_date: preferredDates || 'Upon Class Date',
            stripe_session_id: session.id,
            email: email,
            facility: "Cindy's Hot Shots (115 Holsum Way, Glen Burnie, MD 21060)",
            payment_method: 'Stripe Checkout',
            updated_at: new Date().toISOString()
          }, { onConflict: 'invoice_number' });
      } catch (dbErr) {
        console.warn('Non-fatal: Failed to pre-record pending invoice in Supabase:', dbErr);
      }
    }

    return NextResponse.json({
      status: 'success',
      url: session.url,
      checkoutUrl: session.url,
      sessionId: session.id,
      invoiceId,
      studentId,
    });
  } catch (error: any) {
    console.error('Unhandled error in Stripe checkout route:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error?.message || 'Internal server error while initializing payment checkout.' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/checkout - Handle Checkout Abandonment, Return Invalidation & Session Status Check
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    const invoiceId = searchParams.get('invoice');
    const action = searchParams.get('action') || (searchParams.get('booking_cancelled') === 'true' ? 'cancel' : 'check');

    if (!sessionId && !invoiceId) {
      return NextResponse.json({ status: 'error', error: 'Missing session_id or invoice identifier.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // 1. Handle abandonment or cancellation explicitly
    if (action === 'cancel' || action === 'abandon') {
      if (supabase) {
        try {
          const updateQuery = supabase.from('invoices').update({
            status: action === 'abandon' ? 'ABANDONED' : 'CANCELLED',
            updated_at: new Date().toISOString()
          });

          if (sessionId) {
            await updateQuery.eq('stripe_session_id', sessionId);
          } else if (invoiceId) {
            await updateQuery.eq('invoice_number', invoiceId);
          }
        } catch (dbErr) {
          console.warn('Failed to update invoice abandonment status in Supabase:', dbErr);
        }
      }

      return NextResponse.json({
        status: 'success',
        sessionState: action === 'abandon' ? 'abandoned' : 'cancelled',
        message: 'Checkout session marked as abandoned/cancelled gracefully.'
      });
    }

    // 2. Query Stripe for verified session status if session_id provided
    if (sessionId && stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' as any });
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Update database if expired or paid
        if (supabase) {
          if (session.status === 'expired') {
            await supabase.from('invoices').update({ status: 'ABANDONED', updated_at: new Date().toISOString() }).eq('stripe_session_id', sessionId);
          } else if (session.payment_status === 'paid') {
            await supabase.from('invoices').update({ status: 'PAID', amount_paid: (session.amount_total || 0) / 100, balance_due: 0, updated_at: new Date().toISOString() }).eq('stripe_session_id', sessionId);
          }
        }

        return NextResponse.json({
          status: 'success',
          session: {
            id: session.id,
            status: session.status,
            paymentStatus: session.payment_status,
            customerEmail: session.customer_email,
            amountTotal: session.amount_total
          }
        });
      } catch (stripeErr: any) {
        console.warn('Stripe session retrieval warning:', stripeErr?.message);
        return NextResponse.json({
          status: 'warning',
          message: 'Unable to retrieve session from Stripe.',
          error: stripeErr?.message
        }, { status: 404 });
      }
    }

    return NextResponse.json({ status: 'success', message: 'Session check complete.' });
  } catch (err: any) {
    console.error('Unhandled exception in checkout GET return handler:', err);
    return NextResponse.json(
      { status: 'error', error: err?.message || 'Graceful recovery from checkout abandonment check error.' },
      { status: 200 }
    );
  }
}

