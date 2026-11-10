import { describe, expect, it } from "vitest";
import { ANNUAL_PRICE_CENTS, ANNUAL_RECOGNITION_MONTHS, splitEligible } from "../lib/allocate";
import { buildAccounting, buildMemberAccount, memberMonth } from "./views";

describe("sample community", () => {
  it("keeps October on the published 50/25/25 figures", () => {
    const year = buildAccounting("history", 2026);
    expect(year.series.find((point) => point.id === "2026-10")?.eligibleCents).toBe(209_000);
    expect(splitEligible(209_000)).toEqual({ referralCents: 104_500, contributorCents: 52_250, platformCents: 52_250 });
  });

  it("recognizes only one month of the October annual payment", () => {
    const quarter = buildAccounting("quarter");
    const octoberRecognized = quarter.series.find((point) => point.id === "2026-10");
    expect(ANNUAL_PRICE_CENTS / ANNUAL_RECOGNITION_MONTHS).toBe(8_325);
    expect(octoberRecognized?.recognizedCents).toBe(113_100 + 8_325 + 4_165 + 30_000);
    expect(octoberRecognized?.eligibleCents).toBe(209_000);
  });

  it("does not count processing fees twice inside net profit", () => {
    const view = buildAccounting("history", 2026);
    const october = view.series.find((point) => point.id === "2026-10")!;
    expect(view.performance.processingFeeCents).toBe(view.flow.processingFeeCents);
    expect(view.expenseLines.find((line) => line.id === "processing")?.bridge).toBe(true);
    expect(view.operatingCents).toBe(
      view.expenseLines.filter((line) => !line.bridge).reduce((total, line) => total + line.actualCents, 0),
    );
    expect(view.performance.netCents).toBe(
      view.recognized.totalCents -
        view.operatingCents -
        view.flow.processingFeeCents -
        view.flow.depreciationCents -
        view.flow.interestCents -
        view.flow.taxProvisionCents,
    );
    expect(october.eligibleCents).toBeGreaterThan(0);
  });

  it("shows 2025 with expenses and no membership income", () => {
    const year = buildAccounting("history", 2025);
    expect(year.flow.eligibleCents).toBe(0);
    expect(year.allocation.referralCents).toBe(0);
    expect(year.operatingCents).toBeGreaterThan(0);
    expect(year.community.paying).toBe(0);
    expect(year.community.growth.registered).toBeNull();
    expect(year.moneyGrowth.eligible).toBeNull();
    expect(year.moneyGrowth.net).toBeNull();
    expect(year.dividends).toEqual([]);
  });

  it("compares this month with the previous month and withholds today", () => {
    const month = buildAccounting("month");
    expect(month.moneyGrowth.eligible).not.toBeNull();
    expect(month.moneyGrowth.eligible!).toBeLessThan(0);
    expect(month.moneyGrowth.referral).not.toBeNull();
    expect(month.moneyGrowth.expenses).not.toBeNull();
    expect(month.moneyGrowth.net).not.toBeNull();
    expect(buildAccounting("today").moneyGrowth.platform).toBeNull();
    const october = month.series.find((point) => point.id === "2026-11");
    expect(october?.referralCents).toBe(splitEligible(month.flow.eligibleCents).referralCents);
  });

  it("keeps today's activity inside November and withholds a comparison", () => {
    const today = buildAccounting("today");
    const month = buildAccounting("month");
    expect(today.flow.eligibleCents).toBeLessThan(month.flow.eligibleCents);
    expect(today.community.growth.paying).toBeNull();
    expect(today.ledger.every((row) => row.date === "2026-11-08")).toBe(true);
    expect(today.ledger.some((row) => row.source.includes("Stripe"))).toBe(true);
  });

  it("keeps the October fee correction beside the original amount", () => {
    const quarter = buildAccounting("quarter");
    const correction = quarter.ledger.find((row) => row.reference === "FEE-2026-10-R");
    const original = quarter.ledger.find((row) => row.reference === "MBR-2026-10");
    expect(correction?.settlement).toMatch(/original row kept/);
    expect((original?.feeCents ?? 0) + (correction?.feeCents ?? 0)).toBe(4_000);
  });

  it("hides leaderboard names that have not opted in", () => {
    const year = buildAccounting("year");
    const named = year.leaderboard.filter((row) => row.named).map((row) => row.displayName);
    expect(named).toContain("Avery");
    expect(named).not.toContain("Sasha");
    expect(year.leaderboard.some((row) => row.displayName === "Anonymous member")).toBe(true);
    expect(JSON.stringify(year.leaderboard)).not.toContain("Priya");
  });
});

describe("sample member", () => {
  const account = buildMemberAccount();

  it("ties the available balance to the statement and the scheduled payout", () => {
    expect(account.earnedCents).toBe(52_400);
    expect(account.referralCents).toBe(17_400);
    expect(account.contributionCents).toBe(35_000);
    expect(account.adjustmentCents).toBe(-11_400);
    expect(account.paidCents).toBe(23_700);
    expect(account.balance).toMatchObject({ cents: 17_300, tone: "available", title: "Available for payout" });
    expect(account.payouts.find((payout) => payout.status === "Scheduled")?.cents).toBe(17_300);
    expect(account.nextPayout).toMatchObject({ iso: "2026-11-20", coversMonthId: "2026-10" });
  });

  it("keeps October referral credits inside that month's pool", () => {
    const october = memberMonth("2026-10");
    expect(october.earnedCents).toBe(8_700);
    expect(october.priorActiveCents).toBe(2_900);
    expect(october.invitedCount).toBe(2);
    expect(october.payingCount).toBe(1);
    expect(october.earnedCents).toBeLessThanOrEqual(104_500);
  });

  it("leaves a month with no events at zero earnings", () => {
    const july = memberMonth("2026-07");
    expect(july.earnedCents).toBe(2_900);
    const events = account.events.filter((event) => event.date.startsWith("2026-07"));
    expect(events).toHaveLength(0);
    const circle = account.events.find((event) => event.number === "104")!;
    expect(circle.points).toBe(22);
    expect(circle.earningsCents).toBe(0);
  });
});
