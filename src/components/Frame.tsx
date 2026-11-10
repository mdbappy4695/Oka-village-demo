import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { SNAPSHOT_LABEL } from "../lib/allocate";
import { canViewEarnings, canViewOpenAccounting } from "../lib/allocate";
import { useDemo } from "../demo/DemoContext";
import { Chip } from "./ui";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `shrink-0 rounded-full px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
    isActive ? "bg-ink text-cream" : "text-ink/80 hover:bg-sand"
  }`;

export function Frame({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { role, freshness } = useDemo();
  const stale = freshness === "stale";
  const signedIn = canViewEarnings(role);
  const width = wide ? "max-w-7xl" : "max-w-6xl";

  return (
    <div className="min-h-svh bg-cream pb-40 text-ink">
      <header className="border-b border-sand">
        <div className={`mx-auto flex ${width} flex-col gap-6 px-5 py-6 sm:py-8`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link to="/" className="font-serif text-3xl leading-none">
                One World Family
              </Link>
              <p className="mt-5 text-xs font-medium tracking-[0.22em] text-terracotta uppercase">Financial transparency</p>
            </div>
            <p className="text-sm leading-relaxed text-ink/75 sm:text-right">
              Last update
              <span className="mt-1 block font-medium text-ink">{SNAPSHOT_LABEL}</span>
            </p>
          </div>
          {signedIn && (
            <nav aria-label="Dashboards" className="flex min-w-0 gap-2 overflow-x-auto pb-1">
              <NavLink to="/" end className={linkClass}>
                Home
              </NavLink>
              <NavLink to="/earnings" className={linkClass}>
                Earnings
              </NavLink>
              {canViewOpenAccounting(role) && (
                <NavLink to="/open-accounting" className={linkClass}>
                  Open Accounting
                </NavLink>
              )}
            </nav>
          )}
        </div>
      </header>
      {signedIn && (
        <div className={`mx-auto flex ${width} flex-col gap-3 px-5 pt-6`}>
          <p className="rounded-2xl border border-sage bg-sage-light px-4 py-3 text-sm leading-relaxed" role="status">
            <span className="mr-2 inline-flex align-middle">
              <Chip tone="sample">Sample</Chip>
            </span>
            Sample data. These figures are not from Stripe. Allocations are a draft, not payments.
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
      )}
      <main className={`mx-auto min-w-0 ${width} px-5 pt-8`}>{children}</main>
    </div>
  );
}
