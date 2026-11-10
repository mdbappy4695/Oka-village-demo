import type { ReactNode } from "react";

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta";

const chipTones = {
  sample: "bg-sage-light text-ink",
  estimated: "bg-sand text-ink",
  stale: "bg-golden/50 text-ink",
  period: "bg-sand text-ink",
  excluded: "bg-sage-light text-ink",
  owed: "bg-sand text-ink",
  paid: "bg-sage-light text-ink",
  proposal: "bg-golden/40 text-ink",
} as const;

export function Chip({
  children,
  tone,
}: {
  children: ReactNode;
  tone: keyof typeof chipTones;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.68rem] font-medium tracking-[0.14em] uppercase ${chipTones[tone]}`}>
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium tracking-[0.22em] text-terracotta uppercase">{children}</p>;
}

export function Panel({
  id,
  title,
  children,
  extra,
}: {
  id?: string;
  title: string;
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 min-w-0 max-w-full rounded-2xl border border-sand bg-card p-5 shadow-[0_18px_40px_-28px_rgba(55,44,36,0.45)] sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-serif text-3xl">{title}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}
