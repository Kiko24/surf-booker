"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type AuthHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  className?: string;
};

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

const backButtonClasses =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-foreground text-foreground hover:bg-surface active:bg-surface transition-colors touch-manipulation cursor-pointer select-none";

export function AuthHeader({
  title,
  subtitle,
  backHref,
  onBack,
  className,
}: AuthHeaderProps) {
  const hasBack = Boolean(backHref || onBack);

  return (
    <header
      className={cn(
        "flex flex-col items-start gap-3 lg:hidden",
        className
      )}
    >
      {hasBack && (
        <div className="lg:hidden">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Voltar"
              className={backButtonClasses}
            >
              <ArrowLeftIcon className="h-3.5 w-3.5 pointer-events-none" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onBack}
              aria-label="Voltar"
              className={backButtonClasses}
            >
              <ArrowLeftIcon className="h-3.5 w-3.5 pointer-events-none" />
            </button>
          )}
        </div>
      )}

      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-medium">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
        )}
      </div>
    </header>
  );
}
