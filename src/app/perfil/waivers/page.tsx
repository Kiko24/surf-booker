import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getWaiverAcceptances } from "../actions";
import { WaiversView } from "./waivers-view";

export default async function WaiversPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const waivers = await getWaiverAcceptances();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Waivers</h1>
        <p className="mt-1 text-gray-500">
          Registos de waivers que aceitou nas escolas.
        </p>
      </div>
      <WaiversView waivers={waivers} />
    </div>
  );
}
