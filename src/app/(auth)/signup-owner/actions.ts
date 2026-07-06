"use server";

import { signupUser, resendEmail, type SignupInput, type SignupResult } from "@/lib/auth/signup";

export type SignupOwnerInput = SignupInput;
export type SignupOwnerResult = SignupResult;

export async function signupOwner(input: SignupOwnerInput): Promise<SignupOwnerResult> {
  return signupUser(input, "owner", "/onboarding", "signupOwner");
}

export async function resendConfirmationEmail(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  return resendEmail(email, "/onboarding", "resendConfirmationEmail");
}
