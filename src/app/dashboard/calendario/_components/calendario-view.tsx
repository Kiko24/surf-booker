"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getSessionsForMonth, createSession, updateSession, deleteSession, cancelSession, completeSession, getSchoolStudents, createBooking, addGuestToSession, addGroupBooking, getAvulsoServicos, getStudentProfile, togglePaymentStatus, getInstructorsForSchool, type SessionData, type AvulsoServico, type StudentProfile, type StudentProfilePack } from "../actions";
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
  const [pendingPackStudent, setPendingPackStudent] = useState<{ sessionId: string; studentId: string; studentName: string } | null>(null);
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
    <>
      <main className="px-5 pt-4">

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
                <ChevronLeftIcon className="h-5 w-5" />
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
                <ChevronRightIcon className="h-5 w-5" />
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
                          {s.instructorName && <p className="font-body text-xs text-text-secondary mb-3">Instrutor: {s.instructorName}</p>}
                          <p className="font-body text-xs font-semibold uppercase text-text-secondary mb-3">Alunos inscritos</p>
                          <div className="space-y-2">
                            {s.alunosList.map((aluno, idx) => (
                              <div key={`${aluno.id}-${idx}`} className="flex items-center gap-3">
                                <button type="button" onClick={async () => { if (!schoolId) return; const r = await togglePaymentStatus(s.id, aluno.id, schoolId); if (r.ok && r.newStatus) { const next = { ...sessions }; for (const d of Object.keys(next)) { const dn = Number(d); next[dn] = next[dn].map(sess => sess.id === s.id ? { ...sess, alunosList: sess.alunosList.map(a => a.id === aluno.id ? { ...a, paymentStatus: r.newStatus! } : a) } : sess); } setSessions(next); } }} className="shrink-0">
                                  <span className={`h-2.5 w-2.5 rounded-full ${aluno.paymentStatus === 'paid_offline' ? 'bg-success' : 'bg-error'}`} />
                                </button>
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-accent">
                                  {aluno.name.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase()}
                                </div>
                                <button type="button" onClick={async () => { if (!schoolId) return; setLoadingProfile(true); const p = await getStudentProfile(schoolId, aluno.id); if (p) setProfileStudent(p); setLoadingProfile(false); }} className="font-body text-sm text-foreground hover:text-accent text-left transition-colors">{aluno.name}</button>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-3 border-t border-foreground/10">
                            {(() => {
                              const isPast = new Date(s.starts_at) < new Date();
                              if (isPast) {
                                return (
                                  <div className="flex gap-3">
                                    <button
                                      type="button"
                                      onClick={() => { setCompletingSession(i); setShowCompleteConfirm(true); }}
                                      className="flex-1 rounded-lg bg-success/20 py-2 font-body text-sm font-semibold text-success transition-colors hover:bg-success/30"
                                    >
                                      Marcar como realizada
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setDeletingSession(i); setShowDeleteConfirm(true); }}
                                      className="flex-1 rounded-lg bg-error/20 py-2 font-body text-sm font-semibold text-error transition-colors hover:bg-error/30"
                                    >
                                      Cancelar sessão
                                    </button>
                                  </div>
                                );
                              }
                              return (
                                <>
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
                                              <div key={st.id} className="flex gap-2">
                                                <button
                                                  type="button"
                                                  onClick={async () => {
                                                    if (!schoolId) return;
                                                    const profile = await getStudentProfile(schoolId, st.id);
                                                    if (profile && profile.packs.length > 0) {
                                                      setPendingPackStudent({ sessionId: s.id, studentId: st.id, studentName: st.name });
                                                      setStudentPacksForBooking(profile.packs);
                                                    } else {
                                                      const res = await createBooking(s.id, st.id, schoolId);
                                                      if (res.ok) {
                                                        setSessions((prev) => {
                                                          const next = { ...prev };
                                                          for (const day of Object.keys(next)) {
                                                            const dayNum = Number(day);
                                                            next[dayNum] = next[dayNum].map((sess) =>
                                                              sess.id === s.id ? { ...sess, alunos: sess.alunos + 1, alunosList: [...sess.alunosList, { id: st.id, name: st.name, paymentStatus: 'unpaid' }] } : sess
                                                            );
                                                          }
                                                          return next;
                                                        });
                                                        setAddingToSession(null);
                                                        setStudentSearch("");
                                                        fetchSessions(year, month);
                                                      }
                                                    }
                                                  }}
                                                  className="w-full rounded-lg bg-accent/20 px-3 py-2 text-left text-sm text-accent hover:bg-accent/30 transition-colors"
                                                >
                                                  {st.name}
                                                </button>
                                              </div>
                                            ))}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setAddingToSession(null);
                                              setStudentSearch("");
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
                                    <div className="space-y-2">
                                    <button
                                      type="button"
                                      onClick={() => { setAddingToSession(i); setStudentSearch(""); setSchoolStudents([]); }}
                                      className="w-full rounded-lg bg-accent/20 py-2 font-body text-sm font-semibold text-accent transition-colors hover:bg-accent/30"
                                    >
                                      + Adicionar aluno
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setGroupSessionId(s.id);
                                        setGroupName("");
                                        setGroupPeople("2");
                                        setGroupError("");
                                        setShowGroupModal(true);
                                      }}
                                      className="w-full rounded-lg bg-surface py-2 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
                                    >
                                      + Adicionar grupo
                                    </button>
                                    </div>
                                  )}
                                  </div>
                                  <div className="flex gap-3">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingSession(i);
                                        setDataAula(selectedDay ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : "");
                                        const [h, m] = s.time.split(":");
                                        setHorario(`${h.padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}`);
                                        setSelectedServicoId(s.class_type_id ?? "");
                                        const svc = servicos.find((sv) => sv.id === s.class_type_id);
                                        setDuracao(svc?.default_duration_minutes ? String(svc.default_duration_minutes) : "90");
                                        setCapacidade(String(s.capacidade));
                                        setInstrutorSelecionadoId(s.instructor_id ?? "");
                                        setShowModal(true);
                                        fetchServicos();
                                        fetchInstrutores();
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
                                      Cancelar
                                    </button>
                                  </div>
                                </>
                              );
                            })()}
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

      {/* FAB */}
      <button
        type="button"
        onClick={() => {
          setEditingSession(null);
          setShowModal(true);
          setDataAula(selectedDay ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : "");
          setSelectedServicoId("");
          setHorario("");
          setDuracao("90");
          setCapacidade("");
          setInstrutorSelecionadoId("");
          fetchServicos();
          fetchInstrutores();
        }}
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary-foreground shadow-2xl active:scale-90 transition-all duration-200"
        aria-label="Adicionar evento"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      {/* Cancel confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center">
            <p className="font-heading text-xl font-bold text-foreground mb-2">Cancelar aula</p>
            <p className="font-body text-sm text-text-secondary mb-6">
              Esta aula será removida e todos os alunos inscritos receberão um email de notificação.
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
                  if (deletingSession === null || !daySessions[deletingSession]) return;
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
            <p className="font-heading text-xl font-bold text-foreground mb-2">Marcar como realizada</p>
            <p className="font-body text-sm text-text-secondary mb-6">
              Alunos com pagamento pendente serão marcados como pagos, créditos de pack serão descontados e a sessão será fechada.
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
                  if (completingSession === null || !daySessions[completingSession]) return;
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
                            ? { ...sess, alunos: sess.alunos + 1, alunosList: [...sess.alunosList, { id: res.studentId!, name: res.studentName!, paymentStatus: 'unpaid' }] }
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
                    const res = await addGroupBooking(groupSessionId, groupName.trim(), num, schoolId);
                    if (!res.ok) { setGroupError(res.error ?? "Erro ao adicionar grupo"); return; }
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

      {/* Modal */}
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
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
                {formErrors.servico && <p className="mt-1 font-body text-sm text-error">{formErrors.servico}</p>}
              </div>

              {/* Data */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Dia <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  value={dataAula}
                  onChange={(e) => { setDataAula(e.target.value); setFormErrors((prev) => ({ ...prev, data: "" })); }}
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert-[0.7] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  required
                />
                {formErrors.data && <p className="mt-1 font-body text-sm text-error">{formErrors.data}</p>}
              </div>

              {/* Horário início */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Horário de início <span className="text-error">*</span>
                </label>
                <input
                  type="time"
                  value={horario}
                  onChange={(e) => { setHorario(e.target.value); setFormErrors((prev) => ({ ...prev, horario: "" })); }}
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert-[0.7] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  required
                />
                {formErrors.horario && <p className="mt-1 font-body text-sm text-error">{formErrors.horario}</p>}
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
                  onChange={(e) => { setCapacidade(e.target.value); setFormErrors((prev) => ({ ...prev, capacidade: "" })); }}
                  placeholder="Ex: 8"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                  required
                />
                {formErrors.capacidade && <p className="mt-1 font-body text-sm text-error">{formErrors.capacidade}</p>}
              </div>

              {/* Instrutor (opcional) */}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Instrutor <span className="text-text-muted">(opcional)</span>
                </label>
                <div className="relative">
                  <select
                    value={instrutorSelecionadoId}
                    onChange={(e) => setInstrutorSelecionadoId(e.target.value)}
                    className="w-full appearance-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground outline-none focus:outline-2 focus:outline-accent"
                  >
                    <option value="">Sem instrutor</option>
                    {instrutoresList.map((inst) => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted">
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
                    if (!selectedServicoId) errors.servico = "Seleciona um serviço";
                    if (!dataAula) errors.data = "Seleciona a data";
                    if (!horario) errors.horario = "Define o horário";
                    if (!capacidade || Number(capacidade) < 1) errors.capacidade = "A capacidade deve ser pelo menos 1";
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
                    const res = editingSession !== null
                      ? await updateSession(daySessions[editingSession].id, payload)
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
                  <p className="font-body text-sm text-text-muted">A carregar...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-background text-xl font-bold text-accent">
                      {profileStudent.name.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-bold text-foreground">{profileStudent.name}</h3>
                      <p className="font-body text-sm text-text-secondary">
                        {profileStudent.isGuest ? "Convidado" : "Registado"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {profileStudent.email && (
                      <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                        <p className="font-body text-xs text-text-secondary">Email</p>
                        <p className="font-body text-sm text-foreground">{profileStudent.email}</p>
                      </div>
                    )}
                    {profileStudent.phone && (
                      <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                        <p className="font-body text-xs text-text-secondary">Telemóvel</p>
                        <p className="font-body text-sm text-foreground">{profileStudent.phone}</p>
                      </div>
                    )}
                    <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                      <p className="font-body text-xs text-text-secondary">{profileStudent.classLabel ?? "Aulas"}</p>
                      <p className="font-body text-sm text-foreground">{profileStudent.classDate ?? "Nenhuma"}</p>
                    </div>
                    {!profileStudent.isGuest && (
                      <div className="rounded-xl bg-[#2A2A2A] px-4 py-3">
                        <p className="font-body text-xs text-text-secondary mb-2">Packs</p>
                        {profileStudent.packs.length === 0 ? (
                          <p className="font-body text-sm text-text-muted">Não tem packs ativos</p>
                        ) : (
                          <div className="space-y-2">
                            {profileStudent.packs.map((p, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="font-body text-sm text-foreground">{p.name}</span>
                                <span className="font-body text-xs text-text-secondary">{p.remaining} restantes</span>
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
            <h3 className="font-heading text-lg font-bold text-foreground mb-1">Método de pagamento</h3>
            <p className="font-body text-sm text-text-secondary mb-4">{pendingPackStudent.studentName}</p>

            <button
              type="button"
              onClick={async () => {
                if (!schoolId) return;
                const { sessionId, studentId, studentName } = pendingPackStudent;
                await createBooking(sessionId, studentId, schoolId);
                setSessions((prev) => {
                  const next = { ...prev };
                  for (const day of Object.keys(next)) {
                    const dayNum = Number(day);
                    next[dayNum] = next[dayNum].map((sess) =>
                      sess.id === sessionId
                        ? { ...sess, alunos: sess.alunos + 1, alunosList: [...sess.alunosList, { id: studentId, name: studentName, paymentStatus: 'unpaid' }] }
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
                  const { sessionId, studentId, studentName } = pendingPackStudent;
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
                          ? { ...sess, alunos: sess.alunos + 1, alunosList: [...sess.alunosList, { id: studentId, name: studentName, paymentStatus: 'unpaid' }] }
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
                Usar pack — {p.name} ({p.remaining} {p.remaining === 1 ? "restante" : "restantes"})
              </button>
            ))}

            <button
              type="button"
              onClick={() => { setPendingPackStudent(null); }}
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
