import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CalendarioView } from "./_components/calendario-view";
import { getSchoolId } from "@/lib/school";

function CalendarFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-text-muted">A carregar calendário...</p>
      </div>
    </div>
  );
}

export default async function CalendarioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/calendario");
  }

  const schoolId = await getSchoolId();

  return (
    <Suspense fallback={<CalendarFallback />}>
      <CalendarioView schoolId={schoolId} />
    </Suspense>
  );
}
