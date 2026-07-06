"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

const PROFILE_LINKS = [
  { href: "/perfil", label: "Geral" },
  { href: "/perfil/historico", label: "Histórico de aulas" },
  { href: "/perfil/packs", label: "Lista de packs" },
  { href: "/perfil/definicoes", label: "Definições" },
];

type UserInfo = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export function Navbar({ user }: { user: UserInfo | null }) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen && !profileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setMobileMenuOpen(false); setProfileOpen(false); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mobileMenuOpen, profileOpen]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <header className="absolute left-0 right-0 top-0 z-10 px-5 py-4 sm:px-8">
      <div className="mx-auto flex max-w-4xl items-center justify-between md:rounded-full md:border md:border-gray-200 md:bg-white/90 md:px-4 md:py-2 md:shadow-sm md:backdrop-blur-sm">
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
            className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all cursor-pointer hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent-light"
          >
            Como funciona?
          </button>
          <button
            onClick={() => document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" })}
            className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all cursor-pointer hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent-light"
          >
            Contacto
          </button>
        </nav>

        <Link href="/" className="font-heading text-xl font-bold text-white md:text-accent-light">
          Alaia
        </Link>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent-light"
                >
                  {user.name}
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
              <button
                type="button"
                onClick={handleSignOut}
                className="font-body hidden md:block rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent-light"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <a
                href="/onboarding"
                className="font-body rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
              >
                Entrar
              </a>
              <a
                href="/signup-owner"
                className="font-body rounded-full border border-accent bg-white px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
              >
                Registar o seu negócio
              </a>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex md:hidden items-center justify-center h-9 w-9 rounded-full text-white hover:bg-white/20 transition-colors"
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

      <div className={`mt-2 mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white/95 px-5 py-5 shadow-lg backdrop-blur-md md:hidden transition-all duration-300 ease-out ${
        mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}>
        <nav className="flex flex-col gap-3">
          <button
            onClick={() => { setMobileMenuOpen(false); document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" }); }}
            className="w-full text-left font-body rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
          >
            Como funciona?
          </button>
          <button
            onClick={() => { setMobileMenuOpen(false); document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" }); }}
            className="w-full text-left font-body rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
          >
            Contacto
          </button>
          <hr className="border-gray-200" />
          {user ? (
            <>
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
                {PROFILE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:text-accent first:rounded-t-xl last:rounded-b-xl"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left font-body rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <a
                href="/onboarding"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center font-body rounded-xl border border-accent bg-white px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
              >
                Entrar
              </a>
              <a
                href="/signup-owner"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center font-body rounded-xl border border-accent bg-white px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
              >
                Registar o seu negócio
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
