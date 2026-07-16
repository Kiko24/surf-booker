"use client";

import { useState, useEffect, useCallback } from "react";
import { criarReservaPublica, buscarPackAtivo } from "../actions";
import { useTurnstile } from "./turnstile-widget";

type Props = {
  sessionId: string;
  schoolId: string;
  schoolName: string;
  termsUrl: string | null;
  onClose: () => void;
};

export function BookingModal({ sessionId, schoolId, schoolName, termsUrl, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [activePack, setActivePack] = useState<{ packPurchaseId: string; remaining: number; name: string } | null>(null);
  const [packLoading, setPackLoading] = useState(false);

  const { containerRef, execute } = useTurnstile();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!email.includes("@")) { setActivePack(null); setPackLoading(false); return; }
      setPackLoading(true);
      const pack = await buscarPackAtivo(schoolId, email);
      setActivePack(pack);
      setPackLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [email, schoolId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const token = await execute();
    const result = await criarReservaPublica(
      schoolId,
      [sessionId],
      {
        participants: [{ name, age: 18, parentalConsent: true }],
        contactName: name,
        contactEmail: email,
        contactPhone: phone,
        termsAccepted,
        termsUrl,
        packPurchaseId: activePack?.packPurchaseId ?? undefined,
      },
      token ?? undefined
    );
    setPending(false);
    if (!result.ok) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="float-right text-gray-400 hover:text-gray-600"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="font-heading text-lg font-bold text-gray-900">
              Reserva confirmada!
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Receberás um email com os detalhes.
            </p>
          </div>
        ) : (
          <>
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">
              Reservar aula
            </h3>

            {activePack && (
              <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
                Tens <strong>{activePack.remaining} aulas</strong> restantes do pack <strong>{activePack.name}</strong> — vamos usar 1 crédito.
              </div>
            )}

            <div ref={containerRef} className="hidden" />
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
                />
                {packLoading && (
                  <p className="mt-1 text-xs text-gray-400">A verificar packs...</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Telemóvel
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
                />
              </div>
              {termsUrl && (
                <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-accent"
                  />
                  <span>
                    Aceito os{" "}
                    <a
                      href={termsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => { e.preventDefault(); window.open(termsUrl, '_blank', 'noopener,noreferrer'); }}
                      className="text-accent underline hover:text-accent-light"
                    >
                      Termos e Condições
                    </a>{" "}
                    da {schoolName}
                  </span>
                </label>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-black shadow-sm transition-all hover:shadow-md disabled:opacity-50"
              >
                {pending ? "A reservar..." : "Confirmar reserva"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
