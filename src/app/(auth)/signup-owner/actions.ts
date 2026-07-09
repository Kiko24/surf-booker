"use server";

import { signupUser, resendEmail, type SignupInput, type SignupResult } from "@/lib/auth/signup";
import { rateLimitPublic } from "@/lib/rate-limit";

export type SignupOwnerInput = SignupInput;
export type SignupOwnerResult = SignupResult;

export async function signupOwner(input: SignupOwnerInput): Promise<SignupOwnerResult> {
  const rl = await rateLimitPublic("signup", 3, "60 s");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  return signupUser(input, "owner", "/onboarding", "signupOwner");
}

export async function resendConfirmationEmail(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const rl = await rateLimitPublic("resendConfirmation", 3, "60 s");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  return resendEmail(email, "/onboarding", "resendConfirmationEmail");
}
