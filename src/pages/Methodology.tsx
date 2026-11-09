import { useEffect } from "react";
import { Reconciliation } from "../components/Reconciliation";
import { Chip, Eyebrow } from "../components/ui";
import { periodById, SNAPSHOT_LABEL } from "../data/sample-ledger";
import { useDemo } from "../demo/DemoContext";
import {
  ANNUAL_PRICE_CENTS,
  DRAFT_POLICY,
  EXCLUDED_INFLOWS,
  FOUNDING_PRICE_CENTS,
  MONTHLY_PRICE_CENTS,
  POD_PRICE_CENTS,
  POINTS_PER_ATTENDEE,
  POINTS_PER_EVENT,
  REFERRAL_NUMERATOR,
} from "../lib/allocate";
import { formatUsd } from "../lib/format";

const glossary = [
  {
    term: "Estimated",
    meaning: "A figure produced by the draft policy from sample subscription activity. It can change when a policy is adopted.",
  },
  {
    term: "Reconciled",
    meaning: "A figure a finance administrator has tied to Stripe reports for a closed period. This demo does not mark any figure reconciled.",
  },
  {
    term: "Owed",
    meaning: "Approved and not yet paid. In this sample, that is approved referral commissions plus the approved facilitator amount.",
  },
  {
    term: "Paid",
    meaning: "Cash the sample records as disbursed. A paid amount is separate from the community allocation.",
  },
  {
    term: "Accrued",
    meaning: "An amount treated as owed under a final policy, even when cash has not moved. This demo uses Owed for the approved unpaid sample amounts.",
  },
];

export function Methodology() {
  const { freshness } = useDemo();
  const october = periodById("2026-10");

  useEffect(() => {
    document.title = "Methodology · Open Accounting";
  }, []);

  if (!october) throw new Error("October sample is required.");

  return (
    <article className="flex max-w-3xl flex-col gap-10 pb-6">
      <header>
        <Eyebrow>Draft policy · {DRAFT_POLICY.version} · Not yet adopted</Eyebrow>
        <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Financial methodology</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink/80">
          This page is the rule behind every figure on the overview. The policy is a draft for the demo. It has not been adopted.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h3 className="font-serif text-3xl">Eligible revenue</h3>
        <p className="leading-relaxed text-ink/80">
          Eligible revenue is net subscription collections in the reporting period. Monthly membership is {formatUsd(MONTHLY_PRICE_CENTS)} and annual membership is {formatUsd(ANNUAL_PRICE_CENTS)}.
        </p>
        <p className="rounded-2xl bg-sand px-4 py-4 leading-relaxed">
          Eligible revenue = gross subscription charges − discounts − refunds − chargebacks − Stripe fees.
          <span className="mt-2 block">
            Community = round half-up (eligible × {DRAFT_POLICY.communityNumerator} ÷ {DRAFT_POLICY.communityDenominator}) to the cent.
          </span>
          <span className="mt-2 block">Platform = eligible − community.</span>
        </p>
        <p className="leading-relaxed text-ink/80">
          Taxes collected are shown in the reconciliation and left out of the base. In this sample, taxes are {formatUsd(0)}.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-serif text-3xl">Rounding</h3>
        <p className="leading-relaxed text-ink/80">
          The community estimate is {DRAFT_POLICY.communityNumerator}% of eligible revenue, rounded half-up to the cent. The platform estimate is the remainder, so the two lines add back to eligible revenue exactly.
        </p>
        <p className="leading-relaxed text-ink/80">
          Half-up means a remaining half cent rounds toward the community line. One cent of eligible revenue becomes a one-cent community estimate. Ten cents becomes eight cents for the community and two cents for the platform.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-serif text-3xl">Annual subscriptions</h3>
        <p className="leading-relaxed text-ink/80">
          An annual charge counts in full in the month it is collected. A later accounting view may spread that cash across the year. This screen is a collections view.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-serif text-3xl">Reporting periods</h3>
        <p className="leading-relaxed text-ink/80">
          A closed month includes that calendar month. November is open because the snapshot falls on {SNAPSHOT_LABEL}. Q4 to date adds October and the open days of November. It is a partial quarter because December has not started.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-serif text-3xl">Who counts as a paying member</h3>
        <p className="leading-relaxed text-ink/80">
          An active paying member holds a monthly or annual subscription that is active at the snapshot. Trials and past-due subscriptions are reported beside the count and are left out of it. For a partial quarter, the count is the latest snapshot. Monthly member counts are not added together.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-serif text-3xl">What the {DRAFT_POLICY.communityNumerator}% means</h3>
        <p className="leading-relaxed text-ink/80">
          The community line is an estimated allocation of eligible subscription revenue. Referral rewards sit inside that {DRAFT_POLICY.communityNumerator}%, not on top of it. The whole line is an estimate. Only the approved portion is owed, and only the disbursed portion is paid. The rest is not yet a liability.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-serif text-3xl">Referral commissions</h3>
        <p className="leading-relaxed text-ink/80">
          A referral commission is {REFERRAL_NUMERATOR}% of a referred monthly membership at {formatUsd(MONTHLY_PRICE_CENTS)}. It comes out of the community allocation. In a closed month the calculated commission can be approved. In an open month it stays unapproved, so it is not owed. Your own unapproved referral is shown only on My Earnings.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-serif text-3xl">Owed, paid, and not yet a liability</h3>
        <p className="leading-relaxed text-ink/80">
          Approved referral commissions plus the approved facilitator amount are owed until they are paid. Paid is cash already disbursed in the sample. Community allocation − owed − paid is the remainder, and that remainder is not called money owed. Facilitator points are {POINTS_PER_EVENT} per delivered event and {POINTS_PER_ATTENDEE} per verified attendee. Points are not converted into the approved cash amount.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-serif text-3xl">Operating expenses</h3>
        <p className="leading-relaxed text-ink/80">
          Operating expenses are the sample costs for developers, operations, marketing, contractors, and events. Stripe fees remain in the subscription bridge and are not listed again. Investment capital is not an expense. The gap between the platform estimate and these expenses is a comparison, not cash in the bank.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-serif text-3xl">Left out of eligible revenue</h3>
        <ul className="flex flex-wrap gap-2">
          {EXCLUDED_INFLOWS.map((name) => (
            <li key={name}>
              <Chip tone="excluded">{name}</Chip>
            </li>
          ))}
        </ul>
        <p className="leading-relaxed text-ink/80">
          Founding contributions are {formatUsd(FOUNDING_PRICE_CENTS)} each and Pod payments are {formatUsd(POD_PRICE_CENTS)} each. Their amounts, with events, workshops, sponsorships, grants, and investment, appear on the overview. They stay out of eligible subscription revenue. Taxes collected are also left out.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="font-serif text-3xl">How to read the labels</h3>
        <p className="leading-relaxed text-ink/80">
          Sample marks every screen. Estimated, Owed, and Paid name different amounts. Reconciled is defined here and is not applied to these figures.
        </p>
        <dl className="flex flex-col gap-4">
          {glossary.map((entry) => (
            <div key={entry.term} className="rounded-2xl border border-sand bg-card px-4 py-4">
              <dt className="font-medium">{entry.term}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink/80">{entry.meaning}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="font-serif text-3xl">Worked example · October 2026</h3>
        <p className="leading-relaxed text-ink/80">October is a closed month. The lines below are the same figures as the overview, derived from the sample inputs.</p>
        <Reconciliation period={october} stale={freshness === "stale"} />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-serif text-3xl">Snapshot time</h3>
        <p className="leading-relaxed text-ink/80">
          The last update time is {SNAPSHOT_LABEL}. It is part of the sample. It does not follow the clock on this computer. If a refresh fails, the same snapshot stays on screen and is marked stale.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-serif text-3xl">What the other tabs show</h3>
        <p className="leading-relaxed text-ink/80">
          My Earnings shows only your sample referral commission. Community Contributions shows aggregate points and the facilitator portion of the pool. Distribution History shows approved and paid categories without names. Company Finances shows the expense categories. All of those figures are sample illustrations under this draft.
        </p>
      </section>
    </article>
  );
}
