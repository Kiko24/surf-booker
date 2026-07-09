import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fullSignupSchema } from "@/lib/validation/signup-owner";
import { logAudit } from "@/lib/audit";

export type SignupInput = {
  email: string;
  name: string;
  password: string;
  phone: string;
  country: "PT";
  acceptedTerms: boolean;
};

export type SignupResult =
  | { ok: true }
  | { ok: false; error: string; field?: keyof SignupInput };

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
    return { error: "Não foi possível concluir o pedido. Tenta novamente." };
  }

  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return { error: "Já enviámos um email há pouco. Tenta novamente dentro de alguns minutos." };
  }

  if (msg.includes("invalid login credentials") || msg.includes("invalid email or password")) {
    return { error: "Email ou password incorretos" };
  }

  if (msg.includes("email not confirmed")) {
    return { error: "Confirma o teu email antes de iniciar sessão" };
  }

  if (msg.includes("expired") || msg.includes("invalid token")) {
    return { error: "Este link expirou. Pede um novo." };
  }

  if (msg.includes("network") || msg.includes("fetch")) {
    return { error: "Erro de ligação. Verifica a tua internet e tenta novamente." };
  }

  return { error: "Não foi possível concluir o pedido. Tenta novamente." };
}

export async function signupUser(
  input: SignupInput,
  role: "owner" | "client",
  redirectPath: string,
  logPrefix: string,
): Promise<SignupResult> {
  const parsed = fullSignupSchema.safeParse(input);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Dados inválidos",
      field: issue?.path[0] as keyof SignupInput | undefined,
    };
  }

  const { email, password, name, phone, country } = parsed.data;
  const supabase = await createClient();
  const emailRedirectTo = getEmailRedirectTo(redirectPath);

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    ...(emailRedirectTo ? { options: { emailRedirectTo } } : {}),
  });

  if (signUpError) {
    const normalized = normalizeAuthError(signUpError.message);
    return { ok: false, error: normalized.error };
  }

  const identities = signUpData.user?.identities ?? [];
  if (identities.length === 0) {
    return { ok: false, error: "Não foi possível concluir o pedido. Tenta novamente.", field: "email" };
  }

  const userId = signUpData.user?.id;

  if (!userId) {
    console.error(`[${logPrefix}] missing user id after signUp`);
    return { ok: false, error: "Erro inesperado ao criar conta" };
  }

  const admin = createAdminClient();
  const acceptedAt = new Date().toISOString();

  const { error: profileError } = await admin.from("profiles").insert({
    user_id: userId,
    full_name: name,
    phone: `+351${phone}`,
    country,
    role,
    accepted_terms_at: acceptedAt,
    accepted_privacy_at: acceptedAt,
  });

  if (profileError) {
    console.error(`[${logPrefix}] profile insert failed`);

    const isDuplicate =
      profileError.code === "23505" ||
      profileError.message?.toLowerCase().includes("duplicate key") ||
      profileError.message?.toLowerCase().includes("unique constraint");

    if (isDuplicate) {
      return { ok: false, error: "Já existe uma conta com este email", field: "email" as const };
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error(`[${logPrefix}] cleanup delete failed`);
    }

    return { ok: false, error: "Erro ao criar perfil. Tenta novamente." };
  }

  logAudit({
    schoolId: null,
    userId,
    action: "signup",
    entityType: "profile",
    entityId: userId,
    metadata: { role, name },
  });

  return { ok: true };
}

export async function resendEmail(
  email: string,
  redirectPath: string,
  logPrefix: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false, error: "Email inválido" };
  }

  const supabase = await createClient();
  const emailRedirectTo = getEmailRedirectTo(redirectPath);

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: normalizedEmail,
    ...(emailRedirectTo ? { options: { emailRedirectTo } } : {}),
  });

  if (error) {
    console.error(`[${logPrefix}] resend failed`);
    const normalized = normalizeAuthError(error.message);
    return { ok: false, error: normalized.error };
  }

  return { ok: true };
}
