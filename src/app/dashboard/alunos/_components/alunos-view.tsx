"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  HomeIcon,
  CalendarIcon,
  GroupIcon,
  SurfingIcon,
  DotsIcon,
} from "@/app/dashboard/_components/icons";

type Props = {
  fullName: string;
};

type Student = {
  initials: string;
  name: string;
  lastClass: string;
  lastClassDate: string;
  packsLeft: number;
  recentClasses: number;
};

const PLACEHOLDER_STUDENTS: Student[] = [
  { initials: "MC", name: "Mário Campos", lastClass: "18 Maio 2026", lastClassDate: "2026-05-18", packsLeft: 3, recentClasses: 6 },
  { initials: "ZG", name: "Zé Gouveia", lastClass: "18 Maio 2026", lastClassDate: "2026-05-18", packsLeft: 1, recentClasses: 4 },
  { initials: "AF", name: "Ana Ferreira", lastClass: "15 Maio 2026", lastClassDate: "2026-05-15", packsLeft: 10, recentClasses: 8 },
  { initials: "RS", name: "Rui Silva", lastClass: "14 Maio 2026", lastClassDate: "2026-05-14", packsLeft: 5, recentClasses: 3 },
  { initials: "JP", name: "Joana Pereira", lastClass: "12 Maio 2026", lastClassDate: "2026-05-12", packsLeft: 2, recentClasses: 5 },
  { initials: "TM", name: "Tiago Martins", lastClass: "10 Maio 2026", lastClassDate: "2026-05-10", packsLeft: 0, recentClasses: 2 },
  { initials: "SC", name: "Sofia Costa", lastClass: "8 Maio 2026", lastClassDate: "2026-05-08", packsLeft: 8, recentClasses: 7 },
  { initials: "LM", name: "Luis Mendes", lastClass: "5 Maio 2026", lastClassDate: "2026-05-05", packsLeft: 1, recentClasses: 1 },
  { initials: "CR", name: "Catarina Reis", lastClass: "3 Maio 2026", lastClassDate: "2026-05-03", packsLeft: 6, recentClasses: 5 },
  { initials: "PN", name: "Pedro Nunes", lastClass: "1 Maio 2026", lastClassDate: "2026-05-01", packsLeft: 4, recentClasses: 3 },
  { initials: "IS", name: "Inês Santos", lastClass: "28 Abril 2026", lastClassDate: "2026-04-28", packsLeft: 12, recentClasses: 9 },
  { initials: "BF", name: "Bruno Faria", lastClass: "25 Abril 2026", lastClassDate: "2026-04-25", packsLeft: 0, recentClasses: 2 },
  { initials: "MP", name: "Mónica Pinto", lastClass: "22 Abril 2026", lastClassDate: "2026-04-22", packsLeft: 7, recentClasses: 6 },
  { initials: "DM", name: "Diogo Marques", lastClass: "20 Abril 2026", lastClassDate: "2026-04-20", packsLeft: 3, recentClasses: 4 },
  { initials: "AR", name: "Ana Rocha", lastClass: "18 Abril 2026", lastClassDate: "2026-04-18", packsLeft: 9, recentClasses: 5 },
  { initials: "JC", name: "João Carlos", lastClass: "15 Abril 2026", lastClassDate: "2026-04-15", packsLeft: 2, recentClasses: 2 },
];

const FILTERS = ["Todos", "Com pack", "Recorrente", "Inativo"];

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/dashboard/calendario", label: "Calendário", icon: CalendarIcon },
  { href: "/dashboard/alunos", label: "Alunos", icon: GroupIcon },
  { href: "/dashboard/equipamento", label: "Equipamento", icon: SurfingIcon },
  { href: "/dashboard/mais", label: "Mais", icon: DotsIcon },
];

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`h-2 w-2 rounded-full ${
        active ? "bg-success" : "bg-text-muted/50"
      }`}
    />
  );
}

function isInactive(student: Student): boolean {
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  return new Date(student.lastClassDate) < twoMonthsAgo;
}

function filterStudents(students: Student[], filter: string): Student[] {
  switch (filter) {
    case "Com pack":
      return students.filter((s) => s.packsLeft >= 1);
    case "Recorrente":
      return students.filter((s) => s.recentClasses >= 5);
    case "Inativo":
      return students.filter((s) => isInactive(s));
    default:
      return students;
  }
}

function searchStudents(students: Student[], query: string): Student[] {
  if (!query.trim()) return students;
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return students.filter((s) =>
    s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)
  );
}

export function AlunosView(_props: Props) {
  const pathname = usePathname();
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredByFilter = filterStudents(PLACEHOLDER_STUDENTS, activeFilter);
  const filtered = searchStudents(filteredByFilter, searchQuery);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  function handleSearchToggle() {
    if (searchOpen) {
      setSearchQuery("");
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
    }
  }

  return (
    <div className="h-dvh overflow-hidden bg-background text-foreground font-body flex flex-col">
      <main className="flex-1 flex flex-col overflow-hidden px-5 pt-0 pb-24">
        <section className="mt-6 mb-6 flex items-end justify-between">
          {searchOpen ? (
              <div className="flex w-full items-center gap-4">
              <div className="relative flex-1">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Procurar aluno..."
                  className="w-full rounded-xl bg-surface px-4 py-2 text-sm text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>
              <button
                type="button"
                onClick={handleSearchToggle}
                className="shrink-0 text-sm text-accent hover:underline"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Alunos
              </h1>
              <button
                type="button"
                onClick={handleSearchToggle}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-text-secondary transition-colors hover:text-foreground"
                aria-label="Pesquisar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </>
          )}
        </section>

        <nav className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={
                f === activeFilter
                   ? "whitespace-nowrap rounded-full bg-accent px-4 py-1.5 font-body text-sm font-semibold text-primary-foreground"
                  : "whitespace-nowrap rounded-full bg-surface px-4 py-1.5 font-body text-sm font-semibold text-text-secondary"
              }
            >
              {f}
            </button>
          ))}
        </nav>

        <div className="mt-6 w-full max-w-md mx-auto rounded-2xl bg-surface text-foreground overflow-hidden flex-1">
          <div className="h-full overflow-y-auto [&::-webkit-scrollbar]:hidden px-5 pt-2 pb-4">
            <div className="divide-y divide-foreground/10">
              {filtered.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center gap-4 py-3"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background text-lg font-bold text-accent">
                    {s.initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-body text-base font-bold text-foreground truncate">
                      {s.name}
                    </h3>
                    <div className="mt-0.5 text-xs text-text-secondary">
                      Última aula: {s.lastClass}
                    </div>
                    <div className="text-xs">
                      Packs:{" "}
                      {s.packsLeft === 0 ? (
                        <span className="text-error">Não</span>
                      ) : s.packsLeft <= 2 ? (
                        <span className="text-error">{s.packsLeft} {s.packsLeft === 1 ? "aula" : "aulas"} restantes</span>
                      ) : (
                        <span className="text-foreground">{s.packsLeft} aulas restantes</span>
                      )}
                    </div>
                  </div>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 shrink-0 text-text-secondary"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Scroll shadow */}
      <div className="pointer-events-none fixed bottom-[calc(1.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 h-16 bg-gradient-to-t from-background to-transparent" />

      <nav
        className="fixed left-1/2 z-50 flex w-[90%] max-w-md -translate-x-1/2 items-center justify-around rounded-full border border-accent/10 bg-surface-container-high px-2 py-2 shadow-lg backdrop-blur-md"
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-accent text-primary-foreground transition-all duration-200"
                  : "flex h-12 w-12 items-center justify-center rounded-full text-text-secondary transition-all hover:bg-accent/10"
              }
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
