// Student Portal: the safety & liability waiver is required before the full portal opens. After a student sets their first password, and on every later sign-in until the
// waiver is signed, the Waiver window opens by itself and cannot be closed until it is signed. Invoices and payments are never blocked.
// The signed waiver is stored on the server (student_waivers). If that storage is not set up yet, the server says so and nobody is locked out.
const w: any = typeof window === 'undefined' ? {} : window;
export type WaiverState = { success?: boolean; available?: boolean; signed?: boolean } | null | undefined;
/** Locked only when the server can store waivers and this student has not signed. Anything unclear never locks anyone out. */
export const mustSign = (s: WaiverState): boolean => !!s && s.success !== false && s.available === true && s.signed === false;

export function installWaiverGate(): void {
  if (typeof document === 'undefined' || w.__fifsWaiverGate) return; w.__fifsWaiverGate = true;
  let checkedFor = ''; let busy = false; let locked = false;
  const modal = () => document.getElementById('fifsWaiverModal');
  const closeBtn = () => document.querySelector('#fifsWaiverModal [data-onclick="closeFifsWaiverModal()"]') as HTMLElement | null;
  const val = (id: string, v: unknown) => { const e = document.getElementById(id) as HTMLInputElement | null; if (e && !e.value && v) e.value = String(v); };

  const origClose = w.closeFifsWaiverModal; w.closeFifsWaiverModal = function () { if (locked) return; return origClose ? origClose.apply(this, arguments) : undefined; };
  const origDone = w.markWaiverCardComplete; w.markWaiverCardComplete = function () { locked = false; const b = closeBtn(); if (b) b.style.display = ''; const n = document.getElementById('waiverGateNote'); if (n) n.remove(); return origDone ? origDone.apply(this, arguments) : undefined; };
  document.addEventListener('keydown', (e) => { if (locked && e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); } }, true);

  function lock(rec: any) {
    locked = true; const m = modal(); if (!m) return;
    const b = closeBtn(); if (b) b.style.display = 'none';
    if (!document.getElementById('waiverGateNote')) {
      const note = document.createElement('p'); note.id = 'waiverGateNote'; note.setAttribute('role', 'status');
      note.style.cssText = 'margin:0 0 14px;padding:10px 12px;border-radius:10px;border:1px solid #ffb703;background:rgba(255,183,3,0.1);color:#ffd166;font-weight:700;';
      note.textContent = '✍️ One quick step before your portal opens: please read and sign your safety waiver.';
      const form = document.getElementById('fifsDigitalWaiverForm'); if (form && form.parentElement) form.parentElement.insertBefore(note, form);
    }
    val('waiverStudentName', rec.fullName); val('waiverStudentEmail', rec.email); val('waiverStudentPhone', rec.phone);
    w.openFifsWaiverModal?.();
  }

  async function check() {
    const rec = w.__fifsStudentPortalRecord;
    if (!rec) { checkedFor = ''; return; }
    if (locked) { const m = modal(); if (m && getComputedStyle(m).display === 'none') w.openFifsWaiverModal?.(); return; }  // closed some other way: open it again
    const id = String(rec.studentId || rec.student_id || rec.email || ''); if (!id || id === checkedFor || busy) return;
    const pw = document.getElementById('forcedPasswordResetModal'); if (pw && getComputedStyle(pw).display !== 'none') return;   // the password step comes first; the waiver is next
    busy = true;
    try {
      const s: WaiverState = await w.callFifsBackend('studentWaiverStatus', {}); checkedFor = id;
      if (mustSign(s)) lock(rec); else if (s && s.signed) w.markWaiverCardComplete?.();
    } catch { checkedFor = id; /* could not check: never lock anyone out, and do not keep asking */ } finally { busy = false; }
  }
  window.setInterval(() => { void check(); }, 1000);
}
