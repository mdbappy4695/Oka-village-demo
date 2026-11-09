import type { PeriodView } from "../data/sample-ledger";
import { DRAFT_POLICY } from "../lib/allocate";
import { catalogAdjustmentNote, formatDeduction, formatShare, formatUsd, grossComposition } from "../lib/format";
import { Chip } from "./ui";

export function Reconciliation({ period, stale }: { period: PeriodView; stale: boolean }) {
  const rows = [
    {
      label: "Gross subscription charges",
      amount: formatUsd(period.grossCents),
      note: [grossComposition(period), period.compositionNote].filter(Boolean).join(" "),
      kind: "line" as const,
    },
    {
      label: "Discounts",
      amount: formatDeduction(period.discountCents),
      note: catalogAdjustmentNote(period.monthlyDiscountInvoices),
      kind: "line" as const,
    },
    {
      label: "Refunds",
      amount: formatDeduction(period.refundCents),
      note: catalogAdjustmentNote(period.monthlyRefundInvoices),
      kind: "line" as const,
    },
    {
      label: "Chargebacks",
      amount: formatDeduction(period.chargebackCents),
      note: undefined,
      kind: "line" as const,
    },
    {
      label: "Taxes collected",
      amount: formatUsd(period.taxCents),
      note: "Shown here and left out of eligible revenue.",
      kind: "excluded" as const,
    },
    {
      label: "Stripe processing fees",
      amount: formatDeduction(period.stripeFeeCents),
      note: "Sample processing fees for this period.",
      kind: "line" as const,
    },
    {
      label: "Net eligible revenue",
      amount: formatUsd(period.eligibleCents),
      note: "Gross subscription charges, minus discounts, refunds, chargebacks, and Stripe fees.",
      kind: "total" as const,
    },
    {
      label: "Estimated community allocation",
      amount: formatUsd(period.communityCents),
      note: `${formatShare(period.communityCents, period.eligibleCents)} of eligible revenue. Referral rewards sit inside this share.`,
      kind: "allocation" as const,
    },
    {
      label: "Estimated platform allocation",
      amount: formatUsd(period.platformCents),
      note: `${formatShare(period.platformCents, period.eligibleCents)} of eligible revenue, the remainder after the community estimate.`,
      kind: "allocation" as const,
    },
  ];

  return (
    <section className="rounded-2xl border border-sand bg-card p-5 shadow-[0_18px_40px_-28px_rgba(55,44,36,0.45)] sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-serif text-3xl">How to read this against a Stripe report</h2>
        {stale && <Chip tone="stale">Stale</Chip>}
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/80">
        In the product, finance ties these lines to Stripe reports. In this demo, the lines are the sample itself. Draft policy{" "}
        {DRAFT_POLICY.version} has not been adopted.
      </p>
      <dl className="mt-6 divide-y divide-sand">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
            <dt>
              <span className="flex flex-wrap items-center gap-2 font-medium">
                {row.label}
                {row.kind === "excluded" && <Chip tone="excluded">Excluded</Chip>}
                {row.kind === "allocation" && <Chip tone="estimated">Estimated</Chip>}
                {stale && (row.kind === "total" || row.kind === "allocation") && <Chip tone="stale">Stale</Chip>}
              </span>
              {row.note && <span className="mt-1 block text-sm leading-relaxed text-ink/70">{row.note}</span>}
            </dt>
            <dd className={`font-serif text-2xl tabular-nums sm:text-right ${row.kind === "total" || row.kind === "allocation" ? "text-3xl" : ""}`}>
              {row.amount}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
