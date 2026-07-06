"use client";

import { useState } from "react";

const FAQS = [
  { q: "Preciso de conhecimentos técnicos para usar a Alaia?", a: "Não. A Alaia foi desenhada para donos de escolas de surf que não querem perder tempo com tecnologia. Em poucos minutos tens tudo configurado." },
  { q: "Posso experimentar antes de pagar?", a: "Para além da demonstração gratuita, ainda podemos oferecer 14 dias grátis para experimentar a plataforma." },
  { q: "Os meus alunos conseguem reservar sem instalar nada?", a: "Sim, os alunos podem reservar através do vosso website ou da página da escola aqui na Alaia." },
  { q: "Quais são as vantagens dos meus alunos terem conta?", a: "Eles podem acompanhar todo o histórico das aulas, reagendar com facilidade sem telefonar para a escola, comprar packs de aulas, entre outras vantagens!" },
  { q: "E se precisar de ajuda?", a: "Estamos disponíveis por email e podes agendar uma demonstração personalizada para ver a plataforma ao vivo." },
];

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="bg-gray-800 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <h2 className="font-heading text-[clamp(1.25rem,2.5vw,2rem)] font-bold text-white text-center">
          Perguntas frequentes
        </h2>
        <div className="mt-8 space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left font-body font-semibold text-white transition-colors hover:bg-white/20"
              >
                <span>{faq.q}</span>
                <svg className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 mt-2 text-base font-body text-gray-300 leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
