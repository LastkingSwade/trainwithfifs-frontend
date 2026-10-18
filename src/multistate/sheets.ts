// Printable sheets for the Multi-State guide: mailing labels, the Virginia packet checklist with cover sheet, and fill-in worksheets for each agency. These are HELPERS,
// not official forms: they carry the student's own details (typed on this screen, kept only in this page's memory, never saved or sent) next to the answers the agency
// asks for, so the student can copy them across. Sensitive numbers (Social Security, driver license) are deliberately left as blanks to write in by hand.
import { ADDRESSES, FEE_HOW } from './plan';

export interface Details { fullName: string; email: string; phone: string; street: string; cityStateZip: string; dob: string }
export const EMPTY_DETAILS: Details = { fullName: '', email: '', phone: '', street: '', cityStateZip: '', dob: '' };
export type Block = { h?: string; lines?: string[]; checklist?: string[]; table?: { head: string[]; rows: string[][] }; note?: string; big?: string[] };
export interface Sheet { title: string; subtitle?: string; blocks: Block[] }

const clean = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
export function cleanDetails(d: Partial<Details>): Details { return { fullName: clean(d.fullName, 80), email: clean(d.email, 120), phone: clean(d.phone, 30), street: clean(d.street, 100), cityStateZip: clean(d.cityStateZip, 80), dob: clean(d.dob, 20) }; }
const blank = (v: string, label: string) => v || `__________________ (${label})`;
const returnAddress = (d: Details) => (d.fullName || d.street || d.cityStateZip ? [d.fullName, d.street, d.cityStateZip].filter(Boolean) : ['(your name)', '(your street address)', '(city, state, zip)']);
const mine = (d: Details): string[] => [`Full legal name: ${blank(d.fullName, 'as on your ID')}`, `Home address: ${blank([d.street, d.cityStateZip].filter(Boolean).join(', '), 'street, city, state, zip')}`, `Phone: ${blank(d.phone, 'phone')}`, `Email: ${blank(d.email, 'email')}`, `Date of birth: ${blank(d.dob, 'MM/DD/YYYY')}`];
const HAND = ['Social Security number: write it in by hand on the official form or portal', 'Driver license number: write it in by hand'];
const DISCLAIMER = 'This is a helper sheet from Future Initiative Firearm Services, not an official form. Copy your answers onto the official form or portal. Check each agency\'s current instructions before you send anything.';

export function labelSheet(d: Details): Sheet {
  const from = returnAddress(d);
  const one = (title: string, to: readonly string[], extra: string) => ({ h: title, big: [...to], lines: ['FROM:', ...from], note: extra });
  return { title: 'Mailing labels', subtitle: 'Cut out each label and tape it to your envelope, or copy the address by hand.', blocks: [
    one('Virginia State Police (USPS Certified Mail)', ADDRESSES.va, 'Send the Virginia packet by USPS Certified Mail with tracking.'),
    one('Florida (fingerprint card and barcode sheet)', ADDRESSES.fl, 'Send 1 fingerprint card and the printed barcode confirmation sheet.'),
    one('Arizona (USPS First-Class tracked envelope)', ADDRESSES.az, 'Send the Arizona packet in a tracked envelope.'),
  ] };
}

export function virginiaPacket(d: Details): Sheet {
  return { title: 'Virginia Non-Resident Concealed Handgun Permit: packet checklist and cover sheet', subtitle: 'Check each item off before you seal the envelope.', blocks: [
    { h: 'Applicant', lines: mine(d).slice(0, 4) },
    { h: 'The 7 items (all must be in one envelope)', checklist: [
      'Form SP-248 application: black ink or typed, signed and dated',
      'FIFS training affidavit signed by Coach Kai Wade with the notary\'s jurat',
      'Copies of Coach Kai Wade\'s instructor credentials (NRA and Maryland State Police instructor card)',
      '2 FBI FD-258 fingerprint cards (blue border), filled in completely',
      '2 passport photos (2×2): attach with a paperclip only, never staple across the face',
      'Clear front-and-back copy of your driver license',
      `$100.00 payment: cashier's check or USPS money order payable to "Virginia State Police". No personal checks.`,
    ] },
    { h: 'Mail it to', big: [...ADDRESSES.va] },
    { h: 'Tracking', lines: ['Send USPS Certified Mail (or Priority with tracking) and keep the receipt.', 'Tracking number: ____________________________   Date mailed: ______________', 'Virginia review usually takes about 60 to 90 days.'] },
    { note: DISCLAIMER },
  ] };
}

export function worksheets(d: Details): Sheet {
  const header = mine(d);
  return { title: 'Application worksheets', subtitle: 'Your details are filled in. Take these with you when you apply.', blocks: [
    { h: 'Maryland: State Police portal (licensingportal.mdsp.maryland.gov), $125 by card', lines: header, checklist: [
      'LiveScan receipt with your 12-digit TCN number: TCN ________________  Scan date ____________',
      '5 years of home addresses with no gaps (write them on the next page if needed)',
      '5 years of employment history with no gaps',
      '3 character references (not family): name, home address, phone, email for each',
      '2×2 passport photo (JPG) and your signed Form MSP 29-14 score sheet to upload',
      'Optional, free: HQL exemption (HQL, Original, Training Exempt, attach the score sheet)',
    ], note: HAND.join('. ') + '.' },
    { h: 'Maryland: references', table: { head: ['Reference', 'Full legal name', 'Home address', 'Phone', 'Email'], rows: [['1', '', '', '', ''], ['2', '', '', '', ''], ['3', '', '', '', '']] } },
    { h: 'Maryland: 5-year history', table: { head: ['From', 'To', 'Home address or employer', 'City, state'], rows: [['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', '']] } },
    { h: `Virginia: Form SP-248 by mail, $100 (${FEE_HOW.Virginia})`, lines: header, note: 'Use the Virginia packet checklist for the 7 items. ' + HAND.join('. ') + '.' },
    { h: `Florida: online portal at fdacs.gov, $97 (${FEE_HOW.Florida})`, lines: header, checklist: ['Upload the FIFS affidavit and Coach Kai\'s instructor credentials', 'Pay online and print the barcode confirmation sheet', 'Mail 1 fingerprint card and the barcode sheet to the Florida address on your label'] },
    { h: `Arizona: CWPU application by mail, $60 (${FEE_HOW.Arizona})`, lines: header, checklist: ['Arizona CWPU application, signed', 'FIFS Arizona compliance affidavit', 'Copy of Coach Kai\'s NRA credential', '2 FBI FD-258 fingerprint cards', 'Proof of U.S. citizenship (birth certificate or passport)', '$60 money order payable to "AZ DPS"'] },
    { h: `Pennsylvania: York County online portal, $20 (${FEE_HOW.Pennsylvania})`, lines: header, checklist: ['ONLY after your Maryland permit card is in your hand', 'Upload front and back scans of your Maryland driver license and your Maryland permit card', 'Pay $20 and wait for the approval text (usually 48 to 96 hours)', 'Pick up at York County Judicial Center, 45 N George St. (photo and plastic card in about 5 minutes; no ink cards)'] },
    { note: DISCLAIMER },
  ] };
}

// ---- 2×2 photo check (advisory; the photo never leaves this device) ----
export interface PhotoFacts { width: number; height: number; bgLightness: number; bgSpread: number }
export interface PhotoTip { label: string; pass: boolean; hint: string }
export function assessPhoto(f: PhotoFacts): { allGood: boolean; tips: PhotoTip[] } {
  const ratio = f.height > 0 ? f.width / f.height : 0;
  const tips: PhotoTip[] = [
    { label: 'Square (2×2 inches)', pass: ratio >= 0.97 && ratio <= 1.03, hint: `Yours is ${f.width}×${f.height}. Crop it to a square.` },
    { label: 'Big enough (at least 600×600 pixels)', pass: f.width >= 600 && f.height >= 600, hint: 'Use the original photo, not a small copy.' },
    { label: 'Plain, light background', pass: f.bgLightness >= 200 && f.bgSpread <= 40, hint: 'Stand in front of a plain white wall with even light and no shadows.' },
  ];
  return { allGood: tips.every((t) => t.pass), tips };
}
