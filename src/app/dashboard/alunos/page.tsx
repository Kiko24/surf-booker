import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlunosView } from "./_components/alunos-view";

export default async function AlunosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", user.id)
    .single();

  return <AlunosView fullName={profile?.full_name ?? "Utilizador"} />;
}
