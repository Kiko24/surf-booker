"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  HomeIcon,
  CalendarIcon,
  GroupIcon,
  SessionsIcon,
  DotsIcon,
} from "@/app/dashboard/_components/icons";

import { deleteStudent, type StudentRecord } from "../actions";

type Props = {
  fullName: string;
  students: StudentRecord[];
};

function getInitials(name: string): string {
  return name.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase();
}

const FILTERS = ["Todos", "Com pack", "Recorrente", "Inativo"];

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/dashboard/calendario", label: "Calendário", icon: CalendarIcon },
  { href: "/dashboard/alunos", label: "Alunos", icon: GroupIcon },
  { href: "/dashboard/servicos", label: "Serviços", icon: SessionsIcon },
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

function isInactive(student: StudentRecord): boolean {
  if (!student.classDateRaw) return false;
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  return new Date(student.classDateRaw) < twoMonthsAgo;
}

function filterStudents(students: StudentRecord[], filter: string): StudentRecord[] {
  switch (filter) {
    case "Com pack":
      return students; // packs not implemented yet
    case "Recorrente":
      return students; // attendance tracking not implemented yet
    case "Inativo":
      return students.filter((s) => isInactive(s));
    default:
      return students;
  }
}

function searchStudents(students: StudentRecord[], query: string): StudentRecord[] {
  if (!query.trim()) return students;
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return students.filter((s) =>
    s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)
  );
}

export function AlunosView({ students }: Props) {
  const pathname = usePathname();
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredByFilter = filterStudents(students, activeFilter);
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
                  key={s.id}
                  className="flex items-center gap-4 py-3"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background text-lg font-bold text-accent">
                    {getInitials(s.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-body text-base font-bold text-foreground truncate">
                      {s.name}
                    </h3>
                    <div className="mt-0.5 text-xs text-text-secondary">
                      {s.classLabel && s.classDate ? `${s.classLabel}: ${s.classDate}` : "Sem aulas"}
                    </div>
                    <div className="text-xs">
                      {s.isGuest ? (
                        <span className="text-text-muted">Convidado</span>
                      ) : (
                        <span className="text-success">Registado</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedStudent(s)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:text-foreground transition-colors"
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
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Student popup */}
      {selectedStudent && !showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-10">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />

            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-background text-xl font-bold text-accent">
                {getInitials(selectedStudent.name)}
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">{selectedStudent.name}</h3>
                <p className="font-body text-sm text-text-secondary">
                  {selectedStudent.isGuest ? "Convidado" : "Registado"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {selectedStudent.email && (
                <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                  <p className="font-body text-xs text-text-secondary">Email</p>
                  <p className="font-body text-sm text-foreground">{selectedStudent.email}</p>
                </div>
              )}
              {selectedStudent.phone && (
                <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                  <p className="font-body text-xs text-text-secondary">Telemóvel</p>
                  <p className="font-body text-sm text-foreground">{selectedStudent.phone}</p>
                </div>
              )}
              <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                <p className="font-body text-xs text-text-secondary">{selectedStudent.classLabel ?? "Aulas"}</p>
                <p className="font-body text-sm text-foreground">{selectedStudent.classDate ?? "Nenhuma"}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-6 w-full rounded-xl bg-error/20 py-3 font-body text-sm font-semibold text-error transition-colors hover:bg-error/30"
            >
              Eliminar aluno
            </button>

            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              className="mt-3 w-full rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {selectedStudent && showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center">
            <p className="font-heading text-xl font-bold text-foreground mb-2">Eliminar aluno</p>
            <p className="font-body text-sm text-text-secondary mb-6">
              Tens a certeza que queres eliminar <strong>{selectedStudent.name}</strong>?
              Esta ação remove o aluno de todas as aulas e não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await deleteStudent(selectedStudent.id);
                  if (res.ok) {
                    setSelectedStudent(null);
                    setShowDeleteConfirm(false);
                    window.location.reload();
                  }
                }}
                className="flex-1 rounded-xl bg-error py-3 font-body text-sm font-semibold text-error-foreground transition-transform active:scale-95"
              >
                Sim, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

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
