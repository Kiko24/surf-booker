import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Como a Alaia organiza a tua escola — Alaia",
  description:
    "Descobre como a Alaia ajuda escolas de surf a gerir reservas, waivers, alunos e packs de aulas.",
};

export default function ComoOrganizarMelhorPage() {
  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-10 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between rounded-full border border-gray-200 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm">
          <nav className="flex items-center gap-1">
            <Link href="/#como-funciona" className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent-light">
              Como funciona?
            </Link>
            <Link href="/#contacto" className="font-body rounded-full px-3 py-1.5 text-sm font-semibold text-gray-900 transition-all hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent-light">
              Contacto
            </Link>
          </nav>

          <Link href="/" className="font-heading text-xl font-bold text-accent-light">
            Alaia
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/onboarding" className="font-body hidden rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 sm:block">
              Entrar
            </Link>
            <Link href="/signup-owner" className="font-body rounded-full border border-accent-light bg-white px-4 py-2 text-sm font-semibold text-accent-light transition-colors hover:bg-accent-light hover:text-white">
              Registar o seu negócio
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-[#F7FAFC] px-5 pt-28 pb-16 sm:px-8 sm:pt-32 sm:pb-24">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
          <h1 className="font-heading text-3xl font-bold text-gray-900">
            Como a Alaia organiza a tua escola
          </h1>
          <p className="mt-2 text-gray-600">
            Menos confusão, mais surf. Vê o que muda em cada área.
          </p>
          <div className="mt-10 space-y-8">
            {/* Reservas */}
            <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h2 className="font-heading text-xl font-bold text-gray-900">Reservas</h2>
              </div>
              <p className="mt-4 font-body text-sm leading-relaxed text-gray-700">
                <span className="font-semibold text-red-600">Antes:</span> Gerias as reservas por WhatsApp ou telefone. Cada aula era uma chamada perdida, um papel esquecido, um aluno que não aparecia.
              </p>
              <p className="mt-3 font-body text-sm leading-relaxed text-gray-700">
                <span className="font-semibold text-green-600">Depois:</span> Os teus alunos marcam online 24/7, recebem confirmação automática e lembretes antes da aula. Tu vês o calendário cheio sem atender um único telefone.
              </p>
              <span className="mt-4 inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-800">~5h/semana poupadas</span>
            </div>
            {/* Waivers */}
            <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="font-heading text-xl font-bold text-gray-900">Waivers</h2>
              </div>
              <p className="mt-4 font-body text-sm leading-relaxed text-gray-700">
                <span className="font-semibold text-red-600">Antes:</span> Cada aluno preenchia uma declaração de responsabilidade em papel, muitas vezes na areia, com sol e vento. Perdias tempo a imprimir, arquivar e — pior — se algo acontecesse, o papel podia valer de pouco.
              </p>
              <p className="mt-3 font-body text-sm leading-relaxed text-gray-700">
                <span className="font-semibold text-green-600">Depois:</span> O waiver é enviado antes da aula, o aluno assina digitalmente pelo telemóvel e tu tens tudo registado com data e hora. Sem papel, sem risco.
              </p>
              <span className="mt-4 inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-800">~2h/semana poupadas</span>
            </div>
            {/* Alunos */}
            <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h2 className="font-heading text-xl font-bold text-gray-900">Alunos</h2>
              </div>
              <p className="mt-4 font-body text-sm leading-relaxed text-gray-700">
                <span className="font-semibold text-red-600">Antes:</span> O nome do aluno estava num post-it, num grupo de WhatsApp ou na cabeça do instrutor. Saber quantas aulas já fez, qual o nível ou quando foi a última vez era um filme.
              </p>
              <p className="mt-3 font-body text-sm leading-relaxed text-gray-700">
                <span className="font-semibold text-green-600">Depois:</span> Cada aluno tem perfil completo: histórico de aulas, nível, waivers assinados, contacto. Tu sabes quem é, o que fez e o que precisa a seguir.
              </p>
              <span className="mt-4 inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-800">~3h/semana poupadas</span>
            </div>
            {/* Packs de aulas */}
            <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h2 className="font-heading text-xl font-bold text-gray-900">Packs de aulas</h2>
              </div>
              <p className="mt-4 font-body text-sm leading-relaxed text-gray-700">
                <span className="font-semibold text-red-600">Antes:</span> O pagamento era aula a aula, "depois combina-se". No final do mês não sabias quanto ias receber e os alunos apareciam quando calhava.
              </p>
              <p className="mt-3 font-body text-sm leading-relaxed text-gray-700">
                <span className="font-semibold text-green-600">Depois:</span> Vendes packs de aulas adiantados, garantes receita previsível e os alunos comprometem-se. Menos aulas vagas, mais faturação estável.
              </p>
              <span className="mt-4 inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-800">~2h/semana poupadas</span>
            </div>
          </div>
          {/* CTA final */}
          <div className="mt-16 text-center">
            <Link href="/signup-owner" className="group inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-black shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.04] hover:-translate-y-0.5">
              Experimentar grátis
              <svg className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <p className="mt-3 text-xs text-gray-400">Sem compromisso. 14 dias grátis.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-700 bg-gray-800 px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="max-w-xs">
              <Link href="/" className="font-heading text-xl font-bold text-white">
                Alaia
              </Link>
              <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                Plataforma de gestão para escolas de surf e desportos aquáticos.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Produto
              </p>
              <Link href="/#como-funciona" className="text-sm text-gray-300 transition-colors hover:text-accent-light focus-visible:outline-2 focus-visible:outline-accent-light">
                Como funciona?
              </Link>
              <Link href="/#contacto" className="text-sm text-gray-300 transition-colors hover:text-accent-light focus-visible:outline-2 focus-visible:outline-accent-light">
                Contacto
              </Link>
              <Link href="/signup-owner" className="text-sm text-gray-300 transition-colors hover:text-accent-light focus-visible:outline-2 focus-visible:outline-accent-light">
                Registar o seu negócio
              </Link>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">&copy; 2026 Alaia</p>
            <div className="flex gap-4 text-xs text-gray-400">
              <Link href="/termos" className="hover:text-accent-light transition-colors focus-visible:outline-2 focus-visible:outline-accent-light">Termos</Link>
              <Link href="/privacidade" className="hover:text-accent-light transition-colors focus-visible:outline-2 focus-visible:outline-accent-light">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
