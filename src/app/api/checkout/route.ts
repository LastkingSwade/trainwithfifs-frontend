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
  mastery: { base: 42500, vip: 55000 },
  combo: { base: 24999, vip: 37500 },
  ccw: { base: 19999, vip: 32500 },
  renewal: { base: 14999, vip: 24999 },
  hql: { base: 10000, vip: 19500 },
  coaching: { base: 12500, vip: 16500 },
  cleaning: { base: 8500, vip: 11500 },
  children: { base: 7500, vip: 9500 },
  alumni: { base: 6500, vip: 9500 }
};

function resolvePriceCents(courseSelection: string, requestedAmount?: number): number {
  if (typeof requestedAmount === 'number' && requestedAmount > 0) {
    return requestedAmount > 1000 ? Math.round(requestedAmount) : Math.round(requestedAmount * 100);
  }
  const clean = (courseSelection || '').toLowerCase();
  if (clean.includes('mastery') || clean.includes('multi-state') || clean.includes('multistate')) {
    return clean.includes('vip') ? COURSE_PRICING.mastery.vip : COURSE_PRICING.mastery.base;
  }
  if (clean.includes('renewal')) {
    return clean.includes('vip') ? COURSE_PRICING.renewal.vip : COURSE_PRICING.renewal.base;
  }
  if (clean.includes('combo')) {
    return clean.includes('vip') ? COURSE_PRICING.combo.vip : COURSE_PRICING.combo.base;
  }
  if (clean.includes('hql')) {
    return clean.includes('vip') ? COURSE_PRICING.hql.vip : COURSE_PRICING.hql.base;
  }
  if (clean.includes('ccw') || clean.includes('wear & carry')) {
    return clean.includes('vip') ? COURSE_PRICING.ccw.vip : COURSE_PRICING.ccw.base;
  }
  return 24999;
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

    const unitAmount = resolvePriceCents(courseSelection, amount);
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
          classId: classId || ''
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: unitAmount,
              product_data: {
                name: courseSelection,
                description: `Invoice: ${invoiceId} • Student: ${fullName} • Schedule: ${preferredDates}`,
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
            total_amount: (unitAmount / 100).toFixed(2),
            amount_paid: '0.00',
            balance_due: (unitAmount / 100).toFixed(2),
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
