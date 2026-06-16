import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getFavoriteSchools } from "../actions";
import { FavoritesView } from "./favorites-view";

export default async function FavoritosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const schools = await getFavoriteSchools();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Escolas Favoritas</h1>
        <p className="mt-1 text-gray-500">As suas escolas de surf preferidas.</p>
      </div>
      <FavoritesView schools={schools} />
    </div>
  );
}
