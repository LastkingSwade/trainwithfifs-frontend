'use client';

import { useEffect, useState } from 'react';
import { BOOT, BOOT_DONE_EVENT, BOOT_GRANTED, BOOT_TITLE, BOOT_WELCOME } from './bootConfig';
import './boot.css';

// Module-level: lives as long as this document. A full load or reload starts fresh (the intro plays again); client-side route changes keep it,
// so the intro cannot replay on navigation even if the component were mounted again.
let introFinished = false;

// Terminal intro, once per full page load. The inline gate script in the page head sets data-boot on <html> before the first paint (which keeps the
// page hidden and its animations paused); this component plays the sequence, then reveals the page and starts the animations.
export default function BootIntro() {
  const [active, setActive] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [title, setTitle] = useState('');
  const [granted, setGranted] = useState('');
  const [welcome, setWelcome] = useState('');

  useEffect(() => {
    const root = document.documentElement;
    if (introFinished || !root.hasAttribute('data-boot')) { setActive(false); return; }

    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };
    let finished = false;

    const finish = (fadeMs: number) => {
      if (finished) return;
      finished = true;
      introFinished = true;
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
      setLeaving(true);
      root.setAttribute('data-boot', 'reveal'); // page visible under the fading overlay; animations still paused
      window.setTimeout(() => {
        root.removeAttribute('data-boot');     // overlay gone: now the existing animations start
        setActive(false);
        window.dispatchEvent(new Event(BOOT_DONE_EVENT));
      }, fadeMs);
    };
    const skip = () => finish(BOOT.skipFadeMs);
    window.addEventListener('pointerdown', skip, { passive: true });
    window.addEventListener('keydown', skip);

    const typeOut = (text: string, perChar: number, set: (s: string) => void, done: () => void) => {
      let i = 0;
      const step = () => { i += 1; set(text.slice(0, i)); if (i < text.length) later(step, perChar); else done(); };
      later(step, perChar);
    };
    // The clock started when the page began loading, not when this component mounted: skip the blank beat if the page is already late.
    // There is no ceiling: the sequence always plays to the end, however long loading took (the gate script's fail-safe is the only backstop).
    const elapsed = Math.round(performance.now());
    later(() => {
      typeOut(BOOT_TITLE, BOOT.typeMsPerChar, setTitle, () => {
        later(() => {
          typeOut(BOOT_GRANTED, BOOT.grantedMsPerChar, setGranted, () => {
            later(() => {
              typeOut(BOOT_WELCOME, BOOT.welcomeMsPerChar, setWelcome, () => later(() => finish(BOOT.fadeMs), BOOT.holdAfterWelcomeMs));
            }, BOOT.holdAfterGrantedMs);
          });
        }, BOOT.holdAfterTitleMs);
      });
    }, Math.max(BOOT.blankMs - elapsed, 0));

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
  }, []);

  if (!active) return null;
  const grantedShown = granted.length > 0;
  const welcomeShown = welcome.length > 0;
  return (
    <div className={`boot-intro${leaving ? ' is-leaving' : ''}`} style={{ ['--boot-fade' as string]: `${BOOT.fadeMs}ms` }}>
      <div className="boot-text" role="status" aria-live="polite">
        <div className="boot-title">
          <span>{title}</span>
          {!grantedShown && <span className="boot-cursor" aria-hidden="true" />}
        </div>
        {grantedShown && (
          <div className="boot-granted">
            <span className="boot-halo" aria-hidden="true" />
            <span className="boot-granted-text">{granted}</span>
            {!welcomeShown && <span className="boot-cursor boot-cursor-accent" aria-hidden="true" />}
          </div>
        )}
        {welcomeShown && (
          <div className="boot-welcome">
            <span>{welcome}</span>
            <span className="boot-cursor" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="boot-sweep" aria-hidden="true" />
      <div className="boot-scan" aria-hidden="true" />
      <div className="boot-vignette" aria-hidden="true" />
      <div className="boot-skip" aria-hidden="true"><span className="boot-skip-key">Press any key to skip</span><span className="boot-skip-tap">Tap to skip</span></div>
    </div>
  );
}
