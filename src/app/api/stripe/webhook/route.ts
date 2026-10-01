import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
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

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // Direct parse fallback for unverified environments or test triggers
      event = JSON.parse(rawBody) as Stripe.Event;
    }

    const supabase = getServiceSupabase();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const studentId = session.client_reference_id || session.metadata?.studentId;
        const invoiceId = session.metadata?.invoiceId;
        const customerEmail = session.customer_details?.email || session.customer_email || 'Student';
        const courseName = session.metadata?.courseSelection || 'Firearms Training Cohort';
        const amountPaid = (session.amount_total || 0) / 100;
        const now = new Date().toISOString();

        // 1. Mark invoice as PAID in Supabase
        if (invoiceId || studentId) {
          const updateData: Record<string, any> = {
            status: 'PAID',
            amount_paid: amountPaid,
            balance_due: 0.0,
            stripe_session_id: session.id,
            updated_at: now,
          };

          if (invoiceId) {
            await supabase.from('invoices').update(updateData).eq('invoice_id', invoiceId);
          } else if (studentId) {
            await supabase.from('invoices').update(updateData).eq('student_id', studentId);
          }
        }

        // 2. Confirm student seat and mark confirmed
        if (studentId) {
          await supabase
            .from('students')
            .update({
              status: 'CONFIRMED',
              updated_at: now,
            })
            .eq('student_id', studentId);
        }

        // 3. Dispatch operational Discord alert
        await sendDiscordWebhook(
          '💳 Payment Received via Stripe Checkout!',
          `Tuition paid in full for Student ID **${studentId || 'N/A'}** (${customerEmail}). Seat officially reserved.`,
          [
            { name: 'Course', value: courseName, inline: true },
            { name: 'Amount Paid', value: `$${amountPaid.toFixed(2)}`, inline: true },
            { name: 'Invoice Ref', value: invoiceId || 'Auto-generated', inline: true },
          ],
          0x10b981
        );
        break;
      }

      case 'checkout.session.expired': {
        // Abandoned session recovery tracking
        const session = event.data.object as Stripe.Checkout.Session;
        const studentId = session.client_reference_id || session.metadata?.studentId;
        const invoiceId = session.metadata?.invoiceId;

        if (invoiceId || studentId) {
          const abandonUpdate = {
            status: 'ABANDONED',
            updated_at: new Date().toISOString(),
          };
          if (invoiceId) {
            await supabase.from('invoices').update(abandonUpdate).eq('invoice_id', invoiceId);
          }
        }

        await sendDiscordWebhook(
          '⚠️ Checkout Session Abandoned / Expired',
          `Invoice **${invoiceId || 'N/A'}** (Student: ${studentId || 'N/A'}) was closed prior to completion.`,
          [],
          0xf59e0b
        );
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[Stripe Webhook Processing Error]:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing failed.' }, { status: 400 });
  }
}