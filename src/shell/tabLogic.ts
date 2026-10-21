// The five main tabs for a signed-in student or client. Pure decisions (which tabs, which Hub items, which tab is current) so they can be tested without a browser.
export type TabKey = 'home' | 'wallet' | 'armory' | 'range' | 'hub';
export type Role = 'student' | 'client';
export interface Tab { key: TabKey; emoji: string; label: string }
/** Exactly five, in this order, on every screen size. */
export const TABS: readonly Tab[] = [
  { key: 'home', emoji: '🏠', label: 'Home' },
  { key: 'wallet', emoji: '🗂️', label: 'Wallet' },
  { key: 'armory', emoji: '🛡️', label: 'Armory' },
  { key: 'range', emoji: '🎯', label: 'Range' },
  { key: 'hub', emoji: '🧭', label: 'Hub' },
];

/** Which kind of person is looking at their dashboard right now (the dashboards are only on screen after sign-in). Null means: show no tabs. */
export const roleFrom = (studentDashboardShown: boolean, clientDashboardShown: boolean): Role | null => (studentDashboardShown ? 'student' : clientDashboardShown ? 'client' : null);

export interface HubItem { key: string; emoji: string; label: string; hint: string; call?: string; arg?: string | boolean; scrollTo?: 'chat'; href?: string; roles: readonly Role[] }
/** What the Hub menu offers. Every item opens something that already exists in the portals. */
export const HUB_ITEMS: readonly HubItem[] = [
  { key: 'chat', emoji: '💬', label: 'Chat with me', hint: 'Message your instructor', scrollTo: 'chat', roles: ['student', 'client'] },
  { key: 'guide', emoji: '🤖', label: 'Ask the FIFS Guide', hint: 'Quick answers about classes and your portal', call: 'openAiGuide', roles: ['student', 'client'] },
  { key: 'book', emoji: '📅', label: 'Book a class', hint: 'See dates and reserve a seat', call: 'openAndSwitch', arg: 'booking', roles: ['student', 'client'] },
  { key: 'permit', emoji: '🛡️', label: 'Permit & renewal', hint: 'Your permit date and renewal window', call: 'openPermitRenewalModal', roles: ['client'] },
  { key: 'profile', emoji: '👤', label: 'My profile', hint: 'Your details and reminder choices', call: 'openClientProfileModal', roles: ['client'] },
  { key: 'recip', emoji: '🗺️', label: 'Reciprocity Hub', hint: 'Where your permit is honored', call: 'toggleReciprocityHubModal', arg: true, roles: ['student', 'client'] },
  { key: 'drive', emoji: '🚗', label: 'Driving with a firearm', hint: 'Mid-Atlantic transport basics', call: 'openVehicleTravelModal', roles: ['student', 'client'] },
  { key: 'fly', emoji: '✈️', label: 'Flying with a firearm', hint: 'Airline and TSA basics', call: 'openFlyingWithFirearmModal', roles: ['student', 'client'] },
  { key: 'call', emoji: '📞', label: 'Call Coach Kai', hint: '443-990-1304', href: 'tel:+14439901304', roles: ['student', 'client'] },
];
export const hubItemsFor = (role: Role): HubItem[] => HUB_ITEMS.filter((i) => i.roles.includes(role));

/** Which tab looks current: a panel that is open wins, then the Hub sheet, otherwise Home. */
export function currentTab(s: { journalOpen: boolean; walletOpen: boolean; hubOpen: boolean; armoryOpen: boolean }): TabKey {
  return s.journalOpen ? 'range' : s.walletOpen ? 'wallet' : s.armoryOpen ? 'armory' : s.hubOpen ? 'hub' : 'home';
}
export const ARMORY_TEXT = { title: '🛡️ Armory: coming soon', body: 'A private place for your own equipment records is on its way. We will let you know when it is ready. Until then, your Wallet keeps your permit, certificates and approvals safe.' } as const;
