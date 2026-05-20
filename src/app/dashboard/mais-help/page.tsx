import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MaisHelpView } from "./_components/mais-help-view";

export default async function MaisHelpPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <MaisHelpView />;
}
