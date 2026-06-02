"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PlusIcon,
} from "@/app/dashboard/_components/icons";
import type { ServicoRecord } from "../actions";
import { addServico, deleteServico, updateServico } from "../actions";

type Props = {
  fullName: string;
  sessions: ServicoRecord[];
  schoolId: string | null;
};

const MODALIDADES = ["Surf", "SUP", "Bodyboard", "Windsurf", "Kitesurf", "Longboard"];

const CATEGORIAS = [
  { value: "aula", label: "Aulas Avulso" },
  { value: "pack", label: "Pack de Aulas" },
  { value: "aluguer", label: "Aluguer" },
] as const;

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + "€";
}

export function ServicosView({ sessions, schoolId }: Props) {
  const router = useRouter();
  const [selectedSession, setSelectedSession] = useState<ServicoRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingServico, setEditingServico] = useState<ServicoRecord | null>(null);
  const [deletingServico, setDeletingServico] = useState<ServicoRecord | null>(null);

  // form fields
  const [nome, setNome] = useState("");
  const [modalidade, setModalidade] = useState("");
  const [categoria, setCategoria] = useState("");
  const [duracao, setDuracao] = useState("");
  const [sobre, setSobre] = useState("");
  const [totalLessons, setTotalLessons] = useState("");
  const [preco, setPreco] = useState("");
  const [duracaoAluguer, setDuracaoAluguer] = useState("");
  const [unidadeAluguer, setUnidadeAluguer] = useState<"hora" | "dia">("hora");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  function resetForm() {
    setNome("");
    setModalidade("");
    setCategoria("");
    setDuracao("");
    setSobre("");
    setTotalLessons("");
    setPreco("");
    setDuracaoAluguer("");
    setUnidadeAluguer("hora");
    setFormErrors({});
  }

  function fillEditForm(s: ServicoRecord) {
    setNome(s.nome);
    setModalidade(s.modalidade);
    setCategoria(s.categoria ?? "");
    setDuracao(String(s.duracao));
    setSobre(s.sobre);
    setTotalLessons(s.totalLessons ? String(s.totalLessons) : "");
    setPreco(String(s.avulsoPreco / 100));
    if (s.categoria === "aluguer") {
      const totalMinutes = s.duracao;
      if (totalMinutes >= 1440) {
        setDuracaoAluguer(String(totalMinutes / 1440));
        setUnidadeAluguer("dia");
      } else {
        setDuracaoAluguer(String(totalMinutes / 60));
        setUnidadeAluguer("hora");
      }
    }
  }

  return (
    <>
      <main className="px-5 pt-4">
        <section className="mt-6 mb-8 flex items-end justify-between">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Serviços
          </h1>
          <button
            type="button"
            onClick={() => {
              setEditingServico(null);
              setShowModal(true);
              resetForm();
            }}
            className="hidden md:flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 font-body text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent/90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M5 12h14M12 5v14"/>
            </svg>
            Adicionar serviço
          </button>
        </section>

        {/* Mobile View: List */}
        <div className="md:hidden">
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
              <div key={s.id} className="flex items-center gap-3 py-3">
                <button type="button" onClick={() => setSelectedSession(s)} className="flex-1 text-left">
                  <h3 className="font-body text-base font-bold text-foreground"><span className="inline-block w-2 h-2 rounded-full bg-accent mr-2 mb-0.5" />{s.nome}</h3>
                  <p className="text-xs text-text-secondary">{s.modalidade} &middot; {s.duracao}min</p>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block mt-6 w-full rounded-xl bg-surface-container-lowest overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface/50 border-b border-white/5">
              <tr>
                <th className="px-5 py-3 font-body text-[10px] text-text-secondary uppercase tracking-widest text-center">Nome do serviço</th>
                <th className="px-5 py-3 font-body text-[10px] text-text-secondary uppercase tracking-widest text-center">Modalidade</th>
                <th className="px-5 py-3 font-body text-[10px] text-text-secondary uppercase tracking-widest text-center">Duração</th>
                <th className="px-5 py-3 font-body text-[10px] text-text-secondary uppercase tracking-widest text-center">Tipo</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-surface-container-high transition-colors group">
                  <td className="px-6 py-4 font-body-lg text-body-lg text-on-surface align-middle text-center"><span className="inline-block w-2 h-2 rounded-full bg-accent mr-2 align-middle" />{s.nome}</td>
                  <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant align-middle text-center">{s.modalidade}</td>
                  <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant align-middle text-center">{s.duracao} min</td>
                  <td className="px-6 py-4 align-middle text-center">
                    <span className="px-3 py-1 rounded-full bg-primary-fixed-dim/10 text-primary-fixed-dim text-[12px] font-bold uppercase tracking-wider">
                      {s.avulsoDisponivel ? "Avulso" : "Pack"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right align-middle">
                    <button onClick={() => setSelectedSession(s)} className="p-2 text-on-surface-variant hover:text-primary-fixed-dim">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M5 12h14M12 5v14"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Service popup */}
      {selectedSession && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-10">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />

            <div className="flex items-center gap-4 mb-6">
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">{selectedSession.nome}</h3>
              </div>
            </div>

            <div className="space-y-3">
              {selectedSession.modalidade && (
                <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                  <p className="font-body text-xs text-text-secondary">Modalidade</p>
                  <p className="font-body text-sm text-foreground">{selectedSession.modalidade}</p>
                </div>
              )}

              {selectedSession.categoria && (
                <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                  <p className="font-body text-xs text-text-secondary">Categoria</p>
                  <p className="font-body text-sm text-foreground capitalize">{selectedSession.categoria}</p>
                </div>
              )}

              <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                <p className="font-body text-xs text-text-secondary">Duração</p>
                <p className="font-body text-sm text-foreground">
                  {selectedSession.categoria === "aluguer"
                    ? selectedSession.duracao >= 1440
                      ? `${selectedSession.duracao / 1440} dia(s)`
                      : `${selectedSession.duracao / 60} hora(s)`
                    : `${selectedSession.duracao} minutos`}
                </p>
              </div>

              <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                <p className="font-body text-xs text-text-secondary">
                  {selectedSession.categoria === "pack" ? "Preço do pack" : "Preço"}
                </p>
                <p className="font-body text-sm text-foreground">{formatPrice(selectedSession.avulsoPreco)}</p>
              </div>

              {selectedSession.categoria === "pack" && selectedSession.totalLessons && (
                <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                  <p className="font-body text-xs text-text-secondary">Número de aulas</p>
                  <p className="font-body text-sm text-foreground">{selectedSession.totalLessons} aulas</p>
                </div>
              )}

              {selectedSession.vezesUsado > 0 && (
                <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                  <p className="font-body text-xs text-text-secondary">Utilizações</p>
                  <p className="font-body text-sm text-foreground">{selectedSession.vezesUsado} {selectedSession.vezesUsado === 1 ? "vez" : "vezes"}</p>
                </div>
              )}

              <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                <p className="font-body text-xs text-text-secondary">Sobre</p>
                <p className="font-body text-sm text-foreground">{selectedSession.sobre || "—"}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = selectedSession;
                  setSelectedSession(null);
                  setEditingServico(s);
                  fillEditForm(s);
                  setShowModal(true);
                }}
                className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 md:px-5">
          <div className="w-full max-w-md rounded-t-2xl md:rounded-2xl bg-surface p-6 pb-10 md:pb-6 max-h-[90vh] overflow-y-auto">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted md:hidden" />

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

              {/* Categoria */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Categoria <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full appearance-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent"
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>

              {/* Preço + Nº aulas (lado a lado para packs) / Preço + Duração (lado a lado para aluguer) */}
              {categoria === "pack" ? (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                      Preço do pack <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={preco}
                      onChange={(e) => { setPreco(e.target.value); setFormErrors((prev) => ({ ...prev, preco: "" })); }}
                      placeholder="150"
                      className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                    />
                    {formErrors.preco && <p className="mt-1 font-body text-sm text-error">{formErrors.preco}</p>}
                  </div>
                  <div className="flex-1">
                    <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                      Nº aulas <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={totalLessons}
                      onChange={(e) => { setTotalLessons(e.target.value); setFormErrors((prev) => ({ ...prev, totalLessons: "" })); }}
                      placeholder="5"
                      className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                    />
                    {formErrors.totalLessons && <p className="mt-1 font-body text-sm text-error">{formErrors.totalLessons}</p>}
                  </div>
                </div>
              ) : categoria === "aluguer" ? (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                      Preço <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={preco}
                      onChange={(e) => { setPreco(e.target.value); setFormErrors((prev) => ({ ...prev, preco: "" })); }}
                      placeholder="35"
                      className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                    />
                    {formErrors.preco && <p className="mt-1 font-body text-sm text-error">{formErrors.preco}</p>}
                  </div>
                  <div>
                    <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                      Duração <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={duracaoAluguer}
                      onChange={(e) => { setDuracaoAluguer(e.target.value); setFormErrors((prev) => ({ ...prev, duracaoAluguer: "" })); }}
                      placeholder="2"
                      className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                    />
                    {formErrors.duracaoAluguer && <p className="mt-1 font-body text-sm text-error">{formErrors.duracaoAluguer}</p>}
                  </div>
                  <div className="mt-6">
                    <select
                      value={unidadeAluguer}
                      onChange={(e) => setUnidadeAluguer(e.target.value as "hora" | "dia")}
                      className="w-full appearance-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent"
                    >
                      <option value="hora">hora(s)</option>
                      <option value="dia">dia(s)</option>
                    </select>
                  </div>
                </div>
              ) : categoria ? (
                <div>
                  <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                    Preço <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={preco}
                    onChange={(e) => { setPreco(e.target.value); setFormErrors((prev) => ({ ...prev, preco: "" })); }}
                    placeholder="Ex: 35"
                    className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                  />
                  {formErrors.preco && <p className="mt-1 font-body text-sm text-error">{formErrors.preco}</p>}
                </div>
              ) : null}

              {/* Duração (minutos) - oculto para aluguer */}
              <div className={categoria === "aluguer" ? "hidden" : ""}>
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
                    if (!categoria) errors.categoria = "Seleciona a categoria";
                    if (!duracao || Number(duracao) < 15) errors.duracao = "A duração mínima é 15 minutos";
                    if (categoria && (!preco || Number(preco) < 1)) errors.preco = "O preço é obrigatório";
                    if (categoria === "pack" && (!totalLessons || Number(totalLessons) < 1)) errors.totalLessons = "Número de aulas é obrigatório para packs";
                    if (categoria === "aluguer" && (!duracaoAluguer || Number(duracaoAluguer) < 1)) errors.duracaoAluguer = "Duração é obrigatória";

                    setFormErrors(errors);
                    if (Object.keys(errors).length > 0) return;
                    if (!schoolId) return;

                    let duracaoFinal = Number(duracao);
                    if (categoria === "aluguer") {
                      duracaoFinal = unidadeAluguer === "dia"
                        ? Number(duracaoAluguer) * 1440
                        : Number(duracaoAluguer) * 60;
                    }

                    if (editingServico) {
                      const res = await updateServico(editingServico.id, {
                        nome,
                        modalidade,
                        duracao: duracaoFinal,
                        sobre,
                        avulsoDisponivel: true,
                        avulsoPreco: Math.round(Number(preco) * 100),
                        categoria: (categoria || undefined) as "aula" | "pack" | "aluguer" | undefined,
                        totalLessons: categoria === "pack" ? Number(totalLessons) : undefined,
                        packs: [],
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
                        duracao: duracaoFinal,
                        sobre,
                        avulsoDisponivel: true,
                        avulsoPreco: Math.round(Number(preco) * 100),
                        categoria: (categoria || undefined) as "aula" | "pack" | "aluguer" | undefined,
                        totalLessons: categoria === "pack" ? Number(totalLessons) : undefined,
                        packs: [],
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
