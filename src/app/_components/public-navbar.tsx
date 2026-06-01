"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchSchools } from "@/app/escolas/actions";
import type { SchoolSearchResult } from "@/app/escolas/actions";

export function PublicNavbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SchoolSearchResult[]>([]);
  const [displayCount, setDisplayCount] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setDisplayCount(5);
      return;
    }
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotalCount(0);
      return;
    }
    const sanitized = query.trim().slice(0, 100).replace(/[^a-zA-Z0-9áéíóúâêîôûàèìòùãõçñÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÃÕÇÑ\s'-]/g, "");
    if (!sanitized) {
      setResults([]);
      setTotalCount(0);
      return;
    }
    const timer = setTimeout(async () => {
      const data = await searchSchools(sanitized, 200);
      setResults(data);
      setTotalCount(data.length);
      setDisplayCount(5);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const visibleResults = results.slice(0, displayCount);

  function handleSelect(slug: string) {
    setIsOpen(false);
    router.push(`/escolas/${slug}`);
  }

  return (
    <header className="absolute left-0 right-0 top-0 z-10 px-3 py-2 sm:px-5 sm:py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between rounded-full border border-gray-200 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm sm:px-5 sm:py-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full px-2 py-1 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 sm:text-sm"
          >
            Pesquisar escolas
          </button>

          {isOpen && (
            <div
              ref={dropdownRef}
              className="absolute left-0 top-full mt-2 w-[320px] sm:w-[400px] rounded-xl border border-gray-200 bg-white shadow-lg"
            >
              <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar escolas..."
                  className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto">
                {visibleResults.length === 0 && query.trim() && (
                  <p className="px-4 py-6 text-center text-sm text-gray-400">
                    Nenhuma escola encontrada
                  </p>
                )}
                {visibleResults.map((school) => (
                  <button
                    key={school.slug}
                    type="button"
                    onClick={() => handleSelect(school.slug)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                  >
                    <span className="mt-0.5 h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={school.logo_url || "https://placehold.co/64x64/1E6FA8/FFFFFF?text=Escola"}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-gray-900 truncate sm:text-lg">
                        {school.name}
                      </p>
                      {school.location && (
                        <p className="text-sm text-gray-500 truncate">
                          {school.location}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
                {query.trim() && displayCount < totalCount && (
                  <button
                    type="button"
                    onClick={() => setDisplayCount((prev) => prev + 5)}
                    className="w-full px-4 py-3 text-center text-sm font-semibold text-accent-light transition-colors hover:bg-gray-50 border-t border-gray-100"
                  >
                    Ver mais (+{totalCount - displayCount})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <a href="/" className="font-heading text-base font-bold text-accent-light sm:text-lg">
          Alaia
        </a>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <a
            href="/login"
            className="rounded-full px-2 py-1 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 sm:text-sm sm:px-3"
          >
            Entrar
          </a>
          <a
            href="/signup-owner"
            className="rounded-full border border-accent-light bg-white px-2 py-1 text-xs font-semibold text-accent-light transition-colors hover:bg-accent-light hover:text-white sm:text-sm sm:px-3"
          >
            Registar
          </a>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </header>
  );
}
