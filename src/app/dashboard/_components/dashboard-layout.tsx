"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { NAV_ITEMS } from "./constants";

type Props = {
  children: ReactNode;
};

export function DashboardLayout({ children }: Props) {
  const pathname = usePathname();

  return (
    <div className="h-svh overflow-hidden bg-background text-foreground font-body">
      <div className="h-full overflow-y-auto pb-24 [&::-webkit-scrollbar]:hidden">
        {children}
      </div>

      <div className="pointer-events-none fixed bottom-[calc(1.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 h-16 bg-gradient-to-t from-background to-transparent" />

      <nav
        className="fixed left-1/2 z-50 flex w-[90%] max-w-md -translate-x-1/2 items-center justify-around rounded-full border border-accent/10 bg-surface-container-high px-2 py-2 shadow-lg backdrop-blur-md"
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-accent text-primary-foreground transition-all duration-200"
                  : "flex h-12 w-12 items-center justify-center rounded-full text-text-secondary transition-all hover:bg-accent/10"
              }
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
