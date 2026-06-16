"use client";

import Link from "next/link";
import type { ClientOverview } from "../actions";
import {
  PackIcon, CalendarIcon, UserIcon,
} from "./icons";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export function ClientOverviewView({ overview }: { overview: ClientOverview | null }) {
  if (!overview) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <UserIcon className="mb-4 h-16 w-16 text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-900">Bem-vindo!</h1>
        <p className="mt-2 text-gray-500">
          Ainda não temos dados associados à sua conta.
        </p>
      </div>
    );
  }

  const { profile, upcomingBookings, activePacks } = overview;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {profile?.fullName?.split(" ")[0] ?? "Cliente"}
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              Próximas Aulas
            </h2>
            <Link
              href="/perfil/historico"
              className="text-sm font-medium text-accent hover:text-accent/80"
            >
              Ver todas
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              Nenhuma aula futura agendada.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcomingBookings.map(b => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.classTypeName}</p>
                    <p className="text-xs text-gray-500">{b.schoolName}</p>
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(b.startsAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <PackIcon className="h-5 w-5 text-gray-400" />
              Packs Ativos
            </h2>
            <Link
              href="/perfil/packs"
              className="text-sm font-medium text-accent hover:text-accent/80"
            >
              Ver todos
            </Link>
          </div>

          {activePacks.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              Nenhum pack ativo de momento.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {activePacks.slice(0, 4).map(p => {
                const pct = Math.round(
                  ((p.totalLessons - p.lessonsRemaining) / p.totalLessons) * 100,
                );
                return (
                  <li key={p.id} className="py-3">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{p.packName}</p>
                      <p className="text-xs text-gray-400">
                        {p.lessonsRemaining}/{p.totalLessons}
                      </p>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{p.schoolName}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}