// Admin Hub: the invite window can also SEND AN INVOICE for an agreed price, class and date. The page only collects the details and shows the total;
// the server works out the real amounts (agreed price + 6% Maryland tax), saves the invoice and emails the pay link (src/Lib/server/sent-invoices.ts).
const w: any = typeof window === 'undefined' ? {} : window;
export const TAX_RATE = 0.06;
export const money = (n: number) => '$' + n.toFixed(2);

/** The agreed price as dollars, or null when it is not a usable amount. */
export function parsePrice(v: unknown): number | null { const n = Number(String(v ?? '').replace(/[$,\s]/g, '')); return Number.isFinite(n) && n > 0 && n <= 5000 ? Math.round(n * 100) / 100 : null; }
/** What the preview line shows: the same arithmetic the server uses. */
export function quote(price: number): { price: number; tax: number; total: number } { const pc = Math.round(price * 100), tc = Math.round(pc * TAX_RATE); return { price: pc / 100, tax: tc / 100, total: (pc + tc) / 100 }; }
/** The class name without the "Base Track ($249.99)" price tail the dropdown values carry. */
export function courseName(v: string): string { return String(v || '').replace(/\s*—\s*Base Track.*$/i, '').trim(); }
/** The base price written in a dropdown value, used only to pre-fill the agreed price (staff change it freely). */
export function basePrice(v: string): number | null { const m = /\(\$(\d+(?:\.\d{1,2})?)/.exec(String(v || '')); return m ? parsePrice(m[1]) : null; }

export function validate(f: { name: string; email: string; course: string; classDate: string; price: string }): string | null {
  if (!f.name.trim()) return 'Enter the recipient name.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) return 'Enter a valid email address.';
  if (!f.course.trim()) return 'Choose the class.';
  if (!f.classDate.trim()) return 'Choose the class date.';
  if (parsePrice(f.price) === null) return 'Enter the agreed price in dollars.';
  return null;
}

type Mode = 'invite' | 'invoice';
const $ = (id: string) => document.getElementById(id) as HTMLInputElement | null;
const make = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> & Record<string, any> = {}, css = ''): HTMLElementTagNameMap[K] => { const e = document.createElement(tag); Object.assign(e, props); if (css) e.style.cssText = css; return e; };
const FIELD = 'background:#070b10;border:1px solid var(--border-subtle);color:#fff;padding:10px;border-radius:8px;width:100%;min-height:44px;';

export function installAdminInvoice(): void {
  if (typeof document === 'undefined' || (w as any).__fifsAdminInvoice) return;
  const form = document.getElementById('adminInviteForm'); const submit = document.getElementById('btn-submit-inv');
  if (!form || !submit) return; (w as any).__fifsAdminInvoice = true;
  let mode: Mode = 'invite'; const inviteLabel = submit.textContent || '';
  const title = document.getElementById('adminInviteTitle'); const badge = document.querySelector('#adminInviteModal .goal-header-badge');
  const portalGroup = $('invPortalType')?.closest('.form-group') as HTMLElement | null; const datesGroup = $('invDates')?.closest('.form-group') as HTMLElement | null;
  const status = document.getElementById('inv-status');
  const say = (msg: string, bad: boolean) => { if (!status) return; status.style.display = msg ? 'block' : 'none'; status.textContent = msg; status.className = 'status-msg ' + (bad ? 'error' : 'success'); status.setAttribute('role', bad ? 'alert' : 'status'); };

  const bar = make('div', { role: 'group' }, 'display:flex;gap:8px;margin:0 0 14px;'); bar.setAttribute('aria-label', 'What to send');
  const bInvite = make('button', { type: 'button', textContent: '✉️ Send Invite' }, 'flex:1;min-height:44px;border-radius:10px;font-weight:800;cursor:pointer;');
  const bInvoice = make('button', { type: 'button', textContent: '🧾 Send Invoice' }, 'flex:1;min-height:44px;border-radius:10px;font-weight:800;cursor:pointer;');
  bar.append(bInvite, bInvoice); form.insertBefore(bar, form.firstChild);

  const box = make('div', {}, 'display:none;margin:0 0 16px;padding:12px;border:1px solid rgba(255,183,3,0.5);border-radius:10px;background:rgba(255,183,3,0.06);');
  const row = make('div', {}, 'display:grid;grid-template-columns:1fr 1fr;gap:12px;');
  const dateWrap = make('div'), priceWrap = make('div');
  const dateLbl = make('label', { htmlFor: 'invClassDate', textContent: 'Class date *' }, 'font-size:0.84rem;color:#cbd5e1;display:block;margin-bottom:4px;');
  const date = make('input', { id: 'invClassDate', type: 'date' }, FIELD); dateWrap.append(dateLbl, date);
  const priceLbl = make('label', { htmlFor: 'invPrice', textContent: 'Agreed price (before tax) *' }, 'font-size:0.84rem;color:#cbd5e1;display:block;margin-bottom:4px;');
  const price = make('input', { id: 'invPrice', type: 'number', min: '1', max: '5000', step: '0.01', placeholder: '249.99', inputMode: 'decimal' }, FIELD); priceWrap.append(priceLbl, price);
  row.append(dateWrap, priceWrap);
  const preview = make('p', {}, 'margin:10px 0 0;font-weight:700;color:#ffb703;'); preview.setAttribute('aria-live', 'polite');
  const note = make('p', { textContent: 'The student pays online and chooses how much to pay now, from 30% to 100%. Due on receipt. The link in the email works for 7 days.' }, 'margin:6px 0 0;font-size:0.8rem;color:#9fb3c8;');
  box.append(row, preview, note); submit.parentElement?.insertBefore(box, submit);

  const showQuote = () => { const p = parsePrice(price.value); preview.textContent = p === null ? '' : (() => { const q = quote(p); return `${money(q.price)} + 6% tax ${money(q.tax)} = ${money(q.total)} total`; })(); };
  price.addEventListener('input', showQuote);
  let touched = false; price.addEventListener('input', () => { touched = true; });
  const course = $('invCourse'); course?.addEventListener('change', () => { if (mode === 'invoice' && !touched) { const b = basePrice(course.value); if (b !== null) { price.value = String(b); showQuote(); } } });

  const paint = (b: HTMLButtonElement, on: boolean) => { b.style.background = on ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : '#10161f'; b.style.color = '#fff'; b.style.border = on ? '1px solid #c084fc' : '1px solid var(--border-subtle)'; b.setAttribute('aria-pressed', String(on)); };
  const setMode = (m: Mode) => {
    mode = m; const inv = m === 'invoice'; paint(bInvite, !inv); paint(bInvoice, inv); box.style.display = inv ? 'block' : 'none';
    if (portalGroup) portalGroup.style.display = inv ? 'none' : ''; if (datesGroup) datesGroup.style.display = inv ? 'none' : '';
    if (inv) { const t = $('invPortalType'); if (t && t.value !== 'student') { t.value = 'student'; (w as any).syncInviteCourseDropdown?.(); } }
    if (title) title.textContent = inv ? 'Send an Invoice' : 'Send Direct Portal Invitation'; if (badge) badge.textContent = inv ? 'INVOICE DISPATCHER' : 'DIRECT ACCESS DISPATCHER';
    submit.textContent = inv ? '🧾 Send Invoice & Payment Link' : inviteLabel; say('', false); document.getElementById('inv-result-box')!.style.display = 'none';
  };
  bInvite.addEventListener('click', () => setMode('invite')); bInvoice.addEventListener('click', () => { setMode('invoice'); if (course && !touched) { const b = basePrice(course.value); if (b !== null) { price.value = String(b); showQuote(); } } });
  setMode('invite');

  const original = (w as any).handleAdminInviteSubmit;
  (w as any).handleAdminInviteSubmit = function (e: Event) {
    if (mode !== 'invoice') return original ? original.apply(this, arguments as any) : undefined;
    e.preventDefault();
    const f = { name: $('invFullName')?.value || '', email: $('invEmail')?.value || '', course: courseName(course?.value || ''), classDate: date.value, price: price.value };
    const bad = validate(f); if (bad) { say(bad, true); return; }
    const q = quote(parsePrice(f.price) as number); (submit as HTMLButtonElement).disabled = true; say('Sending the invoice…', false);
    w.callFifsBackend('adminSendInvoice', { fullName: f.name.trim(), email: f.email.trim(), phone: $('invPhone')?.value || '', course: f.course, classDate: f.classDate, price: parsePrice(f.price) })
      .then((d: any) => {
        say(d.emailed ? `✅ Invoice for ${money(d.total ?? q.total)} sent to ${f.email.trim()}.` : `⚠️ The invoice was saved but the email did NOT go out. Copy the link below and send it yourself.`, !d.emailed);
        const url = $('invGeneratedUrl'); const resBox = document.getElementById('inv-result-box'); if (url) url.value = String(d.link || ''); if (resBox) resBox.style.display = d.link ? 'block' : 'none';
      })
      .catch((err: any) => say(String(err?.message || 'The invoice was not sent. Please try again.'), true))
      .finally(() => { (submit as HTMLButtonElement).disabled = false; });
  };
}
