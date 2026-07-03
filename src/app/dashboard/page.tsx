import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "./_components/dashboard-view";
import { getSchoolId } from "@/lib/school";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const schoolId = await getSchoolId();

  return (
    <DashboardView
      schoolId={schoolId ?? ""}
    />
  );
}
