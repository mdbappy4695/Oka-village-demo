import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Frame } from "../components/Frame";
import { Kaomoji, Panel, focusRing } from "../components/ui";
import { MONTHS } from "../data/sample-ledger";
import { EXPENSE_CATEGORIES, SNAPSHOT, monthId, monthLabel, type ExpenseId } from "../lib/allocate";
import { formatUsd } from "../lib/format";

type ExpenseEntry = {
  id: string;
  categoryId: ExpenseId;
  cents: number;
  note: string;
};

type MonthBooks = Record<string, ExpenseEntry[]>;
type AdminTab = "expenses";

const ADMIN_TABS = [{ id: "expenses" as const, label: "Expenses" }];
const operatingCategories = EXPENSE_CATEGORIES.filter((category) => !category.bridge);
const defaultMonthId = monthId(SNAPSHOT.year, SNAPSHOT.month);

function seedMonth(monthKey: string): ExpenseEntry[] {
  const month = MONTHS.find((item) => item.id === monthKey);
  if (!month) return [];
  const rows: ExpenseEntry[] = [];
  for (const category of operatingCategories) {
    const cents = month.expenses[category.id] ?? 0;
    if (cents <= 0) continue;
    rows.push({
      id: `${monthKey}-${category.id}`,
      categoryId: category.id,
      cents,
      note: "From sample books",
    });
  }
  return rows;
}

function categoryLabel(id: ExpenseId): string {
  return EXPENSE_CATEGORIES.find((category) => category.id === id)?.label ?? id;
}

export function Admin() {
  const monthOptions = useMemo(() => MONTHS.map((month) => month.id), []);
  const [tab, setTab] = useState<AdminTab | null>(null);
  const [monthKey, setMonthKey] = useState(defaultMonthId);
  const [books, setBooks] = useState<MonthBooks>(() => ({ [defaultMonthId]: seedMonth(defaultMonthId) }));
  const [editId, setEditId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<ExpenseId>(operatingCategories[0]!.id);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    document.title = "Admin · One World Family";
  }, []);

  useEffect(() => {
    setBooks((current) => (current[monthKey] ? current : { ...current, [monthKey]: seedMonth(monthKey) }));
    setEditId(null);
    setCategoryId(operatingCategories[0]!.id);
    setAmount("");
    setNote("");
  }, [monthKey]);

  const rows = books[monthKey] ?? [];
  const totalCents = rows.reduce((sum, row) => sum + row.cents, 0);

  function startEdit(row: ExpenseEntry) {
    setEditId(row.id);
    setCategoryId(row.categoryId);
    setAmount((row.cents / 100).toFixed(2));
    setNote(row.note);
  }

  function clearForm() {
    setEditId(null);
    setCategoryId(operatingCategories[0]!.id);
    setAmount("");
    setNote("");
  }

  function saveEntry(event: FormEvent) {
    event.preventDefault();
    const dollars = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(dollars) || dollars < 0) return;
    const cents = Math.round(dollars * 100);
    const entry: ExpenseEntry = {
      id: editId ?? `${monthKey}-${categoryId}-${Date.now()}`,
      categoryId,
      cents,
      note: note.trim() || "Admin entry",
    };
    setBooks((current) => {
      const existing = current[monthKey] ?? seedMonth(monthKey);
      const next = editId ? existing.map((row) => (row.id === editId ? entry : row)) : [...existing, entry];
      return { ...current, [monthKey]: next };
    });
    clearForm();
  }

  function removeEntry(id: string) {
    setBooks((current) => ({
      ...current,
      [monthKey]: (current[monthKey] ?? []).filter((row) => row.id !== id),
    }));
    if (editId === id) clearForm();
  }

  return (
    <Frame wide>
      <div className="flex min-w-0 flex-col gap-6 pb-8">
        <header>
          <p className="text-xs font-medium tracking-[0.22em] text-terracotta uppercase">Operations</p>
          <h1 className="mt-2 font-serif text-5xl">Admin</h1>
          <p className="mt-2 max-w-2xl text-lg leading-relaxed text-ink/80">
            Admin tools for the books. Open Expenses to record and review operating costs. Demo edits stay on this page for the session and do not rewrite the shared ledger.{" "}
            <Kaomoji>╰(´︶`)╯♡</Kaomoji>
          </p>
        </header>

        <div className="flex min-w-0 gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Admin sections">
          {ADMIN_TABS.map((item) => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(item.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm ${focusRing} ${selected ? "bg-terracotta text-white" : "bg-sand text-ink"}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {tab === "expenses" && (
          <div className="flex min-w-0 flex-col gap-6" role="tabpanel" aria-label="Expenses">
            <Panel title={editId ? "Edit expense" : "Add expense"}>
              <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={saveEntry}>
                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                  <span className="text-xs font-medium tracking-[0.12em] text-ink/60 uppercase">Category</span>
                  <select
                    className={`rounded-full border border-sand bg-cream px-4 py-2 ${focusRing}`}
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value as ExpenseId)}
                  >
                    {operatingCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium tracking-[0.12em] text-ink/60 uppercase">Amount (USD)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className={`rounded-full border border-sand bg-cream px-4 py-2 tabular-nums ${focusRing}`}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium tracking-[0.12em] text-ink/60 uppercase">Note</span>
                  <input
                    type="text"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Reference or description"
                    className={`rounded-full border border-sand bg-cream px-4 py-2 ${focusRing}`}
                  />
                </label>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <button type="submit" className={`rounded-full bg-terracotta px-5 py-2.5 text-sm font-medium text-white ${focusRing}`}>
                    {editId ? "Save changes" : "Add expense"}
                  </button>
                  {editId && (
                    <button type="button" className={`rounded-full bg-sand px-5 py-2.5 text-sm ${focusRing}`} onClick={clearForm}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
              <p className="mt-4 text-sm leading-relaxed text-ink/65">
                Edits are demo-local for this browser session. Open Accounting still reads the shared sample ledger until writes are wired through.
              </p>
            </Panel>

            <Panel title="Expense books">
              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium tracking-[0.12em] text-ink/60 uppercase">Month</span>
                  <select
                    className={`rounded-full border border-sand bg-cream px-4 py-2 ${focusRing}`}
                    value={monthKey}
                    onChange={(event) => setMonthKey(event.target.value)}
                    aria-label="Expense month"
                  >
                    {monthOptions.map((id) => (
                      <option key={id} value={id}>
                        {monthLabel(id)}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="text-sm text-ink/70">
                  Operating total
                  <span className="mt-1 block font-serif text-3xl tabular-nums text-ink">{formatUsd(totalCents)}</span>
                </p>
              </div>

              <div className="mt-6 max-w-full overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-xs tracking-[0.12em] text-terracotta uppercase">
                    <tr>
                      <th className="pb-3 pr-3 font-medium">Category</th>
                      <th className="pb-3 pr-3 font-medium">Amount</th>
                      <th className="pb-3 pr-3 font-medium">Note</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-ink/70">
                          No operating expenses in {monthLabel(monthKey)}. Add one above. <Kaomoji>(´･ω･`)</Kaomoji>
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr key={row.id} className="border-t border-sand">
                          <td className="py-3 pr-3">{categoryLabel(row.categoryId)}</td>
                          <td className="py-3 pr-3 tabular-nums">{formatUsd(row.cents)}</td>
                          <td className="py-3 pr-3 text-ink/75">{row.note}</td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-2">
                              <button type="button" className={`rounded-full bg-sand px-3 py-1.5 text-sm ${focusRing}`} onClick={() => startEdit(row)}>
                                Edit
                              </button>
                              <button type="button" className={`rounded-full bg-sand px-3 py-1.5 text-sm ${focusRing}`} onClick={() => removeEntry(row.id)}>
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </Frame>
  );
}
