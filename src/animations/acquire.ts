import { BEATS } from './config';

// A single bracket jumps from control to control in a hand-set order, as if the HUD were acquiring each one. The controls
// themselves are never hidden, moved or blocked: they stay visible and clickable for the whole sequence.
export function runAcquire(bracket: HTMLElement): () => void {
  const timers: number[] = [];
  const lit = new Set<HTMLElement>();

  BEATS.acquireOrder.forEach(([id, at], index) => {
    let target: HTMLElement | null = null;
    const last = index === BEATS.acquireOrder.length - 1;
    timers.push(window.setTimeout(() => {
      const el = document.getElementById(id);
      const rect = el?.getBoundingClientRect();
      if (!el || !rect || rect.width === 0) return;
      const pad = 5;
      bracket.style.width = `${rect.width + pad * 2}px`;
      bracket.style.height = `${rect.height + pad * 2}px`;
      bracket.style.transform = `translate(${rect.left - pad}px, ${rect.top - pad}px)`;
      bracket.classList.remove('is-locking');
      void bracket.offsetWidth; // restart the lock-in
      bracket.classList.add('is-on', 'is-locking');
      el.classList.add('hud-lit');
      lit.add(el);
      target = el;
    }, at));
    timers.push(window.setTimeout(() => {
      if (target) { target.classList.remove('hud-lit'); lit.delete(target); }
      if (last) bracket.classList.remove('is-on');
    }, at + BEATS.acquireHold));
  });

  return () => {
    timers.forEach((t) => window.clearTimeout(t));
    lit.forEach((el) => el.classList.remove('hud-lit'));
    lit.clear();
    bracket.classList.remove('is-on', 'is-locking');
  };
}
