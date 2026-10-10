// Research loop: small behaviours (IDs Q### site, P### portals). Each one is wrapped so a failure in one can never affect another, uses no network,
// no storage, no innerHTML and no new library, and only adds attributes, labels or tiny elements (text is always set with textContent).
const w: any = typeof window === 'undefined' ? {} : window;
const run = (_id: string, fn: () => void) => { try { fn(); } catch { /* an experiment must never break the page */ } };
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));
const reduced = () => !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

export function installQol(): void {
  if (typeof window === 'undefined' || w.__fifsQolInstalled) return;
  w.__fifsQolInstalled = true;
  void reduced;
  // @@QOL_END
}
