"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClientOverview } from "../actions";
import { cancelOwnBooking } from "../actions";
import {
  PackIcon, CalendarIcon, UserIcon,
} from "./icons";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export function ClientOverviewView({ overview }: { overview: ClientOverview | null }) {
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleCancel(bookingId: string, sessionId: string, schoolId: string) {
    setCancellingId(bookingId);
    setConfirmId(null);
    await cancelOwnBooking(bookingId, sessionId, schoolId);
    setCancellingId(null);
    router.refresh();
  }

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

  const { profile, upcomingBookings, activePacks, totalBookings, totalAttended, totalNoShow, favoriteSchools, pendingWaivers } = overview;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {profile?.fullName?.split(" ")[0] ?? "Cliente"}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Aulas realizadas</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalAttended}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total de aulas concluídas</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalBookings}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Faltas</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalNoShow}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Escolas favoritas</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{favoriteSchools.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Waivers pendentes</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{pendingWaivers}</p>
        </div>
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
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{b.classTypeName}</p>
                    <p className="text-xs text-gray-500">{b.schoolName}</p>
                    <p className="text-xs text-gray-400">{formatDate(b.startsAt)}</p>
                  </div>
                  <button
                    onClick={() => setConfirmId(b.id)}
                    disabled={cancellingId === b.id}
                    className="shrink-0 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancellingId === b.id ? "..." : "Cancelar"}
                  </button>
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

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancelar aula?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Tens a certeza que queres cancelar esta aula? O owner será notificado.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Não
              </button>
              <button
                onClick={() => {
                  const b = upcomingBookings.find(x => x.id === confirmId);
                  if (b) handleCancel(b.id, b.sessionId, b.schoolId);
                }}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-medium text-white hover:bg-red-700"
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}