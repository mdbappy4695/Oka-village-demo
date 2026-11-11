import { canViewOpenAccounting, type AccessRole } from "../lib/allocate";
import { useDemo, type Freshness } from "../demo/DemoContext";
import { focusRing } from "./ui";

const roles: { id: AccessRole; label: string }[] = [
  { id: "signed-out", label: "Signed out" },
  { id: "lapsed", label: "Lapsed member" },
  { id: "trial", label: "Active trial" },
  { id: "paying", label: "Paying member" },
  { id: "admin", label: "Admin" },
];

export function DemoBar() {
  const { role, freshness, setRole, setFreshness } = useDemo();
  const stale = freshness === "stale";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-golden/70 bg-ink text-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <p className="text-xs font-medium tracking-[0.16em] text-sand uppercase">Demo controls · not server auth</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Demo access">
          {roles.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={role === item.id}
              onClick={() => setRole(item.id)}
              className={`rounded-full px-4 py-2 text-sm ${focusRing} ${
                role === item.id ? "bg-terracotta text-white" : "border border-cream/30 text-cream hover:border-cream"
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={stale}
            disabled={role === "signed-out"}
            onClick={() => setFreshness((stale ? "fresh" : "stale") satisfies Freshness)}
            className={`rounded-full px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${focusRing} ${
              stale ? "bg-golden text-ink" : "border border-cream/30 text-cream hover:border-cream"
            }`}
          >
            {stale ? "Stale snapshot" : "Mark refresh failed"}
          </button>
        </div>
        <p className="text-xs text-sand">
          {canViewOpenAccounting(role) ? "Open Accounting is open for this role." : "Open Accounting stays closed for this role."}
        </p>
      </div>
    </div>
  );
}
