'use client';

import { useEffect, useRef } from 'react';
import { HACK, HACK_CHARS, HACK_CLEARED, HACK_DONE_EVENT, HACK_MESSAGE, HACK_NOTE, HACK_SR_END, HACK_SR_START } from './hackConfig';
import './hack.css';

// Things the effect never touches: anything a person can click, type in or navigate with, and moving content.
const INTERACTIVE = 'a, button, input, textarea, select, label, nav, form, summary, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [contenteditable], [data-onclick], [onclick], .reviews-marquee-box, .hud-layer, .boot-intro, script, style, noscript, svg';
const MODALS = '.fi-portal-modal-overlay, .goal-modal-overlay, [role="dialog"], [aria-modal="true"], .group-panel';
const FIELDS = 'input, textarea, select, [contenteditable]';

const homeVisible = () => {
  const hero = document.getElementById('hero-landing');
  return !!hero && hero.offsetParent !== null && !hero.classList.contains('hidden-view');
};
// An overlay counts as open only if it is really showing: not display:none, not hidden, and not faded to nothing (the terminal
// gateway overlay sits in the page at opacity 0 until it is opened).
const isShown = (el: HTMLElement) => {
  for (let n: HTMLElement | null = el; n && n !== document.body; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
  }
  return el.getClientRects().length > 0;
};
const modalOpen = () => Array.from(document.querySelectorAll<HTMLElement>(MODALS)).some(isShown);
const fieldFocused = () => { const a = document.activeElement; return !!a && a !== document.body && a.matches(FIELDS); };
const blocked = () => !homeVisible() || modalOpen() || fieldFocused() || document.documentElement.hasAttribute('data-boot') || document.visibilityState !== 'visible'
  || document.documentElement.getAttribute('data-hud-state') === 'intro';
const rnd = (n: number) => { let s = ''; for (let i = 0; i < n; i++) s += HACK_CHARS[Math.floor(Math.random() * HACK_CHARS.length)]; return s; };

interface Word { el: HTMLSpanElement; len: number }

// Draws scrambled copies of the visible, non-interactive homepage words on a decorative layer and hides the originals by colour only
// (their text and layout stay exactly as they are, so screen readers, crawlers and the page itself never change).
function buildWords(layer: HTMLElement, hidden: Set<HTMLElement>): Word[] {
  const words: Word[] = [];
  const vw = window.innerWidth, vh = window.innerHeight;
  const hero = document.getElementById('hero-landing');
  if (!hero) return words;
  const walker = document.createTreeWalker(hero, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let node: Node | null;
  while ((node = walker.nextNode()) && words.length < HACK.maxWords) {
    const text = node.textContent || '';
    const parent = node.parentElement;
    if (!parent || !text.trim() || parent.closest(INTERACTIVE) || parent.querySelector(INTERACTIVE)) continue;
    const cs = getComputedStyle(parent);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily}`;
    let made = 0;
    for (const m of Array.from(text.matchAll(/\S+/g))) {
      if (words.length >= HACK.maxWords) break;
      range.setStart(node, m.index ?? 0);
      range.setEnd(node, (m.index ?? 0) + m[0].length);
      const r = range.getClientRects()[0];
      if (!r || r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      const el = document.createElement('span');
      el.className = 'hack-word';
      el.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;font:${font};line-height:${r.height}px;letter-spacing:${cs.letterSpacing};text-transform:${cs.textTransform};color:${cs.color};text-shadow:${cs.textShadow}`;
      el.textContent = rnd(m[0].length);
      layer.appendChild(el);
      words.push({ el, len: m[0].length });
      made += 1;
    }
    if (made) { parent.classList.add('hack-hide'); hidden.add(parent); }
  }
  return words;
}

export default function HackDetected() {
  const srRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!HACK.ENABLED || window.location.pathname !== '/') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;

    let running = false;
    let visibleMs = 0;
    let nextAtMs = HACK.firstDelayMs;
    let started = false;
    let end: (() => void) | null = null;

    const run = () => {
      if (running) return;
      running = true;
      const hidden = new Set<HTMLElement>();
      const layer = document.createElement('div');
      layer.className = 'hack-layer';
      layer.setAttribute('aria-hidden', 'true');
      const msg = document.createElement('div');
      msg.className = 'hack-msg';
      msg.setAttribute('aria-hidden', 'true');
      const msgText = document.createElement('div');
      msgText.className = 'hack-msg-text';
      const note = document.createElement('div');
      note.className = 'hack-msg-note';
      note.textContent = HACK_NOTE;
      msg.append(msgText, note);
      const flash = document.createElement('div');
      flash.className = 'hack-flash';
      flash.setAttribute('aria-hidden', 'true');
      const timers: number[] = [];
      let tick = 0;
      let finished = false;
      const words = buildWords(layer, hidden);
      if (words.length === 0) { running = false; nextAtMs = visibleMs + HACK.retryMs; return; }
      document.body.append(layer, flash, msg);
      if (srRef.current) srRef.current.textContent = HACK_SR_START;

      const finish = () => {
        if (finished) return;
        finished = true;
        timers.forEach((t) => window.clearTimeout(t));
        window.clearInterval(tick);
        window.removeEventListener('pointerdown', finish);
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('scroll', finish, true);
        window.removeEventListener('resize', finish);
        window.removeEventListener('focusin', onFocus);
        document.removeEventListener('visibilitychange', onVis);
        hidden.forEach((el) => el.classList.remove('hack-hide'));
        layer.remove(); flash.remove(); msg.remove();
        if (srRef.current) srRef.current.textContent = HACK_SR_END;
        window.setTimeout(() => { if (srRef.current) srRef.current.textContent = ''; }, 1500);
        running = false;
        end = null;
        nextAtMs = visibleMs + HACK.intervalMs;
        window.dispatchEvent(new Event(HACK_DONE_EVENT));
      };
      end = finish;
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') finish(); };
      const onFocus = (e: FocusEvent) => { if ((e.target as Element | null)?.matches?.(FIELDS)) finish(); };
      const onVis = () => { if (document.visibilityState !== 'visible') finish(); };
      window.addEventListener('pointerdown', finish, { passive: true });
      window.addEventListener('keydown', onKey);
      window.addEventListener('scroll', finish, { capture: true, passive: true });
      window.addEventListener('resize', finish);
      window.addEventListener('focusin', onFocus);
      document.addEventListener('visibilitychange', onVis);

      tick = window.setInterval(() => {
        if (modalOpen()) { finish(); return; }
        for (const w of words) w.el.textContent = rnd(w.len);
      }, HACK.scrambleTickMs);

      const t1 = HACK.scrambleLeadMs;
      const t2 = t1 + HACK.messageHoldMs;
      const t3 = t2 + HACK.flashMs;
      const t4 = t3 + HACK.clearHoldMs;
      timers.push(window.setTimeout(() => { msgText.textContent = HACK_MESSAGE; msg.classList.add('is-on'); }, t1));
      timers.push(window.setTimeout(() => { flash.classList.add('is-on'); }, t2));
      timers.push(window.setTimeout(() => { msgText.textContent = HACK_CLEARED; msg.classList.add('is-ok'); }, t2 + Math.round(HACK.flashMs / 2)));
      timers.push(window.setTimeout(finish, t4));
    };

    // The clock counts only time the tab is visible, and only after the boot screen is gone.
    const clock = window.setInterval(() => {
      if (!started || document.visibilityState !== 'visible') return;
      visibleMs += HACK.tickMs;
      if (!running && visibleMs >= nextAtMs) {
        if (blocked()) nextAtMs = visibleMs + HACK.retryMs; else run();
      }
    }, HACK.tickMs);

    const start = () => { started = true; };
    if (document.documentElement.hasAttribute('data-boot')) window.addEventListener('fifs:boot-complete', start, { once: true });
    else start();

    // Preview aid: /?hack=1 plays it once as soon as nothing is in the way (still switched off by NEXT_PUBLIC_HACK_EFFECT=off).
    let devPoll = 0;
    if (new URLSearchParams(window.location.search).get('hack') === '1') {
      let tries = 0;
      devPoll = window.setInterval(() => {
        tries += 1;
        if (!running && started && !blocked()) { window.clearInterval(devPoll); run(); } else if (tries > 60) window.clearInterval(devPoll);
      }, 500);
    }

    return () => {
      window.clearInterval(clock);
      window.clearInterval(devPoll);
      window.removeEventListener('fifs:boot-complete', start);
      end?.();
    };
  }, []);

  return <div ref={srRef} className="hack-sr" role="status" aria-live="polite" />;
}
