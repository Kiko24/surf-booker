"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type UserInfo = {
  id: string;
  email: string;
  name: string;
};

export function LandingPageView({ user }: { user: UserInfo | null }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="bg-white">
      {/* Navbar — absolute sobre a hero */}
      <header className="absolute left-0 right-0 top-0 z-10 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between rounded-full border border-gray-200 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm">
          <nav className="flex items-center gap-1">
            <Link
              href="#como-funciona"
              className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-blue-600/10"
            >
              Como funciona?
            </Link>
            <Link
              href="#precos"
              className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-blue-600/10"
            >
              Preços
            </Link>
          </nav>

          <Link href="/" className="font-heading text-xl font-bold text-blue-600">
            Alaia
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-sm text-gray-500 sm:block">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="font-body rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="font-body hidden rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 sm:block"
                >
                  Entrar
                </Link>
                <Link
                  href="/user-flow"
                  className="font-body rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav links */}
      <div className="absolute left-0 right-0 top-16 z-10 flex justify-center gap-1 px-5 py-3 sm:hidden">
        <Link
          href="#como-funciona"
            className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-blue-600/10"
          >
          Como funciona?
        </Link>
        <Link
          href="#precos"
          className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-blue-600/10"
        >
          Preços
        </Link>
        {!user && (
          <Link href="/login" className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-600/10">
            Entrar
          </Link>
        )}
      </div>

      {/* Hero — 100dvh */}
      <section className="flex h-dvh flex-col">
        {/* Top — placeholder retangular */}
        <div className="flex shrink-0 justify-center px-5 pt-[92px] sm:px-8">
          <div className="h-[350px] w-full max-w-[1653px] rounded-xl bg-[#1E1E1E]" />
        </div>

        {/* Bottom — conteúdo */}
        <div className="flex flex-1 flex-col px-5 pb-12 sm:px-8 lg:pb-16">
          <div className="mt-[48px] grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Left — headline + CTA */}
            <div className="lg:col-span-5 text-left">
              <h1 className="font-heading text-[clamp(2.5rem,7vw,4rem)] font-bold leading-none tracking-tight text-gray-900 uppercase">
                {user ? (
                  <>Bem-vindo de volta<br/><span className="text-accent">{user.name.split(" ")[0]}</span></>
                ) : (
                  <>Feito para quem<br/><span className="text-accent">vive o mar.</span></>
                )}
              </h1>
              {!user && (
                <>
                  <div className="mb-8 mt-8 h-px w-3/5 bg-gray-200" />
                  <Link
                    href="/user-flow"
                    className="group inline-flex items-center gap-3 rounded-full bg-accent px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-primary-foreground shadow-sm transition-all hover:brightness-110"
                  >
                    <span>Começar já</span>
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </>
              )}
              {user && (
                <p className="mt-6 text-sm text-gray-400">
                  A tua página de perfil e reservas está a caminho.
                </p>
              )}
            </div>

            {/* Right — features + visual */}
            <div className="flex items-end justify-between gap-8 lg:col-span-7">
              {/* Timeline features */}
              <div className="relative max-w-sm flex-1">
                <div className="absolute inset-y-0 left-4 w-px bg-gradient-to-b from-blue-600 via-blue-600/40 to-transparent" />
                <ul className="space-y-10 pl-10">
                  {[
                    { title: "Reservas online a qualquer hora", desc: "Agenda as tuas aulas com facilidade através da nossa plataforma digital 24/7." },
                    { title: "Reduz os no-shows", desc: "Avisos automáticos via SMS para garantir que nunca perdes uma sessão." },
                    { title: "Sem Whatsapp. Sem papéis.", desc: "Gestão 100% digital focada na tua experiência dentro e fora de água." },
                  ].map((item, i) => (
                    <li key={i} className="relative">
                      <div className={`absolute left-4 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white ${i === 0 ? "bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" : "bg-blue-600/40"}`} />
                      <h3 className="font-body text-sm font-semibold text-gray-900">{item.title}</h3>
                      <p className="mt-0.5 text-sm leading-snug text-gray-500">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Secondary visual */}
              <div className="hidden aspect-[4/3] w-2/5 shrink-0 rounded-xl bg-gradient-to-br from-blue-600/10 to-blue-600/5 sm:flex items-center justify-center">
                <svg className="h-16 w-16 text-blue-600/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path d="M3 17c3-4 6 2 9-2s6 2 9-2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona? section */}
      <section
        id="como-funciona"
        className="bg-gray-50 px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-3xl font-bold text-gray-900">
            Como funciona?
          </h2>
          <p className="mt-4 text-gray-600">
            Conteúdos sobre como a plataforma funciona serão adicionados aqui.
          </p>
        </div>
      </section>

      {/* Preços section */}
      <section id="precos" className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-3xl font-bold text-gray-900">
            Preços
          </h2>
          <p className="mt-4 text-gray-600">
            Tabela de preços e planos serão adicionados aqui.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-5 py-8 text-center text-sm text-gray-400">
        <p>Alaia — Marca sessões facilmente.</p>
      </footer>
    </div>
  );
}
