import { ANNUAL_PRICE_CENTS, MONTHLY_PRICE_CENTS, type MemberSnapshot } from "./allocate";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatUsd(cents: number): string {
  return usd.format(cents / 100);
}

export function formatDeduction(cents: number): string {
  if (cents === 0) return formatUsd(0);
  return `−${formatUsd(cents)}`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatShare(partCents: number, wholeCents: number): string {
  if (wholeCents === 0) return "0%";
  const tenths = Math.round((partCents / wholeCents) * 1_000);
  const whole = Math.trunc(tenths / 10);
  const fraction = Math.abs(tenths % 10);
  return fraction === 0 ? `${whole}%` : `${whole}.${fraction}%`;
}

export function grossComposition(activity: { monthlyInvoices: number; annualInvoices: number }): string {
  const monthly = `${formatCount(activity.monthlyInvoices)} monthly ${activity.monthlyInvoices === 1 ? "invoice" : "invoices"} × ${formatUsd(MONTHLY_PRICE_CENTS)}`;
  const annual = `${formatCount(activity.annualInvoices)} annual ${activity.annualInvoices === 1 ? "invoice" : "invoices"} × ${formatUsd(ANNUAL_PRICE_CENTS)}`;
  return `${monthly} and ${annual}.`;
}

export function catalogAdjustmentNote(count: number): string | undefined {
  if (count === 0) return undefined;
  const noun = count === 1 ? "monthly membership" : "monthly memberships";
  return `${formatCount(count)} ${noun} at ${formatUsd(MONTHLY_PRICE_CENTS)}.`;
}

export function memberAside(snapshot: MemberSnapshot & { activePaying: number }): string {
  return `${formatCount(snapshot.activeMonthly)} monthly · ${formatCount(snapshot.activeAnnual)} annual · ${formatCount(snapshot.trials)} on trial · ${formatCount(snapshot.pastDue)} past due`;
}
