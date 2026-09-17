import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Safe server-side secret key from environment variables (never exposed to client)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY environment variable on server.');
      return NextResponse.json(
        { error: 'Stripe configuration missing on server. Set STRIPE_SECRET_KEY in environment variables (.env.local).' },
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
      courseSelection = 'Maryland Firearms Training Course',
      preferredDates = 'Coordinated with Lead Instructor Kai Wade',
      amount = 24999, // default in cents ($249.99)
      groupSize = '1',
      comments = '',
    } = body;

    // Normalize amount into cents
    let unitAmount = 24999;
    if (typeof amount === 'number' && amount > 0) {
      unitAmount = amount > 1000 ? Math.round(amount) : Math.round(amount * 100);
    }

    // Determine host origin for redirect callbacks
    const origin = req.headers.get('origin') || req.headers.get('referer') || 'http://localhost:3000';
    const baseUrl = origin.replace(/\/+$/, '');

    // Create official Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email && email.includes('@') ? email : undefined,
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
      cancel_url: `${baseUrl}/?booking_cancelled=true&invoice=${encodeURIComponent(invoiceId)}`,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a valid session redirect URL.');
    }

    // Return both checkoutUrl and url for complete client compatibility
    return NextResponse.json({
      status: 'success',
      url: session.url,
      checkoutUrl: session.url,
      sessionId: session.id,
      invoiceId,
      studentId,
    });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error while initializing payment checkout.' },
      { status: 500 }
    );
  }
}
