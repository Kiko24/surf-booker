"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, opts: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
      }) => string;
      execute: (widgetId: string, opts: {
        callback: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
      }) => void;
      remove: (widgetId: string) => void;
    };
  }
}

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