// Plain-language copy for the portals, in one place. Instructor voice: direct and practical.
export const RANGE_NAME = "Cindy's Hot Shots";
export const RANGE_CITY = 'Glen Burnie, MD';
export const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent("Cindy's Hot Shots Glen Burnie MD");

export const BRING = [
  'Government photo ID',
  'Factory target ammunition, 50 to 100 rounds (9mm, .380 and similar). The range sells it if you forget.',
  'Wrap-around eye protection and hearing protection',
  'Closed-toe shoes and clothes you can move in',
  'A notebook or phone for notes',
] as const;

export const EXPECT = [
  'Check in at the range. Standard classes start at 9:00 AM on Saturdays and Sundays unless Kai tells you a different time.',
  'Classroom first, then the range. Nobody handles a firearm until the safety briefing is done.',
  'Ask anything. There is no wrong question and nobody is graded on a guess.',
  'Leave live ammunition out of the classroom portion. Keep it in your bag until the range.',
] as const;

export const GUIDE_DISCLAIMER = 'Informational only. This is not legal advice. Rules, fees and processing times change, so always confirm on the official Maryland State Police page before you act.';

export const GUIDE_ITEMS: ReadonlyArray<{ title: string; body: string; href: string; link: string }> = [
  { title: 'Handgun Qualification License (HQL)', body: 'In Maryland you generally need an HQL, or an exemption, before you buy, rent or receive a handgun. It is not needed to keep a handgun you already own. The state asks for a 4-hour safety course with a qualified instructor, and you apply through the eMDSP online portal.', href: 'https://mdsp.maryland.gov/Organization/Pages/CriminalInvestigationBureau/LicensingDivision/Firearms/HandgunQualificationLicense.aspx', link: 'MSP: Handgun Qualification License' },
  { title: 'Wear and Carry permit', body: 'You need a permit before you carry, wear or transport a handgun. Applying is not the same as being approved: do not carry until you have the permit card. The first course is 16 hours and a renewal course is 8 hours. You apply through the MSP Licensing Portal, with fingerprints and a score sheet.', href: 'https://mdsp.maryland.gov/firearms-permits-professional-licenses/wear-carry-permit', link: 'MSP: Wear & Carry Permit' },
  { title: 'Other states', body: 'Maryland does not honor carry permits from other states, and other states set their own rules for Maryland permit holders. If you travel with a firearm, check each state before you go.', href: 'https://mdsp.maryland.gov/firearms-permits-professional-licenses', link: 'MSP: Firearms, Permits & Professional Licenses' },
];
