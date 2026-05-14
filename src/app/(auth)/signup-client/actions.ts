"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fullSignupSchema } from "@/lib/validation/signup-owner";

export type SignupClientInput = {
  email: string;
  name: string;
  password: string;
  phone: string;
  country: "PT";
  acceptedTerms: boolean;
};

export type SignupClientResult =
  | { ok: true }
  | { ok: false; error: string; field?: keyof SignupClientInput };

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

export async function signupClient(
  input: SignupClientInput
): Promise<SignupClientResult> {
  const parsed = fullSignupSchema.safeParse(input);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Dados inválidos",
      field: issue?.path[0] as keyof SignupClientInput | undefined,
    };
  }

  const { email, password, name, phone, country } = parsed.data;
  const supabase = await createClient();
  const emailRedirectTo = getEmailRedirectTo("/");

  console.log("[signupClient] start", { email });

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

  console.log("[signupClient] signUp result", {
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
    console.error("[signupClient] missing user id after signUp", {
      email,
    });

    return { ok: false, error: "Erro inesperado ao criar conta" };
  }

  const admin = createAdminClient();
  const acceptedAt = new Date().toISOString();

  console.log("[signupClient] inserting profile", {
    userId,
    role: "client",
  });

  const { error: profileError } = await admin.from("profiles").insert({
    user_id: userId,
    full_name: name,
    phone: `+351${phone}`,
    country,
    role: "client",
    accepted_terms_at: acceptedAt,
    accepted_privacy_at: acceptedAt,
  });

  if (profileError) {
    console.error("[signupClient] profile insert failed", profileError);

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("[signupClient] cleanup delete failed", deleteError);
    }

    return {
      ok: false,
      error: "Erro ao criar perfil. Tenta novamente.",
    };
  }

  console.log("[signupClient] success", { userId });

  return { ok: true };
}

export async function resendClientConfirmationEmail(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false, error: "Email inválido" };
  }

  const supabase = await createClient();
  const emailRedirectTo = getEmailRedirectTo("/");

  console.log("[resendClientConfirmationEmail] start", {
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
    console.error("[resendClientConfirmationEmail] failed", {
      email: normalizedEmail,
      error: error.message,
    });

    const normalized = normalizeAuthError(error.message);

    return { ok: false, error: normalized.error };
  }

  console.log("[resendClientConfirmationEmail] success", {
    email: normalizedEmail,
  });

  return { ok: true };
}