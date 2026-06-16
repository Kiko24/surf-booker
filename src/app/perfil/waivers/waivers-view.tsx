"use client";

import type { WaiverAcceptance } from "../actions";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(iso));
}

export function WaiversView({ waivers }: { waivers: WaiverAcceptance[] }) {
  if (waivers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-gray-400">
          Ainda não aceitou nenhum waiver.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {waivers.map(w => (
        <div
          key={w.id}
          className="rounded-xl border border-gray-200 bg-white p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">{w.title}</h3>
              <p className="text-sm text-gray-500">{w.schoolName}</p>
              <p className="text-xs text-gray-400">
                Versão {w.version} · Aceite a {formatDate(w.acceptedAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
