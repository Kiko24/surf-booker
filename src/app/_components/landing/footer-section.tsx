import Link from "next/link";

export function FooterSection() {
  return (
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
            <button
              onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm text-gray-300 text-left transition-colors hover:text-accent-light focus-visible:outline-2 focus-visible:outline-accent-light"
            >
              Como funciona?
            </button>
            <button
              onClick={() => document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm text-gray-300 text-left transition-colors hover:text-accent-light focus-visible:outline-2 focus-visible:outline-accent-light"
            >
              Contacto
            </button>
            <a
              href="/signup-owner"
              className="text-sm text-gray-300 transition-colors hover:text-accent-light focus-visible:outline-2 focus-visible:outline-accent-light"
            >
              Registar o seu negócio
            </a>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">&copy; 2026 Alaia</p>
          <div className="flex gap-4 text-xs text-gray-400">
            <a href="/termos-e-condicoes" className="hover:text-accent-light transition-colors focus-visible:outline-2 focus-visible:outline-accent-light">Termos</a>
            <a href="/politica-de-privacidade" className="hover:text-accent-light transition-colors focus-visible:outline-2 focus-visible:outline-accent-light">Privacidade</a>
            <a href="/politica-de-cookies" className="hover:text-accent-light transition-colors focus-visible:outline-2 focus-visible:outline-accent-light">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
