import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DefinicoesView } from "../_components/definicoes-view";

export default async function DefinicoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role === "owner") redirect("/dashboard");

  const { data: student } = await supabase
    .from("students")
    .select("full_name, email, phone")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (
    <DefinicoesView
      student={student ?? null}
      authEmail={user.email ?? null}
    />
  );
}
