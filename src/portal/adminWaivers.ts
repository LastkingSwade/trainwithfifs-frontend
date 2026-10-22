// Admin Hub: shows, on each student's roster row, whether their safety waiver is signed, and opens the signed waiver to read. Staff only: the server checks the role for both calls,
// and nothing here writes. Everything is drawn with textContent (names and phone numbers come from students, so they are never treated as HTML).
const w: any = typeof window === 'undefined' ? {} : window;
type Summary = { studentId: string; signedName: string; signedAt: string; version: string };
type Record_ = Summary & { initials: string; signature: string; emergencyName: string; emergencyRelation: string; emergencyPhone: string; phone: string; email: string; under18: boolean };
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

export const fmtWhen = (iso: string): string => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); };

let cache: Map<string, Summary> | null = null; let available = true; let loadedAt = 0; let failed = false; let inflight: Promise<void> | null = null;
function load(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const r = await w.callFifsBackend('adminWaiverList', {});
      cache = new Map(); for (const s of (r && r.waivers) || []) cache.set(String(s.studentId), s);
      available = !(r && r.available === false); failed = false; loadedAt = Date.now();
    } catch { failed = true; loadedAt = Date.now(); }
    finally { inflight = null; }
  })();
  return inflight;
}

function paint(): void {
  document.querySelectorAll<HTMLElement>('[data-admin-waiver]').forEach((host) => {
    const id = host.getAttribute('data-admin-waiver') || ''; host.textContent = '';
    if (failed || !cache) { host.append(el('span', 'fwv-note', '✍️ Waiver: could not load')); return; }
    if (!available) { host.append(el('span', 'fwv-note', '✍️ Waiver records are not set up yet')); return; }
    const s = cache.get(id);
    if (!s) { host.append(el('span', 'fwv-no', '✍️ Waiver: NOT SIGNED')); return; }
    host.append(el('span', 'fwv-yes', '✍️ Waiver signed ' + (fmtWhen(s.signedAt) || '')));
    const b = el('button', 'fwv-view', 'View waiver'); b.type = 'button'; b.addEventListener('click', () => { void openWaiver(id); }); host.append(b);
  });
}

function row(dl: HTMLElement, label: string, value: string) { if (!value) return; dl.append(el('dt', undefined, label), el('dd', undefined, value)); }
async function openWaiver(studentId: string): Promise<void> {
  const prev = document.activeElement as HTMLElement | null;
  const overlay = el('div', 'fwv-overlay'); const box = el('div', 'fwv-box'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'fwvTitle');
  const head = el('div', 'fwv-head'); const title = el('h2', undefined, '✍️ Signed safety waiver'); title.id = 'fwvTitle';
  const close = el('button', 'fwv-close', '✕'); close.type = 'button'; close.setAttribute('aria-label', 'Close waiver'); head.append(title, close);
  const body = el('div', 'fwv-body', 'Loading…'); body.setAttribute('role', 'status'); box.append(head, body); overlay.append(box); document.body.append(overlay);
  const shut = () => { overlay.remove(); document.removeEventListener('keydown', onKey, true); if (prev && prev.focus) prev.focus(); };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); shut(); } };
  document.addEventListener('keydown', onKey, true); close.addEventListener('click', shut); overlay.addEventListener('click', (e) => { if (e.target === overlay) shut(); }); close.focus();
  try {
    const r = await w.callFifsBackend('adminWaiverGet', { studentId }); const d: Record_ | null = r && r.waiver; body.textContent = ''; body.removeAttribute('role');
    if (!d) { body.textContent = 'No signed waiver is on file for this student.'; return; }
    const dl = el('dl', 'fwv-dl');
    row(dl, 'Student ID', d.studentId); row(dl, 'Signed name', d.signedName); row(dl, 'Initials', d.initials); row(dl, 'Signature', d.signature); row(dl, 'Signed', fmtWhen(d.signedAt)); row(dl, 'Waiver version', d.version);
    row(dl, 'Phone', d.phone); row(dl, 'Email', d.email); row(dl, 'Under 18', d.under18 ? 'Yes' : 'No');
    row(dl, 'Emergency contact', [d.emergencyName, d.emergencyRelation && '(' + d.emergencyRelation + ')'].filter(Boolean).join(' ')); row(dl, 'Emergency phone', d.emergencyPhone);
    body.append(dl);
  } catch { body.textContent = 'This waiver could not be loaded right now. Please try again.'; }
}

export function installAdminWaivers(): void {
  if (typeof document === 'undefined' || w.__fifsAdminWaivers) return; w.__fifsAdminWaivers = true;
  let tries = 0;
  const attach = () => {
    const tbody = document.getElementById('admin-roster-tbody');
    if (!tbody) { if (tries++ < 20) window.setTimeout(attach, 1000); return; }
    const run = async () => { if (!tbody.querySelector('[data-admin-waiver]')) return; if (!cache || Date.now() - loadedAt > 20000) await load(); paint(); };
    new MutationObserver(() => { void run(); }).observe(tbody, { childList: true }); void run();
  };
  attach();
}
