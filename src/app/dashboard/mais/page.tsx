import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MaisView } from "./_components/mais-view";
import { getSchoolId } from "@/lib/school";

export default async function MaisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const schoolId = await getSchoolId();

  return <MaisView schoolId={schoolId} />;
}
