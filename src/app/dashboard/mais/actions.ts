"use server";

import { createClient } from "@/lib/supabase/server";
import { rateLimitByUser } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

const BUCKET = "school-images";
const MAX_IMAGES_PER_SCHOOL = 6;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIMES = ["image/png", "image/webp", "image/jpeg"];

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

export async function addImageRecord(
  schoolId: string,
  filePath: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "addImageRecord");
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
    await supabase.storage.from(BUCKET).remove([filePath]);
    return { ok: false, error: `Máximo de ${MAX_IMAGES_PER_SCHOOL} imagens por negócio` };
  }

  // Validate uploaded file exists and respects limits
  const fileName = filePath.split("/")[1];
  const { data: files } = await supabase.storage.from(BUCKET).list(schoolId, { limit: 10 });
  const uploaded = files?.find((f) => f.name === fileName);
  if (!uploaded) {
    await supabase.storage.from(BUCKET).remove([filePath]);
    return { ok: false, error: "Ficheiro não encontrado no storage" };
  }
  const meta = uploaded.metadata as Record<string, unknown> | undefined;
  if (meta) {
    const fileSize = typeof meta.size === "number" ? meta.size : Number(meta.size);
    if (!isNaN(fileSize) && fileSize > MAX_IMAGE_SIZE) {
      await supabase.storage.from(BUCKET).remove([filePath]);
      return { ok: false, error: "Imagem demasiado grande. Máximo 2MB" };
    }
    const fileMime = typeof meta.mimetype === "string" ? meta.mimetype.toLowerCase() : "";
    if (fileMime && !ALLOWED_MIMES.includes(fileMime)) {
      await supabase.storage.from(BUCKET).remove([filePath]);
      return { ok: false, error: "Formato não permitido. Usa PNG, WebP ou JPEG" };
    }
  }

  const { error: dbErr } = await supabase
    .from("school_images")
    .insert({ school_id: schoolId, file_path: filePath });

  if (dbErr) {
    await supabase.storage.from(BUCKET).remove([filePath]);
    return { ok: false, error: dbErr.message };
  }

  logAudit({
    schoolId,
    userId: user.id,
    action: "add_school_image",
    entityType: "school_images",
    entityId: null,
  });

  return { ok: true };
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
