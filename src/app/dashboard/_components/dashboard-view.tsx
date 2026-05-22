"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { dismissAlert, type TodaySession, type Alerta, type ActivityItem } from "../actions";
import type { MetricasData } from "../mais-metricas/actions";

type Props = {
  fullName: string;
  todaySessions: TodaySession[];
  metricas: MetricasData | null;
  alertas: Alerta[];
  schoolId: string;
  recentActivity: ActivityItem[];
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

function SessionCard({ time, durationMinutes, title, inscritos, capacidade, alunosList, compact }: TodaySession & { compact?: boolean }) {
  const pct = capacidade > 0 ? (inscritos / capacidade) * 100 : 0;

  let badge: { label: string; className: string } | null = null;

  if (inscritos >= capacidade) {
    badge = { label: "Lotada", className: "rounded-full bg-error/20 px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-wider text-error" };
  } else if (pct <= 50) {
    badge = { label: "Pouca ocupação", className: "rounded-full bg-success/20 px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-wider text-success" };
  }

  const visibleAlunos = alunosList.slice(0, 4);
  const restantes = alunosList.length - 4;

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-surface py-5 px-3">
        <div className="w-20 shrink-0">
          <p className="font-heading text-lg text-accent">{time}</p>
          <p className="font-body text-xs text-text-secondary">{durationMinutes} min</p>
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="font-body text-sm font-semibold text-foreground truncate">{title}</h5>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-body text-xs text-text-secondary">{inscritos}/{capacidade}</span>
            {badge && <span className={badge.className}>{badge.label}</span>}
          </div>
        </div>
        {inscritos > 0 && (
          <div className="flex items-center -space-x-1.5 shrink-0">
            {visibleAlunos.slice(0, 3).map((aluno, i) => (
              <div key={i}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-[8px] font-bold text-accent border border-background"
                title={aluno.name}
              >
                {aluno.name.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase()}
              </div>
            ))}
            {(alunosList.length > 3 || restantes > 0) && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2A2A2A] text-[8px] font-bold text-text-secondary border border-background">
                +{alunosList.length > 3 ? alunosList.length - 3 : restantes}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group flex items-center py-5 border-b border-white/5 last:border-b-0">
      <div className="w-28 shrink-0">
        <p className="font-heading text-xl text-accent">{time}</p>
        <p className="font-body text-xs text-text-secondary">{durationMinutes} min</p>
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="font-body text-base font-semibold text-foreground group-hover:text-accent transition-colors truncate">
          {title}
        </h5>
        <div className="flex items-center gap-3 mt-1">
          <span className="font-body text-sm text-text-secondary flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {inscritos}/{capacidade} inscritos
          </span>
          {badge && <span className={badge.className}>{badge.label}</span>}
        </div>
      </div>
      {inscritos > 0 && (
        <div className="flex items-center ml-4">
          {visibleAlunos.map((aluno, i) => (
            <div
              key={i}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-[10px] font-bold text-accent -ml-2 first:ml-0 border-2 border-background"
              title={aluno.name}
            >
              {aluno.name.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase()}
            </div>
          ))}
          {restantes > 0 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2A2A2A] text-[10px] font-bold text-text-secondary -ml-2 border-2 border-background">
              +{restantes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getWindDir(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function DashboardView({ fullName, todaySessions, metricas, alertas, schoolId, recentActivity }: Props) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [dismissedActivity, setDismissedActivity] = useState<Set<string>>(new Set());
  const [showNotifications, setShowNotifications] = useState(false);

  const handleDismissAlert = useCallback((a: Alerta) => {
    setDismissedAlerts((prev) => new Set(prev).add(a.id));
    dismissAlert(schoolId, a.tipo, a.entityId);
  }, [schoolId]);

  const handleDismissActivity = useCallback((id: string) => {
    setDismissedActivity((prev) => new Set(prev).add(id));
  }, []);

  const activeAlerts = alertas.filter((a) => !dismissedAlerts.has(a.id));
  const activeActivity = recentActivity.filter((a) => !dismissedActivity.has(a.id));
  const alertCount = activeAlerts.length + activeActivity.length;

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
          <button
            type="button"
            onClick={() => setShowNotifications(true)}
            className="relative mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-text-secondary transition-colors hover:text-foreground active:scale-95"
            aria-label="Notificações"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {alertCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
                {alertCount}
              </span>
            )}
          </button>
        </section>

        <section className="space-y-3">
          <h3 className="font-heading text-2xl text-foreground">Alertas</h3>
          {activeAlerts.length === 0 ? (
            <div className="rounded-xl border border-accent/10 bg-surface min-h-[96px] flex items-center justify-center">
              <p className="font-body text-sm text-text-secondary">Nada para mostrar</p>
            </div>
          ) : activeAlerts.length === 1 ? (
            <div className="rounded-xl border border-accent/10 bg-surface">
              <div className="flex items-center gap-3 px-4 py-5">
                <Link href={activeAlerts[0].link} className="flex-1 min-w-0">
                  <p className="font-body text-sm text-foreground">{activeAlerts[0].mensagem}</p>
                </Link>
                <button type="button" onClick={() => handleDismissAlert(activeAlerts[0])}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-white/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${Math.min(activeAlerts.length, 3)}, 1fr)` }}>
              {activeAlerts.slice(0, 3).map((a) => (
                <div key={a.id}
                  className="flex items-center gap-2 rounded-xl border border-accent/10 bg-surface py-5 px-3 transition-colors hover:bg-white/5"
                >
                  <Link href={a.link} className="flex-1 min-w-0">
                    <p className="font-body text-xs text-foreground">{a.mensagem}</p>
                  </Link>
                  <button type="button" onClick={() => handleDismissAlert(a)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-white/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {showNotifications && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setShowNotifications(false)} />
            <div className="absolute right-5 top-20 z-50 w-80 rounded-2xl border border-white/10 bg-surface p-5 shadow-xl max-h-[70vh] overflow-y-auto">
              {activeAlerts.length === 0 && activeActivity.length === 0 ? (
                <p className="font-body text-sm text-text-secondary text-center py-4">Nenhuma notificação</p>
              ) : (
                <>
                  {activeAlerts.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h4 className="font-heading text-sm font-semibold text-text-secondary uppercase tracking-wider">Alertas</h4>
                      {activeAlerts.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 rounded-xl bg-[#2A2A2A] p-3">
                          <Link href={a.link} className="flex-1 min-w-0" onClick={() => setShowNotifications(false)}>
                            <p className="font-body text-sm text-foreground">{a.mensagem}</p>
                          </Link>
                          <button type="button" onClick={() => handleDismissAlert(a)}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-white/10"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M18 6 6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeActivity.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-heading text-sm font-semibold text-text-secondary uppercase tracking-wider">Atividade recente</h4>
                      {activeActivity.map((item) => (
                        <div key={item.id} className="flex items-start gap-2 border-l-2 border-accent/30 pl-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-sm text-foreground" dangerouslySetInnerHTML={{ __html: item.message }} />
                            <p className="font-body text-xs text-text-muted mt-0.5">{item.timeAgo}</p>
                          </div>
                          <button type="button" onClick={() => handleDismissActivity(item.id)}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-white/10 mt-0.5"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M18 6 6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        <section className="space-y-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-2xl text-foreground">Sessões de hoje</h3>
            <Link href="/dashboard/calendario" className="font-body text-xs font-semibold uppercase tracking-widest text-text-secondary hover:text-accent transition-colors">
              Ver calendário
            </Link>
          </div>
          {todaySessions.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-surface px-5 min-h-[96px] flex items-center justify-center">
              <p className="font-body text-base text-text-secondary text-center">
                Hoje não há aulas marcadas
              </p>
            </div>
          ) : todaySessions.length === 1 ? (
            <div className="rounded-xl border border-white/5 bg-surface min-h-[96px]">
              <SessionCard key={todaySessions[0].id} {...todaySessions[0]} />
            </div>
          ) : (
            <div className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${Math.min(todaySessions.length, 3)}, 1fr)` }}>
              {todaySessions.slice(0, 3).map((s) => (
                <SessionCard key={s.id} {...s} compact />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-8">
            <div className="min-w-0 flex-1 max-w-lg space-y-4">
              <h3 className="font-heading text-2xl text-foreground">Esta semana</h3>
              <div className="flex gap-3">
                <div className="flex gap-3 min-w-0">
                  <div className="flex flex-1 flex-col items-center justify-between rounded-xl border border-accent/10 bg-surface p-6 text-center shadow-md aspect-square">
                    <div className="flex w-full flex-1 flex-col items-center justify-between gap-2">
                      <span className="font-body text-sm font-semibold uppercase text-text-secondary">Taxa de ondas</span>
                      <span className="font-heading text-3xl text-foreground">{metricas?.ocupacao.taxa_media ?? 0}%</span>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${metricas?.ocupacao.taxa_media ?? 0}%` }} />
                      </div>
                      {metricas && (
                        <span className={`font-body text-sm ${metricas.ocupacao.comparativo > 0 ? "text-accent" : metricas.ocupacao.comparativo < 0 ? "text-error" : "text-text-secondary"}`}>
                          {metricas.ocupacao.comparativo > 0 ? "↑" : metricas.ocupacao.comparativo < 0 ? "↓" : "—"} {metricas.ocupacao.comparativo !== 0 ? `${Math.abs(metricas.ocupacao.comparativo)}%` : "Estável"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col items-center justify-between rounded-xl border border-accent/10 bg-surface p-6 text-center shadow-md aspect-square">
                    <div className="flex w-full flex-1 flex-col items-center justify-between gap-2">
                      <span className="font-body text-sm font-semibold uppercase text-text-secondary">Receita</span>
                      <span className="font-heading text-3xl text-foreground">{metricas ? formatPrice(metricas.receita.total) : "0,00€"}</span>
                      <div className="h-1.5 w-full" />
                      {metricas && (
                        <span className={`font-body text-sm ${metricas.receita.comparativo > 0 ? "text-accent" : metricas.receita.comparativo < 0 ? "text-error" : "text-text-secondary"}`}>
                          {metricas.receita.comparativo > 0 ? "↑" : metricas.receita.comparativo < 0 ? "↓" : "—"} {metricas.receita.comparativo !== 0 ? `${Math.abs(metricas.receita.comparativo)}%` : "Estável"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col items-center justify-between rounded-xl border border-accent/10 bg-surface p-6 text-center shadow-md aspect-square">
                    <div className="flex w-full flex-1 flex-col items-center justify-between gap-2">
                      <span className="font-body text-sm font-semibold uppercase text-text-secondary">No-Show</span>
                      <span className="font-heading text-3xl text-foreground">{metricas?.noshow.taxa ?? 0}%</span>
                      <div className="h-1.5 w-full" />
                      {metricas && (
                        <span className={`font-body text-sm ${metricas.noshow.comparativo > 0 ? "text-error" : metricas.noshow.comparativo < 0 ? "text-success" : "text-text-secondary"}`}>
                          {metricas.noshow.comparativo > 0 ? "↑" : metricas.noshow.comparativo < 0 ? "↓" : "—"} {metricas.noshow.comparativo !== 0 ? `${Math.abs(metricas.noshow.comparativo)}%` : "Estável"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col min-w-48 ml-12">
              <h3 className="font-heading text-2xl text-foreground mb-4">Atividade recente</h3>
              <div className="flex-1 border-l border-white/10 pl-4 space-y-3">
                {recentActivity.length === 0 ? (
                  <p className="font-body text-sm text-text-secondary">Nenhuma atividade registada</p>
                ) : (
                  recentActivity.map((item) => (
                    <div key={item.id} className="text-sm">
                      <p className="font-body text-foreground" dangerouslySetInnerHTML={{ __html: item.message }} />
                      <p className="font-body text-xs text-text-muted">{item.timeAgo}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
  );
}
