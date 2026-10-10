// Student Portal card: "Your live online classroom". Shows only the signed-in student's own paid online booking. The join link comes from
// the server and only after payment; Day 2 is always in person.
import { DAY2_STATEMENT, ONLINE_NAME, TECH_REQUIREMENTS } from './onlineCopy';

const when = (iso: string) => new Date(iso).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
interface Klass { invoiceNumber: string; classroom: { startsAt: string; meetingUrl: string; attended: boolean } | null; range: { startsAt: string; attended: boolean } | null; day2Attended: boolean }

function el(tag: string, text?: string, cls?: string): HTMLElement { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }

export function renderOnlineCard(box: HTMLElement, classes: Klass[]): void {
  box.textContent = '';
  if (!classes.length) { box.hidden = true; return; }
  box.hidden = false;
  box.className = 'online-card';
  box.appendChild(el('h3', '💻 ' + ONLINE_NAME));
  for (const c of classes) {
    const wrap = el('div');
    if (c.classroom) {
      const p = el('p'); p.append(el('strong', 'Live classroom (over video): '), document.createTextNode(when(c.classroom.startsAt))); wrap.appendChild(p);
      if (/^https:\/\//.test(c.classroom.meetingUrl)) {
        const a = document.createElement('a'); a.className = 'join'; a.href = c.classroom.meetingUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Join the live classroom'; wrap.appendChild(a);
      } else wrap.appendChild(el('p', 'Your join link will appear here as soon as it is posted.'));
    }
    if (c.range) { const p = el('p'); p.append(el('strong', 'Day 2 range day (IN PERSON at the range): '), document.createTextNode(when(c.range.startsAt))); wrap.appendChild(p); }
    wrap.appendChild(el('p', c.day2Attended ? 'Day 2 attendance is recorded. Your certificate steps are unlocked.' : 'Day 2 attendance is not recorded yet. Your certificate and completion unlock after your in-person range day.', c.day2Attended ? '' : 'locked'));
    box.appendChild(wrap);
  }
  box.appendChild(el('p', DAY2_STATEMENT));
  box.appendChild(el('p', TECH_REQUIREMENTS));
}

export function installStudentOnline(): void {
  const w = window as any;
  if (w.__fifsStudentOnlineInstalled) return;
  w.__fifsStudentOnlineInstalled = true;
  let busy = false;
  const refresh = async () => {
    const dash = document.getElementById('student-active-dashboard'); const box = document.getElementById('dash-online-card');
    if (!dash || !box || busy || dash.classList.contains('hidden') || dash.hidden || getComputedStyle(dash).display === 'none') return;
    busy = true;
    try { const d = await w.callFifsBackend('studentOnlineClass', {}); renderOnlineCard(box, (d && d.classes) || []); } catch { box.hidden = true; }
    busy = false;
  };
  const start = () => {
    const dash = document.getElementById('student-active-dashboard'); if (!dash) return;
    new MutationObserver(refresh).observe(dash, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    refresh();
  };
  start();
}
