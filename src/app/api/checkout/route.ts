import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ufqnmcincwnlyiwsmzcq.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    if (!stripeSecretKey) {
      console.error('[Stripe Checkout Error]: Missing STRIPE_SECRET_KEY environment variable.');
      return NextResponse.json(
        { error: 'Stripe configuration missing on server. Set STRIPE_SECRET_KEY in environment variables.' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16' as any,
    });

    const body = await req.json().catch(() => ({}));
    const {
      invoiceId = 'INV-FI-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      studentId = 'FIFS-' + Math.floor(1000 + Math.random() * 9000),
      fullName = 'FIFS Training Student',
      email,
      phone = '',
      courseId = 'ccw',
      courseSelection = 'Maryland Firearms Training Course',
      preferredDates = 'Coordinated with Lead Instructor Kai Wade',
      amount = 24999,
      groupSize = '1',
      comments = '',
      tier = 'base',
    } = body;

    // Standardize unit amount: Multi-State Mastery Base: $425 (42500), VIP: $550 (55000)
    let unitAmount = 24999;
    if (typeof amount === 'number' && amount > 0) {
      unitAmount = amount > 1000 ? Math.round(amount) : Math.round(amount * 100);
    }

    // Map course ID specifically for Maryland Wear & Carry renewal
    let resolvedCourseId = courseId;
    if (courseSelection.toLowerCase().includes('renewal')) {
      resolvedCourseId = 'md-wear-carry-renewal';
    }

    const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://trainwithfifs.com';
    const baseUrl = origin.replace(/\/+$/, '');

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: email && email.includes('@') ? email : undefined,
        client_reference_id: studentId,
        metadata: {
          invoiceId,
          studentId,
          fullName,
          phone,
          courseId: resolvedCourseId,
          courseSelection,
          preferredDates,
          groupSize: String(groupSize),
          comments: String(comments).slice(0, 400),
          tier: String(tier),
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
        cancel_url: `${baseUrl}/?booking_cancelled=true&invoice=${encodeURIComponent(invoiceId)}&session_id={CHECKOUT_SESSION_ID}`,
      });
    } catch (stripeErr: any) {
      console.error('[Stripe Session Creation Error]:', stripeErr);
      return NextResponse.json(
        { error: stripeErr?.message || 'Failed to initialize payment session with Stripe.' },
        { status: 502 }
      );
    }

    if (!session || !session.url) {
      return NextResponse.json(
        { error: 'Stripe did not return a valid session redirect URL.' },
        { status: 502 }
      );
    }

    // Log initialized invoice/session in Supabase for state tracking & abandonment recovery
    try {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        await supabase.from('invoices').upsert({
          student_id: studentId,
          invoice_id: invoiceId,
          status: 'PENDING_CHECKOUT',
          amount_due: unitAmount / 100,
          balance_due: unitAmount / 100,
          stripe_session_id: session.id,
          customer_name: fullName,
          customer_email: email || null,
          course_selection: courseSelection,
          updated_at: new Date().toISOString()
        }, { onConflict: 'invoice_id' });
      }
    } catch (dbErr) {
      console.warn('[Checkout DB Log Warning]:', dbErr);
    }

    return NextResponse.json({
      status: 'success',
      url: session.url,
      checkoutUrl: session.url,
      sessionId: session.id,
      invoiceId,
      studentId,
      courseId: resolvedCourseId,
    });
  } catch (error: any) {
    console.error('[Unhandled Stripe Checkout Exception]:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error while initializing payment checkout.' },
      { status: 500 }
    );
  }
}