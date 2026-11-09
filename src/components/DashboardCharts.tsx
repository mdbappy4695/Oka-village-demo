import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COMPARISON_MONTHS, type PeriodId, type PeriodView } from "../data/sample-ledger";
import { formatShare, formatUsd } from "../lib/format";
import { Chip } from "./ui";

const terracotta = "#bb6a4d";
const sage = "#6fa887";
const sand = "#e4dacd";
const ink = "#372c24";
const golden = "#e0ac51";

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

type Point = {
  id: PeriodId;
  label: string;
  operating: number;
  eligible: number;
};

type TipProps = {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
};

function dollarsToCents(dollars: number) {
  return Math.round(dollars * 100);
}

function monthIncluded(monthId: PeriodId, selectedId: PeriodId) {
  if (selectedId === "2026-q4") return monthId === "2026-10" || monthId === "2026-11";
  return monthId === selectedId;
}

function ChartTip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-sand bg-card px-3 py-2 text-sm text-ink shadow-[0_12px_30px_-18px_rgba(55,44,36,0.6)]">
      <p className="font-medium">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="mt-1 text-ink/80">
          <span className="mr-2 inline-block size-2 rounded-full" style={{ background: item.color }} />
          {item.name}: {formatUsd(dollarsToCents(Number(item.value ?? 0)))}
        </p>
      ))}
    </div>
  );
}

function RankedBars({
  rows,
  scale,
  color,
}: {
  rows: { label: string; cents: number }[];
  scale: number;
  color: string;
}) {
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {rows.map((row) => {
        const width = scale === 0 ? 0 : (row.cents / scale) * 100;
        return (
          <li key={row.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{row.label}</span>
              <span className="tabular-nums">{formatUsd(row.cents)}</span>
            </div>
            <div className="h-2.5 rounded-full bg-sand">
              <div className="h-2.5 rounded-full" style={{ width: `${width}%`, background: color }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function DashboardCharts({ period, stale }: { period: PeriodView; stale: boolean }) {
  const points: Point[] = COMPARISON_MONTHS.map((month) => ({
    id: month.id,
    label: month.status === "open" ? `${month.shortLabel.slice(0, 3)} · Open` : month.shortLabel.slice(0, 3),
    operating: month.operatingCollectionsCents / 100,
    eligible: month.eligibleCents / 100,
  }));

  const slices = [
    { name: "Community", cents: period.communityCents },
    { name: "Platform", cents: period.platformCents },
  ];

  const sources = [
    { label: "Subscription collections", cents: period.eligibleCents },
    { label: "Founding contributions", cents: period.foundingCents },
    { label: "Pod payments", cents: period.podCents },
    { label: "Events", cents: period.eventInflowCents },
    { label: "Workshops", cents: period.workshopCents },
    { label: "Sponsorships", cents: period.sponsorshipCents },
    { label: "Grants", cents: period.grantCents },
  ].sort((left, right) => right.cents - left.cents);

  const expenses = [
    { label: "Developers", cents: period.developersCents },
    { label: "Operations", cents: period.operationsCents },
    { label: "Marketing", cents: period.marketingCents },
    { label: "Contractors", cents: period.contractorsCents },
    { label: "Events", cents: period.eventExpenseCents },
  ].sort((left, right) => right.cents - left.cents);

  const sourceScale = Math.max(...sources.map((row) => row.cents), period.financingCents, 1);
  const expenseScale = Math.max(...expenses.map((row) => row.cents), 1);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-sand bg-card p-5 shadow-[0_18px_40px_-28px_rgba(55,44,36,0.45)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xs font-medium tracking-[0.16em] text-terracotta uppercase">Operating collections</h2>
              <Chip tone="sample">Sample</Chip>
              {stale && <Chip tone="stale">Stale</Chip>}
            </div>
            <p className="mt-2 font-serif text-5xl tabular-nums">{formatUsd(period.operatingCollectionsCents)}</p>
            <p className="mt-1 text-sm text-ink/70">{period.rangeLabel}</p>
          </div>
        </div>
        <div
          className="mt-4 h-64"
          role="img"
          aria-label={`Operating collections and eligible subscription revenue for September, October, and November. Selected period ${period.label} is ${formatUsd(period.operatingCollectionsCents)}.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="operatingFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={terracotta} stopOpacity={0.38} />
                  <stop offset="100%" stopColor={terracotta} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={sand} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: ink, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(value: number) => compactUsd.format(value)}
                tick={{ fill: ink, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip content={<ChartTip />} />
              <Area
                type="monotone"
                dataKey="operating"
                name="Operating collections"
                stroke={terracotta}
                fill="url(#operatingFill)"
                strokeWidth={2.5}
                isAnimationActive={false}
                dot={(props) => {
                  const { cx, cy, payload } = props as { cx?: number; cy?: number; payload?: Point };
                  if (cx == null || cy == null || !payload) return <g />;
                  const selected = monthIncluded(payload.id, period.id);
                  return <circle cx={cx} cy={cy} r={selected ? 6 : 4} fill={selected ? terracotta : "#d1a493"} />;
                }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="eligible"
                name="Eligible subscription revenue"
                stroke={sage}
                fill="transparent"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-2 flex flex-wrap gap-4 text-sm text-ink/80">
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: terracotta }} />
            Operating collections
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: sage }} />
            Eligible subscription revenue
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          November is still open, so its point is the month to date. September is the previous closed month.
        </p>
        <dl className="mt-5 grid gap-4 border-t border-sand pt-5 sm:grid-cols-2 xl:grid-cols-4">
          <Strip label="Eligible subscription revenue" amount={formatUsd(period.eligibleCents)} stale={stale} />
          <Strip label="Other operating receipts" amount={formatUsd(period.otherOperatingCents)} stale={stale} />
          <Strip label="Community allocation" amount={formatUsd(period.communityCents)} stale={stale} estimated />
          <Strip label="Platform allocation" amount={formatUsd(period.platformCents)} stale={stale} estimated />
        </dl>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-sand bg-card p-5 shadow-[0_18px_40px_-28px_rgba(55,44,36,0.45)] sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-3xl">Estimated allocation</h2>
            <Chip tone="estimated">Estimated</Chip>
            {stale && <Chip tone="stale">Stale</Chip>}
          </div>
          <div
            className="relative mx-auto mt-2 h-72 w-full max-w-xs"
            role="img"
            aria-label={`Estimated allocation ${formatUsd(period.communityCents)} community and ${formatUsd(period.platformCents)} platform.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="cents"
                  nameKey="name"
                  innerRadius={72}
                  outerRadius={98}
                  paddingAngle={2}
                  stroke="#fffdf8"
                  strokeWidth={3}
                  isAnimationActive={false}
                >
                  <Cell fill={terracotta} />
                  <Cell fill={sage} />
                </Pie>
                <Tooltip
                  formatter={(value) => formatUsd(Number(value ?? 0))}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="font-serif text-3xl tabular-nums">{formatUsd(period.eligibleCents)}</p>
                <p className="text-xs tracking-[0.14em] text-ink/70 uppercase">Eligible</p>
              </div>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            <li className="flex items-start gap-3 text-sm">
              <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: terracotta }} />
              <span>
                <span className="block font-medium">
                  Community {formatShare(period.communityCents, period.eligibleCents)} · {formatUsd(period.communityCents)}
                </span>
                <span className="text-ink/70">Estimated allocation. Referral rewards sit inside this share.</span>
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: sage }} />
              <span>
                <span className="block font-medium">
                  Platform {formatShare(period.platformCents, period.eligibleCents)} · {formatUsd(period.platformCents)}
                </span>
                <span className="text-ink/70">Estimated allocation of the remaining eligible revenue.</span>
              </span>
            </li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-ink/80">
            This is an estimate of how eligible revenue would be allocated. It is not money paid to members.
          </p>
        </section>

        <section className="rounded-2xl border border-sand bg-card p-5 shadow-[0_18px_40px_-28px_rgba(55,44,36,0.45)] sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-3xl">Sources</h2>
            {stale && <Chip tone="stale">Stale</Chip>}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink/70">Operating receipts, longest first. Investment is financing and is drawn apart from income.</p>
          <RankedBars rows={sources} scale={sourceScale} color={terracotta} />
          <div className="mt-5 border-t border-sand pt-4">
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="flex flex-wrap items-center gap-2 font-medium">
                Investment capital
                <Chip tone="excluded">Financing</Chip>
              </span>
              <span className="tabular-nums">{formatUsd(period.financingCents)}</span>
            </div>
            <div className="h-2.5 rounded-full bg-sand">
              <div
                className="h-2.5 rounded-full"
                style={{ width: `${(period.financingCents / sourceScale) * 100}%`, background: golden }}
              />
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-sand bg-card p-5 shadow-[0_18px_40px_-28px_rgba(55,44,36,0.45)] sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-3xl">Operating expenses</h2>
            {stale && <Chip tone="stale">Stale</Chip>}
          </div>
          <p className="font-serif text-3xl tabular-nums">{formatUsd(period.expenseTotalCents)}</p>
        </div>
        <RankedBars rows={expenses} scale={expenseScale} color={sage} />
        <p className="mt-4 text-sm leading-relaxed text-ink/70">
          The platform estimate of {formatUsd(period.platformCents)} minus these expenses is {formatUsd(period.platformRemainderCents)}. That comparison is not cash in the bank.
        </p>
      </section>
    </div>
  );
}

function Strip({ label, amount, stale, estimated = false }: { label: string; amount: string; stale: boolean; estimated?: boolean }) {
  return (
    <div>
      <dt className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-[0.14em] text-ink/70 uppercase">
        {label}
        {estimated && <Chip tone="estimated">Estimated</Chip>}
        {stale && <Chip tone="stale">Stale</Chip>}
      </dt>
      <dd className="mt-1 font-serif text-2xl tabular-nums">{amount}</dd>
    </div>
  );
}
