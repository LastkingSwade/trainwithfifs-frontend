// DRAFT: not reviewed. Gathered from Arizona's official pages on 2026-10-21 and kept out of the public site until the owner reviews it.
import type { Fact, StateGuide } from '../types';
const DPS = { label: 'Arizona DPS: Concealed Weapons and Permits', url: 'https://www.azdps.gov/services/public-services-center/concealed-weapons-and-permits' };
const FORM = { label: 'Arizona DPS: Concealed Weapons Permit application (07/2026)', url: 'https://www.azdps.gov/sites/default/files/2026-07/07202%20-%20CCW%20Permit%20Application%2007.26_0.pdf' };
const d = (text: string, source = DPS, caution?: string): Fact => ({ text, source, verifiedOn: null, ...(caution ? { caution } : {}) });
export const arizona: StateGuide = {
  code: 'AZ', slug: 'arizona', name: 'Arizona', status: 'draft',
  headline: 'Arizona Concealed Weapons Permit', summary: 'Draft: Arizona\'s concealed weapons permit.',
  permit: d('The Arizona Concealed Weapons Permit.'), authority: d('Arizona Department of Public Safety (DPS).'),
  residency: { unavailable: 'The Arizona sources conflict on whether a U.S. citizen who lives in another state may apply: the DPS page says an applicant must be an Arizona resident or a U.S. citizen, while the 2026 application requires a non-citizen to be an Arizona resident. Confirm with DPS before relying on this.' },
  eligibility: [d('Applicants must be 21 or older (19 with qualifying military service), and a U.S. citizen or Arizona resident.', DPS, 'Confirm residency rules with DPS.')],
  training: [d('Complete a firearms safety training program under Arizona law. The application accepts documentation of training or demonstrated competence completed in any U.S. state.', FORM)],
  steps: { unavailable: 'Application steps not yet gathered.' },
  fees: [d('New permit $60. Renewal $43. Replacement card or profile change $10.', DPS, 'The page that lists these fees looks old; confirm current fees.')],
  processing: { unavailable: 'Processing time not yet gathered.' },
  links: [DPS, FORM],
  recommendations: [{ course: 'mastery', why: 'Multi-State Mastery helps you assemble the Arizona packet.' }],
  reciprocity: { status: 'unverified', line: 'Not yet reviewed. Arizona\'s carry rules for visitors, including its permitless-carry rules, have not been re-checked against an official page.' },
};
