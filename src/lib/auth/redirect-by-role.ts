import type { SupabaseClient } from "@supabase/supabase-js";

export type RedirectDestination = "/onboarding" | "/dashboard" | "/";

export async function getRedirectByRole(
  supabase: SupabaseClient,
  userId: string
): Promise<RedirectDestination> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (!profile) return "/";

  if (profile.role === "owner") {
    const { data: school } = await supabase
      .from("schools")
      .select("id")
      .eq("owner_user_id", userId)
      .maybeSingle();

    return school ? "/dashboard" : "/onboarding";
  }

  if (profile.role === "staff") {
    return "/dashboard";
  }

  return "/";
}

export function isSafeNextPath(next: string | null | undefined): boolean {
  if (!next) return false;
  // Só permite paths internos, sem URLs externas
  return next.startsWith("/") && !next.startsWith("//");
}