"use server";

import { createClient } from "@/lib/supabase/server";
import { getSchoolId } from "@/lib/school";

export type TodaySession = {
  id: string;
  time: string;
  durationMinutes: number;
  title: string;
  inscritos: number;
  capacidade: number;
  alunosList: { name: string }[];
};

export type SchoolInfo = {
  name: string;
  logo_url: string | null;
  location: string | null;
  description: string | null;
  cancellation_window_hours: number;
};

export async function getSchoolInfo(): Promise<SchoolInfo | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("schools")
    .select("name, logo_url, location, description, cancellation_window_hours")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  return data;
}

export async function getTodaySessions(schoolId: string): Promise<TodaySession[]> {
  const supabase = await createClient();

  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const endOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, starts_at, duration_minutes, capacity, class_types(name)")
    .eq("school_id", schoolId)
    .eq("status", "scheduled")
    .gte("starts_at", startOfDay.toISOString())
    .lt("starts_at", endOfDay.toISOString())
    .order("starts_at", { ascending: true });

  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);

  const { data: allBookings } = await supabase
    .from("bookings")
    .select("session_id, student_id")
    .in("session_id", sessionIds)
    .eq("status", "confirmed");

  const bookingCount: Record<string, number> = {};
  const bookingStudents: Record<string, string[]> = {};
  for (const b of allBookings ?? []) {
    bookingCount[b.session_id] = (bookingCount[b.session_id] ?? 0) + 1;
    if (!bookingStudents[b.session_id]) bookingStudents[b.session_id] = [];
    bookingStudents[b.session_id].push(b.student_id);
  }

  const allStudentIds = [...new Set((allBookings ?? []).map(b => b.student_id))];
  const { data: students } = allStudentIds.length > 0
    ? await supabase.from("students").select("id, full_name").in("id", allStudentIds)
    : { data: [] };
  const studentNameMap = new Map((students ?? []).map(s => [s.id, s.full_name]));

  return sessions.map((s) => {
    const d = new Date(s.starts_at);
    const hours = d.getUTCHours().toString().padStart(2, "0");
    const minutes = d.getUTCMinutes().toString().padStart(2, "0");
    const alunosIds = bookingStudents[s.id] ?? [];
    return {
      id: s.id,
      time: `${hours}:${minutes}`,
      durationMinutes: s.duration_minutes,
      title: (s.class_types as unknown as { name: string } | null)?.name ?? "Aula",
      inscritos: bookingCount[s.id] ?? 0,
      capacidade: s.capacity ?? 10,
      alunosList: alunosIds.map(id => ({ name: studentNameMap.get(id) ?? "Aluno" })),
    };
  });
}

export type Alerta = {
  id: string;
  tipo: "baixa_ocupacao" | "pack_a_expirar" | "waiver_em_falta" | "semana_vazia" | "pagamento_pendente" | "lotada" | "sem_instrutor" | "sessoes_por_confirmar";
  mensagem: string;
  link: string;
  entityId: string | null;
};

export async function getAlertas(schoolId: string): Promise<Alerta[]> {
  const supabase = await createClient();
  const alertas: Alerta[] = [];
  const now = new Date();
  let idCounter = 0;

  // ─── Carregar dismissals existentes ─────────────────────
  const { data: existingDismissals } = await supabase
    .from("alert_dismissals")
    .select("tipo, entity_id")
    .eq("school_id", schoolId);

  const dismissedKeys = new Set<string>();
  for (const d of existingDismissals ?? []) {
    dismissedKeys.add(`${d.tipo}:${d.entity_id ?? ""}`);
  }

  // ─── 1. Baixa ocupação (próximas 48h) ──────────────────
  const fim48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const { data: lowOccSessions } = await supabase
    .from("sessions")
    .select("id, starts_at, capacity, class_types(name)")
    .eq("school_id", schoolId)
    .eq("status", "scheduled")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", fim48h.toISOString());

  if (lowOccSessions && lowOccSessions.length > 0) {
    const lowSessionIds = lowOccSessions.map(s => s.id);
    const { data: lowBookings } = await supabase
      .from("bookings")
      .select("session_id")
      .in("session_id", lowSessionIds)
      .in("status", ["confirmed", "attended"]);

    const lowCountMap: Record<string, number> = {};
    for (const b of lowBookings ?? []) lowCountMap[b.session_id] = (lowCountMap[b.session_id] ?? 0) + 1;

    for (const s of lowOccSessions) {
      const cap = s.capacity ?? 10;
      const inscritos = lowCountMap[s.id] ?? 0;
      if (cap > 0 && inscritos / cap < 0.4) {
        const entityKey = `baixa_ocupacao:${s.id}`;
        if (dismissedKeys.has(entityKey)) continue;
        const nome = (s.class_types as unknown as { name: string } | null)?.name ?? "Aula";
        const d = new Date(s.starts_at);
        const hora = `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
        alertas.push({ id: `baixa-${++idCounter}`, tipo: "baixa_ocupacao", mensagem: `"${nome}" às ${hora} — ${inscritos}/${cap} inscritos`, link: "/dashboard/calendario", entityId: s.id });
      }
    }
  }

  // ─── 2. Packs a expirar (sem uso há 30+ dias) ──────────
  const ha30Dias = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const { data: packRows } = await supabase
    .from("pack_purchases")
    .select("id, lessons_remaining, student_id, pack:packs!inner(name), student:students!inner(full_name)")
    .eq("school_id", schoolId)
    .eq("status", "active")
    .gt("lessons_remaining", 0);

  for (const pr of packRows ?? []) {
    const pack = pr.pack as unknown as { name: string };
    const student = pr.student as unknown as { full_name: string };
    const { data: recentBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("student_id", pr.student_id)
      .eq("payment_method", "pack")
      .gte("created_at", ha30Dias.toISOString())
      .limit(1);

    if (!recentBookings || recentBookings.length === 0) {
      const entityKey = `pack_a_expirar:${pr.id}`;
      if (dismissedKeys.has(entityKey)) continue;
      alertas.push({ id: `pack-${++idCounter}`, tipo: "pack_a_expirar", mensagem: `${student.full_name} — "${pack.name}" com ${pr.lessons_remaining} aulas por usar (sem uso há 30+ dias)`, link: "/dashboard/alunos", entityId: pr.id });
    }
  }

  // ─── 3. Waivers em falta ────────────────────────────────
  // (tabela waivers ainda não existe — saltar)

  // ─── 4. Semana que vem sem sessões ──────────────────────
  const diaSemana = now.getDay();
  const diffParaSegunda = diaSemana === 0 ? 1 : 8 - diaSemana;
  const proximaSegunda = new Date(now);
  proximaSegunda.setDate(now.getDate() + diffParaSegunda);
  proximaSegunda.setHours(0, 0, 0, 0);
  const proximoDomingo = new Date(proximaSegunda);
  proximoDomingo.setDate(proximaSegunda.getDate() + 6);
  proximoDomingo.setHours(23, 59, 59, 999);

  const { count: sessNextWeek } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("status", "scheduled")
    .gte("starts_at", proximaSegunda.toISOString())
    .lte("starts_at", proximoDomingo.toISOString());

  if (sessNextWeek === 0) {
    const entityKey = `semana_vazia:`;
    if (!dismissedKeys.has(entityKey)) {
      alertas.push({ id: `semana-${++idCounter}`, tipo: "semana_vazia", mensagem: "Não tens nenhuma sessão agendada para a próxima semana", link: "/dashboard/calendario", entityId: null });
    }
  }

  // ─── 5. Pagamentos pendentes (sessões passadas) ─────────
  const { data: unpaidBookings } = await supabase
    .from("bookings")
    .select("id, session_id, student_id, session:sessions!inner(starts_at, school_id, class_types(name)), student:students!inner(full_name)")
    .eq("session_id.school_id", schoolId)
    .eq("payment_status", "unpaid")
    .in("status", ["confirmed", "attended"])
    .lt("session_id.starts_at", now.toISOString())
    .order("session_id.starts_at", { ascending: false })
    .limit(10);

  for (const ub of unpaidBookings ?? []) {
    const entityKey = `pagamento_pendente:${ub.id}`;
    if (dismissedKeys.has(entityKey)) continue;
    const session = ub.session as unknown as { starts_at: string; class_types: { name: string } | null };
    const student = ub.student as unknown as { full_name: string };
    const nomeAula = session.class_types?.name ?? "Aula";
    const d = new Date(session.starts_at);
    const dataStr = d.toLocaleDateString("pt-PT", { day: "numeric", month: "long" });
    alertas.push({ id: `pagamento-${++idCounter}`, tipo: "pagamento_pendente", mensagem: `${student.full_name} — "${nomeAula}" (${dataStr}) por pagar`, link: "/dashboard/calendario", entityId: ub.id });
  }

  // ─── 6. Sessão completamente cheia (próximos 7 dias) ────
  const fim7dias = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { data: fullSessions } = await supabase
    .from("sessions")
    .select("id, starts_at, capacity, class_types(name)")
    .eq("school_id", schoolId)
    .eq("status", "scheduled")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", fim7dias.toISOString());

  if (fullSessions && fullSessions.length > 0) {
    const fullSessionIds = fullSessions.map(s => s.id);
    const { data: fullBookings } = await supabase
      .from("bookings")
      .select("session_id")
      .in("session_id", fullSessionIds)
      .in("status", ["confirmed", "attended"]);

    const fullCountMap: Record<string, number> = {};
    for (const b of fullBookings ?? []) fullCountMap[b.session_id] = (fullCountMap[b.session_id] ?? 0) + 1;

    for (const s of fullSessions) {
      const cap = s.capacity ?? 10;
      const inscritos = fullCountMap[s.id] ?? 0;
      if (cap > 0 && inscritos >= cap) {
        const entityKey = `lotada:${s.id}`;
        if (dismissedKeys.has(entityKey)) continue;
        const nome = (s.class_types as unknown as { name: string } | null)?.name ?? "Aula";
        const d = new Date(s.starts_at);
        const dataStr = d.toLocaleDateString("pt-PT", { day: "numeric", month: "long" });
        const hora = `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
        alertas.push({ id: `cheia-${++idCounter}`, tipo: "lotada", mensagem: `"${nome}" ${dataStr} às ${hora} — ${inscritos}/${cap} (lotada)`, link: "/dashboard/calendario", entityId: s.id });
      }
    }
  }

  // ─── 7. Sessões sem instrutor (próximos 7 dias) ─────────
  const { data: noInstructor } = await supabase
    .from("sessions")
    .select("id, starts_at, class_types(name)")
    .eq("school_id", schoolId)
    .eq("status", "scheduled")
    .is("instructor_id", null)
    .gte("starts_at", now.toISOString())
    .lte("starts_at", fim7dias.toISOString());

  for (const s of noInstructor ?? []) {
    const entityKey = `sem_instrutor:${s.id}`;
    if (dismissedKeys.has(entityKey)) continue;
    const nome = (s.class_types as unknown as { name: string } | null)?.name ?? "Aula";
    const d = new Date(s.starts_at);
    const dataStr = d.toLocaleDateString("pt-PT", { day: "numeric", month: "long" });
    const hora = `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
    alertas.push({ id: `instrutor-${++idCounter}`, tipo: "sem_instrutor", mensagem: `"${nome}" ${dataStr} às ${hora} — sem instrutor atribuído`, link: "/dashboard/calendario", entityId: s.id });
  }

  // ─── 8. Sessões passadas por confirmar (há mais de 2 dias) ──
  const ha2Dias = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const { count: pastUnconfirmed } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("status", "scheduled")
    .lt("starts_at", ha2Dias.toISOString());

  if (pastUnconfirmed && pastUnconfirmed > 0) {
    const entityKey = `sessoes_por_confirmar:`;
    if (!dismissedKeys.has(entityKey)) {
      alertas.push({
        id: `pendentes-${++idCounter}`,
        tipo: "sessoes_por_confirmar",
        mensagem: `Tens ${pastUnconfirmed} ${pastUnconfirmed === 1 ? "sessão por confirmar" : "sessões por confirmar"}`,
        link: "/dashboard/calendario",
        entityId: null,
      });
    }
  }

  return alertas;
}

export async function dismissAlert(schoolId: string, tipo: string, entityId: string | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("alert_dismissals")
    .insert({ school_id: schoolId, tipo, entity_id: entityId ?? null });

  if (error) {
    console.error("Failed to dismiss alert:", error);
  }
}

export async function logoutOwner(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export type ActivityItem = {
  id: string;
  type: "new_booking" | "pack_purchase" | "cancellation";
  message: string;
  timeAgo: string;
  timestamp: string;
};

function formatTimeAgo(d: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  return `há ${days} ${days === 1 ? "dia" : "dias"}`;
}

export async function getRecentActivity(schoolId: string): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const items: ActivityItem[] = [];

  // Buscar novas reservas (booking_groups criados recentemente)
  const { data: recentBookings } = await supabase
    .from("booking_groups")
    .select("id, created_at, contact_name, bookings( student_id, students( full_name ) )")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .limit(5);

  for (const bg of recentBookings ?? []) {
    const bks = bg.bookings as unknown as { student_id: string; students: { full_name: string } | null }[];
    const firstB = bks?.[0];
    const name = firstB?.students?.full_name ?? bg.contact_name;
    items.push({
      id: bg.id,
      type: "new_booking",
      message: `<span class="font-semibold">${name}</span> fez uma reserva.`,
      timeAgo: formatTimeAgo(new Date(bg.created_at)),
      timestamp: bg.created_at,
    });
  }

  // Buscar pagamentos de pack
  const { data: recentPacks } = await supabase
    .from("pack_purchases")
    .select("id, created_at, students( full_name ), packs( name )")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .limit(5);

  for (const pp of recentPacks ?? []) {
    const s = pp.students as unknown as { full_name: string };
    const p = pp.packs as unknown as { name: string };
    items.push({
      id: pp.id,
      type: "pack_purchase",
      message: `<span class="font-semibold">${s?.full_name ?? "Aluno"}</span> comprou o pack <span class="font-semibold">${p?.name ?? "Pack"}</span>.`,
      timeAgo: formatTimeAgo(new Date(pp.created_at)),
      timestamp: pp.created_at,
    });
  }

  // Buscar cancelamentos (bookings cancelados)
  const { data: cancelled } = await supabase
    .from("bookings")
    .select("id, student_id, students( full_name )")
    .in("status", ["cancelled_by_school", "cancelled_by_student"])
    .limit(5);

  // For cancellations, get session info to find school_id context
  for (const cb of cancelled ?? []) {
    const s = cb.students as unknown as { full_name: string };
    items.push({
      id: cb.id,
      type: "cancellation",
      message: `<span class="font-semibold">${s?.full_name ?? "Aluno"}</span> cancelou a reserva.`,
      timeAgo: "",
      timestamp: "",
    });
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return items.slice(0, 10);
}
