"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByUser } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { getSchoolId } from "@/lib/school";

export type StudentPack = {
  name: string;
  remaining: number;
};

export type StudentRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isGuest: boolean;
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
      student:students(id, full_name, email, phone, is_guest)
    `)
    .eq("school_id", schoolId)
    .order("first_seen_at", { ascending: false });

  if (!rows) return [];

  const studentIds = rows
    .map((r) => (r.student as unknown as { id: string } | null)?.id)
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

  const sessionStartsMap = new Map(sessions?.map(s => [(s as unknown as { id: string }).id, (s as unknown as { starts_at: string }).starts_at]) ?? []);

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
    const p = sp.pack as unknown as { name: string; is_active: boolean } | null;
    if (!p || !p.is_active) continue;
    const list = packsByStudent.get(sp.student_id) ?? [];
    list.push({ name: p.name, remaining: sp.lessons_remaining });
    packsByStudent.set(sp.student_id, list);
  }

  const now = new Date();
  const result: StudentRecord[] = [];

  for (const r of rows) {
    const s = r.student as unknown as {
      id: string;
      full_name: string;
      email: string | null;
      phone: string | null;
      is_guest: boolean;
    } | null;

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

export async function deleteStudent(studentId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "deleteStudent");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  // get student name + school_id before deleting
  const { data: student } = await supabase
    .from("school_students")
    .select("school_id, student:students(full_name)")
    .eq("student_id", studentId)
    .single();

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
      schoolId: (student as unknown as { school_id: string }).school_id,
      userId: user.id,
      action: "delete_student",
      entityType: "student",
      entityId: studentId,
      metadata: {
        studentName: ((student as unknown as { student: { full_name: string } }).student?.full_name) ?? null,
      },
    });
  }

  return { ok: true };
}
