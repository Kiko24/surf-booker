"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByUser } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { getSchoolId } from "@/lib/school";
import { buyPack } from "../calendario/actions";

export type StudentPack = {
  name: string;
  remaining: number;
};

type StudentId = { id: string };
type StudentWithName = { id: string; full_name: string };
type StudentDetails = { id: string; full_name: string; email: string | null; phone: string | null; is_guest: boolean };
type PackInfo = { name: string; is_active: boolean };
type StudentWithWaiver = { waiver_signed: boolean };
type SchoolOwner = { owner_user_id: string };
type NestedStudentName = { student: { full_name: string } };
type SessionRow = { id: string; starts_at: string };
type DeleteStudentRecord = { school_id: string; student: { full_name: string } | null };

export type StudentRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isGuest: boolean;
  waiverSigned: boolean;
  hasActivePack: boolean;
  classLabel: string | null;
  classDate: string | null;
  classDateRaw: string | null;
  firstSeenAt: string;
  packs: StudentPack[];
};

export async function getStudents(schoolId: string): Promise<StudentRecord[]> {
  const supabase = await createClient();

  // get all school_students for this school, joined with students
  const { data: rows } = await supabase
    .from("school_students")
    .select(`
      first_seen_at,
      student:students(id, full_name, email, phone, is_guest, waiver_signed)
    `)
    .eq("school_id", schoolId)
    .order("first_seen_at", { ascending: false });

  if (!rows) return [];

  const studentIds = rows
    .map((r) => (r.student as unknown as StudentId | null)?.id)
    .filter(Boolean);

  if (studentIds.length === 0) return [];

  // get bookings for each student
  const { data: allBookings } = await supabase
    .from("bookings")
    .select("student_id, session_id")
    .in("student_id", studentIds)
    .in("status", ["confirmed", "attended"]);

  const sessionIds = [...new Set((allBookings ?? []).map(b => b.session_id))];

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, starts_at")
    .in("id", sessionIds)
    .order("starts_at", { ascending: true });

  const sessionStartsMap = new Map(sessions?.map(s => { const row = s as SessionRow; return [row.id, row.starts_at]; }) ?? []);

  // group bookings by student
  const studentBookings = new Map<string, string[]>();
  if (allBookings) {
    for (const b of allBookings) {
      if (!studentBookings.has(b.student_id)) studentBookings.set(b.student_id, []);
      studentBookings.get(b.student_id)!.push(b.session_id);
    }
  }

  // get pack purchases for all students
  const { data: studentPacks } = await supabase
    .from("pack_purchases")
    .select("student_id, lessons_remaining, pack:packs!inner(name, is_active)")
    .eq("school_id", schoolId)
    .eq("status", "active");

  const packsByStudent = new Map<string, StudentPack[]>();
  for (const sp of studentPacks ?? []) {
    const p = sp.pack as unknown as PackInfo | null;
    if (!p || !p.is_active) continue;
    const list = packsByStudent.get(sp.student_id) ?? [];
    list.push({ name: p.name, remaining: sp.lessons_remaining });
    packsByStudent.set(sp.student_id, list);
  }

  const now = new Date();
  const result: StudentRecord[] = [];

  for (const r of rows) {
    const s = r.student as unknown as StudentDetails | null;

    if (!s) continue;

    const bookingSessions = studentBookings.get(s.id) ?? [];
    let pastDate: Date | null = null;
    let nextDate: Date | null = null;

    for (const sid of bookingSessions) {
      const startsAt = sessionStartsMap.get(sid);
      if (!startsAt) continue;
      const d = new Date(startsAt);
      if (d >= now) {
        if (!nextDate || d < nextDate) nextDate = d;
      } else {
        if (!pastDate || d > pastDate) pastDate = d;
      }
    }

    const targetDate = nextDate ?? pastDate;
    const label = nextDate ? "Próxima aula" : pastDate ? "Última aula" : null;

    result.push({
      id: s.id,
      name: s.full_name,
      email: s.email,
      phone: s.phone,
      isGuest: s.is_guest,
      waiverSigned: (s as unknown as StudentWithWaiver).waiver_signed ?? false,
      hasActivePack: (packsByStudent.get(s.id)?.length ?? 0) > 0,
      classLabel: label,
      classDate: targetDate
        ? targetDate.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })
        : null,
      classDateRaw: targetDate ? targetDate.toISOString().split("T")[0] : null,
      firstSeenAt: r.first_seen_at,
      packs: packsByStudent.get(s.id) ?? [],
    });
  }

  return result;
}

export async function toggleWaiver(
  studentId: string,
  signed: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "toggleWaiver");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: school } = await supabase
    .from("school_students")
    .select("school:schools!inner(owner_user_id)")
    .eq("student_id", studentId)
    .maybeSingle();
  if (!school) return { ok: false, error: "Aluno não encontrado na escola" };
  if ((school.school as unknown as SchoolOwner).owner_user_id !== user.id) {
    return { ok: false, error: "Sem permissão" };
  }

  const { error } = await supabase
    .from("students")
    .update({ waiver_signed: signed })
    .eq("id", studentId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteStudent(studentId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "deleteStudent");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  // verify ownership before deleting
  const { data: student } = await supabase
    .from("school_students")
    .select("school_id, student:students(full_name), school:schools!inner(owner_user_id)")
    .eq("student_id", studentId)
    .eq("school.owner_user_id", user.id)
    .maybeSingle();
  if (!student) return { ok: false, error: "Aluno não encontrado" };

  const admin = createAdminClient();

  const { error: bErr } = await admin.from("bookings").delete().eq("student_id", studentId);
  if (bErr) return { ok: false, error: bErr.message };

  const { error: bgErr } = await admin.from("booking_groups").delete().eq("booked_by_student_id", studentId);
  if (bgErr) return { ok: false, error: bgErr.message };

  const { error: ssErr } = await admin.from("school_students").delete().eq("student_id", studentId);
  if (ssErr) return { ok: false, error: ssErr.message };

  const { error: sErr } = await admin.from("students").delete().eq("id", studentId);
  if (sErr) return { ok: false, error: sErr.message };

  if (student) {
    logAudit({
      schoolId: (student as unknown as DeleteStudentRecord).school_id,
      userId: user.id,
      action: "delete_student",
      entityType: "student",
      entityId: studentId,
      metadata: {
        studentName: ((student as unknown as DeleteStudentRecord).student?.full_name) ?? null,
      },
    });
  }

  return { ok: true };
}

export async function createStudent(
  name: string,
  phone: string | undefined,
  email: string | undefined,
  packId: string | undefined,
  lessonsRemaining: string | undefined,
  schoolId: string
): Promise<{ ok: boolean; error?: string; studentId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "createStudent");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("id", schoolId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!school) return { ok: false, error: "Escola não encontrada" };

  const trimmedName = name.trim();
  if (!trimmedName) return { ok: false, error: "Nome é obrigatório" };
  if (trimmedName.length > 120) return { ok: false, error: "Nome demasiado longo (máx. 120 caracteres)" };

  if (phone && !/^[0-9\s]+$/.test(phone)) return { ok: false, error: "Telemóvel inválido — apenas dígitos e espaços" };
  if (phone && (phone.replace(/\s/g, "").length < 6 || phone.replace(/\s/g, "").length > 20)) return { ok: false, error: "Telemóvel deve ter entre 6 e 20 dígitos" };

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { ok: false, error: "Email inválido" };
    if (email.length > 160) return { ok: false, error: "Email demasiado longo (máx. 160 caracteres)" };
  }

  const admin = createAdminClient();

  const { data: student, error: sErr } = await admin
    .from("students")
    .insert({ full_name: trimmedName, is_guest: true, ...(phone ? { phone } : {}), ...(email ? { email } : {}) })
    .select("id")
    .single();
  if (sErr) return { ok: false, error: sErr.message };

  const { error: ssErr } = await supabase
    .from("school_students")
    .insert({ school_id: schoolId, student_id: student.id });
  if (ssErr) return { ok: false, error: ssErr.message };

  if (packId) {
    let remaining: number | undefined;
    if (lessonsRemaining) {
      remaining = parseInt(lessonsRemaining, 10);
      if (isNaN(remaining) || remaining < 1 || remaining > 100) return { ok: false, error: "Aulas restantes deve ser um número entre 1 e 100" };
    }
    const res = await buyPack(student.id, packId, schoolId, remaining);
    if (!res.ok) return { ok: false, error: res.error };
  }

  logAudit({
    schoolId,
    userId: user.id,
    action: "create_student",
    entityType: "student",
    entityId: student.id,
    metadata: { studentName: trimmedName, hasPack: !!packId, hasEmail: !!email },
  });

  return { ok: true, studentId: student.id };
}
