"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { BookingHistoryItem } from "../actions";
import { cancelOwnBooking } from "../actions";

const PER_PAGE = 7;

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
  attended: "Realizada",
  no_show: "Não compareceu",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "text-blue-600 bg-blue-50 border-blue-200",
  cancelled: "text-red-600 bg-red-50 border-red-200",
  attended: "text-green-600 bg-green-50 border-green-200",
  no_show: "text-yellow-600 bg-yellow-50 border-yellow-200",
};

export function BookingHistoryView({ bookings }: { bookings: BookingHistoryItem[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let list = bookings.filter(b => {
      if (filter === "upcoming") return !b.isPast;
      if (filter === "past") return b.isPast;
      return true;
    });
    list.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
    return list;
  }, [bookings, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);

  function handlePageChange(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleCancel(bookingId: string, sessionId: string, schoolId: string) {
    setCancellingId(bookingId);
    setConfirmId(null);
    await cancelOwnBooking(bookingId, sessionId, schoolId);
    setCancellingId(null);
    router.refresh();
  }

  const confirmBooking = useMemo(
    () => bookings.find(b => b.id === confirmId),
    [confirmId, bookings],
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "upcoming", "past"] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(0); }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-accent text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-accent"
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
          {pageItems.map(b => (
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
                  <Link href={`/escolas/${b.schoolSlug}`} className="mt-1 text-sm text-accent hover:text-accent/80">{b.schoolName}</Link>
                  <p className="text-xs text-gray-400">{formatDate(b.startsAt)}</p>
                  <p className="text-xs text-gray-400">
                    Duração: {b.durationMinutes} min
                    {b.cancelledAt && ` · Cancelada em ${formatDate(b.cancelledAt)}`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-accent">{formatEuro(b.priceCents)}</p>
                  <p className="text-[10px] text-gray-400">{b.paymentMethod}</p>
                  {!b.isPast && b.status === "confirmed" && (
                    <button
                      onClick={() => setConfirmId(b.id)}
                      disabled={cancellingId === b.id}
                      className="mt-2 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {cancellingId === b.id ? "..." : "Cancelar"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 pb-6">
          <button
            onClick={() => handlePageChange(safePage - 1)}
            disabled={safePage === 0}
             className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-accent disabled:opacity-30"
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                i === safePage
                  ? "bg-accent text-white"
                  : "border border-gray-200 text-gray-600 hover:border-accent"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(safePage + 1)}
            disabled={safePage === totalPages - 1}
             className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-accent disabled:opacity-30"
          >
            Seguinte
          </button>
        </div>
      )}

      {/* Cancel confirm dialog */}
      {confirmId && confirmBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancelar aula?</h3>
            <p className="text-sm text-gray-500 mb-2">
              <strong>{confirmBooking.classTypeName}</strong> em {confirmBooking.schoolName}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              O owner será notificado.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Não
              </button>
              <button
                onClick={() => handleCancel(confirmBooking.id, confirmBooking.sessionId, confirmBooking.schoolId)}
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
