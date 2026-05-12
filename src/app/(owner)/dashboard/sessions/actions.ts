"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

export async function createSession(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Buscar escola do dono
  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!school) {
    throw new Error("Escola não encontrada");
  }

  const title = formData.get("title")?.toString().trim();
  const startsAt = formData.get("starts_at")?.toString();
  const duration = Number(formData.get("duration_minutes"));
  const capacity = Number(formData.get("capacity"));
  const priceEuros = Number(formData.get("price_euros"));

  if (!title || !startsAt) {
    throw new Error("Título e data são obrigatórios");
  }

  if (!duration || duration <= 0) {
    throw new Error("Duração inválida");
  }

  if (!capacity || capacity <= 0) {
    throw new Error("Capacidade inválida");
  }

  if (isNaN(priceEuros) || priceEuros < 0) {
    throw new Error("Preço inválido");
  }

  const priceCents = Math.round(priceEuros * 100);

  const { error } = await supabase.from("sessions").insert({
    school_id: school.id,
    title,
    starts_at: new Date(startsAt).toISOString(),
    duration_minutes: duration,
    capacity,
    price_cents: priceCents,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/sessions");
}