import { describe, expect, it } from "vitest";
import {
  ANNUAL_PRICE_CENTS,
  ANNUAL_RECOGNITION_MONTHS,
  DRAFT_POLICY,
  LIFETIME_PRICE_CENTS,
  LIFETIME_RECOGNITION_MONTHS,
  MONTHLY_PRICE_CENTS,
  POINT_RULES,
  SNAPSHOT,
  SNAPSHOT_AT,
  SNAPSHOT_LABEL,
  activeReferralNumerator,
  canFollowUp,
  canViewEarnings,
  canViewOpenAccounting,
  contributionPoints,
  eligibleCents,
  eventEarningsCents,
  grossMembershipCents,
  growthPercent,
  netBalance,
  nextPayout,
  payoutDateForEarnedMonth,
  presentLeaderboard,
  recognitionSchedule,
  resolveRange,
  splitEligible,
  type MembershipActivity,
} from "./allocate";

const quiet: MembershipActivity = {
  monthlyInvoices: 0,
  annualInvoices: 0,
  lifetimeInvoices: 0,
  discountCents: 0,
  refundCents: 0,
  chargebackCents: 0,
  taxCents: 0,
  processingFeeCents: 0,
};

describe("draft 50/25/25 split", () => {
  it("rounds half-up and gives the remainder to the platform", () => {
    expect(splitEligible(0)).toEqual({ referralCents: 0, contributorCents: 0, platformCents: 0 });
    expect(splitEligible(1)).toEqual({ referralCents: 1, contributorCents: 0, platformCents: 0 });
    expect(splitEligible(2)).toEqual({ referralCents: 1, contributorCents: 1, platformCents: 0 });
    expect(splitEligible(10)).toEqual({ referralCents: 5, contributorCents: 3, platformCents: 2 });
    expect(splitEligible(100)).toEqual({ referralCents: 50, contributorCents: 25, platformCents: 25 });
  });

  it("adds the three lines back to eligible revenue", () => {
    for (const amount of [0, 1, 2, 3, 99, 209_000]) {
      const split = splitEligible(amount);
      expect(split.referralCents + split.contributorCents + split.platformCents).toBe(amount);
    }
  });

  it("rejects a negative eligible amount", () => {
    expect(() => splitEligible(-1)).toThrow(/non-negative/);
  });

  it("does not apply the planned 30 percent rate at the member threshold", () => {
    expect(activeReferralNumerator(0)).toBe(50);
    expect(activeReferralNumerator(DRAFT_POLICY.memberThreshold)).toBe(DRAFT_POLICY.referralNumerator);
    expect(activeReferralNumerator(DRAFT_POLICY.memberThreshold)).not.toBe(DRAFT_POLICY.plannedReferralNumerator);
  });
});

describe("eligible revenue", () => {
  it("uses catalog prices and leaves taxes out of the base", () => {
    expect(eligibleCents({ ...quiet, monthlyInvoices: 1 })).toBe(MONTHLY_PRICE_CENTS);
    expect(eligibleCents({ ...quiet, monthlyInvoices: 1, taxCents: 50_000 })).toBe(MONTHLY_PRICE_CENTS);
    expect(eligibleCents({ ...quiet, annualInvoices: 1 })).toBe(ANNUAL_PRICE_CENTS);
    expect(eligibleCents({ ...quiet, lifetimeInvoices: 1 })).toBe(LIFETIME_PRICE_CENTS);
  });

  it("subtracts discounts, refunds, chargebacks, and processing fees once", () => {
    expect(
      eligibleCents({
        ...quiet,
        monthlyInvoices: 1,
        discountCents: 20,
        refundCents: 30,
        chargebackCents: 100,
        processingFeeCents: 50,
        taxCents: 999,
      }),
    ).toBe(MONTHLY_PRICE_CENTS - 20 - 30 - 100 - 50);
  });
});

describe("points and recognition", () => {
  it("counts points from the sample config and does not turn them into cash", () => {
    expect(POINT_RULES.convertsToCash).toBe(false);
    expect(contributionPoints(2, 5)).toBe(2 * POINT_RULES.perHostedEvent + 5 * POINT_RULES.perVerifiedAttendee);
    expect(eventEarningsCents(0)).toBe(0);
    expect(eventEarningsCents(15_000)).toBe(15_000);
  });

  it("spreads a price across months so the slices add back", () => {
    expect(recognitionSchedule(100, 3)).toEqual([34, 33, 33]);
    const annual = recognitionSchedule(ANNUAL_PRICE_CENTS, ANNUAL_RECOGNITION_MONTHS);
    const lifetime = recognitionSchedule(LIFETIME_PRICE_CENTS, LIFETIME_RECOGNITION_MONTHS);
    expect(annual).toHaveLength(12);
    expect(annual.reduce((sum, part) => sum + part, 0)).toBe(ANNUAL_PRICE_CENTS);
    expect(lifetime.reduce((sum, part) => sum + part, 0)).toBe(LIFETIME_PRICE_CENTS);
    expect(new Set(annual).size).toBe(1);
  });
});

describe("member balance and payouts", () => {
  it("labels a positive balance as available and a negative balance as offset", () => {
    expect(
      netBalance({
        approvedEarningsCents: 10_000,
        creditsCents: 500,
        advancesCents: 1_000,
        deductionsCents: 200,
        previousPayoutsCents: 4_000,
      }),
    ).toMatchObject({ cents: 5_300, tone: "available", title: "Available for payout" });

    const offset = netBalance({
      approvedEarningsCents: 1_000,
      creditsCents: 0,
      advancesCents: 4_000,
      deductionsCents: 0,
      previousPayoutsCents: 0,
    });
    expect(offset.cents).toBe(-3_000);
    expect(offset.tone).toBe("offset");
    expect(offset.title).toBe("Balance to offset");
  });

  it("pays a calendar month on the 20th of the following month", () => {
    expect(payoutDateForEarnedMonth(2026, 11)).toEqual({ iso: "2026-12-20", label: "20 December 2026" });
    expect(payoutDateForEarnedMonth(2026, 12)).toEqual({ iso: "2027-01-20", label: "20 January 2027" });
  });

  it("uses the fixed snapshot for the next payout", () => {
    expect(SNAPSHOT_AT).toBe("2026-11-08T09:40:00.000Z");
    expect(SNAPSHOT_LABEL).toBe("8 November 2026, 09:40 UTC");
    expect(nextPayout(SNAPSHOT)).toMatchObject({
      iso: "2026-11-20",
      coversMonthId: "2026-10",
      coversLabel: "October 2026",
    });
    expect(nextPayout({ year: 2026, month: 11, day: 20 }).coversMonthId).toBe("2026-11");
    expect(nextPayout({ year: 2026, month: 11, day: 20 }).iso).toBe("2026-12-20");
  });
});

describe("access and privacy", () => {
  it("keeps Open Accounting to an active trial or a paying member", () => {
    expect(canViewEarnings("signed-out")).toBe(false);
    expect(canViewEarnings("lapsed")).toBe(true);
    expect(canViewEarnings("trial")).toBe(true);
    expect(canViewEarnings("paying")).toBe(true);
    expect(canViewOpenAccounting("signed-out")).toBe(false);
    expect(canViewOpenAccounting("lapsed")).toBe(false);
    expect(canViewOpenAccounting("trial")).toBe(true);
    expect(canViewOpenAccounting("paying")).toBe(true);
  });

  it("offers follow-up only before a membership is purchased", () => {
    expect(canFollowUp("free-trial")).toBe(true);
    expect(canFollowUp("expired-trial")).toBe(true);
    expect(canFollowUp("active-paid")).toBe(false);
    expect(canFollowUp("cancelled")).toBe(false);
  });

  it("hides names and initials when a member has not opted in", () => {
    const rows = presentLeaderboard([
      { firstName: "Nora", optedIn: true, initials: "NO", referralCount: 4, earningsCents: 8_000 },
      { firstName: "Jules", optedIn: false, initials: "JU", referralCount: 9, earningsCents: 20_000 },
    ]);
    expect(rows[0]).toMatchObject({ displayName: "Anonymous member", initials: null, named: false, earningsCents: 20_000 });
    expect(rows[1]).toMatchObject({ displayName: "Nora", initials: "NO", named: true });
    expect(rows.some((row) => row.displayName.includes("Jules"))).toBe(false);
  });
});

describe("reporting ranges", () => {
  it("defaults the clock to November 2026 and withholds a comparison for today", () => {
    const today = resolveRange("today");
    expect(today.start).toBe("2026-11-08");
    expect(today.end).toBe("2026-11-08");
    expect(today.previousMonthIds).toBeNull();
    expect(growthPercent(10, null)).toBeNull();
    expect(growthPercent(10, 0)).toBeNull();

    const month = resolveRange("month");
    expect(month.monthIds).toEqual(["2026-11"]);
    expect(month.previousMonthIds).toEqual(["2026-10"]);
    expect(month.start).toBe("2026-11-01");
    expect(month.end).toBe("2026-11-30");
  });

  it("builds the partial quarter and the pre-income year", () => {
    const quarter = resolveRange("quarter");
    expect(quarter.monthIds).toEqual(["2026-10", "2026-11"]);
    expect(quarter.previousMonthIds).toEqual(["2026-07", "2026-08", "2026-09"]);

    const history = resolveRange("history", 2025);
    expect(history.monthIds).toHaveLength(12);
    expect(history.monthIds[0]).toBe("2025-01");
    expect(history.previousMonthIds).toBeNull();
    expect(resolveRange("year").previousMonthIds?.[0]).toBe("2025-01");
  });
});

describe("catalog gross", () => {
  it("prices each membership term from the catalog", () => {
    expect(grossMembershipCents({ monthlyInvoices: 2, annualInvoices: 1, lifetimeInvoices: 1 })).toBe(
      2 * MONTHLY_PRICE_CENTS + ANNUAL_PRICE_CENTS + LIFETIME_PRICE_CENTS,
    );
  });
});
