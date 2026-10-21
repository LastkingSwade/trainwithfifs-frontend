import crypto from 'crypto';
import Stripe from 'stripe';
import { displayCourseLabel, cleanDepositPercent, MIN_DEPOSIT_PERCENT } from '../pricing';
import { cleanCourse } from '@/group/groupCopy';
import { ensureGuestCheckoutStudent, STRIPE_API_VERSION } from './booking-checkout';
import { sendOnlineEmail } from './online-email';
import { resolveStripeSecretKey } from './supabase-admin';
import { resolveSiteUrl } from '../config/environment';

// Invoices the instructor sends from the Admin Hub for an agreed price, class and date. They are ordinary rows in the invoices table, so the Stripe webhook,
// receipts, balance payments and the Admin Hub payment list all keep working unchanged. Rules:
//  - the price is set by staff on the server side of this file; the payer never supplies an amount: they only choose how much of the invoice to pay now
//    (30% to 100%), and the amount is worked out here;
//  - 6% Maryland sales tax is added on top of the agreed price; there is no pay-in-full discount on an agreed price;
//  - "due on receipt": the email link is valid for 7 days (a signed, stateless link: nothing new is stored), and staff can send a fresh one;
//  - a paid-in-part invoice can be finished from the same link (the remaining balance).
export const TAX_RATE = 0.06;
export const LINK_DAYS = 7;
export const MAX_PRICE = 5000;
const DAY = 86400000;
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const fromCents = (c: number) => (c / 100).toFixed(2);
export const NUMBER_RE = /^INV-[A-Za-z0-9-]{3,40}$/;

export function priceInvoice(priceDollars: unknown): { ok: true; priceCents: number; taxCents: number; totalCents: number } | { ok: false; error: string } {
  const n = typeof priceDollars === 'number' ? priceDollars : Number(String(priceDollars ?? '').replace(/[$,\s]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return { ok: false, error: 'Enter the agreed price in dollars (more than $0).' };
  if (n > MAX_PRICE) return { ok: false, error: `The agreed price cannot be more than $${MAX_PRICE}.` };
  const priceCents = Math.round(n * 100); const taxCents = Math.round(priceCents * TAX_RATE);
  return { ok: true, priceCents, taxCents, totalCents: priceCents + taxCents };
}
/** What the payer is charged now for the chosen percent (30 to 100). 100% is exactly the total. */
export function chargeCents(totalCents: number, percent: unknown): { percent: number; cents: number } {
  const pct = cleanDepositPercent(percent);
  return { percent: pct, cents: pct >= 100 ? totalCents : Math.round(totalCents * pct / 100) };
}

// --- the signed pay link ---
function secret(): string { const s = process.env.INVOICE_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.STRIPE_SECRET_KEY || ''; if (!s) throw new Error('no link secret'); return s; }
const mac = (invoiceNumber: string, issued: string, name = '') => crypto.createHmac('sha256', secret()).update(`pay-invoice|${invoiceNumber}|${issued}|${name}`).digest('base64url').slice(0, 32);
export function makeToken(invoiceNumber: string, now = Date.now(), name = ''): string { const issued = Math.floor(now / 1000).toString(36); return `${issued}.${mac(invoiceNumber, issued, name)}`; }
// The recipient's name is part of the signed link (so a new student's record gets the right name and nobody can change it).
export function checkToken(invoiceNumber: string, token: unknown, now = Date.now(), name = ''): 'ok' | 'expired' | 'bad' {
  try {
    const t = String(token || ''); const m = /^([0-9a-z]{1,10})\.([A-Za-z0-9_-]{32})$/.exec(t); if (!m || !NUMBER_RE.test(invoiceNumber)) return 'bad';
    const want = Buffer.from(mac(invoiceNumber, m[1], name)); const got = Buffer.from(m[2]);
    if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return 'bad';
    const issuedMs = parseInt(m[1], 36) * 1000; if (!Number.isFinite(issuedMs) || issuedMs > now + 5 * 60000) return 'bad';
    return now - issuedMs > LINK_DAYS * DAY ? 'expired' : 'ok';
  } catch { return 'bad'; }
}
export const payLink = (siteUrl: string, invoiceNumber: string, now = Date.now(), name = '') => `${siteUrl}/pay-invoice?i=${encodeURIComponent(invoiceNumber)}&t=${makeToken(invoiceNumber, now, name)}${name ? `&n=${encodeURIComponent(name)}` : ''}`;

export function prettyClassDate(v: unknown): string {
  const s = String(v ?? '').trim().slice(0, 120); const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s; const d = new Date(`${s}T12:00:00Z`); if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function buildInvoiceEmail(m: { name?: string; course: string; classDate: string; priceCents: number; taxCents: number; totalCents: number; link: string }) {
  const first = String(m.name || '').trim().split(/\s+/)[0]; const hi = first ? `Hi ${first},` : 'Hi,';
  const course = cleanCourse(m.course); const usd = (c: number) => `$${fromCents(c)}`;
  const text = `${hi}\n\nHere is your invoice from Train With FIFS.\n\nClass: ${course}\nDate: ${m.classDate}\nAgreed price: ${usd(m.priceCents)}\nMaryland sales tax (6%): ${usd(m.taxCents)}\nTotal: ${usd(m.totalCents)}\nDue on receipt.\n\nPay securely online (you choose how much to pay now, from 30% up to the full total; the rest is due at class):\n${m.link}\n\nThis link works for ${LINK_DAYS} days. If it expires, call us at 443-990-1304 and we will send a new one.\n\nTrain With FIFS`;
  const row = (a: string, b: string, bold = false) => `<tr><td style="padding:4px 12px 4px 0;${bold ? 'font-weight:bold;' : ''}">${esc(a)}</td><td style="padding:4px 0;text-align:right;${bold ? 'font-weight:bold;' : ''}">${esc(b)}</td></tr>`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5;"><p>${esc(hi)}</p><p>Here is your invoice from <strong>Train With FIFS</strong>.</p>
    <p><strong>${esc(course)}</strong><br>${esc(m.classDate)}</p>
    <table style="border-collapse:collapse;font-size:15px;">${row('Agreed price', usd(m.priceCents))}${row('Maryland sales tax (6%)', usd(m.taxCents))}${row('Total, due on receipt', usd(m.totalCents), true)}</table>
    <p><a href="${esc(m.link)}" style="display:inline-block;background:#ffb703;color:#000;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:4px;">Pay my invoice</a></p>
    <p style="font-size:14px;">You choose how much to pay now, from ${MIN_DEPOSIT_PERCENT}% up to the full total. Any remainder is due at class. This link works for ${LINK_DAYS} days; if it expires, call 443-990-1304 and we will send a new one.</p><p style="font-size:14px;">Train With FIFS</p></div>`;
  return { subject: `Your invoice: ${course}, ${m.classDate}`, html, text };
}

export interface Deps { supabase: any; now?: () => number; sendMail?: typeof sendOnlineEmail; siteUrl?: () => string; stripe?: () => any; newNumber?: () => string }
const newNumber = () => `INV-FI-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
type R<T = {}> = ({ ok: true } & T) | { ok: false; status: number; error: string };
const likeEscape = (v: string) => v.replace(/[\\%_]/g, (c) => '\\' + c);

/** Staff: record the invoice and email the pay link. Nothing is emailed unless the invoice was saved. */
export async function sendInvoice(input: { fullName?: unknown; email?: unknown; phone?: unknown; course?: unknown; classDate?: unknown; price?: unknown }, by: string, deps: Deps): Promise<R<{ invoiceNumber: string; totalCents: number; link: string; emailed: boolean }>> {
  const name = String(input.fullName || '').trim().slice(0, 100); const email = String(input.email || '').trim().toLowerCase().slice(0, 150);
  const course = String(input.course || '').trim().slice(0, 200); const classDate = prettyClassDate(input.classDate);
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, status: 400, error: 'A name and a valid email are required.' };
  if (!course) return { ok: false, status: 400, error: 'Choose the class.' };
  if (!classDate) return { ok: false, status: 400, error: 'Choose the class date.' };
  const priced = priceInvoice(input.price); if (!priced.ok) return { ok: false, status: 400, error: priced.error };
  const sb = deps.supabase; const now = (deps.now || Date.now)();
  // An existing student keeps the invoice on their own record; anyone else goes on the guest record (the same way checkout does), and gets portal access when they pay.
  let studentId = '';
  const found = await sb.from('students').select('student_id').ilike('email', likeEscape(email)).limit(1);
  if (found.error) return { ok: false, status: 503, error: 'Could not check the student record right now. Nothing was sent.' };
  if (Array.isArray(found.data) && found.data[0]?.student_id) studentId = String(found.data[0].student_id);
  else { const g = await ensureGuestCheckoutStudent(); if (!g.ok) return { ok: false, status: 503, error: 'Could not prepare the invoice record. Nothing was sent.' }; studentId = 'GUEST-CHECKOUT'; }
  const invoiceNumber = (deps.newNumber || newNumber)();
  const ins = await sb.from('invoices').insert({
    invoice_number: invoiceNumber, student_id: studentId, course, total_amount: fromCents(priced.totalCents), tuition_amount: fromCents(priced.priceCents), tax_amount: fromCents(priced.taxCents),
    deposit_due: fromCents(chargeCents(priced.totalCents, MIN_DEPOSIT_PERCENT).cents), amount_paid: '0.00', balance_due: fromCents(priced.totalCents), status: 'PENDING', due_date: classDate,
    email, facility: "Cindy's Hot Shots (115 Holsum Way, Glen Burnie, MD 21060)", payment_method: `Invoice emailed by ${by}`.slice(0, 120), updated_at: new Date(now).toISOString(),
  });
  if (ins.error) return { ok: false, status: 503, error: 'The invoice could not be saved, so nothing was sent.' };
  let siteUrl: string; try { siteUrl = (deps.siteUrl || resolveSiteUrl)(); } catch { return { ok: false, status: 503, error: 'The site address is not configured. The invoice was saved but NOT emailed (' + invoiceNumber + ').' }; }
  const link = payLink(siteUrl, invoiceNumber, now, name);
  const mail = buildInvoiceEmail({ name, course, classDate, priceCents: priced.priceCents, taxCents: priced.taxCents, totalCents: priced.totalCents, link });
  const emailed = await (deps.sendMail || sendOnlineEmail)(email, mail);
  return { ok: true, invoiceNumber, totalCents: priced.totalCents, link, emailed };
}

/** Staff: email a fresh 7-day link for an unpaid or part-paid invoice. */
export async function resendInvoice(invoiceNumber: string, deps: Deps, name = ''): Promise<R<{ emailed: boolean; link: string }>> {
  if (!NUMBER_RE.test(invoiceNumber)) return { ok: false, status: 400, error: 'That invoice number is not valid.' };
  const r = await deps.supabase.from('invoices').select('invoice_number, course, status, total_amount, tuition_amount, tax_amount, due_date, email').eq('invoice_number', invoiceNumber).maybeSingle();
  if (r.error) return { ok: false, status: 503, error: 'Could not load the invoice.' }; if (!r.data) return { ok: false, status: 404, error: 'Invoice not found.' };
  if (r.data.status === 'PAID') return { ok: false, status: 409, error: 'That invoice is already paid in full.' };
  const c = (v: unknown) => Math.round(Number(v) * 100); const now = (deps.now || Date.now)();
  const link = payLink((deps.siteUrl || resolveSiteUrl)(), invoiceNumber, now, name);
  const mail = buildInvoiceEmail({ name, course: String(r.data.course), classDate: String(r.data.due_date || ''), priceCents: c(r.data.tuition_amount), taxCents: c(r.data.tax_amount), totalCents: c(r.data.total_amount), link });
  return { ok: true, link, emailed: await (deps.sendMail || sendOnlineEmail)(String(r.data.email), mail) };
}

const PAYABLE = ['PENDING', 'ABANDONED', 'CANCELLED'];
async function loadForPayer(sb: any, invoiceNumber: string, token: unknown, now: number, name = ''): Promise<R<{ row: any }>> {
  const t = checkToken(invoiceNumber, token, now, name);
  if (t === 'expired') return { ok: false, status: 410, error: 'This invoice link has expired. Please call 443-990-1304 and we will send you a new one.' };
  if (t === 'bad') return { ok: false, status: 404, error: 'This invoice link is not valid.' };
  const r = await sb.from('invoices').select('invoice_number, course, status, total_amount, tuition_amount, tax_amount, amount_paid, balance_due, due_date, email').eq('invoice_number', invoiceNumber).maybeSingle();
  if (r.error) return { ok: false, status: 503, error: 'We could not load your invoice right now. Please try again in a minute.' };
  if (!r.data) return { ok: false, status: 404, error: 'This invoice link is not valid.' };
  return { ok: true, row: r.data };
}
/** What the pay page shows. Never an email or another person's data. */
export async function payInfo(invoiceNumber: string, token: unknown, deps: Deps, name = ''): Promise<R<{ info: Record<string, unknown> }>> {
  const l = await loadForPayer(deps.supabase, invoiceNumber, token, (deps.now || Date.now)(), name); if (!l.ok) return l; const x = l.row; const n = (v: unknown) => Math.round(Number(v) * 100) / 100;
  const state = x.status === 'PAID' ? 'paid' : x.status === 'DEPOSIT_PAID' ? 'balance' : PAYABLE.includes(String(x.status)) ? 'open' : 'closed';
  return { ok: true, info: { invoiceNumber, course: displayCourseLabel(cleanCourse(String(x.course))), classDate: String(x.due_date || ''), price: n(x.tuition_amount), tax: n(x.tax_amount), total: n(x.total_amount), paid: n(x.amount_paid), balance: n(x.balance_due), state, minPercent: MIN_DEPOSIT_PERCENT } };
}
/** The payer chose a percent (open invoice) or is finishing the balance (part-paid). Returns a Stripe Checkout URL for a server-worked amount. */
export async function invoiceCheckout(invoiceNumber: string, token: unknown, percent: unknown, deps: Deps, name = ''): Promise<R<{ url: string; amount: number }>> {
  const sb = deps.supabase; const now = (deps.now || Date.now)();
  const l = await loadForPayer(sb, invoiceNumber, token, now, name); if (!l.ok) return l; const row = l.row;
  const total = Math.round(Number(row.total_amount) * 100), paid = Math.round(Number(row.amount_paid) * 100), balance = Math.round(Number(row.balance_due) * 100);
  if (![total, paid, balance].every(Number.isFinite) || total <= 0) return { ok: false, status: 409, error: 'We could not confirm this invoice. Please contact FIFS.' };
  if (row.status === 'PAID') return { ok: false, status: 409, error: 'This invoice is already paid in full. Thank you!' };
  const isBalance = row.status === 'DEPOSIT_PAID';
  if (!isBalance && !PAYABLE.includes(String(row.status))) return { ok: false, status: 409, error: 'This invoice cannot be paid online. Please contact FIFS.' };
  if (isBalance && (balance <= 0 || balance > total || Math.abs(total - paid - balance) > 1)) return { ok: false, status: 409, error: 'We could not confirm the balance on this invoice. Please contact FIFS.' };
  const charge = isBalance ? { percent: 100, cents: balance } : chargeCents(total, percent);
  let key: string | null; let siteUrl: string; try { key = resolveStripeSecretKey(); siteUrl = (deps.siteUrl || resolveSiteUrl)(); } catch { return { ok: false, status: 503, error: 'Online payment is not set up right now. Please contact FIFS.' }; }
  if (!key && !deps.stripe) return { ok: false, status: 503, error: 'Online payment is not available right now. Please contact FIFS.' };
  const stripe = deps.stripe ? deps.stripe() : new Stripe(key as string, { apiVersion: STRIPE_API_VERSION });
  const email = String(row.email || '').trim().toLowerCase(); const label = displayCourseLabel(cleanCourse(String(row.course)));
  const full = !isBalance && charge.percent >= 100;
  const md: Record<string, string> = isBalance
    ? { invoiceId: invoiceNumber, isBalancePayment: 'true', courseSelection: String(row.course).slice(0, 200) }
    : { invoiceId: invoiceNumber, courseSelection: String(row.course).slice(0, 200), preferredDates: String(row.due_date || '').slice(0, 200), fullName: name.slice(0, 100), phone: '', isDepositPayment: String(!full), depositPercent: String(charge.percent), grandTotal: fromCents(total), depositDueNow: fromCents(charge.cents) };
  // The amount the webhook expects is written on the invoice BEFORE the checkout opens, and the checkout is bound to it; an older, different checkout for the same invoice can no longer be applied.
  if (!isBalance) {
    const up = await sb.from('invoices').update({ deposit_due: fromCents(charge.cents), updated_at: new Date(now).toISOString() }).eq('invoice_number', invoiceNumber).in('status', PAYABLE).select('invoice_number');
    if (up.error || !Array.isArray(up.data) || !up.data.length) return { ok: false, status: 409, error: 'This invoice changed while you were paying. Please reopen the link from your email.' };
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], mode: 'payment', ...(email ? { customer_email: email } : {}), client_reference_id: invoiceNumber, metadata: md,
      line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: charge.cents, product_data: { name: `${label} — ${isBalance ? 'Remaining Balance' : full ? 'Invoice, paid in full' : `Invoice, ${charge.percent}% now`}`, description: `Invoice: ${invoiceNumber} • Total $${fromCents(total)} (agreed price + 6% MD tax)` } } }],
      expires_at: Math.floor(now / 1000) + 60 * 60, success_url: `${siteUrl}/?${isBalance ? 'balance_paid=true' : 'booking_confirmed=true'}&invoice=${encodeURIComponent(invoiceNumber)}`, cancel_url: `${siteUrl}/pay-invoice?i=${encodeURIComponent(invoiceNumber)}&t=${encodeURIComponent(String(token))}${name ? `&n=${encodeURIComponent(name)}` : ''}`,
    });
    if (!session?.url || !session.id) return { ok: false, status: 502, error: 'Stripe did not return a checkout link. Please try again or contact FIFS.' };
    if (!isBalance) {
      const bind = await sb.from('invoices').update({ stripe_session_id: session.id, updated_at: new Date(now).toISOString() }).eq('invoice_number', invoiceNumber).in('status', PAYABLE).select('invoice_number');
      if (bind.error || !Array.isArray(bind.data) || !bind.data.length) { try { await stripe.checkout.sessions.expire(session.id); } catch { /* best effort */ } return { ok: false, status: 503, error: 'We could not open checkout. Please try again in a minute.' }; }
    }
    return { ok: true, url: session.url, amount: charge.cents / 100 };
  } catch (err: any) { console.error('[Invoice checkout] failed:', err?.message); return { ok: false, status: 502, error: 'We could not open secure checkout. Please try again in a minute or contact FIFS.' }; }
}
