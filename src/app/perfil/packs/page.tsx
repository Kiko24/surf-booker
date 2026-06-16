import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getStudentPacks } from "../actions";
import { PacksView } from "./packs-view";

export default async function PacksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const packs = await getStudentPacks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Os Meus Packs</h1>
        <p className="mt-1 text-gray-500">Gerir os seus packs de aulas.</p>
      </div>
      <PacksView packs={packs} />
    </div>
  );
}
