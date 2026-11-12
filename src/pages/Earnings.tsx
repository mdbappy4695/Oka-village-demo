import { useEffect, useState } from "react";
import { Frame } from "../components/Frame";
import { Bars, Lines, chartColors } from "../components/charts";
import { Chip, Kaomoji, Panel, focusRing } from "../components/ui";
import { useDemo } from "../demo/DemoContext";
import { buildMemberAccount, memberMonth, memberMonthIds, spanFor } from "../data/views";
import { FOLLOW_UP_MESSAGE } from "../data/sample-ledger";
import { POINT_RULES, canFollowUp, statusLabel } from "../lib/allocate";
import { formatCount, formatIsoDate, formatSigned, formatUsd } from "../lib/format";

const account = buildMemberAccount();
const monthIds = memberMonthIds();

export function Earnings() {
  const { freshness } = useDemo();
  const stale = freshness === "stale";
  const [monthId, setMonthId] = useState("2026-11");
  const [grain, setGrain] = useState<"month" | "quarter" | "year">("month");
  const [followUpId, setFollowUpId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const month = memberMonth(monthId);
  const index = monthIds.indexOf(monthId);
  const span = spanFor(monthId, grain);
  const spanEvents = account.events.filter((event) => span.includes(event.date.slice(0, 7)));
  const spanPoints = spanEvents.reduce((total, event) => total + event.points, 0);
  const spanEarnings = spanEvents.reduce((total, event) => total + event.earningsCents, 0);
  const contributionChart = span.map((id) => {
    const events = account.events.filter((event) => event.date.slice(0, 7) === id);
    return {
      label: memberMonth(id).label.slice(0, 3),
      value: events.reduce((total, event) => total + event.points, 0),
    };
  });
  const quietContribution = spanEvents.length === 0;
  const followUp = account.invites.find((invite) => invite.id === followUpId) ?? null;

  useEffect(() => {
    document.title = "My Earnings · One World Family";
  }, []);

  async function copyLink() {
    const field = document.querySelector<HTMLInputElement>("input[aria-label='Personal affiliate link']");
    try {
      await navigator.clipboard.writeText(account.affiliateUrl);
      setCopied(true);
      return;
    } catch {
      // Some browsers reject the async clipboard call. The field selection below is the fallback.
    }
    if (!field) return;
    field.focus();
    field.select();
    setCopied(document.execCommand("copy"));
  }

  return (
    <Frame>
      <div className="flex min-w-0 flex-col gap-8 pb-6">
        <header>
          {stale && (
            <div className="flex flex-wrap gap-2">
              <Chip tone="stale">Stale</Chip>
            </div>
          )}
          <h1 className={stale ? "mt-3 font-serif text-5xl" : "font-serif text-5xl"}>My Earnings</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink/80">
            Only Avery’s invitations, points, and payments. No other member’s balance is on this page.{" "}
            <Kaomoji>(´･ω･`)</Kaomoji>
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Panel title="Your invitation link" extra={stale ? <Chip tone="stale">Stale</Chip> : <Kaomoji>(˘︶˘)☆</Kaomoji>}>
            <p className="mt-3 text-sm leading-relaxed text-ink/75">Share this personal link. Attribution stays with you.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                readOnly
                value={account.affiliateUrl}
                aria-label="Personal affiliate link"
                className="min-w-0 flex-1 rounded-full border border-sand bg-cream px-4 py-3 text-sm"
              />
              <button type="button" className={`rounded-full bg-terracotta px-5 py-3 text-sm font-medium text-white ${focusRing}`} onClick={copyLink}>
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          </Panel>
          <article className="rounded-2xl border border-sand bg-card p-5 shadow-[0_18px_40px_-28px_rgba(55,44,36,0.45)] sm:p-7">
            <p className="text-xs font-medium tracking-[0.14em] text-terracotta uppercase">{account.balance.title}</p>
            <p className="mt-3 font-serif text-5xl tabular-nums">{formatUsd(Math.abs(account.balance.cents))}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              {account.balance.tone === "offset"
                ? "This offsets future earnings. It is not a demand for immediate cash."
                : "After deductions and previous payouts. Subject to the payout schedule."}
            </p>
            <p className="mt-4 text-sm text-ink/70">Next payout {account.nextPayout.label}</p>
          </article>
        </div>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-serif text-3xl">Your earnings</h2>
            <p className="text-sm text-ink/70">Figures for this member account</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Total earned" value={formatUsd(account.earnedCents)} note="Approved referral and contribution earnings." stale={stale} />
            <Metric label="Referral earnings" value={formatUsd(account.referralCents)} note="Approved credits from people you invited." stale={stale} />
            <Metric label="Contribution earnings" value={formatUsd(account.contributionCents)} note="Approved event earnings. Points convert monthly." stale={stale} />
            <Metric label="Adjustments and advances" value={formatSigned(account.adjustmentCents)} note="Credits, minus advances and deductions." stale={stale} />
          </div>
        </section>

        <Panel title={`Earnings over the year · ${month.label.slice(-4)}`}>
          <p className="mt-3 text-sm leading-relaxed text-ink/75">Approved referral credits and approved contribution cash. Points are not drawn as dollars.</p>
          <Lines
            data={month.yearSeries.map((point) => ({
              label: point.label,
              referral: point.earnedCents,
              contribution: account.events.filter((event) => event.date.slice(0, 7) === point.id).reduce((total, event) => total + event.earningsCents, 0),
            }))}
            series={[
              { key: "referral", name: "Referral earnings", color: chartColors.terracotta },
              { key: "contribution", name: "Contribution earnings", color: chartColors.sage },
            ]}
            money
            label={`Approved earnings during ${month.label.slice(-4)}`}
          />
        </Panel>

        <Panel title="Referral performance" extra={<Chip tone="period">{month.label}</Chip>}>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`rounded-full bg-sage px-4 py-2 text-sm text-cream disabled:opacity-40 ${focusRing}`}
              disabled={index <= 0}
              onClick={() => setMonthId(monthIds[index - 1]!)}
            >
              Previous month
            </button>
            <p className="px-2 font-medium">{month.label}</p>
            <button
              type="button"
              className={`rounded-full bg-sage px-4 py-2 text-sm text-cream disabled:opacity-40 ${focusRing}`}
              disabled={index >= monthIds.length - 1}
              onClick={() => setMonthId(monthIds[index + 1]!)}
            >
              Next month
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            The arrows move these activity sections through 2025 and 2026. They do not change the account totals or the payout panel.
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Stat label="Invited" value={formatCount(month.invitedCount)} />
            <Stat label="Became paying" value={formatCount(month.payingCount)} />
            <Stat label="Conversion" value={month.conversion === null ? "—" : `${month.conversion}%`} />
            <Stat label="Earned this month" value={formatUsd(month.earnedCents)} />
            <Stat label="From earlier invitations still active" value={formatUsd(month.priorActiveCents)} />
          </dl>
          {month.pendingCents > 0 && (
            <p className="mt-4 text-sm leading-relaxed text-ink/75">
              <Chip tone="estimated">Estimated</Chip> {formatUsd(month.pendingCents)} is calculated and not yet approved.{" "}
              <Kaomoji>(´･ω･`)</Kaomoji>
            </p>
          )}
          <h3 className="mt-6 font-medium">New invitations each month</h3>
          <Bars
            data={month.yearSeries.map((point) => ({ label: point.label, value: point.invited }))}
            name="New invitations"
            color={chartColors.terracotta}
            money={false}
            label={`New invitations during ${month.label.slice(-4)}`}
          />
          <h3 className="mt-6 font-medium">Referral income each month</h3>
          <p className="mt-1 text-sm text-ink/70">Approved credits only. A registration and a later renewal are different months.</p>
          <Bars
            data={month.yearSeries.map((point) => ({ label: point.label, value: point.earnedCents }))}
            name="Referral income"
            color={chartColors.sage}
            money
            label={`Approved referral income during ${month.label.slice(-4)}`}
          />
        </Panel>

        <Panel title="People you invited">
          <p className="mt-3 text-sm leading-relaxed text-ink/75">
            First names only. Follow-up never reveals an email address or a phone number, and it closes once someone has purchased a membership.{" "}
            <Kaomoji>(´･ω･`)</Kaomoji>
          </p>
          <div className="mt-4 max-w-full overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="text-xs tracking-[0.12em] text-terracotta uppercase">
                <tr>
                  {["Name", "Registered", "Status", "Membership", "Reward", "Last payment", "Next action"].map((heading) => (
                    <th key={heading} className="py-2 pr-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {account.invites.map((invite) => {
                  const approved = invite.credits.filter((credit) => credit.state === "approved").reduce((total, credit) => total + credit.cents, 0);
                  const pending = invite.credits.filter((credit) => credit.state === "pending").reduce((total, credit) => total + credit.cents, 0);
                  return (
                    <tr key={invite.id} className="border-t border-sand align-top">
                      <td className="py-3 pr-3 font-medium">{invite.firstName}</td>
                      <td className="py-3 pr-3">{formatIsoDate(invite.registered)}</td>
                      <td className="py-3 pr-3">{statusLabel(invite.status)}</td>
                      <td className="py-3 pr-3">{invite.typeDisclosed && invite.membershipType ? invite.membershipType : "Not shared"}</td>
                      <td className="py-3 pr-3">
                        {formatUsd(approved)}
                        {pending > 0 ? ` · ${formatUsd(pending)} pending` : ""}
                      </td>
                      <td className="py-3 pr-3">{invite.lastPayment ? formatIsoDate(invite.lastPayment) : "—"}</td>
                      <td className="py-3 pr-3">
                        {canFollowUp(invite.status) ? (
                          <button type="button" className={`rounded-full bg-sand px-3 py-1.5 ${focusRing}`} onClick={() => setFollowUpId(invite.id)}>
                            Send invitation
                          </button>
                        ) : (
                          "Follow-up closed"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {followUp && (
            <div className="mt-4 rounded-2xl bg-sand/70 p-4" role="dialog" aria-label={`Follow up with ${followUp.firstName}`}>
              <p className="font-medium">Approved message for {followUp.firstName}</p>
              <p className="mt-2 text-sm leading-relaxed">{FOLLOW_UP_MESSAGE}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">
                This would send only on a channel {followUp.firstName} has allowed. Their email address and phone number stay hidden.
              </p>
              <button type="button" className={`mt-3 rounded-full bg-ink px-4 py-2 text-sm text-cream ${focusRing}`} onClick={() => setFollowUpId(null)}>
                Close
              </button>
            </div>
          )}
        </Panel>

        <Panel title="Contribution earnings" extra={<Chip tone="sample">{POINT_RULES.label}</Chip>}>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink/80">
            One World Family rewards members who share their knowledge, experience, and gifts to help others learn, grow, and develop. Your events
            contribute to the community, and eligible activity can earn points toward the contributor reward pool.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink/75">
            Points stay visible here, and approved dollars appear after conversion. Points from the prior 30 days convert on the 1st of every month, then become
            available for payout on the 1st of the following month. Only events hosted on the platform earn points: {POINT_RULES.perHostedEvent}{" "}
            per event and {POINT_RULES.perVerifiedAttendee} per verified attendee.
          </p>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Contribution period">
            {(["month", "quarter", "year"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={grain === option}
                className={`rounded-full px-4 py-2 text-sm capitalize ${focusRing} ${grain === option ? "bg-terracotta text-white" : "bg-sand"}`}
                onClick={() => setGrain(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <Stat label="Events in view" value={formatCount(spanEvents.length)} />
            <Stat label="Points" value={formatCount(spanPoints)} />
            <Stat label="Approved earnings" value={formatUsd(spanEarnings)} />
          </dl>
          <Bars
            data={contributionChart}
            name="Contribution points"
            color={chartColors.golden}
            money={false}
            label="Contribution points for the selected span"
          />
          {quietContribution && (
            <p className="mt-3 text-sm leading-relaxed text-ink/80">
              Your contribution journey starts here. Create your first event and begin sharing what you love.
            </p>
          )}
          <div className="mt-4 max-w-full overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-xs tracking-[0.12em] text-terracotta uppercase">
                <tr>
                  {["Event", "Date", "Number", "Role", "Status", "Registered", "Verified", "Points", "Earnings", "Payment"].map((heading) => (
                    <th key={heading} className="py-2 pr-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {spanEvents.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-4 text-ink/70">
                      No hosted events in this {grain}. <Kaomoji>(´･ω･`)</Kaomoji>
                    </td>
                  </tr>
                )}
                {spanEvents.map((event) => (
                  <tr key={event.id} className="border-t border-sand">
                    <td className="py-3 pr-3 font-medium">{event.name}</td>
                    <td className="py-3 pr-3">{formatIsoDate(event.date)}</td>
                    <td className="py-3 pr-3">{event.number}</td>
                    <td className="py-3 pr-3">{event.role}</td>
                    <td className="py-3 pr-3">{event.status}</td>
                    <td className="py-3 pr-3">{formatCount(event.registered)}</td>
                    <td className="py-3 pr-3">{formatCount(event.verified)}</td>
                    <td className="py-3 pr-3">{formatCount(event.points)}</td>
                    <td className="py-3 pr-3">{formatUsd(event.earningsCents)}</td>
                    <td className="py-3 pr-3">{event.payment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Advances, deductions, and balance" extra={stale ? <Chip tone="stale">Stale</Chip> : undefined}>
          <p className="mt-3 text-sm leading-relaxed text-ink/75">
            Net balance = approved earnings + credits − advances − deductions − previous payouts. A complimentary membership is listed only because it was agreed.
          </p>
          <div className="mt-4 max-w-full overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs tracking-[0.12em] text-terracotta uppercase">
                <tr>
                  {["Date", "Reason", "Related", "Amount"].map((heading) => (
                    <th key={heading} className="py-2 pr-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {account.statement.map((row) => (
                  <tr key={row.id} className="border-t border-sand">
                    <td className="py-3 pr-3">{formatIsoDate(row.date)}</td>
                    <td className="py-3 pr-3">
                      {row.reason}
                      {row.agreed ? " · Agreed" : ""}
                    </td>
                    <td className="py-3 pr-3">{row.related}</td>
                    <td className="py-3 pr-3">{row.kind === "credit" ? formatUsd(row.cents) : formatSigned(-row.cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="mt-4 divide-y divide-sand text-sm">
            <Line label="Approved earnings" value={formatUsd(account.earnedCents)} />
            <Line label="Credits" value={formatUsd(account.statement.filter((row) => row.kind === "credit").reduce((total, row) => total + row.cents, 0))} />
            <Line label="Advances" value={formatSigned(-account.statement.filter((row) => row.kind === "advance").reduce((total, row) => total + row.cents, 0))} />
            <Line label="Deductions" value={formatSigned(-account.statement.filter((row) => row.kind === "deduction").reduce((total, row) => total + row.cents, 0))} />
            <Line label="Previous payouts" value={formatSigned(-account.paidCents)} />
            <Line label={account.balance.title} value={formatSigned(account.balance.cents)} />
          </dl>
          {account.balance.tone === "offset" && (
            <p className="mt-3 text-sm leading-relaxed text-ink/75">A balance to offset is not an automatic request for immediate cash.</p>
          )}
        </Panel>

        <Panel title="Payout schedule" extra={<Chip tone="owed">Scheduled</Chip>}>
          <p className="mt-3 leading-relaxed text-ink/80">On the 20th of every month, eligible earnings from the previous calendar month are scheduled.</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Stat label="Current earnings period" value={account.nextPayout.coversLabel} />
            <Stat label="Next scheduled payout" value={account.nextPayout.label} />
            <Stat label="Pending approval" value={formatUsd(account.pendingCents)} />
            <Stat label="Available payout" value={formatUsd(Math.max(account.balance.cents, 0))} />
            <Stat label="Already paid" value={formatUsd(account.paidCents)} />
            <div>
              <dt className="text-xs font-medium tracking-[0.12em] text-ink/60 uppercase">Payment method</dt>
              <dd className="mt-2">
                <button
                  type="button"
                  className={`rounded-full border border-sand bg-cream px-4 py-2 text-left text-sm ${focusRing}`}
                  onClick={() => setPaymentOpen((open) => !open)}
                  aria-expanded={paymentOpen}
                >
                  {account.paymentMethod}
                  <span className="mt-1 block text-ink/60">{paymentOpen ? "Close" : "Add or change payout method"}</span>
                </button>
              </dd>
            </div>
          </dl>
          {paymentOpen && (
            <div className="mt-4 rounded-2xl bg-sand/70 p-4" role="dialog" aria-label="Add or change payout method">
              <p className="font-medium">Add or change payout method</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">
                This opens the profile form for a bank transfer or another approved payout method. Account numbers stay hidden.
              </p>
              <button type="button" className={`mt-3 rounded-full bg-ink px-4 py-2 text-sm text-cream ${focusRing}`} onClick={() => setPaymentOpen(false)}>
                Close
              </button>
            </div>
          )}
          <div className="mt-4 max-w-full overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs tracking-[0.12em] text-terracotta uppercase">
                <tr>
                  {["Date", "Covers", "Amount", "Status", "Method"].map((heading) => (
                    <th key={heading} className="py-2 pr-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {account.payouts.map((payout) => (
                  <tr key={payout.id} className="border-t border-sand">
                    <td className="py-3 pr-3">{formatIsoDate(payout.date)}</td>
                    <td className="py-3 pr-3">{payout.covers}</td>
                    <td className="py-3 pr-3">{formatUsd(payout.cents)}</td>
                    <td className="py-3 pr-3">{payout.status}</td>
                    <td className="py-3 pr-3">{account.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-4 flex flex-col gap-2 text-sm leading-relaxed text-ink/75">
            {account.exceptions.map((exception) => (
              <li key={exception}>{exception}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </Frame>
  );
}

function Metric({ label, value, note, stale }: { label: string; value: string; note: string; stale: boolean }) {
  return (
    <article className="rounded-2xl border border-sand bg-card p-5">
      <div className="flex flex-wrap gap-2">
        <h3 className="text-xs font-medium tracking-[0.14em] text-terracotta uppercase">{label}</h3>
        {stale && <Chip tone="stale">Stale</Chip>}
      </div>
      <p className="mt-3 font-serif text-3xl tabular-nums">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">{note}</p>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-[0.12em] text-ink/60 uppercase">{label}</dt>
      <dd className="mt-1 font-serif text-2xl tabular-nums">{value}</dd>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt>{label}</dt>
      <dd className="font-serif text-2xl tabular-nums">{value}</dd>
    </div>
  );
}
