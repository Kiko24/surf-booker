"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fullSignupSchema } from "@/lib/validation/signup-owner";

export type SignupOwnerInput = {
  email: string;
  name: string;
  password: string;
  phone: string;
  country: "PT";
  acceptedTerms: boolean;
};

export type SignupOwnerResult =
  | { ok: true }
  | { ok: false; error: string; field?: keyof SignupOwnerInput };

function getEmailRedirectTo(path: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) return undefined;
  return `${siteUrl}${path}`;
}

function normalizeAuthError(message?: string) {
  const msg = (message ?? "").toLowerCase();

  if (
    msg.includes("already registered") ||
    msg.includes("already exists") ||
    msg.includes("user already registered")
  ) {
    return {
      error: "Já existe uma conta com este email",
      field: "email" as const,
    };
  }

  if (msg.includes("rate limit")) {
    return {
      error: "Já enviámos um email há pouco. Tenta novamente dentro de alguns minutos.",
    };
  }

  return {
    error: "Não foi possível concluir o pedido. Tenta novamente.",
  };
}

export async function signupOwner(
  input: SignupOwnerInput
): Promise<SignupOwnerResult> {
  const parsed = fullSignupSchema.safeParse(input);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Dados inválidos",
      field: issue?.path[0] as keyof SignupOwnerInput | undefined,
    };
  }

  const { email, password, name, phone, country } = parsed.data;
  const supabase = await createClient();
  const emailRedirectTo = getEmailRedirectTo("/onboarding");

  console.log("[signupOwner] start", { email });

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    ...(emailRedirectTo
      ? {
          options: {
            emailRedirectTo,
          },
        }
      : {}),
  });

  console.log("[signupOwner] signUp result", {
    hasUser: !!signUpData.user,
    userId: signUpData.user?.id,
    error: signUpError?.message,
  });

  if (signUpError) {
    const normalized = normalizeAuthError(signUpError.message);

    return {
      ok: false,
      error: normalized.error,
      field: normalized.field,
    };
  }

  const userId = signUpData.user?.id;

  if (!userId) {
    console.error("[signupOwner] missing user id after signUp", {
      email,
    });

    return { ok: false, error: "Erro inesperado ao criar conta" };
  }

  const admin = createAdminClient();
  const acceptedAt = new Date().toISOString();

  console.log("[signupOwner] inserting profile", {
    userId,
    role: "owner",
  });

  const { error: profileError } = await admin.from("profiles").insert({
    user_id: userId,
    full_name: name,
    phone: `+351${phone}`,
    country,
    role: "owner",
    accepted_terms_at: acceptedAt,
    accepted_privacy_at: acceptedAt,
  });

  if (profileError) {
    console.error("[signupOwner] profile insert failed", profileError);

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("[signupOwner] cleanup delete failed", deleteError);
    }

    return {
      ok: false,
      error: "Erro ao criar perfil. Tenta novamente.",
    };
  }

  console.log("[signupOwner] success", { userId });

  return { ok: true };
}

// ============================================================
// Reenviar email de confirmação
// ============================================================
export async function resendConfirmationEmail(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false, error: "Email inválido" };
  }

  const supabase = await createClient();
  const emailRedirectTo = getEmailRedirectTo("/onboarding");

  console.log("[resendConfirmationEmail] start", {
    email: normalizedEmail,
  });

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: normalizedEmail,
    ...(emailRedirectTo
      ? {
          options: {
            emailRedirectTo,
          },
        }
      : {}),
  });

  if (error) {
    console.error("[resendConfirmationEmail] failed", {
      email: normalizedEmail,
      error: error.message,
    });

    const normalized = normalizeAuthError(error.message);

    return { ok: false, error: normalized.error };
  }

  console.log("[resendConfirmationEmail] success", {
    email: normalizedEmail,
  });

  return { ok: true };
}