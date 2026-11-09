import { describe, expect, it } from "vitest";
import { periodById, PERIODS, SNAPSHOT_AT, SNAPSHOT_LABEL } from "../data/sample-ledger";
import {
  ANNUAL_PRICE_CENTS,
  eligibleCents,
  MONTHLY_PRICE_CENTS,
  resolveActivity,
  splitEligible,
  sumActivity,
  type SubscriptionActivity,
} from "./allocate";

function month(id: "2026-09" | "2026-10" | "2026-11") {
  const period = periodById(id);
  if (!period) throw new Error(`Missing ${id}`);
  return period;
}

describe("draft 75/25 split", () => {
  it("rounds half-up to the cent and gives the remainder to the platform", () => {
    expect(splitEligible(0)).toEqual({ communityCents: 0, platformCents: 0 });
    expect(splitEligible(1)).toEqual({ communityCents: 1, platformCents: 0 });
    expect(splitEligible(2)).toEqual({ communityCents: 2, platformCents: 0 });
    expect(splitEligible(3)).toEqual({ communityCents: 2, platformCents: 1 });
    expect(splitEligible(10)).toEqual({ communityCents: 8, platformCents: 2 });
    expect(splitEligible(100)).toEqual({ communityCents: 75, platformCents: 25 });
  });

  it("rejects a negative eligible amount", () => {
    expect(() => splitEligible(-1)).toThrow(/non-negative/);
  });
});

describe("eligible revenue", () => {
  const base: SubscriptionActivity = {
    monthlyInvoices: 1,
    annualInvoices: 0,
    discountCents: 0,
    refundCents: 0,
    chargebackCents: 0,
    taxCents: 0,
    stripeFeeCents: 0,
  };

  it("uses catalog prices and leaves taxes out of the base", () => {
    expect(eligibleCents(base)).toBe(MONTHLY_PRICE_CENTS);
    expect(eligibleCents({ ...base, taxCents: 50_000 })).toBe(MONTHLY_PRICE_CENTS);
    expect(eligibleCents({ ...base, annualInvoices: 1, monthlyInvoices: 0 })).toBe(ANNUAL_PRICE_CENTS);
  });

  it("subtracts discounts, refunds, chargebacks, and Stripe fees", () => {
    expect(
      eligibleCents({
        ...base,
        discountCents: 20,
        refundCents: 30,
        chargebackCents: 100,
        stripeFeeCents: 50,
        taxCents: 999,
      }),
    ).toBe(MONTHLY_PRICE_CENTS - 20 - 30 - 100 - 50);
  });
});

describe("combined periods", () => {
  it("splits the summed eligible revenue once", () => {
    const first: SubscriptionActivity = {
      monthlyInvoices: 1,
      annualInvoices: 0,
      discountCents: 0,
      refundCents: 0,
      chargebackCents: 0,
      taxCents: 500,
      stripeFeeCents: MONTHLY_PRICE_CENTS - 1,
    };
    const second: SubscriptionActivity = { ...first, stripeFeeCents: MONTHLY_PRICE_CENTS - 2, taxCents: 800 };
    expect(eligibleCents(first)).toBe(1);
    expect(eligibleCents(second)).toBe(2);

    const combined = resolveActivity(sumActivity([first, second]));
    expect(combined.eligibleCents).toBe(3);
    expect(combined.taxCents).toBe(1_300);
    expect(combined.communityCents).toBe(splitEligible(3).communityCents);
    expect(combined.communityCents).toBe(2);
    expect(splitEligible(1).communityCents + splitEligible(2).communityCents).toBe(3);
  });
});

describe("sample ledger", () => {
  it("keeps the published snapshot time fixed", () => {
    expect(SNAPSHOT_AT).toBe("2026-11-08T09:40:00.000Z");
    expect(SNAPSHOT_LABEL).toBe("8 November 2026, 09:40 UTC");
  });

  it("adds October by hand from gross charges to the 75/25 split", () => {
    const october = month("2026-10");
    expect(october.grossCents).toBe(740_500);
    expect(october.discountCents).toBe(8_700);
    expect(october.refundCents).toBe(5_800);
    expect(october.chargebackCents).toBe(0);
    expect(october.taxCents).toBe(0);
    expect(october.stripeFeeCents).toBe(21_400);
    expect(october.eligibleCents).toBe(704_600);
    expect(october.communityCents).toBe(528_450);
    expect(october.platformCents).toBe(176_150);
    expect(october.members.activePaying).toBe(148);
    expect(october.members.trials).toBe(12);
    expect(october.members.pastDue).toBe(3);
  });

  it("keeps September and November on the same formula", () => {
    const september = month("2026-09");
    expect(september.eligibleCents).toBe(482_400);
    expect(september.communityCents).toBe(361_800);
    expect(september.platformCents).toBe(120_600);

    const november = month("2026-11");
    expect(november.eligibleCents).toBe(229_000);
    expect(november.communityCents).toBe(171_750);
    expect(november.platformCents).toBe(57_250);
    expect(november.status).toBe("open");
  });

  it("builds the partial quarter from October and November money, and the latest member snapshot", () => {
    const quarter = periodById("2026-q4");
    const october = month("2026-10");
    const november = month("2026-11");
    if (!quarter) throw new Error("Missing quarter");

    expect(quarter.grossCents).toBe(october.grossCents + november.grossCents);
    expect(quarter.discountCents).toBe(october.discountCents + november.discountCents);
    expect(quarter.refundCents).toBe(october.refundCents + november.refundCents);
    expect(quarter.chargebackCents).toBe(october.chargebackCents + november.chargebackCents);
    expect(quarter.stripeFeeCents).toBe(october.stripeFeeCents + november.stripeFeeCents);
    expect(quarter.taxCents).toBe(october.taxCents + november.taxCents);
    expect(quarter.eligibleCents).toBe(october.eligibleCents + november.eligibleCents);
    expect(quarter.communityCents + quarter.platformCents).toBe(quarter.eligibleCents);
    expect(quarter.members.activePaying).toBe(november.members.activePaying);
    expect(quarter.members.activeMonthly).toBe(november.members.activeMonthly);
    expect(quarter.memberBasis).toBe("latest-snapshot");
  });

  it("reconciles every published period to the cent", () => {
    for (const period of PERIODS) {
      expect(period.grossCents).toBe(
        period.monthlyInvoices * MONTHLY_PRICE_CENTS + period.annualInvoices * ANNUAL_PRICE_CENTS,
      );
      expect(period.eligibleCents).toBe(
        period.grossCents - period.discountCents - period.refundCents - period.chargebackCents - period.stripeFeeCents,
      );
      expect(period.communityCents + period.platformCents).toBe(period.eligibleCents);
      expect(period.members.activePaying).toBe(period.members.activeMonthly + period.members.activeAnnual);
      expect(period.taxCents).toBe(0);
      expect(period.owedCents + period.paidCents + period.notYetLiabilityCents).toBe(period.communityCents);
      expect(period.operatingCollectionsCents).toBe(period.eligibleCents + period.otherOperatingCents);
      expect(period.totalCashReceivedCents).toBe(period.operatingCollectionsCents + period.financingCents);
      expect(period.expenseTotalCents).toBe(
        period.developersCents + period.operationsCents + period.marketingCents + period.contractorsCents + period.eventExpenseCents,
      );
      expect(period.platformRemainderCents).toBe(period.platformCents - period.expenseTotalCents);
      expect(period.otherOperatingCents).toBe(
        period.foundingCents + period.podCents + period.eventInflowCents + period.workshopCents + period.sponsorshipCents + period.grantCents,
      );
    }
  });

  it("keeps other receipts and investment out of the 75 percent base", () => {
    const october = month("2026-10");
    expect(october.otherOperatingCents).toBe(445_000);
    expect(october.financingCents).toBe(500_000);
    expect(october.operatingCollectionsCents).toBe(1_149_600);
    expect(october.totalCashReceivedCents).toBe(1_649_600);
    expect(october.eligibleCents).toBe(704_600);
  });

  it("splits the October community pool into owed, paid, and not yet a liability", () => {
    const october = month("2026-10");
    expect(october.approvedReferralCents).toBe(8_700);
    expect(october.facilitatorApprovedCents).toBe(100_000);
    expect(october.owedCents).toBe(108_700);
    expect(october.paidCents).toBe(50_000);
    expect(october.notYetLiabilityCents).toBe(369_750);
    expect(october.ownReferralCents).toBe(290);
    expect(october.ownReferredMonthlyInvoices).toBe(1);
    expect(october.expenseTotalCents).toBe(123_000);
    expect(october.platformRemainderCents).toBe(53_150);
    expect(october.points).toBe(88);
  });

  it("leaves November's open pool unapproved and unpaid", () => {
    const november = month("2026-11");
    expect(november.owedCents).toBe(0);
    expect(november.paidCents).toBe(0);
    expect(november.notYetLiabilityCents).toBe(november.communityCents);
    expect(november.unapprovedReferralCents).toBe(2_320);
    expect(november.operatingCollectionsCents).toBe(254_000);
  });

  it("adds the quarter from October and November without approving November's referrals", () => {
    const quarter = periodById("2026-q4");
    const october = month("2026-10");
    const november = month("2026-11");
    if (!quarter) throw new Error("Missing quarter");
    expect(quarter.operatingCollectionsCents).toBe(october.operatingCollectionsCents + november.operatingCollectionsCents);
    expect(quarter.financingCents).toBe(october.financingCents + november.financingCents);
    expect(quarter.owedCents).toBe(october.owedCents + november.owedCents);
    expect(quarter.paidCents).toBe(october.paidCents + november.paidCents);
    expect(quarter.notYetLiabilityCents).toBe(october.notYetLiabilityCents + november.notYetLiabilityCents);
    expect(quarter.expenseTotalCents).toBe(october.expenseTotalCents + november.expenseTotalCents);
    expect(quarter.approvedReferralCents).toBe(october.approvedReferralCents);
    expect(quarter.unapprovedReferralCents).toBe(november.unapprovedReferralCents);
    expect(quarter.ownReferralCents).toBe(290);
  });
});
