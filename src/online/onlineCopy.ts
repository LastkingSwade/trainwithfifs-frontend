// Live Online Classroom wording: one place, used by the booking form, emails and the Student Portal. Pure strings (safe in the browser).
export const ONLINE_NAME = 'Hybrid: Live Online Classroom + In-Person Range Day';
export const ONLINE_SHORT = 'Live Online Classroom';
export const DAY2_STATEMENT = 'Day 2 is the hands-on range day (loading, malfunctions and jams, live fire) and it is always in person at the range.';
export const DAY2_ACK_TEXT = 'I understand Day 2 is mandatory, in person, at the range.';
export const FEE_LABEL = 'Remote-delivery fee';
export const IN_PERSON_BENEFITS = ['face time with the instructor', 'hands-on equipment demos', 'same-room Q&A'] as const;
export const IN_PERSON_NOTE = 'In person: best value. You skip the remote-delivery fee and get ' + IN_PERSON_BENEFITS[0] + ', ' + IN_PERSON_BENEFITS[1] + ' and ' + IN_PERSON_BENEFITS[2] + '.';
export const TECH_REQUIREMENTS = 'To attend the live classroom you need a camera that stays on, a microphone, a steady internet connection, and your photo ID ready for a check at the start.';

// The pitch shown when a student switches on the live online option (booking form).
export const ONLINE_PITCH_TITLE = 'Learn from home. Train hands-on.';
export const ONLINE_BENEFITS: ReadonlyArray<{ icon: string; title: string; text: string }> = [
  { icon: '🏠', title: 'Skip the drive', text: 'Take the classroom day live over video from home. No commute, no parking, no lost afternoon.' },
  { icon: '👨‍🏫', title: 'A real instructor, live', text: 'The same curriculum, with live questions and answers with Lead Instructor Kai Wade. Not a recorded video.' },
  { icon: '🎯', title: 'Then the hands-on day', text: 'Day 2 at the range is where it all clicks: you load, hold, handle and shoot with the instructor beside you.' },
];
export const DAY2_WHY_TITLE = 'Why Day 2 is mandatory and in person';
export const DAY2_WHY = 'You cannot learn to load, hold, aim or clear a jam through a screen, and your live-fire qualification shots have to be shot at the range with the instructor watching. That is why the second day always happens in person.';
