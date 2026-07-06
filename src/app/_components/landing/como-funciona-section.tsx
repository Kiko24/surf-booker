"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import mockupImg from "@/components/images/mockup.png";

export function ComoFuncionaSection() {
  const [visible, setVisible] = useState(false);
  const ref = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); o.disconnect(); } }, { threshold: 0.15 });
    o.observe(el);
  }, []);

  return (
    <section id="como-funciona" className="bg-gray-50 px-5 py-16 sm:px-8 sm:py-24 relative">
      <div
        ref={ref}
        className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="mx-auto max-w-4xl">
          <h2 className="font-heading text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-gray-900 text-center mb-2">
            E se gerir a tua escola fosse mais simples?
          </h2>
          <p className="text-[clamp(1rem,1.3vw,1.125rem)] text-gray-700 text-center max-w-2xl mx-auto leading-relaxed">
            Whatsapp, papéis, chamadas perdidas. Agora tudo no mesmo lugar.<br/>Com a Alaia gere as tuas aulas, as tuas reservas e os teus pagamentos. O resto é mar.
          </p>
          <div className="mt-12 md:mt-24 w-full">
            <div className="flex flex-col md:flex-row gap-16 md:gap-24 lg:gap-80">
              <div className="flex-1 flex justify-center">
                <div className="w-fit flex-shrink-0 bg-white">
                  <Image src={mockupImg} alt="Mockup da plataforma Alaia" width={555} height={1115} className="w-auto max-w-[180px] sm:max-w-[240px] h-auto transition-transform duration-300 ease-out hover:scale-[1.02]" />
                </div>
              </div>
              <div className="flex-1 flex justify-center md:justify-start md:-ml-24">
                <div className="min-h-40 w-fit flex flex-col items-center text-center md:items-start md:text-left">
                  <h3 className="font-heading text-[clamp(1.25rem,2.5vw,2rem)] font-bold text-gray-900 whitespace-nowrap">Tudo na ponta dos teus dedos</h3>
                  <p className="mt-1 text-[clamp(1rem,1.3vw,1.125rem)] text-gray-600">Menos tempo a organizar, mais tempo no mar.</p>
                  <div className="relative mt-14 pl-8 self-start text-left">
                    <div className="absolute top-[12px] bottom-[12px] left-[11px] w-px bg-gradient-to-b from-accent-light via-accent-light/40 to-transparent z-0 pointer-events-none" />
                    <div className="space-y-10">
                      {[
                        { title: "Reservas online a qualquer hora", desc: "Agenda as tuas aulas mais rapidamente. O resto é com os alunos." },
                        { title: "Reduz os no-shows", desc: "Lembretes automáticos e política de cancelamento." },
                        { title: "Sem Whatsapp. Sem papéis.", desc: "Tudo centralizado: calendário, alunos e pagamentos." },
                      ].map((item, i) => (
                        <div key={i} className="relative pl-4 group">
                          <div className="absolute left-[-20px] top-1.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-accent-light/40 transition-all z-10 group-hover:scale-125 group-hover:bg-accent-light group-hover:shadow-[0_0_8px_rgba(30,111,168,0.5)]" />
                          <h3 className="font-heading text-[clamp(1rem,1.3vw,1.125rem)] font-semibold text-gray-900">{item.title}</h3>
                          <p className="mt-0.5 text-[clamp(0.8125rem,1vw,0.875rem)] leading-snug text-gray-700">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <a href="/como-organizar-melhor" className="group mt-10 flex items-center gap-2 rounded-full bg-accent px-6 py-3 shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.04] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-white">
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
  );
}
