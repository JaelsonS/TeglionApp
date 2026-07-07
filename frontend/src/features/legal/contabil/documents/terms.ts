import type { LegalDocument } from '@/features/legal/contabil/types'
import { CONTABIL_LEGAL_VERSIONS } from '@/features/legal/contabil/versions'

export const termsDocument: LegalDocument = {
  key: 'terms',
  title: 'Termos de Utilização',
  subtitle: 'Contrato de licença de software (SaaS) — escritórios de contabilidade',
  updatedAtLabel: 'Versão',
  updatedAtValue: '22 de maio de 2026',
  version: CONTABIL_LEGAL_VERSIONS.terms,
  intro: [
    'Os presentes Termos de Utilização («Termos») regulam o acesso e a utilização da plataforma TegLion («Plataforma», «Serviço»), disponibilizada por Jaelson Silva dos Santos, NIF 331 759 276, com sede em Coimbra, Portugal («Operador», «nós»).',
    'Ao criar conta de escritório, convidar utilizadores ou utilizar o Serviço, o representante do escritório declara ter poderes para vincular a entidade e aceita integralmente estes Termos.',
    'A Plataforma destina-se exclusivamente a escritórios de contabilidade e respetivos clientes finais (empresas ou particulares com relação contratual com o escritório).',
  ],
  sections: [
    {
      id: 'natureza',
      title: '1. Natureza do Serviço — software, não contabilidade',
      paragraphs: [
        'O TegLion é um software de gestão digital em modelo SaaS (Software as a Service): carteira de clientes, obrigações fiscais, documentos, mensagens, alertas, agenda de consultorias e portal do cliente.',
        'O Operador não presta serviços de contabilidade, assessoria fiscal, representação perante a Autoridade Tributária ou qualquer ato reservado a profissionais habilitados. Todas as decisões fiscais, prazos legais e conformidade regulatória são da exclusiva responsabilidade do escritório e dos seus profissionais.',
        'Nenhuma funcionalidade da Plataforma constitui aconselhamento jurídico, fiscal ou financeiro por parte do Operador.',
      ],
    },
    {
      id: 'elegibilidade',
      title: '2. Elegibilidade e contas',
      paragraphs: [
        'Podem registar-se apenas pessoas singulares ou coletivas que exerçam atividade de contabilidade ou gestão administrativa/fiscal de terceiros, ou clientes finais convidados pelo escritório.',
        'O escritório é responsável pela veracidade dos dados de registo, pela gestão de credenciais dos seus utilizadores e por todas as acções realizadas na conta do escritório.',
        'O cliente final acede apenas aos dados e documentos que o escritório lhe disponibiliza no âmbito da relação contratual entre ambos.',
      ],
    },
    {
      id: 'papel-dados',
      title: '3. Papel das partes no tratamento de dados',
      paragraphs: [
        'Em relação aos dados pessoais e documentos fiscais dos clientes finais introduzidos na Plataforma, o escritório de contabilidade actua, em regra, como Responsável pelo Tratamento nos termos do Regulamento (UE) 2016/679 («RGPD»).',
        'O Operador actua como Subcontratante de Tratamento (processador), tratando dados apenas por instruções documentadas do escritório e para prestar o Serviço, nos termos do Acordo de Tratamento de Dados (DPA) disponível em /dpa.',
        'O aceite do DPA no registo é condição para utilização do Serviço por parte do escritório enquanto controlador.',
      ],
    },
    {
      id: 'licenca',
      title: '4. Licença de utilização',
      paragraphs: [
        'Concedemos ao escritório uma licença não exclusiva, intransmissível, revogável e limitada ao território em que legalmente presta serviços, para utilizar a Plataforma durante a vigência da subscrição.',
        'É proibida a engenharia inversa, sublicenciamento, revenda do Serviço, scraping automatizado não autorizado, contornar medidas de segurança ou utilizar a Plataforma para fins ilícitos.',
      ],
    },
    {
      id: 'conteudo',
      title: '5. Conteúdo e responsabilidade do escritório',
      paragraphs: [
        'O escritório é o único responsável pelos dados, documentos, mensagens, valores, prazos e configurações que introduz ou autoriza a introduzir na Plataforma.',
        'O escritório garante que dispõe de base legal (contrato, obrigação legal, consentimento quando aplicável) para tratar e subcontratar o tratamento dos dados dos seus clientes através do TegLion.',
        'O Operador não verifica a exactidão fiscal dos conteúdos carregados e não substitui arquivo físico ou legal obrigatório fora da Plataforma, salvo acordo escrito em contrário.',
      ],
    },
    {
      id: 'disponibilidade',
      title: '6. Disponibilidade e alterações',
      paragraphs: [
        'O Serviço é prestado com diligência profissional adequada a um SaaS B2B, sem garantia de disponibilidade ininterrupta. Podem ocorrer manutenções, actualizações e indisponibilidades de terceiros (alojamento, base de dados).',
        'Podemos alterar funcionalidades, interfaces e integrações, desde que não desvirtue de forma substancial o Serviço contratado sem aviso prévio razoável.',
      ],
    },
    {
      id: 'limitacao',
      title: '7. Limitação de responsabilidade',
      paragraphs: [
        'Na máxima extensão permitida pela lei portuguesa e europeia aplicável, o Operador não responde por lucros cessantes, perda de negócio, danos indirectos, punitivos ou consequenciais resultantes do uso ou impossibilidade de uso da Plataforma.',
        'A responsabilidade agregada do Operador por danos directos comprovados fica limitada ao montante pago pelo escritório nos últimos doze (12) meses anteriores ao evento, salvo dolo ou culpa grave do Operador.',
        'O escritório mantém-se responsável perante os seus clientes por aconselhamento, entregas fiscais e cumprimento de prazos legais.',
      ],
    },
    {
      id: 'uso-aceitavel',
      title: '8. Uso aceitável',
      bullets: [
        'Proibido carregar malware, conteúdo ilícito ou que viole direitos de terceiros.',
        'Proibido tentar aceder a dados de outro escritório (multi-tenant isolado por design).',
        'Proibido utilizar o Serviço para fraude, lavagem de capitais ou ocultação de informação às autoridades.',
        'Proibido sobrecarregar intencionalmente a infraestrutura (ataques, bots não autorizados).',
      ],
      paragraphs: [
        'O incumprimento pode determinar suspensão imediata da conta, sem prejuízo de outras medidas.',
      ],
    },
    {
      id: 'suspensao',
      title: '9. Suspensão e rescisão',
      paragraphs: [
        'Podemos suspender ou encerrar o acesso por violação destes Termos, ordem legal ou risco de segurança, com comunicação quando razoavelmente possível.',
        'O escritório pode cessar a utilização a qualquer momento; após rescisão aplicam-se as regras de exportação e eliminação do DPA e da Política de Privacidade.',
      ],
    },
    {
      id: 'pi',
      title: '10. Propriedade intelectual',
      paragraphs: [
        'O software, marca TegLion, documentação e interfaces são propriedade do Operador ou dos seus licenciantes. Nenhum direito de propriedade é transferido além da licença de uso.',
      ],
    },
    {
      id: 'alteracao-termos',
      title: '11. Alteração dos Termos',
      paragraphs: [
        'Podemos actualizar estes Termos por motivos legais, regulatórios ou evolução do Serviço. Indicaremos a nova versão e data. Alterações materiais exigem nova aceitação antes de continuar a utilizar a conta do escritório.',
      ],
    },
    {
      id: 'lei-foro',
      title: '12. Lei aplicável e foro',
      paragraphs: [
        'Estes Termos regem-se pela lei portuguesa. Para litígios com consumidores aplicam-se as normas imperativas de protecção. Para relações B2B entre Operador e escritório, com renúncia a outro foro salvo imposição legal, é competente o tribunal da comarca de Coimbra, Portugal.',
        'Questões sobre estes Termos: jaelsonsilva345@gmail.com.',
      ],
    },
  ],
}
