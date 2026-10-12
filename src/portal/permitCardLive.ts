// Keeps the Handgun Wear & Carry permit card on the Client dashboard in step with the signed-in client's own records.
// - If the client has put a permit card in their Document Vault and it is a photo, that photo replaces the placeholder "VERIFIED" picture.
// - The details beside it come from the client's saved profile (name, permit, expiration, renewal watch) and, when the vault document has its own
//   expiration date, from that date. Nothing is read out of the photo itself: restrictions and class are shown as "see your permit card".
// Everything goes through the same server calls as the vault (verified login, own files only). Text only (textContent); the photo is shown from a
// short-lived address made in this browser and removed again on sign-out.
import { daysLeft, parseExpiry } from './ics';
import { prettyDate, type VaultDoc } from './vaultLogic';

const w: any = typeof window === 'undefined' ? {} : window;
const $ = (id: string) => document.getElementById(id);
const DEFAULTS: Record<string, string> = {};

export interface CardFacts { expiresText: string; expiresColor: string; renewalText: string; restrictions: string; klass: string; reach: string }

/** The newest permit-card document in the vault, or null. */
export function newestPermit(docs: readonly VaultDoc[]): VaultDoc | null {
  const list = docs.filter((d) => d.kind === 'permit_card').sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
  return list[0] || null;
}

/** What the card should say, from the profile expiration, the vault document's own date (wins when present), the renewal-watch choice and the permit state. */
export function cardFacts(opts: { profileExpiry: string; docExpiry: string | null; hasPermitDoc: boolean; optIn: boolean | null; permitState: string; now?: Date }): CardFacts {
  const exp = parseExpiry(opts.docExpiry || '') || parseExpiry(opts.profileExpiry);
  const now = opts.now || new Date();
  let expiresText = 'Not on file yet', expiresColor = '#cbd5e1', renewalText = opts.optIn === false ? 'Not turned on' : 'Add your expiration date';
  if (exp) {
    const d = daysLeft(exp, now);
    expiresText = prettyDate(exp.toISOString().slice(0, 10));
    expiresColor = d < 0 ? '#ff8a8a' : d <= 90 ? '#ffd166' : '#34d399';
    const watch = opts.optIn !== false;
    renewalText = !watch ? 'Not turned on' : d < 0 ? 'Permit expired ' + -d + ' day' + (d === -1 ? '' : 's') + ' ago' : d <= 90 ? d + ' day' + (d === 1 ? '' : 's') + ' left: renewal window open' : 'Active (' + d + ' days left)';
  }
  const md = /maryland/i.test(opts.permitState || 'Maryland');
  return {
    expiresText, expiresColor, renewalText,
    restrictions: opts.hasPermitDoc ? 'As printed on your permit card' : 'See your permit card',
    klass: opts.hasPermitDoc ? 'As printed on your permit card' : 'See your permit card',
    reach: md ? '34+ States Recognized' : 'Open the Reciprocity Hub to check',
  };
}

let shownId = '', shownUrl = '', running = false, again = false;
function setText(id: string, text: string, color?: string) { const e = $(id); if (!e) return; if (!(id in DEFAULTS)) DEFAULTS[id] = e.textContent || ''; e.textContent = text; if (color) e.style.color = color; }
function restoreDefaults() { for (const id of Object.keys(DEFAULTS)) { const e = $(id); if (e) { e.textContent = DEFAULTS[id]; e.style.color = ''; } } }
function clearPhoto() {
  const box = $('wallet-photo-box'); if (box) box.classList.remove('has-photo'); box?.querySelectorAll('img.wallet-photo-img').forEach((n) => n.remove());
  const fallback = box?.querySelector<HTMLElement>('.wallet-photo-fallback'); if (fallback) fallback.hidden = false;
  if (shownUrl) { URL.revokeObjectURL(shownUrl); shownUrl = ''; } shownId = '';
}
function showPhoto(url: string, id: string) {
  const box = $('wallet-photo-box'); if (!box) { URL.revokeObjectURL(url); return; }
  box.querySelectorAll('img.wallet-photo-img').forEach((n) => n.remove());
  const img = document.createElement('img'); img.className = 'wallet-photo-img'; img.alt = 'Your permit card'; img.src = url;
  box.insertBefore(img, box.firstChild); box.classList.add('has-photo');
  const fallback = box.querySelector<HTMLElement>('.wallet-photo-fallback'); if (fallback) fallback.hidden = true;
  if (shownUrl) URL.revokeObjectURL(shownUrl); shownUrl = url; shownId = id;
}

async function refresh() {
  if (running) { again = true; return; }
  running = true;
  try {
    const dash = $('client-active-dashboard');
    if (!dash || dash.classList.contains('hidden') || getComputedStyle(dash).display === 'none') { clearPhoto(); restoreDefaults(); return; }
    const rec = w.__fifsClientPortalRecord || {};
    let docs: VaultDoc[] = [];
    try { if (typeof w.callFifsBackend === 'function') { const st = await w.callFifsBackend('walletStatus'); if (st && st.enabled && st.consented && Array.isArray(st.docs)) docs = st.docs; } } catch { /* the vault is optional; the card still fills from the profile */ }
    const doc = newestPermit(docs);
    const badge = ($('dash-client-exp-badge')?.textContent || '').trim();
    const profileExpiry = rec.expirationDate || (/Expiration:\s*(.+)$/i.exec(badge)?.[1] || '');
    const f = cardFacts({ profileExpiry, docExpiry: doc ? doc.expiresOn : null, hasPermitDoc: !!doc, optIn: typeof rec.optInReminder === 'boolean' ? rec.optInReminder : null, permitState: rec.permitState || ($('dash-client-permit')?.textContent || '') });
    setText('wallet-exp-date', f.expiresText, f.expiresColor);
    setText('wallet-days-left', f.renewalText);
    setText('wallet-carry-reach', f.reach);
    setText('wallet-restrictions', f.restrictions);
    setText('wallet-class', f.klass);
    if (rec.permitState) setText('wallet-primary-permit', String(rec.permitState));
    if (rec.fullName) setText('wallet-cardholder-name', String(rec.fullName).trim().slice(0, 60).toUpperCase());
    if (!doc) { clearPhoto(); return; }
    if (doc.id === shownId) return;
    if (/^image\//.test(doc.mime)) {
      const r = await w.callFifsBackend('walletOpen', { id: doc.id });
      const bytes = Uint8Array.from(atob(r.dataBase64), (c) => c.charCodeAt(0));
      showPhoto(URL.createObjectURL(new Blob([bytes], { type: r.mime })), doc.id);
    } else { clearPhoto(); const fb = $('wallet-photo-box')?.querySelector<HTMLElement>('.wallet-photo-fallback'); if (fb) fb.textContent = '📄'; }
  } catch { /* leave the card as it is; nothing here is worth interrupting the client for */ }
  finally { running = false; if (again) { again = false; void refresh(); } }
}

export function installPermitCardLive(): void {
  if (w.__fifsPermitLiveInstalled) return;
  w.__fifsPermitLiveInstalled = true;
  const dash = $('client-active-dashboard');
  if (dash) new MutationObserver(() => { void refresh(); }).observe(dash, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  window.addEventListener('fifs-wallet-changed', () => { void refresh(); });
  void refresh();
}
