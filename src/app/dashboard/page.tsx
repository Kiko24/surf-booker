import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-svh bg-background p-8 text-foreground font-body">
      <h1 className="font-heading text-3xl font-medium">Dashboard</h1>
      <p className="mt-2 text-text-secondary">Em construção.</p>
    </div>
  );
}