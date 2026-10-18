// Cards at the bottom of the Student and Client dashboards that give people a reason to come back and make it easy to get help. Text only (textContent).
import { helpLinks, type Which } from './engageLogic';

const w: any = typeof window === 'undefined' ? {} : window;
function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }

export function card(emoji: string, title: string, intro: string): { box: HTMLElement; body: HTMLElement } {
  const box = el('section', undefined, 'eg-card'); box.setAttribute('aria-label', title);
  const h = el('h3'); const e = el('span', emoji, 'eg-emoji'); e.setAttribute('aria-hidden', 'true'); h.append(e, document.createTextNode(' ' + title)); box.appendChild(h);
  if (intro) box.appendChild(el('p', intro, 'eg-intro'));
  const body = el('div', undefined, 'eg-body'); box.appendChild(body); return { box, body };
}

function helpCard(which: Which): HTMLElement {
  const { box, body } = card('🤝', 'Need a hand? Coach Kai is a tap away', 'Questions about your class, your paperwork or your permit are always welcome. There is no wrong question.');
  const row = el('div', undefined, 'eg-actions');
  for (const l of helpLinks(which)) {
    if (l.action === 'chat') { const b = el('button', `${l.emoji} ${l.label}`, 'eg-btn'); b.type = 'button'; b.addEventListener('click', () => w.openContactWidgetModal?.()); row.appendChild(b); }
    else { const a = el('a', `${l.emoji} ${l.label}`, 'eg-btn'); a.href = l.href || '#'; if (l.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } row.appendChild(a); }
  }
  body.appendChild(row); return box;
}

const HOSTS: Record<Which, { dash: string; host: string }> = { student: { dash: 'student-active-dashboard', host: 'eg-student' }, client: { dash: 'client-active-dashboard', host: 'eg-client' } };
const BUILDERS: Array<(which: Which) => HTMLElement | null> = [helpCard];

export function installEngagement(): void {
  if (w.__fifsEngageInstalled) return; w.__fifsEngageInstalled = true;
  for (const which of ['student', 'client'] as Which[]) {
    const ids = HOSTS[which]; let painted = false;
    const paint = () => {
      const d = document.getElementById(ids.dash), h = document.getElementById(ids.host); if (!d || !h) return;
      const visible = !d.classList.contains('hidden') && getComputedStyle(d).display !== 'none';
      if (!visible) { painted = false; return; } if (painted) return; painted = true;
      h.textContent = ''; for (const b of BUILDERS) { const c = b(which); if (c) h.appendChild(c); } h.hidden = false;
    };
    const d = document.getElementById(ids.dash); if (d) new MutationObserver(paint).observe(d, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    paint();
  }
}
