// Swaps emoji for the site's thin-line icons everywhere text appears (page, pop-ups, text built by scripts), once the page has finished loading.
//
// Safety rules, because React owns most of this page's text:
//  * It runs only after the page has loaded (see EmojiIcons.tsx), so React is never surprised during start-up.
//  * It never removes or replaces a text node React created. It keeps that node (shortened) and adds new nodes beside it with splitText, so React's
//    own references stay valid.
//  * It leaves alone: scripts, styles, form fields and drop-down options (they cannot hold icons), the browser tab title, the home hero (already done by
//    hand), the boot intro and Hack Detected effects, and anything marked data-keep-emoji.
//  * An emoji with no icon in iconSet.ts is left exactly as it is.
//  * If an element is left with no visible text (an icon-only button), it gets a spoken name so it is still usable with a screen reader.
import { ICONS, iconNameFor } from './iconSet';

const SVG_NS = 'http://www.w3.org/2000/svg';
// One emoji (with its optional invisible variation selector and any joined parts), as the browser sees it.
// (Built with new RegExp because this project's TypeScript target predates the unicode-property syntax; browsers support it.)
const PICTO = '\\p{Extended_Pictographic}';
export const EMOJI_RE = new RegExp(PICTO + '\\uFE0F?(?:\\u200D' + PICTO + '\\uFE0F?)*', 'gu');
const HAS_PICTO = new RegExp(PICTO, 'u');
const ZWJ_TAIL = new RegExp('\\u200D[\\s\\S]*$', 'u');
const SKIP = 'script,style,noscript,textarea,input,select,option,title,svg,[contenteditable="true"],[data-keep-emoji],#hero-landing,.hack-layer,[class*="boot-"]';
const NAMELESS_HOSTS = 'button,a,summary,[role="button"],[role="link"],[role="tab"]';

export interface Found { index: number; length: number; icon: string }
export function findIcons(text: string): Found[] {
  const out: Found[] = [];
  for (const m of Array.from(text.matchAll(EMOJI_RE))) { const icon = iconNameFor(m[0].replace(ZWJ_TAIL, '')); if (icon && ICONS[icon]) out.push({ index: m.index as number, length: m[0].length, icon }); }
  return out;
}

export function buildIcon(doc: Document, name: string): SVGElement {
  const def = ICONS[name]; const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'fi-ico fi-ico-rt'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', '1.1em'); svg.setAttribute('height', '1.1em');
  svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.6'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false'); svg.setAttribute('data-icon', name);
  for (const [tag, attrs] of def.shapes) { const s = doc.createElementNS(SVG_NS, tag); for (const k of Object.keys(attrs)) s.setAttribute(k, String(attrs[k])); svg.appendChild(s); }
  return svg;
}

export function shouldSkip(node: Node): boolean {
  const el = node.parentElement; if (!el) return true;
  try { return !!el.closest(SKIP); } catch { return true; }
}

// Replaces each mapped emoji inside ONE text node. Returns how many were replaced.
export function upgradeTextNode(node: Text, doc: Document = document): number {
  const text = node.nodeValue; if (!text || shouldSkip(node)) return 0;
  const found = findIcons(text); if (!found.length) return 0;
  const host = node.parentElement as HTMLElement; let cur: Text = node; let consumed = 0; let done = 0;
  for (const f of found) {
    const mid = cur.splitText(f.index - consumed);   // cur keeps the text before the emoji (it is still the original node)
    const rest = mid.splitText(f.length);            // mid now holds just the emoji
    mid.parentNode?.replaceChild(buildIcon(doc, f.icon), mid);
    cur = rest; consumed = f.index + f.length; done += 1;
  }
  nameIfEmpty(host, found[0].icon);
  return done;
}

// An icon-only control (a button that used to hold only an emoji) must still have a name for screen readers.
function nameIfEmpty(host: HTMLElement, iconName: string): void {
  try {
    const control = host.closest(NAMELESS_HOSTS) as HTMLElement | null; if (!control) return;
    if (control.getAttribute('aria-label') || control.getAttribute('aria-labelledby') || control.getAttribute('title')) return;
    if ((control.textContent || '').trim() !== '') return;
    control.setAttribute('aria-label', ICONS[iconName].label);
  } catch { /* naming is a courtesy; never break the page */ }
}

export function upgradeTree(root: Node, doc: Document = document): number {
  let n = 0;
  if (root.nodeType === 3) return upgradeTextNode(root as Text, doc);
  const walker = doc.createTreeWalker(root, 4 /* SHOW_TEXT */);
  const nodes: Text[] = []; let cur = walker.nextNode();
  while (cur) { if (cur.nodeValue && HAS_PICTO.test(cur.nodeValue)) nodes.push(cur as Text); cur = walker.nextNode(); }
  for (const t of nodes) n += upgradeTextNode(t, doc);
  return n;
}

export function installEmojiIcons(): void {
  const w = window as any;
  if (w.__fifsEmojiIconsInstalled || w.__fifsNoEmojiIcons) return;
  w.__fifsEmojiIconsInstalled = true;
  const queue = new Set<Node>(); let scheduled = false;
  const flush = () => { scheduled = false; const items = Array.from(queue); queue.clear(); for (const n of items) { try { if (n.isConnected) upgradeTree(n); } catch { /* one bad node never stops the rest */ } } };
  const enqueue = (n: Node) => { queue.add(n); if (!scheduled) { scheduled = true; (w.requestAnimationFrame || ((f: () => void) => setTimeout(f, 50)))(flush); } };
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') { if (m.target.nodeValue && HAS_PICTO.test(m.target.nodeValue)) enqueue(m.target); }
      else m.addedNodes.forEach((a) => { if (a.nodeType === 3 || a.nodeType === 1) enqueue(a); });
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  try { upgradeTree(document.body); } catch { /* the page works the same without it */ }
}
