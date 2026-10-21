import { createSequenceMatcher, isTypingTarget, nextOpsMode, OPS_LABEL, type OpsMode } from './logic';

// Tier 2: type "fifs" or "nvg" (anywhere except inside a text box) to switch the whole site into Night-Ops: a phosphor-green or red-dot crimson tint over every colour,
// and a thin telemetry bar along the bottom. Type it again to cycle; Escape or the Exit button turns it off. Nothing is stored and nothing is sent.
// The page keeps a hidden terminal text box that can hold focus while nothing is visible; typing into something the person cannot see is not "typing in a text box".
function typingInVisibleField(el: unknown): boolean {
  if (!isTypingTarget(el)) return false;
  const e = el as HTMLElement;
  try { if (e.closest?.('#terminalGatewayOverlay:not(.active)')) return false; const r = e.getBoundingClientRect(); if (r.width === 0 && r.height === 0) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return false; } catch { /* treat it as a real field */ }
  return true;
}
let mode: OpsMode = 'off'; let tint: HTMLElement | null = null; let bar: HTMLElement | null = null; let live: HTMLElement | null = null; let timer: number | undefined;
const clock = (): string => { try { return new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false }); } catch { return '--:--:--'; } };

function build(): void {
  if (tint) return;
  tint = document.createElement('div'); tint.id = 'fifs-ops-tint'; tint.setAttribute('aria-hidden', 'true');
  bar = document.createElement('div'); bar.id = 'fifs-ops-bar'; bar.setAttribute('role', 'status');
  bar.innerHTML = '<span class="ops-dot" aria-hidden="true">◉</span><strong id="fifs-ops-mode"></strong><span class="ops-sep" aria-hidden="true">|</span><span>ET <span id="fifs-ops-clock"></span></span><span class="ops-sep" aria-hidden="true">|</span><span class="ops-safe">SAFETY: ON · MUZZLE: SAFE DIRECTION</span><button type="button" id="fifs-ops-exit">Exit ✕</button>';
  live = document.createElement('div'); live.className = 'fifs-sr'; live.setAttribute('aria-live', 'polite');
  document.body.append(tint, bar, live);
  bar.querySelector('#fifs-ops-exit')?.addEventListener('click', () => setMode('off'));
}
function tear(): void { tint?.remove(); bar?.remove(); live?.remove(); tint = bar = live = null; if (timer) { window.clearInterval(timer); timer = undefined; } }

export function setMode(next: OpsMode): void {
  mode = next; const root = document.documentElement;
  if (next === 'off') { root.removeAttribute('data-ops'); tear(); return; }
  build(); root.setAttribute('data-ops', next);
  const m = bar?.querySelector('#fifs-ops-mode'); if (m) m.textContent = 'NIGHT-OPS · ' + OPS_LABEL[next];
  const tick = () => { const c = bar?.querySelector('#fifs-ops-clock'); if (c) c.textContent = clock(); }; tick();
  if (!timer) timer = window.setInterval(tick, 1000);
  if (live) live.textContent = `Night-Ops ${next === 'green' ? 'phosphor green' : 'red dot crimson'} mode on. Press Escape to turn it off.`;
}
export const currentMode = (): OpsMode => mode;

export function installNightOps(): void {
  const w = window as unknown as { __fifsOps?: boolean }; if (w.__fifsOps) return; w.__fifsOps = true;
  const matcher = createSequenceMatcher({ ops: 'fifs', ops2: 'nvg' });
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (typingInVisibleField(e.target) || typingInVisibleField(document.activeElement)) { matcher.reset(); return; }
    if (e.key === 'Escape' && mode !== 'off') { setMode('off'); return; }
    if (matcher.feed(e.key, Date.now())) setMode(nextOpsMode(mode));
  });
}
