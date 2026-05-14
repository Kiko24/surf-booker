import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";

type Option = {
  title: string;
  description: string;
  href?: string;
  disabled?: boolean;
};

const options: Option[] = [
  {
    title: "Surfa para profissionais",
    description: "Gere o teu negócio mais facilmente",
    href: "/signup-owner",
  },
  {
    title: "Surfa para clientes",
    description: "Reserva as tuas aulas perto de ti",
    href: "/signup-client",
  },
  {
    title: "Surfa para convidados",
    description: "Reserva espontânea",
    disabled: true,
  },
];

export default function UserFlowPage() {
  return (
    <AuthShell backHref="/">
      <div className="pt-8">
        <h1 className="text-center text-2xl font-heading font-semibold">
          Registe-se / Iniciar sessão
        </h1>

        <div className="mt-8 flex flex-col gap-3">
          {options.map((opt) =>
            opt.disabled || !opt.href ? (
              <div
                key={opt.title}
                aria-disabled
                className="rounded-xl border border-border/40 bg-background/40 px-4 py-3 text-left opacity-50 cursor-not-allowed"
              >
                <p className="font-medium text-text-primary">{opt.title}</p>
                <p className="text-sm text-text-secondary">{opt.description}</p>
              </div>
            ) : (
              <Link
                key={opt.title}
                href={opt.href}
                className="rounded-xl border border-border bg-background/60 px-4 py-3 text-left transition-colors hover:bg-background"
              >
                <p className="font-medium text-text-primary">{opt.title}</p>
                <p className="text-sm text-text-secondary">{opt.description}</p>
              </Link>
            )
          )}
        </div>
      </div>
    </AuthShell>
  );
}