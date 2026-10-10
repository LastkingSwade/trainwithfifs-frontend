'use client';

import { useEffect, useState } from 'react';
import { BOOT, BOOT_ACCESS, BOOT_BRAND, BOOT_DONE_EVENT, BOOT_DOTS, BOOT_LOADING, BOOT_WELCOME } from './bootConfig';
import './boot.css';

// Module-level: lives as long as this document. A full load or reload starts fresh (the intro plays again); client-side route changes keep it,
// so the intro cannot replay on navigation even if the component were mounted again.
let introFinished = false;

type Phase = 'type' | 'welcome' | 'glitch' | 'dissolve' | 'crt';
// Fixed, hand-authored scatter for the dissolving letters (no random numbers): x, y in px and a delay in ms, repeated across the letters.
const SCATTER: ReadonlyArray<readonly [number, number, number]> = [[-18, -26, 0], [22, 14, 90], [-9, 30, 40], [30, -12, 140], [-26, 8, 70], [12, -34, 120], [-14, -10, 20], [26, 28, 100]];

// Terminal intro, once per full page load. The inline gate script in the page head sets data-boot on <html> before the first paint (which keeps the
// page hidden and its animations paused); this component plays the sequence, then reveals the page and starts the animations.
export default function BootIntro() {
  const [active, setActive] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [phase, setPhase] = useState<Phase>('type');
  const [access, setAccess] = useState('');
  const [loading, setLoading] = useState('');
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

    // Types text one character at a time; the delay after each character can depend on the character (the dots are slower).
    const typeOut = (text: string, delayFor: (ch: string, i: number) => number, set: (s: string) => void, done: () => void) => {
      let i = 0;
      const step = () => { i += 1; set(text.slice(0, i)); if (i < text.length) later(step, delayFor(text[i], i)); else done(); };
      later(step, delayFor(text[0], 0));
    };
    const accessText = BOOT_ACCESS + BOOT_DOTS;
    const loadingText = BOOT_LOADING + BOOT_BRAND;

    // The clock started when the page began loading, not when this component mounted: skip the blank beat if the page is already late.
    // There is no ceiling: the sequence always plays to the end, however long loading took (the gate script's fail-safe is the only backstop).
    const elapsed = Math.round(performance.now());
    later(() => {
      typeOut(accessText, (_c, i) => (i >= BOOT_ACCESS.length ? BOOT.dotMsPerChar : BOOT.accessMsPerChar), setAccess, () => {
        later(() => {
          typeOut(loadingText, () => BOOT.loadingMsPerChar, setLoading, () => {
            later(() => {
              setPhase('welcome');                                   // the screen is cleared
              later(() => {
                typeOut(BOOT_WELCOME, () => BOOT.welcomeMsPerChar, setWelcome, () => {
                  later(() => {
                    setPhase('glitch');
                    later(() => {
                      setPhase('dissolve');
                      later(() => {
                        setPhase('crt');
                        later(() => finish(BOOT.fadeMs), BOOT.crtMs);
                      }, BOOT.dissolveMs);
                    }, BOOT.glitchMs);
                  }, BOOT.holdAfterWelcomeMs);
                });
              }, BOOT.clearMs);
            }, BOOT.holdAfterLoadingMs);
          });
        }, BOOT.holdAfterAccessMs);
      });
    }, Math.max(BOOT.blankMs - elapsed, 0));

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
  }, []);

  if (!active) return null;
  const cleared = phase !== 'type';
  const loadingPlain = loading.slice(0, BOOT_LOADING.length);
  const loadingBrand = loading.slice(BOOT_LOADING.length);
  const accessDone = access.length === (BOOT_ACCESS + BOOT_DOTS).length;
  const onLoadingLine = accessDone && loading.length > 0;
  return (
    <div className={`boot-intro phase-${phase}${leaving ? ' is-leaving' : ''}`} style={{ ['--boot-fade' as string]: `${BOOT.fadeMs}ms`, ['--boot-crt' as string]: `${BOOT.crtMs}ms`, ['--boot-glitch' as string]: `${BOOT.glitchMs}ms`, ['--boot-dissolve' as string]: `${BOOT.dissolveMs}ms` }}>
      <div className="boot-screen">
        <div className="boot-term" role="status" aria-live="polite">
          {!cleared && (
            <>
              <div className="boot-line">
                <span>{access}</span>
                {!onLoadingLine && <span className="boot-cursor" aria-hidden="true" />}
              </div>
              {loading.length > 0 && (
                <div className="boot-line">
                  <span>{loadingPlain}</span>
                  <span className="boot-brand">{loadingBrand}</span>
                  <span className="boot-cursor" aria-hidden="true" />
                </div>
              )}
            </>
          )}
          {cleared && (
            <div className="boot-line boot-welcome" data-text={welcome}>
              <span className="boot-welcome-text">
                {welcome.split('').map((ch, i) => {
                  const [x, y, d] = SCATTER[i % SCATTER.length];
                  return <span key={i} className="boot-ch" style={{ ['--bx' as string]: `${x}px`, ['--by' as string]: `${y}px`, ['--bd' as string]: `${d}ms` }}>{ch === ' ' ? ' ' : ch}</span>;
                })}
              </span>
              {phase === 'welcome' && <span className="boot-cursor" aria-hidden="true" />}
            </div>
          )}
        </div>
      </div>
      <div className="boot-crt-line" aria-hidden="true" />
      <div className="boot-scan" aria-hidden="true" />
      <div className="boot-vignette" aria-hidden="true" />
      <div className="boot-skip" aria-hidden="true"><span className="boot-skip-key">Press any key to skip</span><span className="boot-skip-tap">Tap to skip</span></div>
    </div>
  );
}
