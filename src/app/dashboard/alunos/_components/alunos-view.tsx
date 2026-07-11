"use client";

import { useState, useRef, useEffect, useCallback } from "react";

import { getStudents, deleteStudent, deleteStudentsBulk, toggleWaiver, createStudent, getStudentProfile, cancelPackPurchase, updatePackRemaining, type StudentRecord, type StudentProfileData, type BookingHistoryItem } from "../actions";
import { getAvailablePacks, buyPack, type AvailablePack } from "../../calendario/actions";
import { DotsIcon, TrashIcon } from "../../_components/icons";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Props = {
  schoolId: string;
};

function getInitials(name: string): string {
  return name.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase();
}

const FILTERS = ["Todos", "Com pack", "Inativo"];

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
  return student.totalClasses === 0;
}

function filterStudents(students: StudentRecord[], filter: string): StudentRecord[] {
  switch (filter) {
    case "Com pack":
      return students.filter((s) => s.hasActivePack);
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

export function AlunosView({ schoolId }: Props) {
  const [localStudents, setLocalStudents] = useState<StudentRecord[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const fetchStudents = useCallback(() => {
    if (!schoolId) return;
    setLoadingStudents(true);
    getStudents(schoolId).then(setLocalStudents).finally(() => setLoadingStudents(false));
  }, [schoolId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPackId, setAddPackId] = useState("");
  const [addRemainingLessons, setAddRemainingLessons] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [addPacks, setAddPacks] = useState<AvailablePack[]>([]);
  const [showAssignPack, setShowAssignPack] = useState(false);
  const [assignPacks, setAssignPacks] = useState<AvailablePack[]>([]);
  const [assignPackId, setAssignPackId] = useState("");
  const [assignRemainingLessons, setAssignRemainingLessons] = useState("");
  const [assigningPack, setAssigningPack] = useState(false);
  const [assignPackError, setAssignPackError] = useState("");
  const [studentProfile, setStudentProfile] = useState<StudentProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [waiverError, setWaiverError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [editingPack, setEditingPack] = useState<{ id: string; name: string; remaining: number; total: number } | null>(null);
  const [editPackRemaining, setEditPackRemaining] = useState("");
  const [editPackSaving, setEditPackSaving] = useState(false);
  const [editPackError, setEditPackError] = useState("");
  const [deletingPackData, setDeletingPackData] = useState<{ id: string; name: string } | null>(null);
  const [deletingPack, setDeletingPack] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredByFilter = filterStudents(localStudents, activeFilter);
  const filtered = searchStudents(filteredByFilter, searchQuery);
  const displayed = filtered.slice(0, displayCount);

  useEffect(() => {
    if (selectedStudent) {
      setProfileLoading(true);
      setStudentProfile(null);
      getStudentProfile(selectedStudent.id, schoolId).then((data) => {
        setStudentProfile(data);
        setProfileLoading(false);
      });
    } else {
      setStudentProfile(null);
    }
  }, [selectedStudent, schoolId]);

  useEffect(() => {
    if (displayCount >= filtered.length) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDisplayCount((prev) => Math.min(prev + 20, filtered.length));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [displayCount, filtered.length]);

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
    <>
      <div className="relative max-w-[800px] lg:max-w-[1100px] xl:mx-auto">
        <main className="px-5 pt-4 flex flex-col max-md:fixed max-md:inset-0 max-md:overflow-hidden max-md:pb-24 md:min-h-screen">
        <section className="shrink-0 mt-6 mb-6 flex items-center justify-between">
          {searchOpen ? (
              <div className="flex w-full items-center gap-4">
              <div className="relative flex-1">
                <label htmlFor="search-alunos" className="sr-only">Procurar aluno</label>
                <input
                  ref={searchRef}
                  id="search-alunos"
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
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={async () => {
                    setAddName("");
                    setAddPhone("");
                    setAddEmail("");
                    setAddPackId("");
                    setAddRemainingLessons("");
                    setAddError("");
                    const packs = await getAvailablePacks(schoolId);
                    setAddPacks(packs);
                    setShowAddModal(true);
                  }}
                  className="hidden md:flex items-center gap-2 rounded-full bg-accent px-4 py-2 font-body text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent/90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M5 12h14M12 5v14"/>
                  </svg>
                  Adicionar aluno
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setAddName("");
                    setAddPhone("");
                    setAddEmail("");
                    setAddPackId("");
                    setAddRemainingLessons("");
                    setAddError("");
                    const packs = await getAvailablePacks(schoolId);
                    setAddPacks(packs);
                    setShowAddModal(true);
                  }}
                  className="md:hidden flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary-foreground transition-colors hover:bg-accent/90"
                  aria-label="Adicionar aluno"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M5 12h14M12 5v14"/>
                  </svg>
                </button>
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
              </div>
            </>
          )}
        </section>

        <div className="flex items-center gap-2 flex-nowrap">
          <nav className="shrink-0 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden min-w-0">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                aria-pressed={f === activeFilter}
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
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button
              type="button"
              onClick={() => { setSelecting((prev) => !prev); setSelectedIds(new Set()); }}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 font-body text-xs lg:text-sm font-semibold transition-colors ${
                selecting ? "bg-error/20 text-error" : "bg-surface text-text-secondary hover:text-foreground"
              }`}
            >
              {selecting ? "Sair" : "Selecionar"}
            </button>
            {selecting && selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="whitespace-nowrap rounded-full bg-error/20 px-3 py-1.5 font-body text-xs lg:text-sm font-semibold text-error transition-colors hover:bg-error/30"
              >
                Remover ({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        {/* Mobile View: List */}
        <div className="md:hidden mt-4 w-full rounded-2xl bg-surface text-foreground overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden px-5 pt-2 pb-4">
            <div className="divide-y divide-foreground/10">
              {loadingStudents ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : displayed.length === 0 ? (
                <div className="py-12 text-center text-text-secondary">Nenhum aluno encontrado</div>
              ) : displayed.map((s) => (
                <div key={s.id} className="flex items-center gap-4 py-3">
                  {selecting && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                          return next;
                        });
                      }}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold transition-colors ${
                        selectedIds.has(s.id) ? "border-error bg-error text-white" : "border-text-muted"
                      }`}
                    >
                      {selectedIds.has(s.id) && "✓"}
                    </button>
                  )}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background text-lg font-bold text-accent">
                    {getInitials(s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-body text-base font-bold text-foreground truncate">{s.name}</h3>
                    <div className="mt-0.5 text-xs text-text-secondary">
                      Aulas concluídas: {s.totalClasses}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.waiverSigned ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-success shrink-0">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-text-muted shrink-0">
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    )}
                    <button type="button" onClick={() => setSelectedStudent(s)} className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:text-foreground transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                  </div>
                </div>
              ))}
            </div>
            {displayCount < filtered.length && (
              <div ref={sentinelRef} className="h-10 flex items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            )}
          </div>
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block mt-6 w-full rounded-2xl bg-surface text-foreground overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface/50 border-b border-white/5">
              <tr>
                {selecting && <th className="px-5 py-3 w-10"></th>}
                <th className="px-5 py-3 font-body text-[10px] text-text-secondary uppercase tracking-widest text-center">Nome do Aluno</th>
                <th className="px-5 py-3 font-body text-[10px] text-text-secondary uppercase tracking-widest text-center">Status do Pack</th>
                <th className="px-5 py-3 font-body text-[10px] text-text-secondary uppercase tracking-widest text-center">Aulas concluídas</th>
                <th className="px-5 py-3 font-body text-[10px] text-text-secondary uppercase tracking-widest text-center">Estado</th>
                <th className="px-5 py-3 font-body text-[10px] text-text-secondary uppercase tracking-widest text-center">Waiver</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loadingStudents ? (
                <tr><td colSpan={selecting ? 7 : 6} className="py-12 text-center text-text-secondary">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={selecting ? 7 : 6} className="py-12 text-center text-text-secondary">Nenhum aluno encontrado</td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id} className="hover:bg-white/5 transition-colors">
                  {selecting && (
                    <td className="px-5 py-3 align-middle text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                            return next;
                          });
                        }}
                        className={`mx-auto flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold transition-colors ${
                          selectedIds.has(s.id) ? "border-error bg-error text-white" : "border-text-muted"
                        }`}
                      >
                        {selectedIds.has(s.id) && "✓"}
                      </button>
                    </td>
                  )}
                  <td className="px-5 py-3 align-middle text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-[10px] font-bold text-accent">
                        {getInitials(s.name)}
                      </div>
                      <span className="font-body text-sm font-medium text-foreground">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-body text-sm text-text-secondary align-middle text-center">
                    {s.packs.length > 0 ? `${s.packs[0].name}: ${s.packs[0].remaining} aulas` : "Sem pack"}
                  </td>
                  <td className="px-5 py-3 font-body text-sm text-text-secondary align-middle text-center">
                    {s.totalClasses}
                  </td>
                  <td className="px-5 py-3 align-middle text-center">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${s.isGuest ? "text-text-muted" : "text-success"}`}>
                      {s.isGuest ? "Convidado" : "Registado"}
                    </span>
                  </td>
                  <td className="px-5 py-3 align-middle text-center">
                    <div className="flex items-center justify-center">
                      {s.waiverSigned ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-success">
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-text-muted">
                          <circle cx="12" cy="12" r="9" />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right align-middle">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(s)}
                      aria-label={`Detalhes de ${s.name}`}
                      className="text-text-secondary hover:text-foreground"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M5 12h14M12 5v14"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Summary Bar (Footer of content) */}
        <div className="hidden md:flex mt-auto pt-6 md:mb-4 flex items-center justify-between border-t border-white/10">
          <div className="flex flex-col">
            <span className="font-body text-[10px] text-text-secondary uppercase tracking-widest">Total Alunos</span>
            <span className="font-heading text-xl text-foreground">{localStudents.length}</span>
          </div>
          

        </div>
      </main>
      </div>

      {/* Student popup */}
      {selectedStudent && !showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5" onClick={() => setSelectedStudent(null)}>
          <div className="flex max-h-[95vh] w-full max-w-2xl flex-col rounded-2xl bg-surface" onClick={(e) => e.stopPropagation()}>
            <div className="overflow-y-auto px-6 py-6 [&::-webkit-scrollbar]:hidden">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                  <p className="font-body text-xs text-text-secondary">Email</p>
                  <p className="font-body text-sm text-foreground truncate">{selectedStudent.email || "—"}</p>
                </div>
                <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                  <p className="font-body text-xs text-text-secondary">Telemóvel</p>
                  <p className="font-body text-sm text-foreground">{selectedStudent.phone || "—"}</p>
                </div>
                {(!profileLoading && studentProfile?.stats.groupSize) ? (
                  <div className="rounded-xl bg-accent/10 px-4 py-3">
                    <p className="font-body text-xs text-text-secondary">Pessoas no grupo</p>
                    <p className="font-body text-sm font-semibold text-accent">{studentProfile.stats.groupSize}</p>
                  </div>
                ) : null}
              </div>

              {/* Stats + Packs + Booking History (from profile async fetch) */}
              {profileLoading ? (
                <div className="mt-4 flex items-center justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : studentProfile ? (
                <>
                  <div className="mt-4 rounded-xl border border-accent/10 bg-[#2A2A2A] px-4 py-3">
                    <p className="font-body text-xs text-text-secondary mb-2">Packs ativos</p>
                    {studentProfile.activePacks.length > 0 ? (
                      <div className="space-y-3">
                        {studentProfile.activePacks.map((pack) => (
                          <div key={pack.id} className="flex items-center justify-between rounded-lg bg-[#1A1A1A] px-3 py-2">
                            <div>
                              <p className="font-body text-sm font-semibold text-foreground">{pack.name}</p>
                              <p className="font-body text-xs text-text-secondary">
                                {pack.remaining} / {pack.total} aulas
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-body text-sm font-semibold text-accent">
                                {Math.round((pack.remaining / pack.total) * 100)}%
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPack({ id: pack.id, name: pack.name, remaining: pack.remaining, total: pack.total });
                                  setEditPackRemaining(String(pack.remaining));
                                  setEditPackError("");
                                }}
                                className="ml-2 rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-white/5 hover:text-foreground"
                              >
                                <DotsIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingPackData({ id: pack.id, name: pack.name })}
                                className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-body text-sm text-text-muted">Não tem pack ativo</p>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        const packs = await getAvailablePacks(schoolId);
                        setAssignPacks(packs);
                        setAssignPackId("");
                        setAssignRemainingLessons("");
                        setAssignPackError("");
                        setShowAssignPack(true);
                      }}
                      className="mt-3 w-full rounded-lg bg-accent/20 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/30"
                    >
                      Atribuir pack
                    </button>
                  </div>

                  {studentProfile.bookings.length > 0 && (
                    <StudentHistory bookings={studentProfile.bookings} />
                  )}
                </>
              ) : null}

              {/* Waiver */}
              <div className="mt-4 rounded-xl bg-[#2A2A2A] px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">Termo de responsabilidade</p>
                    <p className="font-body text-xs text-text-secondary">
                      {selectedStudent.waiverSigned ? "Assinado" : "Não assinado"}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={selectedStudent.waiverSigned}
                    onClick={async () => {
                      setWaiverError("");
                      const next = !selectedStudent.waiverSigned;
                      const studentId = selectedStudent.id;
                      setLocalStudents((prev) =>
                        prev.map((s) => (s.id === studentId ? { ...s, waiverSigned: next } : s))
                      );
                      setSelectedStudent((prev) => (prev ? { ...prev, waiverSigned: next } : null));
                      const res = await toggleWaiver(studentId, next);
                      if (!res.ok) {
                        setLocalStudents((prev) =>
                          prev.map((s) => (s.id === studentId ? { ...s, waiverSigned: !next } : s))
                        );
                        setSelectedStudent((prev) =>
                          prev && prev.id === studentId ? { ...prev, waiverSigned: !next } : prev
                        );
                        setWaiverError(res.error ?? "Erro ao atualizar");
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      selectedStudent.waiverSigned ? "bg-accent" : "bg-[#444]"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        selectedStudent.waiverSigned ? "translate-x-[1.375rem]" : "translate-x-[1px]"
                      }`}
                    />
                  </button>
                </div>
                {waiverError && (
                  <p className="mt-2 font-body text-xs text-error">{waiverError}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-5 w-full rounded-xl bg-error-bg py-3 font-body text-sm font-semibold text-error transition-colors hover:bg-error/30"
              >
                Eliminar aluno
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="mt-3 mb-4 w-full rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm && !!selectedStudent}
        onClose={() => { setShowDeleteConfirm(false); setDeleteError(""); }}
        onConfirm={async () => {
          if (!selectedStudent) return;
          setDeleteError("");
          const deletedId = selectedStudent.id;
          const deletedStudent = selectedStudent;
          setLocalStudents((prev) => prev.filter((s) => s.id !== deletedId));
          const res = await deleteStudent(deletedId);
          if (!res.ok) {
            setLocalStudents((prev) => [...prev, deletedStudent].sort((a, b) => a.name.localeCompare(b.name)));
            setDeleteError(res.error ?? "Erro ao eliminar aluno");
            throw new Error(res.error);
          }
          setSelectedStudent(null);
        }}
        title="Eliminar aluno"
        message={`Tens a certeza que queres eliminar "${selectedStudent?.name}"? Esta ação remove o aluno de todas as aulas e não pode ser desfeita.`}
        confirmLabel="Sim, eliminar"
        cancelLabel="Cancelar"
        error={deleteError || undefined}
        variant="danger"
      />

      <BottomSheet
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Adicionar aluno"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={addSaving}
              onClick={async () => {
                if (!addName.trim()) { setAddError("O nome é obrigatório"); return; }
                setAddSaving(true);
                setAddError("");
                const res = await createStudent(addName.trim(), addPhone.trim() || undefined, addEmail.trim() || undefined, addPackId || undefined, addRemainingLessons || undefined, schoolId);
                if (!res.ok) { setAddError(res.error ?? "Erro ao adicionar aluno"); setAddSaving(false); return; }
                setShowAddModal(false);
                setAddSaving(false);
                fetchStudents();
              }}
              className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
            >
              {addSaving ? "A adicionar..." : "Adicionar"}
            </button>
          </>
        }
      >
        <div>
          <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
            Nome <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Nome do aluno"
            className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
          />
        </div>

        <div>
          <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
            Telemóvel <span className="text-text-muted">(opcional)</span>
          </label>
          <input
            type="tel"
            inputMode="numeric"
            value={addPhone}
            onChange={(e) => setAddPhone(e.target.value.replace(/\s/g, ""))}
            placeholder="Ex: 912345678"
            className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
          />
          <p className="mt-1 font-body text-xs text-text-muted">Poderá ser usado para ligar a uma conta futura.</p>
        </div>

        <div>
          <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
            Email <span className="text-text-muted">(opcional)</span>
          </label>
          <input
            type="email"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            placeholder="Ex: aluno@email.com"
            className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
          />
          <p className="mt-1 font-body text-xs text-text-muted">Se preenchido, o aluno receberá um convite por email para definir a sua palavra-passe.</p>
        </div>

        <div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                Pack <span className="text-text-muted">(opcional)</span>
              </label>
              <div className="relative">
                <select
                  value={addPackId}
                  onChange={(e) => setAddPackId(e.target.value)}
                  className="w-full appearance-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent"
                >
                  <option value="">Sem pack</option>
                  {addPacks.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.total_lessons} aulas</option>
                  ))}
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
            {addPackId && (
              <div className="flex-1">
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Aulas restantes
                </label>
                <input
                  type="number"
                  min="1"
                  value={addRemainingLessons}
                  onChange={(e) => setAddRemainingLessons(e.target.value)}
                  placeholder="Ex: 10"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>
            )}
          </div>
        </div>

        {addError && (
          <p className="font-body text-sm text-error">{addError}</p>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={showAssignPack}
        onClose={() => { setShowAssignPack(false); setAssignPackError(""); }}
        title="Atribuir pack"
        footer={
          <>
            <button
              type="button"
              onClick={() => { setShowAssignPack(false); setAssignPackError(""); }}
              className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!assignPackId || assigningPack}
              onClick={async () => {
                if (!selectedStudent || !assignPackId) return;
                setAssignPackError("");
                setAssigningPack(true);
                const res = await buyPack(selectedStudent.id, assignPackId, schoolId, assignRemainingLessons ? Number(assignRemainingLessons) : undefined);
                if (res.ok) {
                  setShowAssignPack(false);
                  const profile = await getStudentProfile(selectedStudent.id, schoolId);
                  if (profile) setStudentProfile(profile);
                  fetchStudents();
                } else {
                  setAssignPackError(res.error ?? "Erro ao atribuir pack");
                }
                setAssigningPack(false);
              }}
              className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
            >
              {assigningPack ? "A atribuir..." : "Confirmar"}
            </button>
          </>
        }
      >
        {assignPackError && (
          <p className="font-body text-sm text-error">{assignPackError}</p>
        )}

        {assignPacks.length === 0 ? (
          <p className="font-body text-sm text-text-muted">Nenhum pack disponível. Cria packs nos Serviços primeiro.</p>
        ) : (
          <>
            <div>
              <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Pack</label>
              <div className="relative">
                <select
                  value={assignPackId}
                  onChange={(e) => { setAssignPackId(e.target.value); setAssignPackError(""); }}
                  className="w-full appearance-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent"
                >
                  <option value="">Selecionar pack</option>
                  {assignPacks.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.total_lessons} aulas — {(p.price_cents / 100).toFixed(2).replace(".", ",")}€</option>
                  ))}
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
            {assignPackId && (
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Aulas restantes <span className="text-text-muted font-normal">(opcional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={assignRemainingLessons}
                  onChange={(e) => setAssignRemainingLessons(e.target.value)}
                  placeholder="Por defeito: todas as aulas do pack"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>
            )}
          </>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={!!editingPack}
        onClose={() => { setEditingPack(null); setEditPackError(""); }}
        title="Editar pack"
        showHandle
        footer={
          <>
            <button
              type="button"
              onClick={() => { setEditingPack(null); setEditPackError(""); }}
              className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={editPackSaving}
              onClick={async () => {
                if (!editingPack || !selectedStudent) return;
                setEditPackError("");
                setEditPackSaving(true);
                const res = await updatePackRemaining(
                  editingPack.id,
                  schoolId,
                  Number(editPackRemaining)
                );
                if (res.ok) {
                  setEditingPack(null);
                  const profile = await getStudentProfile(selectedStudent.id, schoolId);
                  if (profile) setStudentProfile(profile);
                  fetchStudents();
                } else {
                  setEditPackError(res.error ?? "Erro ao editar pack");
                }
                setEditPackSaving(false);
              }}
              className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
            >
              {editPackSaving ? "A guardar..." : "Guardar"}
            </button>
          </>
        }
      >
        <p className="font-body text-sm text-text-secondary mb-4">
          {editingPack?.name}
        </p>
        <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
          Aulas restantes
        </label>
        <input
          type="number"
          min="0"
          max="100"
          value={editPackRemaining}
          onChange={(e) => setEditPackRemaining(e.target.value)}
          className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
        />
        {editPackError && (
          <p className="font-body text-xs text-error">{editPackError}</p>
        )}
      </BottomSheet>

      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => { setShowBulkDeleteConfirm(false); }}
        onConfirm={async () => {
          const ids = Array.from(selectedIds);
          if (ids.length === 0) return;
          const prevStudents = localStudents;
          setLocalStudents((prev) => prev.filter((s) => !ids.includes(s.id)));
          setSelecting(false);
          setSelectedIds(new Set());
          setShowBulkDeleteConfirm(false);
          const res = await deleteStudentsBulk(ids);
          if (!res.ok) {
            setLocalStudents(prevStudents);
            throw new Error(res.error);
          }
        }}
        title="Remover alunos"
        message={`Tens a certeza que queres remover ${selectedIds.size} ${selectedIds.size === 1 ? "aluno" : "alunos"}? Esta ação remove os alunos de todas as aulas e não pode ser desfeita.`}
        confirmLabel="Sim, remover"
        cancelLabel="Cancelar"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!deletingPackData}
        onClose={() => { setDeletingPackData(null); setEditPackError(""); }}
        onConfirm={async () => {
          if (!deletingPackData) return;
          setDeletingPack(true);
          const res = await cancelPackPurchase(deletingPackData.id, schoolId);
          if (res.ok) {
            setStudentProfile(prev => prev ? { ...prev, activePacks: prev.activePacks.filter(p => p.id !== deletingPackData!.id) } : null);
            fetchStudents();
            setDeletingPackData(null);
          } else {
            setEditPackError(res.error ?? "Erro ao eliminar pack");
            throw new Error(res.error);
          }
          setDeletingPack(false);
        }}
        title="Eliminar pack"
        message={`Tens a certeza que queres eliminar o pack "${deletingPackData?.name}" deste aluno?`}
        confirmLabel="Sim, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        icon={<TrashIcon className="h-6 w-6 text-error" />}
        error={editPackError || undefined}
      />

    </>
  );
}

function StudentHistory({ bookings }: { bookings: BookingHistoryItem[] }) {
  const now = new Date();
  const future = bookings.filter((b) => new Date(b.startsAt) >= now);
  const past = bookings.filter((b) => new Date(b.startsAt) < now);

  return (
    <div className="mt-4 rounded-xl bg-[#2A2A2A] px-4 py-3">
      {future.length > 0 && (
        <>
          <p className="font-body text-xs text-text-secondary mb-3">Próximas aulas</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {future.map(renderBookingRow)}
          </div>
        </>
      )}
      {past.length > 0 && (
        <>
          {future.length > 0 && <div className="mt-4" />}
          <p className="font-body text-xs text-text-secondary mb-3">Histórico</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {past.map(renderBookingRow)}
          </div>
        </>
      )}
    </div>
  );
}

function renderBookingRow(b: BookingHistoryItem) {
  const d = new Date(b.startsAt);
  const formatted = d.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const statusColor =
    b.status === "attended"
      ? "bg-success/20 text-success"
      : b.status === "no_show"
        ? "bg-error/20 text-error"
        : b.status === "cancelled_by_student" || b.status === "cancelled_by_school"
          ? "bg-white/5 text-text-muted"
          : "bg-accent/10 text-accent";
  const statusLabel =
    b.status === "attended"
      ? "Presente"
      : b.status === "no_show"
        ? "Falta"
        : b.status.startsWith("cancelled")
          ? "Cancelada"
          : "Confirmada";

  return (
    <div key={b.id} className="flex items-center justify-between gap-2 rounded-lg bg-[#1A1A1A] px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="font-body text-sm text-foreground truncate">
          {formatted} · {time}
        </p>
        <p className="font-body text-xs text-text-muted truncate">
          {b.classTypeName ?? "—"}
          {b.groupSize ? ` · ${b.groupSize} pessoas` : ""}
          {b.instructorName ? ` · ${b.instructorName}` : ""}
        </p>
      </div>
      <span className={`shrink-0 rounded-md px-2 py-0.5 font-body text-xs font-semibold ${statusColor}`}>
        {statusLabel}
      </span>
    </div>
  );
}
