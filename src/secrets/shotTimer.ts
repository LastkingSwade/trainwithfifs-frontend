import { PAR_MS, createTripleClick, formatSeconds, gradeShot, randomStandbyMs } from './logic';

// Tier 3: triple-click (or triple-tap, or press Enter three times on) the footer badge to open a small floating shot timer. After a random 1.5 to 3.5 second "Standby..." a BEEP
// sounds and the pad flashes; tap it as fast as you can. Under 0.60 s is a Grandmaster, within the 1.25 s par is Maryland Qualified, slower needs dry-fire practice.
// The best time is kept in this browser only (and only if the browser allows it).
type State = 'standby' | 'go' | 'result' | 'false';
let box: HTMLElement | null = null; let state: State = 'standby'; let wait: number | undefined; let goAt = 0; let muted = false; let opener: HTMLElement | null = null; let ctx: AudioContext | null = null;
const BEST = 'fifs-shot-best';
const best = (): number | null => { try { const v = Number(localStorage.getItem(BEST)); return Number.isFinite(v) && v > 0 ? v : null; } catch { return null; } };
const saveBest = (ms: number) => { try { const b = best(); if (b === null || ms < b) localStorage.setItem(BEST, String(Math.round(ms))); } catch { /* not saved */ } };
function beep(): void {
  if (muted) return;
  try {
    const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }); const C = AC.AudioContext || AC.webkitAudioContext; if (!C) return;
    ctx = ctx || new C(); const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = 2600; g.gain.value = 0.08; o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.16);
  } catch { /* no sound is fine: the flash is the signal */ }
}
const $ = <T extends HTMLElement>(id: string) => box?.querySelector<T>('#' + id) || null;
function paint(): void {
  const pad = $('fifs-shot-pad'), msg = $('fifs-shot-msg'), sub = $('fifs-shot-sub'), bestEl = $('fifs-shot-best'); if (!pad || !msg || !sub) return;
  pad.dataset.state = state;
  if (state === 'standby') { msg.textContent = 'STANDBY…'; sub.textContent = 'Hands off. Tap the pad when you hear the BEEP.'; pad.textContent = 'WAIT'; }
  if (state === 'go') { msg.textContent = 'BEEP!'; sub.textContent = 'TAP NOW'; pad.textContent = 'FIRE'; }
  if (state === 'false') { msg.textContent = 'FALSE START'; sub.textContent = 'Finger off the trigger until the beep. Try again.'; pad.textContent = 'AGAIN'; }
  const b = best(); if (bestEl) bestEl.textContent = b ? 'Best: ' + formatSeconds(b) + ' · Par: ' + formatSeconds(PAR_MS) : 'Par: ' + formatSeconds(PAR_MS);
}
function start(): void {
  if (wait) window.clearTimeout(wait); state = 'standby'; paint();
  wait = window.setTimeout(() => { state = 'go'; goAt = performance.now(); beep(); paint(); }, randomStandbyMs());
}
function shoot(): void {
  if (state === 'standby') { if (wait) window.clearTimeout(wait); state = 'false'; paint(); return; }
  if (state === 'go') {
    const ms = performance.now() - goAt; state = 'result'; saveBest(ms); const g = gradeShot(ms);
    const pad = $('fifs-shot-pad'), msg = $('fifs-shot-msg'), sub = $('fifs-shot-sub'); if (!pad || !msg || !sub) return;
    pad.dataset.state = 'result'; pad.textContent = 'AGAIN'; msg.textContent = `${g.emoji} ${formatSeconds(ms)}`; sub.textContent = `${g.label}. ${g.note}`;
    const bestEl = $('fifs-shot-best'), b = best(); if (bestEl && b) bestEl.textContent = 'Best: ' + formatSeconds(b) + ' · Par: ' + formatSeconds(PAR_MS);
    return;
  }
  start(); // after a result or a false start, the pad runs it again
}
export function closeShotTimer(): void { if (wait) window.clearTimeout(wait); box?.remove(); box = null; opener?.focus?.(); }
export function openShotTimer(from?: HTMLElement | null): void {
  if (box) return; opener = from || (document.activeElement as HTMLElement | null);
  box = document.createElement('div'); box.id = 'fifs-shot'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Draw to first shot timer');
  box.innerHTML = '<div class="shot-head"><strong>⏱️ SHOT TIMER · DRAW TO FIRST SHOT</strong><span><button type="button" id="fifs-shot-mute" aria-label="Mute the beep" aria-pressed="false">🔊</button><button type="button" id="fifs-shot-close" aria-label="Close the shot timer">✕</button></span></div>'
    + '<div id="fifs-shot-msg" class="shot-msg" aria-live="assertive"></div><div id="fifs-shot-sub" class="shot-sub" aria-live="polite"></div>'
    + '<button type="button" id="fifs-shot-pad" class="shot-pad"></button><div id="fifs-shot-best" class="shot-best"></div>';
  document.body.append(box);
  $('fifs-shot-pad')?.addEventListener('click', shoot); $('fifs-shot-close')?.addEventListener('click', closeShotTimer);
  $('fifs-shot-mute')?.addEventListener('click', (e) => { muted = !muted; const b = e.currentTarget as HTMLElement; b.textContent = muted ? '🔇' : '🔊'; b.setAttribute('aria-pressed', String(muted)); });
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeShotTimer(); } });
  start(); $('fifs-shot-pad')?.focus();
}

/** The footer badge: a small, always-visible FIFS mark at the bottom of every page. Three quick clicks, taps or Enter presses open the shot timer. */
export function installFooterBadge(): void {
  if (document.getElementById('fifs-foot')) return;
  const foot = document.createElement('footer'); foot.id = 'fifs-foot';
  foot.innerHTML = '<button type="button" id="fifs-badge" class="fifs-badge" aria-label="Future Initiative Firearm Services badge"><img src="/icons/icon-192.png" alt="" width="28" height="28"><span>FIFS · Future Initiative Firearm Services · Maryland</span></button>';
  document.body.append(foot);
  const badge = foot.querySelector<HTMLElement>('#fifs-badge'); const triple = createTripleClick();
  badge?.addEventListener('click', () => { if (triple.click(Date.now())) openShotTimer(badge); });
}
