'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './hud.css';
import { BEATS, HUD, PHOTO, SEEN_KEY } from './config';
import { measureHeroFit, type HeroFit } from './heroFit';
import { runDecode } from './decode';
import { runAcquire } from './acquire';
import { startAmbient, type Ambient } from './ambient';

// Geometry of the ring baked into the hero photo (photo coordinates), and the box around the real pistol on the desk.
// Centre measured from the baked-in crosshair diamonds (they sit at about 143 from it); the outer ring is about 206 out.
const RING = { cx: 446, cy: 226, r: 206 };
const PISTOL = { x: 520, y: 765, w: 360, h: 300, strips: 7 };

const TICKS = Array.from({ length: 72 }, (_, i) => {
  const a = (i * 5 * Math.PI) / 180;
  const long = i % 9 === 0;
  const r1 = RING.r + 10;
  const r2 = RING.r + (long ? 26 : 17);
  return {
    x1: (RING.cx + r1 * Math.sin(a)).toFixed(1), y1: (RING.cy - r1 * Math.cos(a)).toFixed(1),
    x2: (RING.cx + r2 * Math.sin(a)).toFixed(1), y2: (RING.cy - r2 * Math.cos(a)).toFixed(1), long,
  };
});

type Mode = 'static' | 'intro' | 'quick' | 'done';

// A box in photo coordinates, expressed as percentages of the photo so it scales with it.
const boxStyle = (x: number, y: number, w: number, h: number): React.CSSProperties => ({
  left: `${(x / PHOTO.width) * 100}%`, top: `${(y / PHOTO.height) * 100}%`, width: `${(w / PHOTO.width) * 100}%`, height: `${(h / PHOTO.height) * 100}%`,
});

export default function HudIntro() {
  const [hero, setHero] = useState<HTMLElement | null>(null);
  const [bootDone, setBootDone] = useState(false);
  const [fit, setFit] = useState<HeroFit | null>(null);
  const [card, setCard] = useState<{ el: HTMLElement; w: number; h: number } | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const bracketRef = useRef<HTMLDivElement>(null);

  // Phase 1: find the hero, measure where the photo really sits, and tell the stylesheet which effects are enabled.
  useEffect(() => {
    if (!HUD.enabled) return;
    const heroEl = document.getElementById('hero-landing');
    const img = heroEl?.querySelector<HTMLImageElement>('img.hero-bg-artwork');
    if (!heroEl || !img) return;
    const root = document.documentElement;
    root.setAttribute('data-hud', (Object.keys(HUD) as Array<keyof typeof HUD>).filter((k) => k !== 'enabled' && k !== 'intro' && HUD[k]).join(' '));

    const refit = () => setFit(measureHeroFit(img));
    refit();
    img.addEventListener('load', refit);
    const imgObserver = new ResizeObserver(refit);
    imgObserver.observe(img);

    const cardEl = heroEl.querySelector<HTMLElement>('.hud-gold-card');
    let cardObserver: ResizeObserver | undefined;
    if (cardEl) {
      const measure = () => setCard({ el: cardEl, w: cardEl.offsetWidth, h: cardEl.offsetHeight });
      measure();
      cardObserver = new ResizeObserver(measure);
      cardObserver.observe(cardEl);
    }
    setHero(heroEl);
    return () => {
      img.removeEventListener('load', refit);
      imgObserver.disconnect();
      cardObserver?.disconnect();
      root.removeAttribute('data-hud');
    };
  }, []);

  // Phase 2: once the layer is on the page, choose full intro / short fade / static, and run it.
  useEffect(() => {
    if (!hero) return;
    const root = document.documentElement;
    // First-visit boot screen still showing: hold everything until it hands over (the HUD must not run behind it).
    if (!bootDone && root.hasAttribute('data-boot')) {
      const release = () => setBootDone(true);
      window.addEventListener('fifs:boot-complete', release, { once: true });
      return () => window.removeEventListener('fifs:boot-complete', release);
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const heroShown = hero.offsetParent !== null && !hero.classList.contains('hidden-view');
    let seen = false;
    try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; } catch { /* storage unavailable: treat as first visit */ }

    const mode: Mode = reduced.matches ? 'static' : !heroShown ? 'done' : !HUD.intro || seen ? 'quick' : 'intro';
    const timers: number[] = [];
    const finishers: Array<() => void> = [];
    let ambient: Ambient | null = null;
    let completed = false;

    const beginAmbient = () => {
      if (ambient || reduced.matches) return;
      ambient = startAmbient(hero, scanRef.current, { sweep: HUD.sweep, parallax: HUD.parallax });
    };
    const markSeen = () => { try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ } };
    const complete = () => {
      if (completed) return;
      completed = true;
      timers.forEach((t) => window.clearTimeout(t));
      finishers.forEach((f) => f());
      window.removeEventListener('pointerdown', complete);
      window.removeEventListener('keydown', complete);
      root.setAttribute('data-hud-state', 'done');
      markSeen();
      beginAmbient();
    };

    root.setAttribute('data-hud-state', mode);
    if (mode === 'static') {
      completed = true;
    } else if (mode === 'done') {
      complete();
    } else if (mode === 'quick') {
      markSeen();
      timers.push(window.setTimeout(complete, 700));
    } else {
      markSeen();
      const easing = getComputedStyle(root).getPropertyValue('--hud-ease-settle').trim() || 'ease-out';
      if (HUD.decode) {
        timers.push(window.setTimeout(() => {
          const target = hero.querySelector<HTMLElement>('.hud-decode-target');
          if (target && !completed) finishers.push(runDecode(target, easing, () => {}).finish);
        }, BEATS.decodeStart));
      }
      if (HUD.acquire && bracketRef.current) finishers.push(runAcquire(bracketRef.current));
      timers.push(window.setTimeout(complete, BEATS.introEnd));
      // Any click or keypress completes the intro immediately. The event itself is never stopped or cancelled.
      window.addEventListener('pointerdown', complete, { passive: true });
      window.addEventListener('keydown', complete);
    }
    if (mode === 'static') root.setAttribute('data-hud-state', 'static');

    const onReducedChange = () => {
      if (reduced.matches) { ambient?.stop(); ambient = null; complete(); root.setAttribute('data-hud-state', 'static'); }
    };
    reduced.addEventListener('change', onReducedChange);
    if (mode === 'done') beginAmbient();

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      finishers.forEach((f) => f());
      window.removeEventListener('pointerdown', complete);
      window.removeEventListener('keydown', complete);
      reduced.removeEventListener('change', onReducedChange);
      ambient?.stop();
      root.removeAttribute('data-hud-state');
    };
  }, [hero, bootDone]);

  // The pistol strips and their colour-fringe ghosts are canvases fed from the photo that is already on the page. Canvases are never
  // largest-contentful-paint candidates, so painting them cannot move the page's LCP (SVG <image> copies of the photo did).
  const pistolReady = Boolean(HUD.pistolScan && fit && fit.loaded);
  const fitKey = fit ? `${Math.round(fit.width)}x${Math.round(fit.height)}` : '';
  useEffect(() => {
    if (!pistolReady || !fit || !layerRef.current) return;
    const img = hero?.querySelector<HTMLImageElement>('img.hero-bg-artwork');
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const k = img.naturalWidth / PHOTO.width;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = (fit.width / PHOTO.width) * dpr;
    layerRef.current.querySelectorAll<HTMLCanvasElement>('canvas[data-box]').forEach((canvas) => {
      const [x, y, w, h] = (canvas.dataset.box || '').split(',').map(Number);
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, x * k, y * k, w * k, h * k, 0, 0, canvas.width, canvas.height);
      const channel = canvas.dataset.channel;
      if (channel) { // keep only the red, or only the green and blue, of the same pixels
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = channel === 'red' ? '#ff0000' : '#00ffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pistolReady, fitKey, hero]);

  if (!HUD.enabled || !hero) return null;

  const strips = Array.from({ length: PISTOL.strips }, (_, i) => ({ i, y: PISTOL.y + (i * PISTOL.h) / PISTOL.strips, h: PISTOL.h / PISTOL.strips }));

  return (
    <>
      <div className="hud-layer" aria-hidden="true" ref={layerRef}>
        <div className="hud-cover" />
        {fit && (
          <svg
            className="hud-svg"
            viewBox={`0 0 ${PHOTO.width} ${PHOTO.height}`}
            style={{ left: fit.left, top: fit.top, width: fit.width, height: fit.height }}
            preserveAspectRatio="none"
          >
            <defs>
              <radialGradient id="hudBloom" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.34" />
                <stop offset="55%" stopColor="#00e5ff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
              </radialGradient>
            </defs>

            <circle className="hud-bloom" cx={RING.cx} cy={RING.cy} r={RING.r * 1.9} fill="url(#hudBloom)" />

            <g className="hud-ring">
              <circle className="hud-ring-line" cx={RING.cx} cy={RING.cy} r={RING.r} pathLength={1} />
              <g className="hud-ticks">
                {TICKS.map((t, i) => (
                  <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} className={t.long ? 'hud-tick hud-tick-long' : 'hud-tick'} />
                ))}
              </g>
              <g className="hud-cross">
                <line className="hud-arm hud-arm-n" x1={RING.cx} y1={RING.cy - 232} x2={RING.cx} y2={RING.cy - 168} />
                <line className="hud-arm hud-arm-e" x1={RING.cx + 232} y1={RING.cy} x2={RING.cx + 168} y2={RING.cy} />
                <line className="hud-arm hud-arm-s" x1={RING.cx} y1={RING.cy + 232} x2={RING.cx} y2={RING.cy + 168} />
                <line className="hud-arm hud-arm-w" x1={RING.cx - 232} y1={RING.cy} x2={RING.cx - 168} y2={RING.cy} />
              </g>
              <circle className="hud-dot" cx={RING.cx} cy={RING.cy} r={4} />
            </g>

          </svg>
        )}
        {pistolReady && fit && (
          <div className="hud-pistol" style={{ left: fit.left, top: fit.top, width: fit.width, height: fit.height }}>
            <div className="hud-pistol-box" style={boxStyle(PISTOL.x, PISTOL.y, PISTOL.w, PISTOL.h)}>
              {strips.map((st) => (
                <canvas
                  key={st.i}
                  className={`hud-strip hud-strip-${st.i}`}
                  data-box={`${PISTOL.x},${st.y},${PISTOL.w},${st.h}`}
                  style={{ left: 0, top: `${((st.y - PISTOL.y) / PISTOL.h) * 100}%`, width: '100%', height: `${(st.h / PISTOL.h) * 100}%` }}
                />
              ))}
              <canvas className="hud-ghost hud-ghost-red" data-box={`${PISTOL.x},${PISTOL.y},${PISTOL.w},${PISTOL.h}`} data-channel="red" style={{ left: 0, top: 0, width: '100%', height: '100%' }} />
              <canvas className="hud-ghost hud-ghost-cyan" data-box={`${PISTOL.x},${PISTOL.y},${PISTOL.w},${PISTOL.h}`} data-channel="cyan" style={{ left: 0, top: 0, width: '100%', height: '100%' }} />
            </div>
          </div>
        )}
        <div className="hud-flicker" />
        <div className="hud-scan" ref={scanRef} />
      </div>
      {createPortal(<div className="hud-bracket" ref={bracketRef} aria-hidden="true" />, hero)}
      {card && createPortal(
        <svg className="hud-trace" aria-hidden="true" width={card.w} height={card.h} viewBox={`0 0 ${card.w} ${card.h}`}>
          <rect x="1" y="1" width={Math.max(card.w - 2, 0)} height={Math.max(card.h - 2, 0)} rx="11" pathLength={1} />
        </svg>,
        card.el,
      )}
    </>
  );
}
