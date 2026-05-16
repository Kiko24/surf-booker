"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { onboardingSchema } from "@/lib/validation/onboarding";
import { slugify } from "@/lib/utils/slug";

export type CreateSchoolInput = {
  name: string;
  location: string;
  description?: string;
  logoFile?: File | null;
};

export type CreateSchoolResult =
  | { ok: true }
  | { ok: false; error: string; field?: string };

async function ensureUniqueSlug(
  admin: ReturnType<typeof createAdminClient>,
  baseSlug: string
): Promise<string> {
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const { data } = await admin
      .from("schools")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) return slug;

    suffix += 1;
    slug = `${baseSlug}-${suffix}`.slice(0, 60);
  }
}

export async function createSchool(
  formData: FormData
): Promise<CreateSchoolResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão expirada. Faz login novamente." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    return { ok: false, error: "Acesso negado." };
  }

  const { data: existingSchool } = await supabase
    .from("schools")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (existingSchool) {
    return { ok: false, error: "Já tens uma escola criada." };
  }

  const rawName = formData.get("name");
  const rawLocation = formData.get("location");
  const rawDescription = formData.get("description");
  const logoFile = formData.get("logo") as File | null;

  const parsed = onboardingSchema.safeParse({
  name: typeof rawName === "string" ? rawName : "",
  location: typeof rawLocation === "string" ? rawLocation : "",
  description: typeof rawDescription === "string" ? rawDescription : undefined,
});

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Dados inválidos",
      field: issue?.path[0]?.toString(),
    };
  }

  const { name, location, description } = parsed.data;
  const admin = createAdminClient();

  const baseSlug = slugify(name);
  if (baseSlug.length < 3) {
    return {
      ok: false,
      error: "Nome inválido para gerar URL",
      field: "name",
    };
  }

  const slug = await ensureUniqueSlug(admin, baseSlug);

  let logoUrl: string | null = null;

  if (logoFile && logoFile.size > 0) {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(logoFile.type)) {
      return {
        ok: false,
        error: "Formato de imagem inválido (usa PNG, JPG ou WEBP)",
        field: "logo",
      };
    }

    if (logoFile.size > 2 * 1024 * 1024) {
      return {
        ok: false,
        error: "Imagem demasiado grande (máx 2MB)",
        field: "logo",
      };
    }

    const ext = logoFile.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${user.id}/logo.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("school-logos")
      .upload(path, logoFile, {
        upsert: true,
        contentType: logoFile.type,
      });

    if (uploadError) {
      console.error("[createSchool] logo upload failed", uploadError);
      return { ok: false, error: "Erro ao carregar a imagem." };
    }

    const { data: publicUrl } = admin.storage
      .from("school-logos")
      .getPublicUrl(path);

    logoUrl = publicUrl.publicUrl;
  }

  const { error: insertError } = await admin.from("schools").insert({
    owner_user_id: user.id,
    name,
    slug,
    location,
    description: description || null,
    logo_url: logoUrl,
    timezone: "Europe/Lisbon",
    cancellation_window_hours: 24,
  });

  if (insertError) {
    console.error("[createSchool] insert failed", insertError);

    if (logoUrl) {
      const ext = logoFile?.type.split("/")[1].replace("jpeg", "jpg");
      await admin.storage
        .from("school-logos")
        .remove([`${user.id}/logo.${ext}`]);
    }

    return { ok: false, error: "Erro ao criar a escola. Tenta novamente." };
  }

  redirect("/dashboard");
}