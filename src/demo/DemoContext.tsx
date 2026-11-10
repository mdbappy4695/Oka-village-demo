import { createContext, useContext, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { canViewEarnings, canViewOpenAccounting, type AccessRole } from "../lib/allocate";

const ROLE_KEY = "owf-demo-role";
const FRESH_KEY = "owf-demo-freshness";

export type Freshness = "fresh" | "stale";

type DemoContextValue = {
  role: AccessRole;
  freshness: Freshness;
  setRole: (role: AccessRole) => void;
  setFreshness: (freshness: Freshness) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

function readRole(): AccessRole {
  const stored = sessionStorage.getItem(ROLE_KEY);
  if (stored === "lapsed" || stored === "trial" || stored === "paying" || stored === "signed-out") return stored;
  return "signed-out";
}

function readFreshness(): Freshness {
  return sessionStorage.getItem(FRESH_KEY) === "stale" ? "stale" : "fresh";
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const [role, setRoleState] = useState<AccessRole>(readRole);
  const [freshness, setFreshnessState] = useState<Freshness>(readFreshness);

  const value: DemoContextValue = {
    role,
    freshness,
    setRole: (next) => {
      sessionStorage.setItem(ROLE_KEY, next);
      setRoleState(next);
      if (next === "signed-out") navigate("/");
      else if (pathname.startsWith("/open-accounting") && !canViewOpenAccounting(next)) navigate("/");
      else if (pathname.startsWith("/earnings") && !canViewEarnings(next)) navigate("/");
    },
    setFreshness: (next) => {
      sessionStorage.setItem(FRESH_KEY, next);
      setFreshnessState(next);
    },
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used within DemoProvider");
  return value;
}
