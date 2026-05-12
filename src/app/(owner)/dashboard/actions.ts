"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createSchool(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name")?.toString().trim();
  const locality = formData.get("locality")?.toString().trim();

  if (!name || !locality) {
    throw new Error("Nome e localidade são obrigatórios");
  }

  const slug = slugify(name);

  if (!slug) {
    throw new Error("Nome inválido");
  }

  const { error } = await supabase.from("schools").insert({
    name,
    slug,
    locality,
    owner_user_id: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/dashboard");
}