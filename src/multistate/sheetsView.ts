// Shows the printable sheets on top of the page and prints just them. Text only (textContent). Nothing is stored or sent.
import type { Sheet } from './sheets';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }

export function renderSheet(s: Sheet): HTMLElement {
  const page = el('article', undefined, 'ms-sheet');
  page.appendChild(el('h2', s.title)); if (s.subtitle) page.appendChild(el('p', s.subtitle, 'ms-sub'));
  for (const b of s.blocks) {
    const box = el('section', undefined, 'ms-block'); if (b.h) box.appendChild(el('h3', b.h));
    if (b.big) { const addr = el('div', undefined, 'ms-addr'); for (const l of b.big) addr.appendChild(el('div', l)); box.appendChild(addr); }
    if (b.lines) for (const l of b.lines) box.appendChild(el('p', l, 'ms-line'));
    if (b.checklist) { const ul = el('ul', undefined, 'ms-check'); for (const c of b.checklist) { const li = el('li'); li.appendChild(el('span', '☐', 'ms-box')); li.appendChild(el('span', c)); ul.appendChild(li); } box.appendChild(ul); }
    if (b.table) { const t = el('table', undefined, 'ms-table'); const hr = el('tr'); for (const h of b.table.head) hr.appendChild(el('th', h)); t.appendChild(el('thead')).appendChild(hr); const tb = el('tbody'); for (const r of b.table.rows) { const tr = el('tr'); for (const c of r) tr.appendChild(el('td', c)); tb.appendChild(tr); } t.appendChild(tb); box.appendChild(t); }
    if (b.note) box.appendChild(el('p', b.note, 'ms-note'));
    page.appendChild(box);
  }
  return page;
}

export function openSheets(sheets: Sheet[]): void {
  document.getElementById('ms-print')?.remove();
  const root = el('div', undefined, 'ms-print'); root.id = 'ms-print'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Printable sheets');
  const bar = el('div', undefined, 'ms-print-bar');
  const print = el('button', 'Print', 'ms-btn primary'); print.type = 'button'; print.addEventListener('click', () => window.print());
  const close = el('button', 'Close', 'ms-btn'); close.type = 'button'; const done = () => { root.remove(); document.removeEventListener('keydown', onKey); document.body.classList.remove('ms-printing'); }; close.addEventListener('click', done);
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') done(); }; document.addEventListener('keydown', onKey);
  bar.append(print, close); root.appendChild(bar); for (const s of sheets) root.appendChild(renderSheet(s));
  document.body.appendChild(root); document.body.classList.add('ms-printing'); print.focus();
}

/** Reads a photo on this device and measures it (size, and how light and even the edges are). Never uploaded. */
export async function measurePhoto(file: File): Promise<{ width: number; height: number; bgLightness: number; bgSpread: number } | null> {
  if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 20 * 1024 * 1024) return null;
  try {
    const bmp = await createImageBitmap(file); const w = bmp.width, h = bmp.height; const scale = Math.min(1, 200 / Math.max(w, h));
    const cw = Math.max(8, Math.round(w * scale)), ch = Math.max(8, Math.round(h * scale)); const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const ctx = c.getContext('2d'); if (!ctx) return null; ctx.drawImage(bmp, 0, 0, cw, ch); const data = ctx.getImageData(0, 0, cw, ch).data;
    const band = Math.max(2, Math.round(Math.min(cw, ch) * 0.06)); const vals: number[] = [];
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { if (x < band || y < band || x >= cw - band) { const i = (y * cw + x) * 4; vals.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]); } }
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length; const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / vals.length);
    bmp.close?.(); return { width: w, height: h, bgLightness: Math.round(mean), bgSpread: Math.round(sd) };
  } catch { return null; }
}
