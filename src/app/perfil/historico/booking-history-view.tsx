"use client";

import { useState } from "react";
import type { BookingHistoryItem } from "../actions";

function formatEuro(cents: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Realizada",
  no_show: "Não compareceu",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "text-blue-600 bg-blue-50 border-blue-200",
  cancelled: "text-red-600 bg-red-50 border-red-200",
  completed: "text-green-600 bg-green-50 border-green-200",
  no_show: "text-yellow-600 bg-yellow-50 border-yellow-200",
};

export function BookingHistoryView({ bookings }: { bookings: BookingHistoryItem[] }) {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  const filtered = bookings.filter(b => {
    if (filter === "upcoming") return !b.isPast;
    if (filter === "past") return b.isPast;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "upcoming", "past"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
          >
            {f === "all" ? "Todas" : f === "upcoming" ? "Futuras" : "Passadas"}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">
          Nenhuma aula encontrada.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <div
              key={b.id}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{b.classTypeName}</h3>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        STATUS_COLORS[b.status] ?? "text-gray-400 bg-gray-50 border-gray-200"
                      }`}
                    >
                      {STATUS_LABELS[b.status] ?? b.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{b.schoolName}</p>
                  <p className="text-xs text-gray-400">{formatDate(b.startsAt)}</p>
                  <p className="text-xs text-gray-400">
                    Duração: {b.durationMinutes} min
                    {b.cancelledAt && ` · Cancelada em ${formatDate(b.cancelledAt)}`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-accent">{formatEuro(b.priceCents)}</p>
                  <p className="text-[10px] text-gray-400">{b.paymentMethod}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
