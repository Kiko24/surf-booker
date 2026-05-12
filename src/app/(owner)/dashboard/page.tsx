import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { logout } from './actions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
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
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            Setup inicial concluído
          </h2>
          <p className="text-sm text-slate-600">
            O login do dono está a funcionar. O próximo passo é ligar este dono
            a uma escola e começar a mostrar sessões reais.
          </p>
        </div>
      </div>
    </main>
  )
}