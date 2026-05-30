"use client";

import { useState } from "react";
import { criarReservaPublica } from "../actions";

type Props = {
  sessionId: string;
  schoolId: string;
  onClose: () => void;
};

export function BookingModal({ sessionId, schoolId, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    const result = await criarReservaPublica(schoolId, sessionId, {
      name,
      email,
      phone,
    });
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
