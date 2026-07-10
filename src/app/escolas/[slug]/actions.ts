"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimitPublic } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { logAudit } from "@/lib/audit";
import { notifyOwnerBooking } from "@/app/dashboard/calendario/actions";

export type PublicSchoolImage = {
  id: string;
  public_url: string;
};

export type PublicInstructor = {
  name: string;
  level: string;
  avatar_url: string | null;
};

export type RentalOption = {
  id: string;
  duration_minutes: number;
  price_cents: number;
};

export type PublicService = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  category: string | null;
  modality: string;
  rental_options?: RentalOption[];
};

export type PublicSession = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  class_type_id: string | null;
  class_type_name: string;
  price_cents: number;
  capacity: number;
  booked: number;
};

type SessionRow = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  price_cents: number;
  capacity: number | null;
  class_type_id: string | null;
  class_types: { name: string }[] | null;
};

type PackPurchaseRow = {
  id: string;
  lessons_remaining: number;
  packs: { name: string } | null;
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
    terms_url: string | null;
  };
  images: PublicSchoolImage[];
  instructors: PublicInstructor[];
  services: PublicService[];
  upcomingSessions: PublicSession[];
};

export async function getPublicSchoolData(
  slug: string
): Promise<PublicSchoolData | null> {
  const rl = await rateLimitPublic("getPublicSchoolData", 30, "60 s");
  if (!rl.ok) return null;

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[getPublicSchoolData] createAdminClient error");
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
    if (res.error) console.error("[getPublicSchoolData] schools query error");
  } catch (e) {
    console.error("[getPublicSchoolData] schools query threw");
    return null;
  }

  if (!school) {
    console.error("[getPublicSchoolData] school not found for slug:", slug);
    return null;
  }

  let terms_url: string | null = null;
  try {
    const { data: settings } = await admin
      .from("school_settings")
      .select("terms_url")
      .eq("school_id", school.id)
      .maybeSingle();
    terms_url = settings?.terms_url ?? null;
  } catch (e) {
    console.error("[getPublicSchoolData] failed to fetch terms_url");
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

    const rawServices = (servicesRes.data ?? []).map((svc) => ({
      id: svc.id,
      name: svc.name,
      description: svc.description ?? null,
      duration_minutes: svc.default_duration_minutes,
      price_cents: svc.price_cents,
      category: svc.category ?? null,
      modality: svc.modality ?? "",
    }));

    const rentalGroups = new Map<string, typeof rawServices>();
    const deduped: typeof rawServices = [];
    for (const svc of rawServices) {
      if (svc.category === "aluguer") {
        const g = rentalGroups.get(svc.name);
        if (g) { g.push(svc); } else { rentalGroups.set(svc.name, [svc]); }
      } else {
        deduped.push(svc);
      }
    }
    for (const [, group] of rentalGroups) {
      if (group.length > 1) {
        const first: PublicService = {
          ...group[0],
          rental_options: group
            .map((o) => ({
              id: o.id,
              duration_minutes: o.duration_minutes,
              price_cents: o.price_cents,
            }))
            .sort((a, b) => a.duration_minutes - b.duration_minutes),
          price_cents: Math.min(...group.map((o) => o.price_cents)),
          duration_minutes: Math.min(...group.map((o) => o.duration_minutes)),
        };
        deduped.push(first);
      } else {
        deduped.push(group[0]);
      }
    }
    services = deduped;

    instructors = (instructorsRes.data ?? []).map((inst) => ({
      name: inst.name,
      level: inst.level || "",
      avatar_url: inst.avatar_url
        ? admin.storage
            .from(AVATAR_BUCKET)
            .getPublicUrl(inst.avatar_url).data.publicUrl
        : null,
    }));

    const sessionsData = sessionsRes.data as SessionRow[] | null;
    const realSessions: PublicSession[] = (sessionsData ?? []).map((s) => ({
      id: s.id,
      starts_at: s.starts_at,
      duration_minutes: s.duration_minutes,
      class_type_id: s.class_type_id,
      class_type_name: s.class_types?.[0]?.name ?? "",
      price_cents: s.price_cents,
      capacity: s.capacity ?? 999999,
      booked: 0,
    }));

    const sessionIds = realSessions.map((s) => s.id);
    if (sessionIds.length > 0) {
      const { data: bookings } = await admin
        .from("bookings")
        .select("session_id, participants, student_id")
        .in("session_id", sessionIds)
        .eq("status", "confirmed");

      const countMap: Record<string, number> = {};
      for (const b of bookings ?? []) {
        const pc = b.participants
          ? (Array.isArray(b.participants) ? b.participants.length : 0)
          : (b.student_id ? 1 : 0);
        countMap[b.session_id] = (countMap[b.session_id] ?? 0) + pc;
      }
      for (const s of realSessions) {
        s.booked = countMap[s.id] ?? 0;
      }
    }

    upcomingSessions = realSessions;
  } catch (err) {
    console.error("[getPublicSchoolData] sub-queries error");
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
      terms_url,
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
  const rl = await rateLimitPublic("getPublicSessionsForMonth", 30, "60 s");
  if (!rl.ok) return {};

  const admin = createAdminClient();

  const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59)).toISOString();

  const { data: rawSessions, error } = await admin
    .from("sessions")
    .select("id, starts_at, duration_minutes, price_cents, capacity, class_type_id, class_types(name)")
    .eq("school_id", schoolId)
    .eq("status", "scheduled")
    .gte("starts_at", startDate)
    .lte("starts_at", endDate)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("[getPublicSessionsForMonth] query error");
    return {};
  }

  if (!rawSessions || rawSessions.length === 0) {
    return {};
  }

  const sessions = rawSessions as SessionRow[];

  const sessionIds = sessions.map((s) => s.id);
  const countMap: Record<string, number> = {};

  if (sessionIds.length > 0) {
    const { data: bookings } = await admin
      .from("bookings")
      .select("session_id, participants, student_id")
      .in("session_id", sessionIds)
      .eq("status", "confirmed");

    for (const b of bookings ?? []) {
      const pc = b.participants
        ? (Array.isArray(b.participants) ? b.participants.length : 0)
        : (b.student_id ? 1 : 0);
      countMap[b.session_id] = (countMap[b.session_id] ?? 0) + pc;
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
      class_type_id: s.class_type_id,
      price_cents: s.price_cents,
      capacity: s.capacity ?? 999999,
      booked: countMap[s.id] ?? 0,
      class_type_name: s.class_types?.[0]?.name ?? "",
    });
  }

  return byDay;
}

async function findOrCreateStudent(
  admin: ReturnType<typeof createAdminClient>,
  schoolId: string,
  data: { name: string; email: string; phone: string }
): Promise<{ id: string } | null> {
  const email = data.email.trim().toLowerCase();

  const { data: existing } = await admin
    .from("students")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    const { data: ss } = await admin
      .from("school_students")
      .select("student_id")
      .eq("school_id", schoolId)
      .eq("student_id", existing.id)
      .maybeSingle();

    if (ss) return { id: existing.id };

    // Student existe com este email mas não está ligado a esta escola — criar link
    const { error: linkErr } = await admin.from("school_students").insert({
      school_id: schoolId,
      student_id: existing.id,
    });

    if (linkErr) return null;
    return { id: existing.id };
  }

  const { data: student, error: studentErr } = await admin
    .from("students")
    .insert({
      full_name: data.name.trim(),
      email,
      phone: data.phone.trim(),
      is_guest: true,
    })
    .select("id")
    .single();

  if (studentErr || !student) return null;

  const { error: ssErr } = await admin.from("school_students").insert({
    school_id: schoolId,
    student_id: student.id,
  });

  if (ssErr) return null;

  return { id: student.id };
}

export async function comprarPackPublico(
  schoolId: string,
  classTypeId: string,
  quantity: number,
  data: { name: string; email: string; phone: string },
  turnstileToken?: string
): Promise<{ ok: true; packPurchaseId: string } | { ok: false; error: string }> {
  const rl = await rateLimitPublic("comprarPackPublico", 5, "60 s");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  if (turnstileToken) {
    const valid = await verifyTurnstileToken(turnstileToken);
    if (!valid) return { ok: false, error: "Verificação de segurança falhou. Tenta novamente." };
  }

  const admin = createAdminClient();

  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(schoolId)) return { ok: false, error: "Escola inválida." };
  if (!uuidRe.test(classTypeId)) return { ok: false, error: "Serviço inválido." };

  const cleanName = data.name.trim().replace(/[\x00-\x1F]/g, "");
  if (cleanName.length < 2) return { ok: false, error: "Nome deve ter pelo menos 2 caracteres." };
  if (cleanName.length > 120) return { ok: false, error: "Nome demasiado longo." };

  const cleanEmail = data.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false, error: "Email inválido." };

  const digits = data.phone.replace(/\D/g, "");
  if (digits.length < 6) return { ok: false, error: "Telemóvel deve ter pelo menos 6 dígitos." };
  if (digits.length > 20) return { ok: false, error: "Telemóvel demasiado longo." };

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return { ok: false, error: "Quantidade inválida." };

  const student = await findOrCreateStudent(admin, schoolId, { name: cleanName, email: cleanEmail, phone: digits });
  if (!student) return { ok: false, error: "Erro ao criar aluno." };

  const { data: classType } = await admin
    .from("class_types")
    .select("name, price_cents")
    .eq("id", classTypeId)
    .eq("school_id", schoolId)
    .single();

  if (!classType) return { ok: false, error: "Serviço não encontrado." };

  const { data: existingPack } = await admin
    .from("packs")
    .select("id")
    .eq("class_type_id", classTypeId)
    .eq("school_id", schoolId)
    .maybeSingle();

  let packId: string;
  if (existingPack) {
    packId = existingPack.id;
  } else {
    const { data: newPack, error: packErr } = await admin
      .from("packs")
      .insert({
        school_id: schoolId,
        class_type_id: classTypeId,
        name: classType.name,
        total_lessons: quantity,
        price_cents: classType.price_cents * quantity,
        is_active: true,
      })
      .select("id")
      .single();

    if (packErr || !newPack) return { ok: false, error: "Erro ao criar pack." };
    packId = newPack.id;
  }

  const { data: purchase, error: ppErr } = await admin
    .from("pack_purchases")
    .insert({
      school_id: schoolId,
      pack_id: packId,
    student_id: null,
      lessons_remaining: quantity,
      status: "active",
    })
    .select("id")
    .single();

  if (ppErr || !purchase) return { ok: false, error: "Erro ao registar compra." };

  logAudit({
    schoolId,
    userId: student.id,
    action: "buy_pack",
    entityType: "pack_purchase",
    entityId: purchase.id,
    metadata: { email: data.email, classTypeId },
  });

  return { ok: true, packPurchaseId: purchase.id };
}

export async function criarReservaAluguer(
  schoolId: string,
  classTypeId: string,
  quantity: number,
  startsAt: string,
  data: { name: string; email: string; phone: string },
  turnstileToken?: string,
  participants?: ParticipantInput[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const rl = await rateLimitPublic("criarReservaAluguer", 5, "60 s");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  if (turnstileToken) {
    const valid = await verifyTurnstileToken(turnstileToken);
    if (!valid) return { ok: false, error: "Verificação de segurança falhou. Tenta novamente." };
  }

  const admin = createAdminClient();

  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(schoolId)) return { ok: false, error: "Escola inválida." };
  if (!uuidRe.test(classTypeId)) return { ok: false, error: "Serviço inválido." };

  const cleanName = data.name.trim().replace(/[\x00-\x1F]/g, "");
  if (cleanName.length < 2) return { ok: false, error: "Nome deve ter pelo menos 2 caracteres." };
  if (cleanName.length > 120) return { ok: false, error: "Nome demasiado longo." };

  const cleanEmail = data.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false, error: "Email inválido." };

  const digits = data.phone.replace(/\D/g, "");
  if (digits.length < 6) return { ok: false, error: "Telemóvel deve ter pelo menos 6 dígitos." };
  if (digits.length > 20) return { ok: false, error: "Telemóvel demasiado longo." };

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return { ok: false, error: "Quantidade inválida." };

  if (participants) {
    if (!Array.isArray(participants) || !participants.length) return { ok: false, error: "Nenhum participante." };
    for (const p of participants) {
      const pName = (p.name ?? "").trim().replace(/[\x00-\x1F]/g, "");
      if (pName.length < 2) return { ok: false, error: "Cada participante deve ter um nome com pelo menos 2 caracteres." };
      if (!Number.isInteger(p.age) || p.age < 1 || p.age > 120) return { ok: false, error: "Idade inválida para um participante." };
    }
  }

  const { data: classType, error: classTypeErr } = await admin
    .from("class_types")
    .select("default_duration_minutes, price_cents")
    .eq("id", classTypeId)
    .eq("school_id", schoolId)
    .single();

  if (classTypeErr || !classType) return { ok: false, error: "Serviço não encontrado." };

  const startsAtDate = new Date(startsAt);
  if (isNaN(startsAtDate.getTime())) return { ok: false, error: "Data ou hora inválida." };
  if (startsAtDate < new Date()) return { ok: false, error: "Data não pode ser no passado." };
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  if (startsAtDate > oneYearFromNow) return { ok: false, error: "Data demasiado distante." };

  const { data: session, error: sessionErr } = await admin
    .from("sessions")
    .insert({
      school_id: schoolId,
      starts_at: startsAtDate.toISOString(),
      duration_minutes: classType.default_duration_minutes,
      capacity: participants ? participants.length : quantity,
      price_cents: classType.price_cents * (participants ? participants.length : quantity),
      class_type_id: classTypeId,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (sessionErr || !session) return { ok: false, error: "Erro ao criar sessão." };

  const { data: bookingGroup, error: bgErr } = await admin
    .from("booking_groups")
    .insert({
      school_id: schoolId,
      session_id: session.id,
      booked_by_student_id: null,
      contact_name: data.name.trim(),
      contact_email: data.email.trim().toLowerCase(),
      contact_phone: data.phone.trim(),
      source: "guest",
    })
    .select("id")
    .single();

  if (bgErr || !bookingGroup) return { ok: false, error: "Erro ao criar reserva." };

  const participantsJson = participants
    ? participants.map((p) => ({
        name: p.name.trim().replace(/[\x00-\x1F]/g, ""),
        age: p.age,
        ...(p.nota?.trim() ? { nota: p.nota.trim() } : {}),
        parentalConsent: p.parentalConsent,
      }))
    : [];

  const { error: bErr } = await admin.from("bookings").insert({
    booking_group_id: bookingGroup.id,
    session_id: session.id,
    student_id: null,
    payment_method: "single",
    payment_status: "unpaid",
    price_cents: classType.price_cents * (participants ? participants.length : quantity),
    ...(participantsJson.length ? { participants: participantsJson } : {}),
  });

  if (bErr) return { ok: false, error: "Erro ao confirmar reserva." };

  logAudit({
    schoolId,
    userId: null,
    action: "create_rental_booking",
    entityType: "booking_group",
    entityId: bookingGroup.id,
    metadata: { email: data.email, classTypeId, startsAt, quantity },
  });

  notifyOwnerBooking(schoolId, session.id, data.name.trim()).catch(() => {
    console.error("Erro ao notificar dono");
  });

  return { ok: true };
}

export async function buscarPackAtivo(
  schoolId: string,
  email: string
): Promise<{ packPurchaseId: string; remaining: number; name: string } | null> {
  const rl = await rateLimitPublic("buscarPackAtivo", 10, "60 s");
  if (!rl.ok) return null;

  const admin = createAdminClient();

  const { data: student } = await admin
    .from("students")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (!student) return null;

  const { data: rawPp } = await admin
    .from("pack_purchases")
    .select("id, lessons_remaining, packs(name)")
    .eq("school_id", schoolId)
    .eq("student_id", student.id)
    .eq("status", "active")
    .gt("lessons_remaining", 0)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const pp = rawPp as PackPurchaseRow | null;
  if (!pp) return null;

  return {
    packPurchaseId: pp.id,
    remaining: pp.lessons_remaining,
    name: pp.packs?.name ?? "Pack",
  };
}

export type ParticipantInput = {
  name: string;
  age: number;
  nota?: string;
  parentalConsent: boolean;
};

export async function criarReservaPublica(
  schoolId: string,
  sessionIds: string[],
  data: {
    participants: ParticipantInput[];
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    termsAccepted?: boolean;
    termsUrl?: string | null;
    packPurchaseId?: string;
  },
  turnstileToken?: string
): Promise<{ ok: true; bookingGroupIds: string[] } | { ok: false; error: string }> {
  const rl = await rateLimitPublic("criarReservaPublica", 5, "60 s");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  if (turnstileToken) {
    const valid = await verifyTurnstileToken(turnstileToken);
    if (!valid) return { ok: false, error: "Verificação de segurança falhou. Tenta novamente." };
  }

  if (!sessionIds.length) return { ok: false, error: "Nenhuma sessão selecionada." };
  if (!data.participants.length) return { ok: false, error: "Nenhum participante." };

  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(schoolId)) return { ok: false, error: "Escola inválida." };

  const cleanContactName = data.contactName.trim().replace(/[\x00-\x1F]/g, "");
  if (cleanContactName.length < 2) return { ok: false, error: "Nome de contacto deve ter pelo menos 2 caracteres." };
  if (cleanContactName.length > 120) return { ok: false, error: "Nome de contacto demasiado longo." };

  const cleanContactEmail = data.contactEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContactEmail)) return { ok: false, error: "Email inválido." };

  const contactDigits = data.contactPhone.replace(/\D/g, "");
  if (contactDigits.length < 6) return { ok: false, error: "Telemóvel deve ter pelo menos 6 dígitos." };
  if (contactDigits.length > 20) return { ok: false, error: "Telemóvel demasiado longo." };

  for (const p of data.participants) {
    const pName = p.name.trim().replace(/[\x00-\x1F]/g, "");
    if (pName.length < 2) return { ok: false, error: `Nome do participante "${p.name}" é muito curto.` };
    if (pName.length > 120) return { ok: false, error: `Nome do participante "${p.name}" demasiado longo.` };
    if (!p.age || p.age < 1 || p.age > 120) return { ok: false, error: `Idade inválida para "${p.name}".` };
    if (p.age < 18 && !p.parentalConsent) return { ok: false, error: `Consentimento parental necessário para "${p.name}" (menor de 18).` };
  }

  if (data.termsUrl && !data.termsAccepted) return { ok: false, error: "Deves aceitar os termos de serviço." };

  const admin = createAdminClient();

  const participantsJson = data.participants.map((p) => ({
    name: p.name.trim(),
    age: p.age,
    ...(p.nota?.trim() ? { nota: p.nota.trim() } : {}),
    parentalConsent: p.parentalConsent,
  }));

  const { data: sessions } = await admin
    .from("sessions")
    .select("id, price_cents")
    .in("id", sessionIds)
    .eq("school_id", schoolId);

  const sessionPriceMap = new Map<string, number>();
  for (const s of sessions ?? []) {
    sessionPriceMap.set(s.id, s.price_cents ?? 0);
  }

  const bookingGroupIds: string[] = [];

  let paymentMethod: "single" | "pack" = "single";
  if (data.packPurchaseId) {
    const { data: pp } = await admin
      .from("pack_purchases")
      .select("id, student_id")
      .eq("id", data.packPurchaseId)
      .eq("status", "active")
      .maybeSingle();
    if (!pp) return { ok: false, error: "Pack sem aulas restantes." };

    paymentMethod = "pack";
  }

  for (const sessionId of sessionIds) {
    const priceCents = (sessionPriceMap.get(sessionId) ?? 0) * data.participants.length;

    const { data: bookingGroup, error: bgErr } = await admin
      .from("booking_groups")
      .insert({
        school_id: schoolId,
        session_id: sessionId,
        booked_by_student_id: null,
        contact_name: cleanContactName,
        contact_email: cleanContactEmail,
        contact_phone: contactDigits,
        source: "guest",
      })
      .select("id")
      .single();

    if (bgErr || !bookingGroup) return { ok: false, error: "Erro ao criar reserva." };

    const bookingInsert: Record<string, unknown> = {
      booking_group_id: bookingGroup.id,
      session_id: sessionId,
      student_id: null,
      participants: participantsJson,
      payment_method: paymentMethod,
      payment_status: "unpaid",
      price_cents: priceCents,
    };
    if (paymentMethod === "pack" && data.packPurchaseId) {
      bookingInsert.pack_purchase_id = data.packPurchaseId;
    }

    const { error: bErr } = await admin.from("bookings").insert(bookingInsert);

    if (bErr) return { ok: false, error: "Erro ao confirmar reserva." };

    bookingGroupIds.push(bookingGroup.id);
  }

  if (data.packPurchaseId) {
    const { data: ok, error: rpcErr } = await admin.rpc("decrement_pack_credit", {
      p_purchase_id: data.packPurchaseId,
    });
    if (rpcErr || !ok) return { ok: false, error: "Erro ao usar pack." };
  }

  logAudit({
    schoolId,
    userId: null,
    action: "create_booking",
    entityType: "booking_group",
    entityId: bookingGroupIds[0],
    metadata: {
      email: data.contactEmail,
      sessionIds,
      participantCount: data.participants.length,
    },
  });

  for (const sessionId of sessionIds) {
    notifyOwnerBooking(schoolId, sessionId, data.contactName.trim()).catch(() => {
      console.error("Erro ao notificar dono");
    });
  }

  return { ok: true, bookingGroupIds };
}

export async function toggleFavorite(
  schoolId: string,
  action: "add" | "remove"
): Promise<{ ok: true; favorited: boolean } | { ok: false; error: string }> {
  const rl = await rateLimitPublic("toggleFavorite", 10, "60 s");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

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

    logAudit({
      schoolId,
      userId: user.id,
      action: "add_favorite",
      entityType: "favorite",
      entityId: schoolId,
    });

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

  logAudit({
    schoolId,
    userId: user.id,
    action: "remove_favorite",
    entityType: "favorite",
    entityId: schoolId,
  });

  return { ok: true, favorited: false };
}
