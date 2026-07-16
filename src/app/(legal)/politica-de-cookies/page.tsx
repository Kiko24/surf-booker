export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[#F7FAFC]">
      <div className="mx-auto max-w-3xl px-5 pt-28 pb-16 sm:px-8 sm:pt-32 sm:pb-20">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-8">
          Política de Cookies
        </h1>
        <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
          <p>
            Esta Política de Cookies explica o que são cookies, como os utilizamos na plataforma Alaia
            e como podes gerir as tuas preferências.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">1. O que são Cookies?</h2>
          <p>
            Cookies são pequenos ficheiros de texto armazenados no teu navegador quando visitas um site.
            Permitem que o site se lembre de informações sobre a tua visita, preferências e outras
            funcionalidades para melhorar a tua experiência.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">2. Tipos de Cookies</h2>

          <h3 className="font-heading text-lg font-bold text-gray-900 mt-6">Cookies Essenciais</h3>
          <p>
            São necessários para o funcionamento da plataforma. Permitem a autenticação do utilizador,
            a gestão de sessões e a manutenção de preferências básicas. Sem estes cookies, algumas
            funcionalidades podem não estar disponíveis.
          </p>

          <h3 className="font-heading text-lg font-bold text-gray-900 mt-6">Cookies Funcionais</h3>
          <p>
            Armazenam preferências do utilizador, como o tema (claro/escuro) e configurações de idioma,
            para proporcionar uma experiência personalizada.
          </p>

          <h3 className="font-heading text-lg font-bold text-gray-900 mt-6">Cookies Analíticos</h3>
          <p>
            Recolhem informação anónima sobre a utilização da plataforma, como páginas visitadas,
            tempo de permanência e interações. Estes dados ajudam-nos a melhorar a plataforma.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">3. Lista de Cookies Utilizados</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="border-b border-gray-300 text-xs uppercase text-gray-500">
                <tr>
                  <th className="pb-2 pr-4 font-semibold">Nome</th>
                  <th className="pb-2 pr-4 font-semibold">Domínio</th>
                  <th className="pb-2 pr-4 font-semibold">Duração</th>
                  <th className="pb-2 font-semibold">Finalidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 pr-4 font-mono text-xs">sb-*-auth-token</td>
                  <td className="py-3 pr-4">alaia.pt</td>
                  <td className="py-3 pr-4">Sessão</td>
                  <td className="py-3">Autenticação do utilizador (Supabase)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono text-xs">alaia_cookie_consent</td>
                  <td className="py-3 pr-4">alaia.pt</td>
                  <td className="py-3 pr-4">1 ano</td>
                  <td className="py-3">Registo do consentimento de cookies</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono text-xs">alaia_theme</td>
                  <td className="py-3 pr-4">alaia.pt</td>
                  <td className="py-3 pr-4">1 ano</td>
                  <td className="py-3">Preferência de tema (claro/escuro)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono text-xs">cf-turnstile-*</td>
                  <td className="py-3 pr-4">.alaia.pt</td>
                  <td className="py-3 pr-4">Sessão</td>
                  <td className="py-3">Proteção anti-spam (Cloudflare Turnstile)</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-xs text-gray-400">
              O cookie <strong>cf-turnstile-*</strong> é definido pelo Cloudflare Turnstile,
              um serviço de terceiros utilizado para proteção anti-spam.
            </p>
          </div>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">4. Gestão de Cookies</h2>
          <p>
            Podes gerir ou desativar cookies através das definições do teu navegador. No entanto,
            a desativação de cookies essenciais pode afetar o funcionamento da plataforma.
          </p>
          <p className="mt-2">
            Para gerir cookies na maioria dos navegadores:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Chrome:</strong> Definições &rarr; Privacidade e segurança &rarr; Cookies</li>
            <li><strong>Firefox:</strong> Preferências &rarr; Privacidade e Segurança &rarr; Cookies</li>
            <li><strong>Safari:</strong> Preferências &rarr; Privacidade &rarr; Cookies</li>
            <li><strong>Edge:</strong> Definições &rarr; Cookies e permissões &rarr; Cookies</li>
          </ul>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">5. Contacto</h2>
          <p>
            Se tiveres dúvidas sobre esta Política de Cookies, contacta-nos através dos meios
            disponíveis na plataforma.
          </p>

          <p className="mt-8 text-xs text-gray-400">
            Última atualização: julho de 2026
          </p>
        </div>
      </div>
    </main>
  );
}
