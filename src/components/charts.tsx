import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCount, formatUsd } from "../lib/format";

export const chartColors = {
  terracotta: "#bb6a4d",
  sage: "#6fa887",
  golden: "#e0ac51",
  sand: "#e4dacd",
  ink: "#372c24",
};

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

type TipProps = {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
};

function Tip({ active, payload, label, money }: TipProps & { money: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-sand bg-card px-3 py-2 text-sm text-ink shadow-[0_12px_30px_-18px_rgba(55,44,36,0.6)]">
      {label && <p className="font-medium">{label}</p>}
      {payload.map((item) => (
        <p key={item.name} className="mt-1 text-ink/80">
          {item.name}: {money ? formatUsd(Math.round(Number(item.value ?? 0) * 100)) : formatCount(Number(item.value ?? 0))}
        </p>
      ))}
    </div>
  );
}

export function Bars({
  data,
  name,
  color,
  money,
  label,
}: {
  data: { label: string; value: number }[];
  name: string;
  color: string;
  money: boolean;
  label: string;
}) {
  const chartData = data.map((point) => ({ ...point, value: money ? point.value / 100 : point.value }));
  return (
    <div className="mt-4 h-56" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={chartColors.sand} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: chartColors.ink, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(value: number) => (money ? compactUsd.format(value) : formatCount(value))}
            tick={{ fill: chartColors.ink, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<Tip money={money} />} />
          <Bar dataKey="value" name={name} fill={color} radius={[6, 6, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Lines({
  data,
  series,
  money,
  label,
}: {
  data: ({ label: string } & Record<string, string | number>)[];
  series: { key: string; name: string; color: string }[];
  money: boolean;
  label: string;
}) {
  const chartData = data.map((point) => {
    const next: { label: string } & Record<string, string | number> = { label: point.label };
    for (const item of series) {
      const value = Number(point[item.key] ?? 0);
      next[item.key] = money ? value / 100 : value;
    }
    return next;
  });
  return (
    <div className="mt-4" role="img" aria-label={label}>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={chartColors.sand} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: chartColors.ink, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(value: number) => (money ? compactUsd.format(value) : formatCount(value))}
              tick={{ fill: chartColors.ink, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip content={<Tip money={money} />} />
            {series.map((item) => (
              <Line key={item.key} type="monotone" dataKey={item.key} name={item.name} stroke={item.color} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 flex flex-wrap gap-4 text-sm">
        {series.map((item) => (
          <li key={item.key} className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ background: item.color }} />
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Donut({
  slices,
  center,
  label,
  empty,
}: {
  slices: { name: string; cents: number; color: string }[];
  center: string;
  label: string;
  empty: ReactNode;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.cents, 0);
  if (total <= 0) {
    return <div className="mt-4 rounded-2xl bg-sand/60 px-4 py-8 text-sm leading-relaxed text-ink/80">{empty}</div>;
  }
  return (
    <div className="relative mx-auto mt-2 h-64 w-full max-w-xs" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={slices} dataKey="cents" nameKey="name" innerRadius={68} outerRadius={92} paddingAngle={2} stroke="#fffdf8" isAnimationActive={false}>
            {slices.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatUsd(Number(value ?? 0))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <p className="font-serif text-2xl">{center}</p>
      </div>
    </div>
  );
}
