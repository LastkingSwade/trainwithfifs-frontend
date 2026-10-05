// Authoritative server-side course pricing. Client-supplied totals are never trusted.

export const COURSE_PRICING: Record<string, { base: number; vip: number }> = {
  mastery: { base: 424.99, vip: 549.99 },
  combo: { base: 249.99, vip: 375.00 },
  ccw: { base: 199.99, vip: 349.99 },
  renewal: { base: 149.99, vip: 249.99 },
  hql: { base: 100.00, vip: 165.00 },
  coaching: { base: 125.00, vip: 195.00 },
  cleaning: { base: 75.00, vip: 115.00 },
  children: { base: 199.99, vip: 265.00 },
  alumni: { base: 65.00, vip: 115.00 }
};

const DEFAULT_TUITION_PER_PERSON = 249.99;
const RANGE_FEE_PER_PERSON = 45.00;
const MD_SALES_TAX_RATE = 0.06;
const DEPOSIT_RATE = 0.30;
export const MAX_ATTENDEES = 5;

// Group discount by attendee count (1 = private, 2 = paired, 3-4 = small group, 5 = large group)
const GROUP_DISCOUNTS: Record<number, number> = { 1: 0, 2: 0.05, 3: 0.10, 4: 0.10, 5: 0.15 };

/**
 * Parses the booking form's group size value (e.g. "4 (Small Group / Family — 10% Discount)" or "5+")
 * into an attendee count. Returns null for anything that is not a whole number from 1 to MAX_ATTENDEES.
 */
export function parseAttendeeCount(groupSize: unknown): number | null {
  if (groupSize === undefined || groupSize === null || String(groupSize).trim() === '') return 1;
  const match = /^(\d+)\+?(?:\s|\(|$)/.exec(String(groupSize).trim());
  if (!match) return null;
  const count = parseInt(match[1], 10);
  if (!Number.isInteger(count) || count < 1 || count > MAX_ATTENDEES) return null;
  return count;
}

function baseTuitionFor(courseSelection: string, isVip: boolean): number {
  const clean = courseSelection.toLowerCase();
  const pick = (key: string) => (isVip ? COURSE_PRICING[key].vip : COURSE_PRICING[key].base);
  if (clean.includes('mastery') || clean.includes('multi-state') || clean.includes('multistate')) return pick('mastery');
  if (clean.includes('renewal')) return pick('renewal');
  if (clean.includes('combo')) return pick('combo');
  if (clean.includes('hql')) return pick('hql');
  if (clean.includes('ccw') || clean.includes('wear & carry')) return pick('ccw');
  if (clean.includes('coaching')) return pick('coaching');
  if (clean.includes('cleaning')) return pick('cleaning');
  if (clean.includes('children')) return pick('children');
  if (clean.includes('alumni')) return pick('alumni');
  return DEFAULT_TUITION_PER_PERSON;
}

const toCents = (dollars: number) => Math.round(dollars * 100);

/**
 * Computes the invoice breakdown. Money values are rounded to whole cents once, so the
 * amount charged in Stripe exactly matches the deposit/total stored on the invoice.
 */
export function calculatePricingBreakdown(courseSelection: string, attendees: number, isPayFull: boolean) {
  const isVip = /VIP/i.test(courseSelection || '');
  const baseTuitionPerPerson = baseTuitionFor(courseSelection || '', isVip);
  const discountPercent = GROUP_DISCOUNTS[attendees] ?? 0;

  const rawTuitionCents = toCents(baseTuitionPerPerson * attendees);
  const discountCents = Math.round(rawTuitionCents * discountPercent);
  const discountedTuitionCents = rawTuitionCents - discountCents;
  // Range lane fee: $45.00 per person on the Base track, included for VIP Turnkey
  const rangeFeeCents = isVip ? 0 : toCents(RANGE_FEE_PER_PERSON * attendees);
  const subtotalCents = discountedTuitionCents + rangeFeeCents;
  const mdTaxCents = Math.round(subtotalCents * MD_SALES_TAX_RATE);
  const grandTotalCents = subtotalCents + mdTaxCents;
  const depositCents = Math.round(grandTotalCents * DEPOSIT_RATE);
  const chargeCents = isPayFull ? grandTotalCents : depositCents;

  return {
    isVip,
    attendees,
    baseTuitionPerPerson,
    discountPercent,
    discountedTuition: discountedTuitionCents / 100,
    rangeFee: rangeFeeCents / 100,
    mdTax: mdTaxCents / 100,
    grandTotal: grandTotalCents / 100,
    depositDueNow: depositCents / 100,
    balanceDueClass: (grandTotalCents - depositCents) / 100,
    grandTotalCents,
    depositCents,
    chargeCents
  };
}
