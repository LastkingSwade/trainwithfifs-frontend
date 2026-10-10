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
  // Q088: Email links read as "Email info@..." to screen readers
  run('Q088', () => {
    $$<HTMLAnchorElement>('a[href^="mailto:"]').forEach((a) => { if (!a.getAttribute('aria-label')) a.setAttribute('aria-label', 'Email ' + (a.getAttribute('href') || '').replace(/^mailto:/, '').split('?')[0]); });
  });
  // Q089: Images with no description are marked decorative so screen readers skip them
  run('Q089', () => { $$<HTMLImageElement>('img:not([alt])').forEach((i) => i.setAttribute('alt', '')); });
  // Q090: All images decode off the main thread (smoother scrolling)
  run('Q090', () => { $$<HTMLImageElement>('img:not([decoding])').forEach((i) => i.setAttribute('decoding', 'async')); });
  // Q091: Icon-only buttons get a spoken name from their tooltip
  run('Q091', () => { $$('button').forEach((b) => { if (!b.getAttribute('aria-label') && !(b.textContent || '').trim() && b.getAttribute('title')) b.setAttribute('aria-label', b.getAttribute('title') || ''); }); });
  // Q092: Decorative emoji next to labels are hidden from screen readers
  run('Q092', () => { $$('.chip-icon, .pitch-icon, .ssp-cta').forEach((e) => e.setAttribute('aria-hidden', 'true')); });
  // Q093: Reading progress bar on the About, FAQ and Reviews pages (motion safe)
  run('Q093', () => {
    const bar = document.createElement('div'); bar.id = 'qol-read-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
    const reading = () => ['about', 'faq', 'testimonial'].includes(String(w.currentActiveView));
    let tick = false;
    const update = () => { tick = false; if (!reading()) { bar.style.opacity = '0'; return; } const max = document.documentElement.scrollHeight - window.innerHeight; bar.style.opacity = max > 200 ? '1' : '0'; bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0) + ')'; };
    window.addEventListener('scroll', () => { if (!tick) { tick = true; window.requestAnimationFrame(update); } }, { passive: true });
    new MutationObserver(update).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  });
  // Q094: Moving to a new page puts keyboard focus at its top so Tab starts there
  run('Q094', () => {
    let last = String(w.currentActiveView || 'home');
    new MutationObserver(() => { const v = String(w.currentActiveView || 'home'); if (v === last) return; last = v; const panel = document.getElementById('view-' + v); if (panel) { panel.setAttribute('tabindex', '-1'); try { (panel as HTMLElement).focus({ preventScroll: true }); } catch { /* ignore */ } } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  });
  // Q095: The booking form tells screen readers which fields are required
  run('Q095', () => { $$<HTMLInputElement>('#booking-form [required]').forEach((i) => i.setAttribute('aria-required', 'true')); });
  // Q096: Group code box says what it expects
  run('Q096', () => { const el = document.getElementById('podCodeInput'); if (el && !el.getAttribute('aria-describedby')) el.setAttribute('aria-describedby', 'podCodeStatus'); });
  // Q097: The chat bubble button has a spoken name
  run('Q097', () => { const p = document.getElementById('floatingCommPill'); if (p && !p.getAttribute('aria-label')) p.setAttribute('aria-label', 'Chat with Coach Kai Wade'); });
  // Q098: Pressing Enter on the chat bubble opens it (keyboard access)
  run('Q098', () => { const p = document.getElementById('floatingCommPill'); if (p) p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.click(); } }); });
  // Q099: Tables get column scope for screen readers
  run('Q099', () => { $$('table thead th').forEach((th) => { if (!th.getAttribute('scope')) th.setAttribute('scope', 'col'); }); });
  // Q100: Outside links tell screen readers they open a new tab
  run('Q100', () => { $$<HTMLAnchorElement>('a[target="_blank"]').forEach((a) => { const l = a.getAttribute('aria-label') || (a.textContent || '').trim(); if (l && !/new tab/i.test(l)) a.setAttribute('aria-label', l + ' (opens in a new tab)'); }); });
  // P091: Admin: tap an ID in the roster or clients table to copy it
  run('P091', () => {
    document.addEventListener('click', (e) => {
      const cell = (e.target as HTMLElement | null)?.closest?.('#admin-roster-tbody td:first-child, #admin-client-tbody td:first-child') as HTMLElement | null;
      if (!cell || !navigator.clipboard) return;
      const text = (cell.textContent || '').trim(); if (!text) return;
      navigator.clipboard.writeText(text).then(() => { cell.setAttribute('data-copied', '1'); window.setTimeout(() => cell.removeAttribute('data-copied'), 1400); }).catch(() => { /* copying is a convenience */ });
    });
    $$('#admin-roster-tbody, #admin-client-tbody').forEach((t) => t.setAttribute('title', 'Tap an ID to copy it'));
  });
  // P092: Admin: column headings in the roster and clients tables are announced as columns
  run('P092', () => { $$('.admin-roster-table th').forEach((th) => th.setAttribute('scope', 'col')); });
  // P093: Admin: Esc clears a search box and shows every row again
  run('P093', () => {
    for (const id of ['admin-roster-search', 'admin-client-search']) { document.addEventListener('keydown', (e) => { const el = document.getElementById(id) as HTMLInputElement | null; if (e.key === 'Escape' && el && document.activeElement === el && el.value) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); } }); }
  });
  // P094: Admin: the roster window puts the cursor in the search box on computers (not phones, so the keyboard does not pop up)
  run('P094', () => {
    const overlay = document.getElementById('adminSubpanelModalOverlay'); if (!overlay || !window.matchMedia('(pointer: fine)').matches) return;
    let was = false;
    new MutationObserver(() => { const now = getComputedStyle(overlay).display !== 'none'; if (now && !was) { const s = ['admin-roster-search', 'admin-client-search'].map((id) => document.getElementById(id) as HTMLInputElement | null).find((i) => i && i.offsetParent !== null); if (s) window.setTimeout(() => { try { s.focus({ preventScroll: true }); } catch { /* ignore */ } }, 80); } was = now; }).observe(overlay, { attributes: true, attributeFilter: ['class', 'style'] });
  });
  // P095: Student: checklist shows "2 of 4 done" as you tick boxes
  run('P095', () => {
    const list = document.querySelector('.interactive-checklist'); if (!list) return;
    const note = document.createElement('div'); note.id = 'qol-checklist-progress'; note.setAttribute('role', 'status'); note.setAttribute('aria-live', 'polite'); list.insertBefore(note, list.firstChild);
    const update = () => { const boxes = $$<HTMLInputElement>('.task-checkbox', list); const done = boxes.filter((b) => b.checked).length; const next = boxes.length ? done + ' of ' + boxes.length + ' done' : ''; if (note.textContent !== next) note.textContent = next; };
    list.addEventListener('change', update); new MutationObserver(update).observe(list, { subtree: true, childList: true, attributes: true, attributeFilter: ['checked'] }); update();
  });
  // P096: Student: tap your student ID to copy it
  run('P096', () => {
    const el = document.getElementById('dash-student-id'); if (!el || !navigator.clipboard) return;
    el.setAttribute('title', 'Tap to copy'); el.style.cursor = 'copy';
    el.addEventListener('click', () => { const t = (el.textContent || '').trim(); if (t) navigator.clipboard.writeText(t).then(() => { el.setAttribute('data-copied', '1'); window.setTimeout(() => el.removeAttribute('data-copied'), 1400); }).catch(() => { /* ignore */ }); });
  });
  // P097: Client: tap your client ID to copy it
  run('P097', () => {
    const el = document.getElementById('dash-client-id'); if (!el || !navigator.clipboard) return;
    el.setAttribute('title', 'Tap to copy'); el.style.cursor = 'copy';
    el.addEventListener('click', () => { const t = (el.textContent || '').trim(); if (t) navigator.clipboard.writeText(t).then(() => { el.setAttribute('data-copied', '1'); window.setTimeout(() => el.removeAttribute('data-copied'), 1400); }).catch(() => { /* ignore */ }); });
  });
  // P098: Client: days-left number turns green, amber or red (the number is still shown)
  run('P098', () => {
    const el = document.getElementById('wallet-days-left'); if (!el) return;
    const paint = () => { const n = parseInt((el.textContent || '').replace(/[^0-9-]/g, ''), 10); if (Number.isFinite(n)) el.setAttribute('data-urgency', n <= 30 ? 'urgent' : n <= 90 ? 'soon' : 'ok'); };
    new MutationObserver(paint).observe(el, { childList: true, characterData: true, subtree: true }); paint();
  });
  // P099: Admin: rows with an expired permit get a red edge as well as the text
  run('P099', () => {
    const tbody = document.getElementById('admin-client-tbody'); if (!tbody) return;
    const mark = () => { $$('tr', tbody).forEach((tr) => tr.classList.toggle('qol-row-expired', /Expired/i.test(tr.textContent || ''))); };
    new MutationObserver(mark).observe(tbody, { childList: true }); mark();
  });
  // P100: Admin: shows "Updated 3:42 PM" next to the Refresh button after the roster loads
  run('P100', () => {
    const tbody = document.getElementById('admin-roster-tbody'), btn = document.getElementById('btn-admin-refresh-data'); if (!tbody || !btn || !btn.parentElement) return;
    const stamp = document.createElement('span'); stamp.id = 'qol-updated-stamp'; stamp.setAttribute('role', 'status'); btn.parentElement.appendChild(stamp);
    new MutationObserver(() => { stamp.textContent = 'Updated ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }).observe(tbody, { childList: true });
  });
  // @@QOL_END
}
