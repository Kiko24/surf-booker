import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { createSchool, logout } from "./actions";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: school } = await supabase
    .from("schools")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!school) {
    return (
      <main className="min-h-screen bg-slate-50 p-4">
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Criar escola
              </h1>
              <p className="text-sm text-slate-500">
                Sessão iniciada como {user.email}
              </p>
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Sair
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm text-slate-600">
              Antes de avançares, preenche os dados da tua escola.
            </p>

            <form action={createSchool} className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Nome da escola
                </label>
                <input
                  name="name"
                  placeholder="Ex: Porto's Surf School"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Localidade
                </label>
                <input
                  name="locality"
                  placeholder="Ex: Porto"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Criar escola
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {school.name}
            </h1>
            <p className="text-sm text-slate-500">
              {school.locality} · /{school.slug}
            </p>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Sair
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <h2 className="mb-2 text-lg font-semibold text-slate-900">
    Gerir escola
  </h2>
  <p className="mb-4 text-sm text-slate-600">
    Cria e gere as sessões da tua escola.
  </p>
  <Link
    href="/dashboard/sessions"
    className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
  >
    Ver sessões →
  </Link>
</div>
      </div>
    </main>
  );
}