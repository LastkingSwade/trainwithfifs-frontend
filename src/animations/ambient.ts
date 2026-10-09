import { SWEEP_GAPS_S } from './config';

export interface Ambient {
  stop(): void;
}

// The only things that keep moving after the intro: one scan sweep every 8-12 seconds, and (on pointer devices) a few pixels of
// parallax on the photo. Everything pauses while the tab is hidden or the hero is scrolled out of view.
export function startAmbient(hero: HTMLElement, scan: HTMLElement | null, opts: { sweep: boolean; parallax: boolean }): Ambient {
  const root = document.documentElement;
  const layer = hero.querySelector<HTMLElement>('.hero-bg-layer');
  let heroVisible = true;
  let sweepTimer = 0;
  let gapIndex = 0;
  let raf = 0;

  const running = () => !document.hidden && heroVisible;
  const syncPause = () => {
    if (running()) root.removeAttribute('data-hud-paused');
    else root.setAttribute('data-hud-paused', '');
  };

  const scheduleSweep = () => {
    window.clearTimeout(sweepTimer);
    if (!opts.sweep || !scan) return;
    const gap = SWEEP_GAPS_S[gapIndex++ % SWEEP_GAPS_S.length] * 1000;
    sweepTimer = window.setTimeout(() => {
      if (running()) {
        scan.classList.remove('is-sweeping');
        void scan.offsetWidth; // restart the animation
        scan.classList.add('is-sweeping');
      }
      scheduleSweep();
    }, gap);
  };

  const onVisibility = () => { syncPause(); };
  document.addEventListener('visibilitychange', onVisibility);
  const io = new IntersectionObserver((entries) => {
    heroVisible = entries[entries.length - 1].isIntersecting;
    syncPause();
  });
  io.observe(hero);
  scheduleSweep();

  // Parallax: pointer devices only; a few pixels, applied through CSS variables so the photo and its overlays move together.
  let pointerHandler: ((e: PointerEvent) => void) | null = null;
  if (opts.parallax && layer && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    pointerHandler = (e: PointerEvent) => {
      if (!running()) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
        layer.style.setProperty('--hud-px', `${(-nx * 3).toFixed(2)}px`);
        layer.style.setProperty('--hud-py', `${(-ny * 2).toFixed(2)}px`);
      });
    };
    hero.addEventListener('pointermove', pointerHandler, { passive: true });
  }

  return {
    stop() {
      window.clearTimeout(sweepTimer);
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (pointerHandler) hero.removeEventListener('pointermove', pointerHandler);
      root.removeAttribute('data-hud-paused');
      layer?.style.removeProperty('--hud-px');
      layer?.style.removeProperty('--hud-py');
    },
  };
}
