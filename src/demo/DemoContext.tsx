import { createContext, useContext, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const MEMBER_KEY = "oka-demo-member";
const FRESH_KEY = "oka-demo-freshness";

export type Freshness = "fresh" | "stale";

type DemoContextValue = {
  member: boolean;
  freshness: Freshness;
  signOut: () => void;
  showSample: () => void;
  showStale: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

function readMember(): boolean {
  return sessionStorage.getItem(MEMBER_KEY) === "1";
}

function readFreshness(): Freshness {
  return sessionStorage.getItem(FRESH_KEY) === "stale" ? "stale" : "fresh";
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const [member, setMember] = useState(readMember);
  const [freshness, setFreshness] = useState<Freshness>(readFreshness);

  function enter(next: Freshness) {
    sessionStorage.setItem(MEMBER_KEY, "1");
    sessionStorage.setItem(FRESH_KEY, next);
    setMember(true);
    setFreshness(next);
    if (!pathname.startsWith("/open-accounting")) navigate("/open-accounting");
  }

  const value: DemoContextValue = {
    member,
    freshness,
    signOut: () => {
      sessionStorage.removeItem(MEMBER_KEY);
      sessionStorage.setItem(FRESH_KEY, "fresh");
      setMember(false);
      setFreshness("fresh");
      navigate("/");
    },
    showSample: () => enter("fresh"),
    showStale: () => enter("stale"),
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used within DemoProvider");
  return value;
}
