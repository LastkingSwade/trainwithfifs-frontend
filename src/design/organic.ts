// Finds the boxes, tags and big buttons on the page and gives each the matching class of the organic skin (see organic.css and DESIGN_SYSTEM.md), so frames that live in
// inline styles or in content built by script are softened too, without editing every one of them. It only adds classes: it never changes text, size or position, and it
// leaves the boot intro, "Hack Detected", the hidden terminal, the calendar and the HUD graphics alone.
export type Kind = 'surface' | 'pill' | 'pillbtn' | 'cta' | null;
export interface Metrics { w: number; h: number; tag: string; borderW: number; borderVisible: boolean; hasBg: boolean; radius: number; textLen: number; fixed: boolean }

/** What an element should become. Pure, so the rules can be tested without a browser. */
export function classify(m: Metrics): Kind {
  if (m.w <= 0 || m.h <= 0 || m.fixed && m.h > 800) return null;
  if (['INPUT', 'SELECT', 'TEXTAREA', 'IMG', 'SVG', 'CANVAS', 'VIDEO', 'IFRAME'].includes(m.tag)) return null;
  const framed = m.borderVisible || m.hasBg; if (!framed) return null;
  const interactive = m.tag === 'BUTTON' || m.tag === 'A';
  if (interactive && m.h >= 40 && m.h <= 84 && m.w >= 110) return 'cta';
  if (m.h <= 48 && m.w <= 460 && m.radius >= 3 && m.textLen > 0 && m.textLen <= 60) return interactive ? 'pillbtn' : 'pill';
  if (!interactive && m.w * m.h > 14000 && m.w > 120 && m.h > 60) return 'surface';
  return null;
}
/** Parts of the page the skin must never touch. */
export const SKIP = '#terminalGatewayOverlay, .hack-lay, [class*="hack-"], [class*="boot"], .hw, .hud-layer, .hud-svg, .hero-holo-overlay-svg, #bookingCalDaysGrid, .cal-day-cell, .tier-sliding-switch, #fifs-ops-tint, #fifs-ops-bar, #fifs-shot, svg, [data-organic="skip"]';

const w: any = typeof window === 'undefined' ? {} : window;
const CLS: Record<Exclude<Kind, null>, string> = { surface: 'og-s', pill: 'og-p', pillbtn: 'og-pb', cta: 'og-c' };
const parseAlpha = (c: string): number => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return c === 'transparent' ? 0 : 1; const p = m[1].split(',').map((x) => parseFloat(x)); return p.length > 3 ? p[3] : 1; };

function metricsOf(el: HTMLElement): Metrics | null {
  const r = el.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return null;
  const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none') return null;
  const bw = parseFloat(s.borderTopWidth) || 0; const borderVisible = bw >= 1 && s.borderTopStyle !== 'none' && parseAlpha(s.borderTopColor) > 0.02;
  const hasBg = parseAlpha(s.backgroundColor) > 0.04 || (s.backgroundImage !== 'none' && !/url\(/.test(s.backgroundImage));
  const radius = Math.max(parseFloat(s.borderTopLeftRadius) || 0, parseFloat(s.borderTopRightRadius) || 0);
  return { w: r.width, h: r.height, tag: el.tagName, borderW: bw, borderVisible, hasBg, radius, textLen: (el.textContent || '').trim().length, fixed: s.position === 'fixed' };
}
const seen = new WeakSet<Element>();
export function scan(root: ParentNode = document, budget = 600): void {
  const list = root.querySelectorAll<HTMLElement>('div, section, article, aside, header, footer, li, label, span, a, button, details, summary');
  let n = 0;
  for (const el of Array.from(list)) {
    if (seen.has(el)) continue; if (el.closest(SKIP)) { seen.add(el); continue; }
    const m = metricsOf(el); if (!m) continue; // hidden or not drawn yet: looked at again when it is shown
    seen.add(el); const k = classify(m); if (k) el.classList.add(CLS[k]);
    if (++n >= budget) break;
  }
}

export function installOrganic(): void {
  if (w.__fifsOrganic || typeof document === 'undefined') return; w.__fifsOrganic = true;
  if (document.documentElement.getAttribute('data-organic') === 'off') return;
  let timer: number | undefined; const later = () => { if (timer) return; timer = window.setTimeout(() => { timer = undefined; const idle = (window as any).requestIdleCallback as undefined | ((f: () => void, o?: { timeout: number }) => number); const go = () => scan(); if (idle) idle(go, { timeout: 800 }); else go(); }, 250); };
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  window.addEventListener('load', later); later();
}
