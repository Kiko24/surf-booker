import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DefinicoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-gray-900">Definições</h2>
      <p className="text-gray-500">Configurações do teu perfil e preferências.</p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="font-heading text-lg font-semibold text-gray-900 mb-4">Perfil</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Nome</dt>
              <dd className="text-gray-900 font-medium">{profile.full_name}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Email</dt>
              <dd className="text-gray-900 font-medium">{profile.email ?? user.email}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Telemóvel</dt>
              <dd className="text-gray-900 font-medium">{profile.phone || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="font-heading text-lg font-semibold text-gray-900 mb-4">Conta</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Tipo de conta</dt>
              <dd className="text-gray-900 font-medium">Aluno</dd>
            </div>
            <div>
              <dt className="text-gray-400">Membro desde</dt>
              <dd className="text-gray-900 font-medium">—</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
