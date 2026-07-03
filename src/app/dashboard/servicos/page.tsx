import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServicosView } from "./_components/servicos-view";
import { getSchoolId } from "@/lib/school";

export default async function ServicosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const schoolId = await getSchoolId();

  return <ServicosView schoolId={schoolId} />;
}
