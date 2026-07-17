"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { searchSchools } from "@/app/escolas/actions";
import type { SchoolSearchResult } from "@/app/escolas/actions";

const PROFILE_LINKS = [
  { href: "/perfil", label: "Geral" },
  { href: "/perfil/historico", label: "Histórico de aulas" },
  { href: "/perfil/packs", label: "Lista de packs" },
  { href: "/perfil/definicoes", label: "Definições" },
];

export function PublicNavbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SchoolSearchResult[]>([]);
  const [displayCount, setDisplayCount] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clientLink, setClientLink] = useState(false);
  const [userName, setUserName] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();
      if (profile?.role === "client") {
        setClientLink(true);
        const { data: student } = await supabase
          .from("students")
          .select("full_name")
          .eq("auth_user_id", session.user.id)
          .maybeSingle();
        setUserName(student?.full_name ?? session.user.email?.split("@")[0] ?? "Utilizador");
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      const id = requestAnimationFrame(() => {
        setQuery("");
        setResults([]);
        setDisplayCount(5);
      });
      return () => cancelAnimationFrame(id);
    }
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setTotalCount(0);
        return;
      }
      const sanitized = query.trim().slice(0, 100).replace(/[^a-zA-Z0-9áéíóúâêîôûàèìòùãõçñÁÉÓÍÚÂÊÎÔÛÀÈÌÒÙÃÕÇÑ\s'-]/g, "");
      if (!sanitized) {
        setResults([]);
        setTotalCount(0);
        return;
      }
      const data = await searchSchools(sanitized, 200);
      setResults(data);
      setTotalCount(data.length);
      setDisplayCount(5);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!isOpen && !mobileMenuOpen && !profileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setIsOpen(false); setMobileMenuOpen(false); setProfileOpen(false); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, mobileMenuOpen, profileOpen]);

  const visibleResults = results.slice(0, displayCount);

  function handleSelect(slug: string) {
    setIsOpen(false);
    router.push(`/escolas/${slug}`);
  }

  return (
    <header className="absolute left-0 right-0 top-0 z-10 px-5 py-4">
      {/* Desktop — pill */}
      <div className="hidden md:flex mx-auto max-w-5xl items-center justify-between rounded-full border border-gray-200 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm">
        <div className="relative">
          <button
            type="button"
            onClick={() => { setIsOpen(!isOpen); setProfileOpen(false); }}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
          >
            Pesquisar escolas
          </button>

          {isOpen && (
            <div
              ref={dropdownRef}
              className="absolute left-0 top-full mt-2 w-[400px] rounded-xl border border-gray-200 bg-white shadow-lg"
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
                    className="w-full px-4 py-3 text-center text-sm font-semibold text-accent transition-colors hover:bg-gray-50 border-t border-gray-100"
                  >
                    Ver mais (+{totalCount - displayCount})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <Link href="/" className="font-heading text-lg font-bold text-accent-light md:text-accent-light">
          Alaia
        </Link>

        <div className="flex items-center gap-2">
          {clientLink ? (
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="rounded-full px-4 py-1.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                Sair
              </button>
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 rounded-full border border-accent bg-accent px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
                >
                  {userName.charAt(0).toUpperCase() + userName.slice(1)}
                  <svg className={`h-3.5 w-3.5 transition-transform ${profileOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                      {PROFILE_LINKS.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setProfileOpen(false)}
                          className="block px-4 py-2.5 text-sm text-gray-700 transition-all hover:text-accent hover:shadow-sm"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              <a
                href="/login"
                className="rounded-full px-4 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
              >
                Entrar
              </a>
              <a
                href="/signup-owner"
                className="rounded-full border border-accent bg-white px-4 py-1.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
              >
                Registar
              </a>
            </>
          )}
        </div>
      </div>

      {/* Mobile — transparent header (igual landing page) */}
      <div className="flex md:hidden items-center justify-between">
        <Link href="/" className="font-heading text-xl font-bold text-accent-light">
          Alaia
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center justify-center h-9 w-9 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      <div className={`mt-2 mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-lg backdrop-blur-md md:hidden transition-all duration-300 ease-out ${
        mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}>
        <nav className="flex flex-col gap-3">
          {/* Search within mobile dropdown */}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5">
            <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar escolas..."
              className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>

          {visibleResults.length > 0 && (
            <div className="max-h-[240px] overflow-y-auto -mx-1">
              {visibleResults.map((school) => (
                <button
                  key={school.slug}
                  type="button"
                  onClick={() => { handleSelect(school.slug); setMobileMenuOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={school.logo_url || "https://placehold.co/64x64/1E6FA8/FFFFFF?text=Escola"}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{school.name}</p>
                    {school.location && <p className="text-xs text-gray-500 truncate">{school.location}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          <hr className="border-gray-200" />

          {clientLink ? (
            <div className="flex flex-col gap-2">
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
                {PROFILE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <button
                type="button"
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="block w-full text-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100"
              >
                Sair
              </button>
            </div>
          ) : (
            <>
              <a
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center rounded-xl border border-accent bg-white px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
              >
                Entrar
              </a>
              <a
                href="/signup-owner"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
              >
                Registar o seu negócio
              </a>
            </>
          )}
        </nav>
      </div>

      {/* Backdrop for desktop search */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Backdrop for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </header>
  );
}
