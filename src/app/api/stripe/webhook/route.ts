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

async function findInvoice(supabase: any, sessionId: string, invoiceId?: string | null) {
  const bySession = await supabase
    .from('invoices')
    .select('id, status, stripe_session_id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (bySession.error) throw new Error(`Invoice lookup by Stripe session failed: ${bySession.error.message}`);
  if (bySession.data) return bySession.data;
  if (!invoiceId) return null;

  // Existing invoices may not have the session ID saved; use the exact invoice number
  // from Checkout metadata as a deterministic fallback, never a multi-row student lookup.
  const byInvoiceNumber = await supabase
    .from('invoices')
    .select('id, status, stripe_session_id')
    .eq('invoice_number', invoiceId)
    .maybeSingle();

  if (byInvoiceNumber.error) throw new Error(`Invoice lookup by invoice number failed: ${byInvoiceNumber.error.message}`);
  if (byInvoiceNumber.data?.stripe_session_id && byInvoiceNumber.data.stripe_session_id !== sessionId) {
    throw new Error('Invoice is already associated with a different Stripe Checkout session.');
  }
  return byInvoiceNumber.data;
}

async function sendDiscordWebhook(title: string, description: string, fields: any[] = [], color = 0x10b981) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{ title, description, fields, color, timestamp: new Date().toISOString(), footer: { text: 'Train With FIFS • Security & Operations Desk' } }],
      }),
    });
    if (!response.ok) console.warn('[Discord Webhook Warning]: alert delivery failed with status', response.status);
  } catch (err) {
    // Operational alerts are deliberately non-fatal to Stripe payment processing.
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

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const studentId = session.client_reference_id || session.metadata?.studentId;
      const invoiceId = session.metadata?.invoiceId;

      if (session.payment_status !== 'paid') {
        // Do not mark an unpaid Checkout session as paid. Stripe can send a later
        // asynchronous success event if an asynchronous method is enabled.
        return NextResponse.json({ received: true });
      }

      const invoice = await findInvoice(supabase, session.id, invoiceId);
      if (!invoice) throw new Error(`No invoice found for Stripe session ${session.id}.`);

      const { data: updatedInvoice, error: invoiceUpdateError } = await supabase
        .from('invoices')
        .update({
          status: 'PAID',
          amount_paid: (session.amount_total || 0) / 100,
          balance_due: 0.00,
          stripe_session_id: session.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.id)
        .select('id')
        .maybeSingle();

      if (invoiceUpdateError) throw new Error(`Invoice payment update failed: ${invoiceUpdateError.message}`);
      if (!updatedInvoice) throw new Error(`Invoice ${invoice.id} was not updated for Stripe session ${session.id}.`);

      // Public/guest checkout can legitimately have no matching student row.
      // Treat database errors as retryable, but a zero-row update is not an error.
      if (studentId) {
        const { error: studentUpdateError } = await supabase
          .from('students')
          .update({ status: 'CONFIRMED', updated_at: new Date().toISOString() })
          .eq('student_id', studentId);
        if (studentUpdateError) throw new Error(`Student confirmation update failed: ${studentUpdateError.message}`);
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
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoiceId;
      const studentId = session.client_reference_id || session.metadata?.studentId;
      const invoice = await findInvoice(supabase, session.id, invoiceId);

      if (!invoice) throw new Error(`No invoice found for expired Stripe session ${session.id}.`);

      // The conditional update makes expiry idempotent and prevents a delayed
      // expiration event from overwriting a completed payment.
      if (invoice.status !== 'PAID') {
        const { error: expireError } = await supabase
          .from('invoices')
          .update({ status: 'ABANDONED', updated_at: new Date().toISOString() })
          .eq('id', invoice.id)
          .neq('status', 'PAID');
        if (expireError) throw new Error(`Invoice expiration update failed: ${expireError.message}`);
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
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[Stripe Webhook Processing Error]:', err);
    // Stripe retries non-2xx responses. Never acknowledge failed persistence as success.
    return NextResponse.json({ error: err?.message || 'Webhook processing failed' }, { status: 500 });
  }
}
