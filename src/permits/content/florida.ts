// DRAFT: not reviewed. Gathered from Florida's official pages on 2026-10-21 and kept out of the public site until the owner reviews it.
import type { Fact, StateGuide } from '../types';
const APPLY = { label: 'Florida Department of Agriculture & Consumer Services: Applying for a Concealed Weapon License', url: 'https://www.fdacs.gov/Consumer-Resources/Concealed-Weapon-License/Applying-for-a-Concealed-Weapon-License' };
const INSTR = { label: 'FDACS: Concealed Weapon or Firearm License application instructions (05/2025)', url: 'https://ccmedia.fdacs.gov/content/download/26365/file/ConcealedWeaponLicenseApplicationInstructions.pdf' };
const d = (text: string, source = APPLY, caution?: string): Fact => ({ text, source, verifiedOn: null, ...(caution ? { caution } : {}) });
export const florida: StateGuide = {
  code: 'FL', slug: 'florida', name: 'Florida', status: 'draft',
  headline: 'Florida Concealed Weapon or Firearm License', summary: 'Draft: how people from other states apply for a Florida license.',
  permit: d('The Florida Concealed Weapon or Firearm License.'), authority: d('Florida Department of Agriculture and Consumer Services, Division of Licensing.'),
  residency: [d('Out-of-state applicants mail a fingerprint card to the Division of Licensing; electronic fingerprints are not accepted from out-of-state applicants. Prints must be taken by a law enforcement agency.', APPLY)],
  eligibility: [d('Applicants must be 21 (service members and honorably discharged veterans may apply at 18), and must be U.S. citizens or permanent residents who currently live in the U.S. unless serving in the Armed Forces.', INSTR)],
  training: [d('Proof of firearms training is required.', INSTR, 'The accepted courses were not gathered. Confirm with FDACS.')],
  steps: [d('Mail the application, a photograph, proof of training, and the original fingerprint card with the fingerprint fee to the Division of Licensing in Tallahassee.', INSTR)],
  fees: [d('License fee $55 plus $42 fingerprint processing, $97 in total. A sheriff\'s office may charge up to $5 to take the prints. Pay by check or money order to FDACS, never cash.', INSTR, 'Some fee-schedule text was unclear; confirm the out-of-state total with FDACS.')],
  processing: { unavailable: 'Processing time not yet gathered.' },
  links: [APPLY, INSTR],
  recommendations: [{ course: 'mastery', why: 'Multi-State Mastery helps you assemble the Florida packet.' }],
  reciprocity: { status: 'unverified', line: 'Not yet reviewed. Florida\'s carry rules for visitors have not been re-checked against an official page.' },
};
