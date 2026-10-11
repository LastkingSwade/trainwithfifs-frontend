// Score sheet pen pad (Admin Hub > Student Roster > Edit). The "Choose file" box is replaced by the real MSP 29-14 form to write on with an Apple Pencil.
// The blank form's picture comes from the server (a 2-minute private link, admins only); nothing about the form lives in the repo or in public/.
// Ink is kept as vector strokes (undo, redo, edit again). Typed text (name, score, date, instructor ...) and your saved signature / agency stamps are
// movable items drawn on the same layer. Done turns the layer into a transparent PNG; the SERVER lays it over the real PDF and saves it through the
// existing Save button (so the 3 MB limit, the student's folder and the admin-only checks are all the server's). Plain DOM, text via textContent.
const w: any = typeof window === 'undefined' ? {} : window;
export const FORM_W = 1236, FORM_H = 1600;
export const PEN_COLORS: ReadonlyArray<readonly [string, string]> = [['#0b2a8a', 'Blue'], ['#111111', 'Black']];
export const ZOOMS: ReadonlyArray<readonly [number, string]> = [[1, 'Fit'], [1.6, '160%'], [2.4, '240%'], [3.4, '340%']];
export const MAX_STROKES = 4000, MAX_ZOOM = 4;
export const EXPORT_SCALES = [1, 0.75, 0.5] as const;
export const MAX_LAYER_BASE64 = 1_900_000;   // the server takes up to 2.5 MB of PNG; this keeps the whole request under the host's body limit

export interface Stroke { c: string; s: number; e: 0 | 1; p: number[][] }
export interface Item { id: string; kind: 'text' | 'stamp'; x: number; y: number; size: number; on: boolean; text?: string; stamp?: 'signature' | 'agency'; w?: number }
export interface Ink { v: 1; strokes: Stroke[]; items: Item[] }
interface Slot { id: string; label: string; x: number; y: number; size: number; text: (c: Ctx) => string; on: (c: Ctx) => boolean }
interface Ctx { name: string; hits: string; rounds: string; percent: string; date: string; instructor: string; number: string; renewal: boolean; place: string }

/** Where each typed item goes on the form (centres of the printed lines, in form pixels). */
export const SLOTS: ReadonlyArray<Slot> = [
  { id: 'applicant', label: 'Applicant name', x: 620, y: 238, size: 30, text: (c) => c.name, on: (c) => !!c.name },
  { id: 'initial', label: 'A. Initial certification (X)', x: 184, y: 506, size: 34, text: () => 'X', on: (c) => !c.renewal },
  { id: 'renewal', label: 'B. Renewal certification (X)', x: 184, y: 604, size: 34, text: () => 'X', on: (c) => c.renewal },
  { id: 'basic', label: 'C. Basic practical handgun course (X)', x: 257, y: 745, size: 34, text: () => 'X', on: () => true },
  { id: 'score', label: 'Score (hits)', x: 232, y: 788, size: 30, text: (c) => c.hits, on: (c) => !!c.hits },
  { id: 'possible', label: 'Possible (rounds)', x: 426, y: 788, size: 30, text: (c) => c.rounds, on: (c) => !!c.rounds },
  { id: 'percent', label: 'Percentage', x: 645, y: 788, size: 30, text: (c) => c.percent, on: (c) => !!c.percent },
  { id: 'date', label: 'Date', x: 914, y: 788, size: 28, text: (c) => c.date, on: (c) => !!c.date },
  { id: 'location', label: 'Location of range', x: 619, y: 858, size: 26, text: (c) => c.place, on: (c) => !!c.place },
  { id: 'instructor', label: 'Instructor name', x: 364, y: 1176, size: 28, text: (c) => c.instructor, on: (c) => !!c.instructor },
  { id: 'qhil', label: 'QHIC / QHIL number', x: 896, y: 1344, size: 28, text: (c) => c.number, on: (c) => !!c.number },
];
export const STAMP_SLOTS: Record<'signature' | 'agency', { x: number; y: number; w: number; label: string }> = {
  signature: { x: 150, y: 1346, w: 400, label: 'Signature' }, agency: { x: 410, y: 1420, w: 420, label: 'Agency line' },
};

/** 2026-10-01 -> 10/01/2026 (the form's own style). Anything else is returned untouched. */
export const formDate = (iso: string): string => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? `${m[2]}/${m[3]}/${m[1]}` : iso || ''; };

/** Typed items from what is already on the page. Existing saved choices are kept by id by the caller. */
export function buildItems(c: Ctx): Item[] {
  return SLOTS.map((s) => ({ id: s.id, kind: 'text' as const, x: s.x, y: s.y, size: s.size, on: s.on(c), text: s.text(c) }));
}
/** Width of one segment: a light touch is thin, a firm press is thicker (a mouse has no pressure and uses the middle). */
export function strokeWidth(size: number, pressure: number, pointerType: string): number {
  const p = pointerType === 'pen' && pressure > 0 ? Math.min(1, Math.max(0.15, pressure)) : 0.5;
  return Math.max(0.8, size * (0.5 + p));
}
/** Which pointers draw. Pen and mouse always; a finger only when the toggle is on (otherwise it scrolls and pinches). */
export const drawsWith = (pointerType: string, fingerOn: boolean): boolean => pointerType === 'pen' || pointerType === 'mouse' || (pointerType === 'touch' && fingerOn);
export const clampZoom = (z: number): number => Math.min(MAX_ZOOM, Math.max(1, z));
export function inkToJson(strokes: Stroke[], items: Item[]): string { return JSON.stringify({ v: 1, strokes, items }); }

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }
const call = (action: string, payload: Record<string, unknown> = {}): Promise<any> => { const fn = w.callFifsBackend; if (typeof fn !== 'function') return Promise.reject(new Error('The page is still loading.')); return fn(action, payload); };
const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('The form picture could not be loaded.')); i.src = src; });

export function installScoresheetPad(): void {
  if (w.__fifsScoresheetPadInstalled) return;
  const input = document.getElementById('editScoresheetFileInput') as HTMLInputElement | null;
  const modal = document.getElementById('adminEditStudentModal');
  if (!input || !modal) return;
  w.__fifsScoresheetPadInstalled = true;
  const field = input.parentElement as HTMLElement;
  const label = field.querySelector('label');

  // The old file box stays, folded away, as "Upload a file instead".
  const fold = el('details', undefined, 'ssp-fold'); fold.appendChild(el('summary', 'Upload a file instead'));
  if (label) fold.appendChild(label); fold.appendChild(input); field.appendChild(fold);

  const box = el('div', undefined, 'ssp-box'); box.id = 'scoresheetPadBox';
  box.appendChild(el('div', 'Official MSP 29-14 score sheet', 'ssp-title'));
  box.appendChild(el('p', 'Tap the form, fill it out with your Apple Pencil, tap Done, then press Save score sheet. It goes to this student only.', 'ssp-help'));
  const thumbBtn = el('button', undefined, 'ssp-thumb'); thumbBtn.type = 'button'; thumbBtn.setAttribute('aria-label', 'Open the score sheet form to fill out');
  const thumb = el('img'); thumb.alt = 'The score sheet form'; thumb.width = 300; thumb.height = 386; thumb.style.display = 'none';
  const ph = el('div', 'Loading the form…', 'ssp-ph'); ph.setAttribute('role', 'status');
  const cta = el('span', '✍️ Tap to fill out', 'ssp-cta');
  thumbBtn.append(thumb, ph, cta);
  const status = el('div', '', 'ssp-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  box.append(thumbBtn, status); field.insertBefore(box, fold);

  let strokes: Stroke[] = [], redo: Stroke[] = [], items: Item[] = [];
  let pending: { inkLayerBase64: string; inkStrokes: string } | null = null;
  let base: HTMLImageElement | null = null, saved: Ink | null = null, hasSavedFile = false;
  const stamps: Partial<Record<'signature' | 'agency', HTMLImageElement | null>> = {};
  let studentId = '';

  const setStatus = (t: string) => { status.textContent = t; };
  const ctxFromPage = (): Ctx => {
    const v = (id: string) => ((document.getElementById(id) as HTMLInputElement | null)?.value || '').trim();
    const list: any[] = w.adminCachedStudents || [];
    const stu = list.find((s) => s.studentId === studentId) || {};
    const course = String(stu.courseSelection || stu.courseName || v('ssCourseOfFire'));
    const pct = v('ssFinalPercent');
    return { name: String(stu.fullName || ''), hits: v('ssHitsOnTarget'), rounds: v('ssRoundsFired'), percent: pct, date: formDate(v('ssQualificationDate')), instructor: v('ssInstructorName'), number: v('ssInstructorNumber'), renewal: /renewal/i.test(course), place: "Cindy's Hot Shots, Glen Burnie, MD" };
  };

  // Everything about the open student: the form picture (private, short-lived link), any saved strokes and the staff member's own stamps.
  const prepare = async () => {
    studentId = ((document.getElementById('editStudentId') as HTMLInputElement | null)?.value || '').trim();
    strokes = []; redo = []; pending = null; saved = null; hasSavedFile = false; items = buildItems(ctxFromPage());
    thumb.style.display = 'none'; ph.style.display = 'flex'; ph.textContent = 'Loading the form…'; setStatus('');
    try { input.value = ''; } catch { /* ignore */ }
    const mine = studentId;
    try {
      const t = await call('scoresheetTemplate');
      base = await loadImage(String(t.previewUrl));
      if (mine !== studentId) return;
      const got = await call('getStudentScoresheet', { studentId: mine }).catch(() => null);
      const sheet = got && got.scoresheet;
      if (mine !== studentId) return;
      hasSavedFile = !!(sheet && sheet.hasFile);
      if (sheet && sheet.ink && Array.isArray(sheet.ink.strokes)) { saved = sheet.ink as Ink; strokes = saved.strokes.slice(); items = mergeItems(items, saved.items); }
      redrawThumb();
      setStatus(hasSavedFile ? (saved ? 'A filled-out sheet is saved for this student. Tap the form to edit it again.' : 'A document is already on file. Filling out the form replaces it when you save.') : '');
    } catch (e: any) { ph.textContent = (e && e.message) || 'The form could not be loaded.'; setStatus(ph.textContent || ''); }
  };
  const mergeItems = (fresh: Item[], savedItems: Item[]): Item[] => { const byId = new Map(savedItems.map((i) => [i.id, i])); const out = fresh.map((f) => byId.get(f.id) || f); for (const s of savedItems) if (!fresh.some((f) => f.id === s.id)) out.push(s); return out; };

  const drawLayer = (ctx: CanvasRenderingContext2D, s: number) => {
    ctx.save(); ctx.scale(s, s);
    for (const st of strokes) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalCompositeOperation = st.e ? 'destination-out' : 'source-over'; ctx.strokeStyle = st.c; ctx.fillStyle = st.c;
      const m = st.e ? 4 : 1;
      if (st.p.length === 1) { ctx.beginPath(); ctx.arc(st.p[0][0], st.p[0][1], strokeWidth(st.s * m, st.p[0][2], 'pen') / 2, 0, Math.PI * 2); ctx.fill(); }
      for (let i = 1; i < st.p.length; i += 1) { const a = st.p[i - 1], b = st.p[i]; ctx.beginPath(); ctx.lineWidth = strokeWidth(st.s * m, b[2], 'pen'); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); ctx.stroke(); }
    }
    ctx.globalCompositeOperation = 'source-over';
    for (const it of items) {
      if (!it.on) continue;
      if (it.kind === 'text') { ctx.fillStyle = '#0b2a8a'; ctx.font = `${it.size}px "Helvetica Neue", Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(it.text || '', it.x, it.y); }
      else if (it.stamp && stamps[it.stamp]) { const im = stamps[it.stamp]!; const wd = it.w || 300; ctx.drawImage(im, it.x, it.y - (wd * im.naturalHeight) / im.naturalWidth, wd, (wd * im.naturalHeight) / im.naturalWidth); }
    }
    ctx.restore();
  };
  const layerCanvas = (s: number) => { const c = document.createElement('canvas'); c.width = Math.round(FORM_W * s); c.height = Math.round(FORM_H * s); drawLayer(c.getContext('2d')!, s); return c; };
  const redrawThumb = () => {
    if (!base) return;
    const c = document.createElement('canvas'); c.width = 600; c.height = Math.round(600 * (FORM_H / FORM_W)); const x = c.getContext('2d')!;
    x.drawImage(base, 0, 0, c.width, c.height); x.drawImage(layerCanvas(600 / FORM_W), 0, 0);
    thumb.src = c.toDataURL('image/png'); thumb.style.display = 'block'; ph.style.display = 'none';
  };

  const open = async () => {
    if (!base) { await prepare(); if (!base) return; }
    const overlay = el('div', undefined, 'ssp-overlay'); overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', 'Fill out the score sheet');
    const bar = el('div', undefined, 'ssp-bar'); let tool: 'pen' | 'erase' | 'move' = 'pen', color = PEN_COLORS[0][0], size = 3, zoom = 1, finger = false;
    const btn = (text: string, onClick: () => void, cls = '', aria = '') => { const b = el('button', text, 'ssp-btn ' + cls); b.type = 'button'; if (aria) b.setAttribute('aria-label', aria); b.addEventListener('click', onClick); return b; };
    const colorBtns = PEN_COLORS.map(([c, n]) => { const b = btn('', () => { color = c; tool = 'pen'; sync(); }, '', n + ' pen'); b.style.background = c; b.dataset.color = c; b.title = n + ' pen'; return b; });
    const bPen = btn('Pen', () => { tool = 'pen'; sync(); }), bEr = btn('Eraser', () => { tool = 'erase'; sync(); }), bMove = btn('Move text', () => { tool = 'move'; sync(); });
    const bFine = btn('Fine', () => { size = 2; sync(); }), bBold = btn('Bold', () => { size = 5; sync(); });
    const bFinger = btn('Finger draws: off', () => { finger = !finger; sync(); });
    const zoomBtns = ZOOMS.map(([z, n]) => btn(n, () => { setZoom(z); }));
    const bUndo = btn('↶ Undo', () => { const s = strokes.pop(); if (s) { redo.push(s); paint(); } }), bRedo = btn('↷ Redo', () => { const s = redo.pop(); if (s) { strokes.push(s); paint(); } });
    const bClear = btn('Clear page', () => { if (!strokes.length && !window.confirm('Nothing is written yet.')) return; if (strokes.length && !window.confirm('Clear everything you wrote with the pen? Typed text and stamps stay.')) return; strokes = []; redo = []; paint(); });
    const bTyped = btn('Typed text…', () => { panel.hidden = !panel.hidden; });
    const bSig = btn('✍ Stamp signature', () => { void stamp('signature'); }), bAg = btn('🏢 Stamp agency', () => { void stamp('agency'); });
    const bSave = btn('Save my stamps…', () => { void openStampMaker(); });
    const bCancel = btn('Cancel', () => close(false)), bDone = btn('✓ Done', () => close(true), 'ssp-done');
    bar.append(...colorBtns, bPen, bEr, bMove, bFine, bBold, bFinger, ...zoomBtns, bUndo, bRedo, bClear, bTyped, bSig, bAg, bSave, bCancel, bDone);
    const panel = el('div', undefined, 'ssp-panel'); panel.hidden = true;
    const scroller = el('div', undefined, 'ssp-scroll'); const canvas = el('canvas', undefined, 'ssp-canvas'); scroller.appendChild(canvas);
    const note = el('div', '', 'ssp-note'); note.setAttribute('role', 'status'); note.setAttribute('aria-live', 'polite');
    overlay.append(bar, panel, scroller, note); document.body.appendChild(overlay); document.body.classList.add('modal-open');
    canvas.width = FORM_W; canvas.height = FORM_H; const ctx = canvas.getContext('2d')!;

    const buildPanel = () => {
      panel.textContent = ''; panel.appendChild(el('p', 'Typed text is placed on the form for you. Edit it or turn it off. Use "Move text" to drag a line into place.', 'ssp-help'));
      const refresh = btn('Refresh from the form fields', () => { const fresh = buildItems(ctxFromPage()); items = items.map((i) => (i.kind === 'text' ? (fresh.find((f) => f.id === i.id) ? { ...i, text: fresh.find((f) => f.id === i.id)!.text, on: fresh.find((f) => f.id === i.id)!.on } : i) : i)); buildPanel(); paint(); });
      panel.appendChild(refresh);
      for (const it of items.filter((i) => i.kind === 'text')) {
        const slot = SLOTS.find((s) => s.id === it.id); const row = el('div', undefined, 'ssp-row');
        const cb = el('input'); cb.type = 'checkbox'; cb.checked = it.on; cb.id = 'ssp-on-' + it.id; cb.addEventListener('change', () => { it.on = cb.checked; paint(); });
        const lb = el('label', slot ? slot.label : it.id); lb.htmlFor = cb.id;
        const tx = el('input'); tx.type = 'text'; tx.value = it.text || ''; tx.maxLength = 80; tx.setAttribute('aria-label', (slot ? slot.label : it.id) + ' text'); tx.addEventListener('input', () => { it.text = tx.value; paint(); });
        row.append(cb, lb, tx); panel.appendChild(row);
      }
      for (const k of ['signature', 'agency'] as const) { const it = items.find((i) => i.kind === 'stamp' && i.stamp === k); if (!it) continue; const row = el('div', undefined, 'ssp-row'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = it.on; cb.id = 'ssp-on-' + it.id; cb.addEventListener('change', () => { it.on = cb.checked; paint(); }); const lb = el('label', STAMP_SLOTS[k].label + ' stamp'); lb.htmlFor = cb.id; row.append(cb, lb); panel.appendChild(row); }
    };
    const paint = () => { ctx.clearRect(0, 0, FORM_W, FORM_H); if (base) ctx.drawImage(base, 0, 0, FORM_W, FORM_H); ctx.drawImage(layerCanvas(1), 0, 0); };
    const layout = () => { const avail = Math.min(scroller.clientWidth - 24 || 800, 1100); canvas.style.width = Math.round(avail * zoom) + 'px'; canvas.style.height = Math.round(avail * zoom * (FORM_H / FORM_W)) + 'px'; };
    const setZoom = (z: number) => { zoom = clampZoom(z); layout(); sync(); };
    const sync = () => {
      colorBtns.forEach((b) => b.classList.toggle('on', tool === 'pen' && b.dataset.color === color));
      bPen.classList.toggle('on', tool === 'pen'); bEr.classList.toggle('on', tool === 'erase'); bMove.classList.toggle('on', tool === 'move');
      bFine.classList.toggle('on', size === 2); bBold.classList.toggle('on', size === 5); bFinger.textContent = 'Finger draws: ' + (finger ? 'on' : 'off'); bFinger.classList.toggle('on', finger);
      zoomBtns.forEach((b, i) => b.classList.toggle('on', Math.abs(ZOOMS[i][0] - zoom) < 0.05)); bUndo.disabled = !strokes.length; bRedo.disabled = !redo.length;
    };
    const stamp = async (kind: 'signature' | 'agency') => {
      try {
        if (stamps[kind] === undefined) { const r = await call('scoresheetStamp', { op: 'get', kind }); stamps[kind] = r && r.stamp ? await loadImage(String(r.stamp)) : null; }
        if (!stamps[kind]) { note.textContent = 'No saved ' + STAMP_SLOTS[kind].label.toLowerCase() + ' yet. Tap "Save my stamps…" to draw it once.'; return; }
        const slot = STAMP_SLOTS[kind]; const existing = items.find((i) => i.kind === 'stamp' && i.stamp === kind);
        if (existing) { existing.on = true; existing.x = slot.x; existing.y = slot.y; existing.w = slot.w; } else items.push({ id: 'stamp-' + kind, kind: 'stamp', stamp: kind, x: slot.x, y: slot.y, size: 60, on: true, w: slot.w });
        buildPanel(); paint(); note.textContent = STAMP_SLOTS[kind].label + ' stamped. Use "Move text" to nudge it.';
      } catch (e: any) { note.textContent = (e && e.message) || 'The stamp could not be loaded.'; }
    };
    // Stamps already used in a saved sheet need their picture back before they can be drawn again.
    for (const it of items) if (it.kind === 'stamp' && it.stamp && stamps[it.stamp] === undefined) { const k = it.stamp; void call('scoresheetStamp', { op: 'get', kind: k }).then((r) => (r && r.stamp ? loadImage(String(r.stamp)) : null)).then((im) => { stamps[k] = im; paint(); }).catch(() => { stamps[k] = null; });  }

    // Pen and mouse write. A finger scrolls the form (and two fingers pinch to zoom) unless "Finger draws" is on.
    const toForm = (e: PointerEvent): number[] => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * (FORM_W / r.width), (e.clientY - r.top) * (FORM_H / r.height), e.pressure]; };
    let cur: Stroke | null = null, dragItem: Item | null = null, dragOff = [0, 0];
    const touches = new Map<number, { x: number; y: number }>(); let pinch0 = 0, zoom0 = 1;
    const hit = (x: number, y: number): Item | null => { for (let i = items.length - 1; i >= 0; i -= 1) { const it = items[i]; if (!it.on) continue; if (it.kind === 'text') { const wd = Math.max(40, (it.text || '').length * it.size * 0.55); if (Math.abs(x - it.x) < wd / 2 + 10 && y > it.y - it.size - 8 && y < it.y + 14) return it; } else { const im = it.stamp ? stamps[it.stamp] : null; const wd = it.w || 300, ht = im ? (wd * im.naturalHeight) / im.naturalWidth : 80; if (x > it.x - 10 && x < it.x + wd + 10 && y > it.y - ht - 10 && y < it.y + 10) return it; } } return null; };
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' && !(finger && touches.size === 0 && tool !== 'move')) {
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
        if (touches.size === 2) { const [a, b] = Array.from(touches.values()); pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = zoom; }
        return;
      }
      if (!drawsWith(e.pointerType, finger) && tool !== 'move') return;
      e.preventDefault(); try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      const pt = toForm(e);
      if (tool === 'move') { dragItem = hit(pt[0], pt[1]); if (dragItem) dragOff = [pt[0] - dragItem.x, pt[1] - dragItem.y]; return; }
      if (strokes.length >= MAX_STROKES) { note.textContent = 'That is the most strokes one page can hold. Clear some marks first.'; return; }
      cur = { c: color, s: size, e: tool === 'erase' ? 1 : 0, p: [pt] }; strokes.push(cur); redo = []; paint(); sync();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' && touches.has(e.pointerId)) {
        const prev = touches.get(e.pointerId)!; touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touches.size >= 2) { const [a, b] = Array.from(touches.values()); if (pinch0 > 0) setZoom(zoom0 * (Math.hypot(a.x - b.x, a.y - b.y) / pinch0)); }
        else { scroller.scrollLeft -= e.clientX - prev.x; scroller.scrollTop -= e.clientY - prev.y; }
        return;
      }
      if (dragItem) { const pt = toForm(e); dragItem.x = Math.round(pt[0] - dragOff[0]); dragItem.y = Math.round(pt[1] - dragOff[1]); paint(); return; }
      if (!cur) return;
      const events: PointerEvent[] = (e as any).getCoalescedEvents ? (e as any).getCoalescedEvents() : [e];
      for (const ce of events.length ? events : [e]) cur.p.push(toForm(ce));
      paint();
    });
    const end = (e: PointerEvent) => { if (e.pointerType === 'touch') { touches.delete(e.pointerId); if (touches.size < 2) pinch0 = 0; } cur = null; dragItem = null; };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', onKey);
    const onResize = () => layout(); window.addEventListener('resize', onResize);
    const finishUi = () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); overlay.remove(); document.body.classList.remove('modal-open'); };
    const close = (keep: boolean) => {
      if (!keep) { finishUi(); return; }
      // The pen layer becomes a transparent PNG. If it is large, only the ink layer is made smaller (the form underneath stays full quality).
      let out = ''; for (const s of EXPORT_SCALES) { out = layerCanvas(s).toDataURL('image/png'); if (out.length <= MAX_LAYER_BASE64) break; }
      if (out.length > MAX_LAYER_BASE64) { note.textContent = 'This page has too much ink to send. Clear some marks and try again.'; return; }
      pending = { inkLayerBase64: out, inkStrokes: inkToJson(strokes, items) };
      try { input.value = ''; } catch { /* ignore */ }
      redrawThumb(); setStatus('Your filled-out form is ready. Press "Save score sheet" below to send it to this student.');
      finishUi();
    };
    buildPanel(); layout(); sync(); paint();
  };

  // A small pad to draw your signature or agency line once; it is saved privately for you and can be stamped with one tap.
  const openStampMaker = async () => {
    const ov = el('div', undefined, 'ssp-overlay ssp-stamp'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Draw a stamp to save');
    const bar2 = el('div', undefined, 'ssp-bar'); let kind: 'signature' | 'agency' = 'signature'; const sp: number[][][] = [];
    const b = (t: string, f: () => void, c = '') => { const x = el('button', t, 'ssp-btn ' + c); x.type = 'button'; x.addEventListener('click', f); return x; };
    const msg = el('div', 'Draw it with your Pencil, then tap Save.', 'ssp-note'); msg.setAttribute('role', 'status');
    const kSig = b('Signature', () => { kind = 'signature'; kSig.classList.add('on'); kAg.classList.remove('on'); }, 'on'), kAg = b('Agency line', () => { kind = 'agency'; kAg.classList.add('on'); kSig.classList.remove('on'); });
    const pad = el('canvas', undefined, 'ssp-canvas ssp-stampcanvas'); pad.width = 1200; pad.height = 360; pad.style.width = 'min(100%, 900px)'; const c2 = pad.getContext('2d')!;
    const redraw2 = () => { c2.clearRect(0, 0, 1200, 360); c2.lineCap = 'round'; c2.lineJoin = 'round'; c2.strokeStyle = '#0b2a8a'; for (const s of sp) { if (s.length === 1) { c2.beginPath(); c2.arc(s[0][0], s[0][1], 2, 0, 7); c2.fill(); } for (let i = 1; i < s.length; i += 1) { c2.beginPath(); c2.lineWidth = strokeWidth(4, s[i][2], 'pen'); c2.moveTo(s[i - 1][0], s[i - 1][1]); c2.lineTo(s[i][0], s[i][1]); c2.stroke(); } } };
    let cur2: number[][] | null = null;
    pad.addEventListener('pointerdown', (e) => { if (!drawsWith(e.pointerType, true)) return; e.preventDefault(); try { pad.setPointerCapture(e.pointerId); } catch { /* ignore */ } const r = pad.getBoundingClientRect(); cur2 = [[(e.clientX - r.left) * (1200 / r.width), (e.clientY - r.top) * (360 / r.height), e.pressure]]; sp.push(cur2); redraw2(); });
    pad.addEventListener('pointermove', (e) => { if (!cur2) return; const r = pad.getBoundingClientRect(); cur2.push([(e.clientX - r.left) * (1200 / r.width), (e.clientY - r.top) * (360 / r.height), e.pressure]); redraw2(); });
    const up2 = () => { cur2 = null; }; pad.addEventListener('pointerup', up2); pad.addEventListener('pointercancel', up2);
    const trimmed = (): string | null => { const d = c2.getImageData(0, 0, 1200, 360).data; let x0 = 1200, y0 = 360, x1 = 0, y1 = 0; for (let y = 0; y < 360; y += 1) for (let x = 0; x < 1200; x += 1) if (d[(y * 1200 + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } if (x1 <= x0 || y1 <= y0) return null; const o = document.createElement('canvas'); o.width = x1 - x0 + 12; o.height = y1 - y0 + 12; o.getContext('2d')!.drawImage(pad, x0 - 6, y0 - 6, o.width, o.height, 0, 0, o.width, o.height); return o.toDataURL('image/png'); };
    const closeStamp = () => ov.remove();
    bar2.append(kSig, kAg, b('Clear', () => { sp.length = 0; redraw2(); }), b('Remove saved ' + 'one', async () => { try { await call('scoresheetStamp', { op: 'delete', kind }); stamps[kind] = undefined as any; delete stamps[kind]; msg.textContent = 'Removed.'; } catch (e: any) { msg.textContent = (e && e.message) || 'Could not remove it.'; } }), b('Cancel', closeStamp),
      b('Save', async () => { const png = trimmed(); if (!png) { msg.textContent = 'Draw something first.'; return; } try { await call('scoresheetStamp', { op: 'set', kind, pngBase64: png }); delete stamps[kind]; msg.textContent = 'Saved. Use the Stamp buttons on the form.'; } catch (e: any) { msg.textContent = (e && e.message) || 'Could not save it.'; } }, 'ssp-done'));
    const holder = el('div', undefined, 'ssp-scroll'); holder.appendChild(pad); ov.append(bar2, holder, msg); document.body.appendChild(ov);
  };

  thumbBtn.addEventListener('click', () => { void open(); });
  // A file chosen in the fold-away replaces any pen page that was waiting.
  input.addEventListener('change', () => { if (input.files && input.files[0]) { pending = null; setStatus('The uploaded file will be saved instead of the form.'); } });
  // The Save button asks for the pen page; after a successful save the pad starts fresh for this student.
  w.fifsScoresheetInkPayload = () => pending;
  w.fifsScoresheetAfterSave = () => { pending = null; base = null; void prepare(); };
  // A different student (or reopening the window) starts clean.
  let wasOpen = false;
  new MutationObserver(() => { const now = getComputedStyle(modal).display !== 'none'; if (now && !wasOpen) { base = null; void prepare(); } wasOpen = now; }).observe(modal, { attributes: true, attributeFilter: ['class', 'style'] });
}
