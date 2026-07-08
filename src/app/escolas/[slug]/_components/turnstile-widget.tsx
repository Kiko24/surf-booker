"use client";

import { useEffect, useRef } from "react";

export function useTurnstile() {
  const widgetId = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) return;

    const load = setInterval(() => {
      if (typeof window.turnstile !== "undefined" && containerRef.current) {
        clearInterval(load);
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: () => {},
        });
      }
    }, 100);

    return () => {
      clearInterval(load);
      if (widgetId.current && typeof window.turnstile !== "undefined") {
        window.turnstile.remove(widgetId.current);
      }
    };
  }, []);

  function execute(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!widgetId.current || typeof window.turnstile === "undefined") {
        resolve(null);
        return;
      }
      window.turnstile.execute(widgetId.current, {
        callback: (token: string) => resolve(token),
        "expired-callback": () => resolve(null),
        "error-callback": () => resolve(null),
      });
    });
  }

  return { containerRef, execute };
}