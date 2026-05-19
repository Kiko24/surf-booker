"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SessionData = {
  id: string;
  nome: string;
  time: string;
  capacidade: number;
  alunos: number;
  alunosList: string[];
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

export async function getSessionsForMonth(
  year: number,
  month: number,
  schoolId: string
): Promise<Record<number, SessionData[]>> {
  const supabase = await createClient();

  const startOfMonth = new Date(Date.UTC(year, month, 1));
  const endOfMonth = new Date(Date.UTC(year, month + 1, 1));

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, starts_at, duration_minutes, capacity, class_type_id, class_types(name)")
    .eq("school_id", schoolId)
    .gte("starts_at", startOfMonth.toISOString())
    .lt("starts_at", endOfMonth.toISOString())
    .order("starts_at", { ascending: true });

  if (!sessions) return {};

  const result: Record<number, SessionData[]> = {};

  for (const s of sessions) {
    const d = new Date(s.starts_at);
    const day = d.getUTCDate();
    const hours = d.getUTCHours().toString().padStart(2, "0");
    const minutes = d.getUTCMinutes().toString().padStart(2, "0");

    if (!result[day]) result[day] = [];

    result[day].push({
      id: s.id,
      nome: (s.class_types as unknown as { name: string } | null)?.name ?? "Aula",
      time: `${hours}:${minutes}`,
      capacidade: s.capacity ?? 10,
      alunos: 0,
      alunosList: [],
    });
  }

  return result;
}

export async function createSession(formData: {
  nome: string;
  data: string;
  horario: string;
  duracao: number;
  capacidade: number;
  schoolId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const startsAt = new Date(`${formData.data}T${formData.horario}:00Z`);

  if (isNaN(startsAt.getTime())) {
    return { ok: false, error: "Data ou horário inválidos" };
  }

  // find or create class_type
  let classTypeId: string | null = null;
  const name = formData.nome.trim();

  if (name) {
    const { data: existing } = await supabase
      .from("class_types")
      .select("id")
      .eq("school_id", formData.schoolId)
      .eq("name", name)
      .maybeSingle();

    if (existing) {
      classTypeId = existing.id;
    } else {
      const { data: created, error: createErr } = await supabase
        .from("class_types")
        .insert({
          school_id: formData.schoolId,
          name,
          default_duration_minutes: formData.duracao,
          price_cents: 0,
        })
        .select("id")
        .single();

      if (createErr) return { ok: false, error: createErr.message };
      classTypeId = created.id;
    }
  }

  const { error } = await supabase.from("sessions").insert({
    school_id: formData.schoolId,
    starts_at: startsAt.toISOString(),
    duration_minutes: formData.duracao,
    capacity: formData.capacidade,
    price_cents: 0,
    class_type_id: classTypeId,
    status: "scheduled",
  });

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

export async function deleteSession(sessionId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("sessions")
    .delete()
    .eq("id", sessionId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateSession(
  sessionId: string,
  formData: {
    nome: string;
    data: string;
    horario: string;
    duracao: number;
    capacidade: number;
    schoolId: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const startsAt = new Date(`${formData.data}T${formData.horario}:00Z`);

  if (isNaN(startsAt.getTime())) {
    return { ok: false, error: "Data ou horário inválidos" };
  }

  // find or create class_type
  let classTypeId: string | null = null;
  const name = formData.nome.trim();

  if (name) {
    const { data: existing } = await supabase
      .from("class_types")
      .select("id")
      .eq("school_id", formData.schoolId)
      .eq("name", name)
      .maybeSingle();

    if (existing) {
      classTypeId = existing.id;
    } else {
      const { data: created, error: createErr } = await supabase
        .from("class_types")
        .insert({
          school_id: formData.schoolId,
          name,
          default_duration_minutes: formData.duracao,
          price_cents: 0,
        })
        .select("id")
        .single();

      if (createErr) return { ok: false, error: createErr.message };
      classTypeId = created.id;
    }
  }

  const { error } = await supabase
    .from("sessions")
    .update({
      starts_at: startsAt.toISOString(),
      duration_minutes: formData.duracao,
      capacity: formData.capacidade,
      class_type_id: classTypeId,
    })
    .eq("id", sessionId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
