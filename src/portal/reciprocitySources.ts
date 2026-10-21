// Reciprocity Hub: shows where a state's information came from and when it was last reviewed, next to the figures the hub already shows. The hub's numbers and rules are
// unchanged. A state shows an official link only once one has been added here and checked; every other state says so plainly instead of implying it was verified.
const w: any = typeof window === 'undefined' ? {} : window;

/** The day (YYYY-MM-DD) the whole table was last checked against official sources. Leave null until it has been: the hub then shows no review date. */
export const RECIPROCITY_REVIEWED_ON: string | null = null;

export interface Source { label: string; url: string; reviewedOn?: string }
/** Official sources, by state code. Add a state only after opening the page and confirming it is the official source for that rule. Each link below was opened and its page title read.
 *  Not listed yet: Hawaii and Oregon (no official page found), and Kansas, Massachusetts, Montana, New Hampshire, Rhode Island and Vermont (their sites refuse automated checks, so they are added once someone has opened them). */
export const OFFICIAL_SOURCES: Record<string, Source> = {
  MD: { label: 'Maryland State Police: Wear & Carry permit', url: 'https://mdsp.maryland.gov/firearms-permits-professional-licenses/wear-carry-permit' },
  AL: { label: 'Alabama Law Enforcement Agency: Gun laws', url: 'https://www.alea.gov/gun-laws' },
  AK: { label: 'Alaska Dept. of Public Safety: Concealed handgun permits', url: 'https://dps.alaska.gov/statewide/concealed-handgun-permits/' },
  AZ: { label: 'Arizona Dept. of Public Safety: Concealed weapons and permits', url: 'https://www.azdps.gov/services/public-services-center/concealed-weapons-and-permits' },
  AR: { label: 'Arkansas State Police: Concealed handgun carry licensing', url: 'https://dps.arkansas.gov/law-enforcement/arkansas-state-police/services-programs/concealed-handgun-carry-licensing/' },
  CA: { label: 'California Attorney General: Firearms FAQ', url: 'https://oag.ca.gov/firearms/pubfaqs' },
  CO: { label: 'Colorado Bureau of Investigation: CHP reciprocity', url: 'https://cbi.colorado.gov/firearms/concealed-handgun-permit-chp-reciprocity' },
  CT: { label: 'Connecticut State Police: State pistol permit', url: 'https://portal.ct.gov/despp/division-of-state-police/special-licensing-and-firearms/state-pistol-permit' },
  DE: { label: 'Delaware Dept. of Justice: Concealed deadly weapons reciprocity', url: 'https://attorneygeneral.delaware.gov/criminal/concealedweapons.shtml' },
  DC: { label: 'DC Metropolitan Police: Firearms registration and CCL FAQ', url: 'https://mpdc.dc.gov/page/frequently-asked-questions-firearms-registration-and-ccl' },
  FL: { label: 'Florida Dept. of Agriculture and Consumer Services: Concealed weapon license reciprocity', url: 'https://www.fdacs.gov/Consumer-Resources/Concealed-Weapon-License/Concealed-Weapon-License-Reciprocity' },
  GA: { label: 'Georgia Attorney General: States which recognize a Georgia weapons carry license', url: 'https://law.georgia.gov/resources/states-which-recognize-georgia-weapons-carry-license' },
  ID: { label: 'Idaho Attorney General: Concealed weapons', url: 'https://www.ag.idaho.gov/office-resources/concealed-weapons/' },
  IL: { label: 'Illinois State Police: Concealed carry license', url: 'https://isp.illinois.gov/Foid/Ccl' },
  IN: { label: 'Indiana State Police: Firearms licensing', url: 'https://www.in.gov/isp/firearms-licensing/' },
  IA: { label: 'Iowa Dept. of Public Safety: Weapon permits FAQ', url: 'https://dps.iowa.gov/weapon-permits-frequently-asked-questions' },
  KY: { label: 'Kentucky State Police: CCDW reciprocity', url: 'https://wp.kentuckystatepolice.ky.gov/ccdw/ccdw-home/ccdw-reciprocity/' },
  LA: { label: 'Louisiana State Police: Concealed handgun reciprocity', url: 'https://lsp.org/services/concealed-handgun-information/reciprocity/' },
  ME: { label: 'Maine State Police: Concealed carry in Maine', url: 'https://www.maine.gov/dps/msp/licenses-permits/concealed-carry-maine' },
  MI: { label: 'Michigan State Police: CCW reciprocity', url: 'https://www.michigan.gov/msp/services/ccw/reciprocity' },
  MN: { label: 'Minnesota Dept. of Public Safety: Permit to carry reciprocity', url: 'https://dps.mn.gov/divisions/bca/public-services/firearms-information/permit-carry-reciprocity' },
  MS: { label: 'Mississippi Dept. of Public Safety: Reciprocity FAQ', url: 'https://www.driverservicebureau.dps.ms.gov/node/51' },
  MO: { label: 'Missouri Attorney General: Concealed carry reciprocity', url: 'https://ago.mo.gov/get-help/programs-services-from-a-z/concealed-carry-reciprocity/' },
  NE: { label: 'Nebraska State Patrol: Reciprocity', url: 'https://statepatrol.nebraska.gov/services/concealed-handgun-permits/nebraska-reciprocity' },
  NV: { label: 'Nevada Records, Communications and Compliance Division: Out-of-state CCW recognition', url: 'https://www.rccd.nv.gov/fees-forms/point-of-contact-firearms-program-information/out-of-state-ccw-recognition/' },
  NJ: { label: 'New Jersey State Police: Concealed carry facts and FAQs', url: 'https://njsp.njoag.gov/concealed-carry-facts-faqs/' },
  NM: { label: 'New Mexico Dept. of Public Safety: Concealed carry licenses', url: 'https://www.dps.nm.gov/law-enforcement-records-bureau/concealed-carry-licenses/' },
  NY: { label: 'New York Gun Safety: Concealed carry law FAQ', url: 'https://gunsafety.ny.gov/frequently-asked-questions-new-concealed-carry-law' },
  NC: { label: 'North Carolina Dept. of Justice: Concealed weapon reciprocity', url: 'https://ncdoj.gov/law-enforcement-training/law-enforcement-liason/concealed-weapon-reciprocity/' },
  ND: { label: 'North Dakota Attorney General: Reciprocity with other states', url: 'https://attorneygeneral.nd.gov/public-safety/concealed-weapon-licenses-2/reciprocity-with-other-states/' },
  OH: { label: 'Ohio Revised Code 109.69: Concealed handgun license reciprocity', url: 'https://codes.ohio.gov/ohio-revised-code/section-109.69' },
  OK: { label: 'Oklahoma State Bureau of Investigation: Handgun reciprocity states', url: 'https://osbi.ok.gov/pages/oklahoma-handgun-reciprocity-states' },
  PA: { label: 'Pennsylvania Attorney General: Reciprocity overview', url: 'https://www.attorneygeneral.gov/for-the-public/concealed-carry-reciprocity/' },
  SC: { label: 'South Carolina Law Enforcement Division: Concealed weapons permit', url: 'https://www.sled.sc.gov/concealed-weapons-permit' },
  SD: { label: 'South Dakota Secretary of State: Concealed pistol permits FAQ', url: 'https://www.sdsos.gov/general-services/concealed-pistol-permits/cc-faqs.aspx' },
  TN: { label: 'Tennessee Dept. of Safety: Handgun reciprocity', url: 'https://www.tn.gov/safety/tnhp/handgun/reciprocity.html' },
  TX: { label: 'Texas Dept. of Public Safety: Reciprocity FAQs', url: 'https://www.dps.texas.gov/section/handgun-licensing/faq/reciprocity-faqs' },
  UT: { label: 'Utah Bureau of Criminal Identification: Reciprocity with other states', url: 'https://bci.utah.gov/concealed-firearm/reciprocity-with-other-states/' },
  VA: { label: 'Virginia State Police: Reciprocity and recognition', url: 'https://vsp.virginia.gov/services/firearms/reciprocity-and-recognition/' },
  WA: { label: 'Washington Attorney General: Concealed pistol license reciprocity', url: 'https://www.atg.wa.gov/concealed-pistol-license-reciprocity' },
  WV: { label: 'West Virginia Code 61-7-6A: Reciprocity', url: 'https://code.wvlegislature.gov/61-7-6A/' },
  WI: { label: 'Wisconsin Dept. of Justice: CCW reciprocity', url: 'https://www.wisdoj.gov/Pages/PublicSafety/concealed-carry-weapon-reciprocity.aspx' },
  WY: { label: 'Wyoming Division of Criminal Investigation: Concealed firearm permits FAQ', url: 'https://wyomingdci.wyo.gov/criminal-justice-information-services-cjis/concealed-firearm-permits/cfp-faq' },
};

/** Only a plain https link is ever shown as a link. */
export const safeUrl = (u: unknown): string | null => { try { const x = new URL(String(u)); return x.protocol === 'https:' ? x.toString() : null; } catch { return null; } };
export const prettyDay = (d: string): string => { const t = new Date(d + 'T12:00:00Z'); return Number.isNaN(t.getTime()) ? '' : t.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }); };

export interface SourceLine { text: string; label?: string; url?: string }
export function sourceLine(code: string, sources: Record<string, Source> = OFFICIAL_SOURCES, tableReviewedOn: string | null = RECIPROCITY_REVIEWED_ON): SourceLine {
  const s = sources[String(code || '').toUpperCase()]; const url = s ? safeUrl(s.url) : null;
  const when = s?.reviewedOn || tableReviewedOn; const day = when ? prettyDay(when) : '';
  if (s && url) return { text: day ? `Last reviewed ${day}. Confirm with the official source before you rely on it.` : 'Confirm with the official source before you rely on it.', label: s.label, url };
  return { text: 'An official source link has not been added for this state yet. Confirm this with the state\'s official website before you rely on it.' };
}
export const hubNotice = (tableReviewedOn: string | null = RECIPROCITY_REVIEWED_ON): string =>
  'Carry rules and permit recognition change often and depend on your permit type, residency and age. This hub is a general guide, not legal advice.' + (tableReviewedOn && prettyDay(tableReviewedOn) ? ` Table last reviewed ${prettyDay(tableReviewedOn)}.` : '') + ' Always confirm with the state\'s official source before you travel armed.';

function box(code: string): HTMLElement {
  const line = sourceLine(code); const b = document.createElement('div'); b.id = 'dossierSourceBox'; b.setAttribute('role', 'note');
  b.style.cssText = 'margin-top:12px;padding:10px 12px;border-radius:10px;border:1px solid #ffb703;background:rgba(255,183,3,0.08);color:#e6edf5;font-size:0.9rem;line-height:1.45';
  const h = document.createElement('strong'); h.textContent = '📎 Source & review'; h.style.cssText = 'display:block;color:#ffb703;margin-bottom:4px'; b.append(h);
  const p = document.createElement('div'); p.textContent = line.text; b.append(p);
  if (line.url && line.label) { const a = document.createElement('a'); a.href = line.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = '🔗 ' + line.label + ' ↗'; a.style.cssText = 'display:inline-flex;align-items:center;min-height:44px;margin-top:4px;color:#00e5ff;font-weight:700'; b.append(a); }
  return b;
}

export function installReciprocitySources(): void {
  if (typeof document === 'undefined' || w.__fifsReciprocitySources) return;
  const orig = w.openStateDossier; if (typeof orig !== 'function') return;
  w.__fifsReciprocitySources = true;
  w.openStateDossier = function (code: string, ...rest: any[]) {
    const out = orig.call(this, code, ...rest);
    try { const notes = document.getElementById('dossierNotesVal'); const host = notes && notes.parentElement; if (host) { host.querySelectorAll('#dossierSourceBox').forEach((n) => n.remove()); host.append(box(String(code))); } } catch { /* the dossier itself must never break */ }
    return out;
  };
  // One hub-wide reminder under the hub's header.
  try {
    const wrap = document.querySelector('.reciprocity-app-wrapper');
    if (wrap && !document.getElementById('reciprocityNotice')) {
      const n = document.createElement('p'); n.id = 'reciprocityNotice'; n.setAttribute('role', 'note'); n.textContent = '⚖️ ' + hubNotice();
      n.style.cssText = 'margin:0 0 12px;padding:10px 12px;border-radius:10px;border:1px solid #ffb703;background:rgba(255,183,3,0.08);color:#ffd166;font-size:0.88rem;line-height:1.45';
      const header = wrap.querySelector('header'); wrap.insertBefore(n, header ? header.nextSibling : wrap.firstChild);
    }
  } catch { /* optional */ }
}
