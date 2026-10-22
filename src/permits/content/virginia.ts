// DRAFT: not reviewed. Gathered from Virginia's official pages on 2026-10-21 and kept out of the public site until the owner reviews it. Every fact has no check date on purpose.
import type { Fact, StateGuide } from '../types';
const NR = { label: 'Virginia State Police: Nonresident Concealed Handgun Permits', url: 'https://vsp.virginia.gov/services/firearms/nonresident-concealed-handgun-permits/' };
const STAT = { label: 'Code of Virginia § 18.2-308.06', url: 'https://law.lis.virginia.gov/vacode/title18.2/chapter7/section18.2-308.06/' };
const REC = { label: 'Virginia State Police: Reciprocity and Recognition', url: 'https://vsp.virginia.gov/services/firearms/reciprocity-and-recognition/' };
const d = (text: string, source = NR, caution?: string): Fact => ({ text, source, verifiedOn: null, ...(caution ? { caution } : {}) });
export const virginia: StateGuide = {
  code: 'VA', slug: 'virginia', name: 'Virginia', status: 'draft',
  headline: 'Virginia Nonresident Concealed Handgun Permit', summary: 'Draft: how people who do not live in Virginia apply for a Virginia permit.',
  permit: d('A five-year Virginia nonresident concealed handgun permit.'), authority: d('Virginia State Police.'),
  residency: [d('For people who are not Virginia residents.')],
  eligibility: [d('Applicants must be 21 or older.', STAT)],
  training: [d('Proof of competence with a handgun. In-person options include an approved hunter-safety course or an NRA or USCCA firearms course; the State Police says it no longer accepts online course certificates for nonresident permits.', NR, 'Confirm the list of accepted courses with the State Police.')],
  steps: [d('Application package: Form SP-248 sworn before a notary, proof of competence, fingerprints taken by a law enforcement agency, photographs, a copy of photo ID and the fee. Incomplete packages are not processed.', NR, 'The statute and regulations call for two photographs; the web page describes one. Confirm before applying.')],
  fees: [d('$100, by money order or cashier\'s check payable to the Virginia State Police. Non-refundable.', NR)],
  processing: { unavailable: 'Processing time not yet gathered.' },
  links: [NR, STAT, REC],
  recommendations: [{ course: 'mastery', why: 'Multi-State Mastery helps you assemble the Virginia packet.' }],
  reciprocity: { status: 'verified', line: 'Virginia\'s State Police page lists Maryland among the states whose permits it recognizes, for holders who are at least 21 and carry photo ID. Virginia law changes how other states\' permits are recognized from July 1, 2027.', source: REC, verifiedOn: '2026-10-21' },
};
