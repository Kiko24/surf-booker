"use client";

import Link from "next/link";
import { useState } from "react";

const FAQS = [
  {
    pergunta: "Como criar uma nova aula?",
    resposta: "No calendário, clica no botão \"+\" no canto inferior direito. Preenche o serviço, data, horário e capacidade, depois clica em \"Criar\".",
  },
  {
    pergunta: "Como adicionar alunos a uma sessão?",
    resposta: "Expande a aula no calendário e clica em \"+ Adicionar aluno\". Podes procurar por alunos existentes ou criar um novo convidado.",
  },
  {
    pergunta: "Como adicionar um grupo a uma sessão?",
    resposta: "Expande a aula e clica em \"+ Adicionar grupo\". Indica o nome do responsável e o número de pessoas. O sistema cria automaticamente uma reserva para cada pessoa do grupo.",
  },
  {
    pergunta: "Como editar ou eliminar uma aula?",
    resposta: "Expande a aula no calendário e clica em \"Editar\" ou \"Eliminar\". A eliminação é definitiva e remove todas as reservas associadas.",
  },
  {
    pergunta: "Como gerir os serviços (aulas) disponíveis?",
    resposta: "Vai à página \"Serviços\" através do menu inferior. Aqui podes adicionar, editar ou eliminar serviços, definir modalidades, duração e preços (avulso ou packs).",
  },
  {
    pergunta: "Como adicionar fotos ao meu negócio?",
    resposta: "Na página \"Mais\" > \"Imagens\", clica no círculo para selecionar uma foto. O formato deve ser PNG, WebP ou JPEG, com máximo de 2MB e até 6 imagens.",
  },
  {
    pergunta: "Como gerir os alunos?",
    resposta: "Na página \"Alunos\" tens uma lista de todos os alunos. Podes pesquisar, filtrar e ver o histórico de aulas de cada aluno.",
  },
  {
    pergunta: "Os dados estão seguros?",
    resposta: "Sim. Todas as operações são autenticadas e registadas. As imagens são armazenadas com controlo de acesso por propriedade da escola.",
  },
];

export function MaisHelpView() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <main className="px-5 pt-4">

        {/* Back button */}
        <div className="mt-6 mb-6">
          <Link
            href="/dashboard/mais"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition-colors"
          >
            <svg aria-hidden={true} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Voltar
          </Link>
        </div>

        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Apoio</h1>
        <p className="font-body text-sm text-text-secondary mb-8">
          Perguntas frequentes e contactos de suporte
        </p>

        {/* FAQ */}
        <div className="space-y-2 mb-8">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-xl bg-surface overflow-hidden">
              <button
                type="button"
                id={`faq-button-${i}`}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
                aria-controls={`faq-panel-${i}`}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#2A2A2A]"
              >
                <span className="font-body text-sm font-semibold text-foreground pr-4">{faq.pergunta}</span>
                <svg
                  aria-hidden={true}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${openIndex === i ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
          {openIndex === i && (
            <div
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-button-${i}`}
              className="px-5 pb-4"
            >
              <p className="font-body text-sm leading-relaxed text-text-secondary">{faq.resposta}</p>
            </div>
          )}
            </div>
          ))}
        </div>

        {/* Support contacts */}
        <div className="rounded-xl bg-surface p-5 mb-8">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4">Contactos de suporte</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20">
                <svg aria-hidden={true} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-accent">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <p className="font-body text-xs text-text-secondary">Telefone</p>
                <a href="tel:+351000000000" className="font-body text-sm text-foreground hover:text-accent transition-colors">
                  +351 000 000 000
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20">
                <svg aria-hidden={true} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-accent">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div>
                <p className="font-body text-xs text-text-secondary">Email</p>
                <a href="mailto:suporte@surfbooker.pt" className="font-body text-sm text-foreground hover:text-accent transition-colors">
                  suporte@surfbooker.pt
                </a>
              </div>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
