"use server";

import { createClient } from "@/lib/supabase/server";
import { rateLimitByUser } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { safeError } from "@/lib/safe-error";
import { requireOwner } from "@/lib/school";
import { assertValidOrigin } from "@/lib/csrf";

type ClassTypeName = { name: string };
type InstructorName = { name: string };
type StudentName = { id: string; full_name: string };

export type SessionAluno = {
  id: string;
  bookingId: string;
  name: string;
  paymentStatus: string;
  attendanceStatus: "confirmed" | "attended" | "no_show";
  groupSize?: number;
};

export type SessionData = {
  id: string;
  nome: string;
  time: string;
  capacidade: number;
  alunos: number;
  alunosList: SessionAluno[];
  class_type_id: string | null;
  instructor_id: string | null;
  instructorName: string | null;
  starts_at: string;
};

export type AvulsoServico = {
  id: string;
  name: string;
  default_duration_minutes: number | null;
  price_cents: number;
};

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
    .select("id, starts_at, duration_minutes, capacity, class_type_id, instructor_id, class_types(name), instructors(name), status")
    .eq("school_id", schoolId)
    .gte("starts_at", startOfMonth.toISOString())
    .lt("starts_at", endOfMonth.toISOString())
    .order("starts_at", { ascending: true });

  if (!sessions) return {};

  const result: Record<number, SessionData[]> = {};

  const sessionIds = sessions.map((s) => s.id);

  const { data: allBookings } = await supabase
    .from("bookings")
    .select("id, session_id, student_id, payment_status, status, booking_group_id, participants")
    .in("session_id", sessionIds)
    .in("status", ["confirmed", "attended", "no_show"]);

  const groupIds = [...new Set((allBookings ?? []).map((b) => b.booking_group_id).filter(Boolean))];
  const { data: groups } = await supabase
    .from("booking_groups")
    .select("id, group_size")
    .in("id", groupIds);
  const groupSizeMap = new Map((groups ?? []).map((g) => [g.id, g.group_size]));

  const studentIds = [...new Set((allBookings ?? []).filter(b => b.student_id).map((b) => b.student_id))];

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name")
    .in("id", studentIds);

  const studentNameMap = new Map((students ?? []).map((s) => [s.id, s.full_name]));

  const bookingMap: Record<string, { count: number; alunos: SessionAluno[] }> = {};
  for (const b of allBookings ?? []) {
    if (!bookingMap[b.session_id]) bookingMap[b.session_id] = { count: 0, alunos: [] };

    if (b.participants && Array.isArray(b.participants) && b.participants.length > 0) {
      const count = b.participants.length;
      if (b.status !== "no_show") bookingMap[b.session_id].count += count;
      (b.participants as Array<{ name: string; age?: number }>).forEach((p, idx) => {
        bookingMap[b.session_id].alunos.push({
          id: `p-${b.id}-${idx}`,
          bookingId: b.id,
          name: p.name,
          paymentStatus: b.payment_status,
          attendanceStatus: b.status as "confirmed" | "attended" | "no_show",
        });
      });
    } else {
      const gs = b.booking_group_id ? groupSizeMap.get(b.booking_group_id) ?? 1 : 1;
      if (b.status !== "no_show") bookingMap[b.session_id].count += gs;
      const name = studentNameMap.get(b.student_id);
      if (name) bookingMap[b.session_id].alunos.push({
        id: b.student_id,
        bookingId: b.id,
        name,
        paymentStatus: b.payment_status,
        attendanceStatus: b.status as "confirmed" | "attended" | "no_show",
        groupSize: gs > 1 ? gs : undefined,
      });
    }
  }

  for (const s of sessions) {
    const d = new Date(s.starts_at);
    const day = d.getUTCDate();
    const hours = d.getUTCHours().toString().padStart(2, "0");
    const minutes = d.getUTCMinutes().toString().padStart(2, "0");

    if (!result[day]) result[day] = [];

    const bData = bookingMap[s.id] ?? { count: 0, alunos: [] as SessionAluno[] };

    const instructor = s.instructors as unknown as InstructorName | null;
    result[day].push({
      id: s.id,
      nome: (s.class_types as unknown as ClassTypeName | null)?.name ?? "Aula",
      time: `${hours}:${minutes}`,
      capacidade: s.capacity ?? 0,
      alunos: bData.count,
      alunosList: bData.alunos,
      class_type_id: s.class_type_id,
      instructor_id: s.instructor_id,
      instructorName: instructor?.name ?? null,
      starts_at: s.starts_at,
    });
  }

  return result;
}

export async function getSessionsForRange(
  fromISO: string,
  toISO: string,
  schoolId: string
): Promise<Record<string, SessionData[]>> {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, starts_at, duration_minutes, capacity, class_type_id, instructor_id, class_types(name), instructors(name), status")
    .eq("school_id", schoolId)
    .eq("status", "scheduled")
    .gte("starts_at", fromISO)
    .lt("starts_at", toISO)
    .order("starts_at", { ascending: true });

  if (!sessions) return {};

  const result: Record<string, SessionData[]> = {};

  const sessionIds = sessions.map((s) => s.id);

  const { data: allBookings } = await supabase
    .from("bookings")
    .select("id, session_id, student_id, payment_status, status, booking_group_id, participants")
    .in("session_id", sessionIds)
    .in("status", ["confirmed", "attended", "no_show"]);

  const groupIds = [...new Set((allBookings ?? []).map((b) => b.booking_group_id).filter(Boolean))];
  const { data: groups } = await supabase
    .from("booking_groups")
    .select("id, group_size")
    .in("id", groupIds);
  const groupSizeMap = new Map((groups ?? []).map((g) => [g.id, g.group_size]));

  const studentIds = [...new Set((allBookings ?? []).filter(b => b.student_id).map((b) => b.student_id))];

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name")
    .in("id", studentIds);

  const studentNameMap = new Map((students ?? []).map((s) => [s.id, s.full_name]));

  const bookingMap: Record<string, { count: number; alunos: SessionAluno[] }> = {};
  for (const b of allBookings ?? []) {
    if (!bookingMap[b.session_id]) bookingMap[b.session_id] = { count: 0, alunos: [] };

    if (b.participants && Array.isArray(b.participants) && b.participants.length > 0) {
      const count = b.participants.length;
      if (b.status !== "no_show") bookingMap[b.session_id].count += count;
      (b.participants as Array<{ name: string; age?: number }>).forEach((p, idx) => {
        bookingMap[b.session_id].alunos.push({
          id: `p-${b.id}-${idx}`,
          bookingId: b.id,
          name: p.name,
          paymentStatus: b.payment_status,
          attendanceStatus: b.status as "confirmed" | "attended" | "no_show",
        });
      });
    } else {
      const gs = b.booking_group_id ? groupSizeMap.get(b.booking_group_id) ?? 1 : 1;
      if (b.status !== "no_show") bookingMap[b.session_id].count += gs;
      const name = studentNameMap.get(b.student_id);
      if (name) bookingMap[b.session_id].alunos.push({
        id: b.student_id,
        bookingId: b.id,
        name,
        paymentStatus: b.payment_status,
        attendanceStatus: b.status as "confirmed" | "attended" | "no_show",
        groupSize: gs > 1 ? gs : undefined,
      });
    }
  }

  for (const s of sessions) {
    const d = new Date(s.starts_at);
    const dateKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    const hours = d.getUTCHours().toString().padStart(2, "0");
    const minutes = d.getUTCMinutes().toString().padStart(2, "0");

    if (!result[dateKey]) result[dateKey] = [];

    const bData = bookingMap[s.id] ?? { count: 0, alunos: [] as SessionAluno[] };
    const instructor = s.instructors as unknown as InstructorName | null;
    result[dateKey].push({
      id: s.id,
      nome: (s.class_types as unknown as ClassTypeName | null)?.name ?? "Aula",
      time: `${hours}:${minutes}`,
      capacidade: s.capacity ?? 0,
      alunos: bData.count,
      alunosList: bData.alunos,
      class_type_id: s.class_type_id,
      instructor_id: s.instructor_id,
      instructorName: instructor?.name ?? null,
      starts_at: s.starts_at,
    });
  }

  return result;
}

export async function getAvulsoServicos(schoolId: string): Promise<AvulsoServico[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("class_types")
    .select("id, name, default_duration_minutes, price_cents")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .or("category.eq.aula,category.is.null")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createSession(formData: {
  class_type_id: string | null;
  instructor_id: string | null;
  data: string;
  horario: string;
  duracao: number;
  capacidade: number;
  schoolId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const rl = await rateLimitByUser(user.id, "createSession");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  try {
    await requireOwner(formData.schoolId);
  } catch {
    return { ok: false, error: "Sem permissão" };
  }

  const startsAt = new Date(`${formData.data}T${formData.horario}:00Z`);

  if (isNaN(startsAt.getTime())) {
    return { ok: false, error: "Data ou horário inválidos" };
  }

  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (startsAt < todayStart) {
    return { ok: false, error: "Não é possível criar aulas em dias anteriores ao dia de hoje" };
  }

  const capacity = formData.capacidade > 0 ? formData.capacidade : null;

  const { data: createdSession, error } = await supabase.from("sessions").insert({
    school_id: formData.schoolId,
    starts_at: startsAt.toISOString(),
    duration_minutes: formData.duracao,
    capacity,
    price_cents: 0,
    class_type_id: formData.class_type_id,
    instructor_id: formData.instructor_id,
    status: "scheduled",
  }).select("id").single();

  if (error) return { ok: false, error: safeError(error) };

  logAudit({
    schoolId: formData.schoolId,
    userId: user.id,
    action: "create_session",
    entityType: "session",
    entityId: createdSession.id,
    metadata: { class_type_id: formData.class_type_id, data: formData.data, horario: formData.horario },
  });

  return { ok: true };
}

export async function deleteSession(sessionId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const rl = await rateLimitByUser(user.id, "deleteSession");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: session } = await supabase
    .from("sessions")
    .select("school_id")
    .eq("id", sessionId)
    .single();
  if (!session) return { ok: false, error: "Sessão não encontrada" };

  try {
    await requireOwner(session.school_id);
  } catch {
    return { ok: false, error: "Sem permissão" };
  }

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);

  if (error) return { ok: false, error: safeError(error) };

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

export async function cancelSession(sessionId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const rl = await rateLimitByUser(user.id, "cancelSession");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: session } = await supabase
    .from("sessions")
    .select("school_id, starts_at, class_type_id")
    .eq("id", sessionId)
    .single();
  if (!session) return { ok: false, error: "Sessão não encontrada" };

  try {
    await requireOwner(session.school_id);
  } catch {
    return { ok: false, error: "Sem permissão" };
  }

  const [schoolRes, classTypeRes, bookingsRes] = await Promise.all([
    supabase.from("schools").select("name").eq("id", session.school_id).single(),
    session.class_type_id
      ? supabase.from("class_types").select("name").eq("id", session.class_type_id).single()
      : Promise.resolve({ data: null }),
    supabase.from("bookings").select("student_id").eq("session_id", sessionId),
  ]);

  const schoolName = schoolRes.data?.name ?? "";
  const className = (classTypeRes.data as { name: string } | null)?.name ?? "Aula";

  const studentIds = (bookingsRes.data ?? []).map((b) => b.student_id);

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, email")
    .in("id", studentIds);

  const d = new Date(session.starts_at);
  const date = d.toLocaleDateString("pt-PT", { day: "numeric", month: "long" });
  const time = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

  const { sendCancellationNotification } = await import("@/lib/email");

  for (const s of students ?? []) {
    if (s.email) {
      sendCancellationNotification({
        studentEmail: s.email,
        studentName: s.full_name,
        schoolName,
        className,
        date,
        time,
      }).catch((err) => {
        console.error("Failed to send cancellation notification to", s.email);
      });
    }
  }

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);

  if (error) return { ok: false, error: safeError(error) };

  logAudit({
    schoolId: session.school_id,
    userId: user.id,
    action: "cancel_session",
    entityType: "session",
    entityId: sessionId,
  });

  return { ok: true };
}

export async function markAttendance(
  sessionId: string,
  studentId: string,
  status: "attended" | "no_show",
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const rl = await rateLimitByUser(user.id, "markAttendance");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: session } = await supabase
    .from("sessions")
    .select("school_id")
    .eq("id", sessionId)
    .single();
  if (!session) return { ok: false, error: "Sessão não encontrada" };

  try {
    await requireOwner(session.school_id);
  } catch {
    return { ok: false, error: "Sem permissão" };
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, payment_method, payment_status, pack_purchase_id")
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (!booking) return { ok: false, error: "Booking não encontrado" };

  const updates: Record<string, unknown> = { status };

  if (status === "attended") {
    if (booking.payment_method === "single" && booking.payment_status === "unpaid") {
      updates.payment_status = "paid_offline";
    }

    if (booking.payment_method === "pack" && booking.pack_purchase_id) {
      await supabase.rpc("decrement_pack_credit", {
        p_purchase_id: booking.pack_purchase_id,
      });
    }
  }

  const { error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", booking.id);

  if (error) return { ok: false, error: safeError(error) };

  logAudit({
    schoolId: session.school_id,
    userId: user.id,
    action: "mark_attendance",
    entityType: "booking",
    entityId: booking.id,
    metadata: { sessionId, studentId, status },
  });

  return { ok: true };
}

export async function closeSession(sessionId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const rl = await rateLimitByUser(user.id, "closeSession");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: session } = await supabase
    .from("sessions")
    .select("school_id")
    .eq("id", sessionId)
    .single();
  if (!session) return { ok: false, error: "Sessão não encontrada" };

  try {
    await requireOwner(session.school_id);
  } catch {
    return { ok: false, error: "Sem permissão" };
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("session_id", sessionId)
    .eq("status", "confirmed");

  if (bookings && bookings.length > 0) {
    const { error: bErr } = await supabase
      .from("bookings")
      .update({ status: "no_show" })
      .eq("session_id", sessionId)
      .eq("status", "confirmed");

    if (bErr) return { ok: false, error: bErr.message };
  }

  const { error } = await supabase
    .from("sessions")
    .update({ status: "completed" })
    .eq("id", sessionId);

  if (error) return { ok: false, error: safeError(error) };

  logAudit({
    schoolId: session.school_id,
    userId: user.id,
    action: "close_session",
    entityType: "session",
    entityId: sessionId,
  });

  return { ok: true };
}

export async function updateSession(
  sessionId: string,
  formData: {
    class_type_id: string | null;
    instructor_id: string | null;
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

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const rl = await rateLimitByUser(user.id, "updateSession");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  try {
    await requireOwner(formData.schoolId);
  } catch {
    return { ok: false, error: "Sem permissão" };
  }

  const startsAt = new Date(`${formData.data}T${formData.horario}:00Z`);

  if (isNaN(startsAt.getTime())) {
    return { ok: false, error: "Data ou horário inválidos" };
  }

  const capacity = formData.capacidade > 0 ? formData.capacidade : null;

  const { error } = await supabase
    .from("sessions")
    .update({
      starts_at: startsAt.toISOString(),
      duration_minutes: formData.duracao,
      capacity,
      class_type_id: formData.class_type_id,
      instructor_id: formData.instructor_id,
    })
    .eq("id", sessionId);

  if (error) return { ok: false, error: safeError(error) };

  logAudit({
    schoolId: formData.schoolId,
    userId: user.id,
    action: "update_session",
    entityType: "session",
    entityId: sessionId,
    metadata: { class_type_id: formData.class_type_id, data: formData.data, horario: formData.horario },
  });

  return { ok: true };
}

export async function updateSessionDate(
  sessionId: string,
  newStartsAt: string,
  schoolId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const rl = await rateLimitByUser(user.id, "updateSessionDate");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  try {
    await requireOwner(schoolId);
  } catch {
    return { ok: false, error: "Sem permissão" };
  }

  const { error } = await supabase
    .from("sessions")
    .update({ starts_at: newStartsAt })
    .eq("id", sessionId);

  if (error) return { ok: false, error: safeError(error) };

  logAudit({
    schoolId,
    userId: user.id,
    action: "update_session",
    entityType: "session",
    entityId: sessionId,
    metadata: { drag_drop: true, new_starts_at: newStartsAt },
  });

  return { ok: true };
}

export async function getInstructorsForSchool(schoolId: string): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("instructors")
    .select("id, name")
    .eq("school_id", schoolId)
    .order("name");
  return data ?? [];
}
