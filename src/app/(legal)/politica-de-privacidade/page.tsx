export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-[#F7FAFC]">
      <div className="mx-auto max-w-3xl px-5 pt-28 pb-16 sm:px-8 sm:pt-32 sm:pb-20">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-8">
          Política de Privacidade
        </h1>
        <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
          <p>
            A Alaia respeita a privacidade dos seus utilizadores. A presente Política de Privacidade
            descreve como recolhemos, usamos, armazenamos e protegemos os dados pessoais.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">1. Responsável pelo Tratamento</h2>
          <p>
            O responsável pelo tratamento dos dados é o proprietário da plataforma Alaia.
            Para questões relacionadas com privacidade, podes contactar-nos através do email disponível
            na secção de contacto da plataforma.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">2. Dados Recolhidos</h2>
          <p>Podemos recolher os seguintes dados pessoais:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Nome, email e número de telefone — para gestão de reservas e comunicação.</li>
            <li>Dados de navegação — endereço IP, browser, páginas visitadas, para análise de tráfego e melhoria da plataforma.</li>
            <li>Preferências de tema e configurações locais, armazenadas no teu navegador.</li>
          </ul>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">3. Finalidades e Bases Legais do Tratamento</h2>
          <p>O tratamento dos teus dados pessoais tem como fundamento as seguintes bases legais, conforme o Regulamento Geral de Proteção de Dados (RGPD):</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Execução de um contrato (Art. 6.º, n.º 1, al. b))</strong> — o tratamento dos dados é necessário para processar e gerir as reservas que efetuas nas escolas, bem como para a comunicação relacionada com essas reservas.</li>
            <li><strong>Consentimento (Art. 6.º, n.º 1, al. a))</strong> — a recolha de cookies analíticos e funcionais depende do teu consentimento prévio, que podes gerir ou retirar a qualquer momento.</li>
            <li><strong>Interesse legítimo (Art. 6.º, n.º 1, al. f))</strong> — a melhoria contínua da plataforma, a análise de tráfego e a segurança dos nossos serviços baseiam-se no nosso interesse legítimo em oferecer uma experiência segura e de qualidade.</li>
            <li><strong>Cumprimento de obrigação legal (Art. 6.º, n.º 1, al. c))</strong> — alguns dados podem ser conservados para cumprir obrigações fiscais, contabilísticas ou legais a que estamos sujeitos.</li>
          </ul>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">4. Partilha de Dados</h2>
          <p>
            Os dados pessoais são partilhados exclusivamente com as escolas às quais o utilizador
            faz reservas, para efeitos de execução do serviço contratado. Não vendemos nem partilhamos
            dados pessoais com terceiros para fins de marketing.
          </p>
          <p className="mt-2">
            Podemos ainda partilhar dados com prestadores de serviços tecnológicos (alojamento,
            armazenamento, análise) que atuam como subcontratantes, estando estes obrigados
            contratualmente a respeitar as mesmas normas de proteção de dados.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">5. Transferências Internacionais</h2>
          <p>
            Os teus dados pessoais são armazenados e processados principalmente na União Europeia.
            Caso sejam utilizados prestadores de serviços localizados fora do Espaço Económico Europeu,
            garantimos que essas transferências são realizadas ao abrigo de garantias adequadas,
            como cláusulas contratuais tipo aprovadas pela Comissão Europeia.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">6. Conservação dos Dados</h2>
          <p>
            Os dados são conservados pelo período necessário à execução dos serviços e cumprimento
            de obrigações legais, nomeadamente:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Dados de reserva:</strong> até 3 anos após a última reserva, para gestão de histórico e cumprimento de obrigações fiscais.</li>
            <li><strong>Dados de faturação:</strong> 10 anos (prazo legal obrigatório em Portugal).</li>
            <li><strong>Dados de navegação e cookies:</strong> conforme o prazo de cada cookie, indicado na nossa Política de Cookies.</li>
            <li><strong>Preferências de consentimento:</strong> 1 ano, renovável.</li>
          </ul>
          <p className="mt-2">Após estes prazos, os dados serão eliminados ou anonimizados.</p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">7. Obrigatoriedade de Fornecimento dos Dados</h2>
          <p>
            O fornecimento dos dados de contacto (nome, email e telefone) é necessário para a
            execução do serviço de reservas. Sem estes dados, não é possível processar a tua reserva.
            O fornecimento de dados de navegação e cookies analíticos é opcional e depende do teu consentimento.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">8. Direitos do Titular</h2>
          <p>
            Ao abrigo do RGPD, tens o direito de:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Aceder</strong> aos teus dados pessoais;</li>
            <li><strong>Retificar</strong> dados inexatos ou incompletos;</li>
            <li><strong>Solicitar a eliminação</strong> dos teus dados ("direito ao esquecimento");</li>
            <li><strong>Limitar o tratamento</strong> em determinadas circunstâncias;</li>
            <li><strong>Opor-te ao tratamento</strong> para fins de marketing direto;</li>
            <li><strong>Portabilidade</strong> dos dados para outro prestador de serviço;</li>
            <li><strong>Retirar o consentimento</strong> a qualquer momento, sem comprometer a licitude do tratamento efetuado até essa data.</li>
          </ul>
          <p className="mt-2">
            Para exercer estes direitos, contacta-nos através do email disponível na plataforma.
            Responderemos ao teu pedido no prazo máximo de 30 dias.
          </p>
          <p className="mt-2">
            Caso consideres que o teu pedido não foi devidamente tratado, tens o direito de apresentar
            reclamação à autoridade de supervisão competente — a <strong>Comissão Nacional de Proteção de Dados (CNPD)</strong>.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">9. Segurança</h2>
          <p>
            Implementamos medidas técnicas e organizativas adequadas para proteger os dados pessoais
            contra acesso não autorizado, perda ou destruição. No entanto, nenhum sistema é completamente
            seguro, pelo que não podemos garantir a segurança absoluta.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">10. Cookies</h2>
          <p>
            A plataforma utiliza cookies essenciais para o seu funcionamento e cookies analíticos
            para melhorar a experiência. Para mais informações, consulta a nossa{" "}
            <a href="/politica-de-cookies" className="text-accent underline hover:text-accent-light">Política de Cookies</a>.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">11. Alterações</h2>
          <p>
            Esta Política de Privacidade pode ser atualizada periodicamente. As alterações serão
            comunicadas através da plataforma.
          </p>

          <p className="mt-8 text-xs text-gray-400">
            Última atualização: julho de 2026
          </p>
        </div>
      </div>
    </main>
  );
}
