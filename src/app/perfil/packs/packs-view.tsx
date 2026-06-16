"use client";

import { useState } from "react";
import type { PackSummary } from "../actions";

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
              ? "border-accent bg-accent/10 text-accent"
              : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
          }`}
        >
          Ativos
        </button>
        <button
          onClick={() => setShowUsed(true)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            showUsed
              ? "border-accent bg-accent/10 text-accent"
              : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
            const pct = p.totalLessons > 0 ? Math.round((used / p.totalLessons) * 100) : 0;
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
                  <span className="text-gray-500">Progresso</span>
                  <span className="text-gray-600">
                    {p.lessonsRemaining}/{p.totalLessons} restantes
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
