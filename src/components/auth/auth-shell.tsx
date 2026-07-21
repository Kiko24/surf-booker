"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import defaultImage from "@/components/images/transferir.webp";
import { AuthFooter } from "./auth-footer";
import { ThemeToggle } from "@/app/_components/theme-toggle";
import { cn } from "@/lib/utils/cn";

type AuthShellProps = {
  children: React.ReactNode;
  showLogo?: boolean;
  image?: StaticImageData;
  mainClassName?: string;
  backHref?: string;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
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

export function AuthShell({
  children,
  showLogo = true,
  image = defaultImage,
  mainClassName,
  backHref,
  onBack,
  title,
  subtitle,
}: AuthShellProps) {

  return (
    <div className="relative min-h-svh min-h-dvh bg-background text-foreground font-body lg:h-svh lg:overflow-hidden">
      <div
        className="
          relative z-10 flex min-h-svh min-h-dvh flex-col
          lg:h-svh lg:grid lg:grid-cols-[3fr_2fr] lg:gap-6 lg:p-6
        "
      >
        {/* === Imagem esquerda (só desktop) — 60% === */}
        <div className="hidden lg:block relative h-full w-full overflow-hidden rounded-3xl">
          <Image
            src={image}
            alt=""
            fill
            priority
            quality={90}
            placeholder="blur"
            sizes="(min-width: 1024px) 60vw, 0px"
            className="object-cover"
          />
        </div>

        {/* === Painel direito — 40% (scroll inclui footer) === */}
        <div
          className="
            flex flex-1 flex-col
            lg:flex-none lg:h-full lg:min-h-0 lg:bg-surface lg:rounded-3xl lg:overflow-y-auto
          "
        >
          <main
            className={cn(
              "relative flex-1 flex items-center justify-center px-3 pb-8",
              "lg:flex lg:flex-col lg:items-stretch lg:px-10 lg:pb-0",
              mainClassName
            )}
            style={{
              paddingTop: "max(0.5rem, env(safe-area-inset-top))",
              paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
            }}
          >
            {/* Topo desktop: back + theme, título abaixo (normal flow) */}
            <div className="hidden lg:flex lg:flex-col lg:gap-3 lg:pt-6 lg:shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  {Boolean(backHref || onBack) && (backHref ? (
                    <Link
                      href={backHref}
                      aria-label="Voltar"
                      className={backButtonClasses}
                    >
                      <ArrowLeftIcon className="h-3.5 w-3.5 pointer-events-none" />
                    </Link>
                  ) : onBack ? (
                    <button
                      type="button"
                      onClick={onBack}
                      aria-label="Voltar"
                      className={backButtonClasses}
                    >
                      <ArrowLeftIcon className="h-3.5 w-3.5 pointer-events-none" />
                    </button>
                  ) : null)}
                </div>
                <ThemeToggle />
              </div>
              {title && (
                <div className="min-w-0">
                  <h1 className="font-heading text-2xl font-medium">{title}</h1>
                  {subtitle && (
                    <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
                  )}
                </div>
              )}
            </div>

            <div className="w-full max-w-md lg:max-w-md lg:flex-1 lg:flex lg:flex-col lg:self-center">
              <div
                className="
                  relative rounded-2xl bg-background px-5 pt-3 pb-5
                  sm:px-6 sm:pt-4 sm:pb-6
                  lg:bg-transparent lg:p-0 lg:rounded-none lg:flex lg:flex-1 lg:flex-col
                "
              >
                {children}
              </div>
            </div>
          </main>

          <div className="hidden lg:block lg:px-8 lg:pt-2 lg:pb-4">
            <AuthFooter variant="inline" />
          </div>
        </div>

        <div className="lg:hidden">
          <AuthFooter />
        </div>
      </div>
    </div>
  );
}
