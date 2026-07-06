import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — Alaia",
  description: "Política de privacidade da plataforma Alaia.",
};

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-[#F7FAFC] px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-heading text-3xl font-bold text-gray-900">Política de Privacidade</h1>
        <p className="mt-1 text-gray-600">Última atualização: 2026</p>
        <div className="mt-8 space-y-6 text-sm text-gray-700 leading-relaxed">
          <p>A Alaia respeita a tua privacidade. Esta política descreve como recolhemos, usamos e protegemos os teus dados.</p>
          <h2 className="font-heading text-lg font-bold text-gray-900">1. Dados Recolhidos</h2>
          <p>Recolhemos nome, email, e informações de faturação quando crias uma conta.</p>
          <h2 className="font-heading text-lg font-bold text-gray-900">2. Uso dos Dados</h2>
          <p>Os dados são usados para fornecer, manter e melhorar a plataforma, processar pagamentos e comunicar contigo.</p>
          <h2 className="font-heading text-lg font-bold text-gray-900">3. Armazenamento</h2>
          <p>Os teus dados são armazenados em servidores seguros com encriptação. Utilizamos a Supabase como fornecedor de base de dados.</p>
          <h2 className="font-heading text-lg font-bold text-gray-900">4. Cookies</h2>
          <p>Utilizamos cookies essenciais para o funcionamento da plataforma. Não usamos cookies de rastreio de terceiros para publicidade.</p>
          <h2 className="font-heading text-lg font-bold text-gray-900">5. Os Teus Direitos</h2>
          <p>Podes solicitar a exportação ou eliminação dos teus dados a qualquer momento através do nosso formulário de contacto.</p>

        </div>
      </div>
    </main>
  );
}
