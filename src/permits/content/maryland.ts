// Maryland guide. Every fact below was read on the Maryland State Police pages named in its source and checked on 2026-10-21 (docs/PERMIT-CENTER-VERIFICATION.md records the
// check, including what the official pages do NOT say). Statutes, cases and jury instructions from the class PDF are deliberately not used. This is information, not legal advice.
import type { Fact, StateGuide } from '../types';
const V = '2026-10-21';
const WC = { label: 'Maryland State Police: Wear & Carry Permit', url: 'https://mdsp.maryland.gov/firearms-permits-professional-licenses/wear-carry-permit' };
const HQL = { label: 'Maryland State Police: Handgun Qualification License', url: 'https://mdsp.maryland.gov/Organization/Pages/CriminalInvestigationBureau/LicensingDivision/Firearms/HandgunQualificationLicense.aspx' };
const f = (text: string, source = WC): Fact => ({ text, source, verifiedOn: V });

export const maryland: StateGuide = {
  code: 'MD', slug: 'maryland', name: 'Maryland', status: 'published',
  headline: 'Maryland Wear & Carry Permit', summary: 'The permit to carry, wear or transport a handgun in Maryland, and the Handgun Qualification License (HQL) you need before you buy one. Everything here comes from the Maryland State Police pages linked below.',
  permit: f('The Maryland Wear and Carry Permit lets you carry, wear or transport a handgun in Maryland. Applying does not authorize you to carry: do not carry until you have the permit.'),
  authority: f('Issued by the Maryland State Police (MSP) Licensing Division, through the MSP online Licensing Portal.'),
  residency: { unavailable: 'The official MSP page does not state a residency rule for Maryland residents or non-residents. If you live outside Maryland, ask the MSP Licensing Division before you apply.' },
  eligibility: [
    f('Applicants must be at least 21, or an active member of the U.S. Armed Forces, the National Guard or the uniformed services.'),
    f('Disqualifying criminal history, drug or alcohol conditions, and a history of violence or instability can prevent approval. The MSP page lists them; this guide cannot tell you whether they apply to you.'),
  ],
  training: [
    f('First permit: complete the MSP-approved 16-hour Firearms Safety Training Course with a Qualified Handgun Instructor, within 2 years before you apply (unless you are exempt).'),
    f('Renewal: complete an 8-hour Firearms Safety Training Course (unless you are exempt).'),
    f('Your instructor must be a Qualified Handgun Instructor registered with the MSP. You upload the MSP 29-14 score sheet (or your exemption documents) with your application.'),
  ],
  steps: [
    f('1. Finish the 16-hour course and get your score sheet.'),
    f('2. Get Livescan fingerprints from an authorized vendor (out-of-state providers are not approved) and keep the receipt.'),
    f('3. Have a passport-style photo.'),
    f('4. Log in to (or create) your account on the MSP Licensing Portal, upload the fingerprint receipt, score sheet and photo, complete the application and pay the fee.'),
    f('Applications are completed and submitted online only; handwritten applications are not accepted. The MSP says it takes about 1.5 to 2 hours once your pre-application items are ready.'),
  ],
  fees: [
    f('Initial application: $125. Renewal application: $75.'),
    f('Application fees do not include fingerprint fees. Fees are non-refundable and paid by Visa or MasterCard.'),
  ],
  processing: [
    f('The MSP says it will give a final decision within 90 days.'),
    f('A first permit is valid until the last day of your birth month, 2 years after it is issued. A renewal is valid for an additional 3 years.'),
    f('Start your renewal 90 days before it expires. If you renew at least 14 days before expiration you can keep carrying until a decision is made. If it expires, you must apply again as a new applicant.'),
  ],
  related: [{
    title: 'Handgun Qualification License (HQL)',
    facts: [
      f('You must have an HQL (or an exemption) before you purchase, rent or receive a handgun. You do not need one to keep a handgun you already legally own.', HQL),
      f('Training: a 4-hour firearms safety course with an MSP-qualified handgun instructor, within 3 years before you apply. It includes a live-fire part, and firing is not required beyond 15 yards.', HQL),
      f('Apply online through eMDSP. Fees: $50 initial and $20 renewal, plus fingerprint fees.', HQL),
      f('The MSP gives a decision within 30 days after it receives your completed application and fee. An HQL is valid for 10 years; submit a renewal at least 14 days before it expires.', HQL),
    ],
  }],
  links: [WC, HQL, { label: 'Maryland State Police: Firearms, Permits & Professional Licenses', url: 'https://mdsp.maryland.gov/firearms-permits-professional-licenses' }],
  recommendations: [
    { course: 'ccw', why: 'The 16-hour Maryland Wear & Carry class your first permit requires.' },
    { course: 'combo', why: 'Covers the HQL and the Wear & Carry training together in one class.' },
    { course: 'renewal', why: 'The 8-hour class for renewing your permit.' },
    { course: 'hql', why: 'The 4-hour class if you only need the Handgun Qualification License.' },
  ],
  reciprocity: { status: 'verified', line: 'The Maryland State Police page says Maryland does not recognize permits issued by any other state.', source: WC, verifiedOn: V },
};
