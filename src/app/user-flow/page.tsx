import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/server";

type Option = {
  title: string;
  description: string;
  href: string;
};

const options: Option[] = [
  {
    title: "Surfa para profissionais",
    description: "Gere o teu negócio mais facilmente",
    href: "/signup-owner",
  },
];

export default async function UserFlowPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const backHref = user ? "/dashboard" : "/";

  return (
    <AuthShell backHref={backHref}>
      <div className="mt-2 lg:flex lg:flex-1 lg:flex-col lg:justify-start lg:mt-8">
        <h1 className="text-center text-2xl font-heading font-medium lg:text-2xl">
          Registe-se / Iniciar sessão
        </h1>

        <div className="mt-10 flex flex-col gap-6 lg:mt-8 lg:gap-6">
          {options.map((opt) => (
            <Link
              key={opt.title}
              href={opt.href}
              className="
                rounded-xl border border-border px-4 py-2.5 text-left transition-colors hover:bg-surface
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

        <div className="mt-8 text-center text-sm lg:mt-6 lg:text-sm">
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