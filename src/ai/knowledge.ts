// The FIFS Guide's approved reference material. The Guide may answer ONLY from what is written here. Every entry comes from text already on the site or in the portals (the FAQ, "what to bring" and
// "what to expect", the Maryland guide cards, the course prices) or from a plain description of a portal feature. Nothing here is legal advice. To change what the Guide knows, edit this file:
// it is the only place its knowledge lives. Prices are read from the same table the checkout uses, so they cannot drift.
import { BRING, EXPECT, GUIDE_ITEMS, MAPS_URL, RANGE_CITY, RANGE_NAME } from '../portal/portalCopy';
import { COURSE_PRICING, MIN_DEPOSIT_PERCENT, PAY_IN_FULL_BONUS } from '../Lib/pricing';

export interface Snippet { id: string; title: string; text: string; source: string; url?: string; label?: string }
export const PHONE = '443-990-1304';
export const COURSE_NAMES: Record<string, string> = {
  mastery: 'Mid-Atlantic Multi-State Mastery', combo: 'Maryland CCW & HQL Combo', ccw: 'Maryland Wear & Carry (16-hour initial class)', renewal: 'Maryland Wear & Carry 8-hour renewal',
  hql: 'Maryland HQL (4-hour class)', coaching: 'Personal 1-on-1 range coaching (per hour)', cleaning: 'Firearm deep clean & maintenance', children: "Children's firearm safety class", alumni: 'Alumni class',
};
const usd = (n: number) => '$' + n.toFixed(2);
const priceText = (): string => Object.entries(COURSE_PRICING).map(([k, p]) => `${COURSE_NAMES[k] || k}: ${usd(p.base)} standard, ${usd(p.vip)} VIP`).join('. ') + '.';

export const SNIPPETS: readonly Snippet[] = [
  { id: 'faq-why', title: 'Why take a class with Future Initiative', source: 'FAQ', text: 'Future Initiative Firearm Services is built on a zero-intimidation, diagnostic coaching philosophy. Whether you have never touched a firearm or want to refine your draw cadence, Instructor Kai Wade (Certified MSP Qualified Handgun Instructor and NRA Certified) tailors the pace to your comfort. You gain firearm safety proficiency and an understanding of Maryland self-defense law without judgment.' },
  { id: 'faq-live-ammo', title: 'Live ammunition in the classroom', source: 'FAQ', text: 'Safety is absolute. Live ammunition is never brought into the classroom. All live ammunition stays secured in your vehicle trunk until Instructor Kai Wade runs the live-fire portion on the firing line.' },
  { id: 'faq-own-pistol', title: 'Do I need to own a pistol before booking', source: 'FAQ', text: `No. Handgun rentals and safety gear can be arranged at ${RANGE_NAME}. We recommend taking the class first to learn safe mechanics before buying.` },
  { id: 'faq-hql-vs-ccw', title: 'HQL compared with a Wear & Carry permit', source: 'FAQ', text: 'A Handgun Qualification License (HQL) is required in Maryland to purchase, rent or receive a handgun. A Wear & Carry permit is the certification for carrying a concealed handgun in public in Maryland. The Combo class covers both in one curriculum.' },
  { id: 'faq-where', title: 'Where classes and range time happen', source: 'FAQ', text: `The main live-fire range is ${RANGE_NAME}, 115 Holsum Way, ${RANGE_CITY} 21060. Private and paired classes can also be scheduled at partner ranges in Anne Arundel, Baltimore and Howard counties.`, url: MAPS_URL, label: `${RANGE_NAME} on a map` },
  { id: 'faq-msp-time', title: 'How long Maryland State Police permits take', source: 'FAQ', text: 'HQL applications are typically processed in about 14 to 30 days. Wear & Carry applications take about 45 to 90 days. The Student Portal has step-by-step follow-up guides for the MSP application. These are typical times, not promises.' },
  { id: 'bring', title: 'What to bring to class', source: 'Class guide', text: BRING.join(' ') },
  { id: 'expect', title: 'What to expect on class day', source: 'Class guide', text: EXPECT.join(' ') },
  ...GUIDE_ITEMS.map((g, i) => ({ id: 'md-guide-' + i, title: g.title, source: 'Maryland guide (informational only)', text: g.body, url: g.href, label: g.link })),
  { id: 'prices', title: 'Class prices', source: 'Pricing', text: `Class prices before tax: ${priceText()} Maryland sales tax of 6% is added. To reserve a seat you pay at least ${MIN_DEPOSIT_PERCENT}% and can choose to pay more, up to the full amount; paying 100% when you book takes ${Math.round(PAY_IN_FULL_BONUS * 100)}% off tuition. The rest is due at class.` },
  { id: 'booking', title: 'How booking and portal access work', source: 'Portal guide', text: 'Book a class on the website and pay your deposit. After your payment is confirmed you get an email with a secure link to create your portal password. Standard classes start at 9:00 AM on weekends unless Coach Kai tells you a different time. If your instructor sent you an invoice, use the "Pay my invoice" button in that email; you choose how much to pay now, from 30% up to the full total.' },
  { id: 'waiver', title: 'The safety waiver', source: 'Portal guide', text: 'New students sign a safety and liability waiver when they first open the Student Portal, before the rest of the portal opens. It takes a few minutes. Your signed waiver is stored for you.' },
  { id: 'chat', title: 'Chat with Coach Kai', source: 'Portal guide', text: `Use "Chat with me" in your portal to message Coach Kai directly; you do not need to type your name or number. Live chat on the website runs Monday to Friday, 9 AM to 5 PM Eastern. You can also call ${PHONE}.` },
  { id: 'wallet', title: 'The Document Wallet', source: 'Portal guide', text: 'The Wallet keeps your permit card, class certificate, HQL approval or other ID in one private, encrypted place that only you can open. You can store PDF, PNG, JPG or WEBP files up to 3 MB each, up to 20 documents. You can add an expiration date and change it later after a renewal. Please do not upload firearm serial numbers, photos of firearms or where firearms are stored.' },
  { id: 'reminders', title: 'Reminders and notifications', source: 'Portal guide', text: 'In your portal you can turn on reminders for your device: your class day, permit renewal milestones and documents that are about to expire. Notifications are short and never include private details. On iPhone and iPad, add the site to your Home Screen first.' },
  { id: 'journal', title: 'The Range Journal', source: 'Portal guide', text: 'The Range Journal is your private record of range days: the date, range, rounds fired, focus, score and notes. It shows your totals and rounds per month, lets you set goals, and you can export or delete it any time. Staff cannot see it.' },
  { id: 'armory', title: 'The Armory', source: 'Portal guide', text: 'The Armory is a private, encrypted place for your own equipment records and maintenance log. It may still say "coming soon". Please do not enter where you store firearms, safe combinations or home-security details. Staff cannot see it.' },
  { id: 'install', title: 'Installing the app on your phone', source: 'Portal guide', text: 'On iPhone: tap Share, then "Add to Home Screen". On Android: open the browser menu and choose "Install app". Pages you have opened before still load without a signal; signing in and your checklist need a connection.' },
  { id: 'recip', title: 'The Reciprocity Hub', source: 'Portal guide', text: 'The Reciprocity Hub in the portal is a general guide to where permits are honored and the carry rules in each state. It is not legal advice and rules change often. Each state window links to the official source where one is listed. Always confirm with the state\'s official source before you travel armed.' },
  { id: 'contact', title: 'How to reach Coach Kai', source: 'Contact', text: `Call ${PHONE}, use "Chat with me" in your portal, or use live chat on the website Monday to Friday, 9 AM to 5 PM Eastern.` },
];

/** Every link the Guide is allowed to show. It can never show any other link. */
export const ALLOWED_URLS: readonly string[] = Array.from(new Set(SNIPPETS.map((s) => s.url).filter((u): u is string => !!u)));
