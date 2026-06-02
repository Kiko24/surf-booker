"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

import { deleteStudent, toggleWaiver, createStudent, type StudentRecord } from "../actions";
import { getAvailablePacks, buyPack, type AvailablePack } from "../../calendario/actions";

type Props = {
  fullName: string;
  schoolId: string;
  students: StudentRecord[];
};

function getInitials(name: string): string {
  return name.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase();
}

const FILTERS = ["Todos", "Com pack", "Recorrente", "Inativo"];

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

export function AlunosView({ fullName, schoolId, students }: Props) {
  const router = useRouter();
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
  const [showBuyPack, setShowBuyPack] = useState(false);
  const [availablePacks, setAvailablePacks] = useState<AvailablePack[]>([]);
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);
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
    <>
      <main className="px-5 pt-4 flex flex-col min-h-screen">
        <section className="mt-6 mb-6 flex items-center justify-between">
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

        {/* Mobile View: List */}
        <div className="md:hidden mt-6 w-full rounded-2xl bg-surface text-foreground overflow-hidden flex-1 mb-24">
          <div className="h-full overflow-y-auto [&::-webkit-scrollbar]:hidden px-5 pt-2 pb-4">
            <div className="divide-y divide-foreground/10">
              {filtered.map((s) => (
                <div key={s.id} className="flex items-center gap-4 py-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background text-lg font-bold text-accent">
                    {getInitials(s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-body text-base font-bold text-foreground truncate">{s.name}</h3>
                    <div className="mt-0.5 text-xs text-text-secondary">
                      {s.classLabel && s.classDate ? `${s.classLabel}: ${s.classDate}` : "Sem aulas"}
                    </div>
                  </div>
                  <button type="button" onClick={() => setSelectedStudent(s)} className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:text-foreground transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block mt-6 w-full rounded-2xl bg-surface text-foreground overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface/50 border-b border-white/5">
              <tr>
                <th className="px-5 py-3 font-body text-[10px] text-text-secondary uppercase tracking-widest text-center">Nome do Aluno</th>
                <th className="px-5 py-3 font-body text-[10px] text-text-secondary uppercase tracking-widest text-center">Status do Pack</th>
                <th className="px-5 py-3 font-body text-[10px] text-text-secondary uppercase tracking-widest text-center">Última Aula</th>
                <th className="px-5 py-3 font-body text-[10px] text-text-secondary uppercase tracking-widest text-center">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3 align-middle text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-[10px] font-bold text-accent">
                        {getInitials(s.name)}
                      </div>
                      <span className="font-body text-sm font-medium text-foreground">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-body text-sm text-text-secondary align-middle text-center">
                    {s.packs.length > 0 ? `${s.packs[0].remaining} aulas` : "Sem pack"}
                  </td>
                  <td className="px-5 py-3 font-body text-sm text-text-secondary align-middle text-center">
                    {s.classDate ?? "N/A"}
                  </td>
                  <td className="px-5 py-3 align-middle text-center">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${s.isGuest ? "text-text-muted" : "text-success"}`}>
                      {s.isGuest ? "Convidado" : "Registado"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right align-middle">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(s)}
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
            <span className="font-heading text-xl text-foreground">{students.length}</span>
          </div>
          
          {/* Pagination Placeholder */}
          <div className="flex items-center gap-2">
            <button className="p-2 border border-white/10 rounded-lg text-text-secondary hover:bg-surface transition-colors disabled:opacity-30" disabled>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <span className="font-body text-sm px-4 text-foreground">1 de 1</span>
            <button className="p-2 border border-white/10 rounded-lg text-text-secondary hover:bg-surface transition-colors disabled:opacity-30" disabled>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </main>

      {/* Student popup */}
      {selectedStudent && !showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl bg-surface">
            <div className="mx-auto mt-6 mb-2 h-1 w-10 shrink-0 rounded-full bg-text-muted" />

            <div className="overflow-y-auto px-6 pb-24 [&::-webkit-scrollbar]:hidden">
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

              {/* Packs section (apenas registados) */}
              {!selectedStudent.isGuest && (
                <div className="mt-4 rounded-xl border border-accent/10 bg-[#2A2A2A] px-4 py-3">
                  <p className="font-body text-xs text-text-secondary mb-2">Packs</p>
                  {selectedStudent.packs.length === 0 ? (
                    <p className="font-body text-sm text-text-muted">Não tem packs ativos</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedStudent.packs.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="font-body text-sm text-foreground">{p.name}</span>
                          <span className="font-body text-xs text-text-secondary">
                            {p.remaining === 1 ? "1 aula restante" : `${p.remaining} aulas restantes`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      const packs = await getAvailablePacks(schoolId);
                      setAvailablePacks(packs);
                      setShowBuyPack(true);
                    }}
                    className="mt-2 w-full rounded-lg bg-accent/20 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/30"
                  >
                    Comprar pack
                  </button>
                </div>
              )}

              {/* Waiver */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-[#2A2A2A] px-4 py-3">
                <div>
                  <p className="font-body text-sm font-semibold text-foreground">Termo de responsabilidade</p>
                  <p className="font-body text-xs text-text-secondary">
                    {selectedStudent.waiverSigned ? "Assinado" : "Não assinado"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await toggleWaiver(selectedStudent.id, !selectedStudent.waiverSigned);
                    if (res.ok) {
                      setSelectedStudent({
                        ...selectedStudent,
                        waiverSigned: !selectedStudent.waiverSigned,
                      });
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-5 w-full rounded-xl bg-error/20 py-3 font-body text-sm font-semibold text-error transition-colors hover:bg-error/30"
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
                    router.refresh();
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

      {/* Buy pack modal */}
      {showBuyPack && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-10">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />
            <h3 className="font-heading text-xl font-bold text-foreground mb-4">Comprar pack</h3>
            {availablePacks.length === 0 ? (
              <p className="font-body text-sm text-text-muted mb-6">Nenhum pack disponível. Cria packs nos Serviços primeiro.</p>
            ) : (
              <div className="space-y-3 mb-6">
                {availablePacks.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={buyingPackId === p.id}
                    onClick={async () => {
                      if (!selectedStudent) return;
                      setBuyingPackId(p.id);
                      const res = await buyPack(selectedStudent.id, p.id, schoolId);
                      if (res.ok) {
                        setShowBuyPack(false);
                        router.refresh();
                      }
                      setBuyingPackId(null);
                    }}
                    className="flex w-full items-center justify-between rounded-xl bg-[#2A2A2A] px-4 py-3 text-left transition-colors hover:bg-[#333] disabled:opacity-50"
                  >
                    <div>
                      <p className="font-body text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="font-body text-xs text-text-secondary">{p.total_lessons} aulas</p>
                    </div>
                    <span className="font-body text-sm font-semibold text-accent">
                      {buyingPackId === p.id ? "..." : `${(p.price_cents / 100).toFixed(2).replace(".", ",")}€`}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowBuyPack(false)}
              className="w-full rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Add student modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 md:px-5">
          <div className="w-full max-w-md rounded-t-2xl md:rounded-2xl bg-surface p-6 pb-10 md:pb-6">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted md:hidden" />
            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Adicionar aluno</h3>

            <div className="space-y-4">
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
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="Ex: 912 345 678"
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
                  <div className="flex-1">
                    <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                      Aulas restantes <span className="text-text-muted">(opcional)</span>
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
                </div>
              </div>

              {addError && (
                <p className="font-body text-sm text-error">{addError}</p>
              )}

              <div className="flex gap-3 pt-2">
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
                    router.refresh();
                  }}
                  className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
                >
                  {addSaving ? "A adicionar..." : "Adicionar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
