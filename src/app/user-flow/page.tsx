import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/server";

type Option = {
  title: string;
  description: string;
  href: string;
};

const options: Option[] = [
  {
    title: "Alaia para profissionais",
    description: "Gere o teu negócio mais facilmente",
    href: "/signup-owner",
  },
];

export default async function UserFlowPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const backHref = user ? "/dashboard" : "/";

  return (
    <AuthShell
      backHref={backHref}
      title="Registe-se / Iniciar sessão"
      mainClassName="items-start"
    >
      <AuthHeader
        title="Registe-se / Iniciar sessão"
        backHref={backHref}
      />
      <div className="flex flex-col gap-3 lg:flex-1 lg:justify-start lg:items-center">

        <div className="mt-10 flex flex-col gap-6 lg:self-stretch">
          {options.map((opt) => (
            <Link
              key={opt.title}
              href={opt.href}
              className="
                w-full rounded-xl border border-border px-4 py-2.5 text-left transition-colors hover:bg-surface
                lg:px-5 lg:py-3.5
              "
            >
              <p className="leading-tight font-medium text-text-primary lg:text-base">
                {opt.title}
              </p>
              <p className="mt-0.5 text-sm leading-tight text-text-secondary lg:mt-1 lg:text-sm">
                {opt.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="text-center text-sm lg:self-stretch lg:text-sm">
          <p className="text-text-secondary">
            Já tens conta?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Faz login
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}