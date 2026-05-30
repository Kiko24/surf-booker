"use server";

import { createAdminClient } from "@/lib/supabase/admin";

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
      .select("id, name, slug, description, location, logo_url, timezone")
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

  let images: PublicSchoolImage[] = [
    { id: "ph-1", public_url: "https://placehold.co/800x600/1E6FA8/FFFFFF?text=Foto+1" },
    { id: "ph-2", public_url: "https://placehold.co/800x600/2563EB/FFFFFF?text=Foto+2" },
    { id: "ph-3", public_url: "https://placehold.co/800x600/3B82F6/FFFFFF?text=Foto+3" },
  ];
  let services: PublicService[] = [];

  try {
    const [servicesRes] = await Promise.all([
      admin
        .from("class_types")
        .select("id, name, description, default_duration_minutes, price_cents")
        .eq("school_id", school.id)
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

    const realServices = (servicesRes.data ?? []).map((svc) => ({
      id: svc.id,
      name: svc.name,
      description: svc.description ?? null,
      duration_minutes: svc.default_duration_minutes,
      price_cents: svc.price_cents,
    }));

    services = realServices.length > 0 ? realServices : [
      { id: "ph-svc-1", name: "Aula de Surf Iniciantes", description: null, duration_minutes: 90, price_cents: 3500 },
      { id: "ph-svc-2", name: "Aula de Surf Intermédio", description: null, duration_minutes: 90, price_cents: 4000 },
      { id: "ph-svc-3", name: "Pack 5 Aulas", description: null, duration_minutes: 90, price_cents: 15000 },
    ];
  } catch (err) {
    console.error("[getPublicSchoolData] sub-queries error:", err);
  }

  return {
    school: {
      id: school.id,
      name: "Nome da Escola",
      slug: school.slug,
      description: "Descrição breve da escola. Aqui podes falar sobre a tua escola de surf, a tua missão e o que ofereces.",
      location: "Localização",
      logo_url: "https://placehold.co/120x120/1E6FA8/FFFFFF?text=Logo",
      timezone: "Europe/Lisbon",
    },
    images,
    instructors: [],
    services,
    upcomingSessions: [],
  };
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
