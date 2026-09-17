import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Missing STRIPE_SECRET_KEY in server environment variables.' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const body = await req.json().catch(() => ({}));
    const {
      invoiceId = 'INV-FI-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      studentId = 'FIFS-' + Math.floor(1000 + Math.random() * 9000),
      fullName = 'FIFS Training Student',
      email,
      phone = '',
      courseSelection = 'Maryland Firearms Training Course',
      preferredDates = 'Coordinated with Lead Instructor Kai Wade',
      amount = 9381, // deposit in cents ($93.81)
      groupSize = '1',
      comments = '',
    } = body;

    // Convert dollar or cent amount to integer cents
    let unitAmount = 9381;
    if (typeof amount === 'number' && amount > 0) {
      unitAmount = amount > 1000 ? Math.round(amount) : Math.round(amount * 100);
    }

    const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://trainwithfifs.com';
    const baseUrl = origin.replace(/\/+$/, '');

    // Note: Do NOT include automatic_payment_methods here
    const session = await stripe.checkout.sessions.create({
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
      { error: error?.message || 'Unable to initialize Stripe checkout.' },
      { status: 500 }
    );
  }
}
