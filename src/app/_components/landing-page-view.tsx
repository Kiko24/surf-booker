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
    <div className="bg-white">
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

          <a href="/" className="font-heading text-xl font-bold text-accent">
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
                  className="font-body rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:brightness-110"
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

      {/* Hero — 100dvh */}
      <section className="relative flex h-dvh flex-col">
        {/* Photo — absolute, decorativa */}
        <div className="absolute right-[32px] top-[92px] bottom-[32px] z-[1] w-[calc(50%-32px)] overflow-hidden rounded-xl">
          <Image src="/images/hero-section.png" alt="" fill sizes="50vw" className="object-cover" priority />
          {/* CTA — retângulo branco centrado horizontalmente na foto */}
          <a href="/user-flow" className="absolute left-1/2 -translate-x-1/2 flex w-60 items-center rounded-3xl border border-gray-200 bg-white px-4 py-1.5 shadow-lg" style={{ bottom: '48px' }}>
            <span className="font-body text-sm font-semibold text-black uppercase">Começar já</span>
            <div className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-black" style={{ marginRight: '-8px' }}>
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        </div>

        {/* Timeline features + divider */}
        <div className="absolute z-10 flex flex-col left-5 sm:left-8" style={{ right: 'calc(50% + 32px)', bottom: '32px' }}>
          {/* Placeholder text — absolute, 32px acima do divider */}
          <span className="absolute bottom-full mb-8 font-body text-lg font-medium text-black left-0 right-0 max-w-full">
            A plataforma de gestão para escolas de surf e watersports. Os teus alunos reservam online, tu geres tudo num só lugar.
          </span>
          {/* Divider */}
          <div className="flex items-center mb-8 mr-4">
            <div className="h-px bg-gray-300 flex-1" />
          </div>
          {/* Row: rectangle + 32px gap + bullet points */}
          <div className="flex items-stretch">
            {/* Rectangle — dark filler */}
            <div className="bg-[#1E1E1E] flex-1" />
            {/* 32px spacer */}
            <div className="w-8 shrink-0" />
            {/* Features — mantém estrutura original */}
            <div className="flex justify-end shrink-0">
              <div className="relative max-w-sm">
              <div className="absolute inset-y-0 left-[16.5px] w-px bg-gradient-to-b from-blue-600 via-blue-600/40 to-transparent" />
              <ul className="space-y-10">
                {[
                  { title: "Reservas online a qualquer hora" },
                  { title: "Reduz os no-shows" },
                  { title: "Sem Whatsapp. Sem papéis." },
                ].map((item, i) => (
                  <li key={i} className="relative pl-10">
                    <div className={`absolute left-[16.5px] top-1.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white ${i === 0 ? "bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" : "bg-blue-600/40"}`} />
                    <h3 className="font-body text-sm font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-0.5 text-sm leading-snug min-h-[2.5rem]">&nbsp;</p>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          </div>

          </div>

          {/* Bottom — conteúdo */}
          <div className="relative flex flex-1 flex-col px-5 pb-12 sm:px-8 lg:pb-16">
            <div className="mt-[92px] min-h-[calc(100dvh-160px)] w-full max-w-6xl">
              {/* Left — headline + CTA */}
              <div className="text-left">
                <h1 className="font-heading text-[clamp(2.5rem,7vw,4rem)] font-bold leading-none tracking-tight text-gray-900 uppercase">
                  {user ? (
                    <>Bem-vindo de volta<br/><span className="text-accent">{user.name.split(" ")[0]}</span></>
                  ) : (
                    <>
                      <div className="inline-flex flex-col items-start">
                        <div className="flex items-center w-full">
                          <span className="shrink-0">Feito</span>
                          <span className="w-6 shrink-0" />
                          <span className="flex-1 h-px bg-gray-300" />
                          <span className="inline-block h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-gray-300" />
                        </div>
                        <span className="text-accent whitespace-nowrap">Para quem vive o mar.</span>
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
