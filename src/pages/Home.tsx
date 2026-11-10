import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Frame } from "../components/Frame";
import { Chip, focusRing } from "../components/ui";
import { useDemo } from "../demo/DemoContext";
import { canViewOpenAccounting } from "../lib/allocate";

const roleCopy = {
  paying: "Paying member",
  trial: "Active seven-day trial",
  lapsed: "Lapsed membership",
  "signed-out": "Signed out",
} as const;

export function Home() {
  const { role } = useDemo();
  const open = canViewOpenAccounting(role);

  useEffect(() => {
    document.title = "Home · One World Family";
  }, []);

  return (
    <Frame>
      <div className="flex flex-col gap-8 pb-6">
        <header>
          <Chip tone="sample">Sample</Chip>
          <h1 className="mt-3 font-serif text-5xl leading-tight">How the family earns and shares</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/80">
            Two views of the same sample books. Your earnings stay private. Open Accounting is the community view.
          </p>
          <p className="mt-3 text-sm text-ink/70">You are in the demo as: {roleCopy[role]}.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            to="/earnings"
            className={`rounded-2xl border border-sand bg-card p-6 shadow-[0_18px_40px_-28px_rgba(55,44,36,0.45)] ${focusRing}`}
          >
            <p className="text-xs font-medium tracking-[0.16em] text-terracotta uppercase">Your account</p>
            <h2 className="mt-3 font-serif text-4xl">Earnings</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/75">
              Invitations, contribution points, advances, and the next payout. Only this member’s records.
            </p>
          </Link>
          {open ? (
            <Link
              to="/open-accounting"
              className={`rounded-2xl border border-sand bg-card p-6 shadow-[0_18px_40px_-28px_rgba(55,44,36,0.45)] ${focusRing}`}
            >
              <p className="text-xs font-medium tracking-[0.16em] text-terracotta uppercase">Community</p>
              <h2 className="mt-3 font-serif text-4xl">Open Accounting</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink/75">
                Membership income, the draft 50/25/25 split, expenses, and growth. No private balances.
              </p>
            </Link>
          ) : (
            <div className="rounded-2xl border border-sand bg-sand/40 p-6" aria-disabled="true">
              <p className="text-xs font-medium tracking-[0.16em] text-terracotta uppercase">Closed</p>
              <h2 className="mt-3 font-serif text-4xl">Open Accounting</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink/75">
                A lapsed membership, an expired trial, or a signed-out visit cannot open this page. The link is removed, and the
                address itself redirects home.
              </p>
            </div>
          )}
        </div>
      </div>
    </Frame>
  );
}
