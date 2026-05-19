"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByUser } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export type SessionData = {
  id: string;
  nome: string;
  time: string;
  capacidade: number;
  alunos: number;
  alunosList: string[];
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

export async function getSessionsForMonth(
  year: number,
  month: number,
  schoolId: string
): Promise<Record<number, SessionData[]>> {
  const supabase = await createClient();

  const startOfMonth = new Date(Date.UTC(year, month, 1));
  const endOfMonth = new Date(Date.UTC(year, month + 1, 1));

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, starts_at, duration_minutes, capacity, class_type_id, class_types(name)")
    .eq("school_id", schoolId)
    .gte("starts_at", startOfMonth.toISOString())
    .lt("starts_at", endOfMonth.toISOString())
    .order("starts_at", { ascending: true });

  if (!sessions) return {};

  const result: Record<number, SessionData[]> = {};

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

  for (const s of sessions) {
    const d = new Date(s.starts_at);
    const day = d.getUTCDate();
    const hours = d.getUTCHours().toString().padStart(2, "0");
    const minutes = d.getUTCMinutes().toString().padStart(2, "0");

    if (!result[day]) result[day] = [];

    const bData = bookingMap[s.id] ?? { count: 0, names: [] };

    result[day].push({
      id: s.id,
      nome: (s.class_types as unknown as { name: string } | null)?.name ?? "Aula",
      time: `${hours}:${minutes}`,
      capacidade: s.capacity ?? 10,
      alunos: bData.count,
      alunosList: bData.names,
    });
  }

  return result;
}

export async function createSession(formData: {
  nome: string;
  data: string;
  horario: string;
  duracao: number;
  capacidade: number;
  schoolId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "createSession");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const startsAt = new Date(`${formData.data}T${formData.horario}:00Z`);

  if (isNaN(startsAt.getTime())) {
    return { ok: false, error: "Data ou horário inválidos" };
  }

  // find or create class_type
  let classTypeId: string | null = null;
  const name = formData.nome.trim();

  if (name) {
    const { data: existing } = await supabase
      .from("class_types")
      .select("id")
      .eq("school_id", formData.schoolId)
      .eq("name", name)
      .maybeSingle();

    if (existing) {
      classTypeId = existing.id;
    } else {
      const { data: created, error: createErr } = await supabase
        .from("class_types")
        .insert({
          school_id: formData.schoolId,
          name,
          default_duration_minutes: formData.duracao,
          price_cents: 0,
        })
        .select("id")
        .single();

      if (createErr) return { ok: false, error: createErr.message };
      classTypeId = created.id;
    }
  }

  const { data: createdSession, error } = await supabase.from("sessions").insert({
    school_id: formData.schoolId,
    starts_at: startsAt.toISOString(),
    duration_minutes: formData.duracao,
    capacity: formData.capacidade,
    price_cents: 0,
    class_type_id: classTypeId,
    status: "scheduled",
  }).select("id").single();

  if (error) return { ok: false, error: error.message };

  logAudit({
    schoolId: formData.schoolId,
    userId: user.id,
    action: "create_session",
    entityType: "session",
    entityId: createdSession.id,
    metadata: { nome: formData.nome, data: formData.data, horario: formData.horario },
  });

  return { ok: true };
}

export async function deleteSession(sessionId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "deleteSession");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  // get school_id before deleting
  const { data: session } = await supabase
    .from("sessions")
    .select("school_id")
    .eq("id", sessionId)
    .single();

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);

  if (error) return { ok: false, error: error.message };

  if (session) {
    logAudit({
      schoolId: session.school_id,
      userId: user.id,
      action: "delete_session",
      entityType: "session",
      entityId: sessionId,
    });
  }

  return { ok: true };
}

export async function updateSession(
  sessionId: string,
  formData: {
    nome: string;
    data: string;
    horario: string;
    duracao: number;
    capacidade: number;
    schoolId: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "updateSession");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const startsAt = new Date(`${formData.data}T${formData.horario}:00Z`);

  if (isNaN(startsAt.getTime())) {
    return { ok: false, error: "Data ou horário inválidos" };
  }

  // find or create class_type
  let classTypeId: string | null = null;
  const name = formData.nome.trim();

  if (name) {
    const { data: existing } = await supabase
      .from("class_types")
      .select("id")
      .eq("school_id", formData.schoolId)
      .eq("name", name)
      .maybeSingle();

    if (existing) {
      classTypeId = existing.id;
    } else {
      const { data: created, error: createErr } = await supabase
        .from("class_types")
        .insert({
          school_id: formData.schoolId,
          name,
          default_duration_minutes: formData.duracao,
          price_cents: 0,
        })
        .select("id")
        .single();

      if (createErr) return { ok: false, error: createErr.message };
      classTypeId = created.id;
    }
  }

  const { error } = await supabase
    .from("sessions")
    .update({
      starts_at: startsAt.toISOString(),
      duration_minutes: formData.duracao,
      capacity: formData.capacidade,
      class_type_id: classTypeId,
    })
    .eq("id", sessionId);

  if (error) return { ok: false, error: error.message };

  logAudit({
    schoolId: formData.schoolId,
    userId: user.id,
    action: "update_session",
    entityType: "session",
    entityId: sessionId,
    metadata: { nome: formData.nome, data: formData.data, horario: formData.horario },
  });

  return { ok: true };
}

export async function getSchoolStudents(schoolId: string): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("school_students")
    .select("student:students(id, full_name)")
    .eq("school_id", schoolId);

  if (!rows) return [];

  return rows
    .map((r) => r.student as unknown as { id: string; full_name: string } | null)
    .filter(Boolean)
    .map((s) => ({ id: s!.id, name: s!.full_name }));
}

export async function createBooking(
  sessionId: string,
  studentId: string,
  schoolId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "createBooking");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: student } = await supabase
    .from("students")
    .select("full_name, email, phone")
    .eq("id", studentId)
    .single();

  if (!student) return { ok: false, error: "Aluno não encontrado" };

  const { data: bg, error: bgErr } = await supabase
    .from("booking_groups")
    .insert({
      school_id: schoolId,
      session_id: sessionId,
      booked_by_student_id: studentId,
      contact_name: student.full_name,
      contact_email: student.email ?? `${studentId}@placeholder.com`,
      contact_phone: student.phone ?? "000000000",
      source: "guest",
    })
    .select("id")
    .single();

  if (bgErr) return { ok: false, error: bgErr.message };

  const { error: bErr } = await supabase
    .from("bookings")
    .insert({
      booking_group_id: bg.id,
      session_id: sessionId,
      student_id: studentId,
      payment_method: "single",
      payment_status: "unpaid",
      price_cents: 0,
    });

  if (bErr) return { ok: false, error: bErr.message };

  logAudit({
    schoolId: schoolId,
    userId: user.id,
    action: "create_booking",
    entityType: "booking",
    entityId: studentId,
    metadata: { sessionId, studentName: student.full_name },
  });

  return { ok: true };
}

export async function addGuestToSession(
  name: string,
  phone: string | undefined,
  sessionId: string,
  schoolId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "addGuestToSession");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("id", schoolId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!school) return { ok: false, error: "Escola não encontrada" };

  const admin = createAdminClient();

  const { data: student, error: sErr } = await admin
    .from("students")
    .insert({ full_name: name, is_guest: true, ...(phone ? { phone } : {}) })
    .select("id")
    .single();
  if (sErr) return { ok: false, error: sErr.message };

  const { error: ssErr } = await supabase
    .from("school_students")
    .insert({ school_id: schoolId, student_id: student.id });
  if (ssErr) return { ok: false, error: ssErr.message };

  const { data: bg, error: bgErr } = await supabase
    .from("booking_groups")
    .insert({
      school_id: schoolId,
      session_id: sessionId,
      booked_by_student_id: student.id,
      contact_name: name,
      contact_email: `${student.id}@placeholder.com`,
      contact_phone: phone ?? "000000000",
      source: "guest",
    })
    .select("id")
    .single();
  if (bgErr) return { ok: false, error: bgErr.message };

  const { error: bErr } = await supabase
    .from("bookings")
    .insert({
      booking_group_id: bg.id,
      session_id: sessionId,
      student_id: student.id,
      payment_method: "single",
      payment_status: "unpaid",
      price_cents: 0,
    });
  if (bErr) return { ok: false, error: bErr.message };

  logAudit({
    schoolId: schoolId,
    userId: user.id,
    action: "add_guest_to_session",
    entityType: "booking",
    entityId: student.id,
    metadata: { sessionId, guestName: name, phone },
  });

  return { ok: true };
}
