// The Mid-Atlantic Multi-State application plan, from the FIFS SOP Field Guide (public/FIFS-34-State-Multi-Permit-SOP-Field-Guide.html). Pure data and rules:
// the same file drives the student's card, the printable sheets and the server's checks, so they can never disagree. Nothing here is an official form, and
// nothing here submits anything to an agency: it tells the student what to do, in what order, with what, and keeps their place.
export type PhaseKey = 'md' | 'mail' | 'pa';
export interface Step { id: string; phase: PhaseKey; group: string; title: string; detail: string; needs?: string; optional?: boolean; fee?: { state: string; amount: number } }
export interface Phase { key: PhaseKey; label: string; emoji: string; blurb: string }
export const PHASES: readonly Phase[] = [
  { key: 'md', emoji: '🏛️', label: 'Phase 1: Maryland (your home permit)', blurb: 'Submit as soon as you finish class. This is the permit everything else builds on.' },
  { key: 'mail', emoji: '📬', label: 'Phase 2: Virginia, Florida and Arizona (mail in the first days)', blurb: 'Do not wait for Maryland to approve. Send these within days of finishing class.' },
  { key: 'pa', emoji: '🚗', label: 'Phase 3: Pennsylvania (only after your Maryland card arrives)', blurb: 'Pennsylvania denies anyone who applies before they hold their Maryland permit card, and keeps the $20 fee.' },
];

export const STEPS: readonly Step[] = [
  // ---- Maryland
  { id: 'md_livescan', phase: 'md', group: 'Maryland', title: 'Get your LiveScan fingerprints and keep the paper receipt', detail: 'The receipt shows a 12-digit TCN tracking number. You will type it into the State Police portal.' },
  { id: 'md_photo', phase: 'md', group: 'Maryland', title: 'Take a 2×2 passport photo (digital JPG)', detail: 'Plain white wall, neutral expression, no glasses or hat. You can check your photo with the tool below.' },
  { id: 'md_refs', phase: 'md', group: 'Maryland', title: 'Line up 3 character references who are not family', detail: 'You need each one\'s full legal name, home address, direct phone number and email.' },
  { id: 'md_scoresheet', phase: 'md', group: 'Maryland', title: 'Receive your signed Form MSP 29-14 score sheet from Coach Kai', detail: 'It is signed after the range day (70% or better to pass). Keep a copy in your Document Vault.' },
  { id: 'md_submit', phase: 'md', group: 'Maryland', title: 'Submit on the State Police portal and pay $125 by card', detail: 'licensingportal.mdsp.maryland.gov, then Initial Application, then Wear and Carry Handgun Permit. Enter your TCN, 5 years of home and work history, your 3 references, then upload your photo and score sheet.', fee: { state: 'Maryland', amount: 125 } },
  { id: 'md_tracking', phase: 'md', group: 'Maryland', title: 'Write down your State Police tracking number', detail: 'The review takes about 30 to 60 days.', needs: 'md_submit' },
  { id: 'md_hql', phase: 'md', group: 'Maryland', title: 'Also file your free HQL exemption (same score sheet, $0)', detail: 'On the same portal choose HQL, then Original, then Training Exempt, and attach the score sheet.', optional: true, needs: 'md_scoresheet' },
  { id: 'md_card', phase: 'md', group: 'Maryland', title: 'Your plastic Maryland permit card arrived in the mail', detail: 'Check this only when the physical card is in your hand. It unlocks Pennsylvania.' },
  // ---- Mail packets
  { id: 'aff_received', phase: 'mail', group: 'For all three', title: 'Receive Coach Kai\'s notarized training affidavit and instructor credentials', detail: 'Ask Coach Kai if you have not received them within a day or two of your class. Virginia, Florida and Arizona all need them.' },
  { id: 'fd258', phase: 'mail', group: 'For all three', title: 'Get your 5 fingerprint ink cards (FBI FD-258, blue border)', detail: 'Virginia needs 2, Florida needs 1, Arizona needs 2. Maryland uses LiveScan, and Pennsylvania needs none.' },
  { id: 'va_form', phase: 'mail', group: 'Virginia', title: 'Complete Form SP-248', detail: 'Black ink or typed, signed and dated.', needs: 'aff_received' },
  { id: 'va_packet', phase: 'mail', group: 'Virginia', title: 'Assemble all 7 items in the envelope', detail: 'Application, FIFS training affidavit, instructor credentials copies, 2 fingerprint cards, 2 photos (paperclip only, never staple across a face), front-and-back copy of your ID, and the payment.', needs: 'va_form' },
  { id: 'va_payment', phase: 'mail', group: 'Virginia', title: 'Get the $100 cashier\'s check or USPS money order', detail: 'Payable to "Virginia State Police". No personal checks.', fee: { state: 'Virginia', amount: 100 } },
  { id: 'va_mailed', phase: 'mail', group: 'Virginia', title: 'Mail it USPS Certified with tracking', detail: 'Virginia State Police Firearms Transaction Center, Non-Resident CHP, P.O. Box 85141, Richmond, VA 23285-5141. Review takes about 60 to 90 days.', needs: 'va_packet' },
  { id: 'fl_portal', phase: 'mail', group: 'Florida', title: 'Apply online with the Florida licensing portal and pay $97', detail: 'fdacs.gov: upload the FIFS affidavit and Coach Kai\'s credentials, pay by card, then print the barcode confirmation sheet.', needs: 'aff_received', fee: { state: 'Florida', amount: 97 } },
  { id: 'fl_mailed', phase: 'mail', group: 'Florida', title: 'Mail 1 fingerprint card and the barcode sheet', detail: 'FDACS Division of Licensing, P.O. Box 6687, Tallahassee, FL 32314-6687. Review takes about 45 to 60 days.', needs: 'fl_portal' },
  { id: 'az_packet', phase: 'mail', group: 'Arizona', title: 'Assemble the Arizona packet', detail: 'Signed Arizona CWPU application, the FIFS Arizona compliance affidavit, a copy of Coach Kai\'s NRA credential, 2 fingerprint cards, and proof of U.S. citizenship (birth certificate or passport).', needs: 'aff_received' },
  { id: 'az_payment', phase: 'mail', group: 'Arizona', title: 'Get the $60 money order', detail: 'Payable to "AZ DPS".', fee: { state: 'Arizona', amount: 60 } },
  { id: 'az_mailed', phase: 'mail', group: 'Arizona', title: 'Mail it in a USPS First-Class tracked envelope', detail: 'AZ Dept of Public Safety, Concealed Weapons Permit Unit, P.O. Box 6488, Mail Drop 3170, Phoenix, AZ 85005. Review takes about 30 to 45 days.', needs: 'az_packet' },
  // ---- Pennsylvania
  { id: 'pa_portal', phase: 'pa', group: 'Pennsylvania', title: 'Apply on York County\'s online portal and pay $20', detail: 'Upload front and back scans of your Maryland driver license and your Maryland permit card.', needs: 'md_card', fee: { state: 'Pennsylvania', amount: 20 } },
  { id: 'pa_approval', phase: 'pa', group: 'Pennsylvania', title: 'Get the approval text message', detail: 'Usually 48 to 96 hours.', needs: 'pa_portal' },
  { id: 'pa_pickup', phase: 'pa', group: 'Pennsylvania', title: 'Pick up your card at York County Judicial Center, 45 N George St.', detail: 'About a 35-minute drive up I-83. Your photo is taken on the spot and the plastic card prints in under 5 minutes. No ink cards needed.', needs: 'pa_approval' },
];

export const STEP_IDS: ReadonlySet<string> = new Set(STEPS.map((s) => s.id));
export const TRACKING_KEYS = ['va', 'fl', 'az'] as const;
export const FEES = STEPS.filter((s) => s.fee).map((s) => ({ stepId: s.id, state: s.fee!.state, amount: s.fee!.amount }));
export const FEE_TOTAL = FEES.reduce((n, f) => n + f.amount, 0); // $402, as in the Field Guide
export const FEE_HOW: Record<string, string> = { Maryland: 'Credit or debit card, online', Virginia: 'Cashier\'s check or USPS money order (no personal checks)', Florida: 'Credit or debit card, online', Arizona: 'Money order', Pennsylvania: 'Credit or debit card, online' };

export type Done = Record<string, string>; // step id -> when it was checked (ISO date)
const byId = new Map(STEPS.map((s) => [s.id, s] as const));
export const stepById = (id: string): Step | undefined => byId.get(id);

/** Why a step cannot be checked yet, or null when it can. */
export function lockedReason(id: string, done: Done): string | null {
  const s = byId.get(id); if (!s || !s.needs) return null;
  if (done[s.needs]) return null;
  const need = byId.get(s.needs)!;
  return s.phase === 'pa' && s.needs === 'md_card' ? 'Locked until your Maryland permit card is in your hand. Applying early gets you denied and costs you the $20.' : `Do this first: ${need.title}`;
}
/** Un-checking a step also clears anything that depended on it, so the list can never show a step done whose prerequisite is not. */
export function withToggle(done: Done, id: string, checked: boolean, nowIso: string): { ok: true; done: Done } | { ok: false; reason: string } {
  if (!byId.has(id)) return { ok: false, reason: 'Unknown step.' };
  const next: Done = { ...done };
  if (checked) { const why = lockedReason(id, next); if (why) return { ok: false, reason: why }; if (!next[id]) next[id] = nowIso; return { ok: true, done: next }; }
  delete next[id];
  let changed = true; while (changed) { changed = false; for (const s of STEPS) if (next[s.id] && s.needs && !next[s.needs]) { delete next[s.id]; changed = true; } }
  return { ok: true, done: next };
}
/** Keep only steps that exist, with dates that look like dates (what the database hands back is never trusted blindly). */
export function cleanDone(raw: unknown): Done {
  const out: Done = {}; if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) if (byId.has(k) && typeof v === 'string' && !Number.isNaN(Date.parse(v))) out[k] = v;
  return out;
}
export interface Summary { done: number; total: number; required: number; requiredDone: number; percent: number; phase: PhaseKey | 'complete'; next: Step | null; fees: { handled: number; total: number } }
export function summarize(done: Done): Summary {
  const required = STEPS.filter((s) => !s.optional); const requiredDone = required.filter((s) => done[s.id]).length;
  const next = STEPS.find((s) => !s.optional && !done[s.id] && !lockedReason(s.id, done)) || null;
  const handled = FEES.filter((f) => done[f.stepId]).reduce((n, f) => n + f.amount, 0);
  const mdDone = STEPS.filter((s) => s.phase === 'md' && !s.optional).every((s) => done[s.id]); const mailDone = STEPS.filter((s) => s.phase === 'mail').every((s) => done[s.id]);
  const phase: Summary['phase'] = requiredDone === required.length ? 'complete' : !mdDone ? 'md' : !mailDone ? 'mail' : 'pa';
  return { done: STEPS.filter((s) => done[s.id]).length, total: STEPS.length, required: required.length, requiredDone, percent: Math.round((requiredDone / required.length) * 100), phase, next, fees: { handled, total: FEE_TOTAL } };
}
export const phaseLabel = (p: Summary['phase']) => (p === 'complete' ? 'All done' : PHASES.find((x) => x.key === p)!.label.replace(/^Phase \d: /, ''));

export function cleanTracking(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {}; if (!raw || typeof raw !== 'object') return out;
  for (const k of TRACKING_KEYS) { const v = (raw as any)[k]; if (typeof v === 'string' && /^[A-Za-z0-9 -]{1,40}$/.test(v.trim())) out[k] = v.trim(); }
  return out;
}
export const cleanTrackingValue = (v: unknown): string | null => { const s = String(v ?? '').trim(); return s === '' ? '' : /^[A-Za-z0-9 -]{1,40}$/.test(s) ? s : null; };

// ---- Mailing addresses (exactly as in the Field Guide) ----
export const ADDRESSES = {
  va: ['Virginia State Police', 'Firearms Transaction Center', 'Non-Resident CHP', 'P.O. Box 85141', 'Richmond, VA 23285-5141'],
  fl: ['FDACS - Division of Licensing', 'P.O. Box 6687', 'Tallahassee, FL 32314-6687'],
  az: ['AZ Dept of Public Safety', 'Concealed Weapons Permit Unit', 'P.O. Box 6488, Mail Drop 3170', 'Phoenix, AZ 85005'],
} as const;
