import Link from "next/link";
import { AuthFooter } from "./auth-footer";

type AuthShellProps = {
  children: React.ReactNode;
  backHref?: string;
  onBack?: () => void;
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

export function AuthShell({ children, backHref, onBack }: AuthShellProps) {
  const backButtonClasses =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-accent hover:bg-surface transition-colors";

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground font-body">
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="relative rounded-2xl bg-surface p-6 sm:p-8">
            {(backHref || onBack) && (
              <div className="absolute left-4 top-4">
                {backHref ? (
                  <Link href={backHref} aria-label="Voltar" className={backButtonClasses}>
                    <ArrowLeftIcon className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={onBack}
                    aria-label="Voltar"
                    className={backButtonClasses}
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            {children}
          </div>
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}