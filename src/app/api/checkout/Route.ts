import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

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

    // Standardize unit amount calculation
    let unitAmount = 24999;
    if (typeof amount === 'number' && amount > 0) {
      unitAmount = amount > 1000 ? Math.round(amount) : Math.round(amount * 100);
    }

    const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://trainwithfifs.com';
    const baseUrl = origin.replace(/\/+$/, '');

    // Create Stripe Checkout Session with full metadata and cancellation recovery
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email && email.includes('@') ? email.trim() : undefined,
      client_reference_id: studentId,
      metadata: {
        invoiceId,
        studentId,
        fullName: fullName.trim(),
        phone: String(phone).trim(),
        courseId: String(courseId).trim(),
        courseSelection: String(courseSelection).trim(),
        preferredDates: String(preferredDates).trim(),
        groupSize: String(groupSize),
        tier: String(tier),
        comments: String(comments).slice(0, 400),
        abandonment_status: 'initialized',
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
      success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}&booking_confirmed=true&invoice=${encodeURIComponent(invoiceId)}&student_id=${encodeURIComponent(studentId)}`,
      cancel_url: `${baseUrl}/?booking_cancelled=true&invoice=${encodeURIComponent(invoiceId)}&student_id=${encodeURIComponent(studentId)}&abandoned=true`,
    });

    if (!session.url) {
      throw new Error('Stripe failed to return a valid checkout redirect URL.');
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
    console.error('[Stripe Checkout Exception Caught]:', error);
    return NextResponse.json(
      {
        error: error?.message || 'A server error occurred while initializing checkout.',
        status: 'error',
      },
      { status: 500 }
    );
  }
}