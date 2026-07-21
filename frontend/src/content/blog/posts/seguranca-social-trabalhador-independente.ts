import type { BlogPost } from '@/content/blog/types'
import {
  affiliateSection,
  articleSection,
  comparisonTable,
  internalLinksSection,
  keyTakeaways,
  legalCallout,
  proseParagraphs,
  sectionDivider,
} from '@/content/blog/shared'

export const postSegurancaSocial: BlogPost = {
  slug: 'seguranca-social-trabalhador-independente',
  title: 'Segurança Social para trabalhadores independentes: guia completo',
  excerpt:
    'NISS, contribuições mensais, base contributiva, primeiro ano, cessação e ligação ao IRS — o essencial para quem trabalha a recibos verdes.',
  publishedAt: '2026-05-27',
  updatedAt: '2026-06-17',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do Teglion · Escreve sobre fiscalidade em Portugal',
  category: 'Segurança Social',
  audience: ['independente'],
  featured: false,
  tags: ['Segurança Social', 'NISS', 'trabalhador independente', 'contribuições', 'recibos verdes', 'TSU'],
  readMinutes: 11,
  coverImage: {
    src: '/blog/covers/ss.svg',
    alt: 'Segurança Social para trabalhador independente',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Segurança Social para trabalhador independente',
    description:
      'NISS, pagamentos mensais, base contributiva, primeiro ano de actividade e cessação — guia completo para independentes em Portugal.',
    keywords: ['Segurança Social independente', 'NISS freelancer', 'contribuições recibos verdes', 'TSU independente', 'dia 20 SS'],
  },
  relatedSlugs: [
    'abrir-empresa-individual-eni',
    'obrigacoes-fiscais-mes-a-mes',
    'quanto-custa-abrir-actividade-portugal',
    'calendario-fiscal-portugal-2026-completo',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'NISS identifica-o perante a Segurança Social — active após abrir actividade nas Finanças.',
      'Contribuições mensais financiam pensão, doença, parentalidade e outras protecções.',
      'Pagamento até ao dia 20 de cada mês (regra geral) — active débito directo.',
      'IRS (Finanças) e SS são entidades diferentes — cumprir uma não dispensa a outra.',
      'Cessação de actividade deve ser comunicada à SS, não só às Finanças.',
    ]),
    ...proseParagraphs(
      'Abrir actividade nas Finanças não basta: na maioria dos casos, também precisa de se enquadrar na Segurança Social como trabalhador independente. As contribuições mensais financiam pensões, subsídios e protecção social.',
      'Muitos freelancers descobrem a SS apenas quando recebem a primeira notificação de pagamento. Antecipar o enquadramento evita juros e dívida acumulada nos primeiros meses.',
    ),
    ...articleSection({
      h2: 'NISS: o que é e como obter',
      id: 'niss',
      paragraphs: [
        'O Número de Identificação da Segurança Social (NISS) identifica o trabalhador perante a SS. Após início de actividade nas Finanças, deve iniciar actividade na Segurança Social (seguranca-social.pt) ou confirmar enquadramento se já tinha NISS de emprego anterior.',
        'Se já trabalhou por conta de outrem, o NISS pode existir — o processo é de alteração de vínculo, não criação de zero. Guarde comprovativos de todas as comunicações.',
      ],
    }),
    sectionDivider(),
    comparisonTable({
      caption: 'Finanças vs Segurança Social — não confundir',
      headers: ['Entidade', 'O quê', 'Frequência típica'],
      rows: [
        ['AT / Finanças', 'IRS, IVA, recibos', 'IRS anual + IVA se aplicável'],
        ['Segurança Social', 'Contribuições, protecção social', 'Pagamento mensal'],
        ['Portal', 'portaldasfinancas.gov.pt', 'seguranca-social.pt'],
        ['Documento chave', 'Recibos / facturas', 'NISS, comprovativos pagamento'],
      ],
    }),
    { type: 'link', label: 'Abrir portal da Segurança Social (oficial)', href: 'https://www.seg-social.pt/' },
    { type: 'link', label: 'Abrir Portal das Finanças (oficial)', href: 'https://www.portaldasfinancas.gov.pt/' },
    ...articleSection({
      h2: 'Contribuições mensais e base contributiva',
      id: 'contribuicoes',
      paragraphs: [
        'O valor da contribuição depende da base contributiva — em simplificado, ligada aos rendimentos da actividade; nos primeiros meses podem aplicar-se regras de valor fixo ou mínimo até haver histórico de facturação.',
        'Falhas de pagamento geram juros e dívida. O dia 20 de cada mês é a referência habitual para o pagamento da contribuição do mês anterior — confirme no portal da SS.',
      ],
      blocks: [
        {
          type: 'ul',
          items: [
            'Valor variável conforme rendimentos declarados / facturados',
            'Pagamento mensal obrigatório enquanto actividade aberta',
            'Regras específicas nos primeiros 12 meses de actividade',
            'Débito directo reduz risco de esquecimento',
            'Comunicar cessação quando deixar de facturar',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Primeiros 12 meses de actividade',
      id: 'primeiro-ano',
      paragraphs: [
        'O enquadramento contributivo nos primeiros meses segue regras específicas que evoluem com a facturação real. Não assuma que «ainda não ganho o suficiente» significa contribuição zero — confirme no portal ou com contador.',
        'Planeie fluxo de caixa: mesmo em meses sem clientes, pode haver contribuição mínima. Reserve fundo de maneio antes de largar emprego.',
      ],
      blocks: [
        {
          type: 'callout',
          variant: 'tip',
          title: 'Débito directo',
          text: 'Activar débito directo para contribuições reduz o risco de falhar o dia 20 — especialmente em Agosto e Dezembro.',
        },
      ],
    }),
    ...articleSection({
      h2: 'Cessação de actividade',
      id: 'cessacao',
      paragraphs: [
        'Quando deixa de exercer actividade, comunique a cessação às Finanças e à Segurança Social. Manter actividade aberta «só por precaução» continua a gerar obrigações contributivas.',
        'Se voltar a facturar depois de pausa longa, verifique se precisa de reabrir actividade ou apenas retomar pagamentos.',
      ],
    }),
    ...articleSection({
      h2: 'Cumulação com emprego por conta de outrem',
      id: 'cumulacao',
      paragraphs: [
        'É possível ser empregado e trabalhador independente simultaneamente. Cada vínculo tem regras contributivas — a SS pode consolidar ou aplicar tetos conforme legislação em vigor.',
        'Declare ambos os rendimentos no IRS. O contador ajuda a evitar pagar contribuições em duplicado onde a lei permite dedução ou compensação.',
      ],
    }),
    ...articleSection({
      h2: 'O que financia a sua contribuição',
      id: 'proteccoes',
      paragraphs: [
        'As contribuições mensais não são apenas «um custo» — financiam protecção social: subsídio de doença, parentalidade, pensão futura e outras prestações conforme o enquadramento. Freelancers que nunca trataram da SS descobrem isso tarde, quando precisam de baixa médica.',
        'O tempo de desemprego para independentes segue regras diferentes dos trabalhadores por conta de outrem. Informe-se no portal da SS sobre requisitos de carência antes de contar com esse apoio.',
      ],
    }),
    ...articleSection({
      h2: 'Como se calcula a contribuição (visão simplificada)',
      id: 'calculo',
      paragraphs: [
        'Em termos gerais, a contribuição baseia-se numa percentagem aplicada à base contributiva — que, para trabalhadores independentes, reflecte os rendimentos da actividade (com regras específicas nos primeiros meses).',
        'Não tente replicar o cálculo exacto numa folha Excel sem confirmar a fórmula vigente: a SS publica orientações e o contabilista valida o valor que aparece no portal. O importante é perceber que a contribuição sobe quando a facturação sobe — não é um valor fixo para sempre.',
      ],
      blocks: [
        comparisonTable({
          caption: 'Fases típicas da contribuição SS',
          headers: ['Fase', 'O que esperar', 'Acção prática'],
          rows: [
            ['Primeiros meses', 'Valor fixo ou mínimo possível', 'Active débito directo desde o início'],
            ['Com histórico de rendimentos', 'Ajuste conforme facturação', 'Revise trimestralmente com contador'],
            ['Ano de baixa facturação', 'Pode ainda haver mínimo', 'Não pare pagamentos sem cessação formal'],
            ['Cessação de actividade', 'Obrigações param após comunicação', 'Guarde comprovativo de cessação'],
          ],
        }),
      ],
    }),
    ...articleSection({
      h2: 'Dívidas à Segurança Social: o que fazer',
      id: 'dividas',
      paragraphs: [
        'Esquecer o dia 20 gera juros e notificações. Se acumulou meses em falta, não ignore as cartas — a regularização pode incluir planos de pagamento. Continuar a facturar com dívida SS aumenta o risco de bloqueios e complica renovações de licenças ou crédito.',
        'Se teve meses sem rendimento, confirme se pode pedir suspensão ou ajuste temporário — há regras específicas que dependem da situação. O contador ou um balcão da SS orientam; não assuma que «não facturei» significa «não devo nada» automaticamente.',
      ],
    }),
    ...affiliateSection({
      heading: 'Documentos que a SS pode pedir',
      headingId: 'documentos-ss',
      intro:
        'Guarde comprovativos de pagamento, comunicações e NISS num sítio seguro — especialmente no primeiro ano.',
      items: [
        {
          key: 'hotmartReciboVerde7Dias',
          leadIn:
            'Capítulo dedicado à SS no contexto português — útil se abriu actividade mas ainda não tratou do NISS.',
          title: 'Recibo Verde em 7 Dias (Hotmart)',
          description: 'Passo dedicado à Segurança Social incluído.',
        },
        {
          key: 'amazonPastaProvaFogo',
          leadIn:
            'NISS, comprovativos SS e contratos numa pasta à parte.',
          title: 'Pasta A4 documentos importantes (Amazon)',
          description: '13 compartimentos — arquivo de documentos críticos.',
        },
      ],
    }),
    {
      type: 'callout',
      variant: 'warning',
      title: 'Não confundir',
      text: 'IRS (Finanças) e Segurança Social são entidades diferentes. Cumprir uma não isenta a outra.',
    },
    { type: 'link', label: 'Obrigações fiscais mês a mês', slug: 'obrigacoes-fiscais-mes-a-mes' },
    { type: 'link', label: 'Calendário fiscal Portugal 2026', slug: 'calendario-fiscal-portugal-2026-completo' },
    ...internalLinksSection({
      title: 'Ler a seguir',
      slugs: [
        'calendario-fiscal-portugal-2026-completo',
        'obrigacoes-fiscais-mes-a-mes',
        'quanto-custa-abrir-actividade-portugal',
        'guia-completo-trabalhador-independente-portugal-2026',
      ],
    }),
    legalCallout('Valores e prazos SS alteram-se — confirme em seguranca-social.pt.'),
  ],
}
