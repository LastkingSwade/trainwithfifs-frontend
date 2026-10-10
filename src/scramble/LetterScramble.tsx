'use client';

import { useEffect } from 'react';
import { HACK_CHARS } from '../hack/hackConfig';
import { SCRAMBLE } from './scrambleConfig';
import './scramble.css';

// Things the effect never touches: anything a person can click, type in or navigate with, and moving content.
const INTERACTIVE = 'a, button, input, textarea, select, label, nav, form, summary, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [contenteditable], [data-onclick], [onclick], .reviews-marquee-box, .hud-layer, .boot-intro, .hack-layer, script, style, noscript, svg';
const MODALS = '.fi-portal-modal-overlay, .goal-modal-overlay, [role="dialog"], [aria-modal="true"], .group-panel';
const FIELDS = 'input, textarea, select, [contenteditable]';

const homeVisible = () => {
  const hero = document.getElementById('hero-landing');
  return !!hero && hero.offsetParent !== null && !hero.classList.contains('hidden-view');
};
const isShown = (el: HTMLElement) => {
  for (let n: HTMLElement | null = el; n && n !== document.body; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
  }
  return el.getClientRects().length > 0;
};
const modalOpen = () => Array.from(document.querySelectorAll<HTMLElement>(MODALS)).some(isShown);
// A focused field only counts if it is really showing (the hidden terminal box on the home page can hold focus without being visible).
const fieldFocused = () => { const a = document.activeElement as HTMLElement | null; return !!a && a !== document.body && a.matches(FIELDS) && isShown(a); };
const blocked = () => !homeVisible() || modalOpen() || fieldFocused() || document.documentElement.hasAttribute('data-boot') || document.visibilityState !== 'visible'
  || document.documentElement.getAttribute('data-hud-state') === 'intro' || !!document.querySelector('.hack-layer');

// Touching the screen, clicking, typing or scrolling cancels a playing scramble; those and mouse movement also restart the quiet period.
const CANCEL = ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'] as const;
const ACTIVITY = ['pointerdown', 'pointermove', 'touchstart', 'keydown', 'wheel', 'scroll'] as const;

const pick = () => HACK_CHARS[Math.floor(Math.random() * HACK_CHARS.length)];
/** Letters and digits become random characters; spaces and punctuation stay, so the shapes of the words stay recognisable. */
export const scrambleText = (src: string): string => src.replace(/[A-Za-z0-9]/g, () => pick());

interface Word { el: HTMLSpanElement; src: string; live: boolean }

function buildWords(layer: HTMLElement, hidden: Set<HTMLElement>): Word[] {
  // Styles are copied into plain strings while collecting: a computed-style object is live and would report the hidden colour afterwards.
  const found: Array<{ parent: HTMLElement; text: string; rect: DOMRect; css: string }> = [];
  const vw = window.innerWidth, vh = window.innerHeight;
  const hero = document.getElementById('hero-landing');
  if (!hero) return [];
  const walker = document.createTreeWalker(hero, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let node: Node | null;
  while ((node = walker.nextNode()) && found.length < SCRAMBLE.maxWords) {
    const text = node.textContent || '';
    const parent = node.parentElement;
    if (!parent || !text.trim() || parent.closest(INTERACTIVE) || parent.querySelector(INTERACTIVE)) continue;
    const cs = getComputedStyle(parent);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
    for (const m of Array.from(text.matchAll(/\S+/g))) {
      if (found.length >= SCRAMBLE.maxWords) break;
      range.setStart(node, m.index ?? 0); range.setEnd(node, (m.index ?? 0) + m[0].length);
      const r = range.getClientRects()[0];
      if (!r || r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily}`;
      found.push({ parent, text: m[0], rect: r, css: `font:${font};line-height:${r.height}px;letter-spacing:${cs.letterSpacing};text-transform:${cs.textTransform};color:${cs.color};text-shadow:${cs.textShadow}` });
    }
  }
  if (!found.length) return [];
  // A random share of the words, different every time (always at least one).
  const chosen = found.filter(() => Math.random() < SCRAMBLE.share);
  if (!chosen.length) chosen.push(found[Math.floor(Math.random() * found.length)]);
  // Hiding a text block by colour hides all of its words, so every word of a touched block is redrawn: the chosen ones scrambled, the rest as they were.
  const picked = new Set(chosen);
  const parents = new Set(chosen.map((w) => w.parent));
  const words: Word[] = [];
  for (const w of found) {
    if (!parents.has(w.parent)) continue;
    const { rect: r, parent } = w;
    const live = picked.has(w);
    const el = document.createElement('span');
    el.className = 'scr-word';
    el.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;${w.css}`;
    el.textContent = live ? scrambleText(w.text) : w.text;
    layer.appendChild(el);
    words.push({ el, src: w.text, live });
    parent.classList.add('scr-hide'); hidden.add(parent);
  }
  return words;
}

export default function LetterScramble() {
  useEffect(() => {
    if (!SCRAMBLE.ENABLED || window.location.pathname !== '/') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let running = false, started = false, lastActivity = Date.now(), lastEnd = 0;
    let end: (() => void) | null = null;

    const pulse = () => {
      if (running) return;
      running = true;
      const hidden = new Set<HTMLElement>();
      const layer = document.createElement('div');
      layer.className = 'scr-layer'; layer.setAttribute('aria-hidden', 'true');
      const words = buildWords(layer, hidden);
      if (!words.length) { hidden.forEach((e) => e.classList.remove('scr-hide')); running = false; lastEnd = Date.now() - SCRAMBLE.repeatMs + SCRAMBLE.retryMs; return; }
      document.body.append(layer);
      let finished = false;
      const stop = () => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timer); window.clearInterval(tick);
        for (const ev of CANCEL) window.removeEventListener(ev, stop, true);
        window.removeEventListener('resize', stop);
        document.removeEventListener('visibilitychange', onVis);
        hidden.forEach((e) => e.classList.remove('scr-hide'));
        layer.remove();
        running = false; end = null; lastEnd = Date.now();
      };
      end = stop;
      const onVis = () => { if (document.visibilityState !== 'visible') stop(); };
      for (const ev of CANCEL) window.addEventListener(ev, stop, { capture: true, passive: true });
      window.addEventListener('resize', stop);
      document.addEventListener('visibilitychange', onVis);
      const tick = window.setInterval(() => { if (modalOpen() || fieldFocused()) { stop(); return; } for (const w of words) if (w.live) w.el.textContent = scrambleText(w.src); }, SCRAMBLE.tickMs);
      const timer = window.setTimeout(stop, SCRAMBLE.durationMs);
    };

    // Any sign of life restarts the quiet period. (A touch, click, key or scroll also cancels a scramble that is playing, see CANCEL.)
    const alive = () => { lastActivity = Date.now(); };
    for (const ev of ACTIVITY) window.addEventListener(ev, alive, { capture: true, passive: true });

    // The clock counts only while the tab is visible and the boot screen is gone.
    const clock = window.setInterval(() => {
      if (!started || document.visibilityState !== 'visible' || running) return;
      const now = Date.now();
      if (now - lastActivity < SCRAMBLE.idleMs || now - lastEnd < SCRAMBLE.repeatMs) return;
      if (blocked()) { lastEnd = now - SCRAMBLE.repeatMs + SCRAMBLE.retryMs; return; }
      pulse();
    }, SCRAMBLE.clockMs);

    const start = () => { started = true; lastActivity = Date.now(); };
    if (document.documentElement.hasAttribute('data-boot')) window.addEventListener('fifs:boot-complete', start, { once: true }); else start();

    return () => { window.clearInterval(clock); window.removeEventListener('fifs:boot-complete', start); for (const ev of ACTIVITY) window.removeEventListener(ev, alive, true); end?.(); };
  }, []);

  return null;
}
