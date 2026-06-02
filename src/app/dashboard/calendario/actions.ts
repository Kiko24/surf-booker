"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByUser } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { getSchoolId } from "@/lib/school";
import { sendBookingNotification, sendCancellationNotification } from "@/lib/email";

export type SessionAluno = { id: string; name: string; paymentStatus: string };

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
    .select("session_id, student_id, payment_status")
    .in("session_id", sessionIds)
    .in("status", ["confirmed", "attended"]);

  const studentIds = [...new Set((allBookings ?? []).map((b) => b.student_id))];

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name")
    .in("id", studentIds);

  const studentNameMap = new Map((students ?? []).map((s) => [s.id, s.full_name]));

  const bookingMap: Record<string, { count: number; alunos: { id: string; name: string; paymentStatus: string }[] }> = {};
  for (const b of allBookings ?? []) {
    if (!bookingMap[b.session_id]) bookingMap[b.session_id] = { count: 0, alunos: [] };
    bookingMap[b.session_id].count++;
    const name = studentNameMap.get(b.student_id);
    if (name) bookingMap[b.session_id].alunos.push({ id: b.student_id, name, paymentStatus: b.payment_status });
  }

  for (const s of sessions) {
    const d = new Date(s.starts_at);
    const day = d.getUTCDate();
    const hours = d.getUTCHours().toString().padStart(2, "0");
    const minutes = d.getUTCMinutes().toString().padStart(2, "0");

    if (!result[day]) result[day] = [];

    const bData = bookingMap[s.id] ?? { count: 0, alunos: [] as { id: string; name: string; paymentStatus: string }[] };

    const instructor = s.instructors as unknown as { name: string } | null;
    result[day].push({
      id: s.id,
      nome: (s.class_types as unknown as { name: string } | null)?.name ?? "Aula",
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

  const rl = await rateLimitByUser(user.id, "createSession");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

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

  if (error) return { ok: false, error: error.message };

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

export async function cancelSession(sessionId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "cancelSession");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: session } = await supabase
    .from("sessions")
    .select("school_id, starts_at, class_type_id")
    .eq("id", sessionId)
    .single();
  if (!session) return { ok: false, error: "Sessão não encontrada" };

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

  for (const s of students ?? []) {
    if (s.email) {
      sendCancellationNotification({
        studentEmail: s.email,
        studentName: s.full_name,
        schoolName,
        className,
        date,
        time,
      }).catch(() => {});
    }
  }

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);

  if (error) return { ok: false, error: error.message };

  logAudit({
    schoolId: session.school_id,
    userId: user.id,
    action: "cancel_session",
    entityType: "session",
    entityId: sessionId,
  });

  return { ok: true };
}

export async function completeSession(sessionId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "completeSession");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: session } = await supabase
    .from("sessions")
    .select("school_id")
    .eq("id", sessionId)
    .single();
  if (!session) return { ok: false, error: "Sessão não encontrada" };

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, student_id, payment_method, payment_status, pack_purchase_id")
    .eq("session_id", sessionId)
    .in("status", ["confirmed"]);

  for (const b of bookings ?? []) {
    // Cobrar avulso se unpaid
    if (b.payment_method === "single" && b.payment_status === "unpaid") {
      await supabase
        .from("bookings")
        .update({ payment_status: "paid_offline" })
        .eq("id", b.id);
    }

    // Descontar crédito de pack
    if (b.payment_method === "pack" && b.pack_purchase_id) {
      const { data: pp } = await supabase
        .from("pack_purchases")
        .select("id, lessons_remaining")
        .eq("id", b.pack_purchase_id)
        .eq("student_id", b.student_id)
        .eq("status", "active")
        .single();
      if (pp && pp.lessons_remaining >= 1) {
        const newRemaining = pp.lessons_remaining - 1;
        await supabase
          .from("pack_purchases")
          .update({
            lessons_remaining: newRemaining,
            ...(newRemaining === 0 ? { status: "exhausted" } : {}),
          })
          .eq("id", pp.id);
      }
    }

    // Marcar booking como attended
    await supabase
      .from("bookings")
      .update({ status: "attended" })
      .eq("id", b.id);
  }

  const { error } = await supabase
    .from("sessions")
    .update({ status: "completed" })
    .eq("id", sessionId);

  if (error) return { ok: false, error: error.message };

  logAudit({
    schoolId: session.school_id,
    userId: user.id,
    action: "complete_session",
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

  const rl = await rateLimitByUser(user.id, "updateSession");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

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

  if (error) return { ok: false, error: error.message };

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

async function notifyOwnerBooking(
  schoolId: string,
  sessionId: string,
  studentName: string,
  ownerEmail: string
): Promise<void> {
  try {
    const supabase = await createClient();
    const [sessionRes, schoolRes] = await Promise.all([
      supabase.from("sessions").select("starts_at, class_types(name)").eq("id", sessionId).single(),
      supabase.from("schools").select("name").eq("id", schoolId).single(),
    ]);
    const session = sessionRes.data;
    const school = schoolRes.data;
    if (!session || !school) return;

    const d = new Date(session.starts_at);
    const date = d.toLocaleDateString("pt-PT", { day: "numeric", month: "long" });
    const time = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    const className = (session.class_types as unknown as { name: string } | null)?.name ?? "Aula";

    await sendBookingNotification({
      ownerEmail,
      schoolName: school.name,
      studentName,
      className,
      date,
      time,
    });
  } catch {
    // swallow — notification failure must never break the booking
  }
}

export async function createBooking(
  sessionId: string,
  studentId: string,
  schoolId: string,
  options?: { paymentMethod?: "single" | "pack"; packPurchaseId?: string }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "createBooking");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const paymentMethod = options?.paymentMethod ?? "single";
  const packPurchaseId = options?.packPurchaseId;

  if (paymentMethod === "pack") {
    if (!packPurchaseId) return { ok: false, error: "Pack não selecionado" };

    const { data: pp } = await supabase
      .from("pack_purchases")
      .select("id, lessons_remaining")
      .eq("id", packPurchaseId)
      .eq("student_id", studentId)
      .eq("status", "active")
      .single();
    if (!pp || pp.lessons_remaining < 1) return { ok: false, error: "Pack sem aulas restantes" };

    const newRemaining = pp.lessons_remaining - 1;
    const { error: updErr } = await supabase
      .from("pack_purchases")
      .update({
        lessons_remaining: newRemaining,
        ...(newRemaining === 0 ? { status: "exhausted" } : {}),
      })
      .eq("id", pp.id);
    if (updErr) return { ok: false, error: updErr.message };
  }

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
      payment_method: paymentMethod,
      payment_status: "unpaid",
      price_cents: 0,
      pack_purchase_id: packPurchaseId ?? null,
    });

  if (bErr) return { ok: false, error: bErr.message };

  logAudit({
    schoolId: schoolId,
    userId: user.id,
    action: "create_booking",
    entityType: "booking",
    entityId: studentId,
    metadata: { sessionId, studentName: student.full_name, paymentMethod },
  });

  notifyOwnerBooking(schoolId, sessionId, student.full_name, user.email!);

  return { ok: true };
}

export async function addGuestToSession(
  name: string,
  phone: string | undefined,
  sessionId: string,
  schoolId: string
): Promise<{ ok: boolean; error?: string; studentId?: string; studentName?: string }> {
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

  notifyOwnerBooking(schoolId, sessionId, name, user.email!);

  return { ok: true, studentId: student.id, studentName: name };
}

export async function addGroupBooking(
  sessionId: string,
  contactName: string,
  numberOfPeople: number,
  schoolId: string
): Promise<{ ok: boolean; error?: string; students?: { id: string; name: string; paymentStatus: string }[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "addGroupBooking");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("id", schoolId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!school) return { ok: false, error: "Escola não encontrada" };

  const { data: session } = await supabase
    .from("sessions")
    .select("class_type_id")
    .eq("id", sessionId)
    .single();
  if (!session) return { ok: false, error: "Sessão não encontrada" };

  let priceCents = 0;
  if (session.class_type_id) {
    const { data: ct } = await supabase
      .from("class_types")
      .select("price_cents")
      .eq("id", session.class_type_id)
      .single();
    if (ct) priceCents = ct.price_cents;
  }

  const admin = createAdminClient();

  // Create N students
  const studentIds: string[] = [];
  for (let i = 1; i <= numberOfPeople; i++) {
    const name = i === 1 ? `Grupo de ${contactName}` : `Grupo de ${contactName} (${i})`;
    const { data: st, error: err } = await admin
      .from("students")
      .insert({ full_name: name, is_guest: true })
      .select("id")
      .single();
    if (err) {
      for (const sid of studentIds) { await admin.from("students").delete().eq("id", sid); }
      return { ok: false, error: err.message };
    }
    studentIds.push(st.id);
  }

  // Link all to school
  for (const sid of studentIds) {
    const { error: err } = await supabase
      .from("school_students")
      .insert({ school_id: schoolId, student_id: sid });
    if (err) {
      for (const tid of studentIds) { await admin.from("students").delete().eq("id", tid); }
      return { ok: false, error: err.message };
    }
  }

  // Single booking_group linked to the first student
  const { data: bg, error: bgErr } = await supabase
    .from("booking_groups")
    .insert({
      school_id: schoolId,
      session_id: sessionId,
      booked_by_student_id: studentIds[0],
      contact_name: contactName,
      contact_email: `${studentIds[0]}@placeholder.com`,
      contact_phone: "000000000",
      source: "guest",
    })
    .select("id")
    .single();
  if (bgErr) {
    for (const sid of studentIds) { await admin.from("students").delete().eq("id", sid); }
    return { ok: false, error: bgErr.message };
  }

  // One booking per student
  for (let i = 0; i < studentIds.length; i++) {
    const { error: bErr } = await supabase
      .from("bookings")
      .insert({
        booking_group_id: bg.id,
        session_id: sessionId,
        student_id: studentIds[i],
        payment_method: "single",
        payment_status: "unpaid",
        price_cents: priceCents,
      });
    if (bErr) {
      await supabase.from("bookings").delete().eq("booking_group_id", bg.id);
      for (const sid of studentIds) { await admin.from("students").delete().eq("id", sid); }
      return { ok: false, error: bErr.message };
    }
  }

  logAudit({
    schoolId,
    userId: user.id,
    action: "add_group_booking",
    entityType: "booking",
    entityId: studentIds[0],
    metadata: { sessionId, contactName, numberOfPeople, priceCents, totalCents: priceCents * numberOfPeople },
  });

  notifyOwnerBooking(schoolId, sessionId, `Grupo de ${contactName} (${numberOfPeople} pessoas)`, user.email!);

  const groupStudents = studentIds.map((sid, idx) => ({
    id: sid,
    name: idx === 0 ? `Grupo de ${contactName}` : `Grupo de ${contactName} (${idx + 1})`,
    paymentStatus: "unpaid" as const,
  }));

  return { ok: true, students: groupStudents };
}

export type StudentProfilePack = {
  id: string;
  name: string;
  remaining: number;
};

export type StudentProfile = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isGuest: boolean;
  waiverSigned: boolean;
  packs: StudentProfilePack[];
  classLabel: string | null;
  classDate: string | null;
};

export async function getStudentProfile(
  schoolId: string,
  studentId: string
): Promise<StudentProfile | null> {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, email, phone, is_guest, waiver_signed")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) return null;

  // packs
  const { data: packRows } = await supabase
    .from("pack_purchases")
    .select("id, lessons_remaining, pack:packs!inner(name, is_active)")
    .eq("school_id", schoolId)
    .eq("student_id", studentId)
    .eq("status", "active");

  const packs: StudentProfilePack[] = [];
  for (const pr of packRows ?? []) {
    const row = pr as { id: string; lessons_remaining: number; pack: unknown };
    const p = row.pack as { name: string; is_active: boolean } | null;
    if (p?.is_active) packs.push({ id: row.id, name: p.name, remaining: row.lessons_remaining });
  }

  // last/next class
  const { data: bookings } = await supabase
    .from("bookings")
    .select("session_id")
    .eq("student_id", studentId)
    .in("status", ["confirmed", "attended"]);

  const sessionIds = [...new Set((bookings ?? []).map(b => b.session_id))];
  let classLabel: string | null = null;
  let classDate: string | null = null;

  if (sessionIds.length > 0) {
    const { data: sessions } = await supabase
      .from("sessions")
      .select("starts_at")
      .in("id", sessionIds)
      .order("starts_at", { ascending: true });

    const now = new Date();
    let pastDate: Date | null = null;
    let nextDate: Date | null = null;

    for (const s of sessions ?? []) {
      const d = new Date(s.starts_at);
      if (d >= now) { if (!nextDate || d < nextDate) nextDate = d; }
      else { if (!pastDate || d > pastDate) pastDate = d; }
    }

    const target = nextDate ?? pastDate;
    if (target) {
      classLabel = nextDate ? "Próxima aula" : "Última aula";
      classDate = target.toLocaleDateString("pt-PT", { day: "numeric", month: "long" });
    }
  }

  return {
    id: student.id,
    name: student.full_name,
    email: student.email,
    phone: student.phone,
    isGuest: student.is_guest,
    waiverSigned: student.waiver_signed,
    packs,
    classLabel,
    classDate,
  };
}

export type AvailablePack = {
  id: string;
  name: string;
  total_lessons: number;
  price_cents: number;
};

export async function getAvailablePacks(schoolId: string): Promise<AvailablePack[]> {
  const supabase = await createClient();

  const { data: packClassTypeIds } = await supabase
    .from("class_types")
    .select("id")
    .eq("school_id", schoolId)
    .eq("category", "pack");

  const packCtIdList = packClassTypeIds?.map((ct) => ct.id) ?? [];

  const { data: packsFromTable } = packCtIdList.length > 0
    ? await supabase
        .from("packs")
        .select("id, name, total_lessons, price_cents")
        .eq("school_id", schoolId)
        .eq("is_active", true)
        .in("class_type_id", packCtIdList)
        .order("name")
    : { data: [] as { id: string; name: string; total_lessons: number; price_cents: number }[] };

  const { data: packClassTypes } = await supabase
    .from("class_types")
    .select("id, name, total_lessons, price_cents")
    .eq("school_id", schoolId)
    .eq("category", "pack")
    .eq("is_active", true);

  const result: AvailablePack[] = [];

  if (packsFromTable) result.push(...packsFromTable);

  if (packClassTypes) {
    for (const ct of packClassTypes) {
      if (ct.total_lessons) {
        result.push({
          id: ct.id,
          name: ct.name,
          total_lessons: ct.total_lessons,
          price_cents: ct.price_cents,
        });
      }
    }
  }

  return result;
}

export async function buyPack(
  studentId: string,
  packId: string,
  schoolId: string,
  lessonsOverride?: number
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "buyPack");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: pack } = await supabase
    .from("packs")
    .select("total_lessons")
    .eq("id", packId)
    .eq("school_id", schoolId)
    .single();
  if (!pack) return { ok: false, error: "Pack não encontrado" };

  if (lessonsOverride !== undefined && (isNaN(lessonsOverride) || lessonsOverride < 1 || lessonsOverride > 100)) {
    return { ok: false, error: "Número de aulas inválido" };
  }

  const { error } = await supabase.from("pack_purchases").insert({
    school_id: schoolId,
    pack_id: packId,
    student_id: studentId,
    lessons_remaining: lessonsOverride ?? pack.total_lessons,
  });

  if (error) return { ok: false, error: error.message };

  logAudit({
    schoolId,
    userId: user.id,
    action: "buy_pack",
    entityType: "pack_purchase",
    entityId: packId,
    metadata: { studentId, lessons: pack.total_lessons },
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

export async function togglePaymentStatus(
  sessionId: string,
  studentId: string,
  schoolId: string
): Promise<{ ok: boolean; error?: string; newStatus?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, payment_status")
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (!booking) return { ok: false, error: "Booking não encontrado" };

  const newStatus = booking.payment_status === "paid_offline" ? "unpaid" : "paid_offline";

  const { error } = await supabase
    .from("bookings")
    .update({ payment_status: newStatus })
    .eq("id", booking.id);

  if (error) return { ok: false, error: error.message };

  return { ok: true, newStatus };
}
