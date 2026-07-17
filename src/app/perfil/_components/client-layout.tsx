"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PublicNavbar } from "@/app/_components/public-navbar";
import { HistoryIcon, PackIcon, HeartIcon, WaiverIcon, SettingsIcon } from "./icons";

const NAV_ITEMS = [
  { href: "/perfil", label: "Visão Geral", icon: null, exact: true },
  { href: "/perfil/historico", label: "Histórico", icon: HistoryIcon },
  { href: "/perfil/packs", label: "Packs", icon: PackIcon },
  { href: "/perfil/favoritos", label: "Favoritos", icon: HeartIcon },
  { href: "/perfil/waivers", label: "Waivers", icon: WaiverIcon },
  { href: "/perfil/definicoes", label: "Definições", icon: SettingsIcon },
];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <PublicNavbar />

      <div className="mx-auto max-w-5xl px-5 pt-24 pb-12 min-h-screen">
        <nav className="mb-8 flex flex-wrap gap-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-accent bg-accent text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-accent"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>

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
              <Link href="/" className="text-sm text-gray-300 transition-colors hover:text-accent-light">
                Como funciona?
              </Link>
              <Link href="/" className="text-sm text-gray-300 transition-colors hover:text-accent-light">
                Contacto
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
