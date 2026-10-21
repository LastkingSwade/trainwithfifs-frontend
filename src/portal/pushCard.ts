import { readState, turnOff, turnOn, type CardState } from '../pwa/pushClient';

// The "🔔 Reminders" card in the Student and Client portals. It only appears when the website has notifications switched on and this device can receive them.
// Nothing happens until the person taps the button. Text is set with textContent only.
const w: any = typeof window === 'undefined' ? {} : window;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

export const COPY = {
  title: '🔔 Reminders on this device',
  intro: 'Short reminders: your class day, payments we record, permit renewal dates, and notes from Coach Kai. They never show your name, amounts or any personal details. Turn them off here any time.',
  on: '✅ Reminders are on for this device.',
  blocked: 'Notifications are blocked for this site. Allow them in your browser or phone settings, then come back here.',
  install: 'On iPhone and iPad, reminders work once the app is on your Home Screen. Tap Share, then “Add to Home Screen”, open the FIFS app from there, and come back to this card.',
} as const;

export function renderPush(host: HTMLElement, state: CardState, handlers: { on: () => Promise<string>; off: () => Promise<string> }): void {
  host.textContent = ''; if (state === 'hidden') { host.hidden = true; return; } host.hidden = false;
  const card = el('div', 'pn-card'); card.appendChild(el('h3', 'pn-h', COPY.title));
  card.appendChild(el('p', 'pn-p', state === 'on' ? COPY.on : state === 'blocked' ? COPY.blocked : state === 'needs-install' ? COPY.install : COPY.intro));
  const note = el('p', 'pn-note'); note.setAttribute('role', 'status'); note.setAttribute('aria-live', 'polite');
  if (state === 'off' || state === 'on') {
    const b = el('button', 'pn-btn' + (state === 'on' ? ' off' : ''), state === 'on' ? 'Turn off reminders' : '🔔 Turn on reminders'); (b as HTMLButtonElement).type = 'button';
    b.addEventListener('click', async () => { (b as HTMLButtonElement).disabled = true; note.textContent = '…'; const m = await (state === 'on' ? handlers.off() : handlers.on()); note.textContent = m; (b as HTMLButtonElement).disabled = false; });
    card.appendChild(b);
  }
  card.appendChild(note); host.appendChild(card);
}

export function installPushCard(): void {
  if (w.__fifsPushCardInstalled) return; w.__fifsPushCardInstalled = true;
  const pairs: Array<[string, string]> = [['push-student', 'student-active-dashboard'], ['push-client', 'client-active-dashboard']]; let busy = false;
  const call = (a: string, p?: Record<string, unknown>) => w.callFifsBackend(a, p || {});
  const refresh = async () => {
    if (busy || typeof w.callFifsBackend !== 'function') return; busy = true;
    try {
      for (const [hostId, dashId] of pairs) {
        const host = document.getElementById(hostId), d = document.getElementById(dashId); if (!host) continue;
        const visible = !!d && !d.classList.contains('hidden') && getComputedStyle(d).display !== 'none'; if (!visible) { host.hidden = true; continue; }
        const { state, key } = await readState(call);
        renderPush(host, state, { on: async () => { const r = await turnOn(call, key); if (r.ok) void refresh(); return r.message; }, off: async () => { const r = await turnOff(call); if (r.ok) void refresh(); return r.message; } });
      }
    } catch { /* the card simply stays hidden */ } finally { busy = false; }
  };
  for (const [, dashId] of pairs) { const d = document.getElementById(dashId); if (d) new MutationObserver(() => { void refresh(); }).observe(d, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] }); }
  void refresh();
}
