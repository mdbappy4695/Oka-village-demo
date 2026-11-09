import { useEffect } from "react";
import { AmountList } from "../components/AmountList";
import { PeriodSwitcher, usePeriod } from "../components/PeriodSwitcher";
import { Chip } from "../components/ui";
import { useDemo } from "../demo/DemoContext";
import { POINTS_PER_ATTENDEE, POINTS_PER_EVENT, REFERRAL_NUMERATOR } from "../lib/allocate";
import { formatCount, formatUsd } from "../lib/format";

function PeriodHeading({ title, intro }: { title: string; intro: string }) {
  const { freshness } = useDemo();
  const { period, select } = usePeriod();
  const stale = freshness === "stale";

  useEffect(() => {
    document.title = `${title} · Open Accounting`;
  }, [title]);

  return (
    <div className="flex flex-col gap-8 pb-6">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="sample">Sample</Chip>
          {stale && <Chip tone="stale">Stale</Chip>}
        </div>
        <h2 className="mt-3 font-serif text-4xl sm:text-5xl">{title}</h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/80">{intro}</p>
        <p className="mt-3 text-sm text-ink/70">
          {period.rangeLabel} · {period.statusLabel}
        </p>
        <PeriodSwitcher period={period} onSelect={select} />
      </header>
      <DetailBody title={title} />
    </div>
  );
}

function DetailBody({ title }: { title: string }) {
  const { freshness } = useDemo();
  const { period } = usePeriod();
  const stale = freshness === "stale";

  if (title === "My Earnings") {
    return (
      <section className="max-w-3xl rounded-2xl border border-sand bg-card p-5 sm:p-7">
        <p className="text-sm leading-relaxed text-ink/75">
          This is only your sample balance. No other member’s name or balance is shown.
        </p>
        <AmountList
          stale={stale}
          rows={[
            {
              label: "Your referral commission",
              amount: formatUsd(period.ownReferralCents),
              note:
                period.ownReferredMonthlyInvoices === 0
                  ? "You have no referral commission in this period."
                  : `${formatCount(period.ownReferredMonthlyInvoices)} referred monthly membership at the catalog price, times ${REFERRAL_NUMERATOR}%. Earned in the sample. Not yet approved. Not paid.`,
              chip: "estimated",
              strong: true,
            },
            {
              label: "Approved and unpaid",
              amount: formatUsd(0),
              note: "Your commission is not in the approved total.",
              chip: "owed",
            },
            {
              label: "Already paid to you",
              amount: formatUsd(0),
              chip: "paid",
            },
          ]}
        />
      </section>
    );
  }

  if (title === "Community Contributions") {
    return (
      <section className="max-w-3xl rounded-2xl border border-sand bg-card p-5 sm:p-7">
        <p className="text-sm leading-relaxed text-ink/75">
          A point score is not cash. The approved facilitator amount is a separate sample decision, not a conversion of these points.
        </p>
        <p className="mt-4 font-serif text-4xl tabular-nums">{formatCount(period.points)} points</p>
        <p className="mt-2 text-sm text-ink/70">
          {formatCount(period.eventsDelivered)} events delivered × {POINTS_PER_EVENT} + {formatCount(period.verifiedAttendees)} verified attendees × {POINTS_PER_ATTENDEE}.
        </p>
        <AmountList
          stale={stale}
          rows={[
            {
              label: "Facilitator amount approved and unpaid",
              amount: formatUsd(period.facilitatorApprovedCents),
              chip: "owed",
            },
            {
              label: "Facilitator amount already paid",
              amount: formatUsd(period.facilitatorPaidCents),
              chip: "paid",
            },
            {
              label: "Facilitator amount not yet a liability",
              amount: formatUsd(period.facilitatorNotYetCents),
              note: "This part of the community pool has no approved cash value.",
              chip: "estimated",
            },
          ]}
        />
      </section>
    );
  }

  if (title === "Distribution History") {
    const quiet = period.owedCents === 0 && period.paidCents === 0;
    return (
      <section className="max-w-3xl rounded-2xl border border-sand bg-card p-5 sm:p-7">
        <p className="text-sm leading-relaxed text-ink/75">
          These rows are categories. They do not name a member or a facilitator.
        </p>
        {quiet && (
          <p className="mt-4 leading-relaxed text-ink/80">Nothing is approved or paid in this open period.</p>
        )}
        <AmountList
          stale={stale}
          rows={[
            {
              label: "Referral commissions, approved and unpaid",
              amount: formatUsd(period.approvedReferralCents),
              note: `${formatCount(period.approvedReferralInvoices)} referred monthly memberships at ${REFERRAL_NUMERATOR}%, inside the community allocation.`,
              chip: "owed",
            },
            {
              label: "Facilitator distribution, approved and unpaid",
              amount: formatUsd(period.facilitatorApprovedCents),
              chip: "owed",
            },
            {
              label: "Facilitator distribution, already paid",
              amount: formatUsd(period.paidCents),
              chip: "paid",
              strong: true,
            },
          ]}
        />
        {period.unapprovedReferralCents > 0 && (
          <p className="text-sm leading-relaxed text-ink/75">
            {formatUsd(period.unapprovedReferralCents)} of referral commission is calculated and not yet approved, so it is not owed.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="max-w-3xl rounded-2xl border border-sand bg-card p-5 sm:p-7">
      <p className="text-sm leading-relaxed text-ink/75">
        These are sample operating costs. Investment capital is financing and is not an expense. Stripe fees stay in the subscription bridge and are not repeated here. The gap beside the platform estimate is a comparison, not cash in the bank.
      </p>
      <AmountList
        stale={stale}
        rows={[
          { label: "Developers", amount: formatUsd(period.developersCents) },
          { label: "Operations", amount: formatUsd(period.operationsCents) },
          { label: "Marketing", amount: formatUsd(period.marketingCents) },
          { label: "Contractors", amount: formatUsd(period.contractorsCents) },
          { label: "Events", amount: formatUsd(period.eventExpenseCents) },
          {
            label: "Operating expenses",
            amount: formatUsd(period.expenseTotalCents),
            strong: true,
          },
          {
            label: "Platform allocation",
            amount: formatUsd(period.platformCents),
            note: "Estimated share of eligible subscription revenue.",
            chip: "estimated",
          },
          {
            label: "Platform estimate minus these expenses",
            amount: formatUsd(period.platformRemainderCents),
            note: "A comparison only. It is not a bank balance.",
            chip: "estimated",
          },
        ]}
      />
    </section>
  );
}

export function Earnings() {
  return (
    <PeriodHeading
      title="My Earnings"
      intro="Your own referral commission for the selected period. No other member is named."
    />
  );
}

export function Contributions() {
  return (
    <PeriodHeading
      title="Community Contributions"
      intro="Aggregate facilitator activity for the selected period. Points explain participation. They do not create a cash balance."
    />
  );
}

export function History() {
  return (
    <PeriodHeading
      title="Distribution History"
      intro="Approved amounts that are still unpaid, and cash the sample records as already paid."
    />
  );
}

export function Finances() {
  return (
    <PeriodHeading
      title="Company Finances"
      intro="Where the sample operating expenses went in the selected period."
    />
  );
}
