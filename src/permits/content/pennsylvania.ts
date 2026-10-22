// DRAFT: not reviewed. Gathered from Pennsylvania's official pages on 2026-10-21 and kept out of the public site until the owner reviews it.
import type { Fact, StateGuide } from '../types';
const PSP = { label: 'Pennsylvania State Police: Carrying Firearms in Pennsylvania', url: 'https://www.pa.gov/agencies/psp/programs/firearms/carrying-firearms-in-pennsylvania' };
const YORK = { label: 'York County, Pennsylvania: License to Carry', url: 'https://yorkcountypa.gov/1009/License-to-Carry' };
const AG = { label: 'Pennsylvania Attorney General: Concealed Carry Reciprocity', url: 'https://www.attorneygeneral.gov/for-the-public/concealed-carry-reciprocity/' };
const d = (text: string, source = PSP, caution?: string): Fact => ({ text, source, verifiedOn: null, ...(caution ? { caution } : {}) });
export const pennsylvania: StateGuide = {
  code: 'PA', slug: 'pennsylvania', name: 'Pennsylvania', status: 'draft',
  headline: 'Pennsylvania License to Carry Firearms (non-resident)', summary: 'Draft: how people from other states apply for a Pennsylvania license to carry.',
  permit: d('A Pennsylvania License to Carry Firearms, valid for five years.'), authority: d('Issued by a county sheriff. Some Pennsylvania sheriffs do not issue non-resident licenses; York County does.', PSP),
  residency: [d('Out-of-state residents who hold a valid concealed carry permit from their home state may be issued a Pennsylvania license by a sheriff who accepts non-resident applications.', PSP)],
  eligibility: [d('Applicants must be 21 or older.', PSP), d('York County requires your home-state concealed weapons permit and a valid driver\'s license, with color photos of both.', YORK)],
  training: { unavailable: 'No training rule gathered for non-resident applicants.' },
  steps: [d('York County: submit the application with the photos online or by mail; the county says out-of-state applicants must apply online or mail a certified check or money order from July 1, 2026. Licenses are picked up in person with photo ID at the York County Judicial Center Sheriff\'s Office.', YORK, 'The county\'s pages disagree on payment details; confirm with the Sheriff\'s Office.')],
  fees: [d('York County lists $20.', YORK, 'The county\'s pages conflict on the fee and how to pay; confirm before sending anything.')],
  processing: [d('The sheriff has 45 days to decide, including a background check.', PSP)],
  links: [PSP, YORK, AG],
  recommendations: [{ course: 'mastery', why: 'Multi-State Mastery includes the Pennsylvania non-resident license process.' }],
  reciprocity: { status: 'verified', line: 'The Pennsylvania Attorney General\'s page lists Maryland as not recognized in either direction: Pennsylvania does not recognize Maryland permits.', source: AG, verifiedOn: '2026-10-21' },
};
