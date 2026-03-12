"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getDayName, getDateStr } from "@/lib/formatters";

export default function Header() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthed = !loading && !!user;

  const navItems = useMemo(() => {
    if (!isAuthed) {
      return [
        { href: "/auth/login", label: "Sign In" },
        { href: "/auth/register", label: "Get Started", cta: true },
      ];
    }

    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/ai-assistant", label: "AI Assistant" },
      { href: "/dashboard/profile", label: "Profile" },
    ];
  }, [isAuthed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, isAuthed]);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href;
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link
          href={isAuthed ? "/dashboard" : "/"}
          className="header-brand"
          aria-label="JustDoIt home"
        >
          JustDoIt
        </Link>

        <nav className="header-nav-desktop" aria-label="Desktop navigation">
          {!loading &&
            navItems.map((item) =>
              item.cta ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className="btn btn-brand btn-sm"
                >
                  {item.label}
                </Link>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`header-link ${isActive(item.href) ? "active" : ""}`}
                >
                  {item.label}
                </Link>
              )
            )}

          {isAuthed && (
            <div className="header-date" aria-label="Current date">
              <strong>{getDayName()}</strong>
              <span>{getDateStr()}</span>
            </div>
          )}
        </nav>

        <button
          type="button"
          className={`header-burger ${mobileOpen ? "is-open" : ""}`}
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {mobileOpen && (
        <>
          <div
            className="header-mobile-overlay"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          <nav
            id="mobile-menu"
            className="header-nav-mobile"
            aria-label="Mobile navigation"
          >
            <div className="header-nav-mobile-inner">
              {!loading &&
                navItems.map((item) =>
                  item.cta ? (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="btn btn-brand btn-sm header-mobile-cta"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`header-mobile-link ${isActive(item.href) ? "active" : ""}`}
                    >
                      {item.label}
                    </Link>
                  )
                )}

              {isAuthed && (
                <div className="header-mobile-date">
                  <strong>{getDayName()}</strong>
                  <span>{getDateStr()}</span>
                </div>
              )}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}