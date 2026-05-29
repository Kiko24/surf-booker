import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos e Condições — Alaia",
  description: "Termos e condições de uso da plataforma Alaia.",
};

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-[#F7FAFC] px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-heading text-3xl font-bold text-gray-900">Termos e Condições</h1>
        <p className="mt-1 text-gray-600">Última atualização: 2026</p>
        <div className="mt-8 space-y-6 text-sm text-gray-700 leading-relaxed">
          <p>Bem-vindo à Alaia. Ao utilizar a nossa plataforma, aceitas os seguintes termos e condições.</p>
          <h2 className="font-heading text-lg font-bold text-gray-900">1. Uso da Plataforma</h2>
          <p>A Alaia é uma plataforma de gestão para escolas de surf e desportos aquáticos. O utilizador compromete-se a utilizar a plataforma de acordo com a lei e os presentes termos.</p>
          <h2 className="font-heading text-lg font-bold text-gray-900">2. Conta</h2>
          <p>É responsável por manter a confidencialidade dos seus dados de acesso e por todas as atividades ocorridas na sua conta.</p>
          <h2 className="font-heading text-lg font-bold text-gray-900">3. Pagamentos</h2>
          <p>Os pagamentos são processados através de plataformas externas seguras. A Alaia não armazena dados de cartões de crédito.</p>
          <h2 className="font-heading text-lg font-bold text-gray-900">4. Cancelamento</h2>
          <p>Podes cancelar a tua subscrição em qualquer momento. Os dados serão mantidos durante o período de faturação ativo.</p>
          <h2 className="font-heading text-lg font-bold text-gray-900">5. Contacto</h2>
          <p>Para questões relacionadas com estes termos, contacta-nos através do formulário na página inicial.</p>
          <p className="text-gray-500 pt-4">Este documento serve como placeholder. Consulta um advogado para versão final.</p>
        </div>
      </div>
    </main>
  );
}
