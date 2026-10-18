// The Mid-Atlantic Multi-State application guide card, shown in the Student Portal and carried over to the Client Portal for the same login.
// It keeps the student's place (checked steps are saved on the server, and Coach Kai is told), locks Pennsylvania until the Maryland card is in hand, totals the fees,
// shows which documents are already in the Document Vault, and prints mailing labels, the Virginia packet checklist and fill-in worksheets.
// Nothing is ever submitted to an agency from here. Text only (textContent).
import { FEES, FEE_HOW, FEE_TOTAL, PHASES, STEPS, lockedReason, phaseLabel, summarize, type Done, type Step } from './plan';
import { EMPTY_DETAILS, assessPhoto, cleanDetails, labelSheet, virginiaPacket, worksheets, type Details } from './sheets';
import { measurePhoto, openSheets } from './sheetsView';

const w: any = typeof window === 'undefined' ? {} : window;
function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }
const usd = (n: number) => '$' + n.toFixed(2).replace(/\.00$/, '');
export interface VaultDocs { hasCertificate: boolean; hasId: boolean; hasPermitCard: boolean; vaultOn: boolean }
export interface CardState { done: Done; tracking: Record<string, string>; setupNeeded: boolean; docs: VaultDocs | null; details: Details }
export interface CardActions { toggle(id: string, checked: boolean): Promise<string | null>; track(key: string, value: string): Promise<string | null>; openVault(): void }
const TRACK_FOR: Record<string, { key: string; label: string }> = { va_mailed: { key: 'va', label: 'Virginia tracking number' }, fl_mailed: { key: 'fl', label: 'Florida tracking number' }, az_mailed: { key: 'az', label: 'Arizona tracking number' } };
const detailsMem: { d: Details } = { d: { ...EMPTY_DETAILS } }; // the printable-sheet details live only here, in this page's memory

export function renderCard(host: HTMLElement, st: CardState, act: CardActions): void {
  const open = new Set<string>(Array.from(host.querySelectorAll<HTMLDetailsElement>('details[data-k]')).filter((d) => d.open).map((d) => d.dataset.k || ''));
  const firstPaint = !host.firstChild;
  host.textContent = '';
  const s = summarize(st.done);
  const live = el('div', undefined, 'ms-live'); live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); live.hidden = true;
  const say = (m: string, bad = false) => { live.textContent = m; live.hidden = !m; live.classList.toggle('bad', bad); live.setAttribute('role', bad ? 'alert' : 'status'); };

  // ---- header + progress
  const head = el('header', undefined, 'ms-head');
  head.appendChild(el('span', '🧭', 'ms-ico')).setAttribute('aria-hidden', 'true');
  const hc = el('div', undefined, 'ms-hc'); hc.appendChild(el('span', 'Mid-Atlantic Multi-State', 'ms-eyebrow')); hc.appendChild(el('h3', 'Your application guide: Maryland, Virginia, Florida, Arizona and Pennsylvania')); head.appendChild(hc); host.appendChild(head);
  const bar = el('div', undefined, 'ms-bar'); bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', '100'); bar.setAttribute('aria-valuenow', String(s.percent)); bar.setAttribute('aria-label', `${s.requiredDone} of ${s.required} steps done`);
  const fill = el('i'); fill.style.width = s.percent + '%'; bar.appendChild(fill); host.appendChild(bar);
  host.appendChild(el('p', `${s.requiredDone} of ${s.required} steps done · ${s.percent}% · now in: ${phaseLabel(s.phase)} · fees handled ${usd(s.fees.handled)} of ${usd(s.fees.total)}`, 'ms-meta'));
  const next = el('div', undefined, 'ms-next'); next.appendChild(el('strong', s.phase === 'complete' ? '🎉 Every step is done.' : '👉 Next up: ' + (s.next ? s.next.title : 'nothing right now'))); if (s.next) next.appendChild(el('span', s.next.detail)); host.appendChild(next);
  host.appendChild(el('p', 'Tick each step as you finish it. Coach Kai sees your progress so he can help when you get stuck. Nothing here is sent to any agency for you; you submit each application yourself.', 'ms-note'));
  if (st.setupNeeded) host.appendChild(el('p', 'Step tracking is being set up, so your ticks are not saved yet. Everything else on this card works. Please tell Coach Kai.', 'ms-warn'));
  host.appendChild(live);

  // ---- steps by phase
  for (const ph of PHASES) {
    const box = el('details', undefined, 'ms-phase') as HTMLDetailsElement; box.dataset.k = ph.key;
    const mine = STEPS.filter((x) => x.phase === ph.key); const doneN = mine.filter((x) => st.done[x.id]).length;
    box.open = firstPaint ? ph.key === s.phase || (s.phase === 'complete' && ph.key === 'pa') : open.has(ph.key);
    box.appendChild(el('summary', `${ph.emoji} ${ph.label} (${doneN}/${mine.length})`));
    box.appendChild(el('p', ph.blurb, 'ms-blurb'));
    let lastGroup = '';
    for (const step of mine) {
      if (step.group !== lastGroup) { lastGroup = step.group; box.appendChild(el('h4', step.group, 'ms-group')); }
      box.appendChild(stepRow(step, st, act, say));
    }
    host.appendChild(box);
  }

  // ---- fees
  const fees = el('details', undefined, 'ms-phase') as HTMLDetailsElement; fees.dataset.k = 'fees'; fees.open = open.has('fees');
  fees.appendChild(el('summary', `💵 Fees: ${usd(FEE_TOTAL)} in all`));
  const ft = el('table', undefined, 'ms-fees'); const fh = el('tr'); for (const t of ['Agency', 'Fee', 'How to pay', 'Handled']) fh.appendChild(el('th', t)); ft.appendChild(el('thead')).appendChild(fh);
  const fb = el('tbody'); for (const f of FEES) { const r = el('tr'); r.append(el('td', f.state), el('td', usd(f.amount)), el('td', FEE_HOW[f.state] || ''), el('td', st.done[f.stepId] ? '✅' : '—')); fb.appendChild(r); } ft.appendChild(fb); fees.appendChild(ft);
  fees.appendChild(el('p', 'Fees are set by each agency and can change. Check the agency\'s own page before you pay.', 'ms-note')); host.appendChild(fees);

  // ---- vault tie-in
  const docs = el('details', undefined, 'ms-phase') as HTMLDetailsElement; docs.dataset.k = 'docs'; docs.open = open.has('docs');
  docs.appendChild(el('summary', '🔐 Your documents'));
  if (!st.docs || !st.docs.vaultOn) docs.appendChild(el('p', 'Keep your class certificate, ID copy and permit card in your private Document Vault so they are always at hand.', 'ms-blurb'));
  else { const ul = el('ul', undefined, 'ms-docs'); for (const [ok, label] of [[st.docs.hasCertificate, 'Class certificate'], [st.docs.hasId, 'ID copy (front and back)'], [st.docs.hasPermitCard, 'Maryland permit card (once it arrives)']] as const) ul.appendChild(el('li', `${ok ? '✅ In your vault' : '⬜ Not in your vault yet'}: ${label}`)); docs.appendChild(ul); }
  const vb = el('button', 'Open my Document Vault', 'ms-btn'); vb.type = 'button'; vb.addEventListener('click', () => act.openVault()); docs.appendChild(vb); host.appendChild(docs);

  // ---- print tools
  const tools = el('details', undefined, 'ms-phase') as HTMLDetailsElement; tools.dataset.k = 'tools'; tools.open = open.has('tools');
  tools.appendChild(el('summary', '🖨️ Printable packet, labels, worksheets and photo check'));
  tools.appendChild(el('p', 'Type your details once to fill in the printable sheets. They are used only on this screen to build the sheets: nothing is saved or sent anywhere. Social Security and driver license numbers are left blank for you to write in by hand.', 'ms-blurb'));
  const form = el('div', undefined, 'ms-form'); const inputs: Record<keyof Details, HTMLInputElement> = {} as any;
  for (const [k, label, ph, ac] of [['fullName', 'Full legal name', 'As on your ID', 'name'], ['email', 'Email', 'you@example.com', 'email'], ['phone', 'Phone', '(410) 555-0100', 'tel'], ['street', 'Street address', '123 Main St', 'street-address'], ['cityStateZip', 'City, state, zip', 'Baltimore, MD 21201', 'off'], ['dob', 'Date of birth (optional)', 'MM/DD/YYYY', 'off']] as const) {
    const lab = el('label', label); const inp = el('input'); inp.type = 'text'; inp.value = detailsMem.d[k]; inp.placeholder = ph; inp.maxLength = 120; inp.autocomplete = ac as any; inp.addEventListener('input', () => { detailsMem.d[k] = inp.value; }); lab.appendChild(inp); inputs[k] = inp; form.appendChild(lab);
  }
  tools.appendChild(form);
  const row = el('div', undefined, 'ms-tools');
  const mk = (t: string, fn: () => void) => { const b = el('button', t, 'ms-btn'); b.type = 'button'; b.addEventListener('click', fn); row.appendChild(b); };
  mk('Print Virginia packet checklist + cover sheet', () => openSheets([virginiaPacket(cleanDetails(detailsMem.d))]));
  mk('Print mailing labels (VA, FL, AZ)', () => openSheets([labelSheet(cleanDetails(detailsMem.d))]));
  mk('Print application worksheets', () => openSheets([worksheets(cleanDetails(detailsMem.d))]));
  tools.appendChild(row);
  const photo = el('label', '2×2 photo check (stays on your device): ', 'ms-photo'); const pin = el('input'); pin.type = 'file'; pin.accept = 'image/jpeg,image/png,image/webp';
  const pout = el('div', undefined, 'ms-photo-out'); pout.setAttribute('role', 'status'); pout.setAttribute('aria-live', 'polite');
  pin.addEventListener('change', async () => {
    pout.textContent = 'Checking…'; const f = pin.files && pin.files[0]; const m = f ? await measurePhoto(f) : null; pout.textContent = '';
    if (!m) { pout.textContent = 'Choose a JPG, PNG or WEBP photo (up to 20 MB).'; return; }
    const r = assessPhoto(m); pout.appendChild(el('strong', r.allGood ? '✅ Looks good for a 2×2 photo.' : 'A few things to fix before you print or upload it:'));
    for (const t of r.tips) pout.appendChild(el('div', `${t.pass ? '✅' : '⚠️'} ${t.label}${t.pass ? '' : ': ' + t.hint}`));
    pout.appendChild(el('div', 'This only checks size and background. Also: neutral expression, eyes open, no glasses or hat.', 'ms-note'));
  });
  photo.appendChild(pin); tools.appendChild(photo); tools.appendChild(pout); host.appendChild(tools);
  host.appendChild(el('p', 'Informational only, not legal advice. Agencies change forms, fees and rules, so confirm current requirements with each agency. Questions? Coach Kai: (443) 990-1304.', 'ms-note'));
}

function stepRow(step: Step, st: CardState, act: CardActions, say: (m: string, bad?: boolean) => void): HTMLElement {
  const row = el('div', undefined, 'ms-step'); const isDone = !!st.done[step.id]; const why = isDone ? null : lockedReason(step.id, st.done);
  row.classList.toggle('done', isDone); row.classList.toggle('locked', !!why);
  const b = el('button', undefined, 'ms-tick'); b.type = 'button'; b.setAttribute('role', 'checkbox'); b.setAttribute('aria-checked', String(isDone));
  b.disabled = !!why || st.setupNeeded; b.textContent = isDone ? '✓' : why ? '🔒' : '';
  const label = el('div', undefined, 'ms-sl'); label.appendChild(el('strong', step.title + (step.optional ? ' (optional)' : ''))); label.appendChild(el('span', why || step.detail, why ? 'ms-lock' : 'ms-detail'));
  b.setAttribute('aria-label', step.title + (why ? '. ' + why : '')); b.addEventListener('click', async () => {
    b.disabled = true; say(''); const err = await act.toggle(step.id, !isDone); if (err) { say(err, true); b.disabled = false; }
  });
  row.append(b, label);
  const t = TRACK_FOR[step.id];
  if (t && isDone) {
    const wrap = el('label', t.label + ' ', 'ms-track'); const inp = el('input'); inp.type = 'text'; inp.maxLength = 40; inp.value = st.tracking[t.key] || ''; inp.placeholder = 'Optional'; inp.autocomplete = 'off';
    inp.addEventListener('change', async () => { const err = await act.track(t.key, inp.value); say(err || 'Saved.', !!err); });
    wrap.appendChild(inp); label.appendChild(wrap);
  }
  return row;
}

// ---- wiring into the two dashboards ----
type Which = 'student' | 'client';
const HOSTS: Record<Which, { dash: string; host: string }> = { student: { dash: 'student-active-dashboard', host: 'ms-student' }, client: { dash: 'client-active-dashboard', host: 'ms-client' } };

async function loadDocs(): Promise<VaultDocs | null> {
  try { const st = await w.callFifsBackend('walletStatus'); if (!st || !st.enabled || !st.consented || !Array.isArray(st.docs)) return { hasCertificate: false, hasId: false, hasPermitCard: false, vaultOn: false }; const has = (k: string) => st.docs.some((d: any) => d.kind === k); return { hasCertificate: has('class_certificate'), hasId: has('other_id'), hasPermitCard: has('permit_card'), vaultOn: true }; } catch { return null; }
}
export function installMultiStateCard(): void {
  if (w.__fifsMultiStateInstalled) return; w.__fifsMultiStateInstalled = true;
  for (const which of ['student', 'client'] as Which[]) {
    const ids = HOSTS[which]; let busy = false; let state: CardState | null = null;
    const host = () => document.getElementById(ids.host); const dash = () => document.getElementById(ids.dash);
    const shown = () => { const d = dash(); return !!d && !d.classList.contains('hidden') && getComputedStyle(d).display !== 'none'; };
    const draw = () => { const h = host(); if (h && state) renderCard(h, state, actions); };
    const actions: CardActions = {
      toggle: async (id, checked) => { try { const r = await w.callFifsBackend('multiStateSet', { stepId: id, checked }); if (state) { state.done = r.done || {}; } draw(); return null; } catch (e: any) { draw(); return String((e && e.message) || 'Could not save that step.'); } },
      track: async (key, value) => { try { const r = await w.callFifsBackend('multiStateTracking', { key, value }); if (state) state.tracking = r.tracking || {}; return null; } catch (e: any) { return String((e && e.message) || 'Could not save that.'); } },
      openVault: () => w.openWallet?.(),
    };
    const refresh = async () => {
      const h = host(); if (!h) return; if (!shown()) { h.hidden = true; return; }
      if (busy || typeof w.callFifsBackend !== 'function') return; busy = true;
      try {
        const r = await w.callFifsBackend('multiStateGet', {});
        if (!r || !r.eligible) { h.hidden = true; h.textContent = ''; return; }
        state = { done: r.done || {}, tracking: r.tracking || {}, setupNeeded: !!r.setupNeeded, docs: await loadDocs(), details: detailsMem.d };
        h.hidden = false; draw();
      } catch { h.hidden = true; } finally { busy = false; }
    };
    const d = dash(); if (d) new MutationObserver(() => { void refresh(); }).observe(d, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    window.addEventListener('fifs-wallet-changed', () => { void refresh(); });
    void refresh();
  }
}
