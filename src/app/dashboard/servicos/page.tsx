import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServicosView } from "./_components/servicos-view";
import { getSchoolId, getServicos } from "./actions";

export default async function ServicosPage() {
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

  const schoolId = await getSchoolId();
  const sessions = schoolId ? await getServicos(schoolId) : [];

  return <ServicosView fullName={profile?.full_name ?? "Utilizador"} sessions={sessions} schoolId={schoolId} />;
}
