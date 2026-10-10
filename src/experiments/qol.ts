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
  // Q079: The phone keypad matches the field (number pad for phone, @ keyboard for email)
  run('Q079', () => {
    const phone = document.getElementById('phone'), email = document.getElementById('email');
    if (phone && !phone.getAttribute('inputmode')) phone.setAttribute('inputmode', 'tel');
    if (email && !email.getAttribute('inputmode')) email.setAttribute('inputmode', 'email');
  });
  // Q081: The name field starts each word with a capital
  run('Q081', () => { const n = document.getElementById('fullName'); if (n && !n.getAttribute('autocapitalize')) n.setAttribute('autocapitalize', 'words'); });
  // Q082: No red squiggles under emails and group codes
  run('Q082', () => { for (const id of ['email', 'podCodeInput']) { const el = document.getElementById(id); if (el) el.setAttribute('spellcheck', 'false'); } });
  // Q083: Stray spaces around a name, email or phone are removed when you leave the field
  run('Q083', () => {
    for (const id of ['fullName', 'email', 'phone']) { const el = document.getElementById(id) as HTMLInputElement | null; if (el) el.addEventListener('blur', () => { const v = el.value.trim(); if (v !== el.value) el.value = v; }); }
  });
  // Q084: Tapping the group code box selects the whole code so a new one replaces it
  run('Q084', () => { const el = document.getElementById('podCodeInput') as HTMLInputElement | null; if (el) el.addEventListener('focus', () => { try { el.select(); } catch { /* ignore */ } }); });
  // Q085: The phone browser bar matches the site background
  run('Q085', () => {
    if (!document.querySelector('meta[name="theme-color"]')) { const m = document.createElement('meta'); m.name = 'theme-color'; m.content = '#070b10'; document.head.appendChild(m); }
  });
  // Q086: Screen readers hear which page you moved to
  run('Q086', () => {
    const live = document.createElement('div'); live.id = 'fifs-view-announcer'; live.className = 'qol-sr-only'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); document.body.appendChild(live);
    let last = String(w.currentActiveView || 'home');
    new MutationObserver(() => { const v = String(w.currentActiveView || 'home'); if (v !== last) { last = v; live.textContent = (w.SECTION_TITLES && w.SECTION_TITLES[v]) || (v === 'home' ? 'Home' : v); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  });
  // Q077: Outside links always open safely (no access to the page that opened them)
  run('Q077', () => {
    $$<HTMLAnchorElement>('a[target="_blank"]').forEach((a) => { const r = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean); for (const t of ['noopener', 'noreferrer']) if (!r.includes(t)) r.push(t); a.setAttribute('rel', r.join(' ')); });
  });
  // Q080: The keyboard shows a Next key while filling the booking form
  run('Q080', () => {
    $$<HTMLInputElement>('#booking-form input[type="text"], #booking-form input[type="email"], #booking-form input[type="tel"]').forEach((i) => { if (!i.getAttribute('enterkeyhint')) i.setAttribute('enterkeyhint', 'next'); });
  });
  // Q087: Phone links read as "Call 443-990-1304" to screen readers
  run('Q087', () => {
    $$<HTMLAnchorElement>('a[href^="tel:"]').forEach((a) => { if (!a.getAttribute('aria-label')) a.setAttribute('aria-label', 'Call ' + (a.textContent || a.getAttribute('href') || '').replace(/^tel:/, '').trim()); });
  });
  // @@QOL_END
}
