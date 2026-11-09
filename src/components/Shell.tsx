import { NavLink, Outlet, useSearchParams } from "react-router-dom";
import { SNAPSHOT_LABEL } from "../data/sample-ledger";
import { useDemo } from "../demo/DemoContext";
import { Chip } from "./ui";

const tabs = [
  { to: "/open-accounting", label: "Overview", end: true },
  { to: "/open-accounting/methodology", label: "Methodology", end: false },
  { to: "/open-accounting/earnings", label: "My Earnings", end: false },
  { to: "/open-accounting/contributions", label: "Community Contributions", end: false },
  { to: "/open-accounting/history", label: "Distribution History", end: false },
  { to: "/open-accounting/finances", label: "Company Finances", end: false },
];

export function Shell() {
  const { freshness } = useDemo();
  const stale = freshness === "stale";
  const period = useSearchParams()[0].get("period");

  return (
    <div className="min-h-svh bg-cream pb-40 text-ink">
      <header className="border-b border-sand">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-6 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-serif text-3xl leading-none">Oka</p>
              <p className="mt-5 text-xs font-medium tracking-[0.22em] text-terracotta uppercase">Financial transparency</p>
              <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">Open Accounting</h1>
            </div>
            <p className="text-sm leading-relaxed text-ink/75 sm:text-right">
              Last update
              <span className="mt-1 block font-medium text-ink">{SNAPSHOT_LABEL}</span>
            </p>
          </div>
          <nav aria-label="Open Accounting" className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={period ? `${tab.to}?period=${encodeURIComponent(period)}` : tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                    isActive ? "bg-ink text-cream" : "text-ink/80 hover:bg-sand"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 pt-6">
        <p className="rounded-2xl border border-sage bg-sage-light px-4 py-3 text-sm leading-relaxed" role="status">
          <span className="mr-2 inline-flex align-middle">
            <Chip tone="sample">Sample</Chip>
          </span>
          Sample data. These figures are not from Stripe. Community and platform allocations are estimates, not payments.
        </p>
        {stale && (
          <p className="rounded-2xl border border-golden bg-golden/25 px-4 py-3 text-sm leading-relaxed" role="status">
            <span className="mr-2 inline-flex align-middle">
              <Chip tone="stale">Stale</Chip>
            </span>
            Refresh failed. Showing the last sample snapshot from {SNAPSHOT_LABEL}. These figures may be out of date.
          </p>
        )}
      </div>
      <main className="mx-auto max-w-6xl px-5 pt-8">
        <Outlet />
      </main>
    </div>
  );
}
