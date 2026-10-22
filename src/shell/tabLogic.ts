// The six main tabs for a signed-in student or client. Pure decisions (which tabs, which Hub items, which tab is current) so they can be tested without a browser.
export type TabKey = 'home' | 'wallet' | 'armory' | 'range' | 'reciprocity' | 'hub';
export type Role = 'student' | 'client';
export interface Tab { key: TabKey; emoji: string; label: string; aria?: string }
/** Exactly six, in this order, on every screen size. The States tab opens the 50-State Reciprocity Hub; its label is short so six tabs fit a 320px phone, and its full name is read out by screen readers. */
export const TABS: readonly Tab[] = [
  { key: 'home', emoji: '🏠', label: 'Home' },
  { key: 'wallet', emoji: '🗂️', label: 'Vault' },
  { key: 'armory', emoji: '🛡️', label: 'Armory' },
  { key: 'range', emoji: '🎯', label: 'Range' },
  { key: 'reciprocity', emoji: '🗺️', label: 'States', aria: 'Reciprocity Hub' },
  { key: 'hub', emoji: '🧭', label: 'Hub' },
];

/** Which kind of person is looking at their dashboard right now (the dashboards are only on screen after sign-in). Null means: show no tabs. */
export const roleFrom = (studentDashboardShown: boolean, clientDashboardShown: boolean): Role | null => (studentDashboardShown ? 'student' : clientDashboardShown ? 'client' : null);

export interface HubItem { key: string; emoji: string; label: string; hint: string; call?: string; arg?: string | boolean; scrollTo?: 'chat'; href?: string; roles: readonly Role[] }
/** What the Hub menu offers. Every item opens something that already exists in the portals. (The Reciprocity Hub is not listed here: it has its own States tab.) */
export const HUB_ITEMS: readonly HubItem[] = [
  { key: 'chat', emoji: '💬', label: 'Chat with me', hint: 'Message your instructor', scrollTo: 'chat', roles: ['student', 'client'] },
  { key: 'guide', emoji: '🤖', label: 'Ask the FIFS Guide', hint: 'Quick answers about classes and your portal', call: 'openAiGuide', roles: ['student', 'client'] },
  { key: 'book', emoji: '📅', label: 'Book a class', hint: 'See dates and reserve a seat', call: 'openAndSwitch', arg: 'booking', roles: ['student', 'client'] },
  { key: 'permit', emoji: '🛡️', label: 'Permit & renewal', hint: 'Your permit date and renewal window', call: 'openPermitRenewalModal', roles: ['client'] },
  { key: 'profile', emoji: '👤', label: 'My profile', hint: 'Your details and reminder choices', call: 'openClientProfileModal', roles: ['client'] },
  { key: 'emergency', emoji: '🆘', label: 'Emergency info', hint: '911, 988 and reporting help', href: '/emergency', roles: ['student', 'client'] },
  { key: 'storage', emoji: '🔒', label: 'Storage checklist', hint: 'Simple safe-storage habits', href: '/safe-storage', roles: ['student', 'client'] },
  { key: 'drive', emoji: '🚗', label: 'Driving with a firearm', hint: 'Mid-Atlantic transport basics', call: 'openVehicleTravelModal', roles: ['student', 'client'] },
  { key: 'fly', emoji: '✈️', label: 'Flying with a firearm', hint: 'Airline and TSA basics', call: 'openFlyingWithFirearmModal', roles: ['student', 'client'] },
  { key: 'call', emoji: '📞', label: 'Call Coach Kai', hint: '443-990-1304', href: 'tel:+14439901304', roles: ['student', 'client'] },
];
export const hubItemsFor = (role: Role): HubItem[] => HUB_ITEMS.filter((i) => i.roles.includes(role));

/** Which tab looks current: a panel that is open wins, then the Hub sheet, otherwise Home. */
export function currentTab(s: { journalOpen: boolean; walletOpen: boolean; hubOpen: boolean; armoryOpen: boolean; reciprocityOpen?: boolean }): TabKey {
  return s.journalOpen ? 'range' : s.reciprocityOpen ? 'reciprocity' : s.walletOpen ? 'wallet' : s.armoryOpen ? 'armory' : s.hubOpen ? 'hub' : 'home';
}
export const ARMORY_TEXT = { title: '🛡️ Armory: coming soon', body: 'A private place for your own equipment records is on its way. We will let you know when it is ready. Until then, your Vault keeps your permit, certificates and approvals safe.' } as const;
