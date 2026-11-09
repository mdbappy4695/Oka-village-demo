import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AmountList } from "../components/AmountList";
import { DashboardCharts } from "../components/DashboardCharts";
import { PeriodSwitcher, usePeriod } from "../components/PeriodSwitcher";
import { Reconciliation } from "../components/Reconciliation";
import { Chip, focusRing } from "../components/ui";
import { useDemo } from "../demo/DemoContext";
import { DRAFT_POLICY } from "../lib/allocate";
import { formatShare, formatUsd, memberAside } from "../lib/format";

export function Overview() {
  const { freshness } = useDemo();
  const stale = freshness === "stale";
  const { period, select } = usePeriod();

  useEffect(() => {
    document.title = "Open Accounting · Oka Village";
  }, []);

  const memberDefinition =
    period.memberBasis === "latest-snapshot"
      ? "Subscriptions active at the 8 November 2026 snapshot. For this partial quarter the count is the latest snapshot, not a sum of months. Trials and past-due subscriptions are listed beside this number and are not included. The count is separate from the invoices collected in the period."
      : "Subscriptions active at the snapshot. Trials and past-due subscriptions are listed beside this number and are not included. The count is separate from the invoices collected in the period.";

  const metrics = [
    {
      label: "Active paying members",
      value: period.members.activePaying.toLocaleString("en-US"),
      aside: memberAside(period.members),
      definition: memberDefinition,
      estimated: false,
    },
    {
      label: "Eligible subscription revenue",
      value: formatUsd(period.eligibleCents),
      aside: period.rangeLabel,
      definition: "Net subscription collections for this period under the draft policy: gross membership charges, minus discounts, refunds, chargebacks, and Stripe fees. Taxes are excluded.",
      estimated: false,
    },
    {
      label: "Community allocation",
      value: formatUsd(period.communityCents),
      aside: `${formatShare(period.communityCents, period.eligibleCents)} of eligible revenue`,
      definition: `${DRAFT_POLICY.communityNumerator}% of eligible subscription revenue, rounded half-up to the cent. Referral rewards sit inside this share. Approved, paid, and not-yet-owed amounts are reported separately.`,
      estimated: true,
    },
    {
      label: "Platform allocation",
      value: formatUsd(period.platformCents),
      aside: `${formatShare(period.platformCents, period.eligibleCents)} of eligible revenue`,
      definition: "The remainder after the community estimate. This is the draft platform share of eligible revenue.",
      estimated: true,
    },
  ];

  return (
    <div className="flex flex-col gap-10 pb-4">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl">Reporting period</h2>
            <p className="mt-2 text-sm text-ink/75">
              {period.rangeLabel} · {period.statusLabel} · US dollars
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip tone="sample">Sample</Chip>
            <Chip tone="period">{period.statusLabel}</Chip>
            {stale && <Chip tone="stale">Stale</Chip>}
          </div>
        </div>
        <PeriodSwitcher period={period} onSelect={select} />
      </section>

      <DashboardCharts period={period} stale={stale} />

      <section className="rounded-2xl border border-sand bg-card p-5 shadow-[0_18px_40px_-28px_rgba(55,44,36,0.45)] sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-serif text-3xl">Answers for this period</h2>
          <Chip tone="sample">Sample</Chip>
          {stale && <Chip tone="stale">Stale</Chip>}
        </div>
        <AmountList
          stale={stale}
          rows={[
            {
              label: "Operating collections",
              amount: formatUsd(period.operatingCollectionsCents),
              note: "Subscription collections plus other operating receipts.",
              strong: true,
            },
            {
              label: "Community allocation",
              amount: formatUsd(period.communityCents),
              note: "Estimated share of eligible subscription revenue. Referral rewards sit inside it.",
              chip: "estimated",
              strong: true,
            },
            {
              label: "Platform allocation",
              amount: formatUsd(period.platformCents),
              note: "Estimated remainder of eligible subscription revenue.",
              chip: "estimated",
              strong: true,
            },
            {
              label: "Approved and unpaid",
              amount: formatUsd(period.owedCents),
              note: "Referral commissions and facilitator amounts that are approved and not yet paid.",
              chip: "owed",
              strong: true,
            },
            {
              label: "Already paid",
              amount: formatUsd(period.paidCents),
              note: "Cash the sample records as disbursed. This amount is separate from the community allocation.",
              chip: "paid",
              strong: true,
            },
            {
              label: "Operating expenses",
              amount: formatUsd(period.expenseTotalCents),
              note: "Sample operating costs. Stripe fees stay in the revenue bridge and are not listed again.",
              strong: true,
            },
          ]}
        />
        <p className="text-sm leading-relaxed text-ink/75">
          {formatUsd(period.notYetLiabilityCents)} of the community allocation is not yet a liability.
          {period.ownReferralCents > 0 ? ` That remainder includes your unapproved referral of ${formatUsd(period.ownReferralCents)}.` : ""}
        </p>
      </section>

      <section className="rounded-2xl border border-sand bg-card p-5 shadow-[0_18px_40px_-28px_rgba(55,44,36,0.45)] sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-serif text-3xl">Where the money came from</h2>
          {stale && <Chip tone="stale">Stale</Chip>}
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/75">
          Operating receipts are income. Investment capital is financing and stays out of income, and out of the 75/25 base.
        </p>
        <AmountList
          stale={stale}
          rows={[
            {
              label: "Subscription collections",
              amount: formatUsd(period.eligibleCents),
              note: "Eligible revenue. This is the only base for the 75/25 estimate.",
            },
            { label: "Founding contributions", amount: formatUsd(period.foundingCents) },
            { label: "Pod payments", amount: formatUsd(period.podCents) },
            { label: "Events", amount: formatUsd(period.eventInflowCents) },
            { label: "Workshops", amount: formatUsd(period.workshopCents) },
            { label: "Sponsorships", amount: formatUsd(period.sponsorshipCents) },
            { label: "Grants", amount: formatUsd(period.grantCents) },
            {
              label: "Operating collections",
              amount: formatUsd(period.operatingCollectionsCents),
              note: "Subscription collections plus the other operating receipts above.",
              strong: true,
            },
            {
              label: "Investment capital",
              amount: formatUsd(period.financingCents),
              note: "Financing. It is not income and it is not an expense.",
              chip: "excluded",
            },
            {
              label: "Total cash received",
              amount: formatUsd(period.totalCashReceivedCents),
              note: "Operating collections plus investment capital.",
              strong: true,
            },
          ]}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-sand bg-card p-5 shadow-[0_18px_40px_-28px_rgba(55,44,36,0.45)]">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-medium tracking-[0.16em] text-terracotta uppercase">{metric.label}</h3>
              {metric.estimated && <Chip tone="estimated">Estimated</Chip>}
              {stale && <Chip tone="stale">Stale</Chip>}
            </div>
            <p className="mt-4 font-serif text-4xl tabular-nums">{metric.value}</p>
            <p className="mt-2 text-sm text-ink/70">{metric.aside}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink/80">{metric.definition}</p>
          </article>
        ))}
      </section>

      <Reconciliation period={period} stale={stale} />

      <p className="text-sm">
        <Link
            to={`/open-accounting/methodology?period=${period.id}`}
          className={`text-terracotta underline decoration-terracotta/40 underline-offset-4 ${focusRing}`}
        >
          Read the draft policy
        </Link>
      </p>
    </div>
  );
}
