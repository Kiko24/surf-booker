"use server";

import { createClient } from "@/lib/supabase/server";

export type SessionRecord = {
  id: string;
  dateRaw: string;
  dateLabel: string;
  weekday: string;
  time: string;
  nome: string;
  capacidade: number;
  alunos: number;
  alunosList: string[];
  status: string;
};

export async function getSchoolId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("schools")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  return data?.id ?? null;
}

const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function formatDate(date: Date): { dateLabel: string; weekday: string } {
  return {
    dateLabel: `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
    weekday: WEEKDAYS[date.getDay()],
  };
}

export async function getServicos(schoolId: string): Promise<SessionRecord[]> {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, starts_at, duration_minutes, capacity, status, class_type_id, class_types(name)")
    .eq("school_id", schoolId)
    .order("starts_at", { ascending: false });

  if (!sessions) return [];

  const sessionIds = sessions.map((s) => s.id);

  const { data: allBookings } = await supabase
    .from("bookings")
    .select("session_id, student_id")
    .in("session_id", sessionIds)
    .eq("status", "confirmed");

  const studentIds = [...new Set((allBookings ?? []).map((b) => b.student_id))];

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name")
    .in("id", studentIds);

  const studentNameMap = new Map((students ?? []).map((s) => [s.id, s.full_name]));

  const bookingMap: Record<string, { count: number; names: string[] }> = {};
  for (const b of allBookings ?? []) {
    if (!bookingMap[b.session_id]) bookingMap[b.session_id] = { count: 0, names: [] };
    bookingMap[b.session_id].count++;
    const name = studentNameMap.get(b.student_id);
    if (name) bookingMap[b.session_id].names.push(name);
  }

  const result: SessionRecord[] = [];

  for (const s of sessions) {
    const d = new Date(s.starts_at);
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const { dateLabel, weekday } = formatDate(d);
    const bData = bookingMap[s.id] ?? { count: 0, names: [] };

    result.push({
      id: s.id,
      dateRaw: s.starts_at,
      dateLabel,
      weekday,
      time: `${hours}:${minutes}`,
      nome: (s.class_types as unknown as { name: string } | null)?.name ?? "Aula",
      capacidade: s.capacity ?? 10,
      alunos: bData.count,
      alunosList: bData.names,
      status: s.status,
    });
  }

  return result;
}
