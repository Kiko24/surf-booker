"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type PublicSchoolImage = {
  id: string;
  public_url: string;
};

export type PublicInstructor = {
  name: string;
  level: string;
  avatar_url: string | null;
};

export type PublicService = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  category: string | null;
  modality: string;
};

export type PublicSession = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  class_type_name: string;
  price_cents: number;
  capacity: number;
  booked: number;
};

export type PublicSchoolData = {
  school: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    location: string | null;
    logo_url: string | null;
    phone: string | null;
    timezone: string;
  };
  images: PublicSchoolImage[];
  instructors: PublicInstructor[];
  services: PublicService[];
  upcomingSessions: PublicSession[];
};

export async function getPublicSchoolData(
  slug: string
): Promise<PublicSchoolData | null> {
  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[getPublicSchoolData] createAdminClient error:", e);
    return null;
  }

  let school;
  try {
    const res = await admin
      .from("schools")
      .select("id, name, slug, description, location, logo_url, timezone, phone")
      .eq("slug", slug)
      .maybeSingle();
    school = res.data;
    if (res.error) console.error("[getPublicSchoolData] schools query error:", res.error);
  } catch (e) {
    console.error("[getPublicSchoolData] schools query threw:", e);
    return null;
  }

  if (!school) {
    console.error("[getPublicSchoolData] school not found for slug:", slug);
    return null;
  }

  let images: PublicSchoolImage[] = [];
  let instructors: PublicInstructor[] = [];
  let services: PublicService[] = [];
  let upcomingSessions: PublicSession[] = [];

  try {
    const IMAGE_BUCKET = "school-images";
    const AVATAR_BUCKET = "instructor-avatars";
    const [imagesRes, servicesRes, instructorsRes, sessionsRes] = await Promise.all([
      admin
        .from("school_images")
        .select("id, file_path")
        .eq("school_id", school.id)
        .order("created_at", { ascending: true }),
      admin
        .from("class_types")
        .select("id, name, description, default_duration_minutes, price_cents, category, modality")
        .eq("school_id", school.id)
        .eq("is_active", true)
        .order("name", { ascending: true }),
      admin
        .from("instructors")
        .select("name, level, avatar_url")
        .eq("school_id", school.id)
        .order("created_at", { ascending: true }),
      admin
        .from("sessions")
        .select("id, starts_at, duration_minutes, price_cents, capacity, class_type_id, class_types(name)")
        .eq("school_id", school.id)
        .eq("status", "scheduled")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(20),
    ]);

    images = (imagesRes.data ?? []).map((img) => ({
      id: img.id,
      public_url: admin.storage.from(IMAGE_BUCKET).getPublicUrl(img.file_path).data.publicUrl,
    }));

    services = (servicesRes.data ?? []).map((svc) => ({
      id: svc.id,
      name: svc.name,
      description: svc.description ?? null,
      duration_minutes: svc.default_duration_minutes,
      price_cents: svc.price_cents,
      category: svc.category ?? null,
      modality: svc.modality ?? "",
    }));

    instructors = (instructorsRes.data ?? []).map((inst) => ({
      name: inst.name,
      level: inst.level || "",
      avatar_url: inst.avatar_url
        ? admin.storage
            .from(AVATAR_BUCKET)
            .getPublicUrl(inst.avatar_url).data.publicUrl
        : null,
    }));

    const { data: sessionsData } = sessionsRes;
    const realSessions: PublicSession[] = (sessionsData ?? []).map((s) => ({
      id: s.id,
      starts_at: s.starts_at,
      duration_minutes: s.duration_minutes,
      class_type_name: (s.class_types as unknown as { name: string } | null)?.name ?? "",
      price_cents: s.price_cents,
      capacity: s.capacity ?? 0,
      booked: 0,
    }));

    const sessionIds = realSessions.map((s) => s.id);
    if (sessionIds.length > 0) {
      const { data: bookings } = await admin
        .from("bookings")
        .select("session_id")
        .in("session_id", sessionIds)
        .eq("status", "confirmed");

      const countMap: Record<string, number> = {};
      for (const b of bookings ?? []) {
        countMap[b.session_id] = (countMap[b.session_id] ?? 0) + 1;
      }
      for (const s of realSessions) {
        s.booked = countMap[s.id] ?? 0;
      }
    }

    upcomingSessions = realSessions;
  } catch (err) {
    console.error("[getPublicSchoolData] sub-queries error:", err);
  }

  return {
    school: {
      id: school.id,
      name: school.name || "Nome da Escola",
      slug: school.slug,
      description: school.description || null,
      location: school.location || null,
      logo_url: school.logo_url || null,
      phone: school.phone ?? null,
      timezone: school.timezone || "Europe/Lisbon",
    },
    images,
    instructors,
    services,
    upcomingSessions,
  };
}

export async function getPublicSessionsForMonth(
  schoolId: string,
  year: number,
  month: number
): Promise<Record<number, PublicSession[]>> {
  const admin = createAdminClient();

  const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  const { data: sessions, error } = await admin
    .from("sessions")
    .select("id, starts_at, duration_minutes, price_cents, capacity, class_type_id, class_types(name)")
    .eq("school_id", schoolId)
    .eq("status", "scheduled")
    .gte("starts_at", startDate)
    .lte("starts_at", `${endDate}T23:59:59`)
    .order("starts_at", { ascending: true });

  if (error || !sessions) {
    console.error("[getPublicSessionsForMonth] error:", error);
    return {};
  }

  const sessionIds = sessions.map((s) => s.id);
  const countMap: Record<string, number> = {};

  if (sessionIds.length > 0) {
    const { data: bookings } = await admin
      .from("bookings")
      .select("session_id")
      .in("session_id", sessionIds)
      .eq("status", "confirmed");

    for (const b of bookings ?? []) {
      countMap[b.session_id] = (countMap[b.session_id] ?? 0) + 1;
    }
  }

  const byDay: Record<number, PublicSession[]> = {};

  for (const s of sessions) {
    const day = new Date(s.starts_at).getDate();
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push({
      id: s.id,
      starts_at: s.starts_at,
      duration_minutes: s.duration_minutes,
      price_cents: s.price_cents,
      capacity: s.capacity ?? 0,
      booked: countMap[s.id] ?? 0,
      class_type_name: (s.class_types as unknown as { name: string } | null)?.name ?? "",
    });
  }

  return byDay;
}

export async function criarReservaPublica(
  schoolId: string,
  sessionId: string,
  data: { name: string; email: string; phone: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const { data: student, error: studentErr } = await admin
    .from("students")
    .insert({
      full_name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      is_guest: true,
    })
    .select("id")
    .single();

  if (studentErr || !student) {
    return { ok: false, error: "Erro ao criar aluno." };
  }

  const { error: ssErr } = await admin.from("school_students").insert({
    school_id: schoolId,
    student_id: student.id,
  });

  if (ssErr) {
    return { ok: false, error: "Erro ao associar aluno à escola." };
  }

  const { data: sessionData } = await admin
    .from("sessions")
    .select("price_cents")
    .eq("id", sessionId)
    .eq("school_id", schoolId)
    .single();

  const priceCents = sessionData?.price_cents ?? 0;

  const { data: bookingGroup, error: bgErr } = await admin
    .from("booking_groups")
    .insert({
      school_id: schoolId,
      session_id: sessionId,
      booked_by_student_id: student.id,
      contact_name: data.name.trim(),
      contact_email: data.email.trim().toLowerCase(),
      contact_phone: data.phone.trim(),
      source: "guest",
    })
    .select("id")
    .single();

  if (bgErr || !bookingGroup) {
    return { ok: false, error: "Erro ao criar reserva." };
  }

  const { error: bErr } = await admin.from("bookings").insert({
    booking_group_id: bookingGroup.id,
    session_id: sessionId,
    student_id: student.id,
    payment_method: "single",
    payment_status: "unpaid",
    price_cents: priceCents,
  });

  if (bErr) {
    return { ok: false, error: "Erro ao confirmar reserva." };
  }

  return { ok: true };
}

export async function toggleFavorite(
  schoolId: string,
  action: "add" | "remove"
): Promise<{ ok: true; favorited: boolean } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Apenas pessoas com conta conseguem adicionar escolas aos favoritos." };
  }

  if (action === "add") {
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: user.id, school_id: schoolId });

    if (error) {
      if (error.code === "23505") {
        // Already favorited — treat as success
        return { ok: true, favorited: true };
      }
      return { ok: false, error: "Erro ao adicionar favorito." };
    }

    return { ok: true, favorited: true };
  }

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("school_id", schoolId);

  if (error) {
    return { ok: false, error: "Erro ao remover favorito." };
  }

  return { ok: true, favorited: false };
}
