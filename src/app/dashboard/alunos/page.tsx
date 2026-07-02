import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlunosView } from "./_components/alunos-view";
import { getStudents } from "./actions";
import { getSchoolId } from "@/lib/school";

export default async function AlunosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const schoolId = await getSchoolId();
  const students = schoolId ? await getStudents(schoolId) : [];

  return <AlunosView schoolId={schoolId ?? ""} students={students} />;
}
