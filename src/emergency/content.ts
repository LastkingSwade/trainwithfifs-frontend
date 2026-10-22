// The Emergency information page. Every number and link is official or the FIFS number, with a check date. Nothing here asks where firearms are kept.
export const CHECKED = '2026-10-22';
export const PHONE_FIFS = '443-990-1304';
export interface Link { label: string; url: string; checked: string }
export const CRISIS = [
  { title: 'Someone may be in danger right now', text: 'Call 911 (or the local emergency number). If you cannot speak, call anyway and stay on the line.' },
  { title: 'Feeling hopeless, or thinking about hurting yourself or someone else', text: 'Call or text 988 (Suicide & Crisis Lifeline). It is free, confidential and open 24 hours a day, 7 days a week.' },
];
export const REPORTING = [
  { title: 'A regulated firearm is lost or stolen', text: 'Maryland law requires the owner to report it to the local law enforcement agency within 72 hours of discovering the loss or theft.', source: { label: 'Maryland Code, Public Safety § 5-146 (Justia; check the official General Assembly text)', url: 'https://law.justia.com/codes/maryland/2019/public-safety/title-5/subtitle-1/sect-5-146/' }, checked: CHECKED },
];
export const HELP: Link[] = [
  { label: 'Maryland Safe Storage Map (temporary, voluntary storage near you)', url: 'https://mdpgv.org/safestoragemap', checked: CHECKED },
  { label: 'Maryland Office of Suicide Prevention', url: 'https://health.maryland.gov/bha/suicideprevention/Pages/home.aspx', checked: CHECKED },
];
export const CONTACT = { label: 'Coach Kai Wade, Future Initiative Firearm Services', phone: PHONE_FIFS };
