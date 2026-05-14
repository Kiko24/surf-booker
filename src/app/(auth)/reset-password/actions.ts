"use server";

import { createClient } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/validation/auth";

export type ResetPasswordResult =
  | { ok: true }
  | { ok: false; error: string; field?: string };

export async function updatePassword(input: {
  password: string;
  confirmPassword: string;
}): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse(input);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Dados inválidos",
      field: issue?.path[0]?.toString(),
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: "Sessão inválida ou expirada. Pede um novo link de recuperação.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    console.error("[updatePassword] error", error);
    return {
      ok: false,
      error: "Erro ao actualizar a password. Tenta novamente.",
    };
  }

  return { ok: true };
}