// Pure helpers for the Document Vault (kept apart from the screen so they can be tested on their own). No file contents are ever handled here.
export interface VaultDoc { id: string; kind: string; kindLabel: string; mime: string; sizeBytes: number; expiresOn: string | null; createdAt: string }
export type VaultTab = 'all' | 'certificates' | 'permits' | 'other';
export const TABS: ReadonlyArray<{ key: VaultTab; label: string }> = [
  { key: 'all', label: 'All documents' }, { key: 'certificates', label: 'Certificates' }, { key: 'permits', label: 'Permits' }, { key: 'other', label: 'Other records' },
];
// Which tab a stored document type belongs to. Class certificates and HQL approvals are certificates; the permit card is a permit; anything else is "other".
export function tabOf(kind: string): Exclude<VaultTab, 'all'> { return kind === 'class_certificate' || kind === 'hql_approval' ? 'certificates' : kind === 'permit_card' ? 'permits' : 'other'; }
export function counts(docs: readonly VaultDoc[]): Record<VaultTab, number> { const c: Record<VaultTab, number> = { all: docs.length, certificates: 0, permits: 0, other: 0 }; for (const d of docs) c[tabOf(d.kind)] += 1; return c; }
export function filterDocs(docs: readonly VaultDoc[], tab: VaultTab, query: string): VaultDoc[] {
  const q = String(query || '').trim().toLowerCase().slice(0, 60);
  return docs.filter((d) => (tab === 'all' || tabOf(d.kind) === tab) && (!q || `${d.kindLabel} ${prettyDate(d.createdAt)} ${d.expiresOn ? prettyDate(d.expiresOn) : ''}`.toLowerCase().includes(q)));
}
export function prettyDate(iso: string | null | undefined): string {
  const s = String(iso || ''); if (!s) return ''; const t = Date.parse(s.length === 10 ? s + 'T12:00:00Z' : s); if (!Number.isFinite(t)) return '';
  return new Date(t).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
}
export type ExpiryState = { state: 'none' | 'ok' | 'soon' | 'expired'; days: number | null; text: string };
// "Soon" means within 90 days, the same window the renewal reminders use.
export function expiryState(expiresOn: string | null | undefined, now: Date = new Date()): ExpiryState {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(expiresOn || '')); if (!m) return { state: 'none', days: null, text: '' };
  const t = Date.parse(m[1] + 'T12:00:00Z'); if (!Number.isFinite(t)) return { state: 'none', days: null, text: '' };
  const days = Math.round((t - (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + 12 * 3600000)) / 86400000);
  if (days < 0) return { state: 'expired', days, text: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago` };
  if (days === 0) return { state: 'soon', days, text: 'Expires today' };
  if (days <= 90) return { state: 'soon', days, text: `Expires in ${days} day${days === 1 ? '' : 's'}` };
  return { state: 'ok', days, text: `Expires ${prettyDate(m[1])}` };
}
export function recent(docs: readonly VaultDoc[], n = 3): VaultDoc[] { return docs.slice().sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)).slice(0, n); }
export const sizeText = (n: number) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
// The name shown for a document: its type (no free-text titles exist, so no one can type private details into one).
export const docTitle = (d: Pick<VaultDoc, 'kindLabel'>) => d.kindLabel;
// The small picture on each card: a different look per type, using only the type (never the file).
export const artFor = (kind: string): { label: string; seal: boolean } => kind === 'permit_card' ? { label: 'PERMIT CARD', seal: false } : kind === 'class_certificate' ? { label: 'CERTIFICATE', seal: true } : kind === 'hql_approval' ? { label: 'HQL APPROVAL', seal: true } : { label: 'RECORD', seal: false };
