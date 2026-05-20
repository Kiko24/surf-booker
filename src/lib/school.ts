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
