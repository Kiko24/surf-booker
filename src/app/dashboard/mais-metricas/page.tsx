import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MetricasView } from "./_components/metricas-view";

export default async function MetricasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <MetricasView />;
}
