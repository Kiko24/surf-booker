"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import defaultImage from "@/components/images/transferir.webp";
import { AuthFooter } from "./auth-footer";

type AuthShellProps = {
  children: React.ReactNode;
  backHref?: string;
  onBack?: () => void;
  showLogo?: boolean;
  image?: StaticImageData;
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

export function AuthShell({
  children,
  backHref,
  onBack,
  showLogo = true,
  image = defaultImage,
}: AuthShellProps) {
  const backButtonClasses =
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-foreground text-foreground hover:bg-surface active:bg-surface transition-colors touch-manipulation cursor-pointer select-none";

  const hasBack = Boolean(backHref || onBack);
  const showTopBar = hasBack || showLogo;

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
            className="
              flex-1 flex justify-center px-3 pb-8
              lg:relative lg:px-10 lg:pt-6 lg:pb-0
            "
            style={{
              paddingTop: "max(1rem, env(safe-area-inset-top))",
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            }}
          >
            {/* Back button absolute SÓ em desktop */}
            {hasBack && (
              <div className="hidden lg:block lg:absolute lg:top-6 lg:left-6 lg:z-10">
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

            <div className="w-full max-w-md lg:max-w-md lg:h-full lg:flex lg:flex-col">
              <div
                className="
                  relative rounded-2xl bg-background px-5 pt-3 pb-5
                  sm:px-6 sm:pt-4 sm:pb-6
                  lg:bg-transparent lg:p-0 lg:rounded-none
                  lg:flex lg:flex-1 lg:flex-col
                "
              >
                {/* Top bar SÓ em mobile */}
                {showTopBar && (
                  <div className="mb-4 flex items-center justify-between lg:hidden">
                    {hasBack ? (
                      backHref ? (
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
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            onBack?.();
                          }}
                          aria-label="Voltar"
                          className={backButtonClasses}
                        >
                          <ArrowLeftIcon className="h-3.5 w-3.5 pointer-events-none" />
                        </button>
                      )
                    ) : (
                      <span aria-hidden />
                    )}

                    {showLogo && (
                      <Link
                        href="/"
                        className="font-heading text-lg font-medium tracking-wide text-foreground hover:opacity-80 transition-opacity touch-manipulation"
                      >
                        SurfBooker
                      </Link>
                    )}
                  </div>
                )}
                {children}
              </div>
            </div>
          </main>

          <div className="hidden lg:block lg:px-8 lg:py-6">
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