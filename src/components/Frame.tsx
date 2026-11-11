import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { SNAPSHOT_LABEL } from "../lib/allocate";
import { canViewAdmin, canViewEarnings, canViewOpenAccounting } from "../lib/allocate";
import { useDemo } from "../demo/DemoContext";
import { Chip, focusRing } from "./ui";

const placeholders = ["Events", "Members", "Skills", "Houses", "Collections"] as const;

const navClass = ({ isActive }: { isActive: boolean }) =>
  `shrink-0 rounded-full px-3 py-1.5 text-sm ${focusRing} ${isActive ? "bg-ink text-cream" : "text-ink/80 hover:bg-sand/80"}`;

export function Frame({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { role, freshness, setRole } = useDemo();
  const stale = freshness === "stale";
  const signedIn = canViewEarnings(role);
  const canOpenBooks = canViewOpenAccounting(role);
  const canAdmin = canViewAdmin(role);
  const width = wide ? "max-w-7xl" : "max-w-6xl";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-svh bg-cream pb-40 text-ink">
      <header className="border-b border-sand bg-cream/95 backdrop-blur">
        <div className={`mx-auto flex ${width} min-w-0 items-center gap-3 px-5 py-3`}>
          <Link to="/" className={`shrink-0 font-serif text-2xl font-semibold tracking-tight ${focusRing}`}>
            OKA
          </Link>

          {signedIn && (
            <nav
              aria-label="Site"
              className="scrollbar-none mx-auto flex min-w-0 max-w-full flex-1 items-center gap-1 overflow-x-auto rounded-full bg-sand/70 px-2 py-1"
            >
              <NavLink to="/" end className={navClass}>
                Home
              </NavLink>
              {placeholders.map((label) => (
                <span key={label} className="shrink-0 rounded-full px-3 py-1.5 text-sm text-ink/45" title="Coming soon">
                  {label}
                </span>
              ))}
              {canOpenBooks ? (
                <NavLink to="/open-accounting" className={navClass}>
                  Open Accounting
                </NavLink>
              ) : (
                <span className="shrink-0 rounded-full px-3 py-1.5 text-sm text-ink/35" title="Open for an active trial or paying member">
                  Open Accounting
                </span>
              )}
              {canAdmin && (
                <NavLink to="/admin" className={navClass}>
                  Admin
                </NavLink>
              )}
            </nav>
          )}

          {signedIn && (
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <p className="hidden rounded-full bg-sage-light px-3 py-1.5 text-xs text-ink/80 sm:block">Complete your profile and earn 3 credits.</p>
              <button type="button" className={`grid size-9 place-items-center rounded-full border border-sand text-ink/70 ${focusRing}`} aria-label="Notifications">
                <BellIcon />
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  className={`grid size-9 place-items-center overflow-hidden rounded-full bg-terracotta text-sm font-medium text-white ${focusRing}`}
                  aria-label="Account menu"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-controls={menuId}
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  AV
                </button>
                {menuOpen && (
                  <div
                    id={menuId}
                    role="menu"
                    aria-label="Account"
                    className="absolute right-0 z-40 mt-2 w-56 rounded-2xl border border-sand bg-card p-2 shadow-[0_18px_40px_-24px_rgba(55,44,36,0.55)]"
                  >
                    <p className="px-3 py-2 text-xs text-ink/55">Avery</p>
                    <MenuItem label="My Profile" muted />
                    <MenuItem label="Credits" muted />
                    <NavLink
                      to="/earnings"
                      role="menuitem"
                      className={`block rounded-xl px-3 py-2 text-sm text-ink hover:bg-sand ${focusRing}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      My Earnings
                    </NavLink>
                    <div className="my-1 border-t border-sand" />
                    <button
                      type="button"
                      role="menuitem"
                      className={`block w-full rounded-xl px-3 py-2 text-left text-sm text-ink hover:bg-sand ${focusRing}`}
                      onClick={() => {
                        setMenuOpen(false);
                        setRole("signed-out");
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {signedIn && stale && (
        <div className={`mx-auto flex ${width} flex-col gap-3 px-5 pt-6`}>
          <p className="rounded-2xl border border-golden bg-golden/25 px-4 py-3 text-sm leading-relaxed" role="status">
            <span className="mr-2 inline-flex align-middle">
              <Chip tone="stale">Stale</Chip>
            </span>
            Refresh failed. Showing the last snapshot from {SNAPSHOT_LABEL}. These figures may be out of date.
          </p>
        </div>
      )}
      <main className={`mx-auto min-w-0 ${width} px-5 pt-8`}>{children}</main>
    </div>
  );
}

function MenuItem({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <span role="menuitem" className={`block rounded-xl px-3 py-2 text-sm ${muted ? "text-ink/45" : "text-ink"}`} title="Coming soon">
      {label}
    </span>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}
