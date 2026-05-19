"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getSessionsForMonth, createSession, updateSession, deleteSession, getSchoolStudents, createBooking, addGuestToSession, type SessionData } from "../actions";
import {
  HomeIcon,
  CalendarIcon,
  GroupIcon,
  SessionsIcon,
  DotsIcon,
  PlusIcon,
  ArrowRightIcon,
} from "@/app/dashboard/_components/icons";

type Props = {
  fullName: string;
  schoolId: string | null;
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/dashboard/calendario", label: "Calendário", icon: CalendarIcon },
  { href: "/dashboard/alunos", label: "Alunos", icon: GroupIcon },
  { href: "/dashboard/servicos", label: "Serviços", icon: SessionsIcon },
  { href: "/dashboard/mais", label: "Mais", icon: DotsIcon },
];

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type DaySession = {
  id: string;
  nome: string;
  time: string;
  capacidade: number;
  alunos: number;
  alunosList: string[];
};

const EMPTY_SESSIONS: Record<number, DaySession[]> = {};

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function CalendarioView({ schoolId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [sessions, setSessions] = useState<Record<number, DaySession[]>>(EMPTY_SESSIONS);
  const [showModal, setShowModal] = useState(false);
  const [dataAula, setDataAula] = useState("");
  const [nomeAula, setNomeAula] = useState("");
  const [horario, setHorario] = useState("");
  const [duracao, setDuracao] = useState("90");
  const [capacidade, setCapacidade] = useState("");
  const [instrutores, setInstrutores] = useState("");
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const fetchSessions = useCallback(async (y: number, m: number) => {
    if (!schoolId) return;
    setLoadingSessions(true);
    const data = await getSessionsForMonth(y, m, schoolId);
    setSessions(data);
    setLoadingSessions(false);
  }, [schoolId]);

  useEffect(() => {
    fetchSessions(year, month);
  }, [year, month, fetchSessions]);
  const [editingSession, setEditingSession] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSession, setDeletingSession] = useState<number | null>(null);
  const [addingToSession, setAddingToSession] = useState<number | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [schoolStudents, setSchoolStudents] = useState<{ id: string; name: string }[]>([]);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestSessionId, setGuestSessionId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestError, setGuestError] = useState("");

  useEffect(() => {
    if (searchParams.get("nova") === "true") {
      setShowModal(true);
    }
  }, [searchParams]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  const daySessions = selectedDay ? sessions[selectedDay] ?? [] : [];
  const eventCount = daySessions.length;
  const monthLabel = `${MONTHS[month]} ${year}`;
  return (
    <div className="h-dvh overflow-hidden bg-background text-foreground font-body flex flex-col">

      <main className="flex-1 flex flex-col overflow-y-auto px-5 pb-24 [&::-webkit-scrollbar]:hidden">

        {/* Header */}
        <div className="mt-6 mb-6">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Calendário
          </h1>
        </div>

        {/* Calendar card */}
        <div className="rounded-2xl bg-surface text-foreground h-[440px] px-5 pt-5 pb-5">

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                onClick={prevMonth}
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:text-foreground transition-colors"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="font-heading text-lg font-bold uppercase tracking-widest text-foreground">
                {monthLabel}
              </h2>
              <button
                type="button"
                onClick={nextMonth}
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:text-foreground transition-colors"
                aria-label="Mês seguinte"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-4 text-text-secondary font-body text-sm font-semibold">
              {WEEKDAYS.map((d, i) => <span key={i}>{d}</span>)}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfWeek }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                const isSelected = day === selectedDay;
                const hasEvent = sessions[day] !== undefined && sessions[day].length > 0;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      if (selectedDay === day) { setSelectedDay(null); } else { setSelectedDay(day); }
                      setExpandedSession(null);
                    }}
                    className={`relative flex flex-col items-center justify-center h-12 w-full rounded-lg transition-all duration-200 font-body text-sm font-semibold ${
                      isSelected
                        ? "bg-accent text-primary-foreground font-bold shadow-md scale-105"
                        : isToday
                          ? "text-accent font-bold"
                          : "text-foreground hover:bg-[#2A2A2A]"
                    }`}
                  >
                    <span>{day}</span>
                    {hasEvent && !isSelected && (
                      <div className="absolute bottom-1.5 h-1 w-1 rounded-full bg-accent" />
                    )}
                  </button>
                );
              })}
            </div>
        </div>

        {/* Selected day card */}
        <div className={`mt-6 rounded-2xl p-6 text-center transition-all duration-300 border ${
          eventCount > 0 ? "border-accent/50 bg-surface" : "border-transparent bg-surface"
        }`}>
          {selectedDay ? (
            <>
              <span className="font-heading text-xl font-bold text-foreground">
                {eventCount > 0
                  ? `${eventCount} ${eventCount === 1 ? "aula agendada" : "aulas agendadas"}`
                  : "Nenhuma sessão"}
              </span>
              <p className="mt-1 font-body text-sm text-text-secondary">
                {selectedDay} de {MONTHS[month]} de {year}
              </p>
              {eventCount > 0 && (
                <div className="mt-4 space-y-3 text-left">
                  {daySessions.map((s, i) => (
                    <div key={i}>
                      <div className="grid grid-cols-2 gap-4 items-stretch">
                        <button
                          type="button"
                          onClick={() => setExpandedSession(expandedSession === i ? null : i)}
                          className="rounded-xl bg-[#2A2A2A] p-4 text-left transition-colors hover:bg-[#333] active:scale-[0.98]"
                        >
                          <p className="font-body text-xs font-semibold uppercase text-text-secondary">Alunos</p>
                          <div className="mt-1 flex items-center justify-between">
                            <p className="font-heading text-2xl font-bold text-foreground">{s.alunos}</p>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 text-text-secondary transition-transform ${expandedSession === i ? "rotate-90" : ""}`}>
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </div>
                        </button>
                        <div className="rounded-xl bg-[#2A2A2A] p-4">
                          <p className="font-body text-xs font-semibold uppercase text-text-secondary">Horário</p>
                          <p className="mt-1 font-heading text-2xl font-bold text-foreground">{s.time}</p>
                        </div>
                      </div>
                      {expandedSession === i && (
                        <div className="mt-2 rounded-xl bg-[#2A2A2A] p-4">
                          <p className="font-heading text-base font-bold text-foreground mb-1">{s.nome}</p>
                          <p className="font-body text-xs font-semibold uppercase text-text-secondary mb-3">Alunos inscritos</p>
                          <div className="space-y-2">
                            {s.alunosList.map((nome) => (
                              <div key={nome} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-accent">
                                  {nome.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase()}
                                </div>
                                <span className="font-body text-sm text-foreground">{nome}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-3 border-t border-foreground/10">
                            <div className="mb-3">
                            {addingToSession === i ? (
                              <div className="space-y-3">
                                <div className="flex gap-3">
                                  <input
                                    type="text"
                                    value={studentSearch}
                                    onChange={async (e) => {
                                      setStudentSearch(e.target.value);
                                      if (!schoolStudents.length && schoolId) {
                                        const list = await getSchoolStudents(schoolId);
                                        setSchoolStudents(list);
                                      }
                                    }}
                                    placeholder="Procurar aluno..."
                                    className="min-w-0 flex-[3] rounded-lg bg-surface px-3 py-2 text-sm text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => { setAddingToSession(null); setStudentSearch(""); }}
                                    className="flex-1 rounded-lg bg-surface px-3 py-2 text-sm text-text-secondary hover:text-foreground transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                                {studentSearch.trim() && (
                                  <div className="max-h-48 overflow-y-auto space-y-1">
                                    {schoolStudents
                                      .filter((st) => st.name.toLowerCase().includes(studentSearch.toLowerCase()))
                                      .map((st) => (
                                        <button
                                          key={st.id}
                                          type="button"
                                          onClick={async () => {
                                            if (!schoolId) return;
                                            await createBooking(s.id, st.id, schoolId);
                                            setSessions((prev) => {
                                              const next = { ...prev };
                                              for (const day of Object.keys(next)) {
                                                const dayNum = Number(day);
                                                next[dayNum] = next[dayNum].map((sess) =>
                                                  sess.id === s.id
                                                    ? { ...sess, alunos: sess.alunos + 1, alunosList: [...sess.alunosList, st.name] }
                                                    : sess
                                                );
                                              }
                                              return next;
                                            });
                                            setAddingToSession(null);
                                            setStudentSearch("");
                                            fetchSessions(year, month);
                                          }}
                                          className="w-full rounded-lg bg-surface px-3 py-2 text-left text-sm text-foreground hover:bg-white/10 transition-colors"
                                        >
                                          {st.name}
                                        </button>
                                      ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!schoolId || !studentSearch.trim()) return;
                                        setGuestName(studentSearch.trim());
                                        setGuestPhone("");
                                        setGuestSessionId(s.id);
                                        setGuestError("");
                                        setShowGuestModal(true);
                                      }}
                                      className="w-full rounded-lg bg-accent/20 px-3 py-2 text-left text-sm text-accent hover:bg-accent/30 transition-colors"
                                    >
                                      + Novo convidado
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => { setAddingToSession(i); setStudentSearch(""); setSchoolStudents([]); }}
                                className="w-full rounded-lg bg-accent/20 py-2 font-body text-sm font-semibold text-accent transition-colors hover:bg-accent/30"
                              >
                                + Adicionar aluno
                              </button>
                            )}
                            </div>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSession(i);
                                  setNomeAula(s.nome);
                                  setDataAula(selectedDay ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : "");
                                  const [h, m] = s.time.split(":");
                                  setHorario(`${h.padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}`);
                                  setDuracao("90");
                                  setCapacidade(String(s.capacidade));
                                  setInstrutores("");
                                  setShowModal(true);
                                }}
                                className="flex-1 rounded-lg bg-accent/20 py-2 font-body text-sm font-semibold text-accent transition-colors hover:bg-accent/30"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => { setDeletingSession(i); setShowDeleteConfirm(true); }}
                                className="flex-1 rounded-lg bg-error/20 py-2 font-body text-sm font-semibold text-error transition-colors hover:bg-error/30"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <span className="font-body text-base text-text-secondary">
              Nenhum dia selecionado
            </span>
          )}
        </div>

      </main>

      {/* Scroll shadow */}
      <div className="pointer-events-none fixed bottom-[calc(1.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 h-16 bg-gradient-to-t from-background to-transparent" />

      {/* Bottom Navigation */}
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

      {/* FAB */}
      <button
        type="button"
        onClick={() => {
          setEditingSession(null);
          setShowModal(true);
          setDataAula(selectedDay ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : "");
          setNomeAula("");
          setHorario("");
          setDuracao("90");
          setCapacidade("");
          setInstrutores("");
        }}
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary-foreground shadow-2xl active:scale-90 transition-all duration-200"
        aria-label="Adicionar evento"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center">
            <p className="font-heading text-xl font-bold text-foreground mb-2">Eliminar aula</p>
            <p className="font-body text-sm text-text-secondary mb-6">
              Tens a certeza que queres eliminar esta aula?
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
                  if (deletingSession === null || !daySessions[deletingSession]) return;
                  await deleteSession(daySessions[deletingSession].id);
                  setShowDeleteConfirm(false);
                  setDeletingSession(null);
                  fetchSessions(year, month);
                }}
                className="flex-1 rounded-xl bg-error py-3 font-body text-sm font-semibold text-error-foreground transition-transform active:scale-95"
              >
                Sim, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-10">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />

            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">
              Novo convidado
            </h3>

            <div className="space-y-4">
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Nome <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
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
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="Ex: 912 345 678"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>

              {guestError && (
                <p className="font-body text-sm text-error">{guestError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGuestModal(false)}
                  className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!schoolId || !guestName.trim()) return;
                    setGuestError("");
                    const res = await addGuestToSession(guestName.trim(), guestPhone.trim() || undefined, guestSessionId, schoolId);
                    if (!res.ok) { setGuestError(res.error ?? "Erro ao adicionar convidado"); return; }
                    setShowGuestModal(false);
                    setStudentSearch(guestName);
                    // update local session count immediately
                    setSessions((prev) => {
                      const next = { ...prev };
                      for (const day of Object.keys(next)) {
                        const dayNum = Number(day);
                        next[dayNum] = next[dayNum].map((sess) =>
                          sess.id === guestSessionId
                            ? { ...sess, alunos: sess.alunos + 1, alunosList: [...sess.alunosList, guestName] }
                            : sess
                        );
                      }
                      return next;
                    });
                    if (schoolId) {
                      const list = await getSchoolStudents(schoolId);
                      setSchoolStudents(list);
                    }
                    fetchSessions(year, month);
                  }}
                  className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-10">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />

            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">
              {editingSession !== null ? "Editar aula" : "Nova aula"}
            </h3>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Nome da aula <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={nomeAula}
                  onChange={(e) => setNomeAula(e.target.value)}
                  placeholder="Ex: Aula iniciantes"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                  required
                />
              </div>

              {/* Data */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Dia <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  value={dataAula}
                  onChange={(e) => setDataAula(e.target.value)}
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert-[0.7] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  required
                />
              </div>

              {/* Horário início */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Horário de início <span className="text-error">*</span>
                </label>
                <input
                  type="time"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert-[0.7] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  required
                />
              </div>

              {/* Duração */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Duração <span className="text-text-muted">(minutos)</span> <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  value={duracao}
                  onChange={(e) => setDuracao(e.target.value)}
                  placeholder="Ex: 90"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                  required
                />
              </div>

              {/* Capacidade máxima */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Capacidade máxima <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={capacidade}
                  onChange={(e) => setCapacidade(e.target.value)}
                  placeholder="Ex: 8"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                  required
                />
              </div>

              {/* Instrutores (opcional) */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Instrutor(es) <span className="text-text-muted">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={instrutores}
                  onChange={(e) => setInstrutores(e.target.value)}
                  placeholder="Ex: João, Maria"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!horario || !duracao || !capacidade || !nomeAula || !dataAula || !schoolId) {
                      return;
                    }
                    const payload = {
                      nome: nomeAula,
                      data: dataAula,
                      horario,
                      duracao: Number(duracao),
                      capacidade: Number(capacidade),
                      schoolId,
                    };
                    const res = editingSession !== null
                      ? await updateSession(daySessions[editingSession].id, payload)
                      : await createSession(payload);
                    if (res.ok) {
                      setShowModal(false);
                      fetchSessions(year, month);
                    }
                  }}
                  className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
                >
                  {editingSession !== null ? "Guardar" : "Criar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
