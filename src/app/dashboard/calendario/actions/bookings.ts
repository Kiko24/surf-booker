"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByUser, rateLimitPublic } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { safeError } from "@/lib/safe-error";
import { requireOwner } from "@/lib/school";
import { assertValidOrigin } from "@/lib/csrf";

type ClassTypeName = { name: string };

import type { SessionAluno } from "./sessions";

export async function notifyOwnerBooking(
  schoolId: string,
  sessionId: string,
  studentName: string,
): Promise<void> {
  try {
    const rl = await rateLimitPublic("notifyOwner", 10, "60 s");
    if (!rl.ok) {
      console.warn("Rate limit exceeded for notifyOwnerBooking", { schoolId });
      return;
    }

    const admin = createAdminClient();
    const [sessionRes, schoolRes] = await Promise.all([
      admin.from("sessions").select("starts_at, class_types(name)").eq("id", sessionId).single(),
      admin.from("schools").select("name, owner_user_id").eq("id", schoolId).single(),
    ]);
    const session = sessionRes.data;
    const school = schoolRes.data;
    if (!session || !school) return;

    const { data: ownerUser } = await admin.auth.admin.getUserById(school.owner_user_id);
    const ownerEmail = ownerUser?.user?.email;
    if (!ownerEmail) return;

    const d = new Date(session.starts_at);
    const date = d.toLocaleDateString("pt-PT", { day: "numeric", month: "long" });
    const time = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    const className = (session.class_types as unknown as ClassTypeName | null)?.name ?? "Aula";

    const { sendBookingNotification } = await import("@/lib/email");
    await sendBookingNotification({
      ownerEmail,
      schoolName: school.name,
      studentName,
      className,
      date,
      time,
    });
  } catch (err) {
    console.error("Failed to send booking notification");
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

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const rl = await rateLimitByUser(user.id, "createBooking");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  try {
    await requireOwner(schoolId);
  } catch {
    return { ok: false, error: "Sem permissão" };
  }

  const paymentMethod = options?.paymentMethod ?? "single";
  const packPurchaseId = options?.packPurchaseId;

  if (paymentMethod === "pack") {
    if (!packPurchaseId) return { ok: false, error: "Pack não selecionado" };

    const { data: pp } = await supabase
      .from("pack_purchases")
      .select("id")
      .eq("id", packPurchaseId)
      .eq("student_id", studentId)
      .eq("status", "active")
      .maybeSingle();
    if (!pp) return { ok: false, error: "Pack sem aulas restantes" };

    const { data: ok, error: rpcErr } = await supabase.rpc("decrement_pack_credit", {
      p_purchase_id: packPurchaseId,
    });
    if (rpcErr) return { ok: false, error: safeError(rpcErr) };
    if (!ok) return { ok: false, error: "Pack sem aulas restantes" };
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

  if (bgErr) return { ok: false, error: safeError(bgErr) };

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

  if (bErr) return { ok: false, error: safeError(bErr) };

  logAudit({
    schoolId: schoolId,
    userId: user.id,
    action: "create_booking",
    entityType: "booking",
    entityId: studentId,
    metadata: { sessionId, studentName: student.full_name, paymentMethod },
  });

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

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

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
  if (sErr) return { ok: false, error: safeError(sErr) };

  const { error: ssErr } = await supabase
    .from("school_students")
    .insert({ school_id: schoolId, student_id: student.id });
  if (ssErr) return { ok: false, error: safeError(ssErr) };

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
  if (bgErr) return { ok: false, error: safeError(bgErr) };

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
  if (bErr) return { ok: false, error: safeError(bErr) };

  logAudit({
    schoolId: schoolId,
    userId: user.id,
    action: "add_guest_to_session",
    entityType: "booking",
    entityId: student.id,
    metadata: { sessionId, guestName: name, phone },
  });

  return { ok: true, studentId: student.id, studentName: name };
}

export async function addGroupBooking(
  sessionId: string,
  contactName: string,
  numberOfPeople: number,
  schoolId: string
): Promise<{ ok: boolean; error?: string; student?: SessionAluno }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

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

  // Create 1 student (the contact person / group representative)
  const groupName = `Grupo de ${contactName}`;
  const { data: student, error: sErr } = await admin
    .from("students")
    .insert({ full_name: groupName, is_guest: true })
    .select("id")
    .single();
  if (sErr) return { ok: false, error: safeError(sErr) };

  const { error: ssErr } = await supabase
    .from("school_students")
    .insert({ school_id: schoolId, student_id: student.id });
  if (ssErr) {
    await admin.from("students").delete().eq("id", student.id);
    return { ok: false, error: safeError(ssErr) };
  }

  const { data: bg, error: bgErr } = await supabase
    .from("booking_groups")
    .insert({
      school_id: schoolId,
      session_id: sessionId,
      booked_by_student_id: student.id,
      contact_name: contactName,
      contact_email: `${student.id}@placeholder.com`,
      contact_phone: "000000000",
      source: "guest",
      group_size: numberOfPeople,
    })
    .select("id")
    .single();
  if (bgErr) {
    await admin.from("students").delete().eq("id", student.id);
    return { ok: false, error: safeError(bgErr) };
  }

  const totalPrice = priceCents * numberOfPeople;

  const { data: booking, error: bErr } = await supabase
    .from("bookings")
    .insert({
      booking_group_id: bg.id,
      session_id: sessionId,
      student_id: student.id,
      payment_method: "single",
      payment_status: "unpaid",
      price_cents: totalPrice,
    })
    .select("id")
    .single();
  if (bErr) {
    await supabase.from("bookings").delete().eq("booking_group_id", bg.id);
    await admin.from("students").delete().eq("id", student.id);
    return { ok: false, error: safeError(bErr) };
  }

  logAudit({
    schoolId,
    userId: user.id,
    action: "add_group_booking",
    entityType: "booking",
    entityId: student.id,
    metadata: { sessionId, contactName, numberOfPeople, totalPrice },
  });

  return {
    ok: true,
    student: {
      id: student.id,
      bookingId: booking.id,
      name: groupName,
      paymentStatus: "unpaid" as const,
      attendanceStatus: "confirmed" as const,
      groupSize: numberOfPeople,
    },
  };
}

export async function togglePaymentStatus(
  sessionId: string,
  studentId: string,
  schoolId: string
): Promise<{ ok: boolean; error?: string; newStatus?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  try {
    await requireOwner(schoolId);
  } catch {
    return { ok: false, error: "Sem permissão" };
  }

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

  if (error) return { ok: false, error: safeError(error) };

  logAudit({
    schoolId,
    userId: user.id,
    action: "toggle_payment_status",
    entityType: "booking",
    entityId: booking.id,
    metadata: { sessionId, studentId, previousStatus: booking.payment_status, newStatus },
  });

  return { ok: true, newStatus };
}

export async function cancelBooking(
  sessionId: string,
  studentId: string,
  schoolId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("id", schoolId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!school) return { ok: false, error: "Sem permissão" };

  const rl = await rateLimitByUser(user.id, "cancelBooking");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (!booking) return { ok: false, error: "Reserva não encontrada" };

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled_by_school", cancelled_at: new Date().toISOString() })
    .eq("id", booking.id);

  if (error) return { ok: false, error: safeError(error) };

  logAudit({
    schoolId,
    userId: user.id,
    action: "cancel_booking",
    entityType: "booking",
    entityId: booking.id,
    metadata: { sessionId, studentId },
  });

  return { ok: true };
}

export async function cancelBookingsBulk(
  sessionId: string,
  studentIds: string[],
  schoolId: string
): Promise<{ ok: boolean; error?: string }> {
  if (studentIds.length === 0) return { ok: false, error: "Nenhum aluno selecionado" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("id", schoolId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!school) return { ok: false, error: "Sem permissão" };

  const rl = await rateLimitByUser(user.id, "cancelBooking");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, student_id")
    .eq("session_id", sessionId)
    .in("student_id", studentIds);

  if (!bookings || bookings.length === 0) return { ok: false, error: "Reservas não encontradas" };

  const bookingIds = bookings.map((b) => b.id);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled_by_school", cancelled_at: now })
    .in("id", bookingIds);

  if (error) return { ok: false, error: safeError(error) };

  logAudit({
    schoolId,
    userId: user.id,
    action: "cancel_booking",
    entityType: "booking",
    entityId: bookingIds.join(","),
    metadata: { sessionId, studentIds, count: studentIds.length },
  });

  return { ok: true };
}
