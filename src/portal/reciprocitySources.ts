// Reciprocity Hub: shows where a state's information came from and when it was last reviewed, next to the figures the hub already shows. The hub's numbers and rules are
// unchanged. A state shows an official link only once one has been added here and checked; every other state says so plainly instead of implying it was verified.
const w: any = typeof window === 'undefined' ? {} : window;

/** The day (YYYY-MM-DD) the whole table was last checked against official sources. Leave null until it has been: the hub then shows no review date. */
export const RECIPROCITY_REVIEWED_ON: string | null = null;

export interface Source { label: string; url: string; reviewedOn?: string }
/** Official sources, by state code. Add a state only after opening the page and confirming it is the official source for that rule. */
export const OFFICIAL_SOURCES: Record<string, Source> = {
  MD: { label: 'Maryland State Police: Wear & Carry permit', url: 'https://mdsp.maryland.gov/firearms-permits-professional-licenses/wear-carry-permit' },
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
