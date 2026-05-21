import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MaisView } from "./_components/mais-view";
import { getSchoolInfo } from "../actions";
import { getSchoolId } from "@/lib/school";

export default async function MaisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("user_id", user.id)
    .single();

  const school = await getSchoolInfo();
  const schoolId = await getSchoolId();

  return (
    <MaisView
      fullName={profile?.full_name ?? "Utilizador"}
      email={user.email ?? ""}
      phone={profile?.phone ?? ""}
      schoolName={school?.name ?? null}
      schoolLogoUrl={school?.logo_url ?? null}
      schoolLocation={school?.location ?? null}
      schoolDescription={school?.description ?? null}
      cancellationWindowHours={school?.cancellation_window_hours ?? 24}
      schoolId={schoolId}
    />
  );
}
