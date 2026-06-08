"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { HomeIcon, CalendarIcon, GroupIcon, SurfingIcon, DotsIcon, PlusIcon, ArrowRightIcon } from "./icons";
import type { TodaySession, Alerta, ActivityItem } from "../actions";
import type { MetricasData } from "../mais-metricas/actions";
import { dismissAlert } from "../actions";

type Props = {
  fullName: string;
  todaySessions: TodaySession[];
  metricas: MetricasData | null;
  alertas: Alerta[];
  schoolId: string;
  recentActivity: ActivityItem[];
};

const weekdays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function todayLabel(): string {
  const d = new Date();
  return `${weekdays[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/dashboard/agenda", label: "Agenda", icon: CalendarIcon },
  { href: "/dashboard/alunos", label: "Alunos", icon: GroupIcon },
  { href: "/dashboard/equipamento", label: "Equipamento", icon: SurfingIcon },
  { href: "/dashboard/mais", label: "Mais", icon: DotsIcon },
];

export function DashboardView({ fullName, todaySessions, metricas, alertas, schoolId }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const firstName = fullName.split(" ")[0];

  const displayedSessions = todaySessions.slice(0, 2);
  const displayedAlertas = alertas.slice(0, 3);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showAlertasModal, setShowAlertasModal] = useState(false);

  const handleDismiss = useCallback(async (tipo: string, entityId: string | null) => {
    await dismissAlert(schoolId, tipo, entityId);
    router.refresh();
  }, [schoolId, router]);

  const linkLabels: Record<string, string> = {
    baixa_ocupacao: "Ver aula",
    pack_a_expirar: "Avisar",
    waiver_em_falta: "Resolver",
    semana_vazia: "Criar",
    pagamento_pendente: "Cobrar",
    lotada: "Ver aula",
    sem_instrutor: "Atribuir",
    sessoes_por_confirmar: "Ver",
  };

  return (
    <div className="min-h-svh bg-background text-foreground font-body">

      <main className="space-y-8 px-5 pb-32 md:pb-8 pt-8 md:pt-12">
        {/* Greeting */}
        <section>
          <h2 className="font-heading text-3xl text-foreground">
            Bom dia, {firstName}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {todayLabel()} &nbsp;&middot; {todaySessions.length} {todaySessions.length === 1 ? "sessão" : "sessões"} hoje
          </p>
        </section>

        {/* Sessions Today */}
        {/* Sessions Today */}
        {todaySessions.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="font-heading text-2xl text-foreground">Sessões de hoje</h3>
              {todaySessions.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowSessionsModal(true)}
                  className="rounded-full border border-accent/20 px-3 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent/10 mt-1.5"
                >
                  Ver todas!
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayedSessions.map((s) => {
                const pct = s.capacidade > 0 ? (s.inscritos / s.capacidade) * 100 : 0;
                let tag: { label: string; className: string } | null = null;
                if (s.capacidade > 0 && s.inscritos >= s.capacidade) {
                  tag = { label: "Lotada", className: "rounded-full bg-error/20 px-2 py-0.5 font-body text-sm font-semibold text-error" };
                } else if (s.capacidade > 0 && pct <= 50) {
                  tag = { label: "Pouca ocupação", className: "rounded-full bg-success/20 px-2 py-0.5 font-body text-sm font-semibold text-success" };
                }
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-accent/10 bg-surface p-5 shadow-lg">
                    <div className="flex flex-col">
                      <span className="font-body text-sm font-semibold uppercase tracking-wider text-text-secondary">
                        {s.time}
                      </span>
                      <span className="mt-0.5 font-body text-lg font-bold text-foreground">
                        {s.title}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {s.capacidade > 0 && (
                      <span className="font-body text-base text-text-secondary">{s.inscritos}/{s.capacidade} inscritos</span>
                      )}
                      {tag && <span className={tag.className}>{tag.label}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-accent/10 bg-surface p-8 text-center">
            <p className="font-body text-base text-text-secondary">Nenhuma sessão marcada para hoje</p>
          </section>
        )}

        {/* Quick add button */}
        <Link
          href="/dashboard/calendario"
          className="-mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-body text-lg font-semibold text-primary-foreground shadow-lg transition-transform active:scale-95"
        >
          <PlusIcon className="h-5 w-5" />
          Adicionar aula
        </Link>

        {/* Metrics + Alerts side by side on desktop */}
        <div className="space-y-8 2xl:space-y-0 2xl:flex 2xl:flex-row 2xl:gap-6 2xl:items-stretch">
          {/* Metrics */}
          {metricas && (
            <section className="space-y-4 2xl:flex-1 2xl:flex 2xl:flex-col">
              <div className="flex items-center gap-3">
                <h3 className="font-heading text-2xl text-foreground">Esta semana</h3>
                <Link
                  href="/dashboard/mais-metricas"
                  className="rounded-full border border-accent/20 px-3 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent/10 mt-1.5"
                >
                  Ver métricas
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 lg:gap-8 2xl:flex 2xl:flex-row 2xl:items-stretch 2xl:justify-start 2xl:gap-1 2xl:flex-1">
                {/* Taxa de Ocupação */}
                <div className="min-h-36 2xl:h-auto flex flex-col items-center rounded-xl border border-accent/10 bg-surface p-6 max-md:px-5 max-md:py-3 lg:p-7 md:p-5 2xl:p-5 text-center shadow-md md:flex-1 md:min-w-40 2xl:flex-none">
                  <div className="flex w-full flex-1 flex-col items-center justify-between gap-3 max-md:gap-1 py-2 max-md:py-1">
                    <span className="font-body text-base max-md:text-[10px] md:text-sm font-semibold uppercase text-text-secondary">
                      Ocupação
                    </span>
                    <span className="font-heading text-5xl max-md:text-2xl md:text-3xl text-foreground">
                      {Math.round(metricas.ocupacao.taxa_media)}%
                    </span>
                    <div className="h-1.5 max-md:h-1 w-full overflow-hidden rounded-full bg-background">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(metricas.ocupacao.taxa_media, 100)}%` }} />
                    </div>
                    <span className={`font-body text-base max-md:text-[10px] md:text-sm ${metricas.ocupacao.comparativo >= 0 ? "text-accent" : "text-error"}`}>
                      {metricas.ocupacao.comparativo >= 0 ? "↑" : "↓"} {Math.abs(metricas.ocupacao.comparativo)}% face semana passada
                    </span>
                  </div>
                </div>

                {/* Receita */}
                <div className="min-h-36 2xl:h-auto flex flex-col items-center rounded-xl border border-accent/10 bg-surface p-6 max-md:px-5 max-md:py-3 lg:p-7 md:p-5 2xl:p-5 text-center shadow-md md:flex-1 md:min-w-40 2xl:flex-none">
                  <div className="flex w-full flex-1 flex-col items-center justify-between gap-3 max-md:gap-1 py-2 max-md:py-1">
                    <span className="font-body text-base max-md:text-[10px] md:text-sm font-semibold uppercase text-text-secondary">
                      Receita
                    </span>
                    <span className="font-heading text-5xl max-md:text-2xl md:text-3xl text-foreground">
                      {metricas.receita.total}€
                    </span>
                    <div className="h-1.5 max-md:h-1 w-full" />
                    <span className={`font-body text-base max-md:text-[10px] md:text-sm ${metricas.receita.comparativo >= 0 ? "text-accent" : "text-error"}`}>
                      {metricas.receita.comparativo >= 0 ? "↑" : "↓"} {Math.abs(metricas.receita.comparativo)}€ face semana passada
                    </span>
                  </div>
                </div>

                {/* No-show */}
                <div className="max-sm:hidden sm:min-h-36 2xl:h-auto flex flex-col items-center rounded-xl border border-accent/10 bg-surface p-6 max-md:px-5 max-md:py-3 lg:p-7 md:p-5 2xl:p-5 text-center shadow-md md:flex-1 md:min-w-40 2xl:flex-none">
                  <div className="flex w-full flex-1 flex-col items-center justify-between gap-3 max-md:gap-1 py-2 max-md:py-1">
                    <span className="font-body text-base max-md:text-[10px] md:text-sm font-semibold uppercase text-text-secondary">
                      No-show
                    </span>
                    <span className="font-heading text-5xl max-md:text-2xl md:text-3xl text-foreground">
                      {metricas.noshow.taxa}%
                    </span>
                    <div className="h-1.5 w-full" />
                    <span className={`font-body text-base max-md:text-[10px] md:text-sm ${metricas.noshow.comparativo <= 0 ? "text-accent" : "text-error"}`}>
                      {metricas.noshow.comparativo <= 0 ? "↓" : "↑"} {Math.abs(metricas.noshow.comparativo)}% face semana passada
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Alerts */}
          {alertas.length > 0 && (
            <section className="space-y-4 2xl:flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-heading text-2xl text-foreground">Alertas</h3>
                {alertas.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAlertasModal(true)}
                    className="rounded-full border border-accent/20 px-3 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent/10 mt-1.5"
                  >
                    Ver todas!
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {displayedAlertas.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-accent/10 bg-surface px-5 py-4 lg:px-7 lg:py-5 shadow-md">
                  <p className="flex-1 pr-4 font-body text-sm text-foreground">
                    {a.mensagem}
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={a.link}
                      className="flex items-center gap-1 whitespace-nowrap rounded-full bg-background px-3 py-1.5 font-body text-xs font-semibold text-accent"
                    >
                      {linkLabels[a.tipo] ?? "Ver"}
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDismiss(a.tipo, a.entityId)}
                      className="whitespace-nowrap rounded-full px-3 py-1.5 font-body text-xs text-text-muted transition-colors hover:text-text-secondary"
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      </main>

      {/* Sessions Modal */}
      {showSessionsModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 md:px-5">
          <div className="w-full max-w-md rounded-t-2xl md:rounded-2xl bg-surface pb-10 md:pb-4">
            <div className="flex items-center justify-between border-b border-accent/10 px-6 py-4">
              <h3 className="font-heading text-xl text-foreground">
                Sessões de hoje ({todaySessions.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowSessionsModal(false)}
                className="rounded-full px-3 py-1 text-sm text-text-secondary hover:text-foreground"
              >
                Fechar
              </button>
            </div>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto px-6 pt-4">
              {todaySessions.map((s) => {
                const pct = s.capacidade > 0 ? (s.inscritos / s.capacidade) * 100 : 0;
                let tag: { label: string; className: string } | null = null;
                if (s.capacidade > 0 && s.inscritos >= s.capacidade) {
                  tag = { label: "Lotada", className: "rounded-full bg-error/20 px-2 py-0.5 font-body text-sm font-semibold text-error" };
                } else if (s.capacidade > 0 && pct <= 50) {
                  tag = { label: "Pouca ocupação", className: "rounded-full bg-success/20 px-2 py-0.5 font-body text-sm font-semibold text-success" };
                }
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-accent/10 bg-surface px-5 py-4 shadow-md">
                    <div className="flex flex-col">
                      <span className="font-body text-sm font-semibold uppercase tracking-wider text-text-secondary">
                        {s.time}
                      </span>
                      <span className="mt-0.5 font-body text-lg font-bold text-foreground">
                        {s.title}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {s.capacidade > 0 && (
                      <span className="font-body text-base text-text-secondary">{s.inscritos}/{s.capacidade} inscritos</span>
                      )}
                      {tag && <span className={tag.className}>{tag.label}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Alertas Modal */}
      {showAlertasModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 md:px-5">
          <div className="w-full max-w-md rounded-t-2xl md:rounded-2xl bg-surface pb-10 md:pb-4">
            <div className="flex items-center justify-between border-b border-accent/10 px-6 py-4">
              <h3 className="font-heading text-xl text-foreground">
                Alertas ({alertas.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowAlertasModal(false)}
                className="rounded-full px-3 py-1 text-sm text-text-secondary hover:text-foreground"
              >
                Fechar
              </button>
            </div>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto px-6 pt-4">
              {alertas.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-accent/10 bg-surface px-5 py-4 shadow-md">
                  <p className="flex-1 pr-4 font-body text-sm text-foreground">
                    {a.mensagem}
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={a.link}
                      onClick={() => setShowAlertasModal(false)}
                      className="flex items-center gap-1 whitespace-nowrap rounded-full bg-background px-3 py-1.5 font-body text-xs font-semibold text-accent"
                    >
                      {linkLabels[a.tipo] ?? "Ver"}
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => { handleDismiss(a.tipo, a.entityId); setShowAlertasModal(false); }}
                      className="whitespace-nowrap rounded-full px-3 py-1.5 font-body text-xs text-text-muted transition-colors hover:text-text-secondary"
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav
        className="fixed left-1/2 z-50 flex w-[90%] max-w-md -translate-x-1/2 items-center justify-around rounded-full border border-accent/10 bg-surface-container-high px-2 py-2 shadow-lg backdrop-blur-md md:hidden"
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
