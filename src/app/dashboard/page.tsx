import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "./_components/dashboard-view";
import { getTodaySessions, getAlertas, getRecentActivity } from "./actions";
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
  let todaySessions = schoolId ? await getTodaySessions(schoolId) : [];

  if (todaySessions.length < 3) {
    const placeholders = [
      { id: "mock-1", time: "09:00", durationMinutes: 60, title: "Iniciantes", inscritos: 3, capacidade: 8, alunosList: [{ name: "Ana Silva" }, { name: "João Pedro" }, { name: "Maria Santos" }] },
      { id: "mock-2", time: "11:00", durationMinutes: 90, title: "Intermedios", inscritos: 5, capacidade: 6, alunosList: [{ name: "Rui Costa" }, { name: "Sofia Almeida" }, { name: "Carlos Pereira" }, { name: "Inês Ferreira" }, { name: "Miguel Oliveira" }] },
      { id: "mock-3", time: "14:30", durationMinutes: 75, title: "Avançados", inscritos: 4, capacidade: 6, alunosList: [{ name: "Pedro Lima" }, { name: "Rita Martins" }, { name: "Diago Ribeiro" }] },
    ];
    todaySessions = [...todaySessions, ...placeholders].slice(0, 3);
  }
  const metricas = schoolId ? await getMetricas("esta_semana") : null;
  const alertas = schoolId ? await getAlertas(schoolId) : [];
  const recentActivity = schoolId ? await getRecentActivity(schoolId) : [];

  return (
    <DashboardView
      fullName={profile?.full_name ?? "Utilizador"}
      todaySessions={todaySessions}
      metricas={metricas}
      alertas={alertas}
      schoolId={schoolId ?? ""}
      recentActivity={recentActivity}
    />
  );
}
