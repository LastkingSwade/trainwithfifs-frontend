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
  // Q076: The tab title follows the page you are on (and returns to the original on the home page)
  run('Q076', () => {
    const titles: Record<string, string> = { booking: 'Book a Class | Train With FIFS', portal: 'Student Portal | Train With FIFS', 'fi-portal': 'Client Portal | Train With FIFS', about: 'Meet Your Instructor | Train With FIFS', testimonial: 'Range Highlights | Train With FIFS', faq: 'FAQ | Train With FIFS', admin: 'Command Center | Train With FIFS' };
    const base = document.title; let last = base;
    const apply = () => { const v = String(w.currentActiveView || 'home'); const t = titles[v] || base; if (t !== last) { document.title = t; last = t; } };
    new MutationObserver(apply).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  });
  // Q078: Phones and password managers fill the booking form for you (autocomplete hints)
  run('Q078', () => {
    const map: Record<string, string> = { fullName: 'name', email: 'email', phone: 'tel' };
    for (const [id, val] of Object.entries(map)) { const el = document.getElementById(id); if (el && !el.getAttribute('autocomplete')) el.setAttribute('autocomplete', val); }
  });
  // @@QOL_END
}
