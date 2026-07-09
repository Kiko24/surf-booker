"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByUser } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { safeError } from "@/lib/safe-error";
import { validateImageContent } from "@/lib/utils/validate-image";

const BUCKET = "school-images";
const MAX_IMAGES_PER_SCHOOL = 6;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

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

  const { count } = await supabase
    .from("school_images")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId);
  if (count != null && count >= MAX_IMAGES_PER_SCHOOL) {
    return { ok: false, error: `Máximo de ${MAX_IMAGES_PER_SCHOOL} imagens por negócio` };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return { ok: false, error: "Imagem demasiado grande. Máximo 2MB" };
  }

  const validation = await validateImageContent(file);
  if (!validation.ok) {
    return { ok: false, error: validation.reason };
  }

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

  if (error) return { ok: false, error: safeError(error) };

  logAudit({
    schoolId: img.school_id,
    userId: user.id,
    action: "delete_school_image",
    entityType: "school_images",
    entityId: id,
  });

  return { ok: true };
}
