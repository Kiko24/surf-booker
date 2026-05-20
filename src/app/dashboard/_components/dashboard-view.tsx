"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { dismissAlert, type TodaySession, type Alerta } from "../actions";
import type { MetricasData } from "../mais-metricas/actions";

type Props = {
  fullName: string;
  todaySessions: TodaySession[];
  metricas: MetricasData | null;
  alertas: Alerta[];
  schoolId: string;
};

function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")}€`;
}

const weekdays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function todayLabel(): string {
  const d = new Date();
  return `${weekdays[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`;
}

function SessionCard({ time, title, inscritos, capacidade }: TodaySession) {
  const pct = capacidade > 0 ? (inscritos / capacidade) * 100 : 0;

  let tag: { label: string; className: string } | null = null;

  if (inscritos >= capacidade) {
    tag = { label: "Lotada", className: "rounded-full bg-error/20 px-2 py-0.5 font-body text-sm font-semibold text-error" };
  } else if (pct <= 50) {
    tag = { label: "Pouca ocupação", className: "rounded-full bg-success/20 px-2 py-0.5 font-body text-sm font-semibold text-success" };
  }

  return (
    <div className="flex items-start justify-between rounded-xl border border-accent/10 bg-surface p-5 shadow-lg">
      <div className="flex flex-col gap-1">
        <span className="font-body text-sm font-semibold uppercase tracking-wider text-text-secondary">
          {time}
        </span>
        <span className="font-body text-lg font-bold text-foreground">
          {title}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="font-body text-base text-text-secondary">{inscritos}/{capacidade} inscritos</span>
        {tag && <span className={tag.className}>{tag.label}</span>}
      </div>
    </div>
  );
}

export function DashboardView({ fullName, todaySessions, metricas, alertas, schoolId }: Props) {
  const [dark, setDark] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const handleDismiss = useCallback((a: Alerta) => {
    setDismissedAlerts((prev) => new Set(prev).add(a.id));
    dismissAlert(schoolId, a.tipo, a.entityId);
  }, [schoolId]);

  const firstName = fullName.split(" ")[0];

  return (
      <main className="space-y-8 px-5 pt-4">
        <section className="mt-4 flex items-start justify-between">
          <div>
            <h2 className="font-heading text-3xl text-foreground">
              Bom dia, {firstName}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {todayLabel()} &nbsp;&middot; {todaySessions.length} {todaySessions.length === 1 ? "sessão hoje" : "sessões hoje"}
            </p>
          </div>
          <button type="button" onClick={() => setDark(!dark)}
            className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-text-secondary transition-colors hover:text-foreground active:scale-95"
            aria-label={dark ? "Modo claro" : "Modo escuro"}>
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </section>

        {alertas.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-heading text-2xl text-foreground">Alertas</h3>
            <div className="space-y-2">
              {alertas.filter((a) => !dismissedAlerts.has(a.id)).map((a) => (
                <div key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-accent/10 bg-surface p-4 transition-colors hover:bg-white/5"
                >
                  <Link href={a.link} className="flex-1 min-w-0">
                    <p className="font-body text-sm text-foreground">{a.mensagem}</p>
                  </Link>
                  <button type="button" onClick={() => handleDismiss(a)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-white/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h3 className="font-heading text-2xl text-foreground">Sessões de hoje</h3>
          <div className="space-y-3">
            {todaySessions.length > 0 ? todaySessions.map((s) => (
              <SessionCard key={s.id} {...s} />
            )) : (
              <p className="rounded-xl bg-surface px-5 py-8 text-center font-body text-base text-text-secondary">
                Hoje não há aulas marcadas
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-heading text-2xl text-foreground">Esta semana</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center rounded-xl border border-accent/10 bg-surface p-5 text-center shadow-md aspect-square">
              <div className="flex w-full flex-1 flex-col items-center justify-between gap-2">
                <span className="font-body text-sm font-semibold uppercase text-text-secondary">Taxa de ondas</span>
                <span className="font-heading text-3xl text-foreground">{metricas?.ocupacao.taxa_media ?? 0}%</span>
                <div className="h-1 w-full overflow-hidden rounded-full bg-background">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${metricas?.ocupacao.taxa_media ?? 0}%` }} />
                </div>
                {metricas && metricas.ocupacao.comparativo !== 0 && (
                  <span className={`font-body text-sm ${metricas.ocupacao.comparativo > 0 ? "text-accent" : "text-error"}`}>
                    {metricas.ocupacao.comparativo > 0 ? "↑" : "↓"} {Math.abs(metricas.ocupacao.comparativo)}% face semana passada
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-accent/10 bg-surface p-5 text-center shadow-md aspect-square">
              <div className="flex w-full flex-1 flex-col items-center justify-between gap-2">
                <span className="font-body text-sm font-semibold uppercase text-text-secondary">Receita</span>
                <span className="font-heading text-3xl text-foreground">{metricas ? formatPrice(metricas.receita.total) : "0,00€"}</span>
                <div className="h-1 w-full" />
                {metricas && metricas.receita.comparativo !== 0 && (
                  <span className={`font-body text-sm ${metricas.receita.comparativo > 0 ? "text-accent" : "text-error"}`}>
                    {metricas.receita.comparativo > 0 ? "↑" : "↓"} {Math.abs(metricas.receita.comparativo)}% face semana passada
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
  );
}
