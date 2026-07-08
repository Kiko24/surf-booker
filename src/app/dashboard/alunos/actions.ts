"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByUser } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { requireOwner } from "@/lib/school";
import { assertValidOrigin } from "@/lib/csrf";
import { sendStudentInvite } from "@/lib/email";
import { buyPack } from "../calendario/actions";

export type StudentPack = {
  name: string;
  remaining: number;
};

type PackInfo = { name: string; is_active: boolean };

export type StudentRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isGuest: boolean;
  waiverSigned: boolean;
  hasActivePack: boolean;
  totalClasses: number;
  firstSeenAt: string;
  packs: StudentPack[];
};

export async function getStudents(schoolId: string): Promise<StudentRecord[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    await requireOwner(schoolId);
  } catch {
    return [];
  }

  const admin = createAdminClient();

  const { data: rows, error: ssErr } = await admin
    .from("school_students")
    .select("student_id, first_seen_at")
    .eq("school_id", schoolId)
    .order("first_seen_at", { ascending: false });

  if (!rows) return [];

  const studentIds = rows.map(r => r.student_id).filter(Boolean);
  if (studentIds.length === 0) return [];

  const { data: studentRows, error: stErr } = await admin
    .from("students")
    .select("id, full_name, email, phone, is_guest, waiver_signed")
    .in("id", studentIds);

  const studentMap = new Map(studentRows?.map(s => [s.id, s]) ?? []);

  // get bookings for each student
  const { data: allBookings } = await admin
    .from("bookings")
    .select("student_id, session_id, status")
    .in("student_id", studentIds)
    .in("status", ["confirmed", "attended", "no_show"]);

  // count total classes per student
  const totalClassesMap = new Map<string, number>();
  if (allBookings) {
    for (const b of allBookings) {
      totalClassesMap.set(b.student_id, (totalClassesMap.get(b.student_id) ?? 0) + 1);
    }
  }



  // get pack purchases for all students
  const { data: studentPacks } = await admin
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

  const result: StudentRecord[] = [];

  for (const r of rows) {
    const s = studentMap.get(r.student_id) ?? null;
    if (!s) continue;

    result.push({
      id: s.id,
      name: s.full_name,
      email: s.email,
      phone: s.phone,
      isGuest: s.is_guest,
      waiverSigned: s.waiver_signed ?? false,
      hasActivePack: (packsByStudent.get(s.id)?.length ?? 0) > 0,
      totalClasses: totalClassesMap.get(s.id) ?? 0,
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

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const rl = await rateLimitByUser(user.id, "toggleWaiver");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  // find student's school (admin client, same as getStudents)
  const admin = createAdminClient();
  const { data: link } = await admin
    .from("school_students")
    .select("school_id")
    .eq("student_id", studentId)
    .maybeSingle();
  if (!link) return { ok: false, error: "Aluno não encontrado" };

  // verify ownership
  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("id", link.school_id)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!school) return { ok: false, error: "Sem permissão" };
  const { error } = await admin
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

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const rl = await rateLimitByUser(user.id, "deleteStudent");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  // verify ownership before deleting
  const admin = createAdminClient();
  const { data: link } = await admin
    .from("school_students")
    .select("school_id")
    .eq("student_id", studentId)
    .maybeSingle();
  if (!link) return { ok: false, error: "Aluno não encontrado" };

  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("id", link.school_id)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!school) return { ok: false, error: "Sem permissão" };

  const { error: bErr } = await admin.from("bookings").delete().eq("student_id", studentId);
  if (bErr) return { ok: false, error: bErr.message };

  const { error: bgErr } = await admin.from("booking_groups").delete().eq("booked_by_student_id", studentId);
  if (bgErr) return { ok: false, error: bgErr.message };

  const { error: ppErr } = await admin.from("pack_purchases").delete().eq("student_id", studentId);
  if (ppErr) return { ok: false, error: ppErr.message };

  const { error: ssErr } = await admin.from("school_students").delete().eq("student_id", studentId);
  if (ssErr) return { ok: false, error: ssErr.message };

  const { error: sErr } = await admin.from("students").delete().eq("id", studentId);
  if (sErr) return { ok: false, error: sErr.message };

  logAudit({
    schoolId: link.school_id,
    userId: user.id,
    action: "delete_student",
    entityType: "student",
    entityId: studentId,
    metadata: { studentName: null },
  });

  return { ok: true };
}

export async function deleteStudentsBulk(studentIds: string[]): Promise<{ ok: boolean; error?: string }> {
  if (studentIds.length === 0) return { ok: false, error: "Nenhum aluno selecionado" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const rl = await rateLimitByUser(user.id, "deleteStudentsBulk");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const admin = createAdminClient();

  // verify ownership using the first student's school
  const { data: link } = await admin
    .from("school_students")
    .select("school_id")
    .eq("student_id", studentIds[0])
    .maybeSingle();
  if (!link) return { ok: false, error: "Aluno não encontrado" };

  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("id", link.school_id)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!school) return { ok: false, error: "Sem permissão" };

  const { error: bErr } = await admin.from("bookings").delete().in("student_id", studentIds);
  if (bErr) return { ok: false, error: bErr.message };

  const { error: bgErr } = await admin.from("booking_groups").delete().in("booked_by_student_id", studentIds);
  if (bgErr) return { ok: false, error: bgErr.message };

  const { error: ppErr } = await admin.from("pack_purchases").delete().in("student_id", studentIds);
  if (ppErr) return { ok: false, error: ppErr.message };

  const { error: ssErr } = await admin.from("school_students").delete().in("student_id", studentIds);
  if (ssErr) return { ok: false, error: ssErr.message };

  const { error: sErr } = await admin.from("students").delete().in("id", studentIds);
  if (sErr) return { ok: false, error: sErr.message };

  for (const studentId of studentIds) {
    logAudit({
      schoolId: link.school_id,
      userId: user.id,
      action: "delete_student",
      entityType: "student",
      entityId: studentId,
      metadata: { studentName: null },
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

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const rl = await rateLimitByUser(user.id, "createStudent");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: school } = await supabase
    .from("schools")
    .select("id, name")
    .eq("id", schoolId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!school) return { ok: false, error: "Escola não encontrada" };

  const trimmedName = name.trim();
  if (!trimmedName) return { ok: false, error: "Nome é obrigatório" };
  if (trimmedName.length > 120) return { ok: false, error: "Nome demasiado longo (máx. 120 caracteres)" };

  if (phone && !/^[0-9]+$/.test(phone)) return { ok: false, error: "Telemóvel inválido — apenas dígitos, sem espaços" };
  if (phone && (phone.length < 6 || phone.length > 20)) return { ok: false, error: "Telemóvel deve ter entre 6 e 20 dígitos" };

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

  if (email) {
    const normalizedEmail = email.trim().toLowerCase();

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "invite",
      email: normalizedEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/perfil`,
      },
    });

    if (!linkError && linkData?.user) {
      await admin.from("students").update({
        auth_user_id: linkData.user.id,
        is_guest: false,
      }).eq("id", student.id);

      if (linkData.properties?.action_link) {
        await sendStudentInvite({
          email: normalizedEmail,
          studentName: trimmedName,
          schoolName: school.name,
          inviteLink: linkData.properties.action_link,
        });
      }
    } else if (linkError) {
      const { data: authUsers } = await admin.auth.admin.listUsers();
      const existingUser = authUsers?.users?.find((u) => u.email === normalizedEmail);
      if (existingUser) {
        await admin.from("students").update({
          auth_user_id: existingUser.id,
          is_guest: false,
        }).eq("id", student.id);
      }
    }
  }

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

  revalidatePath("/dashboard/alunos");
  return { ok: true, studentId: student.id };
}

export type BookingHistoryItem = {
  id: string;
  startsAt: string;
  classTypeName: string | null;
  instructorName: string | null;
  status: string;
  groupSize?: number;
};

export type StudentProfileData = {
  bookings: BookingHistoryItem[];
  activePack: { id: string; name: string; remaining: number; total: number } | null;
  stats: { totalClasses: number; attendanceRate: number | null; groupSize?: number };
};

export async function getStudentProfile(
  studentId: string,
  schoolId: string
): Promise<StudentProfileData> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { bookings: [], activePack: null, stats: { totalClasses: 0, attendanceRate: null } };

  try {
    await requireOwner(schoolId);
  } catch {
    return { bookings: [], activePack: null, stats: { totalClasses: 0, attendanceRate: null } };
  }

  // fetch bookings with session, class_type, instructor details
  const { data: bookingRows } = await supabase
    .from("bookings")
    .select(`
      id,
      status,
      booking_group_id,
      session:sessions!inner(
        starts_at,
        instructor_id,
        class_type_id,
        class_types(name)
      )
    `)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  // fetch group_size from booking_groups via admin client
  // (avoids PostgREST composite FK embedding ambiguity)
  const bgIds = [
    ...new Set((bookingRows ?? []).map((r) => r.booking_group_id as string).filter(Boolean)),
  ] as string[];
  let groupSizeMap = new Map<string, number>();
  if (bgIds.length > 0) {
    const adminClient = createAdminClient();
    const { data: bgRows } = await adminClient
      .from("booking_groups")
      .select("id, group_size")
      .in("id", bgIds);
    groupSizeMap = new Map((bgRows ?? []).map((g) => [g.id, g.group_size]));
  }

  let bookingItems: BookingHistoryItem[] = [];
  let attendedCount = 0;
  let noShowCount = 0;
  let totalCount = 0;

  if (bookingRows) {
    for (const b of bookingRows) {
      const sess = b.session as unknown as {
        starts_at: string;
        instructor_id: string | null;
        class_type_id: string | null;
        class_types: { name: string } | null;
      } | null;

      if (!sess) continue;

      const bookingStatus = b.status as string;
      const gs = groupSizeMap.get(b.booking_group_id as string) ?? 1;

      bookingItems.push({
        id: b.id as string,
        startsAt: sess.starts_at,
        classTypeName: sess.class_types?.name ?? null,
        instructorName: null, // will resolve below
        status: bookingStatus,
        groupSize: gs > 1 ? gs : undefined,
      });

      if (bookingStatus === "attended") attendedCount++;
      else if (bookingStatus === "no_show") noShowCount++;
      if (["confirmed", "attended", "no_show"].includes(bookingStatus)) totalCount++;
    }
  }

  // resolve instructor names in batch
  const instructorIds = [...new Set(bookingRows?.map(b => {
    const sess = b.session as unknown as { instructor_id: string | null } | null;
    return sess?.instructor_id;
  }).filter(Boolean) as string[])];

  const instructorMap = new Map<string, string>();
  if (instructorIds.length > 0) {
    const { data: instructors } = await supabase
      .from("instructors")
      .select("id, name")
      .in("id", instructorIds);
    for (const inst of instructors ?? []) {
      instructorMap.set(inst.id, inst.name);
    }
  }

  for (const item of bookingItems) {
    const sess = bookingRows?.find(b => b.id === item.id)?.session as unknown as {
      instructor_id: string | null;
    } | null;
    if (sess?.instructor_id) {
      item.instructorName = instructorMap.get(sess.instructor_id) ?? null;
    }
  }

  // fetch active pack
  const { data: packRow } = await supabase
    .from("pack_purchases")
    .select("id, lessons_remaining, pack:packs!inner(name, total_lessons)")
    .eq("student_id", studentId)
    .eq("school_id", schoolId)
    .eq("status", "active")
    .gt("lessons_remaining", 0)
    .order("purchased_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let activePack: StudentProfileData["activePack"] = null;
  if (packRow) {
    const p = packRow.pack as unknown as { name: string; total_lessons: number } | null;
    if (p) {
      activePack = {
        id: packRow.id,
        name: p.name,
        remaining: packRow.lessons_remaining,
        total: p.total_lessons,
      };
    }
  }

  return {
    bookings: bookingItems,
    activePack,
    stats: {
      totalClasses: totalCount,
      attendanceRate:
        attendedCount + noShowCount > 0
          ? Math.round((attendedCount / (attendedCount + noShowCount)) * 100)
          : null,
      groupSize: bookingItems.find((b) => b.groupSize)?.groupSize,
    },
  };
}

export async function cancelPackPurchase(
  purchaseId: string,
  schoolId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const rl = await rateLimitByUser(user.id, "cancelPack");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  try {
    await requireOwner(schoolId);
  } catch {
    return { ok: false, error: "Sem permissão" };
  }

  const { error } = await supabase
    .from("pack_purchases")
    .update({ status: "cancelled" })
    .eq("id", purchaseId)
    .eq("school_id", schoolId);

  if (error) return { ok: false, error: error.message };

  logAudit({
    schoolId,
    userId: user.id,
    action: "cancel_pack",
    entityType: "pack_purchase",
    entityId: purchaseId,
  });

  return { ok: true };
}

export async function updatePackRemaining(
  purchaseId: string,
  schoolId: string,
  remaining: number
): Promise<{ ok: boolean; error?: string }> {
  if (isNaN(remaining) || remaining < 0 || remaining > 100) {
    return { ok: false, error: "Número de aulas inválido" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const rl = await rateLimitByUser(user.id, "updatePack");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  try {
    await requireOwner(schoolId);
  } catch {
    return { ok: false, error: "Sem permissão" };
  }

  const { error } = await supabase
    .from("pack_purchases")
    .update({ lessons_remaining: remaining })
    .eq("id", purchaseId)
    .eq("school_id", schoolId);

  if (error) return { ok: false, error: error.message };

  logAudit({
    schoolId,
    userId: user.id,
    action: "update_pack",
    entityType: "pack_purchase",
    entityId: purchaseId,
    metadata: { remaining },
  });

  return { ok: true };
}
