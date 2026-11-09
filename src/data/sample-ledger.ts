import {
  activePayingMembers,
  resolveActivity,
  resolveExpenses,
  resolveOperating,
  resolvePool,
  sumActivity,
  MONTHLY_PRICE_CENTS,
  type ExpenseInput,
  type ExpenseView,
  type MemberSnapshot,
  type OperatingInflows,
  type OperatingView,
  type PoolInput,
  type PoolView,
  type ResolvedMoney,
  type SubscriptionActivity,
} from "../lib/allocate";

/** Fixed sample clock. The overview does not read the computer's time. */
export const SNAPSHOT_AT = "2026-11-08T09:40:00.000Z";
export const SNAPSHOT_LABEL = "8 November 2026, 09:40 UTC";

export type PeriodId = "2026-09" | "2026-10" | "2026-11" | "2026-q4";
export type PeriodStatus = "closed" | "open" | "partial";
export type MemberBasis = "period-snapshot" | "latest-snapshot";

type MonthSource = {
  id: Exclude<PeriodId, "2026-q4">;
  label: string;
  shortLabel: string;
  status: "closed" | "open";
  statusLabel: string;
  rangeLabel: string;
  monthlyInvoices: number;
  annualInvoices: number;
  monthlyDiscountInvoices: number;
  monthlyRefundInvoices: number;
  chargebackCents: number;
  taxCents: number;
  stripeFeeCents: number;
  members: MemberSnapshot;
  inflows: OperatingInflows;
  pool: PoolInput;
  expenses: ExpenseInput;
};

export type PeriodView = ResolvedMoney &
  OperatingView &
  ExpenseView &
  PoolView & {
    members: MemberSnapshot & { activePaying: number };
    id: PeriodId;
    label: string;
    shortLabel: string;
    status: PeriodStatus;
    statusLabel: string;
    rangeLabel: string;
    monthlyDiscountInvoices: number;
    monthlyRefundInvoices: number;
    memberBasis: MemberBasis;
    compositionNote?: string;
    operatingCollectionsCents: number;
    totalCashReceivedCents: number;
    platformRemainderCents: number;
    facilitatorNotYetCents: number;
  };

/**
 * The only sample inputs. Discounts and refunds are whole monthly memberships.
 * Stripe fees are chosen so each period stays easy to add by hand.
 * Other receipts, referral counts, approvals, and expenses are inputs too.
 */
const MONTHS: MonthSource[] = [
  {
    id: "2026-09",
    label: "September 2026",
    shortLabel: "September",
    status: "closed",
    statusLabel: "Closed period",
    rangeLabel: "1–30 September 2026",
    monthlyInvoices: 140,
    annualInvoices: 1,
    monthlyDiscountInvoices: 2,
    monthlyRefundInvoices: 1,
    chargebackCents: 0,
    taxCents: 0,
    stripeFeeCents: 14_800,
    members: { activeMonthly: 128, activeAnnual: 5, trials: 9, pastDue: 2 },
    inflows: {
      foundingCount: 2,
      podCount: 1,
      eventCents: 0,
      workshopCents: 0,
      sponsorshipCents: 0,
      grantCents: 0,
      investmentCents: 0,
    },
    pool: {
      approvedReferralInvoices: 20,
      unapprovedReferralInvoices: 0,
      ownReferredMonthlyInvoices: 0,
      facilitatorApprovedCents: 80_000,
      facilitatorPaidCents: 40_000,
      eventsDelivered: 3,
      verifiedAttendees: 30,
    },
    expenses: {
      developersCents: 50_000,
      operationsCents: 20_000,
      marketingCents: 10_000,
      contractorsCents: 8_000,
      eventExpenseCents: 4_000,
    },
  },
  {
    id: "2026-10",
    label: "October 2026",
    shortLabel: "October",
    status: "closed",
    statusLabel: "Closed period",
    rangeLabel: "1–31 October 2026",
    monthlyInvoices: 152,
    annualInvoices: 3,
    monthlyDiscountInvoices: 3,
    monthlyRefundInvoices: 2,
    chargebackCents: 0,
    taxCents: 0,
    stripeFeeCents: 21_400,
    members: { activeMonthly: 141, activeAnnual: 7, trials: 12, pastDue: 3 },
    inflows: {
      foundingCount: 4,
      podCount: 2,
      eventCents: 30_000,
      workshopCents: 15_000,
      sponsorshipCents: 200_000,
      grantCents: 0,
      investmentCents: 500_000,
    },
    pool: {
      approvedReferralInvoices: 30,
      unapprovedReferralInvoices: 0,
      ownReferredMonthlyInvoices: 1,
      facilitatorApprovedCents: 100_000,
      facilitatorPaidCents: 50_000,
      eventsDelivered: 4,
      verifiedAttendees: 48,
    },
    expenses: {
      developersCents: 60_000,
      operationsCents: 25_000,
      marketingCents: 18_000,
      contractorsCents: 12_000,
      eventExpenseCents: 8_000,
    },
  },
  {
    id: "2026-11",
    label: "November 2026",
    shortLabel: "November",
    status: "open",
    statusLabel: "Month in progress",
    rangeLabel: "1–8 November 2026",
    monthlyInvoices: 48,
    annualInvoices: 1,
    monthlyDiscountInvoices: 1,
    monthlyRefundInvoices: 0,
    chargebackCents: 0,
    taxCents: 0,
    stripeFeeCents: 7_200,
    members: { activeMonthly: 146, activeAnnual: 8, trials: 14, pastDue: 4 },
    inflows: {
      foundingCount: 1,
      podCount: 0,
      eventCents: 0,
      workshopCents: 0,
      sponsorshipCents: 0,
      grantCents: 0,
      investmentCents: 0,
    },
    pool: {
      approvedReferralInvoices: 0,
      unapprovedReferralInvoices: 8,
      ownReferredMonthlyInvoices: 0,
      facilitatorApprovedCents: 0,
      facilitatorPaidCents: 0,
      eventsDelivered: 1,
      verifiedAttendees: 8,
    },
    expenses: {
      developersCents: 10_000,
      operationsCents: 4_000,
      marketingCents: 0,
      contractorsCents: 0,
      eventExpenseCents: 0,
    },
  },
];

function activityFrom(source: MonthSource): SubscriptionActivity {
  return {
    monthlyInvoices: source.monthlyInvoices,
    annualInvoices: source.annualInvoices,
    discountCents: source.monthlyDiscountInvoices * MONTHLY_PRICE_CENTS,
    refundCents: source.monthlyRefundInvoices * MONTHLY_PRICE_CENTS,
    chargebackCents: source.chargebackCents,
    taxCents: source.taxCents,
    stripeFeeCents: source.stripeFeeCents,
  };
}

function storyFor(communityCents: number, platformCents: number, inflows: OperatingInflows, pool: PoolInput, expenses: ExpenseInput) {
  const operating = resolveOperating(inflows);
  const obligations = resolvePool(communityCents, pool);
  const costs = resolveExpenses(expenses);
  return {
    ...operating,
    ...obligations,
    ...costs,
    operatingCollectionsCents: communityCents === 0 ? operating.otherOperatingCents : operating.otherOperatingCents,
    totalCashReceivedCents: 0,
    platformRemainderCents: platformCents - costs.expenseTotalCents,
    facilitatorNotYetCents: obligations.notYetLiabilityCents - obligations.unapprovedReferralCents - obligations.ownReferralCents,
  };
}

function withMoney(activity: SubscriptionActivity, members: MemberSnapshot, inflows: OperatingInflows, pool: PoolInput, expenses: ExpenseInput) {
  const resolved = resolveActivity(activity);
  const story = storyFor(resolved.communityCents, resolved.platformCents, inflows, pool, expenses);
  story.operatingCollectionsCents = resolved.eligibleCents + story.otherOperatingCents;
  story.totalCashReceivedCents = story.operatingCollectionsCents + story.financingCents;
  return {
    ...resolved,
    ...story,
    members: { ...members, activePaying: activePayingMembers(members) },
  };
}

function monthView(source: MonthSource): PeriodView {
  return {
    id: source.id,
    label: source.label,
    shortLabel: source.shortLabel,
    status: source.status,
    statusLabel: source.statusLabel,
    rangeLabel: source.rangeLabel,
    monthlyDiscountInvoices: source.monthlyDiscountInvoices,
    monthlyRefundInvoices: source.monthlyRefundInvoices,
    memberBasis: "period-snapshot",
    ...withMoney(activityFrom(source), source.members, source.inflows, source.pool, source.expenses),
  };
}

const MONTH_VIEWS = MONTHS.map(monthView);
const OCTOBER = MONTH_VIEWS.find((period) => period.id === "2026-10");
const NOVEMBER = MONTH_VIEWS.find((period) => period.id === "2026-11");

if (!OCTOBER || !NOVEMBER) {
  throw new Error("October and November sample months are required.");
}

const QUARTER: PeriodView = {
  id: "2026-q4",
  label: "Q4 2026 to date",
  shortLabel: "Q4 to date",
  status: "partial",
  statusLabel: "Partial quarter",
  rangeLabel: "1 October–8 November 2026",
  monthlyDiscountInvoices: OCTOBER.monthlyDiscountInvoices + NOVEMBER.monthlyDiscountInvoices,
  monthlyRefundInvoices: OCTOBER.monthlyRefundInvoices + NOVEMBER.monthlyRefundInvoices,
  memberBasis: "latest-snapshot",
  compositionNote: "October and November only. December has not started. Active paying members stay at the 8 November snapshot and are not added across months.",
  ...withMoney(
    sumActivity([OCTOBER, NOVEMBER]),
    NOVEMBER.members,
    {
      foundingCount: OCTOBER.foundingCount + NOVEMBER.foundingCount,
      podCount: OCTOBER.podCount + NOVEMBER.podCount,
      eventCents: OCTOBER.eventInflowCents + NOVEMBER.eventInflowCents,
      workshopCents: OCTOBER.workshopCents + NOVEMBER.workshopCents,
      sponsorshipCents: OCTOBER.sponsorshipCents + NOVEMBER.sponsorshipCents,
      grantCents: OCTOBER.grantCents + NOVEMBER.grantCents,
      investmentCents: OCTOBER.financingCents + NOVEMBER.financingCents,
    },
    {
      approvedReferralInvoices: OCTOBER.approvedReferralInvoices + NOVEMBER.approvedReferralInvoices,
      unapprovedReferralInvoices: OCTOBER.unapprovedReferralInvoices + NOVEMBER.unapprovedReferralInvoices,
      ownReferredMonthlyInvoices: OCTOBER.ownReferredMonthlyInvoices + NOVEMBER.ownReferredMonthlyInvoices,
      facilitatorApprovedCents: OCTOBER.facilitatorApprovedCents + NOVEMBER.facilitatorApprovedCents,
      facilitatorPaidCents: OCTOBER.facilitatorPaidCents + NOVEMBER.facilitatorPaidCents,
      eventsDelivered: OCTOBER.eventsDelivered + NOVEMBER.eventsDelivered,
      verifiedAttendees: OCTOBER.verifiedAttendees + NOVEMBER.verifiedAttendees,
    },
    {
      developersCents: OCTOBER.developersCents + NOVEMBER.developersCents,
      operationsCents: OCTOBER.operationsCents + NOVEMBER.operationsCents,
      marketingCents: OCTOBER.marketingCents + NOVEMBER.marketingCents,
      contractorsCents: OCTOBER.contractorsCents + NOVEMBER.contractorsCents,
      eventExpenseCents: OCTOBER.eventExpenseCents + NOVEMBER.eventExpenseCents,
    },
  ),
};

export const PERIODS: PeriodView[] = [...MONTH_VIEWS, QUARTER];
export const COMPARISON_MONTHS: PeriodView[] = MONTH_VIEWS;
export const DEFAULT_PERIOD_ID: PeriodId = "2026-10";

export function periodById(id: string | null | undefined): PeriodView | undefined {
  return PERIODS.find((period) => period.id === id);
}

export function periodOrDefault(id: string | null | undefined): PeriodView {
  return periodById(id) ?? periodById(DEFAULT_PERIOD_ID)!;
}
