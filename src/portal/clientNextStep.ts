// "Your next step" on the Client dashboard: one clear thing to do, chosen from what we already know (permit date, renewal reminders, whether a permit card is in
// the vault). It mirrors the Priority Action card students get. Pure choice logic here; text is set with textContent only.
export type RunKey = 'renewal' | 'profile' | 'vault' | 'reciprocity';
export interface NextStep { key: string; emoji: string; title: string; text: string; cta: string; run: RunKey }
export interface Facts { days: number | null; hasPermitDoc: boolean; optIn: boolean | null }
const plural = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

export function nextStep(f: Facts): NextStep {
  const d = f.days;
  if (d === null) return { key: 'add-date', emoji: '📅', title: 'Add your permit expiration date', text: 'Then your countdown, calendar reminders and renewal window will appear here automatically.', cta: 'Open my profile', run: 'profile' };
  if (d < 0) return { key: 'expired', emoji: '⚠️', title: 'Your permit date has passed', text: 'Check what applies to you and pick the right class. Coach Kai can point you the right way: 443-990-1304.', cta: 'Open Permit & Renewal', run: 'renewal' };
  if (d === 0) return { key: 'renew-now', emoji: '⏱️', title: 'Your permit expires today', text: 'State Police processing can take up to 90 days, so renew as soon as you can. Coach Kai can help you decide the next step: 443-990-1304.', cta: 'Open Permit & Renewal', run: 'renewal' };
  if (d < 90) return { key: 'renew-now', emoji: '⏱️', title: `Renew now: ${plural(d)} left`, text: 'State Police processing can take up to 90 days. Book your 8-hour renewal class this week and apply as soon as you can.', cta: 'Open Permit & Renewal', run: 'renewal' };
  if (d <= 120) return { key: 'renew-soon', emoji: '🗓️', title: 'Book your renewal class', text: `Your renewal window is open (${plural(d)} left). Classes fill up, so book soon to keep your date.`, cta: 'Open Permit & Renewal', run: 'renewal' };
  if (!f.hasPermitDoc) return { key: 'add-card', emoji: '🔐', title: 'Put your permit card in your Document Vault', text: 'Keep it private and close at hand. A photo of it will also show on your permit card here.', cta: 'Open my vault', run: 'vault' };
  if (f.optIn === false) return { key: 'turn-on-reminders', emoji: '🔔', title: 'Turn on your renewal reminders', text: 'We will tell you when your renewal window opens and apply your 10% Future Initiative discount.', cta: 'Open my profile', run: 'profile' };
  return { key: 'all-set', emoji: '✅', title: "You're all set", text: `Your renewal window opens in ${plural(d - 120)}. Meanwhile, check where your permit lets you carry.`, cta: 'Open the Reciprocity Hub', run: 'reciprocity' };
}

const w: any = typeof window === 'undefined' ? {} : window;
const RUNNERS: Record<RunKey, () => void> = {
  renewal: () => w.openPermitRenewalModal?.(), profile: () => w.openClientProfileModal?.(), vault: () => w.openWallet?.(), reciprocity: () => w.toggleReciprocityHubModal?.(true),
};
export function renderNextStep(host: HTMLElement, s: NextStep | null): void {
  host.textContent = '';
  if (!s) { host.hidden = true; return; }
  const ico = document.createElement('span'); ico.className = 'cns-ico'; ico.setAttribute('aria-hidden', 'true'); ico.textContent = s.emoji;
  const eyebrow = document.createElement('span'); eyebrow.className = 'cns-eyebrow'; eyebrow.textContent = 'Your next step';
  const h = document.createElement('h3'); h.className = 'cns-title'; h.textContent = s.title;
  const p = document.createElement('p'); p.className = 'cns-text'; p.textContent = s.text;
  const copy = document.createElement('div'); copy.className = 'cns-copy'; copy.append(eyebrow, h, p);
  const b = document.createElement('button'); b.type = 'button'; b.className = 'cns-btn'; b.textContent = s.cta + ' ↗'; b.addEventListener('click', () => RUNNERS[s.run]());
  host.append(ico, copy, b); host.dataset.step = s.key; host.hidden = false;
}
