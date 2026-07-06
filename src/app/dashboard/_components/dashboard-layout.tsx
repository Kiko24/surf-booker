"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState, useEffect, useCallback } from "react";
import { NAV_ITEMS } from "./constants";
import { getSchoolInfo } from "../actions";

type Props = {
  children: ReactNode;
};

export function DashboardLayout({ children }: Props) {
  const pathname = usePathname();
  const [schoolName, setSchoolName] = useState("Surf Booker");
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    getSchoolInfo().then((info) => {
      if (info) {
        setSchoolName(info.name);
        setSchoolLogo(info.logo_url);
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", !dark);
  }, []);

  const toggleTheme = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("light", !next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-xl focus:bg-accent focus:px-4 focus:py-3 focus:text-primary-foreground focus:outline-none"
      >
        Saltar para o conteúdo principal
      </a>
      <div className="h-svh overflow-hidden bg-background text-foreground font-body md:flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:h-full md:shrink-0 md:bg-background md:border-r md:border-white/10 md:py-10 md:px-6 md:z-50">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface">
            {schoolLogo ? (
              <img src={schoolLogo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-accent">
                {schoolName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
<h1 className="font-heading text-base font-bold text-foreground/90 uppercase tracking-widest line-clamp-2 leading-tight">
  {schoolName}
</h1>
        </div>

        <nav className="flex flex-1 flex-col justify-center gap-8">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-4 text-sm font-semibold transition-all duration-300 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  isActive
                    ? "text-accent relative before:absolute before:-left-6 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-[3px] before:rounded-r before:bg-accent before:shadow-[0_0_10px_rgba(129,202,250,0.5)]"
                    : "text-text-secondary hover:text-accent"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label.toUpperCase()}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={async () => {
              const { logoutOwner } = await import("../actions");
              await logoutOwner();
              window.location.href = "/";
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:text-error focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            aria-label="Terminar sessão"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            aria-label={dark ? "Modo claro" : "Modo escuro"}
            aria-pressed={!dark}
          >
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div id="main-content" className="flex-1 h-full overflow-y-auto md:overflow-y-auto pb-24 md:pb-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-text-muted/30">
        {children}
      </div>

      {/* Mobile Bottom Nav */}
      <div className="pointer-events-none fixed bottom-[calc(1.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 h-16 bg-gradient-to-t from-background to-transparent md:hidden" />

      <nav
        className="fixed left-1/2 z-50 flex w-[90%] max-w-md -translate-x-1/2 items-center justify-around rounded-full border border-accent/10 bg-surface-container-high px-2 py-2 shadow-lg backdrop-blur-md md:hidden"
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={
                isActive
                  ? "flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-accent text-primary-foreground transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  : "flex h-12 w-12 items-center justify-center rounded-full text-text-secondary transition-all hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              }
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>
    </div>
    </>
  );
}
