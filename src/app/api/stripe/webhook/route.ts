import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Helper to send Discord alert (optional)
async function sendDiscordWebhook(title: string, description: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title,
            description,
            color: 0x10b981,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (err) {
    console.error('Failed to dispatch Discord webhook:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. In Next.js App Router, read raw text directly for Stripe signature verification
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event: Stripe.Event;

    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } else {
      // Fallback for testing without signature verification
      event = JSON.parse(rawBody);
    }

    // 2. Handle the successful checkout event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const studentId = session.client_reference_id;
      const customerEmail = session.customer_details?.email || session.customer_email || 'Student';

      console.log(`Payment confirmed for Student ID: ${studentId} (${customerEmail})`);

      // 3. Dispatch Discord notification
      await sendDiscordWebhook(
        '💳 Payment Received via Stripe Checkout!',
        `Tuition paid in full for Student ID **${studentId || 'N/A'}** (${customerEmail}). Seat officially reserved.`
      );

      // If you maintain a local database or Google Sheet, update records here
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }
}
