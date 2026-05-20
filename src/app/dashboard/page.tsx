import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "./_components/dashboard-view";
import { getTodaySessions, getAlertas } from "./actions";
import { getMetricas } from "./mais-metricas/actions";
import { getSchoolId } from "@/lib/school";

export default async function DashboardPage() {
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
  const todaySessions = schoolId ? await getTodaySessions(schoolId) : [];
  const metricas = schoolId ? await getMetricas("esta_semana") : null;
  const alertas = schoolId ? await getAlertas(schoolId) : [];

  return (
    <DashboardView
      fullName={profile?.full_name ?? "Utilizador"}
      todaySessions={todaySessions}
      metricas={metricas}
      alertas={alertas}
      schoolId={schoolId ?? ""}
    />
  );
}
