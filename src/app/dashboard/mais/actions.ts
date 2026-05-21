"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByUser } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { validateImageContent } from "@/lib/utils/validate-image";

const BUCKET = "school-images";
const MAX_IMAGES_PER_SCHOOL = 6;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const AVATAR_BUCKET = "instructor-avatars";
const MAX_AVATAR_SIZE = 1024 * 1024;

export type Instructor = {
  id: string;
  name: string;
  level: string;
  avatar_url: string | null;
};

async function getSupabase() {
  const supabase = await createClient();
  return supabase;
}

async function requireOwner(schoolId: string) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("id", schoolId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!school) throw new Error("Sem permissão");

  return { supabase, user };
}

export async function getInstructors(schoolId: string): Promise<Instructor[]> {
  const { supabase } = await requireOwner(schoolId);

  const { data } = await supabase
    .from("instructors")
    .select("id, name, level, avatar_url")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: true });

  if (!data) return [];

  return data.map((inst) => ({
    ...inst,
    avatar_url: inst.avatar_url
      ? supabase.storage.from(AVATAR_BUCKET).getPublicUrl(inst.avatar_url).data.publicUrl
      : null,
  }));
}

export async function saveInstructor(
  schoolId: string,
  prevState: unknown,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireOwner(schoolId);

  const rl = await rateLimitByUser(user.id, "saveInstructor");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const id = formData.get("id") as string | null;
  const name = (formData.get("name") as string)?.trim();
  const level = (formData.get("level") as string)?.trim();

  if (!name) return { ok: false, error: "Nome é obrigatório" };

  let avatarFile = formData.get("avatar") as File | null;
  if (avatarFile && avatarFile.size === 0) avatarFile = null;

  if (avatarFile) {
    if (!["image/png", "image/webp", "image/jpeg"].includes(avatarFile.type)) {
      return { ok: false, error: "Formato não permitido. Usa PNG, WebP ou JPEG" };
    }
    if (avatarFile.size > MAX_AVATAR_SIZE) {
      return { ok: false, error: "Foto demasiado grande. Máximo 1MB" };
    }
  }

  const admin = createAdminClient();
  let avatarUrl: string | null = null;

  // Upload new avatar if provided
  if (avatarFile) {
    const ext = avatarFile.type.split("/")[1].replace("jpeg", "jpg");
    const filePath = `${schoolId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, avatarFile, {
        contentType: avatarFile.type,
        upsert: false,
      });

    if (uploadError) {
      return { ok: false, error: "Erro ao carregar a foto." };
    }
    avatarUrl = filePath;
  }

  if (id) {
    // Update existing — get old avatar_url to remove if replaced
    if (avatarUrl) {
      const { data: old } = await supabase
        .from("instructors")
        .select("avatar_url")
        .eq("id", id)
        .eq("school_id", schoolId)
        .single();
      if (old?.avatar_url) {
        await admin.storage.from(AVATAR_BUCKET).remove([old.avatar_url]);
      }
    }

    const updateData: Record<string, string | null> = { name, level: level || "" };
    if (avatarUrl !== null) updateData.avatar_url = avatarUrl;

    const { error } = await supabase
      .from("instructors")
      .update(updateData)
      .eq("id", id)
      .eq("school_id", schoolId);

    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("instructors")
      .insert({
        school_id: schoolId,
        name,
        level: level || "",
        avatar_url: avatarUrl,
      });

    if (error) return { ok: false, error: error.message };
  }

  logAudit({
    schoolId,
    userId: user.id,
    action: id ? "update_instructor" : "create_instructor",
    entityType: "instructors",
    entityId: id ?? null,
  });

  return { ok: true };
}

export async function deleteInstructor(
  schoolId: string,
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireOwner(schoolId);

  const rl = await rateLimitByUser(user.id, "deleteInstructor");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  // Get avatar_url before deleting
  const { data: inst } = await supabase
    .from("instructors")
    .select("avatar_url")
    .eq("id", id)
    .eq("school_id", schoolId)
    .single();

  if (!inst) return { ok: false, error: "Instrutor não encontrado" };

  const admin = createAdminClient();

  const { error } = await supabase
    .from("instructors")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) return { ok: false, error: error.message };

  if (inst.avatar_url) {
    await admin.storage.from(AVATAR_BUCKET).remove([inst.avatar_url]);
  }

  logAudit({
    schoolId,
    userId: user.id,
    action: "delete_instructor",
    entityType: "instructors",
    entityId: id,
  });

  return { ok: true };
}

export type SchoolImage = {
  id: string;
  file_path: string;
  public_url: string;
  created_at: string;
};

export async function getImages(schoolId: string): Promise<SchoolImage[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("school_images")
    .select("id, file_path, created_at")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((img) => ({
    ...img,
    public_url: supabase.storage.from(BUCKET).getPublicUrl(img.file_path).data.publicUrl,
  }));
}

export async function addSchoolImage(
  schoolId: string,
  file: File
): Promise<{ ok: boolean; error?: string; filePath?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "addSchoolImage");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("id", schoolId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!school) return { ok: false, error: "Escola não encontrada" };

  // Check count before uploading
  const { count } = await supabase
    .from("school_images")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId);
  if (count != null && count >= MAX_IMAGES_PER_SCHOOL) {
    return { ok: false, error: `Máximo de ${MAX_IMAGES_PER_SCHOOL} imagens por negócio` };
  }

  // Size check (cheap, before magic bytes)
  if (file.size > MAX_IMAGE_SIZE) {
    return { ok: false, error: "Imagem demasiado grande. Máximo 2MB" };
  }

  // Magic bytes — não confiar no MIME do browser
  const validation = await validateImageContent(file);
  if (!validation.ok) {
    return { ok: false, error: validation.reason };
  }

  // Upload via admin client (bypasses storage RLS)
  const ext = validation.mime.split("/")[1].replace("jpeg", "jpg");
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `${schoolId}/${fileName}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(filePath, file, {
      contentType: validation.mime,
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, error: "Erro ao carregar a imagem." };
  }

  const { error: dbErr } = await supabase
    .from("school_images")
    .insert({ school_id: schoolId, file_path: filePath });

  if (dbErr) {
    await admin.storage.from(BUCKET).remove([filePath]);
    return { ok: false, error: dbErr.message };
  }

  logAudit({
    schoolId,
    userId: user.id,
    action: "add_school_image",
    entityType: "school_images",
    entityId: null,
  });

  return { ok: true, filePath };
}

export async function deleteImage(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "deleteImage");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: img } = await supabase
    .from("school_images")
    .select("file_path, school_id")
    .eq("id", id)
    .single();
  if (!img) return { ok: false, error: "Imagem não encontrada" };

  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("id", img.school_id)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!school) return { ok: false, error: "Sem permissão para eliminar esta imagem" };

  await supabase.storage.from(BUCKET).remove([img.file_path]);

  const { error } = await supabase
    .from("school_images")
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  logAudit({
    schoolId: img.school_id,
    userId: user.id,
    action: "delete_school_image",
    entityType: "school_images",
    entityId: id,
  });

  return { ok: true };
}

export type SchoolSettings = {
  cancellation_window_hours: number;
  low_occupancy_threshold: number;
  notify_email_confirmation: boolean;
  notify_reminder_24h: boolean;
  notify_sms_cancellation: boolean;
  notify_new_schedule: boolean;
};

export async function getSchoolSettings(schoolId: string): Promise<SchoolSettings | null> {
  const { supabase } = await requireOwner(schoolId);

  const [schoolRes, settingsRes] = await Promise.all([
    supabase.from("schools").select("cancellation_window_hours").eq("id", schoolId).single(),
    supabase.from("school_settings").select("*").eq("school_id", schoolId).maybeSingle(),
  ]);

  if (!schoolRes.data) return null;

  return {
    cancellation_window_hours: schoolRes.data.cancellation_window_hours,
    low_occupancy_threshold: settingsRes.data?.low_occupancy_threshold ?? 40,
    notify_email_confirmation: settingsRes.data?.notify_email_confirmation ?? true,
    notify_reminder_24h: settingsRes.data?.notify_reminder_24h ?? true,
    notify_sms_cancellation: settingsRes.data?.notify_sms_cancellation ?? false,
    notify_new_schedule: settingsRes.data?.notify_new_schedule ?? true,
  };
}

export async function saveSchoolSettings(
  schoolId: string,
  settings: SchoolSettings
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireOwner(schoolId);

  const rl = await rateLimitByUser(user.id, "saveSchoolSettings");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const [schoolErr, settingsErr] = await Promise.all([
    supabase
      .from("schools")
      .update({ cancellation_window_hours: settings.cancellation_window_hours })
      .eq("id", schoolId),
    supabase
      .from("school_settings")
      .upsert({
        school_id: schoolId,
        low_occupancy_threshold: settings.low_occupancy_threshold,
        notify_email_confirmation: settings.notify_email_confirmation,
        notify_reminder_24h: settings.notify_reminder_24h,
        notify_sms_cancellation: settings.notify_sms_cancellation,
        notify_new_schedule: settings.notify_new_schedule,
      }, { onConflict: "school_id" }),
  ]);

  if (schoolErr.error) return { ok: false, error: schoolErr.error.message };
  if (settingsErr.error) return { ok: false, error: settingsErr.error.message };

  return { ok: true };
}

export async function saveSchoolInfo(
  schoolId: string,
  data: { name: string; location: string; description: string }
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireOwner(schoolId);

  const rl = await rateLimitByUser(user.id, "saveSchoolInfo");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { error } = await supabase
    .from("schools")
    .update({
      name: data.name,
      location: data.location || null,
      description: data.description || null,
    })
    .eq("id", schoolId);

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
