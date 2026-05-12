import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header simples */}
      <header className="px-6 py-4">
        <Link href="/" className="text-xl font-bold text-sky-600">
          🌊 SurfBooker
        </Link>
      </header>

      {/* Conteúdo centrado */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer minimal */}
      <footer className="px-6 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} SurfBooker
      </footer>
    </div>
  );
}