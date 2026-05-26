"use client";

import Image from "next/image";
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
    <div className="bg-[#F7FAFC]">
      {/* Navbar — absolute sobre a hero */}
      <header className="absolute left-0 right-0 top-0 z-10 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between rounded-full border border-gray-200 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm">
          <nav className="flex items-center gap-1">
            <a
              href="#como-funciona"
              className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-accent/10"
            >
              Como funciona?
            </a>
            <a
              href="#precos"
              className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-accent/10"
            >
              Preços
            </a>
          </nav>

          <a href="/" className="font-heading text-xl font-bold text-accent-light">
            Alaia
          </a>

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
                <a
                  href="/onboarding"
                  className="font-body hidden rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 sm:block"
                >
                  Entrar
                </a>
                <a
                  href="/signup-owner"
                  className="font-body rounded-full border border-accent-light bg-white px-4 py-2 text-sm font-semibold text-accent-light transition-colors hover:bg-accent-light hover:text-white"
                >
                  Registar o seu negócio
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav links */}
      <div className="absolute left-0 right-0 top-16 z-10 flex justify-center gap-1 px-5 py-3 sm:hidden">
        <a
          href="#como-funciona"
          className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-accent/10"
        >
          Como funciona?
        </a>
        <a
          href="#precos"
          className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-accent/10"
        >
          Preços
        </a>
        {!user && (
          <a href="/onboarding" className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-accent transition-all hover:bg-accent/10">
            Entrar
          </a>
        )}
      </div>

      {/* Hero — min 100dvh, cresce se necessario */}
      <section className="relative flex min-h-dvh flex-col justify-between">
        {/* Photo — absolute, decorativa */}
        <div className="absolute right-[32px] top-[92px] bottom-[32px] z-[1] w-[calc(50%-32px)] overflow-hidden rounded-xl">
          <Image src="/images/hero-section.png" alt="" fill sizes="50vw" className="object-cover" priority />
        </div>

        {/* Headline no topo */}
        <div className="relative z-10 px-5 pt-[92px] sm:px-8">
          <h1 className="font-heading text-[clamp(2.5rem,7vw,4rem)] font-bold leading-none tracking-tight text-gray-900 uppercase">
              {user ? (
              <>Bem-vindo de volta<br/><span className="text-accent-light">{user.name.split(" ")[0]}</span></>
            ) : (
              <>
                <div className="inline-flex flex-col items-start">
                  <span>Feito para</span>
                  <span className="text-accent-light whitespace-nowrap">quem vive o mar.</span>
                </div>
              </>
            )}
          </h1>
          {user && (
            <p className="mt-6 text-sm text-gray-400">
              A tua página de perfil e reservas está a caminho.
            </p>
          )}
        </div>

        {/* Wrapper no fundo — em fluxo, nao absolute */}
        <div className="relative z-10 flex flex-col pb-[32px] w-full max-w-[calc(50%-32px)] pl-5 sm:pl-8">
          {/* Container 1: subtitle + CTA + divider */}
          <div>
            <span className="block font-body text-lg lg:text-base xl:text-lg font-medium text-black">
              A plataforma de gestão para escolas de surf e desportos aquáticos. Os teus alunos reservam online, tu geres tudo num só lugar.
            </span>
            <a href="/user-flow" className="mt-4 mb-4 xl:mb-4 flex w-48 2xl:w-60 items-center rounded-3xl bg-accent-light px-4 py-1 2xl:py-1.5 shadow-lg">
              <span className="font-body text-xs 2xl:text-sm font-semibold text-white uppercase">Começar já</span>
              <div className="ml-auto flex h-6 w-6 2xl:h-8 2xl:w-8 items-center justify-center rounded-full bg-white" style={{ marginRight: '-8px' }}>
                <svg className="h-3 w-3 2xl:h-4 2xl:w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
            <div className="flex items-center mb-4 xl:mb-8 mr-4">
              <div className="h-px bg-gray-300 flex-1" />
            </div>
          </div>
          {/* Cards row */}
          <div className="flex flex-row gap-4 lg:gap-3 xl:gap-4 2xl:gap-8">
            {/* Card timeline */}
            <div className="flex-1 2xl:min-h-[284px] rounded-2xl border border-gray-200/70 bg-white/70 p-4 lg:p-3 xl:p-4 2xl:p-6 shadow-xl shadow-black/5 backdrop-blur-md">
              <div className="relative">
                <div className="absolute top-[12px] bottom-[12px] left-[9px] w-px bg-gradient-to-b from-accent-light via-accent-light/40 to-transparent z-0" />
                <ul className="space-y-6 lg:space-y-4 xl:space-y-6 2xl:space-y-8">
                  {[
                    { title: "Reservas online a qualquer hora", desc: "Os teus alunos marcam aulas 24/7 sem te ligar." },
                    { title: "Reduz os no-shows", desc: "Lembretes automáticos e política de cancelamento." },
                    { title: "Sem Whatsapp. Sem papéis.", desc: "Tudo centralizado: calendário, alunos e pagamentos." },
                  ].map((item, i) => (
                    <li key={i} className="group relative pl-10 lg:pl-8 xl:pl-10 cursor-pointer hover:bg-accent/5 rounded-lg -mx-2 px-2 transition-colors">
                      <div className="absolute left-[17px] top-1.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-accent-light/40 transition-all z-10 group-hover:scale-125 group-hover:bg-accent-light group-hover:shadow-[0_0_8px_rgba(30,111,168,0.5)]" />
                      <h3 className="font-body text-sm 2xl:text-base font-semibold text-gray-900">{item.title}</h3>
                      <p className="mt-0.5 text-xs 2xl:text-sm leading-snug text-gray-500">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Card novo */}
            <div className="flex-1 2xl:min-h-[284px] rounded-2xl border border-gray-200/70 bg-white/70 p-6 lg:p-4 xl:p-6 2xl:p-8 shadow-xl shadow-black/5 backdrop-blur-md">
              <p className="font-body text-xs 2xl:text-sm text-gray-400">Conteúdo em breve</p>
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
