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

  const schoolId = await getSchoolId();

  return <CalendarioView schoolId={schoolId} />;
}
