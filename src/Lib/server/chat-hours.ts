// Live chat hours: Monday to Friday, 9:00 AM to 5:00 PM US Eastern. The widget script keeps its own copy of this rule
// (isLiveChatActiveNow in public/scripts/TrainWithFIFS_scripts.js); the tests check that the two agree.
export function isLiveChatHours(when: Date): boolean {
  if (!(when instanceof Date) || Number.isNaN(when.getTime())) return true;
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(when);
    let weekday = '';
    let hour = NaN;
    for (const p of parts) {
      if (p.type === 'weekday') weekday = p.value;
      if (p.type === 'hour') hour = parseInt(p.value, 10);
    }
    if (hour === 24) hour = 0;
    if (!weekday || Number.isNaN(hour)) return true;
    return weekday !== 'Sat' && weekday !== 'Sun' && hour >= 9 && hour < 17;
  } catch {
    return true;
  }
}
