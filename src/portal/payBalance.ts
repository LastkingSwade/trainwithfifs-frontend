// Student Portal: pay the remaining balance online. The page only asks the server for a secure Stripe checkout link for the student's own invoice (the server
// finds the amount on the invoice; nothing here sends or decides an amount) and then goes to Stripe. The payment is recorded by the server when Stripe confirms it.
const w: any = typeof window === 'undefined' ? {} : window;
export interface Receipt { invoiceNumber: string; course: string; status: string; total: number; paid: number; balance: number; date: string; inPerson?: { amount: number; method: string; date: string }[] }
export const money = (n: number) => '$' + Number(n).toFixed(2);

/** Invoices that can be paid online: the deposit is paid and a balance is left. */
export const payable = (rows: readonly Receipt[] | null): Receipt[] => (rows || []).filter((r) => r.status === 'Deposit paid' && Number(r.balance) > 0);
/** Only Stripe's own checkout address is ever opened. */
export const safeCheckoutUrl = (u: unknown): string | null => { try { const x = new URL(String(u)); return x.protocol === 'https:' && x.hostname === 'checkout.stripe.com' ? x.toString() : null; } catch { return null; } };

export async function startPayment(r: Receipt, btn: HTMLButtonElement, say: (msg: string, bad: boolean) => void): Promise<void> {
  if (btn.disabled) return;
  const label = btn.textContent || ''; btn.disabled = true; btn.textContent = 'Opening secure checkout…'; say('', false);
  try {
    const d = await w.callFifsBackend('createBalanceCheckout', { invoiceNumber: r.invoiceNumber });
    const url = safeCheckoutUrl(d && d.url);
    if (!url) throw new Error('We could not open secure checkout. Please try again or contact FIFS.');
    window.location.assign(url);
  } catch (e: any) { btn.disabled = false; btn.textContent = label; say(String((e && e.message) || 'We could not open secure checkout. Please try again or contact FIFS.'), true); }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }

/** A button for one invoice, plus the line that shows any error. */
export function payButton(r: Receipt): { button: HTMLButtonElement; note: HTMLElement } {
  const note = el('div', undefined, 'pay-note'); note.setAttribute('role', 'status'); note.hidden = true;
  const button = el('button', `Pay ${money(r.balance)} now ↗`, 'pay-btn'); button.type = 'button';
  button.addEventListener('click', () => { void startPayment(r, button, (msg, bad) => { note.textContent = msg; note.hidden = !msg; note.classList.toggle('bad', bad); note.setAttribute('role', bad ? 'alert' : 'status'); }); });
  return { button, note };
}

/** The always-visible card at the top of the student's extras when something is owed. */
export function balanceBanner(rows: Receipt[] | null): HTMLElement | null {
  const due = payable(rows); if (!due.length) return null;
  const box = el('section', undefined, 'pay-banner'); box.setAttribute('aria-label', 'Remaining balance');
  box.appendChild(el('span', '💳', 'pay-ico')).setAttribute('aria-hidden', 'true');
  const copy = el('div', undefined, 'pay-copy');
  const total = due.reduce((s, r) => s + Number(r.balance), 0);
  copy.appendChild(el('strong', due.length === 1 ? `Remaining balance: ${money(total)}` : `Remaining balances: ${money(total)}`));
  copy.appendChild(el('p', 'Your deposit is paid. You can pay the rest securely online now, or on class day as before. Online payments are by card through Stripe.'));
  box.appendChild(copy);
  const actions = el('div', undefined, 'pay-actions');
  for (const r of due) { const { button, note } = payButton(r); if (due.length > 1) button.textContent = `Pay ${money(r.balance)} (${r.invoiceNumber}) ↗`; actions.append(button, note); }
  box.appendChild(actions);
  return box;
}

/** After Stripe sends the student back: a short note, then the receipt is already on their portal. */
export function showReturnNotice(kind: 'paid' | 'cancelled'): void {
  const bar = el('div', undefined, 'pay-return'); bar.setAttribute('role', 'status');
  bar.appendChild(el('span', kind === 'paid' ? '✅ Thank you! Your payment is being confirmed. Your receipt will update in the Student Portal in a moment.' : 'No charge was made. You can pay your balance any time from the Student Portal.'));
  const open = el('button', 'Open my Student Portal', 'pay-btn'); open.type = 'button'; open.addEventListener('click', () => { bar.remove(); w.openAndSwitch?.('portal'); });
  const close = el('button', 'Dismiss', 'pay-close'); close.type = 'button'; close.addEventListener('click', () => bar.remove());
  bar.append(open, close); document.body.appendChild(bar); window.setTimeout(() => bar.remove(), 30000);
}
export function installBalanceReturn(): void {
  if (w.__fifsBalanceReturnInstalled) return; w.__fifsBalanceReturnInstalled = true;
  try {
    const q = new URLSearchParams(window.location.search); const kind = q.get('balance_paid') === 'true' ? 'paid' : q.get('balance_cancelled') === 'true' ? 'cancelled' : null; if (!kind) return;
    window.history.replaceState(null, '', window.location.pathname); showReturnNotice(kind);
  } catch { /* the notice is a convenience only */ }
}
