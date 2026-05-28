"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import mockupImg from "@/components/images/mockup.png";
import breakImg from "@/components/images/break.png";
import { useRef, useState, useEffect } from "react";

type UserInfo = {
  id: string;
  email: string;
  name: string;
};

export function LandingPageView({ user }: { user: UserInfo | null }) {
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;
    if (!section || !image) return;
    if (isMobile) {
      image.style.transform = "none";
      return;
    }
    let ticking = false;
    const update = () => {
      const rect = section.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const clamped = Math.max(0, Math.min(1, progress));
      const offset = (clamped - 0.5) * 2 * section.offsetHeight * 0.5 * 0.5;
      image.style.transform = `translateY(${offset}px)`;
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      image.style.transform = "none";
    };
  }, [isMobile]);

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
              className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent-light"
            >
              Como funciona?
            </a>
            <a
              href="#precos"
              className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent-light"
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
          className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent-light"
        >
          Como funciona?
        </a>
        <a
          href="#precos"
          className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent-light"
        >
          Preços
        </a>
        {!user && (
          <a href="/onboarding" className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-accent transition-all hover:bg-accent/10">
            Entrar
          </a>
        )}
      </div>

      <section className="relative z-0 flex min-h-dvh items-center justify-center overflow-hidden">
        {/* Imagem de fundo */}
        <div className="absolute inset-0 z-0">
          <Image src="/images/hero-section.png" alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
        </div>

        {/* Conteúdo centrado */}
        <div className="relative z-10 flex flex-col items-center text-center px-5 sm:px-8 max-w-3xl">
          <h1 className="font-heading text-[clamp(2.5rem,6.11vw,5.5rem)] font-bold leading-none tracking-tight text-white uppercase">
            Feito para<br/>
            <span className="text-accent">quem vive o mar.</span>
          </h1>
          <p className="mt-6 text-[clamp(1rem,1.528vw,1.375rem)] font-semibold text-white/90 max-w-2xl">
            A plataforma de gestão para escolas de surf e desportos aquáticos.<br/>
            Os alunos reservam online, tu geres tudo num só lugar.
          </p>
          <a href="/user-flow" className="group mt-8 flex w-56 md:w-60 items-center justify-center rounded-full bg-accent px-8 py-3.5 shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.04] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-white">
            <span className="font-body text-sm font-semibold text-black uppercase">Começar já</span>
            <svg className="ml-2 h-4 w-4 text-black transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>

      <section id="como-funciona" className="bg-gray-50 px-5 py-16 sm:px-8 sm:py-24 relative">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-heading text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-gray-900 text-center mb-2">
            E se gerir a tua escola fosse mais simples?
          </h2>
          <p className="text-[clamp(1rem,1.3vw,1.125rem)] text-gray-700 text-center max-w-2xl mx-auto leading-relaxed">
            Whatsapp, papéis, chamadas perdidas. Agora tudo no mesmo lugar.<br/>Com a Alaia gere as tuas aulas, as tuas reservas e os teus pagamentos. O resto é mar.
          </p>
          <div className="mt-24 w-full">
            <div className="flex flex-col md:flex-row gap-80">
              <div className="flex-1 flex justify-center">
                <div className="w-fit flex-shrink-0 bg-white">
                  <Image src={mockupImg} alt="Mockup da plataforma Alaia" width={555} height={1115} className="w-auto max-w-[240px] h-auto transition-transform duration-300 ease-out hover:scale-[1.02]" />
                </div>
              </div>
              <div className="flex-1 flex justify-start -ml-24">
                <div className="min-h-40 w-fit flex flex-col items-start">
                  <h3 className="font-heading text-[clamp(1.25rem,2.5vw,2rem)] font-bold text-gray-900 whitespace-nowrap">Tudo na ponta dos teus dedos</h3>
                  <p className="mt-1 text-[clamp(1rem,1.3vw,1.125rem)] text-gray-600">Menos tempo a organizar, mais tempo no mar.</p>
                  <div className="relative mt-14 pl-8">
                    <div className="absolute top-[12px] bottom-[12px] left-[11px] w-px bg-gradient-to-b from-accent-light via-accent-light/40 to-transparent z-0 pointer-events-none" />
                    <div className="space-y-12">
                      {[
                        { title: "Reservas online a qualquer hora", desc: "Os teus alunos marcam aulas 24/7 sem te ligar." },
                        { title: "Reduz os no-shows", desc: "Lembretes automáticos e política de cancelamento." },
                        { title: "Sem Whatsapp. Sem papéis.", desc: "Tudo centralizado: calendário, alunos e pagamentos." },
                      ].map((item, i) => (
                        <div key={i} className="relative pl-4 group">
                          <div className="absolute left-[-20px] top-1.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-accent-light/40 transition-all z-10 group-hover:scale-125 group-hover:bg-accent-light group-hover:shadow-[0_0_8px_rgba(30,111,168,0.5)]" />
                          <h3 className="font-heading text-[clamp(1rem,1.3vw,1.125rem)] font-semibold text-gray-900">{item.title}</h3>
                          <p className="mt-0.5 text-[clamp(0.75rem,1vw,0.875rem)] leading-snug text-gray-700">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <a href="#" className="group mt-10 flex items-center gap-2 rounded-full bg-accent px-6 py-3 shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.04] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-white">
                    <span className="font-body text-sm font-semibold text-black">Como organizar melhor</span>
                    <svg className="h-4 w-4 text-black transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Break Section */}
      <section
        ref={sectionRef}
        className="relative overflow-hidden min-h-[250px] sm:min-h-[400px] flex items-center justify-center"
      >
        <div ref={imageRef} className="absolute inset-0 z-0 will-change-transform" style={{ top: "-10%", height: "120%" }}>
          <Image src={breakImg} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
        </div>
        <div className="relative z-10 text-center px-5 sm:px-8">
          <p className="text-[clamp(1rem,1.8vw,1.375rem)] font-semibold text-white/90">
            Deixa a gestão connosco.<br/>O surf é contigo.
          </p>
          <h2 className="mt-2 font-heading text-[clamp(1.5rem,3.5vw,3rem)] font-bold text-white whitespace-nowrap">
            Não, não é magia, é Alaia!
          </h2>
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
      <footer className="border-t border-gray-100 bg-white px-5 py-8 text-center text-sm text-gray-500">
        <p>Alaia — Marca sessões facilmente.</p>
      </footer>
    </div>
  );
}
