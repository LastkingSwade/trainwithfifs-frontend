'use client';

import { useEffect } from 'react';
import { installEmojiIcons } from './emojiToIcons';

// Starts the emoji-to-icon upgrade only after the page has fully loaded and gone quiet, so it can never collide with React starting up.
export default function EmojiIcons() {
  useEffect(() => {
    let cancelled = false; let t: ReturnType<typeof setTimeout> | undefined;
    const go = () => { const w = window as any; const idle = typeof w.requestIdleCallback === 'function' ? (f: () => void) => w.requestIdleCallback(f, { timeout: 4000 }) : (f: () => void) => setTimeout(f, 300); idle(() => { t = setTimeout(() => { if (!cancelled) installEmojiIcons(); }, 1200); }); };
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
    return () => { cancelled = true; if (t) clearTimeout(t); };
  }, []);
  return null;
}
