const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  const studentId = session.client_reference_id;

  // 1. Mark invoice as paid
  await supabase
    .from('invoices')
    .update({
      status: 'PAID',
      amount_paid: session.amount_total / 100,
      balance_due: 0.00,
      stripe_session_id: session.id,
      updated_at: new Date().toISOString()
    })
    .eq('student_id', studentId);

  // 2. Confirm student seat
  await supabase
    .from('students')
    .update({
      status: 'CONFIRMED',
      updated_at: new Date().toISOString()
    })
    .eq('student_id', studentId);

  // 3. Dispatch operational alert
  await sendDiscordWebhook(
    "💳 Payment Received via Stripe Checkout!",
    `Tuition paid in full for Student ID **${studentId}** (${session.customer_email || 'Student'}). Seat officially reserved.`,
    [],
    0x10B981
  );
}