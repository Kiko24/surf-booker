"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { getMetricas, type MetricasData } from "../actions";

type FilterKey = "esta_semana" | "este_mes" | "epoca_alta" | "personalizado";

type SavedFilter = {
  label: string;
  amount: number;
  unit: "days" | "months" | "years";
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "esta_semana", label: "Esta semana" },
  { key: "este_mes", label: "Este mês" },
  { key: "epoca_alta", label: "Época alta" },
];

const UNIT_OPTIONS: { value: SavedFilter["unit"]; label: string }[] = [
  { value: "days", label: "Dias" },
  { value: "months", label: "Meses" },
  { value: "years", label: "Anos" },
];

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function formatCents(c: number): string {
  return `€${(c / 100).toFixed(2).replace(".", ",")}`;
}

function Seta({ valor }: { valor: number }) {
  if (valor === 0) return <span className="text-text-muted">—</span>;
  const cor = valor > 0 ? "text-success" : "text-error";
  return (
    <span className={`${cor} font-body text-sm font-semibold`}>
      {valor > 0 ? "↑" : "↓"} {Math.abs(valor)}%
    </span>
  );
}

export function MetricasView() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("esta_semana");
  const [showCustom, setShowCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customAmount, setCustomAmount] = useState(30);
  const [customUnit, setCustomUnit] = useState<SavedFilter["unit"]>("days");
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [data, setData] = useState<MetricasData | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const stored = localStorage.getItem("metricas_custom_filters");
    if (stored) { try { setSavedFilters(JSON.parse(stored)); } catch { /* */ } }
  }, []);

  function saveFilters(list: typeof savedFilters) {
    setSavedFilters(list);
    localStorage.setItem("metricas_custom_filters", JSON.stringify(list));
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    const activeSaved = savedFilters[0];
    const res = activeFilter === "personalizado" && activeSaved
      ? await getMetricas("personalizado", activeSaved.amount, activeSaved.unit)
      : await getMetricas(activeFilter);
    setData(res);
    setLoading(false);
  }, [activeFilter, savedFilters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const d = data;

  return (
    <>
      <main className="px-5 pt-4">

        {/* Header */}
        <div className="mt-6 mb-4">
          <Link
            href="/dashboard/mais"
            className="mb-3 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Voltar
          </Link>
          <h1 className="font-heading text-3xl font-bold text-foreground">Métricas</h1>
          <p className="mt-1 font-body text-sm text-text-secondary">Analisa os dados do teu negócio</p>
        </div>

        {/* Filter row */}
        <div className="mb-4 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setActiveFilter(f.key)}
              className={activeFilter === f.key ? "whitespace-nowrap rounded-full bg-accent px-4 py-1.5 font-body text-sm font-semibold text-primary-foreground" : "whitespace-nowrap rounded-full bg-surface px-4 py-1.5 font-body text-sm font-semibold text-text-secondary"}
            >{f.label}</button>
          ))}
          {savedFilters.map((sf, i) => (
            <button key={`c-${i}`} type="button" onClick={() => setActiveFilter("personalizado")}
              className={activeFilter === "personalizado" ? "whitespace-nowrap rounded-full bg-accent px-4 py-1.5 font-body text-sm font-semibold text-primary-foreground" : "whitespace-nowrap rounded-full bg-surface px-4 py-1.5 font-body text-sm font-semibold text-text-secondary"}
            >{sf.label}</button>
          ))}
          <button type="button" onClick={() => { setCustomLabel(""); setCustomAmount(30); setCustomUnit("days"); setShowCustom(true); }}
            className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-dashed border-text-muted px-4 py-1.5 font-body text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
            Personalizar
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-body text-sm text-text-muted">A carregar métricas...</p>
          </div>
        ) : !d ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-body text-sm text-text-muted">Sem dados disponíveis</p>
          </div>
        ) : (
          <div className="space-y-5 md:space-y-0 md:grid md:grid-cols-2 md:gap-5 pb-4">

            {/* ─── BLOCO 1: RECEITA ─────────────────── */}
            <section className="rounded-xl border border-accent/10 bg-surface p-5 md:p-6">
              <h2 className="font-heading text-lg font-bold text-foreground mb-1">Receita</h2>
              <div className="mb-3 flex items-baseline gap-3">
                <span className="font-heading text-3xl text-foreground">{formatCents(d.receita.total)}</span>
                <Seta valor={d.receita.comparativo} />
              </div>
              <div className="space-y-2">
                <p className="font-body text-sm font-semibold text-text-secondary">Por tipo</p>
                <div className="space-y-1">
                  {d.receita.por_tipo.map(t => (
                    <div key={t.metodo} className="flex items-center justify-between">
                      <span className="font-body text-sm text-foreground">{t.metodo}</span>
                      <span className="font-body text-sm font-semibold text-foreground">{formatCents(t.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-foreground/10">
                  <p className="font-body text-sm font-semibold text-text-secondary mb-1">Por serviço</p>
                  {d.receita.por_servico.map(s => (
                    <div key={s.nome} className="flex items-center justify-between">
                      <span className="font-body text-sm text-foreground">{s.nome}</span>
                      <span className="font-body text-sm font-semibold text-foreground">{formatCents(s.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ─── BLOCO 2: OCUPAÇÃO ───────────────── */}
            <section className="rounded-xl border border-accent/10 bg-surface p-5 md:p-6">
              <h2 className="font-heading text-lg font-bold text-foreground mb-1">Ocupação</h2>
              <div className="mb-3">
                <span className="font-heading text-3xl text-foreground">{d.ocupacao.taxa_media}%</span>
                <span className="ml-2 font-body text-sm text-text-secondary">taxa de ocupação média</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-lg bg-[#2A2A2A] p-3 text-center">
                  <p className="font-body text-xs text-text-secondary">Realizadas</p>
                  <p className="font-heading text-xl text-foreground">{d.ocupacao.realizadas}</p>
                </div>
                <div className="rounded-lg bg-[#2A2A2A] p-3 text-center">
                  <p className="font-body text-xs text-text-secondary">Canceladas</p>
                  <p className="font-heading text-xl text-error">{d.ocupacao.canceladas}</p>
                </div>
              </div>
              {d.ocupacao.mais_popular && (
                <div className="rounded-lg bg-[#2A2A2A] p-3 mb-2">
                  <p className="font-body text-xs text-text-secondary">Sessão mais popular</p>
                  <p className="font-body text-sm font-semibold text-foreground">{d.ocupacao.mais_popular.dia} às {d.ocupacao.mais_popular.hora}</p>
                </div>
              )}
              {d.ocupacao.menos_ocupada && (
                <div className="rounded-lg bg-[#2A2A2A] p-3">
                  <p className="font-body text-xs text-text-secondary">Menor ocupação</p>
                  <p className="font-body text-sm font-semibold text-foreground">{d.ocupacao.menos_ocupada.nome} — {d.ocupacao.menos_ocupada.alunos}/{d.ocupacao.menos_ocupada.capacidade}</p>
                </div>
              )}
            </section>

            {/* ─── BLOCO 3: ALUNOS ────────────────── */}
            <section className="rounded-xl border border-accent/10 bg-surface p-5 md:p-6">
              <h2 className="font-heading text-lg font-bold text-foreground mb-3">Alunos</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[#2A2A2A] p-3 text-center">
                  <p className="font-body text-xs text-text-secondary">Total únicos</p>
                  <p className="font-heading text-xl text-foreground">{d.alunos.total_unicos}</p>
                </div>
                <div className="rounded-lg bg-[#2A2A2A] p-3 text-center">
                  <p className="font-body text-xs text-text-secondary">Novos</p>
                  <p className="font-heading text-xl text-success">{d.alunos.novos}</p>
                </div>
                <div className="rounded-lg bg-[#2A2A2A] p-3 text-center">
                  <p className="font-body text-xs text-text-secondary">Com pack</p>
                  <p className="font-heading text-xl text-foreground">{d.alunos.com_pack}</p>
                </div>
                <div className="rounded-lg bg-[#2A2A2A] p-3 text-center">
                  <p className="font-body text-xs text-text-secondary">Inativos</p>
                  <p className="font-heading text-xl text-error">{d.alunos.inativos}</p>
                </div>
              </div>
            </section>

            {/* ─── BLOCO 4: NO-SHOWS ──────────────── */}
            <section className="rounded-xl border border-accent/10 bg-surface p-5 md:p-6">
              <h2 className="font-heading text-lg font-bold text-foreground mb-1">No-Shows</h2>
              <div className="mb-3 flex items-baseline gap-3">
                <span className="font-heading text-3xl text-foreground">{d.noshow.taxa}%</span>
                <Seta valor={d.noshow.comparativo} />
              </div>
              {d.noshow.recorrentes.length > 0 && (
                <div>
                  <p className="font-body text-sm font-semibold text-text-secondary mb-2">Alunos com no-show recorrente (2+ vezes)</p>
                  <div className="space-y-1">
                    {d.noshow.recorrentes.map(r => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg bg-[#2A2A2A] px-3 py-2">
                        <span className="font-body text-sm text-foreground">{r.nome}</span>
                        <span className="font-body text-sm font-semibold text-error">{r.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* ─── BLOCO 5: SAZONALIDADE ──────────── */}
            {(activeFilter === "epoca_alta" || activeFilter === "personalizado") && (
              <div className="md:col-span-2">
                <section className="rounded-xl border border-accent/10 bg-surface p-5 md:p-6">
                <h2 className="font-heading text-lg font-bold text-foreground mb-3">Sazonalidade</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-[#2A2A2A] px-4 py-3">
                    <div>
                      <p className="font-body text-xs text-text-secondary">Receita Verão</p>
                      <p className="font-heading text-lg text-foreground">{formatCents(d.sazonalidade.receita_verao)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-body text-xs text-text-secondary">Receita Inverno</p>
                      <p className="font-heading text-lg text-foreground">{formatCents(d.sazonalidade.receita_inverno)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[#2A2A2A] px-4 py-3">
                    <div>
                      <p className="font-body text-xs text-text-secondary">Ocupação Verão</p>
                      <p className="font-heading text-lg text-foreground">{d.sazonalidade.ocupacao_verao}%</p>
                    </div>
                    <div className="text-right">
                      <p className="font-body text-xs text-text-secondary">Ocupação Inverno</p>
                      <p className="font-heading text-lg text-foreground">{d.sazonalidade.ocupacao_inverno}%</p>
                    </div>
                  </div>
                  {d.sazonalidade.mes_max && (
                    <div className="flex items-center justify-between rounded-lg bg-[#2A2A2A] px-4 py-2">
                      <p className="font-body text-sm text-foreground">Mês com mais receita</p>
                      <p className="font-body text-sm font-semibold text-success">{MESES[d.sazonalidade.mes_max.mes - 1]} — {formatCents(d.sazonalidade.mes_max.total)}</p>
                    </div>
                  )}
                  {d.sazonalidade.mes_min && (
                    <div className="flex items-center justify-between rounded-lg bg-[#2A2A2A] px-4 py-2">
                      <p className="font-body text-sm text-foreground">Mês com menos receita</p>
                      <p className="font-body text-sm font-semibold text-error">{MESES[d.sazonalidade.mes_min.mes - 1]} — {formatCents(d.sazonalidade.mes_min.total)}</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
            )}

            {/* Instrutores */}
            <div className="md:col-span-2">
            <section className="rounded-xl border border-accent/10 bg-surface p-5 md:p-6">
              <h2 className="font-heading text-lg font-bold text-foreground mb-3">Instrutores</h2>
              {d.instrutores.length === 0 ? (
                <p className="font-body text-sm text-text-muted">Os instrutores não têm aulas registadas</p>
              ) : (
                <div className="space-y-2">
                  {d.instrutores.map((inst) => (
                    <div key={inst.nome} className="flex items-center justify-between">
                      <span className="font-body text-sm text-foreground">{inst.nome}</span>
                      <span className="font-body text-sm font-semibold text-accent">
                        {inst.total} {inst.total === 1 ? "aula" : "aulas"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
            </div>

          </div>
        )}
      </main>

          {showCustom && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl md:rounded-2xl bg-surface p-6 pb-10 md:pb-6">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted md:hidden" />
            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Filtro personalizado</h3>
            <div className="space-y-4">
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Nome do filtro <span className="text-error">*</span></label>
                <input type="text" value={customLabel} onChange={e => setCustomLabel(e.target.value)} placeholder="Ex: Últimos 3 meses"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
              </div>
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Últimos <span className="text-error">*</span></label>
                <div className="flex gap-3">
                  <input type="number" min="1" value={customAmount} onChange={e => setCustomAmount(Number(e.target.value))}
                    className="w-24 rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent" />
                  <div className="relative flex-1">
                    <select value={customUnit} onChange={e => setCustomUnit(e.target.value as SavedFilter["unit"])}
                      className="w-full appearance-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent">
                      {UNIT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCustom(false)}
                  className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground">Cancelar</button>
                <button type="button" onClick={() => { if (!customLabel.trim() || !customAmount) return; saveFilters([...savedFilters, { label: customLabel.trim(), amount: customAmount, unit: customUnit }]); setActiveFilter("personalizado"); setShowCustom(false); }}
                  className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
