import { createClient } from "@/lib/supabase/server";

export async function getSchoolId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("schools")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  return data?.id ?? null;
}

export type RequireOwnerResult = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string };
};

export async function requireOwner(schoolId: string): Promise<RequireOwnerResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("id", schoolId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!school) throw new Error("Sem permissão");

  return { supabase, user };
}
