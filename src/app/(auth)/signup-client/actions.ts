"use server";

import { signupUser, resendEmail, type SignupInput, type SignupResult } from "@/lib/auth/signup";

export type SignupClientInput = SignupInput;
export type SignupClientResult = SignupResult;

export async function signupClient(input: SignupClientInput): Promise<SignupClientResult> {
  return signupUser(input, "client", "/", "signupClient");
}

export async function resendClientConfirmationEmail(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  return resendEmail(email, "/", "resendClientConfirmationEmail");
}
