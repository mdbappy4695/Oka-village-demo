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
