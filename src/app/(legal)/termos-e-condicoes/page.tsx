export default function TermosPage() {
  return (
    <main className="min-h-screen bg-[#F7FAFC]">
      <div className="mx-auto max-w-3xl px-5 pt-28 pb-16 sm:px-8 sm:pt-32 sm:pb-20">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-8">
          Termos e Condições
        </h1>
        <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
          <p>
            Bem-vindo à Alaia. Ao utilizares a nossa plataforma, aceitas os presentes Termos e Condições.
            Recomendamos a leitura atenta deste documento antes de utilizares qualquer um dos nossos serviços.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">1. Objeto</h2>
          <p>
            A Alaia é uma plataforma digital que permite a escolas de surf e desportos aquáticos gerir
            as suas reservas, horários, alunos e comunicação. Os presentes Termos regulam a relação entre
            a Alaia e os utilizadores da plataforma, incluindo proprietários de escolas e alunos.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">2. Definições</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Plataforma</strong> — o conjunto de serviços digitais disponibilizados sob a marca Alaia.</li>
            <li><strong>Proprietário</strong> — entidade que regista uma escola na plataforma e define os seus serviços, horários e condições próprias.</li>
            <li><strong>Aluno</strong> — pessoa que reserva ou adquire serviços através da plataforma.</li>
            <li><strong>Escola</strong> — estabelecimento registado na plataforma por um Proprietário.</li>
          </ul>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">3. Utilização da Plataforma</h2>
          <p>
            O utilizador compromete-se a utilizar a plataforma de forma lícita, respeitando a legislação
            aplicável e os direitos de terceiros. É proibido usar a plataforma para fins fraudulentos ou
            que possam danificar, desativar ou sobrecarregar a infraestrutura.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">4. Reservas e Pagamentos</h2>
          <p>
            As reservas efetuadas através da plataforma estão sujeitas à confirmação pela escola.
            Os preços apresentados são os definidos por cada escola. O pagamento é processado diretamente
            entre o aluno e a escola, salvo indicação em contrário. Cada escola define as suas próprias
            políticas de cancelamento e reembolso, as quais devem ser consultadas antes da reserva.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">5. Responsabilidade</h2>
          <p>
            A Alaia atua como intermediária tecnológica, não sendo responsável pela qualidade dos serviços
            prestados pelas escolas, nem por danos ocorridos durante a execução dos mesmos. A responsabilidade
            pela execução dos serviços é exclusivamente da escola contratada.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">6. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo disponível na plataforma, incluindo textos, logótipos, gráficos e software,
            é propriedade da Alaia ou dos seus licenciadores, estando protegido pelas leis de propriedade
            intelectual. É proibida a reprodução, distribuição ou modificação sem autorização prévia.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">7. Alterações aos Termos</h2>
          <p>
            A Alaia reserva-se o direito de alterar os presentes Termos e Condições a qualquer momento.
            As alterações serão comunicadas através da plataforma. O uso continuado após a comunicação
            das alterações implica a aceitação das mesmas.
          </p>

          <h2 className="font-heading text-xl font-bold text-gray-900 mt-8">8. Lei Aplicável</h2>
          <p>
            Estes Termos regem-se pela lei portuguesa. Qualquer litígio será submetido à jurisdição
            dos tribunais da comarca do Porto, com expressa renúncia a qualquer outro foro.
          </p>

          <p className="mt-8 text-xs text-gray-400">
            Última atualização: julho de 2026
          </p>
        </div>
      </div>
    </main>
  );
}
