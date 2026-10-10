// The 💻 toggle on the class cards, next to the Standard / 👑 VIP switch. It is independent of the tier: Standard or VIP, in person or live online.
// It only changes what the card shows (price with the remote-delivery fee, button text) and tells the booking form to start with the online option on.
// The server prices and checks every booking again; nothing here is trusted.
import { courseKeyFor, onlineEligible, remoteFeePerPerson } from '@/Lib/pricing';

export const CARD_KEYS = ['mastery', 'combo', 'ccw', 'renewal', 'hql'] as const;
const money = (n: number) => '$' + n.toFixed(2);

export function installCardToggles(onSelect: (key: string, on: boolean) => void): void {
  const on: Record<string, boolean> = {};
  let busy = false;

  const isVip = (card: HTMLElement) => card.classList.contains('vip-mode-active');
  const apply = (key: string) => {
    const card = document.getElementById('card-course-' + key), btn = document.getElementById('tog-online-' + key);
    if (!card || !btn) return;
    btn.setAttribute('aria-pressed', String(!!on[key]));
    btn.classList.toggle('is-on', !!on[key]);
    if (!on[key]) return;
    busy = true;
    try {
      const val = card.querySelector<HTMLElement>('#price-course-' + key + ' .price-val');
      const tag = card.querySelector<HTMLElement>('#price-course-' + key + ' .price-tier-tag');
      // Idempotent: if the price already shows the fee we added, do nothing (the page's own code re-draws it from the plain tier price).
      if (val && val.dataset.fifsOnlineText === val.textContent) return;
      const base = val ? parseFloat((val.textContent || '').replace(/[^0-9.]/g, '')) : NaN;
      if (val && isFinite(base)) {
        val.textContent = money(base + remoteFeePerPerson(base));
        val.dataset.fifsOnlineText = val.textContent;
        if (tag) tag.textContent = isVip(card) ? '(👑 VIP ★ + 💻 Live Online)' : '(Standard + 💻 Live Online)';
        const sel = document.getElementById('btn-select-course-' + key);
        if (sel) sel.textContent = `Select ${isVip(card) ? '👑 VIP ' : ''}💻 Online (${val.textContent}) & Reserve Seat →`;
      }
    } finally { busy = false; }
  };
  const watchers: MutationObserver[] = [];

  for (const key of CARD_KEYS) {
    const wrap = document.querySelector('#card-course-' + key + ' .tier-toggle-wrapper');
    if (!wrap || document.getElementById('tog-online-' + key)) continue;
    const b = document.createElement('button');
    b.type = 'button'; b.id = 'tog-online-' + key; b.className = 'tier-online-btn';
    b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'Live online classroom (Day 1 over video, Day 2 in person)');
    b.title = 'Live Online Classroom: Day 1 over video, Day 2 in person at the range (+20% remote-delivery fee)';
    b.textContent = '💻';
    b.addEventListener('click', (e) => {
      e.stopPropagation(); e.preventDefault();
      on[key] = !on[key];
      const w = window as any, card = document.getElementById('card-course-' + key);
      // Re-draw the card in its current tier (this removes the fee when switching off), then add the fee back if it is on.
      if (typeof w.setCardTier === 'function' && card) w.setCardTier(key, isVip(card) ? 'vip' : 'base');
      apply(key);
      watchers.forEach((m) => m.takeRecords());
    });
    wrap.appendChild(b);
    // The tier switch re-draws the price and the button; put the online fee back whenever that happens.
    const watch = new MutationObserver(() => { if (!busy && on[key]) apply(key); });
    watchers.push(watch);
    for (const id of ['price-course-' + key, 'btn-select-course-' + key]) { const el = document.getElementById(id); if (el) watch.observe(el, { childList: true, characterData: true, subtree: true }); }
  }

  // Choosing a class from a card starts the booking form with the online option matching that card's 💻.
  const w = window as any, orig = w.selectCourse;
  if (typeof orig === 'function') {
    w.selectCourse = function (value: string, ...rest: unknown[]) {
      const r = orig.call(this, value, ...rest);
      const key = courseKeyFor(String(value || ''));
      if (key && onlineEligible(String(value))) onSelect(key, !!on[key]);
      return r;
    };
  }
}
