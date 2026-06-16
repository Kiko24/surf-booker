"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByUser } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { validateImageContent } from "@/lib/utils/validate-image";
import type { SupabaseClient } from "@supabase/supabase-js";

const ALLOWED_LOGO_MIMES = ["image/png", "image/jpeg", "image/webp"];
const LOGO_BUCKET = "school-logos";

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
      return { ok: false, error: `Foto demasiado grande. Máximo ${MAX_AVATAR_SIZE / (1024 * 1024)}MB` };
    }
    const validation = await validateImageContent(avatarFile);
    if (!validation.ok) {
      return { ok: false, error: validation.reason };
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
      console.error("[saveInstructor] upload error:", uploadError);
      return { ok: false, error: `Erro ao carregar a foto: ${uploadError.message}` };
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

async function ensureLogoBucketExists(admin: SupabaseClient) {
  const { data: buckets } = await admin.storage.listBuckets();
  if (buckets?.find((b) => b.name === LOGO_BUCKET)) return;

  await admin.storage.createBucket(LOGO_BUCKET, {
    public: true,
    allowedMimeTypes: ALLOWED_LOGO_MIMES,
    fileSizeLimit: 2 * 1024 * 1024,
  });
}

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return { supabase, user };
}

export async function saveProfile(data: {
  name: string;
  email: string;
  phone: string;
  password?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "saveProfile");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const trimmedName = data.name.trim();
  if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 80) {
    return { ok: false, error: "Nome deve ter entre 2 e 80 caracteres" };
  }
  if (!/\S+\s+\S+/.test(trimmedName)) {
    return { ok: false, error: "Insere o nome completo" };
  }

  const trimmedPhone = data.phone.trim();
  if (!trimmedPhone || trimmedPhone.length < 6 || trimmedPhone.length > 20 || !/^[0-9+() /.\-]+$/.test(trimmedPhone)) {
    return { ok: false, error: "Telemóvel inválido (6-20 caracteres)" };
  }

  const emailTrimmed = data.email.trim();
  if (!emailTrimmed) return { ok: false, error: "Email é obrigatório" };
  if (emailTrimmed.length > 160) return { ok: false, error: "Email demasiado longo" };

  const admin = createAdminClient();

  // Update profiles table
  const { error: profileErr } = await admin
    .from("profiles")
    .update({ full_name: trimmedName, phone: trimmedPhone })
    .eq("user_id", user.id);
  if (profileErr) return { ok: false, error: profileErr.message };

  // Update auth email if changed
  if (emailTrimmed !== user.email) {
    const { error: emailErr } = await admin.auth.admin.updateUserById(user.id, { email: emailTrimmed });
    if (emailErr) return { ok: false, error: "Erro ao atualizar email: " + emailErr.message };
  }

  // Update password if provided
  if (data.password) {
    if (data.password.length < 6) return { ok: false, error: "Palavra-passe deve ter pelo menos 6 caracteres" };
    const { error: pwdErr } = await admin.auth.admin.updateUserById(user.id, { password: data.password });
    if (pwdErr) return { ok: false, error: "Erro ao atualizar palavra-passe: " + pwdErr.message };
  }

  logAudit({
    schoolId: null,
    userId: user.id,
    action: "update_profile",
    entityType: "profiles",
    entityId: user.id,
    metadata: { nameChanged: trimmedName !== user.user_metadata?.full_name },
  });

  return { ok: true };
}

export async function saveSchoolLogo(
  schoolId: string,
  file: File
): Promise<{ ok: boolean; error?: string; url?: string }> {
  const { supabase, user } = await requireAuth();

  // Verify ownership
  const { data: school } = await supabase
    .from("schools")
    .select("id, logo_url")
    .eq("id", schoolId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!school) return { ok: false, error: "Escola não encontrada" };

  const rl = await rateLimitByUser(user.id, "saveSchoolLogo");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  // Size check
  if (file.size > 2 * 1024 * 1024) return { ok: false, error: "Logotipo demasiado grande. Máximo 2MB" };

  // Validate content
  const validation = await validateImageContent(file);
  if (!validation.ok) return { ok: false, error: validation.reason };

  const admin = createAdminClient();

  // Ensure bucket exists
  await ensureLogoBucketExists(admin);

  const ext = validation.mime.split("/")[1].replace("jpeg", "jpg");
  const path = `${schoolId}/logo.${ext}`;

  // Remove old logo if exists
  if (school.logo_url) {
    const oldPath = school.logo_url.split("/").pop();
    if (oldPath) {
      await admin.storage.from(LOGO_BUCKET).remove([`${schoolId}/${oldPath}`]);
    }
  }

  const { error: uploadError } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { upsert: true, contentType: validation.mime });
  if (uploadError) return { ok: false, error: "Erro ao carregar o logotipo." };

  const { data: { publicUrl } } = admin.storage.from(LOGO_BUCKET).getPublicUrl(path);

  const { error: updateErr } = await supabase
    .from("schools")
    .update({ logo_url: publicUrl })
    .eq("id", schoolId);
  if (updateErr) {
    await admin.storage.from(LOGO_BUCKET).remove([path]);
    return { ok: false, error: updateErr.message };
  }

  logAudit({
    schoolId,
    userId: user.id,
    action: "update_school_logo",
    entityType: "schools",
    entityId: schoolId,
  });

  return { ok: true, url: publicUrl };
}

/* ---------- Waivers ---------- */

export type WaiverVersion = {
  id: string;
  version: number;
  title: string;
  body: string;
  is_active: boolean;
  created_at: string;
  acceptance_count: number;
};

export async function getWaiverVersions(schoolId: string): Promise<WaiverVersion[]> {
  const { supabase } = await requireOwner(schoolId);

  const { data } = await supabase
    .from("waiver_versions")
    .select("id, version, title, body, is_active, created_at")
    .eq("school_id", schoolId)
    .order("version", { ascending: false });

  if (!data) return [];

  const versions = await Promise.all(
    data.map(async (v) => {
      const { count } = await supabase
        .from("waiver_acceptances")
        .select("id", { count: "exact", head: true })
        .eq("waiver_version_id", v.id);
      return { ...v, acceptance_count: count ?? 0 };
    })
  );

  return versions;
}

export type WaiverAcceptanceRow = {
  id: string;
  student_name: string;
  accepted_at: string;
};

export async function getWaiverAcceptances(schoolId: string, waiverVersionId: string): Promise<WaiverAcceptanceRow[]> {
  const { supabase } = await requireOwner(schoolId);

  const { data } = await supabase
    .from("waiver_acceptances")
    .select("id, school_id, student_id, accepted_at")
    .eq("school_id", schoolId)
    .eq("waiver_version_id", waiverVersionId)
    .order("accepted_at", { ascending: false });

  if (!data) return [];

  const admin = createAdminClient();
  const rows: WaiverAcceptanceRow[] = [];
  for (const a of data) {
    const { data: student } = await admin
      .from("students")
      .select("full_name")
      .eq("id", a.student_id)
      .single();
    rows.push({
      id: a.id,
      student_name: student?.full_name ?? "Desconhecido",
      accepted_at: a.accepted_at,
    });
  }
  return rows;
}

export async function saveWaiverVersion(
  schoolId: string,
  data: { title: string; body: string }
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireOwner(schoolId);

  const rl = await rateLimitByUser(user.id, "saveWaiverVersion");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const trimmedTitle = data.title.trim();
  const trimmedBody = data.body.trim();
  if (!trimmedTitle || trimmedTitle.length > 150) return { ok: false, error: "Título deve ter entre 1 e 150 caracteres" };
  if (!trimmedBody || trimmedBody.length > 20000) return { ok: false, error: "Texto deve ter entre 1 e 20000 caracteres" };

  // Get current max version
  const { data: maxVer } = await supabase
    .from("waiver_versions")
    .select("version")
    .eq("school_id", schoolId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (maxVer?.version ?? 0) + 1;

  // Deactivate current active
  await supabase
    .from("waiver_versions")
    .update({ is_active: false })
    .eq("school_id", schoolId)
    .eq("is_active", true);

  // Insert new version
  const { error } = await supabase
    .from("waiver_versions")
    .insert({
      school_id: schoolId,
      version: nextVersion,
      title: trimmedTitle,
      body: trimmedBody,
      is_active: true,
    });

  if (error) return { ok: false, error: error.message };

  logAudit({
    schoolId,
    userId: user.id,
    action: "create_waiver_version",
    entityType: "waiver_versions",
    entityId: null,
    metadata: { version: nextVersion, title: trimmedTitle },
  });

  return { ok: true };
}

export async function saveSchoolInfo(
  schoolId: string,
  data: { name: string; location: string; description: string; phone: string }
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
      phone: data.phone || null,
    })
    .eq("id", schoolId);

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
