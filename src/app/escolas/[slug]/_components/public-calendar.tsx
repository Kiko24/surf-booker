"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getPublicSessionsForMonth, type PublicSession } from "../actions";

type Props = {
  schoolId: string;
  classTypeId?: string | null;
  selectedSessionIds: Set<string>;
  onToggleSession: (session: PublicSession) => void;
};

const WEEKDAY_HEADERS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function PublicCalendar({ schoolId, classTypeId, selectedSessionIds, onToggleSession }: Props) {
  const onToggleSessionRef = useRef(onToggleSession);
  useEffect(() => {
    onToggleSessionRef.current = onToggleSession;
  }, [onToggleSession]);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [sessionsByDay, setSessionsByDay] = useState<Record<number, PublicSession[]>>({});
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const data = await getPublicSessionsForMonth(schoolId, year, month);
    setSessionsByDay(data);
    setLoading(false);
    setSelectedDay(null);
  }, [schoolId, year, month]);

  useEffect(() => {
    const id = requestAnimationFrame(() => fetchSessions());
    return () => cancelAnimationFrame(id);
  }, [fetchSessions]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  const isPastDay = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(year, month - 1, day);
    return date < today;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
  };

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const filteredByDay = useMemo(() => {
    if (!classTypeId) return sessionsByDay;
    const result: Record<number, PublicSession[]> = {};
    for (const [dayStr, sessions] of Object.entries(sessionsByDay)) {
      const filtered = sessions.filter((s) => s.class_type_id === classTypeId);
      if (filtered.length > 0) result[Number(dayStr)] = filtered;
    }
    return result;
  }, [sessionsByDay, classTypeId]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setSelectedDay(null);
    });
    return () => cancelAnimationFrame(id);
  }, [classTypeId]);

  const selectedDaySessions = selectedDay ? filteredByDay[selectedDay] ?? [] : [];

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {monthNames[month - 1]} {year}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_HEADERS.map((h, i) => (
          <div key={i} className="text-center text-xs font-semibold text-gray-400 py-1">
            {h}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="min-h-[40px]" />;
          }

          const daySessions = filteredByDay[day] ?? [];
          const hasSessions = daySessions.length > 0;
          const hasAvailability = daySessions.some((s) => s.capacity - s.booked > 0);
          const blocked = isPastDay(day) || !hasSessions;
          const selected = selectedDay === day;
          const today = isToday(day);

          return (
            <button
              key={day}
              type="button"
              disabled={blocked}
              onClick={() => {
                setSelectedDay(day);
              }}
              className={`min-h-[40px] rounded-lg text-sm transition-colors ${
                selected
                  ? "bg-accent/10 ring-1 ring-accent font-semibold text-gray-900"
                  : today
                    ? "ring-1 ring-accent text-gray-900"
                    : blocked
                      ? "text-gray-300 pointer-events-none"
                      : hasAvailability
                        ? "text-gray-900 hover:bg-accent/5 cursor-pointer"
                        : "text-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="flex items-center justify-center h-full">{day}</span>
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <p className="mt-3 text-center text-xs text-gray-400">A carregar...</p>
      )}

      {/* Selected day sessions */}
      {selectedDay !== null && !loading && (
        <div className="mt-3 space-y-2">
          {selectedDaySessions.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-2">
              Nenhuma sessão disponível neste dia.
            </p>
          ) : (
            selectedDaySessions.map((session) => {
              const date = new Date(session.starts_at);
              const time = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
              const unlimited = session.capacity >= 999999;
              const vagas = session.capacity - session.booked;
              const isFull = !unlimited && vagas <= 0;
              const isInCart = selectedSessionIds.has(session.id);

              return (
                <div
                  key={session.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                    isFull
                      ? "opacity-50 border-gray-100 bg-gray-50"
                      : isInCart
                        ? "bg-accent/10 ring-1 ring-accent border-accent"
                        : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {session.class_type_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {time} · {isFull ? "Completo" : unlimited ? "Sem limite de vagas" : `${vagas} ${vagas === 1 ? "vaga" : "vagas"}`}
                    </p>
                  </div>
                  {!isFull && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => onToggleSessionRef.current(session)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onToggleSessionRef.current(session);
                        }
                      }}
                      className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full border-2 text-base transition-transform hover:scale-110 cursor-pointer ${
                        isInCart
                          ? "border-accent bg-accent text-white"
                          : "border-accent text-accent hover:bg-accent hover:text-white"
                      }`}
                    >
                      {isInCart ? "✓" : "+"}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
