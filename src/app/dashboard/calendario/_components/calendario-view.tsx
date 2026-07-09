"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getSessionsForRange,
  createSession,
  updateSession,
  updateSessionDate,
  cancelSession,
  closeSession,
  markAttendance,
  createBooking,
  addGuestToSession,
  addGroupBooking,
  getAvulsoServicos,
  cancelBooking,
  cancelBookingsBulk,
  getInstructorsForSchool,
  type AvulsoServico,
  type StudentProfilePack,
} from "../actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
} from "@/app/dashboard/_components/icons";
import { WEEKDAYS_MON, MONTHS } from "@/app/dashboard/_components/constants";

type Props = {
  schoolId: string | null;
};

type AlunoInscrito = { id: string; bookingId: string; name: string; paymentStatus: string; attendanceStatus: "confirmed" | "attended" | "no_show"; groupSize?: number };

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

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekLabel(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  const sameYear = weekStart.getFullYear() === end.getFullYear();
  if (sameMonth && sameYear) {
    return `${weekStart.getDate()} a ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
  } else if (sameYear) {
    return `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} a ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
  }
  return `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()} a ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function updateSessionsAddStudent(
  sessions: Record<string, DaySession[]>,
  sessionId: string,
  studentId: string,
  studentName: string,
  groupSize?: number,
): Record<string, DaySession[]> {
  const next: Record<string, DaySession[]> = {};
  const addCount = groupSize ?? 1;
  for (const dateKey of Object.keys(sessions)) {
    next[dateKey] = sessions[dateKey].map((sess) =>
      sess.id === sessionId
        ? {
            ...sess,
            alunos: sess.alunos + addCount,
            alunosList: [
              ...sess.alunosList,
              { id: studentId, bookingId: "", name: studentName, paymentStatus: "unpaid", attendanceStatus: "confirmed", groupSize },
            ],
          }
        : sess,
    );
  }
  return next;
}

export function CalendarioView({ schoolId }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(now);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<Record<string, DaySession[]>>({});
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dpYear, setDpYear] = useState(now.getFullYear());
  const [dpMonth, setDpMonth] = useState(now.getMonth());

  const weekStart = getWeekStart(currentDate);
  const weekDays = getWeekDays(weekStart);
  const weekLabel = getWeekLabel(weekStart);
  const selectedDayStr = selectedDay ? dateToStr(selectedDay) : null;
  const daySessions = selectedDayStr ? sessions[selectedDayStr] ?? [] : [];
  const eventCount = daySessions.length;
  const showSidebar = selectedDay !== null;

  const fetchSessions = useCallback(
    async (date: Date) => {
      if (!schoolId) return;
      setLoadingSessions(true);
      const ws = getWeekStart(date);
      const we = new Date(ws);
      we.setDate(we.getDate() + 7);
      const fromISO = new Date(Date.UTC(ws.getFullYear(), ws.getMonth(), ws.getDate())).toISOString();
      const toISO = new Date(Date.UTC(we.getFullYear(), we.getMonth(), we.getDate())).toISOString();
      const data = await getSessionsForRange(fromISO, toISO, schoolId);
      setSessions(data);
      setLoadingSessions(false);
    },
    [schoolId]
  );

  useEffect(() => {
    const id = requestAnimationFrame(() => fetchSessions(currentDate));
    return () => cancelAnimationFrame(id);
  }, [currentDate, fetchSessions]);

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

  const wrapperRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [fabRight, setFabRight] = useState(20);

  const [editingSession, setEditingSession] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSession, setDeletingSession] = useState<number | null>(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestSessionId, setGuestSessionId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [removingStudents, setRemovingStudents] = useState<Record<string, boolean>>({});
  const [guestError, setGuestError] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupSessionId, setGroupSessionId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupPeople, setGroupPeople] = useState("2");
  const [groupError, setGroupError] = useState("");
  const [attendanceLoading, setAttendanceLoading] = useState<Record<string, boolean>>({});
  const [closingSession, setClosingSession] = useState<string | null>(null);
  const [addingToSession, setAddingToSession] = useState<number | null>(null);
  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null);
  const [selectingStudents, setSelectingStudents] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [showBulkRemoveConfirm, setShowBulkRemoveConfirm] = useState(false);
  const [bulkRemoveSessionId, setBulkRemoveSessionId] = useState<string | null>(null);
  const [dragOverDayKey, setDragOverDayKey] = useState<string | null>(null);

  function handleDragStart(sessionId: string) {
    setDraggedSessionId(sessionId);
  }

  function handleDragEnd() {
    setDraggedSessionId(null);
    setDragOverDayKey(null);
  }

  async function handleDrop(targetDateKey: string) {
    if (!draggedSessionId || !schoolId) return;
    setDragOverDayKey(null);
    const oldSession = Object.values(sessions).flat().find((s) => s.id === draggedSessionId);
    if (!oldSession) return;
    const oldDate = new Date(oldSession.starts_at);
    const newDate = new Date(targetDateKey + "T" +
      String(oldDate.getUTCHours()).padStart(2, "0") + ":" +
      String(oldDate.getUTCMinutes()).padStart(2, "0") + ":00Z");
    if (isNaN(newDate.getTime())) return;
    const res = await updateSessionDate(draggedSessionId, newDate.toISOString(), schoolId);
    if (res.ok) {
      setDraggedSessionId(null);
      fetchSessions(currentDate);
    }
  }

  const [pendingPackStudent, setPendingPackStudent] = useState<{
    sessionId: string;
    studentId: string;
    studentName: string;
  } | null>(null);
  const [studentPacksForBooking, setStudentPacksForBooking] = useState<StudentProfilePack[]>([]);

  function goPrevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
    setSelectedDay(null);
  }

  function goNextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
    setSelectedDay(null);
  }

  function goToday() {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(null);
  }

  function jumpToDate(d: Date) {
    setCurrentDate(d);
    setSelectedDay(null);
    setShowDatePicker(false);
  }

  useEffect(() => {
    if (searchParams.get("nova") === "true") {
      const id = requestAnimationFrame(() => setShowModal(true));
      return () => cancelAnimationFrame(id);
    }
  }, [searchParams]);

  useEffect(() => {
    function update() {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      setFabRight(Math.max(20, window.innerWidth - rect.right + 20));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isToday = (d: Date) =>
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const isSelectedDay = (d: Date) =>
    selectedDay !== null &&
    d.getDate() === selectedDay.getDate() &&
    d.getMonth() === selectedDay.getMonth() &&
    d.getFullYear() === selectedDay.getFullYear();

  return (
    <>
      <div ref={wrapperRef} className="relative max-w-[800px] lg:max-w-[1100px] xl:mx-auto">
        <main className="px-5 pt-4 md:pt-8 2xl:pt-2 flex flex-col max-md:gap-5 gap-3 md:overflow-hidden max-md:h-[87vh] md:h-[82vh] 2xl:h-[92vh]">
          {/* Header */}
          <div className="flex flex-col items-start gap-0 max-md:mt-4 shrink-0 md:pb-4">
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Calendário
            </h1>

            {/* Week navigation */}
            <div className="flex items-center gap-2 self-center mt-4 md:mt-2">
              <button
                type="button"
                onClick={goPrevWeek}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-text-secondary hover:text-foreground hover:bg-surface transition-colors"
                aria-label="Semana anterior"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => { setShowDatePicker(true); setDpYear(currentDate.getFullYear()); setDpMonth(currentDate.getMonth()); }}
                className="rounded-lg border border-white/10 px-4 py-1.5 font-heading text-sm font-bold tracking-widest uppercase text-foreground hover:bg-surface transition-colors min-w-[200px] text-center"
              >
                {weekLabel}
              </button>

              <button
                type="button"
                onClick={goNextWeek}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-text-secondary hover:text-foreground hover:bg-surface transition-colors"
                aria-label="Próxima semana"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={goToday}
                className="rounded-lg border border-accent/30 px-3 py-1.5 font-body text-xs font-semibold text-accent hover:bg-accent/10 transition-colors"
              >
                Hoje
              </button>

              {loadingSessions && (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              )}
            </div>
          </div>

          {/* Calendar + Sidecard */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0 gap-4">
            {/* Weekly grid */}
            <div className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="rounded-xl bg-surface border border-white/5 flex flex-col overflow-hidden flex-1 min-h-0">
                {/* Day headers */}
                <div className="flex border-b border-white/5 bg-[#2A2A2A] shrink-0">
                  {weekDays.map((day, i) => (
                    <div
                      key={i}
                      className="flex-1 min-w-0 px-1 py-2 text-center"
                    >
                      <div className="font-body text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                        {WEEKDAYS_MON[i]}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedDay(isSelectedDay(day) ? null : day)}
                        className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full font-body text-xs font-bold transition-colors ${
                          isSelectedDay(day)
                            ? "bg-accent text-white"
                            : isToday(day)
                              ? "bg-accent/20 text-accent"
                              : "text-text-secondary hover:bg-accent/10"
                        }`}
                      >
                        {day.getDate()}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Sessions columns */}
                <div
                  ref={gridRef}
                  className="flex flex-1 overflow-y-auto overflow-x-auto [&::-webkit-scrollbar]:hidden"
                >
                  {weekDays.map((day, i) => {
                    const dateKey = dateToStr(day);
                    const daySess = sessions[dateKey] ?? [];
                    const totalCap = daySess.reduce((acc, s) => acc + s.capacidade, 0);
                    const totalAlunos = daySess.reduce((acc, s) => acc + s.alunos, 0);
                    const occPct = totalCap > 0 ? Math.round((totalAlunos / totalCap) * 100) : 0;

                    return (
                      <div
                        key={i}
                        onDragOver={(e) => { e.preventDefault(); setDragOverDayKey(dateKey); }}
                        onDragLeave={() => setDragOverDayKey(null)}
                        onDrop={(e) => { e.preventDefault(); handleDrop(dateKey); }}
                        className={`flex-1 min-w-0 border-r border-white/5 last:border-r-0 p-1 flex flex-col gap-1 transition-colors ${
                          isSelectedDay(day) ? "bg-accent/5" : ""
                        } ${dragOverDayKey === dateKey ? "bg-accent/15" : ""}`}
                      >
                        {occPct > 0 && (
                          <div className="h-0.5 w-full rounded-full bg-[#2A2A2A] overflow-hidden shrink-0">
                            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${occPct}%` }} />
                          </div>
                        )}
                        <div className="flex flex-col gap-1 overflow-y-auto flex-1">
                          {daySess.map((sess) => {
                            const isSingle = daySess.length <= 1;
                            const isFull = sess.capacidade > 0 && sess.alunos >= sess.capacidade;
                            return (
                              <button
                                key={sess.id}
                                type="button"
                                draggable
                                onDragStart={() => handleDragStart(sess.id)}
                                onDragEnd={handleDragEnd}
                                onClick={() => {
                                  if (draggedSessionId) return;
                                  setSelectedDay(day);
                                  setExpandedSession(null);
                                }}
                                className={`w-full text-left transition-colors hover:bg-accent/10 ${
                                  isFull ? "opacity-50" : ""
                                } ${isSingle ? "py-0.5" : "rounded-lg px-1.5 py-1.5 border border-white/5"} ${
                                  draggedSessionId === sess.id ? "opacity-30" : ""
                                }`}
                              >
                                <div className="font-body text-xs md:text-sm font-bold text-foreground truncate leading-tight">
                                  {sess.time}
                                </div>
                                <div className="font-body text-[11px] md:text-xs text-text-secondary truncate leading-tight">
                                  {sess.nome}
                                </div>
                                <div className="font-body text-[11px] md:text-xs text-text-muted leading-tight">
                                  Número de inscritos: {sess.alunos}
                                </div>
                                {sess.alunosList.length > 0 && (
                                  <>
                                    <div className="border-t border-white/5 my-1" />
                                    <div className="font-body text-[10px] md:text-xs text-text-muted leading-snug">
                                      {sess.alunosList.map((a) => (
                                        <div key={a.id}>{a.name}{a.groupSize ? ` · ${a.groupSize} pessoas` : ""}</div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Session detail modal (centered pop-up) */}
        {showSidebar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5" onClick={() => setSelectedDay(null)}>
            <div className="w-full max-w-md max-h-[75vh] rounded-2xl bg-surface flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="p-4 lg:p-5 border-b border-white/5 shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-heading text-sm lg:text-base font-bold text-foreground">
                      {eventCount > 0 ? `${eventCount} ${eventCount === 1 ? "sessão" : "sessões"}` : "Nenhuma sessão"}
                    </h3>
                    <p className="font-body text-xs lg:text-sm text-text-secondary mt-0.5">
                      {selectedDay!.getDate()} de {MONTHS[selectedDay!.getMonth()]} de {selectedDay!.getFullYear()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2A2A2A] text-text-secondary hover:text-foreground transition-colors shrink-0"
                    aria-label="Fechar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              </div>
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                {daySessions.length > 0 ? (
                  daySessions.map((session, si) => {
                    const isExpanded = expandedSession === si;
                    const isFutura = new Date(session.starts_at) > new Date();
                    return (
                      <div key={session.id} className="border-b border-white/5 last:border-b-0">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setExpandedSession(isExpanded ? null : si)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedSession(isExpanded ? null : si); } }}
                          className="w-full flex items-center justify-between gap-2 px-4 lg:px-5 py-2.5 lg:py-3.5 text-left transition-colors hover:bg-accent/10 cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-body text-xs lg:text-sm font-semibold text-foreground truncate">{session.nome}</p>
                            <p className="font-body text-[10px] lg:text-xs text-text-secondary">{session.time}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isFutura && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectingStudents((prev) => !prev); setSelectedStudentIds(new Set()); }}
                                className={`rounded-lg px-2 py-0.5 font-body text-[10px] lg:text-xs font-semibold transition-colors ${
                                  selectingStudents ? "bg-error/20 text-error" : "bg-[#2A2A2A] text-text-muted hover:text-text-secondary"
                                }`}
                              >
                                {selectingStudents ? "Sair" : "Selecionar"}
                              </button>
                            )}
                            <span className="font-body text-xs lg:text-sm text-text-muted">Inscritos</span>
                            <span className="rounded-md bg-accent/15 px-2 py-0.5 font-body text-xs lg:text-sm font-bold text-accent">
                              {session.alunos}{session.capacidade > 0 ? `/${session.capacidade}` : ""}
                            </span>
                          </div>
                          <ChevronRightIcon className={`h-3.5 w-3.5 shrink-0 text-text-secondary transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </div>
                        {isExpanded && (
                          <div className="px-4 lg:px-5 pb-3 lg:pb-4 space-y-3">
                            {session.alunosList.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {session.alunosList.map((aluno, ai) => {
                                  const removing = removingStudents[`${session.id}-${aluno.id}`];
                                  const isSelected = selectedStudentIds.has(aluno.id);
                                  return (
                                    <span
                                      key={ai}
                                      onClick={selectingStudents ? (e) => { e.stopPropagation(); setSelectedStudentIds((prev) => { const next = new Set(prev); if (next.has(aluno.id)) next.delete(aluno.id); else next.add(aluno.id); return next; }); } : undefined}
                                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-xs lg:text-sm transition-colors ${
                                        selectingStudents && isSelected
                                          ? "bg-error/20 text-error ring-1 ring-error"
                                          : "bg-[#2A2A2A] text-text-secondary"
                                      } ${selectingStudents ? "cursor-pointer" : ""}`}
                                    >
                                      {selectingStudents && (
                                        <span className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] font-bold transition-colors ${
                                          isSelected ? "border-error bg-error text-white" : "border-text-muted"
                                        }`}>
                                          {isSelected ? "✓" : ""}
                                        </span>
                                      )}
                                      {aluno.name}{aluno.groupSize ? ` · ${aluno.groupSize} pessoas` : ""}
                                      {aluno.id.startsWith("p-") && (
                                        <span className="ml-1 rounded-full bg-accent/10 px-1.5 py-0 font-body text-[10px] text-accent">Convidado</span>
                                      )}
                                      {isFutura && !selectingStudents && !aluno.id.startsWith("p-") && (
                                        <button
                                          type="button"
                                          disabled={removing}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            if (!schoolId || removing) return;
                                            setRemovingStudents((prev) => ({ ...prev, [`${session.id}-${aluno.id}`]: true }));
                                            const res = await cancelBooking(session.id, aluno.id, schoolId);
                                            setRemovingStudents((prev) => ({ ...prev, [`${session.id}-${aluno.id}`]: false }));
                                            if (res.ok) fetchSessions(currentDate);
                                            else console.error("Erro ao remover aluno:", res.error);
                                          }}
                                          className="ml-0.5 hover:text-error transition-colors disabled:opacity-50"
                                        >
                                          <TrashIcon className="h-3 w-3" />
                                        </button>
                                      )}
                                      {aluno.paymentStatus === "paid_offline" && (
                                        <svg className="h-3 w-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </span>
                                  );
                                })}
                                {session.alunos < session.capacidade && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setGuestSessionId(session.id); setShowGuestModal(true); }}
                                    className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 font-body text-xs lg:text-sm text-accent transition-colors hover:bg-accent/20"
                                  >
                                    <PlusIcon className="h-3 w-3" /> Aluno
                                  </button>
                                )}
                              </div>
                            )}
                            {selectingStudents && selectedStudentIds.size > 0 && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setBulkRemoveSessionId(session.id); setShowBulkRemoveConfirm(true); }}
                                className="w-full rounded-lg bg-error/20 py-2 font-body text-xs lg:text-sm font-semibold text-error transition-colors hover:bg-error/30"
                              >
                                Remover selecionados ({selectedStudentIds.size})
                              </button>
                            )}
                            {session.instructorName && (
                              <div className="flex items-center gap-2">
                                <span className="font-body text-xs lg:text-sm text-text-muted">Instrutor:</span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#2A2A2A] px-2.5 py-1 font-body text-xs lg:text-sm text-text-secondary">{session.instructorName}</span>
                              </div>
                            )}
                            {session.capacidade > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-body text-xs lg:text-sm text-text-muted">Ocupação</span>
                                  <span className="font-body text-xs lg:text-sm text-text-muted">{Math.round((session.alunos / session.capacidade) * 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-[#2A2A2A] overflow-hidden">
                                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.round((session.alunos / session.capacidade) * 100)}%` }} />
                                </div>
                              </div>
                            )}
                            <div className="flex flex-nowrap gap-2 pt-1">
                              {(() => {
                                const isPast = new Date(session.starts_at) < new Date();
                                if (isPast) {
                                  return (
                                    <>
                                      {session.alunosList.length > 0 && (
                                        <div className="w-full space-y-1.5 mb-2">
                                          <p className="font-body text-xs text-text-muted">Presenças</p>
                                          {session.alunosList.map((aluno) => {
                                            const isAttended = aluno.attendanceStatus === "attended";
                                            const isNoShow = aluno.attendanceStatus === "no_show";
                                            const loading = attendanceLoading[aluno.bookingId];
                                            return (
                                              <div key={aluno.bookingId || aluno.id} className="flex items-center justify-between gap-2 bg-[#2A2A2A] rounded-lg px-2.5 py-1.5">
                                                <span className="font-body text-xs text-text-secondary truncate min-w-0">{aluno.name}{aluno.groupSize ? ` · ${aluno.groupSize} pessoas` : ""}{aluno.id.startsWith("p-") && <span className="ml-1 rounded-full bg-accent/10 px-1.5 py-0 font-body text-[10px] text-accent">Convidado</span>}</span>
                                                <div className="flex gap-1 shrink-0">
                                                  <button
                                                    type="button"
                                                    disabled={loading}
                                                    onClick={async (e) => {
                                                      e.stopPropagation();
                                                      if (!aluno.bookingId || loading) return;
                                                      setAttendanceLoading((prev) => ({ ...prev, [aluno.bookingId]: true }));
                                                      await markAttendance(session.id, aluno.id, "attended");
                                                      setAttendanceLoading((prev) => ({ ...prev, [aluno.bookingId]: false }));
                                                      fetchSessions(currentDate);
                                                    }}
                                                    className={`rounded-lg px-2.5 py-1 font-body text-xs font-semibold transition-colors ${isAttended ? "bg-success/20 text-success" : "bg-[#1A1A1A] text-text-muted hover:text-success hover:bg-success/10"}`}
                                                  >
                                                    Presente
                                                  </button>
                                                  <button
                                                    type="button"
                                                    disabled={loading}
                                                    onClick={async (e) => {
                                                      e.stopPropagation();
                                                      if (!aluno.bookingId || loading) return;
                                                      setAttendanceLoading((prev) => ({ ...prev, [aluno.bookingId]: true }));
                                                      await markAttendance(session.id, aluno.id, "no_show");
                                                      setAttendanceLoading((prev) => ({ ...prev, [aluno.bookingId]: false }));
                                                      fetchSessions(currentDate);
                                                    }}
                                                    className={`rounded-lg px-2.5 py-1 font-body text-xs font-semibold transition-colors ${isNoShow ? "bg-error/20 text-error" : "bg-[#1A1A1A] text-text-muted hover:text-error hover:bg-error/10"}`}
                                                  >
                                                    Falta
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                      <button
                                        type="button"
                                        disabled={closingSession === session.id}
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          setClosingSession(session.id);
                                          await closeSession(session.id);
                                          setClosingSession(null);
                                          fetchSessions(currentDate);
                                        }}
                                        className="flex-1 rounded-lg bg-success/20 py-2 lg:py-2.5 font-body text-xs lg:text-sm font-semibold text-success transition-colors hover:bg-success/30 disabled:opacity-50"
                                      >
                                        {closingSession === session.id ? "A fechar..." : "Fechar sessão"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setDeletingSession(si); setShowDeleteConfirm(true) }}
                                        className="flex-1 rounded-lg bg-error-bg py-2 lg:py-2.5 font-body text-xs lg:text-sm font-semibold text-error transition-colors hover:bg-error/30"
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
                                      onClick={(e) => { e.stopPropagation(); setGuestSessionId(session.id); setShowGuestModal(true); }}
                                      className="flex-1 rounded-lg bg-accent/10 py-2 lg:py-2.5 font-body text-xs lg:text-sm font-semibold text-accent transition-colors hover:bg-accent/20"
                                    >
                                      + Convidado
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setShowGroupModal(true); setGroupSessionId(session.id); }}
                                      className="flex-1 rounded-lg bg-accent/10 py-2 lg:py-2.5 font-body text-xs lg:text-sm font-semibold text-accent transition-colors hover:bg-accent/20"
                                    >
                                      + Grupo
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingSession(si);
                                        setDataAula(dateToStr(selectedDay!));
                                        const [h, m] = session.time.split(":");
                                        setHorario(`${h.padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}`);
                                        setSelectedServicoId(session.class_type_id ?? "");
                                        const svc = servicos.find((sv) => sv.id === session.class_type_id);
                                        setDuracao(svc?.default_duration_minutes ? String(svc.default_duration_minutes) : "90");
                                        setCapacidade(session.capacidade ? String(session.capacidade) : "");
                                        setInstrutorSelecionadoId(session.instructor_id ?? "");
                                        setShowModal(true);
                                        fetchServicos();
                                        fetchInstrutores();
                                      }}
                                      className="flex-1 rounded-lg bg-[#2A2A2A] py-2 lg:py-2.5 font-body text-xs lg:text-sm font-semibold text-text-secondary transition-colors hover:bg-accent/10"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setDeletingSession(si); setShowDeleteConfirm(true) }}
                                      className="flex-1 rounded-lg bg-error-bg py-2 lg:py-2.5 font-body text-xs lg:text-sm font-semibold text-error transition-colors hover:brightness-110"
                                    >
                                      Cancelar
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center px-3 py-10">
                    <p className="font-body text-xs text-text-muted text-center">Nenhuma sessão agendada para este dia.</p>
                    <button
                      type="button"
                      onClick={() => setSelectedDay(null)}
                      className="mt-4 rounded-xl bg-accent px-6 py-2.5 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
                    >
                      Fechar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Date picker modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50" onClick={() => setShowDatePicker(false)}>
          <div className="w-full max-w-sm rounded-t-2xl md:rounded-2xl bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted md:hidden" />

            <h3 className="font-heading text-lg font-bold text-foreground mb-4 text-center">
              Ir para data
            </h3>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => {
                  if (dpMonth === 0) { setDpYear((y) => y - 1); setDpMonth(11); }
                  else setDpMonth((m) => m - 1);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-text-secondary hover:text-foreground transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className="font-heading text-sm font-bold uppercase tracking-widest text-foreground">
                {MONTHS[dpMonth]} {dpYear}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (dpMonth === 11) { setDpYear((y) => y + 1); setDpMonth(0); }
                  else setDpMonth((m) => m + 1);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-text-secondary hover:text-foreground transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px mb-4">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                <div key={i} className="py-1 text-center font-body text-[10px] font-semibold uppercase text-text-muted">{d}</div>
              ))}
              {Array.from({ length: new Date(dpYear, dpMonth, 1).getDay() }, (_, i) => (
                <div key={`e-${i}`} />
              ))}
              {Array.from({ length: getDaysInMonth(dpYear, dpMonth) }, (_, i) => {
                const day = i + 1;
                const d = new Date(dpYear, dpMonth, day);
                const isSel = d.getDate() === currentDate.getDate() && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => jumpToDate(d)}
                    className={`flex h-8 w-full items-center justify-center rounded-full font-body text-xs transition-colors ${
                      isSel ? "bg-accent text-white" : "text-text-secondary hover:bg-accent/10"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowDatePicker(false)}
              className="w-full rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => {
          setEditingSession(null);
          const hoje = new Date();
          const hojeStr = dateToStr(hoje);
          const selStr = selectedDay ? dateToStr(selectedDay) : "";
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
        style={{ right: fabRight ? `${fabRight}px` : "20px" }}
        className="fixed bottom-24 md:bottom-12 z-30 flex h-[56px] w-[56px] items-center justify-center rounded-full bg-accent text-primary-foreground shadow-2xl active:scale-90 transition-all duration-200"
        aria-label="Adicionar evento"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          if (deletingSession === null || !daySessions[deletingSession]) return;
          await cancelSession(daySessions[deletingSession].id);
          setDeletingSession(null);
          fetchSessions(currentDate);
        }}
        title="Cancelar aula"
        message="Esta aula será removida e todos os alunos inscritos receberão um email de notificação."
        confirmLabel="Sim, cancelar"
        cancelLabel="Voltar"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={showBulkRemoveConfirm}
        onClose={() => { setShowBulkRemoveConfirm(false); setBulkRemoveSessionId(null); }}
        onConfirm={async () => {
          if (!schoolId || !bulkRemoveSessionId || selectedStudentIds.size === 0) return;
          const res = await cancelBookingsBulk(bulkRemoveSessionId, Array.from(selectedStudentIds), schoolId);
          if (res.ok) {
            setSelectingStudents(false);
            setSelectedStudentIds(new Set());
            setShowBulkRemoveConfirm(false);
            setBulkRemoveSessionId(null);
            fetchSessions(currentDate);
          } else {
            console.error("Erro ao remover alunos:", res.error);
          }
        }}
        title="Remover alunos"
        message={`Tens a certeza que queres remover ${selectedStudentIds.size} ${selectedStudentIds.size === 1 ? "aluno" : "alunos"} desta sessão?`}
        confirmLabel="Sim, remover"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* Guest modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-24">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />
            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Novo convidado</h3>
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
              {guestError && <p className="font-body text-sm text-error">{guestError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowGuestModal(false)} className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground">Cancelar</button>
                <button type="button" onClick={async () => {
                  if (!schoolId || !guestName.trim()) return;
                  setGuestError("");
                  const res = await addGuestToSession(guestName.trim(), guestPhone.trim() || undefined, guestSessionId, schoolId);
                  if (!res.ok) { setGuestError(res.error ?? "Erro ao adicionar convidado"); return; }
                  setShowGuestModal(false);
                  setSessions((prev) => updateSessionsAddStudent(prev, guestSessionId, res.studentId!, res.studentName!));
                }} className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95">Adicionar</button>
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
            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Adicionar grupo</h3>
            <div className="space-y-4">
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Nome do responsável <span className="text-error">*</span></label>
                <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Ex: João Silva" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
              </div>
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Número de pessoas <span className="text-error">*</span></label>
                <input type="number" min="2" max="100" value={groupPeople} onChange={(e) => setGroupPeople(e.target.value)} placeholder="Ex: 5" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
              </div>
              {groupError && <p className="font-body text-sm text-error">{groupError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowGroupModal(false)} className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground">Cancelar</button>
                <button type="button" onClick={async () => {
                  if (!schoolId || !groupName.trim()) return;
                  const num = parseInt(groupPeople, 10);
                  if (isNaN(num) || num < 2) { setGroupError("O número mínimo de pessoas é 2"); return; }
                  setGroupError("");
                  const res = await addGroupBooking(groupSessionId, groupName.trim(), num, schoolId);
                  if (!res.ok) { setGroupError(res.error ?? "Erro ao adicionar grupo"); return; }
                  setShowGroupModal(false);
                  setSessions((prev) => updateSessionsAddStudent(prev, groupSessionId, res.student!.id, res.student!.name, res.student!.groupSize));
                  fetchSessions(currentDate);
                }} className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95">Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Create / Edit session */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 md:px-5" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-t-2xl md:rounded-2xl bg-surface p-6 pb-24 md:pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted md:hidden" />
            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">{editingSession !== null ? "Editar aula" : "Nova aula"}</h3>
            <div className="space-y-4">
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Serviço <span className="text-error">*</span></label>
                <div className="relative">
                  <select
                    value={selectedServicoId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__add__") { router.push("/dashboard/servicos"); return; }
                      setSelectedServicoId(val);
                      setFormErrors((prev) => ({ ...prev, servico: "" }));
                      const svc = servicos.find((s) => s.id === val);
                      if (svc?.default_duration_minutes) setDuracao(String(svc.default_duration_minutes));
                    }}
                    className="w-full appearance-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent"
                    required
                  >
                    <option value="">Selecionar serviço</option>
                    {servicos.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                    <option disabled>──────────</option>
                    <option value="__add__">+ Adicionar novo serviço</option>
                  </select>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"><path d="m6 9 6 6 6-6" /></svg>
                </div>
                {formErrors.servico && <p className="mt-1 font-body text-sm text-error">{formErrors.servico}</p>}
              </div>
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Dia <span className="text-error">*</span></label>
                <input type="date" value={dataAula} onChange={(e) => { setDataAula(e.target.value); setFormErrors((prev) => ({ ...prev, data: "" })); }} className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert-[0.7] [&::-webkit-calendar-picker-indicator]:cursor-pointer" required />
                {formErrors.data && <p className="mt-1 font-body text-sm text-error">{formErrors.data}</p>}
              </div>
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Horário de início <span className="text-error">*</span></label>
                <input type="time" value={horario} onChange={(e) => { setHorario(e.target.value); setFormErrors((prev) => ({ ...prev, horario: "" })); }} className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert-[0.7] [&::-webkit-calendar-picker-indicator]:cursor-pointer" required />
                {formErrors.horario && <p className="mt-1 font-body text-sm text-error">{formErrors.horario}</p>}
              </div>
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Capacidade máxima</label>
                <input type="number" min="0" value={capacidade} onChange={(e) => { setCapacidade(e.target.value); setFormErrors((prev) => ({ ...prev, capacidade: "" })); }} placeholder="Ex: 8 (opcional)" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
                {formErrors.capacidade && <p className="mt-1 font-body text-sm text-error">{formErrors.capacidade}</p>}
              </div>
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Instrutor <span className="text-text-muted">(opcional)</span></label>
                <div className="relative">
                  <select value={instrutorSelecionadoId} onChange={(e) => setInstrutorSelecionadoId(e.target.value)} className="w-full appearance-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent">
                    <option value="">Sem instrutor</option>
                    {instrutoresList.map((inst) => (<option key={inst.id} value={inst.id}>{inst.name}</option>))}
                  </select>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"><path d="m6 9 6 6 6-6" /></svg>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground">Cancelar</button>
                <button type="button" onClick={async () => {
                  const errors: Record<string, string> = {};
                  if (!selectedServicoId) errors.servico = "Seleciona um serviço";
                  if (!dataAula) errors.data = "Seleciona a data";
                  if (!horario) errors.horario = "Define o horário";
                  if (editingSession === null && dataAula) {
                    const hoje = new Date();
                    const dataLimite = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
                    const dataEscolhida = new Date(dataAula + "T00:00:00Z");
                    if (dataEscolhida < dataLimite) errors.data = "Não é possível criar aulas em dias anteriores ao dia de hoje";
                  }
                  setFormErrors(errors);
                  if (Object.keys(errors).length > 0) return;
                  const payload = { class_type_id: selectedServicoId, instructor_id: instrutorSelecionadoId || null, data: dataAula, horario, duracao: Number(duracao), capacidade: Number(capacidade), schoolId: schoolId! };
                  const res = editingSession !== null ? await updateSession(daySessions[editingSession].id, payload) : await createSession(payload);
                  if (res.ok) { setShowModal(false); setFormErrors({}); fetchSessions(currentDate); }
                }} className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95">{editingSession !== null ? "Guardar" : "Criar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pack choice modal */}
      {pendingPackStudent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-24">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />
            <h3 className="font-heading text-lg font-bold text-foreground mb-1">Método de pagamento</h3>
            <p className="font-body text-sm text-text-secondary mb-4">{pendingPackStudent.studentName}</p>
            <button type="button" onClick={async () => {
              if (!schoolId) return;
              const { sessionId, studentId, studentName } = pendingPackStudent;
              await createBooking(sessionId, studentId, schoolId);
              setSessions((prev) => updateSessionsAddStudent(prev, sessionId, studentId, studentName));
              setPendingPackStudent(null);
              setAddingToSession(null);
            }} className="w-full rounded-xl bg-surface py-3 font-body text-sm font-semibold text-foreground transition-colors hover:bg-[#2A2A2A] mb-2">Pagamento único</button>
            {studentPacksForBooking.map((p) => (
              <button key={p.id} type="button" onClick={async () => {
                if (!schoolId) return;
                const { sessionId, studentId, studentName } = pendingPackStudent;
                await createBooking(sessionId, studentId, schoolId, { paymentMethod: "pack", packPurchaseId: p.id });
                setSessions((prev) => updateSessionsAddStudent(prev, sessionId, studentId, studentName));
                setPendingPackStudent(null);
                setAddingToSession(null);
              }} className="w-full rounded-xl bg-accent/20 py-3 font-body text-sm font-semibold text-accent transition-colors hover:bg-accent/30 mb-2">Usar pack — {p.name} ({p.remaining} {p.remaining === 1 ? "restante" : "restantes"})</button>
            ))}
            <button type="button" onClick={() => setPendingPackStudent(null)} className="w-full rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground">Cancelar</button>
          </div>
        </div>
      )}
    </>
  );
}
