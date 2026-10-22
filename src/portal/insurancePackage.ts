// The insurance package: one spreadsheet (CSV) a member can keep for their insurer. It lists their own Armory items and the NAMES of their wallet documents. It never includes document
// files, notes, or serial numbers unless the member ticks the box. Built in this browser on request; nothing is stored or sent. This is a list of records, not an appraisal.
import { csvCell } from './rangeLogic';
import { TYPE_INFO, lastService, money, type AItem } from './armoryLogic';

export interface PackageDoc { kindLabel: string; createdAt: string; expiresOn: string | null }
export interface PackageInput { items: readonly AItem[]; docs: readonly PackageDoc[]; includeSerials: boolean; today: string }
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const day = (s: string | null | undefined): string => (s && DAY.test(s.slice(0, 10)) ? s.slice(0, 10) : '');
const line = (cells: unknown[]): string => cells.map(csvCell).join(',');

export function buildInsurancePackage(o: PackageInput): string {
  const items = o.items.filter((i) => !i.unreadable);
  const rows: string[] = [];
  rows.push(line(['Train With FIFS insurance package']));
  rows.push(line(['Prepared', day(o.today)]));
  rows.push(line(['Built from your own records. This is a list, not an appraisal or valuation. Check your policy for what it covers.']));
  rows.push('');
  rows.push(line(['Firearms and equipment']));
  const head = ['Nickname', 'Type', 'Make', 'Model', 'Caliber', 'Purchased', 'Price paid'];
  if (o.includeSerials) head.push('Serial number');
  head.push('Maintenance entries', 'Last service');
  rows.push(line(head));
  for (const i of items) {
    const cells: unknown[] = [i.nickname, TYPE_INFO[i.type]?.label || '', i.make, i.model, i.caliber, day(i.purchasedOn), i.price === null ? '' : money(i.price).replace(/^\$/, '')];
    if (o.includeSerials) cells.push(i.serial);
    cells.push(i.maintenance.length, day(lastService(i)));
    rows.push(line(cells));
  }
  const total = items.reduce((s, i) => s + (i.price || 0), 0);
  rows.push(line(['Total of prices entered', '', '', '', '', '', total ? total.toFixed(2) : '0.00']));
  rows.push('');
  rows.push(line(['Documents on file (names only; the files are not included)']));
  rows.push(line(['Document', 'Uploaded', 'Expires']));
  for (const d of o.docs) rows.push(line([d.kindLabel, day(d.createdAt), day(d.expiresOn)]));
  if (!o.docs.length) rows.push(line(['No documents on file yet']));
  return rows.join('\n') + '\n';
}
