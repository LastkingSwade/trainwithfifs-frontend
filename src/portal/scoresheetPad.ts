// Score sheet pad: in Admin Hub > Student Roster > Edit, the "Choose file" box is replaced by an editable copy of the official MSP 29-14 form.
// Tap it, fill it out with Apple Pencil (or a mouse), tap Done, then press the existing "Save score sheet" button. The finished page is attached as a
// PNG through the same file box the Save button already reads, so the server, the size limit (3 MB) and the student's portal view are unchanged.
// Plain DOM, text via textContent, no library. A finger scrolls the form; the Pencil (or mouse) writes.
const w: any = typeof window === 'undefined' ? {} : window;
export const FORM_IMAGE = '/forms/msp-29-14-score-sheet.png';
export const PEN_COLORS: ReadonlyArray<readonly [string, string]> = [['#0b2a8a', 'Blue'], ['#111111', 'Black'], ['#b3001b', 'Red']];
export const ZOOMS: ReadonlyArray<readonly [number, string]> = [[1, 'Fit'], [1.6, '160%'], [2.4, '240%']];
export const MAX_STROKES = 4000;

interface Pt { x: number; y: number; p: number }
interface Stroke { color: string; size: number; erase: boolean; pts: Pt[] }

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }

/** Width of one segment: a light touch is thin, a firm press is thicker (mouse has no pressure, so it uses the base size). */
export function strokeWidth(size: number, pressure: number, pointerType: string): number {
  const p = pointerType === 'pen' && pressure > 0 ? Math.min(1, Math.max(0.15, pressure)) : 0.5;
  return Math.max(0.8, size * (0.5 + p));
}

export function installScoresheetPad(): void {
  if (w.__fifsScoresheetPadInstalled) return;
  const input = document.getElementById('editScoresheetFileInput') as HTMLInputElement | null;
  const modal = document.getElementById('adminEditStudentModal');
  if (!input || !modal) return;
  w.__fifsScoresheetPadInstalled = true;
  const field = input.parentElement as HTMLElement;
  const label = field.querySelector('label');

  // The old file box moves into a small fold-away, so a scan or photo can still be attached if ever needed.
  const fold = el('details', undefined, 'ssp-fold');
  fold.appendChild(el('summary', 'Prefer to upload a file instead?'));
  if (label) fold.appendChild(label);
  fold.appendChild(input);
  field.appendChild(fold);

  const box = el('div', undefined, 'ssp-box'); box.id = 'scoresheetPadBox';
  box.appendChild(el('div', 'Official MSP 29-14 score sheet', 'ssp-title'));
  box.appendChild(el('p', 'Tap the form, fill it out with your Apple Pencil, tap Done, then press Save score sheet. It goes to this student\'s portal.', 'ssp-help'));
  const thumbBtn = el('button', undefined, 'ssp-thumb'); thumbBtn.type = 'button'; thumbBtn.setAttribute('aria-label', 'Open the score sheet form to fill out');
  const thumb = el('img'); thumb.src = FORM_IMAGE; thumb.alt = 'The Maryland State Police certified qualification score sheet, ready to fill out'; thumb.width = 300; thumb.height = 386;
  thumbBtn.appendChild(thumb); thumbBtn.appendChild(el('span', '✍️ Tap to fill out', 'ssp-cta'));
  const status = el('div', '', 'ssp-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  box.append(thumbBtn, status);
  field.insertBefore(box, fold);

  let strokes: Stroke[] = [];
  let attached = false;
  const baseImg = new Image(); baseImg.src = FORM_IMAGE;

  const reset = () => {
    strokes = []; attached = false;
    thumb.src = FORM_IMAGE; status.textContent = '';
    try { input.value = ''; } catch { /* ignore */ }
  };
  // A different student (or a fresh open) starts from a clean form.
  let wasOpen = false;
  const isOpen = () => getComputedStyle(modal).display !== 'none';
  new MutationObserver(() => { const now = isOpen(); if (now && !wasOpen) reset(); wasOpen = now; }).observe(modal, { attributes: true, attributeFilter: ['class', 'style'] });

  const open = () => {
    const overlay = el('div', undefined, 'ssp-overlay'); overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', 'Fill out the score sheet');
    const bar = el('div', undefined, 'ssp-bar');
    let color = PEN_COLORS[0][0], size = 3, erase = false, zoom = 1;
    const btn = (text: string, onClick: () => void, extra = '') => { const b = el('button', text, 'ssp-btn ' + extra); b.type = 'button'; b.addEventListener('click', onClick); return b; };
    const colorBtns: HTMLButtonElement[] = [];
    for (const [c, name] of PEN_COLORS) { const b = btn('', () => { color = c; erase = false; sync(); }); b.style.background = c; b.setAttribute('aria-label', name + ' pen'); b.title = name + ' pen'; b.dataset.color = c; colorBtns.push(b); bar.appendChild(b); }
    const eraser = btn('Eraser', () => { erase = !erase; sync(); });
    const thin = btn('Fine', () => { size = 2; sync(); }), thick = btn('Bold', () => { size = 5; sync(); });
    const zoomBtns = ZOOMS.map(([z, name]) => btn(name, () => { zoom = z; layout(); sync(); }));
    const undo = btn('↶ Undo', () => { strokes.pop(); redraw(); });
    const clear = btn('Clear all', () => { if (strokes.length && !window.confirm('Clear everything you wrote on this form?')) return; strokes = []; redraw(); });
    const cancel = btn('Cancel', () => close(false));
    const done = btn('✓ Done', () => close(true), 'ssp-done');
    bar.append(eraser, thin, thick, ...zoomBtns, undo, clear, cancel, done);
    const scroller = el('div', undefined, 'ssp-scroll');
    const canvas = el('canvas', undefined, 'ssp-canvas');
    scroller.appendChild(canvas); overlay.append(bar, scroller); document.body.appendChild(overlay);
    document.body.classList.add('modal-open');

    const W = baseImg.naturalWidth || 1240, H = baseImg.naturalHeight || 1597;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const layout = () => { const avail = Math.min(scroller.clientWidth || 800, 1100); canvas.style.width = Math.round(avail * zoom) + 'px'; canvas.style.height = Math.round(avail * zoom * (H / W)) + 'px'; };
    const sync = () => {
      colorBtns.forEach((b) => b.classList.toggle('on', !erase && b.dataset.color === color));
      eraser.classList.toggle('on', erase); thin.classList.toggle('on', size === 2); thick.classList.toggle('on', size === 5);
      zoomBtns.forEach((b, i) => b.classList.toggle('on', ZOOMS[i][0] === zoom));
    };
    // Ink lives on its own transparent layer (so the eraser removes ink, never the printed form). The screen is the form with the ink laid over it.
    const ink = document.createElement('canvas'); ink.width = W; ink.height = H;
    const ictx = ink.getContext('2d')!;
    const composite = () => { ctx.clearRect(0, 0, W, H); ctx.drawImage(baseImg, 0, 0, W, H); ctx.drawImage(ink, 0, 0); };
    const segment = (s: Stroke, i: number) => {
      const m = s.erase ? 4 : 1;
      ictx.save(); ictx.lineCap = 'round'; ictx.lineJoin = 'round';
      ictx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over'; ictx.strokeStyle = s.color; ictx.fillStyle = s.color;
      if (i === 0) { ictx.beginPath(); ictx.arc(s.pts[0].x, s.pts[0].y, strokeWidth(s.size * m, s.pts[0].p, 'pen') / 2, 0, Math.PI * 2); ictx.fill(); }
      else { const a = s.pts[i - 1], b = s.pts[i]; ictx.beginPath(); ictx.lineWidth = strokeWidth(s.size * m, b.p, 'pen'); ictx.moveTo(a.x, a.y); ictx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2); ictx.stroke(); }
      ictx.restore();
    };
    const redraw = () => { ictx.clearRect(0, 0, W, H); for (const s of strokes) for (let i = 0; i < s.pts.length; i += 1) segment(s, i); composite(); };

    // Pencil and mouse write; a finger scrolls the form (so a resting palm or a scroll never leaves a mark).
    const toForm = (e: PointerEvent): Pt => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height), p: e.pressure }; };
    let cur: Stroke | null = null, panLast: { x: number; y: number } | null = null;
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') { panLast = { x: e.clientX, y: e.clientY }; try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ } return; }
      if (strokes.length >= MAX_STROKES) return;
      e.preventDefault(); try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      cur = { color, size, erase, pts: [toForm(e)] }; strokes.push(cur); segment(cur, 0); composite();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' && panLast) { scroller.scrollLeft -= e.clientX - panLast.x; scroller.scrollTop -= e.clientY - panLast.y; panLast = { x: e.clientX, y: e.clientY }; return; }
      if (!cur) return;
      const events = (e as any).getCoalescedEvents ? (e as any).getCoalescedEvents() : [e];
      for (const ce of events.length ? events : [e]) { cur.pts.push(toForm(ce as PointerEvent)); segment(cur, cur.pts.length - 1); }
      composite();
    });
    const end = (e: PointerEvent) => { if (e.pointerType === 'touch') { panLast = null; return; } cur = null; };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', onKey);
    const close = (save: boolean) => {
      window.removeEventListener('keydown', onKey);
      if (save) {
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'msp-29-14-score-sheet.png', { type: 'image/png' });
            try { const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files; attached = true; } catch { attached = false; }
            if (attached) { thumb.src = URL.createObjectURL(blob); status.textContent = strokes.length ? 'Your filled-out form is attached. Press "Save score sheet" below to send it to this student.' : 'The blank form is attached. Write on it first, or tap Cancel.'; }
            else status.textContent = 'This browser could not attach the form. Use "Prefer to upload a file instead?" below.';
          }
          overlay.remove(); document.body.classList.remove('modal-open');
        }, 'image/png');
      } else { overlay.remove(); document.body.classList.remove('modal-open'); }
    };
    layout(); sync();
    if (baseImg.complete) redraw(); else baseImg.onload = redraw;
    window.addEventListener('resize', layout, { once: true });
  };
  thumbBtn.addEventListener('click', open);
}
