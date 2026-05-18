"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, CalendarIcon, GroupIcon, SurfingIcon, DotsIcon, PlusIcon, ArrowRightIcon } from "./icons";

type Props = {
  fullName: string;
};

const weekdays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function todayLabel(): string {
  const d = new Date();
  return `${weekdays[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`;
}

type SessionCardProps = {
  time: string;
  title: string;
  inscritos: number;
  capacidade: number;
};

function SessionCard({ time, title, inscritos, capacidade }: SessionCardProps) {
  const pct = capacidade > 0 ? (inscritos / capacidade) * 100 : 0;

  let tag: { label: string; className: string } | null = null;

  if (inscritos >= capacidade) {
    tag = { label: "Lotada", className: "rounded-full bg-error/20 px-2 py-0.5 font-body text-xs font-semibold text-error" };
  } else if (pct <= 50) {
    tag = { label: "Pouca ocupação", className: "rounded-full bg-success/20 px-2 py-0.5 font-body text-xs font-semibold text-success" };
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-accent/10 bg-surface p-4 shadow-lg">
      <div className="flex flex-col">
        <span className="font-body text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {time}
        </span>
        <span className="mt-0.5 font-body text-base font-bold text-foreground">
          {title}
        </span>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="font-body text-sm text-text-secondary">{inscritos}/{capacidade} inscritos</span>
        {tag && <span className={tag.className}>{tag.label}</span>}
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/dashboard/agenda", label: "Agenda", icon: CalendarIcon },
  { href: "/dashboard/alunos", label: "Alunos", icon: GroupIcon },
  { href: "/dashboard/equipamento", label: "Equipamento", icon: SurfingIcon },
  { href: "/dashboard/mais", label: "Mais", icon: DotsIcon },
];

export function DashboardView({ fullName }: Props) {
  const pathname = usePathname();
  const firstName = fullName.split(" ")[0];

  return (
    <div className="min-h-svh bg-background text-foreground font-body">


      <main className="space-y-8 px-5 pb-32">
        {/* Greeting */}
        <section className="mt-4">
          <h2 className="font-heading text-3xl text-foreground">
            Bom dia, {firstName}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {todayLabel()} &nbsp;&middot; 6 sessões hoje
          </p>
        </section>

        {/* Sessions Today */}
        <section className="space-y-4">
          <h3 className="font-heading text-lg text-foreground">Sessões de hoje</h3>

          <div className="space-y-3">
            <SessionCard
              time="9:00"
              title="Aula iniciantes"
              inscritos={8}
              capacidade={8}
            />
          </div>

          <Link
            href="/dashboard/aulas/nova"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-body text-sm font-semibold text-primary-foreground shadow-lg transition-transform active:scale-95"
          >
            <PlusIcon className="h-5 w-5" />
            Adicionar aula
          </Link>
        </section>

        {/* Metrics */}
        <section className="space-y-4">
          <h3 className="font-heading text-lg text-foreground">Esta semana</h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Taxa de Ocupação */}
            <div className="flex flex-col items-center rounded-xl border border-accent/10 bg-surface p-3 text-center shadow-md">
              <span className="mb-2 font-body text-[10px] font-semibold uppercase text-text-secondary">
                Taxa de onda
              </span>
              <span className="font-heading text-lg text-foreground">75%</span>
              <div className="mt-2 mb-2 h-1 w-full overflow-hidden rounded-full bg-background">
                <div className="h-full rounded-full bg-accent" style={{ width: "75%" }} />
              </div>
              <span className="font-body text-[9px] text-accent">↑ 25% vs semana passada</span>
            </div>

            {/* Receita */}
            <div className="flex flex-col items-center rounded-xl border border-accent/10 bg-surface p-3 text-center shadow-md">
              <span className="mb-2 font-body text-[10px] font-semibold uppercase text-text-secondary">
                Receita
              </span>
              <span className="font-heading text-lg text-foreground">830€</span>
              <div className="mt-2 mb-2 h-1" />
              <span className="font-body text-[9px] text-accent">↑ 300€ vs semana passada</span>
            </div>
          </div>
        </section>

        {/* Alerts */}
        <section className="space-y-4">
          <h3 className="font-heading text-lg text-foreground">Alertas</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-accent/10 bg-surface px-5 py-4 shadow-md">
              <p className="flex-1 pr-4 font-body text-sm text-foreground">
                Sessão das 14h de amanhã com pouca ocupação
              </p>
              <button
                type="button"
                className="flex items-center gap-1 whitespace-nowrap rounded-full bg-background px-3 py-1.5 font-body text-xs font-semibold text-accent"
              >
                Ver aula
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-accent/10 bg-surface px-5 py-4 shadow-md">
              <p className="flex-1 pr-4 font-body text-sm text-foreground">
                2 packs vão expirar na próxima aula
              </p>
              <button
                type="button"
                className="flex items-center gap-1 whitespace-nowrap rounded-full bg-background px-3 py-1.5 font-body text-xs font-semibold text-accent"
              >
                Avisar
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-accent/10 bg-surface px-5 py-4 shadow-md">
              <p className="flex-1 pr-4 font-body text-sm text-foreground">
                Não tens aulas marcadas na próxima semana
              </p>
              <button
                type="button"
                className="flex items-center gap-1 whitespace-nowrap rounded-full bg-background px-3 py-1.5 font-body text-xs font-semibold text-accent"
              >
                Criar
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
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
