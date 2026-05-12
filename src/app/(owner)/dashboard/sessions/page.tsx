import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { createSession } from "./actions";
import DateTimePicker from "@/components/ui/DateTimePicker";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-PT", {
    style: "currency",
    currency: "EUR",
  });
}

export default async function SessionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: school } = await supabase
    .from("schools")
    .select("id, name")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!school) {
    redirect("/dashboard");
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("school_id", school.id)
    .order("starts_at", { ascending: true });

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              ← Voltar ao dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Sessões
            </h1>
            <p className="text-sm text-slate-500">{school.name}</p>
          </div>
        </div>

        {/* Form criar sessão */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Criar nova sessão
          </h2>

          <form
            action={createSession}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Título
              </label>
              <input
                name="title"
                placeholder="Ex: Aula iniciantes"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Data e hora</label>
                <DateTimePicker name="starts_at" required />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Duração (min)
              </label>
              <input
                type="number"
                name="duration_minutes"
                placeholder="90"
                min="1"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Capacidade
              </label>
              <input
                type="number"
                name="capacity"
                placeholder="8"
                min="1"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Preço (€)
              </label>
              <input
                type="number"
                name="price_euros"
                placeholder="35"
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Criar sessão
              </button>
            </div>
          </form>
        </div>

        {/* Lista de sessões */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Próximas sessões
          </h2>

          {!sessions || sessions.length === 0 ? (
            <p className="text-sm text-slate-500">
              Ainda não tens sessões criadas.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {s.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(s.starts_at)} · {s.duration_minutes} min
                      · {s.capacity} vagas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatPrice(s.price_cents)}
                    </p>
                    {s.status === "cancelled" && (
                      <span className="text-xs text-red-600">Cancelada</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}