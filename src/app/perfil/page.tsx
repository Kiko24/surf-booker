import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientOverviewView } from "./_components/client-overview-view";
import { getClientOverview } from "./actions";

export default async function AreaClientePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role === "owner") redirect("/dashboard");

  const overview = await getClientOverview();

  return <ClientOverviewView overview={overview} />;
}
