"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type StudentProfile = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
};

export type BookingHistoryItem = {
  id: string;
  sessionId: string;
  startsAt: string;
  durationMinutes: number;
  schoolName: string;
  schoolSlug: string;
  classTypeName: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  priceCents: number;
  cancelledAt: string | null;
  createdAt: string;
  isPast: boolean;
};

export type PackSummary = {
  id: string;
  packName: string;
  schoolName: string;
  schoolSlug: string;
  totalLessons: number;
  lessonsRemaining: number;
  status: string;
  purchasedAt: string;
};

export type FavoriteSchool = {
  id: string;
  schoolId: string;
  name: string;
  slug: string;
  location: string | null;
  logoUrl: string | null;
  createdAt: string;
};

export type WaiverAcceptance = {
  id: string;
  schoolId: string;
  schoolName: string;
  title: string;
  acceptedAt: string;
  version: number;
};

export type Invoice = {
  id: string;
  bookingGroupId: string;
  sessionStartsAt: string;
  schoolName: string;
  schoolSlug: string;
  classTypeName: string;
  priceCents: number;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
};

export type ClientOverview = {
  profile: StudentProfile | null;
  authEmail: string | null;
  upcomingBookings: BookingHistoryItem[];
  activePacks: PackSummary[];
  favoriteSchools: FavoriteSchool[];
  pendingWaivers: number;
  totalBookings: number;
};

type StudentRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
};

async function getStudent(supabase: SupabaseClient): Promise<StudentRow | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("students")
    .select("id, full_name, email, phone")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return data;
}

export async function getClientOverview(): Promise<ClientOverview | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const student = await getStudent(supabase);
  if (!student) return {
    profile: null,
    authEmail: user.email ?? null,
    upcomingBookings: [],
    activePacks: [],
    favoriteSchools: [],
    pendingWaivers: 0,
    totalBookings: 0,
  };

  const profile: StudentProfile = {
    id: student.id,
    fullName: student.full_name,
    email: student.email,
    phone: student.phone,
  };

  const now = new Date().toISOString();

  const [bookingsRes, packsRes, favoritesRes, waiversRes, countRes] = await Promise.all([
    supabase
      .from("bookings")
      .select(`
        id, booking_group_id, session_id, status, payment_method, payment_status,
        price_cents, cancelled_at, created_at,
        session:sessions!inner(
          starts_at, duration_minutes,
          school:schools!inner(id, name, slug),
          class_types(name)
        )
      `)
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("pack_purchases")
      .select(`
        id, pack_id, lessons_remaining, status, purchased_at,
        pack:packs!inner(name, total_lessons),
        school:schools!inner(name, slug)
      `)
      .eq("student_id", student.id)
      .order("purchased_at", { ascending: false }),
    supabase
      .from("favorites")
      .select(`
        id, school_id, created_at,
        school:schools!inner(name, slug, location, logo_url)
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("waiver_acceptances")
      .select("id, waiver_version_id, school_id, accepted_at", { count: "exact", head: true })
      .eq("student_id", student.id),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student.id),
  ]);

  const bookings = (bookingsRes.data ?? []) as unknown as {
    id: string; session_id: string; status: string; payment_method: string;
    payment_status: string; price_cents: number; cancelled_at: string | null;
    created_at: string;
    session: {
      starts_at: string; duration_minutes: number;
      school: { id: string; name: string; slug: string };
      class_types: { name: string }[] | null;
    };
  }[];

  const upcomingBookings = bookings
    .filter(b => b.session.starts_at >= now)
    .slice(0, 5)
    .map(b => ({
      id: b.id,
      sessionId: b.session_id,
      startsAt: b.session.starts_at,
      durationMinutes: b.session.duration_minutes,
      schoolName: b.session.school.name,
      schoolSlug: b.session.school.slug,
      classTypeName: b.session.class_types?.[0]?.name ?? "Aula",
      status: b.status,
      paymentMethod: b.payment_method,
      paymentStatus: b.payment_status,
      priceCents: b.price_cents,
      cancelledAt: b.cancelled_at,
      createdAt: b.created_at,
      isPast: false,
    }));

  const packs = (packsRes.data ?? []) as unknown as {
    id: string; pack_id: string; lessons_remaining: number; status: string;
    purchased_at: string;
    pack: { name: string; total_lessons: number };
    school: { name: string; slug: string };
  }[];

  const activePacks = packs
    .filter(p => p.status === "active" && p.lessons_remaining > 0)
    .map(p => ({
      id: p.id,
      packName: p.pack.name,
      schoolName: p.school.name,
      schoolSlug: p.school.slug,
      totalLessons: p.pack.total_lessons,
      lessonsRemaining: p.lessons_remaining,
      status: p.status,
      purchasedAt: p.purchased_at,
    }));

  const faves = (favoritesRes.data ?? []) as unknown as {
    id: string; school_id: string; created_at: string;
    school: { name: string; slug: string; location: string | null; logo_url: string | null };
  }[];

  const favoriteSchools = faves.map(f => ({
    id: f.id,
    schoolId: f.school_id,
    name: f.school.name,
    slug: f.school.slug,
    location: f.school.location,
    logoUrl: f.school.logo_url,
    createdAt: f.created_at,
  }));

  return {
    profile,
    authEmail: user.email ?? null,
    upcomingBookings,
    activePacks,
    favoriteSchools,
    pendingWaivers: waiversRes.count ?? 0,
    totalBookings: countRes.count ?? 0,
  };
}

export async function updateProfile(data: { fullName: string; email: string; phone: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const updates: Record<string, string | null> = {
    full_name: data.fullName,
    phone: data.phone || null,
  };

  if (data.email) updates.email = data.email;

  const { error } = await supabase
    .from("students")
    .update(updates)
    .eq("auth_user_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updatePassword(data: { currentPassword: string; newPassword: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { success: false, error: "Não autenticado" };

  if (data.newPassword.length < 6) return { success: false, error: "A nova password deve ter pelo menos 6 caracteres" };

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: data.currentPassword,
  });

  if (signInError) return { success: false, error: "Password atual incorreta" };

  const { error: updateError } = await supabase.auth.updateUser({
    password: data.newPassword,
  });

  if (updateError) return { success: false, error: updateError.message };
  return { success: true };
}

export async function getBookingHistory(): Promise<BookingHistoryItem[]> {
  const supabase = await createClient();
  const student = await getStudent(supabase);
  if (!student) return [];

  const now = new Date().toISOString();

  const { data: raw } = await supabase
    .from("bookings")
    .select(`
      id, booking_group_id, session_id, status, payment_method, payment_status,
      price_cents, cancelled_at, created_at,
      session:sessions!inner(
        starts_at, duration_minutes,
        school:schools!inner(name, slug),
        class_types(name)
      )
    `)
    .eq("student_id", student.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const bookings = (raw ?? []) as unknown as {
    id: string; session_id: string; status: string; payment_method: string;
    payment_status: string; price_cents: number; cancelled_at: string | null;
    created_at: string;
    session: {
      starts_at: string; duration_minutes: number;
      school: { name: string; slug: string };
      class_types: { name: string }[] | null;
    };
  }[];

  return bookings.map(b => ({
    id: b.id,
    sessionId: b.session_id,
    startsAt: b.session.starts_at,
    durationMinutes: b.session.duration_minutes,
    schoolName: b.session.school.name,
    schoolSlug: b.session.school.slug,
    classTypeName: b.session.class_types?.[0]?.name ?? "Aula",
    status: b.status,
    paymentMethod: b.payment_method,
    paymentStatus: b.payment_status,
    priceCents: b.price_cents,
    cancelledAt: b.cancelled_at,
    createdAt: b.created_at,
    isPast: b.session.starts_at < now,
  }));
}

export async function getStudentPacks(): Promise<PackSummary[]> {
  const supabase = await createClient();
  const student = await getStudent(supabase);
  if (!student) return [];

  const { data: raw } = await supabase
    .from("pack_purchases")
    .select(`
      id, pack_id, lessons_remaining, status, purchased_at,
      pack:packs!inner(name, total_lessons),
      school:schools!inner(name, slug)
    `)
    .eq("student_id", student.id)
    .order("purchased_at", { ascending: false });

  const packs = (raw ?? []) as unknown as {
    id: string; pack_id: string; lessons_remaining: number; status: string;
    purchased_at: string;
    pack: { name: string; total_lessons: number };
    school: { name: string; slug: string };
  }[];

  return packs.map(p => ({
    id: p.id,
    packName: p.pack.name,
    schoolName: p.school.name,
    schoolSlug: p.school.slug,
    totalLessons: p.pack.total_lessons,
    lessonsRemaining: p.lessons_remaining,
    status: p.status,
    purchasedAt: p.purchased_at,
  }));
}

export async function getFavoriteSchools(): Promise<FavoriteSchool[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: raw } = await supabase
    .from("favorites")
    .select(`
      id, school_id, created_at,
      school:schools!inner(name, slug, location, logo_url)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const faves = (raw ?? []) as unknown as {
    id: string; school_id: string; created_at: string;
    school: { name: string; slug: string; location: string | null; logo_url: string | null };
  }[];

  return faves.map(f => ({
    id: f.id,
    schoolId: f.school_id,
    name: f.school.name,
    slug: f.school.slug,
    location: f.school.location,
    logoUrl: f.school.logo_url,
    createdAt: f.created_at,
  }));
}

export async function getWaiverAcceptances(): Promise<WaiverAcceptance[]> {
  const supabase = await createClient();
  const student = await getStudent(supabase);
  if (!student) return [];

  const { data: raw } = await supabase
    .from("waiver_acceptances")
    .select(`
      id, school_id, waiver_version_id, accepted_at,
      waiver_version:waiver_versions!inner(version, title),
      school:schools!inner(name)
    `)
    .eq("student_id", student.id)
    .order("accepted_at", { ascending: false });

  const items = (raw ?? []) as unknown as {
    id: string; school_id: string; waiver_version_id: string; accepted_at: string;
    waiver_version: { version: number; title: string };
    school: { name: string };
  }[];

  return items.map(w => ({
    id: w.id,
    schoolId: w.school_id,
    schoolName: w.school.name,
    title: w.waiver_version.title,
    acceptedAt: w.accepted_at,
    version: w.waiver_version.version,
  }));
}

export async function getInvoices(): Promise<Invoice[]> {
  const supabase = await createClient();
  const student = await getStudent(supabase);
  if (!student) return [];

  const { data: raw } = await supabase
    .from("bookings")
    .select(`
      id, booking_group_id, session_id, payment_status, payment_method, price_cents, created_at,
      session:sessions!inner(
        starts_at,
        school:schools!inner(name, slug),
        class_types(name)
      )
    `)
    .eq("student_id", student.id)
    .not("payment_status", "eq", "unpaid")
    .order("created_at", { ascending: false })
    .limit(100);

  const bookings = (raw ?? []) as unknown as {
    id: string; booking_group_id: string; session_id: string;
    payment_status: string; payment_method: string; price_cents: number; created_at: string;
    session: {
      starts_at: string;
      school: { name: string; slug: string };
      class_types: { name: string }[] | null;
    };
  }[];

  return bookings.map(b => ({
    id: b.id,
    bookingGroupId: b.booking_group_id,
    sessionStartsAt: b.session.starts_at,
    schoolName: b.session.school.name,
    schoolSlug: b.session.school.slug,
    classTypeName: b.session.class_types?.[0]?.name ?? "Aula",
    priceCents: b.price_cents,
    paymentStatus: b.payment_status,
    paymentMethod: b.payment_method,
    createdAt: b.created_at,
  }));
}
