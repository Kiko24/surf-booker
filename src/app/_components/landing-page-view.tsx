"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import mockupImg from "@/components/images/mockup.png";
import breakImg from "@/components/images/break.png";
import demoImg from "@/components/images/demo.png";
import { useRef, useState, useEffect } from "react";
import { useScrollReveal } from "./use-scroll-reveal";
import { z } from "zod";

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
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const contactSchema = z.object({
    name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80, "Máximo 80 caracteres"),
    email: z.string().trim().toLowerCase().email("Email inválido").max(160),
    message: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
  });

  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    console.log("Contact data:", parsed.data);
  }
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

  const comoFuncionaReveal = useScrollReveal(0.15);
  const featuresReveal = useScrollReveal(0.2);
  const contactReveal = useScrollReveal(0.15);
  const breakTextReveal = useScrollReveal(0.2);

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
            <button
              onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
              className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent-light"
            >
              Como funciona?
            </button>
            <button
              onClick={() => document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" })}
              className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent-light"
            >
              Contacto
            </button>
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
        <button
          onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
          className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent-light"
        >
          Como funciona?
        </button>
        <button
          onClick={() => document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" })}
          className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent-light"
        >
          Contacto
        </button>
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
        <div
          ref={comoFuncionaReveal.ref}
          className={`transition-all duration-700 ease-out ${comoFuncionaReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
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
        <div
          ref={breakTextReveal.ref}
          className={`relative z-10 transition-all duration-700 ease-out ${breakTextReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="text-center px-5 sm:px-8">
            <p className="text-[clamp(1rem,1.8vw,1.375rem)] font-semibold text-white/90">
              Deixa a gestão connosco.<br/>O surf é contigo.
            </p>
            <h2 className="mt-4 font-heading text-[clamp(1.5rem,3.5vw,3rem)] font-bold text-white whitespace-nowrap">
              Não, não é magia, é Alaia!
            </h2>
          </div>
        </div>
      </section>

      {/* Organização section */}
      <section className="bg-white px-5 py-16 sm:px-8 sm:py-24 relative">
        <div
          ref={featuresReveal.ref}
          className={`transition-all duration-700 ease-out ${featuresReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="mx-auto max-w-4xl">
          <h2 className="font-heading text-[clamp(1.25rem,2.5vw,2rem)] font-bold text-gray-900 text-center">Menos tempo perdido. Mais organização.</h2>
          <p className="mt-1 text-[clamp(1rem,1.3vw,1.125rem)] text-gray-600 text-center">Ferramentas para pores a escola a funcionar sozinha</p>
          <div className="mt-24 w-full">
            <div className="flex flex-col md:flex-row gap-80">
              <div className="flex-1 flex justify-center">
                <div className="w-full max-w-[240px] overflow-visible -ml-2">
                  <h3 className="font-heading text-[clamp(1.25rem,2.5vw,2rem)] font-bold text-gray-900 text-left whitespace-nowrap">O que a Alaia faz por ti.</h3>
                  <p className="font-body text-[clamp(1rem,1.3vw,1.125rem)] text-gray-600 text-left">Ao pormenor.</p>
                  <ul className="mt-10 space-y-6 text-left leading-snug">
                    <li className="group relative flex items-start gap-3 -mx-3 px-3 py-2 rounded-lg transition-all duration-300 ease-out hover:bg-gray-50 hover:translate-x-2 hover:scale-[1.02]">
                      <svg className="mt-1 h-4 w-4 flex-shrink-0 text-accent-light transition-transform duration-300 ease-out group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      <div>
                        <strong className="font-heading text-[clamp(1rem,1.3vw,1.125rem)] font-semibold text-gray-900">Reservas e pagamentos.</strong>
                        <p className="text-[clamp(0.75rem,1vw,0.875rem)] text-gray-700 mt-0.5">Os alunos marcam online. Tu geres sem perder o controlo.</p>
                      </div>
                    </li>
                    <li className="group relative flex items-start gap-3 -mx-3 px-3 py-2 rounded-lg transition-all duration-300 ease-out hover:bg-gray-50 hover:translate-x-2 hover:scale-[1.02]">
                      <svg className="mt-1 h-4 w-4 flex-shrink-0 text-accent-light transition-transform duration-300 ease-out group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      <div>
                        <strong className="font-heading text-[clamp(1rem,1.3vw,1.125rem)] font-semibold text-gray-900">Waivers digitais.</strong>
                        <p className="text-[clamp(0.75rem,1vw,0.875rem)] text-gray-700 mt-0.5">Os teus alunos assinam a responsabilidade antes de chegar à praia.</p>
                      </div>
                    </li>
                    <li className="group relative flex items-start gap-3 -mx-3 px-3 py-2 rounded-lg transition-all duration-300 ease-out hover:bg-gray-50 hover:translate-x-2 hover:scale-[1.02]">
                      <svg className="mt-1 h-4 w-4 flex-shrink-0 text-accent-light transition-transform duration-300 ease-out group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      <div>
                        <strong className="font-heading text-[clamp(1rem,1.3vw,1.125rem)] font-semibold text-gray-900">Alunos e packs de aulas.</strong>
                        <p className="text-[clamp(0.75rem,1vw,0.875rem)] text-gray-700 mt-0.5">Perfil completo e vendas adiantadas. Fidelizas e garantes receita.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex-1 flex justify-start -ml-24">
                <div className="w-full min-h-full relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-gray-100/80 via-gray-50 to-gray-100/60">
                  <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-gradient-to-bl from-gray-200/60 to-transparent blur-xl" />
                  <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-gradient-to-tr from-gray-200/40 to-transparent blur-lg" />
                  <div className="absolute top-1/3 left-1/4 h-20 w-20 rounded-full bg-gray-200/30 blur-md" />
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      {/* Contacto section */}
      <section id="contacto" className="relative overflow-hidden px-5 py-16 sm:px-8 sm:py-24 bg-gradient-to-b from-white to-gray-50">
        <div
          ref={contactReveal.ref}
          className={`transition-all duration-700 ease-out ${contactReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="mx-auto max-w-4xl relative z-10">
          <h2 className="font-heading text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-gray-900 text-center">
            Ainda estás reticente?
          </h2>
          <p className="mt-1 text-[clamp(1rem,1.3vw,1.125rem)] text-gray-600 text-center">
            Tira as tuas dúvidas connosco
          </p>
          <div className="mt-12 flex flex-col md:flex-row gap-6 items-stretch">
            <div className="flex-1">
              <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-md h-full">
                <form className="space-y-4" onSubmit={handleContactSubmit}>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Nome</label>
                      <input type="text" placeholder="O teu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light shadow-sm" />
                      {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Email</label>
                      <input type="email" placeholder="o teu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={160} className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light shadow-sm" />
                      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Mensagem</label>
                    <textarea placeholder="O que te traz até nós?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={500} rows={3} className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light shadow-sm resize-none min-h-[100px]" />
                    {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                  </div>
                  <div className="text-center">
                    <button type="submit" className="group mx-auto inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-black shadow-sm w-[200px] transition-all duration-300 ease-out hover:shadow-md hover:scale-[1.04] hover:-translate-y-0.5">
                      Enviar
                      <svg className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="hidden md:block w-px self-stretch bg-gradient-to-b from-transparent via-gray-200 to-transparent flex-shrink-0" />

            <div className="flex-1">
              <div className="relative overflow-hidden rounded-2xl shadow-md h-full flex flex-col items-center text-center p-6 sm:p-8">
                <div className="absolute inset-0 z-0">
                  <Image src={demoImg} alt="" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
                </div>
                <div className="relative z-10 flex flex-col items-center flex-1 w-full">
                  <h3 className="font-heading text-lg font-bold text-white">Explora a Alaia</h3>
                  <p className="mt-1 text-sm text-white/80 max-w-xs">Fala connosco em direto e nós orquestramos-te a visita. Depois decides se é para ti</p>
                  <div className="mt-auto pt-6">
                    <a href="#" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all duration-300 ease-out hover:shadow-md hover:scale-[1.04] hover:-translate-y-0.5">
                      Agendar demonstração
                      <svg className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-5 py-8 text-center text-sm text-gray-500">
        <p>Alaia — Marca sessões facilmente.</p>
      </footer>
    </div>
  );
}
