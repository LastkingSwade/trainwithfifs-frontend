import { BEATS } from './config';

// Characters the scramble draws from, and a fixed-seed generator so the sequence is identical on every load.
const GLYPHS = 'ABCDEFGHJKLNPRSTUVXYZ0123456789#+=';  // no M, W, O, Q or %: the widest glyphs would push the scramble past the pill
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Indices where the real text starts a new line, so the scramble can break lines in the same places instead of wrapping on its own
// (scrambled letters are wider or narrower than the real ones and would otherwise spill out of the pill).
function lineStarts(target: HTMLElement): Set<number> {
  const starts = new Set<number>();
  const node = target.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) return starts;
  const range = document.createRange();
  const length = (node.textContent || '').length;
  let previousTop: number | null = null;
  for (let i = 0; i < length; i++) {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const rect = range.getClientRects()[0];
    if (!rect || rect.width === 0) continue;
    if (previousTop !== null && rect.top - previousTop > rect.height * 0.6) starts.add(i);
    previousTop = rect.top;
  }
  return starts;
}

export interface DecodeHandle {
  finish(): void;
}

// Resolves `target`'s text word by word from scrambled characters. The real text is never removed from the page: the
// scramble is drawn by an absolutely positioned overlay, so layout, copy and screen readers see the final text throughout.
export function runDecode(target: HTMLElement, easing: string, onDone: () => void): DecodeHandle {
  const text = target.textContent || '';
  const overlay = document.createElement('span');
  overlay.className = 'hud-decode-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  const cs = getComputedStyle(target);
  const finalSpacing = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing);
  overlay.style.color = cs.color; // read before the real text is made transparent
  target.appendChild(overlay);
  target.setAttribute('data-hud-decoding', '');

  // Per-character lock time: words lock at their authored beat, letters inside a word trail by 24ms each.
  const words = text.split(' ');
  const locks: number[] = [];
  words.forEach((word, wi) => {
    const base = BEATS.decodeLocks[Math.min(wi, BEATS.decodeLocks.length - 1)] - BEATS.decodeLocks[0];
    for (let ci = 0; ci < word.length; ci++) locks.push(base + ci * 24);
    locks.push(base + word.length * 24); // the space after the word
  });
  locks.pop();

  const breaks = lineStarts(target);
  const rnd = seeded(0x5eed);
  const start = performance.now();
  const track = overlay.animate(
    [{ letterSpacing: `${finalSpacing - 1.6}px` }, { letterSpacing: `${finalSpacing}px` }],
    { duration: 640, easing, fill: 'forwards' },
  );
  let timer = 0;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(timer);
    track.cancel();
    overlay.remove();
    target.removeAttribute('data-hud-decoding');
    onDone();
  };
  const tick = () => {
    const elapsed = performance.now() - start;
    let out = '';
    let pending = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (breaks.has(i)) out = out.replace(/ $/, '') + '\n';
      if (ch === ' ' || elapsed >= locks[i]) out += ch;
      else { out += GLYPHS[Math.floor(rnd() * GLYPHS.length)]; pending = true; }
    }
    overlay.textContent = out;
    if (pending) timer = window.setTimeout(tick, 45);
    else finish();
  };
  tick();
  return { finish };
}
