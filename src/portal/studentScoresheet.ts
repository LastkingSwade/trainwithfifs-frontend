// Student Portal: fills the "Maryland Certified Qualification Scoresheet" card with THIS student's own sheet. The server finds the student from the
// signed-in login (nothing here sends an id), returns a 5-minute link only for a file in that student's own folder, and no staff details.
// Text is set with textContent; links are accepted only when they are https.
const w: any = typeof window === 'undefined' ? {} : window;
interface Sheet { score: string; passed: boolean | null; result: string | null; qualificationDate: string | null; hasFile: boolean; fileUrl: string | null; fileKind: 'pdf' | 'image' | null }

export const safeHttps = (u: unknown): string => { try { const x = new URL(String(u)); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };
export function badgeText(s: Pick<Sheet, 'score' | 'result'>): string {
  const label = s.result === 'pass' ? 'PASSED' : s.result === 'fail' ? 'NOT PASSED' : 'PENDING';
  return s.score ? `${label} • ${s.score}` : label;
}

export function paintScoresheet(s: Sheet | null): void {
  const byId = (id: string) => document.getElementById(id) as HTMLElement | null;
  const pending = byId('dash-scoresheet-pending'), active = byId('dash-scoresheet-active'), badge = byId('dash-scoresheet-score-badge');
  const full = byId('dash-scoresheet-fullscreen-btn') as HTMLAnchorElement | null, down = byId('dash-scoresheet-download-btn') as HTMLAnchorElement | null;
  const url = s && s.hasFile ? safeHttps(s.fileUrl) : '';
  if (badge) {
    if (s && s.score) { badge.textContent = badgeText(s); badge.style.display = 'inline-block'; } else { badge.style.display = 'none'; }
  }
  if (pending) pending.style.display = url ? 'none' : 'block';
  if (active) active.style.display = url ? 'block' : 'none';
  if (full && down) {
    if (url) { full.href = url; down.href = url; down.setAttribute('download', 'MSP-Form-29-14-Qualification-Scoresheet.' + (s && s.fileKind === 'pdf' ? 'pdf' : 'png')); }
    else { full.removeAttribute('href'); down.removeAttribute('href'); }
  }
}

export function installStudentScoresheet(): void {
  if (w.__fifsStudentSheetInstalled) return;
  w.__fifsStudentSheetInstalled = true;
  let busy = false, shown = false;
  const refresh = async () => {
    const dash = document.getElementById('student-active-dashboard');
    if (!dash || busy || dash.classList.contains('hidden') || dash.hidden || getComputedStyle(dash).display === 'none') { if (dash && (dash.classList.contains('hidden') || getComputedStyle(dash).display === 'none')) shown = false; return; }
    if (shown) return;
    busy = true;
    try { const d = await w.callFifsBackend('studentScoresheet', {}); paintScoresheet((d && d.scoresheet) || null); shown = true; } catch { paintScoresheet(null); }
    busy = false;
  };
  const dash = document.getElementById('student-active-dashboard');
  if (dash) new MutationObserver(refresh).observe(dash, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  refresh();
}
