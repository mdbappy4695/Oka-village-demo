import type { ReactNode } from "react";
import { Chip } from "./ui";

export function AmountList({
  rows,
  stale,
}: {
  stale: boolean;
  rows: {
    label: string;
    amount: string;
    note?: ReactNode;
    chip?: "estimated" | "owed" | "paid" | "excluded";
    strong?: boolean;
  }[];
}) {
  const chipLabel = { estimated: "Estimated", owed: "Owed", paid: "Paid", excluded: "Financing" };
  return (
    <dl className="mt-4 divide-y divide-sand">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
          <dt>
            <span className="flex flex-wrap items-center gap-2 font-medium">
              {row.label}
              {row.chip && <Chip tone={row.chip === "excluded" ? "excluded" : row.chip}>{chipLabel[row.chip]}</Chip>}
              {stale && <Chip tone="stale">Stale</Chip>}
            </span>
            {row.note && <span className="mt-1 block text-sm leading-relaxed text-ink/70">{row.note}</span>}
          </dt>
          <dd className={`font-serif tabular-nums sm:text-right ${row.strong ? "text-3xl" : "text-2xl"}`}>{row.amount}</dd>
        </div>
      ))}
    </dl>
  );
}
