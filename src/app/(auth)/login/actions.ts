"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";
import { getRedirectByRole, isSafeNextPath } from "@/lib/auth/redirect-by-role";
import { assertValidOrigin } from "@/lib/csrf";
import { rateLimitPublic } from "@/lib/rate-limit";

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string; code?: "email_not_confirmed" | "invalid_credentials" | "rate_limit" | "generic" };

function normalizeLoginError(message?: string): {
  error: string;
  code: "email_not_confirmed" | "invalid_credentials" | "rate_limit" | "generic";
} {
  const msg = (message ?? "").toLowerCase();

  if (msg.includes("email not confirmed")) {
    return {
      error: "Confirma o teu email antes de fazer login.",
      code: "email_not_confirmed",
    };
  }

  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid email or password")
  ) {
    return {
      error: "Email ou password incorretos.",
      code: "invalid_credentials",
    };
  }

  if (msg.includes("rate limit") || msg.includes("too many")) {
    return {
      error: "Demasiadas tentativas. Tenta novamente daqui a uns minutos.",
      code: "rate_limit",
    };
  }

  return {
    error: "Não foi possível iniciar sessão. Tenta novamente.",
    code: "generic",
  };
}

export async function signIn(input: {
  email: string;
  password: string;
  nextPath?: string;
}): Promise<LoginResult> {
  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida", code: "generic" }; }

  const rl = await rateLimitPublic("login", 5, "60 s");
  if (!rl.ok) return { ok: false, error: "Muitas tentativas. Tenta novamente mais tarde.", code: "rate_limit" };

  const parsed = loginSchema.safeParse({
    email: input.email,
    password: input.password,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      code: "generic",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const normalized = normalizeLoginError(error.message);
    return {
      ok: false,
      error: normalized.error,
      code: normalized.code,
    };
  }

  if (!data.user) {
    return {
      ok: false,
      error: "Erro inesperado ao iniciar sessão.",
      code: "generic",
    };
  }

  const safeNext = isSafeNextPath(input.nextPath) ? input.nextPath! : null;
  const destination = safeNext ?? (await getRedirectByRole(supabase, data.user.id));

  redirect(destination);
}

export async function resendConfirmationFromLogin(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try { await assertValidOrigin(); } catch { return { ok: false, error: "Origem inválida" }; }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false, error: "Email inválido" };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: normalizedEmail,
    ...(siteUrl
      ? {
          options: {
            emailRedirectTo: `${siteUrl}/onboarding`,
          },
        }
      : {}),
  });

  if (error) {
    const msg = error.message.toLowerCase();

    if (msg.includes("rate limit") || msg.includes("too many")) {
      return {
        ok: false,
        error: "Já enviámos um email há pouco. Tenta novamente dentro de alguns minutos.",
      };
    }

    if (msg.includes("already confirmed")) {
      return {
        ok: false,
        error: "Esta conta já está confirmada. Faz login normalmente.",
      };
    }

    return { ok: false, error: "Erro ao reenviar email." };
  }

  return { ok: true };
}