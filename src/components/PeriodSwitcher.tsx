import { useSearchParams } from "react-router-dom";
import { PERIODS, periodOrDefault, type PeriodId, type PeriodView } from "../data/sample-ledger";
import { focusRing } from "../components/ui";

export function usePeriod(): { period: PeriodView; select: (id: PeriodId) => void } {
  const [params, setParams] = useSearchParams();
  const period = periodOrDefault(params.get("period"));
  return {
    period,
    select: (id) => setParams({ period: id }, { replace: true }),
  };
}

export function PeriodSwitcher({ period, onSelect }: { period: PeriodView; onSelect: (id: PeriodId) => void }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Reporting period">
      {PERIODS.map((option) => {
        const selected = option.id === period.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(option.id)}
            className={`rounded-full px-4 py-2 text-sm ${focusRing} ${selected ? "bg-terracotta text-white" : "bg-sand text-ink hover:bg-sand/70"}`}
          >
            {option.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
