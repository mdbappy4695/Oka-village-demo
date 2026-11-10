import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Frame } from "../components/Frame";
import { Bars, Donut, Lines, chartColors } from "../components/charts";
import { Chip, Panel, focusRing } from "../components/ui";
import { useDemo } from "../demo/DemoContext";
import { HISTORY_YEARS } from "../data/sample-ledger";
import { buildAccounting, type AccountingView, type LedgerRow } from "../data/views";
import { DRAFT_POLICY, THRESHOLD_NOTE, growthPercent, type RangeKind } from "../lib/allocate";
import { formatCount, formatGrowth, formatIsoDate, formatShare, formatSigned, formatUsd } from "../lib/format";

const growthMetrics = [
  { id: "members", label: "Total members", money: false },
  { id: "paying", label: "Paying members", money: false },
  { id: "revenue", label: "Membership revenue", money: true },
  { id: "mrr", label: "Monthly recurring revenue", money: true },
  { id: "growth", label: "Revenue growth", money: false },
  { id: "expenses", label: "Expenses", money: true },
  { id: "net", label: "Net result", money: true },
] as const;

type GrowthId = (typeof growthMetrics)[number]["id"];

export function OpenAccounting() {
  const { freshness } = useDemo();
  const stale = freshness === "stale";
  const [kind, setKind] = useState<RangeKind>("month");
  const [year, setYear] = useState<number>(2025);
  const [metric, setMetric] = useState<GrowthId>("members");
  const [ledgerType, setLedgerType] = useState("All");
  const [ledgerQuery, setLedgerQuery] = useState("");
  const [ledgerPage, setLedgerPage] = useState(0);
  const view = buildAccounting(kind, kind === "history" ? year : undefined);

  useEffect(() => {
    document.title = "Open Accounting · One World Family";
  }, []);

  function select(next: RangeKind, historyYear?: number) {
    setKind(next);
    if (historyYear) setYear(historyYear);
    setLedgerPage(0);
    setLedgerType("All");
    setLedgerQuery("");
  }

  return (
    <Frame wide>
      <div className="flex min-w-0 flex-col gap-6 pb-8">
        <header className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-[0.22em] text-terracotta uppercase">One World Family</p>
              <h1 className="mt-2 font-serif text-5xl">Open Accounting</h1>
              <p className="mt-2 max-w-xl text-lg leading-relaxed text-ink/80">See how our community grows, creates value, and shares its prosperity.</p>
            </div>
            <p className="text-sm text-ink/70">
              Last updated
              <span className="mt-1 block font-medium text-ink">{view.updatedLabel}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Reporting range">
            {(
              [
                ["today", "Today"],
                ["month", "This Month"],
                ["quarter", "This Quarter"],
                ["year", "This Year"],
              ] as const
            ).map(([id, label]) => (
              <FilterButton key={id} pressed={kind === id} onClick={() => select(id)}>
                {label}
              </FilterButton>
            ))}
            {HISTORY_YEARS.map((option) => (
              <FilterButton key={option} pressed={kind === "history" && year === option} onClick={() => select("history", option)}>
                {option}
              </FilterButton>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink/70">
            <p>
              {view.range.label}
              {stale ? " · Stale snapshot" : ""}
            </p>
            <a href="#details" className={`text-terracotta underline decoration-terracotta/40 underline-offset-4 ${focusRing}`}>
              Details
            </a>
          </div>
          <p className="text-sm leading-relaxed text-ink/60">An active trial or a paying member can open this page. In the product, the server enforces that rule.</p>
        </header>

        <Metrics view={view} stale={stale} />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <Allocation view={view} />
          </div>
          <div className="min-w-0">
            <Growth view={view} metric={metric} onMetric={setMetric} />
          </div>
        </div>

        <Glance view={view} />

        <div className="grid gap-6 lg:grid-cols-3">
          <ReferralPerformance view={view} />
          <ContributionPerformance view={view} />
          <Earners view={view} />
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <ExpenseSnapshot view={view} />
          <CompanySnapshot view={view} />
          <Ownership view={view} />
          <Distributions view={view} />
        </div>

        <Results view={view} />

        <Participation view={view} />

        <section id="details" className="flex min-w-0 scroll-mt-8 flex-col gap-6">
          <h2 className="font-serif text-3xl">Details</h2>
          <Expenses view={view} />
          <Profit view={view} />
          <Ledger
          rows={view.ledger}
          type={ledgerType}
          query={ledgerQuery}
          page={ledgerPage}
          onType={(value) => {
            setLedgerType(value);
            setLedgerPage(0);
          }}
          onQuery={(value) => {
            setLedgerQuery(value);
            setLedgerPage(0);
          }}
          onPage={setLedgerPage}
        />
          <Controls view={view} />
        </section>
      </div>
    </Frame>
  );
}

function Card({ title, extra, children }: { title: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-sand bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-serif text-2xl">{title}</h2>
        {extra}
      </div>
      {children}
    </article>
  );
}

function Metrics({ view, stale }: { view: AccountingView; stale: boolean }) {
  const membershipCash = view.flow.monthlyCashCents + view.flow.annualCashCents + view.flow.lifetimeCashCents;
  const cards: { label: string; value: string; note: string; paid?: number; growth: number | null }[] = [
    {
      label: "Total membership income",
      value: formatUsd(membershipCash),
      note: "Cash collected from memberships. This is not the base of the allocation chart.",
      growth: null,
    },
    {
      label: "Total referral rewards allocated",
      value: formatUsd(view.allocation.referralCents),
      note: `${DRAFT_POLICY.referralNumerator}% of eligible membership revenue.`,
      paid: view.flow.referralPaidCents,
      growth: view.moneyGrowth.referral,
    },
    {
      label: "Total contributor rewards allocated",
      value: formatUsd(view.allocation.contributorCents),
      note: `${DRAFT_POLICY.contributorNumerator}% under the draft rule for this period.`,
      paid: view.flow.contributorPaidCents,
      growth: view.moneyGrowth.contributor,
    },
    {
      label: "Total platform allocation",
      value: formatUsd(view.allocation.platformCents),
      note: "The remainder. Retained in the sample, not a member payout.",
      growth: view.moneyGrowth.platform,
    },
    {
      label: "Total operating expenses",
      value: formatUsd(view.operatingCents),
      note: "Costs of running the sample. Processing fees and refunds are already in the revenue bridge.",
      growth: view.moneyGrowth.expenses,
    },
    {
      label: "Net financial result",
      value: formatSigned(view.performance.netCents),
      note: "Recognized revenue after costs. The split is not deducted again.",
      growth: view.moneyGrowth.net,
    },
  ];
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <article key={card.label} className="min-w-0 rounded-2xl border border-sand bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xs font-medium tracking-[0.14em] text-terracotta uppercase">{card.label}</h2>
            {stale && <Chip tone="stale">Stale</Chip>}
          </div>
          <p className="mt-3 font-serif text-3xl tabular-nums">{card.value}</p>
          {card.paid !== undefined && <p className="mt-1 text-sm text-ink/70">Paid {formatUsd(card.paid)}</p>}
          <p className="mt-2 text-sm leading-relaxed text-ink/70">{card.note}</p>
          {card.growth !== null && view.range.compareLabel && (
            <p className="mt-3 text-sm text-ink/70">
              <Delta value={card.growth} /> vs {view.range.compareLabel}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function Allocation({ view }: { view: AccountingView }) {
  const platformShare = DRAFT_POLICY.denominator - DRAFT_POLICY.referralNumerator - DRAFT_POLICY.contributorNumerator;
  const slices = [
    { name: `${DRAFT_POLICY.referralNumerator}% — Referral allocation`, cents: view.allocation.referralCents, color: chartColors.terracotta },
    { name: `${DRAFT_POLICY.contributorNumerator}% — Contributor allocation`, cents: view.allocation.contributorCents, color: chartColors.sage },
    { name: `${platformShare}% — Platform allocation`, cents: view.allocation.platformCents, color: chartColors.golden },
  ];
  return (
    <Card title="Allocation" extra={<Chip tone="estimated">Estimated</Chip>}>
      <Donut
        slices={slices}
        center={formatUsd(view.flow.eligibleCents)}
        label="Eligible membership revenue split into three pools"
        empty="No eligible membership revenue in this range, so there is nothing to allocate."
      />
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        <Share
          color={chartColors.terracotta}
          label={`${DRAFT_POLICY.referralNumerator}% — Referral allocation`}
          part={view.allocation.referralCents}
          whole={view.flow.eligibleCents}
          paid={view.flow.referralPaidCents}
        />
        <Share
          color={chartColors.sage}
          label={`${DRAFT_POLICY.contributorNumerator}% — Contributor allocation`}
          part={view.allocation.contributorCents}
          whole={view.flow.eligibleCents}
          paid={view.flow.contributorPaidCents}
        />
        <Share
          color={chartColors.golden}
          label={`${platformShare}% — Platform allocation`}
          part={view.allocation.platformCents}
          whole={view.flow.eligibleCents}
        />
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-ink/70">
        These percentages are the proposed split of eligible membership revenue, after discounts, refunds, chargebacks, and processing fees. They are not a split of all gross cash received.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">{THRESHOLD_NOTE}</p>
    </Card>
  );
}

function Growth({ view, metric, onMetric }: { view: AccountingView; metric: GrowthId; onMetric: (metric: GrowthId) => void }) {
  const selected = growthMetrics.find((item) => item.id === metric)!;
  const data = growthData(view, metric);
  return (
    <Card
      title="Community growth"
      extra={
        <select
          aria-label="Chart metric"
          className="rounded-full border border-sand bg-cream px-3 py-1.5 text-sm"
          value={metric}
          onChange={(event) => onMetric(event.target.value as GrowthId)}
        >
          {growthMetrics.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      }
    >
      {data.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-ink/75">Revenue growth needs an earlier month inside this range.</p>
      ) : (
        <Bars data={data} name={selected.label} color={chartColors.terracotta} money={selected.money} label={`${selected.label} for the selected range`} />
      )}
      <p className="mt-3 text-sm leading-relaxed text-ink/70">{view.runway.note}</p>
      {view.runway.months !== null && <p className="mt-1 text-sm text-ink/70">{view.runway.months} months of sample cash.</p>}
    </Card>
  );
}

function Glance({ view }: { view: AccountingView }) {
  const figures: { label: string; value: string; growth: number | null }[] = [
    { label: "Registered members", value: formatCount(view.community.registered), growth: view.community.growth.registered },
    { label: "Paying members", value: formatCount(view.community.paying), growth: view.community.growth.paying },
    { label: "Trial members", value: formatCount(view.community.trials), growth: view.community.growth.trials },
    { label: "Active members", value: formatCount(view.community.active), growth: null },
    { label: "New members", value: formatCount(view.community.newMembers), growth: view.community.growth.newMembers },
    { label: "Events created", value: formatCount(view.community.eventsCreated), growth: view.community.growth.eventsCreated },
    { label: "Events completed", value: formatCount(view.community.eventsCompleted), growth: null },
    { label: "Credits issued", value: formatCount(view.community.creditsIssued), growth: null },
    { label: "Credits outstanding", value: formatCount(view.community.creditsOutstanding), growth: null },
    { label: "Referral earners", value: formatCount(view.community.referralEarners), growth: null },
    { label: "Contribution earners", value: formatCount(view.community.contributionEarners), growth: null },
  ];
  return (
    <Card title="Community">
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
        {figures.map((figure) => (
          <div key={figure.label} className="min-w-0">
            <dt className="text-xs tracking-[0.12em] text-ink/60 uppercase">{figure.label}</dt>
            <dd className="mt-1 font-serif text-2xl tabular-nums">{figure.value}</dd>
            {figure.growth !== null && view.range.compareLabel && (
              <p className="text-sm text-ink/60">
                <Delta value={figure.growth} />
              </p>
            )}
          </div>
        ))}
      </dl>
    </Card>
  );
}

function ReferralPerformance({ view }: { view: AccountingView }) {
  return (
    <Card title="Referral performance">
      <p className="mt-3 font-serif text-3xl tabular-nums">{formatUsd(view.allocation.referralCents)}</p>
      <p className="mt-1 text-sm text-ink/70">Allocated in {view.range.label}.</p>
      <p className="mt-1 text-sm text-ink/70">Paid {formatUsd(view.flow.referralPaidCents)}</p>
      {view.moneyGrowth.referral !== null && view.range.compareLabel && (
        <p className="mt-2 text-sm text-ink/70">
          <Delta value={view.moneyGrowth.referral} /> vs {view.range.compareLabel}
        </p>
      )}
      <dl className="mt-4 grid gap-3">
        {view.windows.map((window) => (
          <div key={window.label} className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-ink/70">{window.label}</dt>
            <dd className="font-medium tabular-nums">{formatUsd(window.referralAllocatedCents)}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <dt className="text-ink/70">Unpaid referral liability</dt>
          <dd className="font-medium tabular-nums">{formatUsd(view.liabilities.referralUnpaidCents)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <dt className="text-ink/70">Members earning referrals</dt>
          <dd className="font-medium tabular-nums">{formatCount(view.community.referralEarners)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <dt className="text-ink/70">Paying members acquired</dt>
          <dd className="font-medium tabular-nums">{formatCount(view.payingMembersAcquired)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm leading-relaxed text-ink/60">The unpaid liability is cumulative through the sample snapshot.</p>
      <Bars
        data={view.series.map((point) => ({ label: point.label, value: point.referralCents }))}
        name="Referral pool"
        color={chartColors.terracotta}
        money
        label="Referral allocation by month"
      />
    </Card>
  );
}

function ContributionPerformance({ view }: { view: AccountingView }) {
  const unallocated = view.allocation.contributorCents - view.flow.contributorApprovedCents;
  return (
    <Card title="Contribution performance">
      <p className="mt-3 font-serif text-3xl tabular-nums">{formatUsd(view.allocation.contributorCents)}</p>
      <p className="mt-1 text-sm text-ink/70">Allocated in {view.range.label}. Points are not cash.</p>
      <dl className="mt-4 grid gap-3">
        {view.windows.map((window) => (
          <div key={window.label} className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-ink/70">{window.label}</dt>
            <dd className="font-medium tabular-nums">{formatUsd(window.contributorAllocatedCents)}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <dt className="text-ink/70">Approved</dt>
          <dd className="font-medium tabular-nums">{formatUsd(view.flow.contributorApprovedCents)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <dt className="text-ink/70">Paid</dt>
          <dd className="font-medium tabular-nums">{formatUsd(view.flow.contributorPaidCents)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <dt className="text-ink/70">Unallocated</dt>
          <dd className="font-medium tabular-nums">{formatUsd(unallocated)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <dt className="text-ink/70">Eligible contributors</dt>
          <dd className="font-medium tabular-nums">{formatCount(view.community.contributionEarners)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <dt className="text-ink/70">Completed events</dt>
          <dd className="font-medium tabular-nums">{formatCount(view.community.eventsCompleted)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <dt className="text-ink/70">Contribution points</dt>
          <dd className="font-medium tabular-nums">{formatCount(view.flow.points)}</dd>
        </div>
      </dl>
      <Bars
        data={view.series.map((point) => ({ label: point.label, value: point.points }))}
        name="Points"
        color={chartColors.sage}
        money={false}
        label="Contribution points by month"
      />
    </Card>
  );
}

function Earners({ view }: { view: AccountingView }) {
  return (
    <Card title="Referral earners">
      {view.leaderboard.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-ink/75">No approved referral earnings in this range.</p>
      ) : (
        <ol className="mt-4 grid gap-3">
          {view.leaderboard.map((row) => (
            <li key={row.rank} className="flex min-w-0 items-center gap-3 border-b border-sand pb-3 text-sm last:border-0">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand text-xs font-medium" aria-hidden="true">
                {row.initials ?? ""}
              </span>
              <span className="min-w-0">
                <span className="block">
                  <span className="text-ink/50">{row.rank}. </span>
                  {row.displayName}
                </span>
                <span className="text-ink/60">{formatCount(row.referralCount)} referrals</span>
              </span>
              <span className="ml-auto shrink-0 tabular-nums">{formatUsd(row.earningsCents)}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 text-sm leading-relaxed text-ink/60">First names of people who opted in. Everyone else is listed as an anonymous member.</p>
    </Card>
  );
}

function Results({ view }: { view: AccountingView }) {
  return (
    <Card title="Results over this range">
      {view.series.length < 2 ? (
        <p className="mt-4 text-sm leading-relaxed text-ink/75">This range is a single month, so the line needs a quarter, a year, or 2025.</p>
      ) : (
        <Lines
          data={view.series.map((point) => ({
            label: point.label,
            recognized: point.recognizedCents,
            expenses: point.expenseCents,
            net: point.netCents,
          }))}
          series={[
            { key: "recognized", name: "Recognized revenue", color: chartColors.terracotta },
            { key: "expenses", name: "Operating expenses", color: chartColors.sage },
            { key: "net", name: "Net result", color: chartColors.golden },
          ]}
          money
          label="Recognized revenue, operating expenses, and net result"
        />
      )}
    </Card>
  );
}

function ExpenseSnapshot({ view }: { view: AccountingView }) {
  const operating = view.expenseLines
    .filter((line) => !line.bridge && line.actualCents > 0)
    .sort((left, right) => right.actualCents - left.actualCents);
  const colors = [chartColors.terracotta, chartColors.sage, chartColors.golden, chartColors.ink];
  const slices = operating.slice(0, 4).map((line, index) => ({ name: line.label, cents: line.actualCents, color: colors[index]! }));
  const other = operating.slice(4).reduce((total, line) => total + line.actualCents, 0);
  if (other > 0) slices.push({ name: "Other", cents: other, color: chartColors.sand });
  return (
    <Card title="Expenses">
      <Donut slices={slices} center={formatUsd(view.operatingCents)} label="Operating expenses by category" empty="No operating expenses in this range." />
      <p className="mt-3 text-sm text-ink/70">Operating total {formatUsd(view.operatingCents)}</p>
      {view.moneyGrowth.expenses !== null && view.range.compareLabel && (
        <p className="mt-1 text-sm text-ink/70">
          <Delta value={view.moneyGrowth.expenses} /> vs {view.range.compareLabel}
        </p>
      )}
    </Card>
  );
}

function CompanySnapshot({ view }: { view: AccountingView }) {
  const margin = view.recognized.totalCents === 0 ? "—" : `${Math.round((view.performance.ebitdaCents / view.recognized.totalCents) * 1000) / 10}%`;
  const rows = [
    ["Recognized revenue", formatUsd(view.recognized.totalCents)],
    ["Operating expenses", formatUsd(view.operatingCents)],
    ["EBITDA", formatSigned(view.performance.ebitdaCents)],
    ["Margin", margin],
    ["Closing cash", formatUsd(view.cash.closingCents)],
  ] as const;
  return (
    <Card title="Company">
      <dl className="mt-4 grid gap-4">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3">
            <dt className="text-sm text-ink/70">{label}</dt>
            <dd className="font-serif text-xl tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function Ownership({ view }: { view: AccountingView }) {
  return (
    <Card title="Ownership">
      <ul className="mt-4 grid gap-4">
        {view.ownership.map((row) => (
          <li key={row.name} className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{row.name}</p>
              <Chip tone={row.status === "Proposal" ? "proposal" : "paid"}>{row.status}</Chip>
            </div>
            <p className="mt-1 text-sm text-ink/70">
              {row.share} · {row.units} units
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-ink/60">The proposal is not added into the 1,000,000 issued units.</p>
    </Card>
  );
}

function Distributions({ view }: { view: AccountingView }) {
  return (
    <Card title="Dividends">
      {view.dividends.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-ink/75">No dividend has been declared. Forecast profit is not a distribution.</p>
      ) : (
        <ul className="mt-4 grid gap-3 text-sm">
          {view.dividends.map((row) => (
            <li key={row.id}>{formatUsd(row.cents)}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Participation({ view }: { view: AccountingView }) {
  const credits = [
    ["Issued", formatCount(view.community.creditsIssued)],
    ["Redeemed", formatCount(view.flow.creditsRedeemed)],
    ["Outstanding", formatCount(view.community.creditsOutstanding)],
    ["Exchanged", formatCount(view.community.creditsExchanged)],
  ] as const;
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <article className="min-w-0 rounded-2xl border border-sand bg-card p-5">
        <h2 className="font-serif text-2xl">Credits</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4">
          {credits.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs tracking-[0.12em] text-ink/60 uppercase">{label}</dt>
              <dd className="mt-1 font-serif text-2xl tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-ink/70">A community credit is not cash and not a dollar liability.</p>
      </article>
      <article className="min-w-0 rounded-2xl border border-sand bg-card p-5">
        <h2 className="font-serif text-2xl">Homes</h2>
        <p className="mt-3 font-serif text-3xl tabular-nums">{formatCount(view.community.homes)}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          {formatCount(view.community.hostingNights)} hosting nights and {formatCount(view.community.completedStays)} completed stays in this range.
        </p>
      </article>
      <article className="min-w-0 rounded-2xl border border-sand bg-card p-5">
        <h2 className="font-serif text-2xl">Skills</h2>
        <p className="mt-3 font-serif text-3xl tabular-nums">{formatCount(view.community.skillsOffered)}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">{formatCount(view.community.skillExchanges)} exchanges in this range. Not cash earnings.</p>
      </article>
    </div>
  );
}


function Expenses({ view }: { view: AccountingView }) {
  return (
    <Panel id="expenses" title="Company expenses">
      <p className="mt-3 text-sm leading-relaxed text-ink/75">
        The same dates as the rest of this page. Processing fees and refunds are listed so they can be seen, and they are marked because they already reduced revenue.
        {view.flow.eligibleCents === 0 && view.operatingCents > 0 ? " This range is before membership income." : ""}
        {view.range.kind === "today" ? " Budgets are monthly, so Today has no budget comparison." : ""}
      </p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        <Mini label="Operating expenses" value={formatUsd(view.operatingCents)} />
        <Mini label="Fixed" value={formatUsd(view.fixedCents)} />
        <Mini label="Variable" value={formatUsd(view.variableCents)} />
      </dl>
      <h3 className="mt-6 font-medium">Expenses by category</h3>
      <Bars
        data={[...view.expenseLines]
          .filter((line) => line.actualCents > 0)
          .sort((left, right) => right.actualCents - left.actualCents)
          .map((line) => ({ label: line.label.split(" ")[0] ?? line.label, value: line.actualCents }))}
        name="Actual"
        color={chartColors.sage}
        money
        label="Expenses by category"
      />
      <h3 className="mt-6 font-medium">Monthly expense trend</h3>
      <Bars
        data={view.series.map((point) => ({ label: point.label, value: point.expenseCents }))}
        name="Operating expenses"
        color={chartColors.terracotta}
        money
        label="Monthly expense trend"
      />
      <div className="mt-4 max-w-full overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs tracking-[0.12em] text-terracotta uppercase">
            <tr>
              {["Category", "Kind", "Actual", "Budget", "Variance"].map((heading) => (
                <th key={heading} className="py-2 pr-3 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.expenseLines.map((line) => (
              <tr key={line.id} className="border-t border-sand">
                <td className="py-3 pr-3">
                  {line.label}
                  {line.bridge ? " · Already in the revenue bridge" : ""}
                </td>
                <td className="py-3 pr-3 capitalize">{line.kind}</td>
                <td className="py-3 pr-3">{formatUsd(line.actualCents)}</td>
                <td className="py-3 pr-3">{view.range.kind === "today" ? "—" : formatUsd(line.budgetCents)}</td>
                <td className="py-3 pr-3">{view.range.kind === "today" ? "—" : formatSigned(line.budgetCents - line.actualCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {view.range.kind !== "today" && (
        <p className="mt-3 text-sm text-ink/70">
          Budget for operating costs {formatUsd(view.budgetOperatingCents)}. Actual operating costs {formatUsd(view.operatingCents)}.
        </p>
      )}
    </Panel>
  );
}

function Profit({ view }: { view: AccountingView }) {
  const rows = [
    ["Monthly memberships, recognized", formatUsd(view.recognized.monthlyCents)],
    ["Annual memberships, recognized", formatUsd(view.recognized.annualCents)],
    ["Lifetime memberships, recognized", formatUsd(view.recognized.lifetimeCents)],
    ["Other revenue", formatUsd(view.recognized.otherCents)],
    ["Total recognized revenue", formatUsd(view.recognized.totalCents)],
    ["Membership cash receipts", formatUsd(view.flow.monthlyCashCents + view.flow.annualCashCents + view.flow.lifetimeCashCents)],
    ["Cost of services", formatSigned(-view.performance.costOfServicesCents)],
    ["Gross profit", formatSigned(view.performance.grossProfitCents)],
    ["Payroll and contractors", formatSigned(-view.performance.payrollCents)],
    ["Technology", formatSigned(-view.performance.technologyCents)],
    ["Marketing", formatSigned(-view.performance.marketingCents)],
    ["Administration", formatSigned(-view.performance.administrationCents)],
    ["Referral rewards paid", formatSigned(-view.performance.referralPaidCents)],
    ["Contributor rewards paid", formatSigned(-view.performance.contributorPaidCents)],
    ["Other operating costs", formatSigned(-view.performance.otherCents)],
    ["Payment processing fees", formatSigned(-view.performance.processingFeeCents)],
    ["EBITDA", formatSigned(view.performance.ebitdaCents)],
    ["Depreciation and amortization", formatSigned(-view.performance.depreciationCents)],
    ["Interest", formatSigned(-view.performance.interestCents)],
    ["Taxes", formatSigned(-view.performance.taxCents)],
    ["Net profit or loss", formatSigned(view.performance.netCents)],
  ];
  return (
    <Panel id="profit" title="Profit and loss" extra={<Chip tone="sample">Actual</Chip>}>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/75">
        Annual and lifetime cash is recognized over {12} and {60} months under a draft rule. Cash received and revenue earned are different lines. The 50/25/25
        split is not deducted again here. Refunds and chargebacks already reduced membership cash.
      </p>
      <dl className="mt-4 divide-y divide-sand">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-3 text-sm">
            <dt>{label}</dt>
            <dd className="font-serif text-2xl tabular-nums">{value}</dd>
          </div>
        ))}
        {view.performance.forecastRecognizedCents !== null && (
          <div className="flex items-baseline justify-between gap-4 py-3 text-sm">
            <dt>Forecast recognized revenue · not actual</dt>
            <dd className="font-serif text-2xl">{formatUsd(view.performance.forecastRecognizedCents)}</dd>
          </div>
        )}
        {view.performance.forecastExpenseCents !== null && (
          <div className="flex items-baseline justify-between gap-4 py-3 text-sm">
            <dt>Forecast expenses · not actual</dt>
            <dd className="font-serif text-2xl">{formatUsd(view.performance.forecastExpenseCents)}</dd>
          </div>
        )}
      </dl>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Mini label="Opening cash" value={formatUsd(view.cash.openingCents)} />
        <Mini label="Cash movement" value={formatSigned(view.cash.receiptsCents - view.cash.outflowsCents)} />
        <Mini label="Closing cash" value={formatUsd(view.cash.closingCents)} />
      </div>
    </Panel>
  );
}

function growthData(view: AccountingView, metric: GrowthId): { label: string; value: number }[] {
  if (metric === "growth") {
    return view.series.slice(1).flatMap((point, index) => {
      const previous = view.series[index]?.eligibleCents ?? null;
      const percent = growthPercent(point.eligibleCents, previous);
      if (percent === null) return [];
      return [{ label: point.label, value: percent }];
    });
  }
  return view.series.map((point) => {
    const value = {
      members: point.members,
      paying: point.paying,
      revenue: point.eligibleCents,
      mrr: point.mrrCents,
      expenses: point.expenseCents,
      net: point.netCents,
      growth: 0,
    }[metric];
    return { label: point.label, value };
  });
}

function Ledger({
  rows,
  type,
  query,
  page,
  onType,
  onQuery,
  onPage,
}: {
  rows: LedgerRow[];
  type: string;
  query: string;
  page: number;
  onType: (value: string) => void;
  onQuery: (value: string) => void;
  onPage: (page: number) => void;
}) {
  const types = useMemo(() => ["All", ...new Set(rows.map((row) => row.type))], [rows]);
  const filtered = rows.filter((row) => {
    const matchesType = type === "All" || row.type === type;
    const haystack = `${row.reference} ${row.category} ${row.type}`.toLowerCase();
    return matchesType && haystack.includes(query.trim().toLowerCase());
  });
  const pageSize = 8;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const visible = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <Panel id="ledger" title="Transaction ledger">
      <p className="mt-3 text-sm leading-relaxed text-ink/75">
        Aggregated sample rows. No card numbers, bank details, or another member’s balance. A correction stays beside the original row.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="text-sm">
          Type
          <select
            className="mt-1 block rounded-full border border-sand bg-cream px-4 py-2"
            value={type}
            onChange={(event) => onType(event.target.value)}
          >
            {types.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Search
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            className="mt-1 block rounded-full border border-sand bg-cream px-4 py-2"
            placeholder="Reference or category"
          />
        </label>
      </div>
      <div className="mt-4 max-w-full overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-xs tracking-[0.12em] text-terracotta uppercase">
            <tr>
              {["Date", "Type", "Reference", "Category", "Gross", "Fees", "Net", "Allocation", "Settlement", "Source"].map((heading) => (
                <th key={heading} className="py-2 pr-3 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={10} className="py-4 text-ink/70">
                  No transactions in this filter.
                </td>
              </tr>
            )}
            {visible.map((row) => (
              <tr key={row.id} className="border-t border-sand align-top">
                <td className="py-3 pr-3">{formatIsoDate(row.date)}</td>
                <td className="py-3 pr-3">{row.type}</td>
                <td className="py-3 pr-3">{row.reference}</td>
                <td className="py-3 pr-3">{row.category}</td>
                <td className="py-3 pr-3">{formatSigned(row.grossCents)}</td>
                <td className="py-3 pr-3">{formatSigned(row.feeCents)}</td>
                <td className="py-3 pr-3">{formatSigned(row.netCents)}</td>
                <td className="py-3 pr-3">{row.allocation}</td>
                <td className="py-3 pr-3">{row.settlement}</td>
                <td className="py-3 pr-3">{row.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-3 text-sm">
        <button type="button" className={`rounded-full bg-sand px-4 py-2 ${focusRing}`} disabled={safePage === 0} onClick={() => onPage(safePage - 1)}>
          Previous
        </button>
        <p>
          Page {safePage + 1} of {pages}
        </p>
        <button
          type="button"
          className={`rounded-full bg-sand px-4 py-2 ${focusRing}`}
          disabled={safePage >= pages - 1}
          onClick={() => onPage(safePage + 1)}
        >
          Next
        </button>
      </div>
    </Panel>
  );
}

function Controls({ view }: { view: AccountingView }) {
  const glossary = [
    ["Estimated", "A draft allocation. It can change when a policy is adopted."],
    ["Approved", "An amount the sample has accepted and not yet paid."],
    ["Paid", "Cash the sample records as disbursed."],
    ["Advance", "Cash paid ahead of an approved earning, to be offset later."],
    ["Deduction", "An agreed reduction of the member balance."],
    ["Deferred", "Cash collected for a membership that is not yet recognized as revenue."],
    ["Community credit", "A participation count. Not a dollar and not a financial liability."],
    ["Reconciled", "Tied to a source report by finance. Nothing on this screen is reconciled."],
  ];
  return (
    <Panel id="controls" title="Financial controls and glossary">
      <p className="mt-3 text-sm leading-relaxed text-ink/75">
        Draft, approved, and published stay separate. This entire screen is a draft sample. No statement has a publication date.
      </p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <Mini label="Membership receipts" value="Draft · not reconciled" />
        <Mini label="Expenses" value="Draft · reviewed-sheet stand-in" />
        <Mini label="Deferred revenue" value={formatUsd(view.deferred.totalCents)} />
        <Mini label="Unpaid referral liability" value={formatUsd(view.liabilities.referralUnpaidCents)} />
        <Mini label="Unpaid contributor liability" value={formatUsd(view.liabilities.contributorUnpaidCents)} />
        <Mini label="Accounts payable" value={formatUsd(view.liabilities.payableCents)} />
        <Mini label="Accounts receivable" value={formatUsd(view.liabilities.receivableCents)} />
        <Mini label="Tax provision in this range" value={formatUsd(view.flow.taxProvisionCents)} />
        <Mini label="Refunds and chargebacks" value={formatUsd(view.flow.refundCents + view.flow.chargebackCents)} />
        <Mini label="Publication date" value="Not published" />
      </dl>
      <div className="mt-6 grid gap-3">
        {glossary.map(([term, meaning]) => (
          <div key={term} className="rounded-2xl border border-sand px-4 py-3">
            <p className="font-medium">{term}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/75">{meaning}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function FilterButton({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm ${focusRing} ${pressed ? "bg-terracotta text-white" : "bg-sand text-ink"}`}
    >
      {children}
    </button>
  );
}

function Share({ color, label, part, whole, paid }: { color: string; label: string; part: number; whole: number; paid?: number }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: color }} />
      <span>
        <span className="block font-medium">
          {label} {formatShare(part, whole)} · {formatUsd(part)}
        </span>
        {paid !== undefined && <span className="text-ink/70">Paid in this range {formatUsd(paid)}</span>}
      </span>
    </li>
  );
}

function Delta({ value }: { value: number | null }) {
  const text = formatGrowth(value);
  if (!text || value === null) return null;
  return (
    <span className="text-sm text-ink/70">
      {value > 0 ? "↑" : value < 0 ? "↓" : ""} {text}
    </span>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-[0.12em] text-ink/60 uppercase">{label}</dt>
      <dd className="mt-1 font-serif text-2xl tabular-nums">{value}</dd>
    </div>
  );
}
