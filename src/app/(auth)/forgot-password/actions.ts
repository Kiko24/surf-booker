"use server";

import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "@/lib/validation/auth";

export type ForgotPasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export async function sendResetEmail(
  email: string
): Promise<ForgotPasswordResult> {
  const parsed = forgotPasswordSchema.safeParse({ email });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Email inválido",
    };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: siteUrl ? `${siteUrl}/reset-password` : undefined,
  });

  if (error) {
    const msg = error.message.toLowerCase();

    if (msg.includes("rate limit")) {
      return {
        ok: false,
        error: "Demasiados pedidos. Tenta novamente daqui a uns minutos.",
      };
    }

    console.error("[sendResetEmail] error", error);
  }

  // Importante: sempre devolver "ok" para não revelar se o email existe (anti-enumeration)
  return { ok: true };
}