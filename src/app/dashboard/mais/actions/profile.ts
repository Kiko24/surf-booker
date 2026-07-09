"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByUser } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { safeError } from "@/lib/safe-error";
import { assertValidOrigin } from "@/lib/csrf";
import { passwordSchema } from "@/lib/validation/signup-owner";

export async function saveProfile(data: {
  name: string;
  email: string;
  phone: string;
  password?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

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

  const { error: profileErr } = await admin
    .from("profiles")
    .update({ full_name: trimmedName, phone: trimmedPhone })
    .eq("user_id", user.id);
  if (profileErr) return { ok: false, error: profileErr.message };

  if (emailTrimmed !== user.email) {
    const { error: emailErr } = await admin.auth.admin.updateUserById(user.id, { email: emailTrimmed });
    if (emailErr) return { ok: false, error: "Erro ao atualizar email: " + safeError(emailErr) };
  }

  if (data.password) {
    const parsed = passwordSchema.safeParse(data.password);
    if (!parsed.success) {
      return { ok: false, error: safeError(parsed.error) ?? "Password inválida" };
    }
    const { error: pwdErr } = await admin.auth.admin.updateUserById(user.id, { password: data.password });
    if (pwdErr) return { ok: false, error: "Erro ao atualizar palavra-passe: " + safeError(pwdErr) };

    const clientSupabase = await createClient();
    await clientSupabase.auth.signOut();
    redirect("/login");
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
