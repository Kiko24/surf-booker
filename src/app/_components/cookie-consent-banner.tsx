"use client";

import { useState, useEffect } from "react";

const COOKIE_CONSENT_KEY = "alaia_cookie_consent";

export function CookieConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored !== "accepted" && stored !== "rejected") {
      setShow(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setShow(false);
  }

  function reject() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-5 py-4 shadow-lg">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-xs leading-relaxed text-gray-600">
          Utilizamos cookies essenciais e analíticos para melhorar a tua experiência.
          Consulta a nossa{" "}
          <a href="/politica-de-cookies" className="text-accent underline hover:text-accent-light">
            Política de Cookies
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={reject}
            className="rounded-full border border-gray-300 bg-white px-5 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white transition-colors hover:brightness-110"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
