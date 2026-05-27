"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  getSessionsForMonth,
  createSession,
  updateSession,
  deleteSession,
  cancelSession,
  completeSession,
  getSchoolStudents,
  createBooking,
  addGuestToSession,
  addGroupBooking,
  getAvulsoServicos,
  getStudentProfile,
  togglePaymentStatus,
  getInstructorsForSchool,
  type SessionData,
  type AvulsoServico,
  type StudentProfile,
  type StudentProfilePack,
} from "../actions";
import {
  PlusIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/app/dashboard/_components/icons";
import { WEEKDAYS, MONTHS } from "@/app/dashboard/_components/constants";

type Props = {
  fullName: string;
  schoolId: string | null;
};

type AlunoInscrito = { id: string; name: string; paymentStatus: string };

type DaySession = {
  id: string;
  nome: string;
  time: string;
  capacidade: number;
  alunos: number;
  alunosList: AlunoInscrito[];
  class_type_id: string | null;
  instructor_id: string | null;
  instructorName: string | null;
  starts_at: string;
};

const EMPTY_SESSIONS: Record<number, DaySession[]> = {};

export function CalendarioView({ schoolId }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [sessions, setSessions] = useState<Record<number, DaySession[]>>(EMPTY_SESSIONS);
  const [showModal, setShowModal] = useState(false);
  const [dataAula, setDataAula] = useState("");
  const [horario, setHorario] = useState("");
  const [duracao, setDuracao] = useState("90");
  const [capacidade, setCapacidade] = useState("");
  const [instrutoresList, setInstrutoresList] = useState<{ id: string; name: string }[]>([]);
  const [instrutorSelecionadoId, setInstrutorSelecionadoId] = useState<string>("");
  const [servicos, setServicos] = useState<AvulsoServico[]>([]);
  const [selectedServicoId, setSelectedServicoId] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [profileStudent, setProfileStudent] = useState<StudentProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const fetchSessions = useCallback(
    async (y: number, m: number) => {
      if (!schoolId) return;
      setLoadingSessions(true);
      const data = await getSessionsForMonth(y, m, schoolId);
      setSessions(data);
      setLoadingSessions(false);
    },
    [schoolId]
  );

  useEffect(() => {
    fetchSessions(year, month);
  }, [year, month, fetchSessions]);

  const fetchServicos = useCallback(async () => {
    if (!schoolId) return;
    const data = await getAvulsoServicos(schoolId);
    setServicos(data);
  }, [schoolId]);

  const fetchInstrutores = useCallback(async () => {
    if (!schoolId) return;
    const data = await getInstructorsForSchool(schoolId);
    setInstrutoresList(data);
  }, [schoolId]);

  const [editingSession, setEditingSession] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSession, setDeletingSession] = useState<number | null>(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [completingSession, setCompletingSession] = useState<number | null>(null);
  const [completingSaving, setCompletingSaving] = useState(false);
  const [addingToSession, setAddingToSession] = useState<number | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [schoolStudents, setSchoolStudents] = useState<{ id: string; name: string }[]>([]);
  const [pendingPackStudent, setPendingPackStudent] = useState<{
    sessionId: string;
    studentId: string;
    studentName: string;
  } | null>(null);
  const [studentPacksForBooking, setStudentPacksForBooking] = useState<StudentProfilePack[]>([]);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestSessionId, setGuestSessionId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestError, setGuestError] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupSessionId, setGroupSessionId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupPeople, setGroupPeople] = useState("2");
  const [groupError, setGroupError] = useState("");

  useEffect(() => {
    if (searchParams.get("nova") === "true") {
      setShowModal(true);
    }
  }, [searchParams]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
    setSelectedDay(null);
  }

  const daySessions = selectedDay ? sessions[selectedDay] ?? [] : [];
  const eventCount = daySessions.length;
  const monthLabel = `${MONTHS[month]} ${year}`;
  const showSidebar = selectedDay !== null;

  return (
    <>
      <div className="relative" style={{ maxWidth: "800px" }}>
        <main
          className="px-5 pt-4 flex flex-col gap-3 md:overflow-hidden md:h-[95vh]"
        >
          {/* Title + Month nav */}
          <div className="flex flex-col md:flex-row md:items-start gap-0 mt-4 shrink-0">

            <h1 className="max-md:hidden font-heading text-2xl xl:text-3xl font-bold text-foreground shrink-0">
              Calendário
            </h1>
            <div className="flex items-center gap-1.5 self-center md:self-auto md:ml-6 md:mt-[6px] mt-4">
              <button
                type="button"
                onClick={prevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-text-secondary hover:text-foreground hover:bg-surface transition-colors"
                aria-label="Mês anterior"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <h2 className="font-heading text-base xl:text-lg font-bold uppercase tracking-widest text-foreground min-w-[140px] text-center">
                {monthLabel}
              </h2>
              <button
                type="button"
                onClick={nextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-text-secondary hover:text-foreground hover:bg-surface transition-colors"
                aria-label="Mês seguinte"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              {loadingSessions && (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              )}
            </div>
          </div>

          {/* Calendar + Sidebar in same flex row */}
          <div className="flex flex-1 overflow-hidden min-h-0 gap-6">
            {/* Calendar column */}
            <div className="flex flex-col flex-1 overflow-hidden min-h-0 relative">
              <div className="rounded-xl bg-surface border border-white/5 flex flex-col overflow-hidden flex-1 min-h-0">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 border-b border-white/5 bg-[#2A2A2A] shrink-0">
                  {WEEKDAYS.map((d, i) => (
                    <div
                      key={i}
                      className="py-1.5 text-center font-body text-[10px] font-semibold uppercase tracking-wider text-text-secondary border-r border-white/5 last:border-r-0"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 max-md:overflow-visible md:flex-1 md:overflow-y-auto [&::-webkit-scrollbar]:hidden">
                  {Array.from({ length: firstDayOfWeek }, (_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="border-b border-r border-white/5"
                    />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const isToday =
                      day === now.getDate() &&
                      month === now.getMonth() &&
                      year === now.getFullYear();
                    const isSelected = day === selectedDay;
                    const daySessionsForCell = sessions[day] ?? [];

                    const totalCap = daySessionsForCell.reduce(
                      (acc, s) => acc + s.capacidade,
                      0
                    );
                    const totalAlunos = daySessionsForCell.reduce(
                      (acc, s) => acc + s.alunos,
                      0
                    );
                    const occPct =
                      totalCap > 0
                        ? Math.round((totalAlunos / totalCap) * 100)
                        : 0;

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (selectedDay === day) {
                            setSelectedDay(null);
                          } else {
                            setSelectedDay(day);
                          }
                          setExpandedSession(null);
                        }}
                        className={`flex flex-col items-center gap-px p-1 border-b border-r border-white/5 transition-colors hover:bg-[#2A2A2A]/80 min-h-[48px] xl:min-h-[56px] ${
                          isSelected
                            ? "bg-accent/10 ring-1 ring-inset ring-accent"
                            : ""
                        }`}
                      >
                        <span
                          className={`font-body text-xs font-semibold leading-none ${
                            isSelected
                              ? "text-accent"
                              : isToday
                                ? "text-accent"
                                : "text-text-secondary"
                          }`}
                        >
                          {day}
                        </span>
                        {daySessionsForCell.length > 0 && (
                          <div className="flex flex-col gap-px w-full mt-1.5">
                            <div className="h-0.5 w-full rounded-full bg-[#2A2A2A] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-accent transition-all"
                                style={{ width: `${occPct}%` }}
                              />
                            </div>
                            {daySessionsForCell.slice(0, 2).map((sess, si) => (
                              <span
                                key={si}
                                className="font-body text-[9px] leading-none text-text-secondary truncate text-left"
                              >
                                {sess.time} {sess.nome}
                              </span>
                            ))}
                            {daySessionsForCell.length > 2 && (
                              <span className="font-body text-[9px] leading-none text-text-muted text-left">
                                +{daySessionsForCell.length - 2} mais
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Mobile: session card */}
        {showSidebar && (
          <div className="md:hidden mx-5 bg-surface border border-white/5 rounded-xl flex flex-col overflow-hidden max-h-[40vh] mt-6">
                  <div className="p-3 border-b border-white/5 shrink-0">
                    <h3 className="font-heading text-sm font-bold text-foreground">
                      {eventCount > 0 ? `${eventCount} ${eventCount === 1 ? "sessão" : "sessões"}` : "Nenhuma sessão"}
                    </h3>
                    <p className="font-body text-xs text-text-secondary">
                      {selectedDay} de {MONTHS[month]} de {year}
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[30vh]">
                    {daySessions.length > 0 ? (
                      daySessions.map((session, si) => {
                        const isExpanded = expandedSession === si;
                        return (
                          <div key={si}>
                            <button
                              type="button"
                              onClick={() => setExpandedSession(isExpanded ? null : si)}
                              className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-[#2A2A2A]/80"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20">
                                  <span className="font-body text-xs font-bold text-accent">{session.alunos}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="font-body text-xs font-semibold text-foreground truncate">{session.nome}</p>
                                  <p className="font-body text-[10px] text-text-secondary">
                                    {session.time}{session.capacidade > 0 && <> · {session.alunos}/{session.capacidade}</>}
                                  </p>
                                </div>
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="px-3 pb-3 space-y-2">
                                {session.alunosList.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {session.alunosList.map((aluno, ai) => (
                                      <span key={ai} className="inline-flex items-center gap-1 rounded-full bg-[#2A2A2A] px-2 py-0.5 font-body text-[10px] text-text-secondary">
                                        {aluno.name}
                                        {aluno.paymentStatus === "paid_offline" ? (
                                          <svg className="h-2.5 w-2.5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                        ) : aluno.paymentStatus === "unpaid" ? (
                                          <svg className="h-2.5 w-2.5 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                        ) : null}
                                      </span>
                                    ))}
                                    {session.alunos < session.capacidade && (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setGuestSessionId(session.id); setShowGuestModal(true); }}
                                        className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 font-body text-[10px] text-accent transition-colors hover:bg-accent/20"
                                      >
                                        + Aluno
                                      </button>
                                    )}
                                  </div>
                                )}
                                {session.instructorName && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-body text-[10px] text-text-muted">Instrutor:</span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#2A2A2A] px-2 py-0.5 font-body text-[10px] text-text-secondary">{session.instructorName}</span>
                                  </div>
                                )}
                                {(() => {
                                  const isPast = new Date(session.starts_at) < new Date();
                                  if (isPast) {
                                    return (
                                      <div className="flex gap-2 pt-1">
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); setCompletingSession(si); setShowCompleteConfirm(true) }}
                                          className="flex-1 rounded-lg bg-success/20 py-1.5 font-body text-[10px] font-semibold text-success transition-colors hover:bg-success/30"
                                        >
                                          Realizada
                                      </button>
                                      {session.alunos > 0 && (
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); setCompletingSession(si); setShowCompleteConfirm(true); }}
                                          className="rounded-lg bg-success/10 px-3 py-1.5 font-body text-[10px] font-semibold text-success transition-colors hover:bg-success/20"
                                        >
                                          Concluir
                                        </button>
                                      )}
                                      <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); setDeletingSession(si); setShowDeleteConfirm(true) }}
                                          className="flex-1 rounded-lg bg-error/20 py-1.5 font-body text-[10px] font-semibold text-error transition-colors hover:bg-error/30"
                                        >
                                          Cancelada
                                        </button>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingSession(si);
                                          setDataAula(`${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`);
                                          const [h, m] = session.time.split(":");
                                          setHorario(`${h.padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}`);
                                          setSelectedServicoId(session.class_type_id ?? "");
                                          const svc = servicos.find((sv) => sv.id === session.class_type_id);
                                          setDuracao(svc?.default_duration_minutes ? String(svc.default_duration_minutes) : "90");
                                          setCapacidade(String(session.capacidade));
                                          setInstrutorSelecionadoId(session.instructor_id ?? "");
                                          setShowModal(true);
                                          fetchServicos();
                                          fetchInstrutores();
                                        }}
                                        className="rounded-lg bg-[#2A2A2A] px-3 py-1.5 font-body text-[10px] font-semibold text-text-secondary transition-colors hover:bg-[#333]"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setGuestSessionId(session.id); setShowGuestModal(true); }}
                                        className="rounded-lg bg-accent/10 px-3 py-1.5 font-body text-[10px] font-semibold text-accent transition-colors hover:bg-accent/20"
                                      >
                                        + Convidado
                                      </button>
                                      <button
                                        type="button"
                                          onClick={(e) => { e.stopPropagation(); setShowGroupModal(true); setGroupSessionId(session.id); }}
                                        className="rounded-lg bg-accent/10 px-3 py-1.5 font-body text-[10px] font-semibold text-accent transition-colors hover:bg-accent/20"
                                      >
                                        + Grupo
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setDeletingSession(si); setShowDeleteConfirm(true) }}
                                        className="rounded-lg bg-error/10 px-3 py-1.5 font-body text-[10px] font-semibold text-error transition-colors hover:bg-error/20"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center px-3 py-6">
                        <p className="font-body text-xs text-text-muted text-center mb-3">Nenhuma sessão agendada para este dia.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

        {/* Sessions sidebar — same height as calendar */}
        {showSidebar && (
          <div className="max-md:hidden absolute left-[calc(100%+24px)] top-0 bottom-0 w-[380px] flex flex-col overflow-hidden xl:z-10 pt-20">
            <div className="rounded-2xl bg-surface border border-white/5 flex flex-col overflow-hidden flex-1 min-h-0">
              <div className="p-4 border-b border-white/5 shrink-0">
                <h3 className="font-heading text-lg font-bold text-foreground">
                  {eventCount > 0
                    ? `${eventCount} ${eventCount === 1 ? "sessão" : "sessões"}`
                    : "Nenhuma sessão"}
                </h3>
                <p className="font-body text-sm text-text-secondary">
                  {selectedDay} de {MONTHS[month]} de {year}
                </p>
              </div>
              {eventCount > 0 ? (
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                  {daySessions.map((session, si) => {
                    const isExpanded = expandedSession === si;
                    return (
                      <div key={session.id} className="border-b border-white/5 last:border-b-0">
                        <button
                          type="button"
                          onClick={() => setExpandedSession(isExpanded ? null : si)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#2A2A2A]/80"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20">
                              <span className="font-body text-sm font-bold text-accent">{session.alunos}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-body text-sm font-semibold text-foreground truncate">{session.nome}</p>
                              <p className="font-body text-xs text-text-secondary">
                                {session.time}
                                {session.capacidade > 0 && <> &middot; {session.alunos}/{session.capacidade}</>}
                              </p>
                            </div>
                          </div>
                          <ChevronRightIcon className={`h-4 w-4 shrink-0 text-text-secondary transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-3">
                            {session.alunosList.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {session.alunosList.map((aluno, ai) => (
                                  <span key={ai} className="inline-flex items-center gap-1 rounded-full bg-[#2A2A2A] px-2.5 py-1 font-body text-xs text-text-secondary">
                                    {aluno.name}
                                    {aluno.paymentStatus === "paid_offline" && (
                                      <svg className="h-3 w-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                    {aluno.paymentStatus === "unpaid" && (
                                      <svg className="h-3 w-3 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    )}
                                  </span>
                                ))}
                                {session.alunos < session.capacidade && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setGuestSessionId(session.id); setShowGuestModal(true); }}
                                    className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 font-body text-xs text-accent transition-colors hover:bg-accent/20"
                                  >
                                    <PlusIcon className="h-3 w-3" /> Aluno
                                  </button>
                                )}
                              </div>
                            )}

                            {session.instructorName && (
                              <div className="flex items-center gap-2">
                                <span className="font-body text-xs text-text-muted">Instrutor:</span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#2A2A2A] px-2.5 py-1 font-body text-xs text-text-secondary">{session.instructorName}</span>
                              </div>
                            )}

                            {session.capacidade > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-body text-xs text-text-muted">Ocupação</span>
                                  <span className="font-body text-xs text-text-muted">{Math.round((session.alunos / session.capacidade) * 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-[#2A2A2A] overflow-hidden">
                                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.round((session.alunos / session.capacidade) * 100)}%` }} />
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 pt-1">
                              {(() => {
                                const isPast = new Date(session.starts_at) < new Date();
                                if (isPast) {
                                  return (
                                    <>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setCompletingSession(si); setShowCompleteConfirm(true) }}
                                        className="flex-1 rounded-lg bg-success/20 py-2 font-body text-xs font-semibold text-success transition-colors hover:bg-success/30"
                                      >
                                        Realizada
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setDeletingSession(si); setShowDeleteConfirm(true) }}
                                        className="flex-1 rounded-lg bg-error/20 py-2 font-body text-xs font-semibold text-error transition-colors hover:bg-error/30"
                                      >
                                        Cancelada
                                      </button>
                                    </>
                                  );
                                }
                                return (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingSession(si);
                                        setDataAula(`${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`);
                                        const [h, m] = session.time.split(":");
                                        setHorario(`${h.padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}`);
                                        setSelectedServicoId(session.class_type_id ?? "");
                                        const svc = servicos.find((sv) => sv.id === session.class_type_id);
                                        setDuracao(svc?.default_duration_minutes ? String(svc.default_duration_minutes) : "90");
                                        setCapacidade(String(session.capacidade));
                                        setInstrutorSelecionadoId(session.instructor_id ?? "");
                                        setShowModal(true);
                                        fetchServicos();
                                        fetchInstrutores();
                                      }}
                                      className="flex-1 rounded-lg bg-[#2A2A2A] py-2 font-body text-xs font-semibold text-text-secondary transition-colors hover:bg-[#333]"
                                    >
                                      Editar
                                    </button>
                                    {daySessions.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setDeletingSession(si); setShowDeleteConfirm(true) }}
                                        className="flex-1 rounded-lg bg-error/10 py-2 font-body text-xs font-semibold text-error transition-colors hover:bg-error/20"
                                      >
                                        Cancelar
                                      </button>
                                    )}
                                    {daySessions.length > 0 && session.alunos > 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setCompletingSession(si); setShowCompleteConfirm(true) }}
                                        className="flex-1 rounded-lg bg-success/10 py-2 font-body text-xs font-semibold text-success transition-colors hover:bg-success/20"
                                      >
                                        Concluir
                                      </button>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
                  <p className="font-body text-sm text-text-muted text-center mb-4">Nenhuma sessão agendada para este dia.</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const hoje = new Date();
                      const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
                      const selStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
                      setEditingSession(null);
                      setShowModal(true);
                      setDataAula(selStr < hojeStr ? hojeStr : selStr);
                      setSelectedServicoId("");
                      setHorario("");
                      setDuracao("90");
                      setSelectedServicoId("");
                      setCapacidade("");
                      setInstrutorSelecionadoId("");
                      fetchServicos();
                      fetchInstrutores();
                    }}
                    className="mt-3 rounded-lg bg-accent/20 px-4 py-2 font-body text-xs font-semibold text-accent transition-colors hover:bg-accent/30"
                  >
                    + Criar aula
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => {
          setEditingSession(null);
          const hoje = new Date();
          const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
          const selStr = selectedDay
            ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
            : "";
          setShowModal(true);
          setDataAula(selStr && selStr < hojeStr ? hojeStr : selStr);
          setSelectedServicoId("");
          setHorario("");
          setDuracao("90");
          setCapacidade("");
          setInstrutorSelecionadoId("");
          fetchServicos();
          fetchInstrutores();
        }}
        className="fixed bottom-24 md:bottom-12 right-6 md:right-12 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary-foreground shadow-2xl active:scale-90 transition-all duration-200"
        aria-label="Adicionar evento"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      {/* Cancel confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center">
            <p className="font-heading text-xl font-bold text-foreground mb-2">
              Cancelar aula
            </p>
            <p className="font-body text-sm text-text-secondary mb-6">
              Esta aula será removida e todos os alunos inscritos receberão um
              email de notificação.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (
                    deletingSession === null ||
                    !daySessions[deletingSession]
                  )
                    return;
                  await cancelSession(daySessions[deletingSession].id);
                  setShowDeleteConfirm(false);
                  setDeletingSession(null);
                  fetchSessions(year, month);
                }}
                className="flex-1 rounded-xl bg-error py-3 font-body text-sm font-semibold text-error-foreground transition-transform active:scale-95"
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete confirmation */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center">
            <p className="font-heading text-xl font-bold text-foreground mb-2">
              Marcar como realizada
            </p>
            <p className="font-body text-sm text-text-secondary mb-6">
              Alunos com pagamento pendente serão marcados como pagos, créditos
              de pack serão descontados e a sessão será fechada.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCompleteConfirm(false)}
                className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={completingSaving}
                onClick={async () => {
                  if (
                    completingSession === null ||
                    !daySessions[completingSession]
                  )
                    return;
                  setCompletingSaving(true);
                  await completeSession(daySessions[completingSession].id);
                  setShowCompleteConfirm(false);
                  setCompletingSession(null);
                  setCompletingSaving(false);
                  fetchSessions(year, month);
                }}
                className="flex-1 rounded-xl bg-success py-3 font-body text-sm font-semibold text-foreground transition-transform active:scale-95 disabled:opacity-50"
              >
                {completingSaving ? "A processar..." : "Sim, realizar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-24">
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
                  Telemóvel{" "}
                  <span className="text-text-muted">(opcional)</span>
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
                    const res = await addGuestToSession(
                      guestName.trim(),
                      guestPhone.trim() || undefined,
                      guestSessionId,
                      schoolId
                    );
                    if (!res.ok) {
                      setGuestError(
                        res.error ?? "Erro ao adicionar convidado"
                      );
                      return;
                    }
                    setShowGuestModal(false);
                    setStudentSearch(guestName);
                    setSessions((prev) => {
                      const next = { ...prev };
                      for (const day of Object.keys(next)) {
                        const dayNum = Number(day);
                        next[dayNum] = next[dayNum].map((sess) =>
                          sess.id === guestSessionId
                            ? {
                                ...sess,
                                alunos: sess.alunos + 1,
                                alunosList: [
                                  ...sess.alunosList,
                                  {
                                    id: res.studentId!,
                                    name: res.studentName!,
                                    paymentStatus: "unpaid",
                                  },
                                ],
                              }
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

      {/* Group modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-24">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />

            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">
              Adicionar grupo
            </h3>

            <div className="space-y-4">
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Nome do responsável <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>

              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Número de pessoas <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={groupPeople}
                  onChange={(e) => setGroupPeople(e.target.value)}
                  placeholder="Ex: 5"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>

              {groupError && (
                <p className="font-body text-sm text-error">{groupError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!schoolId || !groupName.trim()) return;
                    const num = parseInt(groupPeople, 10);
                    if (isNaN(num) || num < 2) {
                      setGroupError("O número mínimo de pessoas é 2");
                      return;
                    }
                    setGroupError("");
                    const res = await addGroupBooking(
                      groupSessionId,
                      groupName.trim(),
                      num,
                      schoolId
                    );
                    if (!res.ok) {
                      setGroupError(
                        res.error ?? "Erro ao adicionar grupo"
                      );
                      return;
                    }
                    setShowGroupModal(false);
                    setSessions((prev) => {
                      const next = { ...prev };
                      for (const day of Object.keys(next)) {
                        const dayNum = Number(day);
                        next[dayNum] = next[dayNum].map((sess) =>
                          sess.id === groupSessionId
                            ? {
                                ...sess,
                                alunos: sess.alunos + num,
                                alunosList: [
                                  ...sess.alunosList,
                                  ...(res.students ?? []),
                                ],
                              }
                            : sess
                        );
                      }
                      return next;
                    });
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

      {/* Modal — Create / Edit session */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-24">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />

            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">
              {editingSession !== null ? "Editar aula" : "Nova aula"}
            </h3>

            <div className="space-y-4">
              {/* Serviço */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Serviço <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedServicoId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__add__") {
                        router.push("/dashboard/servicos");
                        return;
                      }
                      setSelectedServicoId(val);
                      setFormErrors((prev) => ({ ...prev, servico: "" }));
                      const svc = servicos.find((s) => s.id === val);
                      if (svc?.default_duration_minutes) {
                        setDuracao(String(svc.default_duration_minutes));
                      }
                    }}
                    className="w-full appearance-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent"
                    required
                  >
                    <option value="">Selecionar serviço</option>
                    {servicos.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                    <option disabled>──────────</option>
                    <option value="__add__">+ Adicionar novo serviço</option>
                  </select>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
                {formErrors.servico && (
                  <p className="mt-1 font-body text-sm text-error">
                    {formErrors.servico}
                  </p>
                )}
              </div>

              {/* Data */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Dia <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  value={dataAula}
                  onChange={(e) => {
                    setDataAula(e.target.value);
                    setFormErrors((prev) => ({ ...prev, data: "" }));
                  }}
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert-[0.7] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  required
                />
                {formErrors.data && (
                  <p className="mt-1 font-body text-sm text-error">
                    {formErrors.data}
                  </p>
                )}
              </div>

              {/* Horário início */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Horário de início <span className="text-error">*</span>
                </label>
                <input
                  type="time"
                  value={horario}
                  onChange={(e) => {
                    setHorario(e.target.value);
                    setFormErrors((prev) => ({ ...prev, horario: "" }));
                  }}
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert-[0.7] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  required
                />
                {formErrors.horario && (
                  <p className="mt-1 font-body text-sm text-error">
                    {formErrors.horario}
                  </p>
                )}
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
                  onChange={(e) => {
                    setCapacidade(e.target.value);
                    setFormErrors((prev) => ({ ...prev, capacidade: "" }));
                  }}
                  placeholder="Ex: 8"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                  required
                />
                {formErrors.capacidade && (
                  <p className="mt-1 font-body text-sm text-error">
                    {formErrors.capacidade}
                  </p>
                )}
              </div>

              {/* Instrutor (opcional) */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Instrutor{" "}
                  <span className="text-text-muted">(opcional)</span>
                </label>
                <div className="relative">
                  <select
                    value={instrutorSelecionadoId}
                    onChange={(e) =>
                      setInstrutorSelecionadoId(e.target.value)
                    }
                    className="w-full appearance-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent"
                  >
                    <option value="">Sem instrutor</option>
                    {instrutoresList.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name}
                      </option>
                    ))}
                  </select>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
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
                    const errors: Record<string, string> = {};
                    if (!selectedServicoId)
                      errors.servico = "Seleciona um serviço";
                    if (!dataAula) errors.data = "Seleciona a data";
                    if (!horario) errors.horario = "Define o horário";
                    if (!capacidade || Number(capacidade) < 1)
                      errors.capacidade =
                        "A capacidade deve ser pelo menos 1";
                    if (editingSession === null && dataAula) {
                      const hoje = new Date();
                      const dataLimite = new Date(
                        Date.UTC(
                          hoje.getFullYear(),
                          hoje.getMonth(),
                          hoje.getDate()
                        )
                      );
                      const dataEscolhida = new Date(
                        dataAula + "T00:00:00Z"
                      );
                      if (dataEscolhida < dataLimite)
                        errors.data =
                          "Não é possível criar aulas em dias anteriores ao dia de hoje";
                    }
                    setFormErrors(errors);
                    if (Object.keys(errors).length > 0) return;

                    const payload = {
                      class_type_id: selectedServicoId,
                      instructor_id: instrutorSelecionadoId || null,
                      data: dataAula,
                      horario,
                      duracao: Number(duracao),
                      capacidade: Number(capacidade),
                      schoolId: schoolId!,
                    };
                    const res =
                      editingSession !== null
                        ? await updateSession(
                            daySessions[editingSession].id,
                            payload
                          )
                        : await createSession(payload);
                    if (res.ok) {
                      setShowModal(false);
                      setFormErrors({});
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

      {/* Student profile popup */}
      {profileStudent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="flex max-h-[70vh] w-full max-w-md flex-col rounded-t-2xl bg-surface">
            <div className="mx-auto mt-6 mb-2 h-1 w-10 shrink-0 rounded-full bg-text-muted" />
            <div className="overflow-y-auto px-6 pb-24 [&::-webkit-scrollbar]:hidden">
              {loadingProfile ? (
                <div className="flex items-center justify-center py-12">
                  <p className="font-body text-sm text-text-muted">
                    A carregar...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-background text-xl font-bold text-accent">
                      {profileStudent.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-bold text-foreground">
                        {profileStudent.name}
                      </h3>
                      <p className="font-body text-sm text-text-secondary">
                        {profileStudent.isGuest ? "Convidado" : "Registado"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {profileStudent.email && (
                      <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                        <p className="font-body text-xs text-text-secondary">
                          Email
                        </p>
                        <p className="font-body text-sm text-foreground">
                          {profileStudent.email}
                        </p>
                      </div>
                    )}
                    {profileStudent.phone && (
                      <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                        <p className="font-body text-xs text-text-secondary">
                          Telemóvel
                        </p>
                        <p className="font-body text-sm text-foreground">
                          {profileStudent.phone}
                        </p>
                      </div>
                    )}
                    <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                      <p className="font-body text-xs text-text-secondary">
                        {profileStudent.classLabel ?? "Aulas"}
                      </p>
                      <p className="font-body text-sm text-foreground">
                        {profileStudent.classDate ?? "Nenhuma"}
                      </p>
                    </div>
                    {!profileStudent.isGuest && (
                      <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                        <p className="font-body text-xs text-text-secondary mb-2">
                          Packs
                        </p>
                        {profileStudent.packs.length === 0 ? (
                          <p className="font-body text-sm text-text-muted">
                            Não tem packs ativos
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {profileStudent.packs.map((p, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between"
                              >
                                <span className="font-body text-sm text-foreground">
                                  {p.name}
                                </span>
                                <span className="font-body text-xs text-text-secondary">
                                  {p.remaining} restantes
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setProfileStudent(null)}
                    className="mt-5 mb-4 w-full rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
                  >
                    Fechar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pack choice modal */}
      {pendingPackStudent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-24">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />
            <h3 className="font-heading text-lg font-bold text-foreground mb-1">
              Método de pagamento
            </h3>
            <p className="font-body text-sm text-text-secondary mb-4">
              {pendingPackStudent.studentName}
            </p>

            <button
              type="button"
              onClick={async () => {
                if (!schoolId) return;
                const { sessionId, studentId, studentName } =
                  pendingPackStudent;
                await createBooking(sessionId, studentId, schoolId);
                setSessions((prev) => {
                  const next = { ...prev };
                  for (const day of Object.keys(next)) {
                    const dayNum = Number(day);
                    next[dayNum] = next[dayNum].map((sess) =>
                      sess.id === sessionId
                        ? {
                            ...sess,
                            alunos: sess.alunos + 1,
                            alunosList: [
                              ...sess.alunosList,
                              {
                                id: studentId,
                                name: studentName,
                                paymentStatus: "unpaid",
                              },
                            ],
                          }
                        : sess
                    );
                  }
                  return next;
                });
                setPendingPackStudent(null);
                setAddingToSession(null);
                setStudentSearch("");
                fetchSessions(year, month);
              }}
              className="w-full rounded-xl bg-surface py-3 font-body text-sm font-semibold text-foreground transition-colors hover:bg-[#2A2A2A] mb-2"
            >
              Pagamento único
            </button>

            {studentPacksForBooking.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={async () => {
                  if (!schoolId) return;
                  const { sessionId, studentId, studentName } =
                    pendingPackStudent;
                  await createBooking(sessionId, studentId, schoolId, {
                    paymentMethod: "pack",
                    packPurchaseId: p.id,
                  });
                  setSessions((prev) => {
                    const next = { ...prev };
                    for (const day of Object.keys(next)) {
                      const dayNum = Number(day);
                      next[dayNum] = next[dayNum].map((sess) =>
                        sess.id === sessionId
                          ? {
                              ...sess,
                              alunos: sess.alunos + 1,
                              alunosList: [
                                ...sess.alunosList,
                                {
                                  id: studentId,
                                  name: studentName,
                                  paymentStatus: "unpaid",
                                },
                              ],
                            }
                          : sess
                      );
                    }
                    return next;
                  });
                  setPendingPackStudent(null);
                  setAddingToSession(null);
                  setStudentSearch("");
                  fetchSessions(year, month);
                }}
                className="w-full rounded-xl bg-accent/20 py-3 font-body text-sm font-semibold text-accent transition-colors hover:bg-accent/30 mb-2"
              >
                Usar pack — {p.name} ({p.remaining}{" "}
                {p.remaining === 1 ? "restante" : "restantes"})
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setPendingPackStudent(null);
              }}
              className="w-full rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}