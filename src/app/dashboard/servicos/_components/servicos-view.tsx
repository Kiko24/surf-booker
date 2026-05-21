"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PlusIcon,
} from "@/app/dashboard/_components/icons";
import type { ServicoRecord, PackOption } from "../actions";
import { addServico, deleteServico, updateServico } from "../actions";

type Props = {
  fullName: string;
  sessions: ServicoRecord[];
  schoolId: string | null;
};

const MODALIDADES = ["Surf", "SUP", "Bodyboard", "Windsurf", "Kitesurf", "Longboard"];

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + "€";
}

function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

type PackFormEntry = {
  tempId: string;
  id?: string;
  nome: string;
  numeroAulas: string;
  preco: string;
};

let packIdCounter = 0;
function nextPackId() { return `pack_${++packIdCounter}`; }

export function ServicosView({ sessions, schoolId }: Props) {
  const router = useRouter();
  const [selectedSession, setSelectedSession] = useState<ServicoRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingServico, setEditingServico] = useState<ServicoRecord | null>(null);
  const [deletingServico, setDeletingServico] = useState<ServicoRecord | null>(null);

  // form fields
  const [nome, setNome] = useState("");
  const [modalidade, setModalidade] = useState("");
  const [duracao, setDuracao] = useState("");
  const [sobre, setSobre] = useState("");
  const [avulsoAtivo, setAvulsoAtivo] = useState(false);
  const [avulsoPreco, setAvulsoPreco] = useState("");
  const [packs, setPacks] = useState<PackFormEntry[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  function resetForm() {
    setNome("");
    setModalidade("");
    setDuracao("");
    setSobre("");
    setAvulsoAtivo(false);
    setAvulsoPreco("");
    setPacks([]);
  }

  function fillEditForm(s: ServicoRecord) {
    setNome(s.nome);
    setModalidade(s.modalidade);
    setDuracao(String(s.duracao));
    setSobre(s.sobre);
    setAvulsoAtivo(s.avulsoDisponivel);
    setAvulsoPreco(String(s.avulsoPreco / 100));
    setPacks(
      s.packs.map((p) => ({
        tempId: nextPackId(),
        id: p.id,
        nome: p.nome,
        numeroAulas: String(p.numeroAulas),
        preco: String(p.preco / 100),
      }))
    );
  }

  function addPackEntry() {
    setPacks((prev) => [
      ...prev,
      { tempId: nextPackId(), nome: "", numeroAulas: "", preco: "" },
    ]);
  }

  function removePackEntry(tempId: string) {
    setPacks((prev) => prev.filter((p) => p.tempId !== tempId));
  }

  function updatePackEntry(tempId: string, field: keyof Omit<PackFormEntry, "tempId" | "id">, value: string) {
    setPacks((prev) =>
      prev.map((p) => (p.tempId === tempId ? { ...p, [field]: value } : p))
    );
  }

  return (
    <>
      <main className="px-5 pt-4">
        <section className="mt-6 mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Serviços
          </h1>
        </section>

        <button
          type="button"
          onClick={() => {
            setEditingServico(null);
            setShowModal(true);
            resetForm();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-body text-lg font-semibold text-primary-foreground shadow-lg transition-transform active:scale-95"
        >
          <PlusIcon className="h-5 w-5" />
          Adicionar serviços
        </button>

        <div className="mt-4 w-full max-w-md mx-auto divide-y divide-foreground/10">
          {sessions.length === 0 ? (
            <p className="py-8 text-center font-body text-base text-text-secondary">
              Nenhum serviço criado ainda
            </p>
          ) : sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 py-3"
            >
              <button
                type="button"
                onClick={() => setSelectedSession(s)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-body text-base font-bold text-foreground truncate">
                    {s.nome}
                  </h3>
                  {s.modalidade && (
                    <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-text-secondary">
                      {s.modalidade}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  {s.avulsoDisponivel && (
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent">
                      Avulso
                    </span>
                  )}
                  {s.packs.length > 0 && (
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-400">
                      Pack
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-text-secondary">
                  {s.avulsoDisponivel && (
                    <span>{formatPrice(s.avulsoPreco)} avulso</span>
                  )}
                  {s.avulsoDisponivel && s.packs.length > 0 && (
                    <span>{" · "}</span>
                  )}
                  {s.packs.map((p, i) => (
                    <span key={p.id}>
                      {i > 0 && <span>{" · "}</span>}
                      Pack {p.numeroAulas}x {formatPrice(p.preco)}
                    </span>
                  ))}
                </div>
                <div className="mt-0.5 text-xs text-text-muted">
                  {s.vezesUsado} {s.vezesUsado === 1 ? "vez utilizado" : "vezes utilizado"}
                </div>
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingServico(s);
                    setShowModal(true);
                    fillEditForm(s);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:text-accent transition-colors"
                  aria-label="Editar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingServico(s)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:text-error transition-colors"
                  aria-label="Eliminar"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Service popup */}
      {selectedSession && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-10">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />

            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-background text-xl font-bold text-accent">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">{selectedSession.nome}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {selectedSession.avulsoDisponivel && (
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent">Avulso</span>
                  )}
                  {selectedSession.packs.length > 0 && (
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-400">Pack</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {selectedSession.modalidade && (
                <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                  <p className="font-body text-xs text-text-secondary">Modalidade</p>
                  <p className="font-body text-sm text-foreground">{selectedSession.modalidade}</p>
                </div>
              )}

              <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                <p className="font-body text-xs text-text-secondary">Duração</p>
                <p className="font-body text-sm text-foreground">{selectedSession.duracao} minutos</p>
              </div>

              {selectedSession.avulsoDisponivel && (
                <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                  <p className="font-body text-xs text-text-secondary">Preço avulso</p>
                  <p className="font-body text-sm text-foreground">{formatPrice(selectedSession.avulsoPreco)}</p>
                </div>
              )}

              {selectedSession.packs.length > 0 && (
                <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                  <p className="font-body text-xs text-text-secondary mb-2">Packs disponíveis</p>
                  {selectedSession.packs.map((p) => (
                    <p key={p.id} className="font-body text-sm text-foreground">
                      {p.nome}: {p.numeroAulas} aulas · {formatPrice(p.preco)}
                    </p>
                  ))}
                </div>
              )}

              {selectedSession.vezesUsado > 0 && (
                <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                  <p className="font-body text-xs text-text-secondary">Utilizações</p>
                  <p className="font-body text-sm text-foreground">{selectedSession.vezesUsado} {selectedSession.vezesUsado === 1 ? "vez" : "vezes"}</p>
                </div>
              )}

              {selectedSession.sobre && (
                <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                  <p className="font-body text-xs text-text-secondary">Sobre</p>
                  <p className="font-body text-sm text-foreground">{selectedSession.sobre}</p>
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-10 max-h-[90vh] overflow-y-auto">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />

            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">
              {editingServico ? "Editar serviço" : "Adicionar serviço"}
            </h3>

            <div className="space-y-4">
              {/* Nome da aula */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Nome da aula <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => { setNome(e.target.value); setFormErrors((prev) => ({ ...prev, nome: "" })); }}
                  placeholder="Ex: Aula Nível 1"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
                {formErrors.nome && <p className="mt-1 font-body text-sm text-error">{formErrors.nome}</p>}
              </div>

              {/* Modalidade */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Modalidade <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <select
                    value={modalidade}
                    onChange={(e) => { setModalidade(e.target.value); setFormErrors((prev) => ({ ...prev, modalidade: "" })); }}
                    className="w-full appearance-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent"
                  >
                    <option value="" disabled>Selecionar modalidade</option>
                    {MODALIDADES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>

              {/* Duração */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Duração <span className="text-text-muted">(minutos)</span> <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  value={duracao}
                  onChange={(e) => { setDuracao(e.target.value); setFormErrors((prev) => ({ ...prev, duracao: "" })); }}
                  placeholder="Ex: 90"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
                {formErrors.duracao && <p className="mt-1 font-body text-sm text-error">{formErrors.duracao}</p>}
              </div>

              {/* Sobre */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Sobre
                </label>
                <textarea
                  value={sobre}
                  onChange={(e) => setSobre(e.target.value)}
                  placeholder="Descreve o que contém..."
                  rows={3}
                  className="w-full resize-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>

              {/* Avulso toggle */}
              <div className="flex items-center justify-between rounded-xl bg-[#2A2A2A] px-4 py-3">
                <span className="font-body text-sm font-semibold text-foreground">Avulso disponível</span>
                <button
                  type="button"
                  onClick={() => {
                    setAvulsoAtivo(!avulsoAtivo);
                    if (avulsoAtivo) setAvulsoPreco("");
                  }}
                  className={`relative h-6 w-11 rounded-full transition-colors ${avulsoAtivo ? "bg-accent" : "bg-text-muted"}`}
                >
                  <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${avulsoAtivo ? "translate-x-5" : ""}`} />
                </button>
              </div>

              {avulsoAtivo && (
                <div>
                  <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                    Preço avulso <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={avulsoPreco}
                    onChange={(e) => { setAvulsoPreco(e.target.value); setFormErrors((prev) => ({ ...prev, avulsoPreco: "" })); }}
                    placeholder="Ex: 35"
                    className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                  />
                  {formErrors.avulsoPreco && <p className="mt-1 font-body text-sm text-error">{formErrors.avulsoPreco}</p>}
                </div>
              )}

              {/* Pack section */}
              <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                {formErrors.packs && <p className="mb-2 font-body text-sm text-error">{formErrors.packs}</p>}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body text-sm font-semibold text-foreground">Pack disponível</span>
                  {packs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPacks([])}
                      className="text-xs text-text-secondary hover:text-error transition-colors"
                    >
                      Remover packs
                    </button>
                  )}
                </div>

                {packs.length === 0 ? (
                  <button
                    type="button"
                    onClick={addPackEntry}
                    className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
                  >
                    <PlusCircleIcon className="h-4 w-4" />
                    Adicionar pack
                  </button>
                ) : (
                  <div className="space-y-3">
                    {packs.map((p) => (
                      <div key={p.tempId} className="rounded-lg bg-surface p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-text-secondary">Pack</span>
                          <button
                            type="button"
                            onClick={() => removePackEntry(p.tempId)}
                            className="text-text-secondary hover:text-error transition-colors"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={p.nome}
                          onChange={(e) => updatePackEntry(p.tempId, "nome", e.target.value)}
                          placeholder="Nome do pack (ex: Pack 5 aulas)"
                          className="w-full rounded-lg bg-[#2A2A2A] px-3 py-2 text-sm text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                        />
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-text-secondary block mb-0.5">Nº aulas</label>
                            <input
                              type="number"
                              min="1"
                              value={p.numeroAulas}
                              onChange={(e) => updatePackEntry(p.tempId, "numeroAulas", e.target.value)}
                              placeholder="5"
                              className="w-full rounded-lg bg-[#2A2A2A] px-3 py-2 text-sm text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-text-secondary block mb-0.5">Preço total</label>
                            <input
                              type="number"
                              min="0"
                              value={p.preco}
                              onChange={(e) => updatePackEntry(p.tempId, "preco", e.target.value)}
                              placeholder="150"
                              className="w-full rounded-lg bg-[#2A2A2A] px-3 py-2 text-sm text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addPackEntry}
                      className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
                    >
                      <PlusCircleIcon className="h-4 w-4" />
                      Adicionar outro pack
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingServico(null); }}
                  className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const errors: Record<string, string> = {};
                    if (!nome.trim()) errors.nome = "O nome é obrigatório";
                    if (!modalidade) errors.modalidade = "Seleciona a modalidade";
                    if (!duracao || Number(duracao) < 15) errors.duracao = "A duração mínima é 15 minutos";
                    if (avulsoAtivo && (!avulsoPreco || Number(avulsoPreco) < 1)) errors.avulsoPreco = "Define o preço avulso";

                    const invalidPacks = packs.filter((p) => !p.nome || !p.numeroAulas || !p.preco);
                    if (!avulsoAtivo && packs.length === 0) errors.packs = "Adiciona pelo menos um pack ou ativa o avulso";
                    if (invalidPacks.length > 0) errors.packs = "Preenche nome, aulas e preço de cada pack";

                    setFormErrors(errors);
                    if (Object.keys(errors).length > 0) return;
                    if (!schoolId) return;

                    const packData = packs
                      .filter((p) => p.nome && p.numeroAulas && p.preco)
                      .map((p) => ({
                        id: p.id,
                        nome: p.nome,
                        numeroAulas: Number(p.numeroAulas),
                        preco: Math.round(Number(p.preco) * 100),
                      }));

                    if (editingServico) {
                      const res = await updateServico(editingServico.id, {
                        nome,
                        modalidade,
                        duracao: Number(duracao),
                        sobre,
                        avulsoDisponivel: avulsoAtivo,
                        avulsoPreco: Math.round(Number(avulsoPreco) * 100),
                        packs: packData,
                      });
                      if (res.ok) {
                        setShowModal(false);
                        setEditingServico(null);
                        router.refresh();
                      }
                    } else {
                      const res = await addServico(schoolId, {
                        nome,
                        modalidade,
                        duracao: Number(duracao),
                        sobre,
                        avulsoDisponivel: avulsoAtivo,
                        avulsoPreco: Math.round(Number(avulsoPreco) * 100),
                        packs: packData,
                      });
                      if (res.ok) {
                        setShowModal(false);
                        router.refresh();
                      }
                    }
                  }}
                  className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
                >
                  {editingServico ? "Guardar" : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deletingServico && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center">
            <p className="font-heading text-xl font-bold text-foreground mb-2">Eliminar serviço</p>
            <p className="font-body text-sm text-text-secondary mb-6">
              Tens a certeza que queres eliminar <strong>{deletingServico.nome}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingServico(null)}
                className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!schoolId) return;
                  const res = await deleteServico(deletingServico.id);
                  if (res.ok) {
                    setDeletingServico(null);
                    router.refresh();
                  }
                }}
                className="flex-1 rounded-xl bg-error py-3 font-body text-sm font-semibold text-error-foreground transition-transform active:scale-95"
              >
                Sim, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
