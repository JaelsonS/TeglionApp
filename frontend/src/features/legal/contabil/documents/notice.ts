import type { LegalDocument } from '@/features/legal/contabil/types'
import { CONTABIL_LEGAL_VERSIONS } from '@/features/legal/contabil/versions'

export const noticeDocument: LegalDocument = {
  key: 'notice',
  title: 'Aviso Legal',
  subtitle: 'Informação legal do prestador do serviço (Impressum)',
  updatedAtLabel: 'Versão',
  updatedAtValue: '18 de agosto de 2026',
  version: CONTABIL_LEGAL_VERSIONS.notice,
  intro: [
    'Em cumprimento do dever de informação e boa-fé comercial, identificamos quem presta o produto digital Teglion. Teglion é a marca do software; não é uma empresa, sociedade nem entidade jurídica.',
  ],
  sections: [
    {
      id: 'titular',
      title: '1. Prestador do serviço',
      paragraphs: [
        'Produto: Teglion (marca comercial)',
        'Prestador: AfDigital — Soluções Tecnológicas',
        'Titular legal: Jaelson Silva dos Santos',
        'NIF: 331 759 276',
        'CAE: 62100 — Atividades de programação informática',
        'Sede: Coimbra, Portugal',
        'E-mail: afdigitalweb.st@gmail.com',
        'Telefone: +351 916 447 990',
      ],
    },
    {
      id: 'objecto',
      title: '2. Objecto do website e da aplicação',
      paragraphs: [
        'Disponibilização de software SaaS multi-tenant para escritórios de contabilidade em Portugal, incluindo portal do cliente, gestão documental e comunicação segura.',
        'O serviço não inclui prestação de serviços contabilísticos, fiscais ou jurídicos pelo prestador identificado acima.',
      ],
    },
    {
      id: 'responsabilidade',
      title: '3. Responsabilidade',
      paragraphs: [
        'O prestador não se responsabiliza por decisões fiscais ou contabilísticas dos escritórios utilizadores nem por informação incorrecta introduzida por estes ou pelos seus clientes.',
        'O prestador procura manter informação actualizada, mas não garante ausência total de erros técnicos ou indisponibilidade temporária.',
        'Links externos, se existirem, não implicam endorse; o acesso a sites de terceiros é por conta do utilizador.',
      ],
    },
    {
      id: 'escritorios',
      title: '4. Escritórios de contabilidade',
      paragraphs: [
        'Cada escritório é responsável legal perante os seus clientes pela relação profissional, prazos legais, sigilo profissional e exactidão dos serviços contabilísticos prestados fora ou através da Plataforma.',
      ],
    },
    {
      id: 'propriedade',
      title: '5. Propriedade intelectual',
      paragraphs: [
        'Textos, software, design e marca Teglion estão protegidos. Reprodução não autorizada é proibida salvo permissão escrita ou uso permitido por lei.',
      ],
    },
  ],
}
