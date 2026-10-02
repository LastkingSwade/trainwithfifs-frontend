import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_build_placeholder', {
  apiVersion: '2023-10-16' as any,
});

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ufqnmcincwnlyiwsmzcq.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase Service Role Key for webhook processing.');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function sendDiscordWebhook(title: string, description: string, fields: any[] = [], color = 0x10b981) {
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
            fields,
            color,
            timestamp: new Date().toISOString(),
            footer: { text: 'Train With FIFS • Security & Operations Desk' },
          },
        ],
      }),
    });
  } catch (err) {
    console.error('Failed to dispatch Discord operational alert:', err);
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!webhookSecret) {
      console.error('[Stripe Webhook Error]: STRIPE_WEBHOOK_SECRET is not configured.');
      return NextResponse.json({ error: 'Webhook secret is unconfigured on server.' }, { status: 500 });
    }

    if (!signature) {
      console.warn('[Stripe Webhook Warning]: Request missing stripe-signature header.');
      return NextResponse.json({ error: 'Missing stripe signature.' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error(`[Stripe Webhook Signature Verification Failed]: ${err?.message}`);
      return NextResponse.json({ error: `Signature verification failed: ${err?.message}` }, { status: 400 });
    }

    let supabase;
    try {
      supabase = getServiceSupabase();
    } catch (e: any) {
      console.error('[Supabase Init Error in Webhook]:', e?.message);
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // 1. Handle Completed Checkout Session
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const studentId = session.client_reference_id || session.metadata?.studentId;
      const invoiceId = session.metadata?.invoiceId;

      try {
        if (invoiceId) {
          await supabase
            .from('invoices')
            .update({
              status: 'PAID',
              amount_paid: (session.amount_total || 0) / 100,
              balance_due: 0.00,
              stripe_session_id: session.id,
              updated_at: new Date().toISOString(),
            })
            .eq('invoice_id', invoiceId);
        } else if (studentId) {
          await supabase
            .from('invoices')
            .update({
              status: 'PAID',
              amount_paid: (session.amount_total || 0) / 100,
              balance_due: 0.00,
              stripe_session_id: session.id,
              updated_at: new Date().toISOString(),
            })
            .eq('student_id', studentId);
        }

        if (studentId) {
          await supabase
            .from('students')
            .update({
              status: 'CONFIRMED',
              updated_at: new Date().toISOString(),
            })
            .eq('student_id', studentId);
        }

        await sendDiscordWebhook(
          '💳 Payment Received via Stripe Checkout!',
          `Tuition paid in full for Student ID **${studentId || 'N/A'}** (${session.customer_email || 'Student'}). Seat officially reserved.`,
          [
            { name: 'Course', value: session.metadata?.courseSelection || 'Firearms Training Course', inline: true },
            { name: 'Amount Paid', value: `$${((session.amount_total || 0) / 100).toFixed(2)}`, inline: true },
            { name: 'Invoice ID', value: invoiceId || 'N/A', inline: true },
          ],
          0x10b981
        );
      } catch (dbError: any) {
        console.error('[Webhook DB Update Error]:', dbError);
      }
    }

    // 2. Handle Abandoned / Expired Session
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoiceId;
      const studentId = session.client_reference_id || session.metadata?.studentId;

      try {
        if (invoiceId) {
          await supabase
            .from('invoices')
            .update({
              status: 'ABANDONED',
              updated_at: new Date().toISOString(),
            })
            .eq('invoice_id', invoiceId);
        }

        await sendDiscordWebhook(
          '⚠️ Checkout Session Abandoned / Expired',
          `Invoice **${invoiceId || 'N/A'}** for Student ID **${studentId || 'N/A'}** was abandoned prior to completion.`,
          [
            { name: 'Customer Email', value: session.customer_email || 'N/A', inline: true },
            { name: 'Course', value: session.metadata?.courseSelection || 'N/A', inline: true },
          ],
          0xf59e0b
        );
      } catch (expireErr) {
        console.warn('[Webhook Expire Update Warning]:', expireErr);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[Unhandled Webhook Error Boundary]:', err);
    return NextResponse.json({ error: err?.message || 'Unhandled webhook error' }, { status: 500 });
  }
}