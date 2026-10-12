// One set of thin-line icons (24x24, one stroke weight) and the emoji each one replaces. Used by the emoji upgrader (emojiToIcons.ts) so every screen
// shows the same consistent icons instead of emoji, which look different on every phone. Emoji that are not listed here are left exactly as they are.
export type Shape = readonly [tag: 'path' | 'circle' | 'rect', attrs: Readonly<Record<string, string | number>>];
export interface IconDef { label: string; shapes: readonly Shape[] }

const p = (d: string): Shape => ['path', { d }];
const c = (cx: number, cy: number, r: number, filled = false): Shape => ['circle', filled ? { cx, cy, r, fill: 'currentColor' } : { cx, cy, r }];
const r = (x: number, y: number, w: number, h: number, rx = 0): Shape => ['rect', { x, y, width: w, height: h, rx }];

export const ICONS: Record<string, IconDef> = {
  crown: { label: 'VIP', shapes: [p('M4 18 3 7l5 4 4-6 4 6 5-4-1 11z'), p('M4 21h16')] },
  target: { label: 'Target', shapes: [c(12, 12, 9), c(12, 12, 5), c(12, 12, 1, true)] },
  warning: { label: 'Warning', shapes: [p('M12 3.5 2.5 20h19z'), p('M12 10v5'), c(12, 17.5, 0.7, true)] },
  shield: { label: 'Shield', shapes: [p('M12 3 5 6v5.5c0 4.4 3 7.5 7 9.5 4-2 7-5.1 7-9.5V6z'), p('m9 12 2.2 2.2L15.5 10')] },
  laptop: { label: 'Online', shapes: [r(4, 5, 16, 11, 1.5), p('M2.5 19.5h19')] },
  bolt: { label: 'Fast', shapes: [p('M13 3 5 13.5h6L10 21l8-10.5h-6z')] },
  burst: { label: 'Burst', shapes: [p('M12 3l1.8 5.2L19 6l-2.2 5L21 13l-5.4 1.2L17 20l-5-3-5 3 1.4-5.8L3 13l4.2-2L5 6l5.2 2.2z')] },
  star: { label: 'Star', shapes: [p('m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.8z')] },
  refresh: { label: 'Refresh', shapes: [p('M20 11a8 8 0 0 0-14.5-3.5L4 9'), p('M4 4v5h5'), p('M4 13a8 8 0 0 0 14.5 3.5L20 15'), p('M20 20v-5h-5')] },
  chat: { label: 'Chat', shapes: [p('M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z'), c(9, 12, 0.8, true), c(12, 12, 0.8, true), c(15, 12, 0.8, true)] },
  map: { label: 'Map', shapes: [p('M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z'), p('M9 4v13.5M15 6.5V20')] },
  key: { label: 'Key', shapes: [c(8, 15, 4), p('M11 12 20 3'), p('M16 7l2.5 2.5')] },
  calendar: { label: 'Date', shapes: [r(3.5, 5, 17, 15, 2), p('M3.5 10h17'), p('M8 3v4M16 3v4')] },
  document: { label: 'Document', shapes: [p('M6 3h8l4 4v14H6z'), p('M14 3v4h4'), p('M9 12h6M9 16h6')] },
  timer: { label: 'Time', shapes: [c(12, 13.5, 7), p('M12 10v4l2.5 1.5'), p('M9.5 3h5')] },
  plane: { label: 'Travel', shapes: [p('M21 3 3 10.5l7 2.5 2.5 7z'), p('M10 13 21 3')] },
  lock: { label: 'Secure', shapes: [r(5, 11, 14, 9, 2), p('M8 11V8a4 4 0 0 1 8 0v3')] },
  scales: { label: 'Legal', shapes: [p('M12 4v16M6 20h12'), p('M5 7h14'), p('M5 7l-2.5 6a3 3 0 0 0 5 0z'), p('M19 7l-2.5 6a3 3 0 0 0 5 0z')] },
  pistol: { label: 'Firearm', shapes: [p('M3 8.5h15.5V12H12l-1 2.5H9.2L10 12H3z'), p('M6.2 12l-1.2 6h3.6l.9-4')] },
  clipboard: { label: 'Checklist', shapes: [r(6, 4, 12, 17, 2), p('M9 4h6v3H9z'), p('M9 12h6M9 16h4')] },
  trash: { label: 'Delete', shapes: [p('M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v6M14 11v6')] },
  book: { label: 'Guide', shapes: [p('M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z'), p('M5 17a3 3 0 0 1 3-3h11')] },
  car: { label: 'Drive', shapes: [p('M4 14l2-5.5A2 2 0 0 1 7.9 7h8.2a2 2 0 0 1 1.9 1.5L20 14'), r(3, 14, 18, 4, 1), c(7, 18, 1.4), c(17, 18, 1.4)] },
  signal: { label: 'Live', shapes: [c(6, 18, 1.4, true), p('M6 11a7 7 0 0 1 7 7'), p('M6 6a12 12 0 0 1 12 12')] },
  mail: { label: 'Email', shapes: [r(3, 5, 18, 14, 2), p('m3 7 9 6 9-6')] },
  phone: { label: 'Phone', shapes: [p('M6.5 3.5H9l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5V17a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z')] },
  mobile: { label: 'Phone', shapes: [r(7, 3, 10, 18, 2), p('M11 18h2')] },
  inbox: { label: 'Download', shapes: [p('M4 13l2-8h12l2 8v6H4z'), p('M4 13h5l1 2h4l1-2h5')] },
  eye: { label: 'View', shapes: [p('M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z'), c(12, 12, 3)] },
  cap: { label: 'Graduate', shapes: [p('M2 9l10-5 10 5-10 5z'), p('M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5'), p('M22 9v6')] },
  help: { label: 'Help', shapes: [c(12, 12, 9), p('M9.6 9.4a2.5 2.5 0 1 1 3.6 2.2c-.8.5-1.2 1-1.2 1.9'), c(12, 17, 0.7, true)] },
  bell: { label: 'Alert', shapes: [p('M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z'), p('M10 20a2 2 0 0 0 4 0')] },
  save: { label: 'Save', shapes: [p('M4 4h13l3 3v13H4z'), p('M8 4v5h8V4'), p('M8 20v-6h8v6')] },
  backpack: { label: 'Bring', shapes: [r(6, 8, 12, 13, 4), p('M9 8V6a3 3 0 0 1 6 0v2'), p('M6 15h12')] },
  rocket: { label: 'Launch', shapes: [p('M12 3c3.5 2.5 5 6 5 10l-2.5 2.5h-5L7 13c0-4 1.5-7.5 5-10z'), c(12, 10, 1.6), p('M7 13l-3 3 3 .5M17 13l3 3-3 .5'), p('M10.5 18.5 12 21l1.5-2.5')] },
  user: { label: 'Person', shapes: [c(12, 8, 3.6), p('M4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5')] },
  users: { label: 'People', shapes: [c(9, 8, 3), p('M3 20c.5-3.5 3-5 6-5s5.5 1.5 6 5'), c(17, 9, 2.5), p('M16 14c3 0 4.5 1.6 5 5')] },
  building: { label: 'Building', shapes: [p('M3 21h18M5 21V10l7-5 7 5v11'), p('M10 21v-5h4v5')] },
  box: { label: 'Package', shapes: [p('M3.5 8 12 4l8.5 4v8L12 20l-8.5-4z'), p('M3.5 8 12 12l8.5-4M12 12v8')] },
  home: { label: 'Home', shapes: [p('M3 11 12 3l9 8'), p('M5 9.5V20h5v-6h4v6h5V9.5')] },
  globe: { label: 'Web', shapes: [c(12, 12, 9), p('M3 12h18'), p('M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18')] },
  siren: { label: 'Alert', shapes: [p('M7 18v-6a5 5 0 0 1 10 0v6'), r(5, 18, 14, 3, 1), p('M12 3v2M4 6l1.5 1.5M20 6 18.5 7.5')] },
  memo: { label: 'Notes', shapes: [p('M5 4h10l4 4v12H5z'), p('M9 15l5.5-5.5 2 2L11 17H9z')] },
  glasses: { label: 'Eye protection', shapes: [c(7, 14, 3.5), c(17, 14, 3.5), p('M10.5 14h3'), p('M3.5 14 5 8M20.5 14 19 8')] },
  shirt: { label: 'Clothing', shapes: [p('M8 4 3 7l2.5 4L8 10v10h8V10l2.5 1L21 7l-5-3a4 4 0 0 1-8 0z')] },
  check: { label: 'Done', shapes: [c(12, 12, 9), p('m8 12.3 2.6 2.6L16 9.5')] },
  arrow: { label: 'Next', shapes: [p('M5 12h14'), p('M13 6l6 6-6 6')] },
  pin: { label: 'Location', shapes: [p('M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11z'), c(12, 10, 2.2)] },
  chart: { label: 'Stats', shapes: [p('M4 20V10M10 20V4M16 20v-7M22 20H2')] },
  card: { label: 'Payment', shapes: [r(3, 5.5, 18, 13, 2), p('M3 10h18'), p('M6.5 15h4')] },
  dollar: { label: 'Money', shapes: [c(12, 12, 9), p('M12 6.5v11'), p('M14.6 9.4c-.5-1-1.5-1.6-2.6-1.6-1.5 0-2.6.8-2.6 2 0 2.8 5.2 1.6 5.2 4.2 0 1.2-1.1 2-2.6 2-1.1 0-2.1-.6-2.6-1.6')] },
  search: { label: 'Search', shapes: [c(11, 11, 6), p('M16 16l5 5')] },
  award: { label: 'Award', shapes: [c(12, 9, 5.5), p('M8.5 13.5 7 21l5-2.5 5 2.5-1.5-7.5')] },
  compass: { label: 'Directions', shapes: [c(12, 12, 9), p('m15.5 8.5-2 5-5 2 2-5z')] },
  gift: { label: 'Gift', shapes: [r(3.5, 9, 17, 11, 1.5), p('M3.5 13h17M12 9v11'), p('M12 9c-2 0-4.5-1-4.5-3S10 3.5 12 9c2-5.5 4.5-3 4.5-1s-2.5 3-4.5 3z')] },
  print: { label: 'Print', shapes: [p('M7 9V3.5h10V9'), r(4, 9, 16, 8, 2), r(7, 14, 10, 6.5, 1)] },
  flame: { label: 'Hot', shapes: [p('M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .5 1.5 1.5 2 2.5 2C11.5 9 11 6 12 3z')] },
  gear: { label: 'Settings', shapes: [c(12, 12, 3), p('M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1')] },
  door: { label: 'Exit', shapes: [p('M6 21V4h12v17'), p('M4 21h16'), c(15, 13, 0.8, true)] },
  dotGreen: { label: 'Online', shapes: [['circle', { cx: 12, cy: 12, r: 6, fill: '#22c55e', stroke: 'none' }]] },
  dotRed: { label: 'Offline', shapes: [['circle', { cx: 12, cy: 12, r: 6, fill: '#ef4444', stroke: 'none' }]] },
};

// emoji (without the invisible variation selector) -> icon name
export const EMOJI_TO_ICON: Record<string, string> = {
  '👑': 'crown', '🎯': 'target', '⚠': 'warning', '🛡': 'shield', '💻': 'laptop', '⚡': 'bolt', '💥': 'burst', '⭐': 'star', '🔄': 'refresh', '💬': 'chat',
  '🗺': 'map', '🔑': 'key', '📅': 'calendar', '🗓': 'calendar', '📄': 'document', '📜': 'document', '⏱': 'timer', '✈': 'plane', '🔒': 'lock', '🔐': 'lock', '⚖': 'scales',
  '🔫': 'pistol', '📋': 'clipboard', '🗑': 'trash', '📘': 'book', '📖': 'book', '📚': 'book', '🚗': 'car', '📡': 'signal', '✉': 'mail', '📞': 'phone', '📱': 'mobile',
  '📥': 'inbox', '👁': 'eye', '🎓': 'cap', '❓': 'help', '🔔': 'bell', '💾': 'save', '🎒': 'backpack', '🚀': 'rocket', '👤': 'user', '👨': 'user', '👩': 'user',
  '👧': 'user', '👥': 'users', '🤝': 'users', '🏫': 'building', '🏢': 'building', '📦': 'box', '🏠': 'home', '🌐': 'globe', '🚨': 'siren', '📝': 'memo',
  '👓': 'glasses', '👕': 'shirt', '✅': 'check', '👉': 'arrow', '📌': 'pin', '📊': 'chart', '💳': 'card', '💵': 'dollar', '💰': 'dollar', '💲': 'dollar',
  '🔍': 'search', '🎖': 'award', '🧭': 'compass', '🎁': 'gift', '🖨': 'print', '🔥': 'flame', '⚙': 'gear', '🚪': 'door', '🟢': 'dotGreen', '🔴': 'dotRed',
};

export const iconNameFor = (emoji: string): string | undefined => EMOJI_TO_ICON[emoji.replace(/️/g, '')];
