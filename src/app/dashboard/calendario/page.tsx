import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CalendarioView } from "./_components/calendario-view";
import { getSchoolId } from "@/lib/school";

export default async function CalendarioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/calendario");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const schoolId = await getSchoolId();

  return <CalendarioView fullName={profile?.full_name ?? "Utilizador"} schoolId={schoolId} />;
}
