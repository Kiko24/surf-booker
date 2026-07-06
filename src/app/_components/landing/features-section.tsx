"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import featuresImg from "@/components/images/features.png";

export function FeaturesSection() {
  const [visible, setVisible] = useState(false);
  const ref = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); o.disconnect(); } }, { threshold: 0.2 });
    o.observe(el);
  }, []);

  return (
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-24 relative">
      <div
        ref={ref}
        className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="mx-auto max-w-4xl">
          <h2 className="font-heading text-[clamp(1.25rem,2.5vw,2rem)] font-bold text-gray-900 text-center">Menos tempo perdido. Mais organização.</h2>
          <p className="mt-1 text-[clamp(1rem,1.3vw,1.125rem)] text-gray-600 text-center">Ferramentas para pores a escola a funcionar sozinha</p>
          <div className="mt-12 md:mt-24 w-full">
            <div className="flex flex-col md:flex-row gap-16 md:gap-24 lg:gap-80">
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
                        <p className="text-[clamp(0.8125rem,1vw,0.875rem)] text-gray-700 mt-0.5">Os alunos marcam online. Tu geres sem perder o controlo.</p>
                      </div>
                    </li>
                    <li className="group relative flex items-start gap-3 -mx-3 px-3 py-2 rounded-lg transition-all duration-300 ease-out hover:bg-gray-50 hover:translate-x-2 hover:scale-[1.02]">
                      <svg className="mt-1 h-4 w-4 flex-shrink-0 text-accent-light transition-transform duration-300 ease-out group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      <div>
                        <strong className="font-heading text-[clamp(1rem,1.3vw,1.125rem)] font-semibold text-gray-900">Waivers digitais.</strong>
                        <p className="text-[clamp(0.8125rem,1vw,0.875rem)] text-gray-700 mt-0.5">Os teus alunos assinam a responsabilidade antes de chegar à praia.</p>
                      </div>
                    </li>
                    <li className="group relative flex items-start gap-3 -mx-3 px-3 py-2 rounded-lg transition-all duration-300 ease-out hover:bg-gray-50 hover:translate-x-2 hover:scale-[1.02]">
                      <svg className="mt-1 h-4 w-4 flex-shrink-0 text-accent-light transition-transform duration-300 ease-out group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      <div>
                        <strong className="font-heading text-[clamp(1rem,1.3vw,1.125rem)] font-semibold text-gray-900">Alunos e packs de aulas.</strong>
                        <p className="text-[clamp(0.8125rem,1vw,0.875rem)] text-gray-700 mt-0.5">Perfil completo e vendas adiantadas. Fidelizas e garantes receita.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex-1 flex justify-start md:-ml-24">
                <div className="w-full h-[300px] md:h-auto relative overflow-hidden rounded-[3rem]">
                  <Image src={featuresImg} alt="" fill className="object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
