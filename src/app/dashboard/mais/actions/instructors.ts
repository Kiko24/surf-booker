"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByUser } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { safeError } from "@/lib/safe-error";
import { validateImageContent } from "@/lib/utils/validate-image";
import { requireOwner } from "@/lib/school";

const AVATAR_BUCKET = "instructor-avatars";
const MAX_AVATAR_SIZE = 1024 * 1024;

export type Instructor = {
  id: string;
  name: string;
  level: string;
  avatar_url: string | null;
};

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
      console.error("[saveInstructor] upload error");
      return { ok: false, error: `Erro ao carregar a foto: ${uploadError.message}` };
    }
    avatarUrl = filePath;
  }

  if (id) {
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

    if (error) return { ok: false, error: safeError(error) };
  } else {
    const { error } = await supabase
      .from("instructors")
      .insert({
        school_id: schoolId,
        name,
        level: level || "",
        avatar_url: avatarUrl,
      });

    if (error) return { ok: false, error: safeError(error) };
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

  if (error) return { ok: false, error: safeError(error) };

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
