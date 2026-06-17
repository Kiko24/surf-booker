"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchSchools } from "@/app/escolas/actions";
import { PublicNavbar } from "@/app/_components/public-navbar";
import type { ShowcasedSchool, SchoolSearchResult } from "@/app/escolas/actions";

type Props = {
  showcased: ShowcasedSchool[];
};

function StarOutline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function DirectoryView({ showcased }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SchoolSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setShowResults(false);
        return;
      }
      const sanitized = query.trim().slice(0, 100).replace(/[^a-zA-Z0-9áéíóúâêîôûàèìòùãõçñÁÉÓÍÚÂÊÎÔÛÀÈÌÒÙÃÕÇÑ\s'-]/g, "");
      if (!sanitized) {
        setResults([]);
        setShowResults(false);
        return;
      }
      const data = await searchSchools(sanitized, 10);
      setResults(data);
      setShowResults(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(slug: string) {
    setShowResults(false);
    setQuery("");
    router.push(`/escolas/${slug}`);
  }

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <PublicNavbar />

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-5 pt-32 pb-16 sm:pt-40 sm:pb-20">
        <h1 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl text-center">
          O que queres fazer hoje?
        </h1>
        <p className="mt-2 text-sm text-gray-500 text-center">
          Encontra a escola perfeita para a tua próxima aventura
        </p>

        <div className="relative mt-8 w-full max-w-lg">
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-all focus-within:border-accent focus-within:shadow-md">
            <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Procura a tua escola"
              aria-label="Pesquisar escolas"
              className="flex-1 bg-white text-base text-gray-900 outline-none placeholder:text-gray-700"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setShowResults(false); }}
                className="rounded-full p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {showResults && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-10">
              {results.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">
                  Nenhuma escola encontrada
                </p>
              ) : (
                results.map((school) => (
                  <button
                    key={school.slug}
                    type="button"
                    onClick={() => handleSelect(school.slug)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
                  >
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-accent">
                      {school.logo_url ? (
                        <img
                          src={school.logo_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                          {school.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-gray-900 truncate">
                        {school.name}
                      </p>
                      {school.location && (
                        <p className="text-sm text-gray-500 truncate">
                          {school.location}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* Showcase */}
      {showcased.length > 0 && (
        <section className="px-5 pb-16 sm:px-8 sm:pb-20">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-bold text-gray-900">
                Escolas em destaque
              </h2>
              {/* Desktop arrows */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scroll("left")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:border-accent hover:text-accent"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => scroll("right")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:border-accent hover:text-accent"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {showcased.map((school) => (
                <div
                  key={school.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/escolas/${school.slug}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/escolas/${school.slug}`); }}
                  className="snap-start shrink-0 w-[310px] rounded-2xl border border-gray-200 bg-white text-left transition-all hover:shadow-md hover:scale-[1.02] overflow-hidden flex flex-col"
                >
                  <div className="h-52 shrink-0 overflow-hidden bg-accent">
                    {school.photo_url ? (
                      <img
                        src={school.photo_url}
                        alt={school.name}
                        className="h-full w-full object-cover block"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4">
                        <svg className="h-12 w-12 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        <span className="text-xs text-white/60 font-medium">Sem fotos</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 px-6 pt-4 pb-6 min-h-[180px]">
                    <h3 className="font-heading text-xl font-bold text-gray-900 truncate">
                      {school.name}
                    </h3>
                    {school.location && (
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-gray-500 line-clamp-2">
                        <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        {school.location}
                      </p>
                    )}
                    {school.rating_count > 0 && (
                      <div className="mt-auto flex flex-col gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarOutline key={i} className="h-5 w-5 text-gray-300" />
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">
                          ({school.rating_count} avaliações)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-gray-800 px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="max-w-xs">
              <Link href="/" className="font-heading text-xl font-bold text-white">
                Alaia
              </Link>
              <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                Plataforma de gestão para escolas de surf e desportos aquáticos.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Produto
              </p>
              <Link
                href="/"
                className="text-sm text-gray-300 transition-colors hover:text-accent-light"
              >
                Como funciona?
              </Link>
              <a
                href="/signup-owner"
                className="text-sm text-gray-300 transition-colors hover:text-accent-light"
              >
                Registar o seu negócio
              </a>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">&copy; 2026 Alaia</p>
            <div className="flex gap-4 text-xs text-gray-400">
              <a href="/termos" className="hover:text-accent-light transition-colors">Termos</a>
              <a href="/privacidade" className="hover:text-accent-light transition-colors">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
