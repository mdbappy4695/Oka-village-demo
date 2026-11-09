/**
 * Draft allocation rules for the Phase 1 demo.
 * Totals on screen come from these functions. The sample file only stores inputs.
 */

export const MONTHLY_PRICE_CENTS = 2_900;
export const ANNUAL_PRICE_CENTS = 99_900;

export const DRAFT_POLICY = {
  version: "v0.1",
  adopted: false,
  communityNumerator: 75,
  communityDenominator: 100,
} as const;

/** Inflows named on screen and kept out of eligible subscription revenue. */
export const EXCLUDED_INFLOWS = [
  "Founding contributions",
  "Pod payments",
  "Events",
  "Workshops",
  "Investment capital",
  "Sponsorships",
  "Grants",
] as const;

export type SubscriptionActivity = {
  monthlyInvoices: number;
  annualInvoices: number;
  discountCents: number;
  refundCents: number;
  chargebackCents: number;
  taxCents: number;
  stripeFeeCents: number;
};

export type MemberSnapshot = {
  activeMonthly: number;
  activeAnnual: number;
  trials: number;
  pastDue: number;
};

export type ResolvedMoney = SubscriptionActivity & {
  grossCents: number;
  eligibleCents: number;
  communityCents: number;
  platformCents: number;
};

export function grossSubscriptionCents(
  activity: Pick<SubscriptionActivity, "monthlyInvoices" | "annualInvoices">,
): number {
  return activity.monthlyInvoices * MONTHLY_PRICE_CENTS + activity.annualInvoices * ANNUAL_PRICE_CENTS;
}

/**
 * Net subscription collections.
 * Taxes are reported beside this figure and do not enter it.
 */
export function eligibleCents(activity: SubscriptionActivity): number {
  return (
    grossSubscriptionCents(activity) -
    activity.discountCents -
    activity.refundCents -
    activity.chargebackCents -
    activity.stripeFeeCents
  );
}

/**
 * Community is 75% of eligible revenue, rounded half-up to the cent.
 * Platform is the remainder, so the two lines add back to the eligible total.
 */
export function splitEligible(eligible: number): { communityCents: number; platformCents: number } {
  if (!Number.isInteger(eligible) || eligible < 0) {
    throw new Error("Eligible revenue must be a non-negative whole number of cents.");
  }
  const { communityNumerator, communityDenominator } = DRAFT_POLICY;
  const communityCents = Math.floor((eligible * communityNumerator + Math.floor(communityDenominator / 2)) / communityDenominator);
  return { communityCents, platformCents: eligible - communityCents };
}

export function activePayingMembers(snapshot: MemberSnapshot): number {
  return snapshot.activeMonthly + snapshot.activeAnnual;
}

export function sumActivity(parts: SubscriptionActivity[]): SubscriptionActivity {
  return parts.reduce<SubscriptionActivity>(
    (total, part) => ({
      monthlyInvoices: total.monthlyInvoices + part.monthlyInvoices,
      annualInvoices: total.annualInvoices + part.annualInvoices,
      discountCents: total.discountCents + part.discountCents,
      refundCents: total.refundCents + part.refundCents,
      chargebackCents: total.chargebackCents + part.chargebackCents,
      taxCents: total.taxCents + part.taxCents,
      stripeFeeCents: total.stripeFeeCents + part.stripeFeeCents,
    }),
    {
      monthlyInvoices: 0,
      annualInvoices: 0,
      discountCents: 0,
      refundCents: 0,
      chargebackCents: 0,
      taxCents: 0,
      stripeFeeCents: 0,
    },
  );
}

export function resolveActivity(activity: SubscriptionActivity): ResolvedMoney {
  const eligible = eligibleCents(activity);
  return {
    ...activity,
    grossCents: grossSubscriptionCents(activity),
    eligibleCents: eligible,
    ...splitEligible(eligible),
  };
}

export const FOUNDING_PRICE_CENTS = 25_000;
export const POD_PRICE_CENTS = 50_000;
export const REFERRAL_NUMERATOR = 10;
export const REFERRAL_DENOMINATOR = 100;
export const POINTS_PER_EVENT = 10;
export const POINTS_PER_ATTENDEE = 1;

export type OperatingInflows = {
  foundingCount: number;
  podCount: number;
  eventCents: number;
  workshopCents: number;
  sponsorshipCents: number;
  grantCents: number;
  investmentCents: number;
};

export type ExpenseInput = {
  developersCents: number;
  operationsCents: number;
  marketingCents: number;
  contractorsCents: number;
  eventExpenseCents: number;
};

export type PoolInput = {
  approvedReferralInvoices: number;
  unapprovedReferralInvoices: number;
  ownReferredMonthlyInvoices: number;
  facilitatorApprovedCents: number;
  facilitatorPaidCents: number;
  eventsDelivered: number;
  verifiedAttendees: number;
};

export type OperatingView = {
  foundingCount: number;
  podCount: number;
  foundingCents: number;
  podCents: number;
  eventInflowCents: number;
  workshopCents: number;
  sponsorshipCents: number;
  grantCents: number;
  otherOperatingCents: number;
  financingCents: number;
};

export type ExpenseView = ExpenseInput & { expenseTotalCents: number };

export type PoolView = {
  approvedReferralCents: number;
  unapprovedReferralCents: number;
  approvedReferralInvoices: number;
  unapprovedReferralInvoices: number;
  ownReferralCents: number;
  ownReferredMonthlyInvoices: number;
  facilitatorApprovedCents: number;
  facilitatorPaidCents: number;
  owedCents: number;
  paidCents: number;
  notYetLiabilityCents: number;
  eventsDelivered: number;
  verifiedAttendees: number;
  points: number;
};

export function referralCommissionCents(invoiceCount: number): number {
  if (!Number.isInteger(invoiceCount) || invoiceCount < 0) {
    throw new Error("Referral invoice count must be a non-negative whole number.");
  }
  const amount = invoiceCount * MONTHLY_PRICE_CENTS * REFERRAL_NUMERATOR;
  if (amount % REFERRAL_DENOMINATOR !== 0) {
    throw new Error("Referral commission must land on a whole cent.");
  }
  return amount / REFERRAL_DENOMINATOR;
}

export function contributionPoints(eventsDelivered: number, verifiedAttendees: number): number {
  return eventsDelivered * POINTS_PER_EVENT + verifiedAttendees * POINTS_PER_ATTENDEE;
}

export function resolveOperating(inflows: OperatingInflows): OperatingView {
  const foundingCents = inflows.foundingCount * FOUNDING_PRICE_CENTS;
  const podCents = inflows.podCount * POD_PRICE_CENTS;
  const otherOperatingCents =
    foundingCents + podCents + inflows.eventCents + inflows.workshopCents + inflows.sponsorshipCents + inflows.grantCents;
  return {
    foundingCount: inflows.foundingCount,
    podCount: inflows.podCount,
    foundingCents,
    podCents,
    eventInflowCents: inflows.eventCents,
    workshopCents: inflows.workshopCents,
    sponsorshipCents: inflows.sponsorshipCents,
    grantCents: inflows.grantCents,
    otherOperatingCents,
    financingCents: inflows.investmentCents,
  };
}

export function resolveExpenses(expenses: ExpenseInput): ExpenseView {
  const expenseTotalCents =
    expenses.developersCents +
    expenses.operationsCents +
    expenses.marketingCents +
    expenses.contractorsCents +
    expenses.eventExpenseCents;
  return { ...expenses, expenseTotalCents };
}

/** Approved referral commissions and the approved facilitator amount are owed. Paid cash is separate. */
export function resolvePool(communityCents: number, input: PoolInput): PoolView {
  const approvedReferralCents = referralCommissionCents(input.approvedReferralInvoices);
  const unapprovedReferralCents = referralCommissionCents(input.unapprovedReferralInvoices);
  const ownReferralCents = referralCommissionCents(input.ownReferredMonthlyInvoices);
  const owedCents = approvedReferralCents + input.facilitatorApprovedCents;
  const paidCents = input.facilitatorPaidCents;
  const notYetLiabilityCents = communityCents - owedCents - paidCents;
  if (notYetLiabilityCents < 0) {
    throw new Error("Approved and paid amounts cannot exceed the community allocation.");
  }
  if (unapprovedReferralCents + ownReferralCents > notYetLiabilityCents) {
    throw new Error("Unapproved commissions must sit inside the amount that is not yet a liability.");
  }
  return {
    approvedReferralCents,
    unapprovedReferralCents,
    approvedReferralInvoices: input.approvedReferralInvoices,
    unapprovedReferralInvoices: input.unapprovedReferralInvoices,
    ownReferralCents,
    ownReferredMonthlyInvoices: input.ownReferredMonthlyInvoices,
    facilitatorApprovedCents: input.facilitatorApprovedCents,
    facilitatorPaidCents: input.facilitatorPaidCents,
    owedCents,
    paidCents,
    notYetLiabilityCents,
    eventsDelivered: input.eventsDelivered,
    verifiedAttendees: input.verifiedAttendees,
    points: contributionPoints(input.eventsDelivered, input.verifiedAttendees),
  };
}
