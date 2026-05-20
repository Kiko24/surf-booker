"use server";

import { createClient } from "@/lib/supabase/server";

export type TodaySession = {
  id: string;
  time: string;
  title: string;
  inscritos: number;
  capacidade: number;
};

export async function getSchoolId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("schools")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  return data?.id ?? null;
}

export type SchoolInfo = {
  name: string;
  logo_url: string | null;
  location: string | null;
  description: string | null;
};

export async function getSchoolInfo(): Promise<SchoolInfo | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("schools")
    .select("name, logo_url, location, description")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  return data;
}

export async function getTodaySessions(schoolId: string): Promise<TodaySession[]> {
  const supabase = await createClient();

  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const endOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, starts_at, capacity, class_types(name)")
    .eq("school_id", schoolId)
    .eq("status", "scheduled")
    .gte("starts_at", startOfDay.toISOString())
    .lt("starts_at", endOfDay.toISOString())
    .order("starts_at", { ascending: true });

  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);

  const { data: allBookings } = await supabase
    .from("bookings")
    .select("session_id")
    .in("session_id", sessionIds)
    .eq("status", "confirmed");

  const bookingCount: Record<string, number> = {};
  for (const b of allBookings ?? []) {
    bookingCount[b.session_id] = (bookingCount[b.session_id] ?? 0) + 1;
  }

  return sessions.map((s) => {
    const d = new Date(s.starts_at);
    const hours = d.getUTCHours().toString().padStart(2, "0");
    const minutes = d.getUTCMinutes().toString().padStart(2, "0");
    return {
      id: s.id,
      time: `${hours}:${minutes}`,
      title: (s.class_types as unknown as { name: string } | null)?.name ?? "Aula",
      inscritos: bookingCount[s.id] ?? 0,
      capacidade: s.capacity ?? 10,
    };
  });
}
