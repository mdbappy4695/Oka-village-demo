import { useEffect } from "react";
import type { AccessRole } from "../lib/allocate";
import { useDemo } from "../demo/DemoContext";
import { Eyebrow, Kaomoji, focusRing } from "../components/ui";

const entries: { role: AccessRole; label: string }[] = [
  { role: "paying", label: "Enter as a paying member" },
  { role: "trial", label: "Enter on a free trial" },
  { role: "lapsed", label: "Enter as a lapsed member" },
  { role: "admin", label: "Enter as admin" },
];

export function Gate() {
  const { setRole } = useDemo();

  useEffect(() => {
    document.title = "Members only · One World Family";
  }, []);

  return (
    <main className="flex min-h-svh items-center justify-center bg-cream px-6 pt-10 pb-40">
      <section className="w-full max-w-xl rounded-2xl border border-sand bg-card px-8 py-12 shadow-[0_24px_50px_-32px_rgba(55,44,36,0.5)] sm:px-12">
        <p className="font-serif text-4xl">One World Family</p>
        <div className="mt-8">
          <Eyebrow>Open Accounting</Eyebrow>
        </div>
        <h1 className="mt-3 font-serif text-5xl leading-tight">Members only</h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-ink/80">
          Earnings is part of a member account. Open Accounting is for a paying member or a trial that is still inside seven days.{" "}
          <Kaomoji>╰(´︶`)╯♡</Kaomoji>
        </p>
        <div className="mt-8 flex flex-col gap-3">
          {entries.map((entry) => (
            <button
              key={entry.role}
              type="button"
              className={`rounded-full px-6 py-3 text-sm font-medium ${focusRing} ${
                entry.role === "paying" ? "bg-terracotta text-white" : "bg-sand text-ink"
              }`}
              onClick={() => setRole(entry.role)}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
