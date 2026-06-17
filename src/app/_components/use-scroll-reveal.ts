"use client";
import { useCallback, useRef, useState } from "react";

export function useScrollReveal(threshold = 0.2) {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((el: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    if (!el) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold },
    );
    observerRef.current.observe(el);
  }, [threshold]);

  return { ref, isVisible };
}
