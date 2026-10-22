// Student Portal: a "Your class" section made for the course THIS student booked (Standard or VIP). Every fact below is taken from the course
// descriptions already on the site (the course catalog), so nothing here is new or invented. Tiles open pop-ups. All text is set with textContent.
import { courseKeyFor } from '@/Lib/pricing';
import { CONTACT_EMAIL, CONTACT_PHONE } from '@/group/groupCopy';
import { BRING, EXPECT, GUIDE_DISCLAIMER, GUIDE_ITEMS, MAPS_URL, RANGE_CITY, RANGE_NAME } from './portalCopy';

const w: any = typeof window === 'undefined' ? {} : window;

export interface Sec { h?: string; p?: string; ul?: readonly string[]; link?: { text: string; href: string }; action?: { text: string; key: 'book' } }
export interface Tile { id: string; icon: string; title: string; blurb: string; secs: readonly Sec[] }
interface Course {
  key: string; name: string; badge: string; about: string; vipAbout: string; length?: string; covers: readonly string[];
  standardGear?: readonly string[]; vipProvides: readonly string[]; range: boolean; law: ReadonlyArray<'hql' | 'wc' | 'other'>; extra?: Tile;
}

const WC_PAGE = 'https://mdsp.maryland.gov/firearms-permits-professional-licenses/wear-carry-permit';
const RANGE_FEE = "Cindy's Hot Shots range fee ($45 value)";
const OWN_GEAR = ['Your own handgun', 'A holster', '50 rounds of factory ammunition'] as const;

export const COURSES: Record<string, Course> = {
  mastery: {
    key: 'mastery', name: 'Mid-Atlantic Multi-State Mastery', badge: '5-STATE EXPANSION (MD+VA+FL+AZ+PA) — RECIPROCITY CHECKED STATE BY STATE',
    about: 'Full 16-hour Maryland Wear & Carry qualification + application dossiers for Virginia, Florida, Arizona, and Pennsylvania (reciprocity checked state by state). Self-equipped track: bring own firearm and ammo.',
    vipAbout: 'All-Inclusive VIP Concierge. 5-state application packets, Livescan fingerprint guidance, priority range lane, loaner firearm, ammunition, photo compliance passport prints, and full notary certification included.',
    length: '16 hours (the Maryland Wear & Carry qualification)',
    covers: ['The full 16-hour Maryland Wear & Carry qualification', 'Application dossiers for Virginia, Florida, Arizona and Pennsylvania', 'Reciprocity checked state by state, not a blanket claim'],
    standardGear: ['Your own firearm', 'Your own ammunition'],
    vipProvides: ['5-state application packets', 'Livescan fingerprint guidance', 'Priority range lane', 'A loaner firearm', 'Ammunition', 'Photo compliance passport prints', 'Full notary certification'],
    range: true, law: ['wc', 'other'],
  },
  combo: {
    key: 'combo', name: 'Maryland CCW & HQL Combo Certification', badge: 'DUAL CERTIFICATION: CONCEALED CARRY + HANDGUN PURCHASE PERMIT',
    about: 'Comprehensive dual-licensing package meeting both purchase and carry requirements under Maryland law (MSP PS § 5-306 & § 5-117.1). Self-equipped track: provide own handgun, holster, and 50 rounds ammo. Range fee ($45.00) & 6% tax calculated at checkout.',
    vipAbout: "VIP Concierge. Cindy's Hot Shots range fee ($45 value) is 100% included. Includes B-27 qualification targets, loaner 9mm handgun, 50 rounds factory ammunition, holster, eye/ear pro, and on-site passport compliance photos.",
    covers: ['Both the purchase (HQL) and carry (Wear & Carry) requirements under Maryland law', 'MSP PS § 5-306 and § 5-117.1'],
    standardGear: OWN_GEAR,
    vipProvides: [RANGE_FEE, 'B-27 qualification targets', 'A loaner 9mm handgun', '50 rounds of factory ammunition', 'A holster', 'Eye and ear protection', 'On-site passport compliance photos'],
    range: true, law: ['hql', 'wc', 'other'],
  },
  ccw: {
    key: 'ccw', name: 'Maryland Wear & Carry (CCW) Initial Course', badge: 'MARYLAND STATE POLICE CERTIFIED 16-HOUR INITIAL CCW',
    about: 'Full 16-Hour Maryland Wear & Carry certification. In-depth legal curriculum (State v. Faulkner, SB 1), weapon mechanics, and 25-round MSP qualification course. Self-equipped track: bring own handgun, holster, and 50 rounds.',
    vipAbout: "VIP Concierge. Cindy's Hot Shots range fee ($45 value) is 100% included. Everything provided: loaner 9mm firearm, holster, eye/ear protection, 50 rounds factory ammunition, targets, and passport compliance photos.",
    length: '16 hours',
    covers: ['In-depth legal curriculum (State v. Faulkner, SB 1)', 'Weapon mechanics', 'The 25-round MSP qualification course'],
    standardGear: OWN_GEAR,
    vipProvides: [RANGE_FEE, 'A loaner 9mm firearm', 'A holster', 'Eye and ear protection', '50 rounds of factory ammunition', 'Targets', 'Passport compliance photos'],
    range: true, law: ['wc', 'other'],
  },
  renewal: {
    key: 'renewal', name: 'Maryland Wear & Carry (8-Hour Renewal)', badge: '8-HOUR MARYLAND STATE POLICE RECERTIFICATION',
    about: "State-mandated 8-hour classroom recertification + 25-round MSP live-fire qualification at Cindy's Hot Shots. Self-equipped track: bring your own handgun, holster, and 50 rounds factory ammo.",
    vipAbout: "VIP Recertification. Cindy's Hot Shots range fee ($45 value) is 100% included. Includes B-27 qualification targets, loaner 9mm handgun, 50 rounds factory ammunition & MSP portal submission assistance.",
    length: '8 hours',
    covers: ['The state-mandated 8-hour classroom recertification', "The 25-round MSP live-fire qualification at Cindy's Hot Shots"],
    standardGear: OWN_GEAR,
    vipProvides: [RANGE_FEE, 'B-27 qualification targets', 'A loaner 9mm handgun', '50 rounds of factory ammunition', 'MSP portal submission assistance'],
    range: true, law: ['wc'],
  },
  hql: {
    key: 'hql', name: 'Maryland Handgun Qualification License (HQL)', badge: 'MARYLAND HANDGUN PURCHASE PERMIT MANDATORY TRAINING',
    about: 'State prerequisite for handgun purchase under MD Public Safety § 5-117.1. Covers firearm safety, mechanics, safe storage, and live-fire component. Self-equipped base track.',
    vipAbout: 'VIP HQL Experience. Range fee, loaner handgun, 50 rounds ammunition, eye/ear protection, and hands-on application submission assistance through the Maryland State Police licensing portal.',
    covers: ['Firearm safety', 'Mechanics', 'Safe storage', 'The live-fire component'],
    vipProvides: ['The range fee', 'A loaner handgun', '50 rounds of ammunition', 'Eye and ear protection', 'Hands-on application submission assistance through the Maryland State Police licensing portal'],
    range: true, law: ['hql'],
  },
  coaching: {
    key: 'coaching', name: 'Personal 1-on-1 Private Firearms Coaching', badge: 'DEDICATED 1-ON-1 INSTRUCTOR TIME & MARKSMANSHIP TARGETING',
    about: 'Dedicated private coaching. Diagnostic marksmanship, trigger press refinement, draw-stroke economy, malfunction drills, and stress inoculation drills with Lead Instructor Kai Wade.',
    vipAbout: 'VIP Private Masterclass. Multi-caliber handgun rentals (9mm & .45 ACP), 100 rounds match ammunition, high-speed video diagnostics, and customized tactical home defense action plan.',
    covers: ['Diagnostic marksmanship', 'Trigger press refinement', 'Draw-stroke economy', 'Malfunction drills', 'Stress inoculation drills with Lead Instructor Kai Wade'],
    vipProvides: ['Multi-caliber handgun rentals (9mm and .45 ACP)', '100 rounds of match ammunition', 'High-speed video diagnostics', 'A customized tactical home defense action plan'],
    range: false, law: [],
  },
  cleaning: {
    key: 'cleaning', name: 'Firearm Maintenance & Deep Cleaning Workshop', badge: 'FIELD-STRIP, CLEANING CHEMICAL SAFETY & PROPER LUBRICATION',
    about: 'Field-stripping, ultrasonic inspection methods, lubrication points, carbon fouling removal, and proper long-term storage preservation techniques for modern semi-automatic handguns.',
    vipAbout: 'VIP Armorer Service. Professional ultrasonic deep-clean tank soak, bore scoping, sear engagement safety inspection, spring tension testing, and premium Lucas Oil extreme-duty lubricant treatment.',
    covers: ['Field-stripping', 'Ultrasonic inspection methods', 'Lubrication points', 'Carbon fouling removal', 'Proper long-term storage preservation techniques for modern semi-automatic handguns'],
    vipProvides: ['A professional ultrasonic deep-clean tank soak', 'Bore scoping', 'Sear engagement safety inspection', 'Spring tension testing', 'Premium Lucas Oil extreme-duty lubricant treatment'],
    range: false, law: [],
  },
  children: {
    key: 'children', name: 'Youth & Family Gun Safety Academy', badge: 'ACCIDENT PREVENTION, EDDIE EAGLE PROTOCOL & RANGE DISCIPLINE',
    about: 'Comprehensive youth accident prevention and family home defense. Eddie Eagle 4-step emergency protocol: Stop, Don\'t Touch, Run Away, Tell an Adult. Safe storage principles and stress-free range introduction.',
    vipAbout: 'VIP Family Safety Bundle. Includes certified biometric rapid-access steel lockbox, youth ear/eye protection kit, private instructor range lane, and hands-on home safety emergency plan.',
    covers: ['Youth accident prevention and family home defense', "The Eddie Eagle 4-step emergency protocol", 'Safe storage principles', 'A stress-free range introduction'],
    vipProvides: ['A certified biometric rapid-access steel lockbox', 'A youth ear and eye protection kit', 'A private instructor range lane', 'A hands-on home safety emergency plan'],
    range: false, law: [],
    extra: { id: 'eddie', icon: '🦅', title: 'The 4 steps kids learn', blurb: 'The Eddie Eagle emergency protocol', secs: [
      { p: 'If a child ever finds a firearm, the steps are the same every time:' },
      { ul: ['Stop.', "Don't touch.", 'Run away.', 'Tell an adult.'] },
      { p: 'Practice saying them out loud together at home. Kai will go over them in class.' },
    ] },
  },
  alumni: {
    key: 'alumni', name: 'FIFS Graduate Alumni Tactical Marksman Clinic', badge: 'EXCLUSIVELY FOR FIFS GRADUATES — ADVANCED DRILLS & SPEED',
    about: 'Designed exclusively for Wear & Carry graduates and permit holders. Rapid holster presentation, multiple threat transitions, reload speed drills, and cover/concealment movement.',
    vipAbout: 'VIP Alumni Shootout. Includes 100 rounds match ammunition, low-light weapon mounted light (WML) scenario drills, steel target plate challenge, and computerized split-time scoring.',
    covers: ['Rapid holster presentation', 'Multiple threat transitions', 'Reload speed drills', 'Cover and concealment movement'],
    vipProvides: ['100 rounds of match ammunition', 'Low-light weapon mounted light (WML) scenario drills', 'A steel target plate challenge', 'Computerized split-time scoring'],
    range: true, law: [],
  },
};

export interface CourseView { key: string; name: string; vip: boolean; badge: string; tiles: Tile[] }

const guide = (title: string) => GUIDE_ITEMS.find((g) => g.title === title);
const lawSecs = (c: Course): Sec[] => {
  const out: Sec[] = [{ p: GUIDE_DISCLAIMER }];
  const add = (title: string) => { const g = guide(title); if (g) out.push({ h: g.title, p: g.body }, { link: { text: g.link + ' (opens the official page)', href: g.href } }); };
  if (c.law.includes('hql')) add('Handgun Qualification License (HQL)');
  if (c.law.includes('wc')) add('Wear and Carry permit');
  if (c.law.includes('other')) add('Other states');
  return out;
};

// Which course and tier a booking text means. null when we cannot tell (the section is then simply not shown).
export function buildCourseView(courseText: unknown): CourseView | null {
  const text = String(courseText || '').trim();
  const key = courseKeyFor(text);
  const c = key ? COURSES[key] : null;
  if (!c) return null;
  const vip = /vip/i.test(text);
  const tiles: Tile[] = [];
  tiles.push({ id: 'covers', icon: '📘', title: 'What your class covers', blurb: vip ? 'Topics and your VIP extras' : 'Topics, start to finish', secs: [
    { p: vip ? c.vipAbout : c.about }, { h: 'Topics', ul: c.covers }, ...(c.length ? [{ h: 'Length', p: c.length }] : []),
  ] });
  const bring: Sec[] = [];
  if (vip) bring.push({ h: 'Included with VIP', ul: c.vipProvides }, { h: 'Still bring', ul: ['Government photo ID', 'A notebook or phone for notes'] });
  else if (c.range && c.standardGear) bring.push({ h: 'Your gear (standard track)', ul: c.standardGear }, { h: 'Also bring', ul: BRING.filter((b) => !/ammunition/i.test(b)) });
  else if (c.range) bring.push({ h: 'Bring', ul: BRING });
  else bring.push({ p: 'Kai will confirm exactly what to bring for this class before it starts. Not sure? Ask. There are no wrong questions.' }, { p: `Call ${CONTACT_PHONE} or email ${CONTACT_EMAIL}.` });
  tiles.push({ id: 'bring', icon: '🎒', title: 'What to bring', blurb: vip ? 'Mostly provided for you' : 'Your checklist', secs: bring });
  if (c.range) tiles.push({ id: 'day', icon: '🗓️', title: 'Your class day', blurb: 'What happens, in order', secs: [
    { ul: EXPECT }, { link: { text: `Directions to ${RANGE_NAME}, ${RANGE_CITY}`, href: MAPS_URL } },
  ] });
  if (c.law.length) tiles.push({ id: 'law', icon: '⚖️', title: 'Law and paperwork', blurb: 'What Maryland asks of you', secs: lawSecs(c) });
  if (c.extra) tiles.push(c.extra);
  if (c.law.includes('wc')) tiles.push({ id: 'after', icon: '✅', title: 'After your class', blurb: 'Your score sheet and next steps', secs: [
    { p: 'When Kai saves your qualification score sheet, it appears on this page in the Score Sheet card, and you can open or download it.' },
    { p: 'The Maryland State Police asks for a score sheet with a Wear and Carry application, along with fingerprints. Always confirm the current steps on the official page.' },
    { link: { text: 'MSP: Wear & Carry Permit (opens the official page)', href: WC_PAGE } },
  ] });
  else tiles.push({ id: 'next', icon: '➕', title: 'Keep learning', blurb: 'Book your next class', secs: [
    { p: 'Ready for more? Your next booking takes about a minute.' }, { action: { text: 'Book another class', key: 'book' } },
  ] });
  return { key: c.key, name: c.name, vip, badge: c.badge, tiles };
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }
const safeHttps = (u: string): string => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };

function openTile(view: CourseView, t: Tile, opener: HTMLElement): void {
  const ov = el('div', undefined, 'cc-overlay'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'cc-title-' + t.id);
  const card = el('div', undefined, 'cc-card');
  const head = el('div', undefined, 'cc-card-head');
  const h = el('h3', t.icon + ' ' + t.title); h.id = 'cc-title-' + t.id;
  const x = el('button', 'Close', 'cc-close'); x.type = 'button'; x.setAttribute('aria-label', 'Close ' + t.title);
  head.append(h, x); card.appendChild(head);
  card.appendChild(el('p', view.name + (view.vip ? ' · VIP' : ' · Standard'), 'cc-sub'));
  for (const s of t.secs) {
    if (s.h) card.appendChild(el('h4', s.h));
    if (s.p) card.appendChild(el('p', s.p));
    if (s.ul) { const ul = el('ul'); for (const i of s.ul) ul.appendChild(el('li', i)); card.appendChild(ul); }
    if (s.link) { const href = safeHttps(s.link.href); if (href) { const a = el('a', s.link.text, 'cc-link'); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; card.appendChild(a); } }
    if (s.action) { const b = el('button', s.action.text, 'cc-link'); b.type = 'button'; b.addEventListener('click', () => { close(); w.openAndSwitch?.('booking'); }); card.appendChild(b); }
  }
  ov.appendChild(card); document.body.appendChild(ov); document.body.classList.add('modal-open');
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = Array.from(card.querySelectorAll<HTMLElement>('button, a[href]')); if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  function close(): void { document.removeEventListener('keydown', onKey, true); ov.remove(); document.body.classList.remove('modal-open'); try { opener.focus(); } catch { /* ignore */ } }
  document.addEventListener('keydown', onKey, true);
  x.addEventListener('click', close); ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  x.focus();
}

export function courseSection(): HTMLElement | null {
  const rec = w.__fifsStudentPortalRecord;
  const view = buildCourseView((rec && rec.course) || document.getElementById('dash-student-course')?.textContent || '');
  if (!view) return null;
  const sec = el('section', undefined, 'cc-section'); sec.setAttribute('aria-labelledby', 'cc-heading');
  const h = el('h3', 'Your class: ' + view.name); h.id = 'cc-heading'; sec.appendChild(h);
  const meta = el('p', undefined, 'cc-meta'); meta.append(el('span', view.vip ? '👑 VIP' : 'Standard', 'cc-chip'), document.createTextNode(' ' + view.badge)); sec.appendChild(meta);
  sec.appendChild(el('p', 'Tap a card to see what applies to your class.', 'cc-hint'));
  const grid = el('div', undefined, 'cc-grid');
  for (const t of view.tiles) {
    const b = el('button', undefined, 'cc-tile'); b.type = 'button'; b.setAttribute('aria-haspopup', 'dialog');
    b.append(el('span', t.icon, 'cc-ico'), el('span', t.title, 'cc-t'), el('span', t.blurb, 'cc-b'));
    b.addEventListener('click', () => openTile(view, t, b)); grid.appendChild(b);
  }
  sec.appendChild(grid);
  return sec;
}
