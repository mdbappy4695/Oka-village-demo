import { useDemo } from "../demo/DemoContext";
import { focusRing } from "./ui";

const actions = [
  { id: "out", label: "Signed out" },
  { id: "sample", label: "Sample snapshot" },
  { id: "stale", label: "Refresh failed" },
] as const;

export function DemoBar() {
  const { member, freshness, signOut, showSample, showStale } = useDemo();
  const active = !member ? "out" : freshness === "stale" ? "stale" : "sample";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-golden/70 bg-ink text-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <p className="text-xs font-medium tracking-[0.2em] text-sand uppercase">Demo controls</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Demo controls">
          {actions.map((action) => {
            const pressed = active === action.id;
            return (
              <button
                key={action.id}
                type="button"
                aria-pressed={pressed}
                onClick={() => {
                  if (action.id === "out") signOut();
                  if (action.id === "sample") showSample();
                  if (action.id === "stale") showStale();
                }}
                className={`rounded-full px-4 py-2 text-sm ${focusRing} ${
                  pressed ? "bg-terracotta text-white" : "border border-cream/30 text-cream hover:border-cream"
                }`}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
