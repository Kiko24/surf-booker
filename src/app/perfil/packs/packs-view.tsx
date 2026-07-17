"use client";

import Link from "next/link";
import { useState } from "react";
import type { PackSummary } from "../actions";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric", month: "short", year: "numeric",
  }).format(new Date(iso));
}

export function PacksView({ packs }: { packs: PackSummary[] }) {
  const [showUsed, setShowUsed] = useState(false);

  const displayed = showUsed ? packs : packs.filter(p => p.status === "active" && p.lessonsRemaining > 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setShowUsed(false)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            !showUsed
              ? "bg-accent text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:border-accent"
          }`}
        >
          Ativos
        </button>
        <button
          onClick={() => setShowUsed(true)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            showUsed
              ? "bg-accent text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:border-accent"
          }`}
        >
          Todos
        </button>
      </div>

      {displayed.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">
          Nenhum pack encontrado.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayed.map(p => {
            const used = p.totalLessons - p.lessonsRemaining;
            const pct = p.totalLessons > 0 ? Math.round((p.lessonsRemaining / p.totalLessons) * 100) : 0;
            const low = pct <= 25;
            return (
              <div
                key={p.id}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.packName}</h3>
                    <p className="text-xs text-gray-500">{p.schoolName}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      p.status === "active"
                        ? "border-green-200 bg-green-50 text-green-600"
                        : "border-gray-200 bg-gray-50 text-gray-500"
                    }`}
                  >
                    {p.status === "active" ? "Ativo" : "Usado"}
                  </span>
                </div>

                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-gray-500">{p.lessonsRemaining}/{p.totalLessons} restantes</span>
                  <span className={low ? "text-error text-xs font-medium" : "text-gray-400 text-xs"}>{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all ${low ? "bg-error" : "bg-accent"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {p.status === "active" && p.lessonsRemaining > 0 && (
                  <Link
                    href={`/escolas/${p.schoolSlug}`}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-accent bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent/90"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    Marcar aula
                  </Link>
                )}

                {p.usedBookings.length > 0 && (
                  <details className="group mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-accent hover:text-accent/80 list-none flex items-center gap-1">
                      <svg className={`h-3 w-3 transition-transform group-open:rotate-90`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                      Aulas usadas ({p.usedBookings.length})
                    </summary>
                    <ul className="mt-2 space-y-1.5 border-t border-gray-100 pt-2">
                      {p.usedBookings.map(pb => (
                        <li key={pb.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">{pb.classTypeName}</span>
                          <span className="text-gray-400">{formatDate(pb.sessionStartsAt)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
