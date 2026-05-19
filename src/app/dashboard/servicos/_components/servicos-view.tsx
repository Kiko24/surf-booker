"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  HomeIcon,
  CalendarIcon,
  GroupIcon,
  SessionsIcon,
  DotsIcon,
  PlusIcon,
} from "@/app/dashboard/_components/icons";
import type { SessionRecord } from "../actions";

type Props = {
  fullName: string;
  sessions: SessionRecord[];
  schoolId: string | null;
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/dashboard/calendario", label: "Calendário", icon: CalendarIcon },
  { href: "/dashboard/alunos", label: "Alunos", icon: GroupIcon },
  { href: "/dashboard/servicos", label: "Serviços", icon: SessionsIcon },
  { href: "/dashboard/mais", label: "Mais", icon: DotsIcon },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "cancelled") {
    return <span className="rounded-full bg-error/20 px-2 py-0.5 text-xs font-semibold text-error">Cancelada</span>;
  }
  return null;
}

export function ServicosView({ sessions, schoolId }: Props) {
  const pathname = usePathname();
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalidade, setModalidade] = useState("");
  const [selectedType, setSelectedType] = useState<"avulso" | "pack" | null>(null);
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("");
  const [contem, setContem] = useState("");

  return (
    <div className="h-dvh overflow-hidden bg-background text-foreground font-body flex flex-col">
      <main className="flex-1 flex flex-col px-5 pt-0 pb-24">
        <section className="mt-6 mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Serviços
          </h1>
        </section>

        <button
          type="button"
          onClick={() => {
            setShowModal(true);
            setModalidade("");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-body text-lg font-semibold text-primary-foreground shadow-lg transition-transform active:scale-95"
        >
          <PlusIcon className="h-5 w-5" />
          Adicionar serviços
        </button>

        <div className="mt-4 w-full max-w-md mx-auto divide-y divide-foreground/10">
          {sessions.map((s) => {
            const pct = s.capacidade > 0 ? (s.alunos / s.capacidade) * 100 : 0;
            const isFull = s.alunos >= s.capacidade;
            return (
              <div
                key={s.id}
                className="flex items-center gap-4 py-3"
              >
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-background text-foreground">
                  <span className="font-heading text-lg font-bold leading-tight text-accent">
                    {s.time.split(":")[0]}
                  </span>
                  <span className="text-[10px] leading-tight text-text-muted">
                    {s.time.split(":")[1]}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-body text-base font-bold text-foreground truncate">
                    {s.nome}
                  </h3>
                  <div className="mt-0.5 text-xs text-text-secondary">
                    {s.weekday}, {s.dateLabel}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className={`text-xs font-semibold ${isFull ? "text-error" : pct <= 50 ? "text-success" : "text-text-muted"}`}>
                      {s.alunos}/{s.capacidade} inscritos
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSession(s)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:text-foreground transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </main>

      {/* Session popup */}
      {selectedSession && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-10">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />

            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-background text-foreground">
                <span className="font-heading text-xl font-bold leading-tight text-accent">
                  {selectedSession.time.split(":")[0]}
                </span>
                <span className="text-xs leading-tight text-text-muted">
                  {selectedSession.time.split(":")[1]}
                </span>
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">{selectedSession.nome}</h3>
                <p className="font-body text-sm text-text-secondary">
                  {selectedSession.weekday}, {selectedSession.dateLabel}
                </p>
                <StatusBadge status={selectedSession.status} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                <p className="font-body text-xs text-text-secondary">Inscrições</p>
                <p className="font-body text-sm text-foreground">{selectedSession.alunos}/{selectedSession.capacidade} alunos</p>
              </div>

              {selectedSession.alunosList.length > 0 && (
                <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                  <p className="font-body text-xs text-text-secondary mb-2">Alunos inscritos</p>
                  <div className="space-y-2">
                    {selectedSession.alunosList.map((nome) => (
                      <div key={nome} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-accent">
                          {nome.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-body text-sm text-foreground">{nome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedSession(null)}
              className="mt-6 w-full rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-10 max-h-[90vh] overflow-y-auto">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />

            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">
              Adicionar serviço
            </h3>

            <div className="space-y-4">
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Modalidade <span className="text-error">*</span>
                </label>
                <select
                  value={modalidade}
                  onChange={(e) => setModalidade(e.target.value)}
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent"
                >
                  <option value="" disabled>Selecionar modalidade</option>
                </select>
              </div>

              <p className="font-body text-sm text-text-secondary text-center pt-2">
                Seleciona o tipo de serviço
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType("pack");
                    setDescricao("");
                    setPreco("");
                    setDuracao("");
                    setContem("");
                  }}
                  className={`flex-1 rounded-xl py-3 font-body text-sm font-semibold transition-all ${
                    selectedType === "pack"
                      ? "bg-accent text-primary-foreground"
                      : "bg-[#2A2A2A] text-text-secondary hover:text-foreground"
                  }`}
                >
                  Pack
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType("avulso");
                    setDescricao("");
                    setPreco("");
                    setDuracao("");
                    setContem("");
                  }}
                  className={`flex-1 rounded-xl py-3 font-body text-sm font-semibold transition-all ${
                    selectedType === "avulso"
                      ? "bg-accent text-primary-foreground"
                      : "bg-[#2A2A2A] text-text-secondary hover:text-foreground"
                  }`}
                >
                  Avulso
                </button>
              </div>

              {selectedType === "avulso" && (
                <div className="space-y-4 pt-2 border-t border-foreground/10">
                  <div>
                    <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                      Descrição <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Ex: Aula de surf para iniciantes"
                      className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                    />
                  </div>

                  <div>
                    <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                      Preço <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={preco}
                      onChange={(e) => setPreco(e.target.value)}
                      placeholder="Ex: 45"
                      className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                    />
                  </div>

                  <div>
                    <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                      Duração <span className="text-text-muted">(minutos)</span> <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="480"
                      value={duracao}
                      onChange={(e) => setDuracao(e.target.value)}
                      placeholder="Ex: 90"
                      className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                    />
                  </div>

                  <div>
                    <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                      O que contém <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={contem}
                      onChange={(e) => setContem(e.target.value)}
                      placeholder="Ex: Prancha, faty, seguro"
                      className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scroll shadow */}
      <div className="pointer-events-none fixed bottom-[calc(1.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 h-16 bg-gradient-to-t from-background to-transparent" />

      <nav
        className="fixed left-1/2 z-50 flex w-[90%] max-w-md -translate-x-1/2 items-center justify-around rounded-full border border-accent/10 bg-surface-container-high px-2 py-2 shadow-lg backdrop-blur-md"
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-accent text-primary-foreground transition-all duration-200"
                  : "flex h-12 w-12 items-center justify-center rounded-full text-text-secondary transition-all hover:bg-accent/10"
              }
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
