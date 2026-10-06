import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createBookingCheckout, STRIPE_API_VERSION } from '@/Lib/server/booking-checkout';
import { getPrivilegedClient, resolveStripeSecretKey } from '@/Lib/server/supabase-admin';
import { ConfigurationError } from '@/Lib/config/environment';

/**
 * POST /api/checkout - Create Stripe Checkout Session (server-priced, server-generated IDs)
 */
export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch (_parseErr) {
    return NextResponse.json(
      { status: 'error', error: 'Invalid or malformed JSON payload in checkout request.' },
      { status: 400 }
    );
  }
  if (!body || typeof body !== 'object') body = {};

  try {
    const result = await createBookingCheckout(req, body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    console.error('Unhandled error in Stripe checkout route:', error?.message);
    return NextResponse.json(
      { status: 'error', error: 'Internal server error while initializing payment checkout.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/checkout - Read-only session status check, and Stripe-verified cancellation.
 *
 * Payment state is written only by the signed Stripe webhook. Cancellation requires a
 * Stripe Checkout Session ID, is confirmed against Stripe (an unpaid, non-complete session),
 * and only moves a PENDING invoice for that exact session to CANCELLED/ABANDONED.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = (searchParams.get('session_id') || '').trim();
    const action = searchParams.get('action') || (searchParams.get('booking_cancelled') === 'true' ? 'cancel' : 'check');

    if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
      return NextResponse.json({ status: 'error', error: 'A valid Stripe checkout session_id is required.' }, { status: 400 });
    }

    let stripeKey: string | null;
    try {
      stripeKey = resolveStripeSecretKey();
    } catch (cfgErr) {
      if (cfgErr instanceof ConfigurationError) {
        return NextResponse.json({ status: 'error', error: 'Payment processing is not configured for this environment. ' + cfgErr.message }, { status: 503 });
      }
      throw cfgErr;
    }
    if (!stripeKey) {
      return NextResponse.json({ status: 'error', error: 'Payment processing is not configured on the server.' }, { status: 503 });
    }

    let session: Stripe.Checkout.Session;
    try {
      const stripe = new Stripe(stripeKey, { apiVersion: STRIPE_API_VERSION });
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeErr: any) {
      console.warn('Stripe session retrieval failed:', stripeErr?.message);
      return NextResponse.json({ status: 'error', error: 'Unable to retrieve checkout session.' }, { status: 404 });
    }

    const sessionSummary = {
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total
    };

    if (action === 'cancel' || action === 'abandon') {
      if (session.status === 'complete' || session.payment_status !== 'unpaid') {
        // Never cancel a paid or completed checkout.
        return NextResponse.json({ status: 'success', sessionState: 'complete', cancelled: false, session: sessionSummary });
      }

      let supabase: any;
      try {
        supabase = getPrivilegedClient();
      } catch (cfgErr: any) {
        console.error('Checkout cancellation unavailable:', cfgErr?.message);
        return NextResponse.json({ status: 'error', error: 'Database service unavailable.' }, { status: 503 });
      }

      const { data: updated, error: updateErr } = await supabase
        .from('invoices')
        .update({
          status: action === 'abandon' ? 'ABANDONED' : 'CANCELLED',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_session_id', session.id)
        .eq('status', 'PENDING')
        .select('invoice_number');

      if (updateErr) {
        console.error('Failed to record checkout cancellation:', updateErr.message || updateErr);
        return NextResponse.json({ status: 'error', error: 'Could not record checkout cancellation.' }, { status: 500 });
      }

      return NextResponse.json({
        status: 'success',
        sessionState: action === 'abandon' ? 'abandoned' : 'cancelled',
        cancelled: Array.isArray(updated) && updated.length > 0,
        session: sessionSummary
      });
    }

    return NextResponse.json({ status: 'success', session: sessionSummary });
  } catch (err: any) {
    console.error('Unhandled exception in checkout GET handler:', err?.message);
    return NextResponse.json({ status: 'error', error: 'Checkout status check failed.' }, { status: 500 });
  }
}
