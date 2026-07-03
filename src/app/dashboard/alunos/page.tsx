import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlunosView } from "./_components/alunos-view";
import { getSchoolId } from "@/lib/school";

export default async function AlunosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const schoolId = await getSchoolId();

  return <AlunosView schoolId={schoolId ?? ""} />;
}
