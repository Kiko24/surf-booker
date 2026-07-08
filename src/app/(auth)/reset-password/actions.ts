"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { assertValidOrigin } from "@/lib/csrf";

export type ResetPasswordResult =
  | { ok: true }
  | { ok: false; error: string; field?: string; code?: "expired" | "same_password" | "generic" };

function normalizeResetError(message?: string): {
  error: string;
  code: "expired" | "same_password" | "generic";
} {
  const msg = (message ?? "").toLowerCase();

  if (
    msg.includes("expired") ||
    msg.includes("invalid token") ||
    msg.includes("invalid refresh token") ||
    msg.includes("token has expired")
  ) {
    return {
      error: "Este link expirou. Pede um novo link de recuperação.",
      code: "expired",
    };
  }

  if (
    msg.includes("should be different") ||
    msg.includes("same as the old password") ||
    msg.includes("new password should be different")
  ) {
    return {
      error: "A nova password tem de ser diferente da anterior.",
      code: "same_password",
    };
  }

  return {
    error: "Erro ao actualizar a password. Tenta novamente.",
    code: "generic",
  };
}

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
      code: "generic",
    };
  }

  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida", code: "generic" }; }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: "Sessão inválida ou expirada. Pede um novo link de recuperação.",
      code: "expired",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    console.error("[updatePassword] error", error);
    const normalized = normalizeResetError(error.message);
    return {
      ok: false,
      error: normalized.error,
      code: normalized.code,
    };
  }

  await supabase.auth.signOut();
  redirect("/login");
}