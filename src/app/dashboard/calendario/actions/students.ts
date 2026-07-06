"use server";

import { createClient } from "@/lib/supabase/server";
import { rateLimitByUser } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export type StudentProfilePack = {
  id: string;
  name: string;
  start: string | null;
  end: string | null;
  sessionsTotal: number;
  sessionsUsed: number;
  remaining: number;
  status: string;
};

export type StudentProfile = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isGuest: boolean;
  createdAt: string;
  totalSessions: number;
  packs: StudentProfilePack[];
};

export async function getSchoolStudents(schoolId: string): Promise<{ id: string; full_name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("school_students")
    .select("student_id, students(id, full_name)")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data
    .map((s) => {
      const student = s.students as unknown as { id: string; full_name: string } | null;
      return student ? { id: student.id, full_name: student.full_name } : null;
    })
    .filter((s): s is { id: string; full_name: string } => s !== null);
}

export async function getStudentProfile(
  studentId: string,
  schoolId: string
): Promise<StudentProfile | null> {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, email, phone, notes, is_guest, created_at")
    .eq("id", studentId)
    .single();

  if (!student) return null;

  const [{ count: totalSessions }, { data: packs }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("session.school_id", schoolId)
      .in("status", ["confirmed", "attended", "no_show"]),
    supabase
      .from("pack_purchases")
      .select("id, name, start_date, end_date, sessions_total, sessions_used, status")
      .eq("student_id", studentId)
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    id: student.id,
    fullName: student.full_name,
    email: student.email,
    phone: student.phone,
    notes: student.notes,
    isGuest: student.is_guest,
    createdAt: student.created_at,
    totalSessions: totalSessions ?? 0,
    packs: (packs ?? []).map((p) => {
      const total = p.sessions_total ?? 0;
      const used = p.sessions_used ?? 0;
      return {
        id: p.id,
        name: p.name ?? "Pack",
        start: p.start_date,
        end: p.end_date,
        sessionsTotal: total,
        sessionsUsed: used,
        remaining: total - used,
        status: p.status ?? "unknown",
      };
    }),
  };
}

export type AvailablePack = {
  id: string;
  name: string;
  price_cents: number;
  total_lessons: number;
};

export async function getAvailablePacks(schoolId: string): Promise<AvailablePack[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("packs")
    .select("id, name, price_cents, total_lessons")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("price_cents", { ascending: true });
  return (data ?? []).map((p) => ({ id: p.id, name: p.name, price_cents: p.price_cents, total_lessons: p.total_lessons }));
}

export async function buyPack(
  studentId: string,
  packId: string,
  schoolId: string,
  sessionsToAssign?: number
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "buyPack");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: pack } = await supabase
    .from("packs")
    .select("sessions")
    .eq("id", packId)
    .single();
  if (!pack) return { ok: false, error: "Pack não encontrado" };

  const { error: err } = await supabase.from("pack_purchases").insert({
    student_id: studentId,
    school_id: schoolId,
    pack_id: packId,
    sessions_total: sessionsToAssign ?? pack.sessions,
    sessions_used: 0,
    status: "active",
  });

  if (err) return { ok: false, error: err.message };

  logAudit({
    schoolId,
    userId: user.id,
    action: "buy_pack",
    entityType: "pack_purchase",
    entityId: studentId,
    metadata: { packId },
  });

  return { ok: true };
}
