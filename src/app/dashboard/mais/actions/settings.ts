"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByUser } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { safeError } from "@/lib/safe-error";
import { validateImageContent } from "@/lib/utils/validate-image";
import { requireOwner } from "@/lib/school";
import type { SupabaseClient } from "@supabase/supabase-js";

const ALLOWED_LOGO_MIMES = ["image/png", "image/jpeg", "image/webp"];
const LOGO_BUCKET = "school-logos";

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

  if (schoolErr.error) return { ok: false, error: safeError(schoolErr.error) };
  if (settingsErr.error) return { ok: false, error: safeError(settingsErr.error) };

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

  if (error) return { ok: false, error: safeError(error) };

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

export async function saveSchoolLogo(
  schoolId: string,
  file: File
): Promise<{ ok: boolean; error?: string; url?: string }> {
  const { supabase, user } = await requireAuth();

  const { data: school } = await supabase
    .from("schools")
    .select("id, logo_url")
    .eq("id", schoolId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!school) return { ok: false, error: "Escola não encontrada" };

  const rl = await rateLimitByUser(user.id, "saveSchoolLogo");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  if (file.size > 2 * 1024 * 1024) return { ok: false, error: "Logotipo demasiado grande. Máximo 2MB" };

  const validation = await validateImageContent(file);
  if (!validation.ok) return { ok: false, error: validation.reason };

  const admin = createAdminClient();

  await ensureLogoBucketExists(admin);

  const ext = validation.mime.split("/")[1].replace("jpeg", "jpg");
  const path = `${schoolId}/logo.${ext}`;

  const { data: oldFiles } = await admin.storage.from(LOGO_BUCKET).list(schoolId, { limit: 10 });
  if (oldFiles && oldFiles.length > 0) {
    await admin.storage.from(LOGO_BUCKET).remove(oldFiles.map(f => `${schoolId}/${f.name}`));
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
