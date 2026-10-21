// The kinds of Admin Hub alert a staff device can choose (shared by the server and the Admin Hub screen). Plain data, nothing private.
export type StaffTopic = 'bookings' | 'payments' | 'messages' | 'progress' | 'visits' | 'problems';
export const STAFF_TOPICS: readonly StaffTopic[] = ['bookings', 'payments', 'messages', 'progress', 'visits', 'problems'];
export const STAFF_TOPIC_LABELS: Record<StaffTopic, string> = {
  bookings: '🎯 New bookings and checkouts', payments: '💳 Payments (online and in person)', messages: '💬 Chats, contact forms and guide downloads',
  progress: '🧭 Multi-state progress and quiz rewards', visits: '🌐 New website visitors', problems: '⚠️ Problems that need a look (sent at any hour)',
};
