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

export const postAbrirEni: BlogPost = {
  slug: 'abrir-empresa-individual-eni',
  title: 'Abrir actividade como empresário em nome individual (ENI)',
  excerpt:
    'O que é um ENI, quando faz sentido vs Lda, passos no Portal das Finanças, CAE, SS e primeiras obrigações — guia completo para iniciantes.',
  publishedAt: '2026-05-18',
  updatedAt: '2026-06-17',
  author: 'Liliana Nunes',
  authorRole: 'Revisão editorial TegLion · Guias de fiscalidade portuguesa',
  category: 'Actividade',
  audience: ['independente', 'pme'],
  featured: false,
  tags: ['ENI', 'empresário individual', 'início de actividade', 'NISS', 'Portugal', 'CAE'],
  readMinutes: 8,
  coverImage: {
    src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=630&fit=crop&q=80',
    alt: 'Escritório moderno com portátil aberto',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Abrir ENI em Portugal — guia do independente',
    description:
      'Guia completo para abrir actividade como empresário em nome individual: passos, custos, CAE, SS e obrigações. Consulte contador antes de decidir.',
    keywords: [
      'abrir empresa individual',
      'ENI Portugal',
      'início de actividade',
      'empresário nome individual',
      'como abrir actividade',
      'CAE freelancer',
    ],
  },
  relatedSlugs: [
    'quanto-custa-abrir-actividade-portugal',
    'guia-completo-trabalhador-independente-portugal-2026',
    'seguranca-social-trabalhador-independente',
    'portal-financas-guia-completo-iniciantes',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'ENI é a forma mais comum de começar sozinho — não cria sociedade separada como uma Lda.',
      'Abertura no Portal das Finanças é gratuita; custos reais são SS, contador e software.',
      'CAE e regime de IVA escolhidos no dia 1 são difíceis de mudar — valide com contador.',
      'Após Finanças, inscreva-se na Segurança Social como trabalhador independente.',
      'Responsabilidade patrimonial é ilimitada — rendimentos e dívidas ficam no património pessoal.',
    ]),
    ...proseParagraphs(
      'Quer faturar como freelancer, consultor ou pequeno comerciante? Em Portugal, muitas pessoas começam como Empresário em Nome Individual (ENI). Não é a única forma de exercer actividade — mas é a mais comum para quem trabalha sozinho no início.',
      'Este guia explica o que é, quando faz sentido, os passos no portal e o que acontece nos 90 dias seguintes. Para mapa anual de prazos, veja também o calendário fiscal 2026.',
    ),
    {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=960&h=540&fit=crop&q=80',
      alt: 'Espaço de trabalho num escritório',
      caption: 'Antes de abrir actividade, valide se ENI é o enquadramento certo para o seu plano.',
    },
    ...articleSection({
      h2: 'O que é um ENI?',
      id: 'o-que-e-eni',
      paragraphs: [
        'O empresário em nome individual é uma pessoa singular que exerce actividade económica em seu nome. Não cria uma pessoa colectiva separada (como uma Lda ou Unipessoal).',
        'Os rendimentos da actividade entram no âmbito pessoal para efeitos de IRS, com regime de contabilidade (simplificado ou organizado) e obrigações de IVA conforme a actividade.',
        'A responsabilidade pelas dívidas da actividade recai sobre o património pessoal do empresário — diferente de sociedades com responsabilidade limitada.',
      ],
    }),
    sectionDivider(),
    comparisonTable({
      caption: 'ENI vs sociedade (Lda) — visão geral',
      headers: ['Aspecto', 'ENI', 'Sociedade (ex.: Lda)'],
      rows: [
        ['Constituição', 'Início actividade online', 'Registo comercial, pacto social'],
        ['Custos iniciais', 'Baixos', 'Mais elevados (notário, RC, capital)'],
        ['Responsabilidade', 'Ilimitada (património pessoal)', 'Limitada ao capital social'],
        ['Contabilidade', 'Simplificada ou organizada', 'Organizada obrigatória'],
        ['Credibilidade B2B', 'Suficiente para muitos serviços', 'Preferida por alguns clientes grandes'],
        ['Quando faz sentido', 'Solo, volume moderado', 'Sócios, investimento, risco elevado'],
      ],
    }),
    ...articleSection({
      h2: 'Quando o ENI faz sentido',
      id: 'quando-faz-sentido',
      blocks: [
        {
          type: 'ul',
          items: [
            'Presta serviços sozinho (design, IT, consultoria, aulas, tradução, etc.)',
            'Factura de forma regular mas ainda sem estrutura societária',
            'Quer legalizar rendimentos de trabalho independente',
            'Volume e risco não justificam custos de constituição de Lda',
            'Testa o mercado antes de formalizar sociedade',
          ],
        },
      ],
    }),
    {
      type: 'callout',
      variant: 'warning',
      title: 'Quando considerar Lda em vez de ENI',
      text: 'Facturação elevada, necessidade de sócios, investidores, responsabilidade limitada ou sector com risco legal elevado — um contador pode recomendar sociedade em vez de ENI.',
    },
    ...articleSection({
      h2: 'Passos no Portal das Finanças',
      id: 'passos',
      blocks: [
        {
          type: 'ol',
          items: [
            'Confirmar NIF activo (estrangeiros: regras específicas)',
            'Aceder a «Início de actividade» no portaldasfinancas.gov.pt',
            'Seleccionar código CAE principal (e secundários se aplicável)',
            'Indicar regime de IVA (isenção art. 53.º ou outro)',
            'Escolher regime de contabilidade (simplificado é comum no início)',
            'Confirmar data de início — a partir daí pode emitir documentos',
            'Inscrever-se na Segurança Social (NISS) em seguranca-social.pt',
            'Abrir conta bancária para actividade (recomendado)',
            'Emitir primeiro recibo ou factura conforme regime',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Código CAE: escolher com cuidado',
      id: 'cae',
      paragraphs: [
        'O CAE (Classificação Portuguesa das Actividades Económicas) descreve a actividade principal. Influencia estatísticas, algumas obrigações sectoriais e a percepção da AT sobre o seu negócio.',
        'Escolher CAE genérico ou incorrecto pode complicar inspecções ou mudanças posteriores. Um contador cruza a descrição real do que faz com a tabela oficial de CAEs.',
        'Pode ter CAE secundário se exercer actividades distintas — mas a principal deve reflectir a maior parte da facturação.',
      ],
    }),
    ...articleSection({
      h2: 'Primeiros 90 dias após abrir',
      id: '90-dias',
      paragraphs: [
        'Mês 1: primeira contribuição SS, primeiro recibo ao cliente, arquivo de contratos e PDFs.',
        'Mês 2–3: ritmo mensal de facturação, reconciliação banco, reunião com contador se contratado.',
        'Evite: acumular recibos «para o fim do trimestre», misturar despesas pessoais, ignorar notificações do portal.',
      ],
    }),
    ...articleSection({
      h2: 'Custos iniciais (ordem de grandeza)',
      id: 'custos',
      blocks: [
        {
          type: 'ul',
          items: [
            'Início de actividade: sem taxa directa significativa no portal',
            'Segurança Social: contribuições mensais desde o enquadramento',
            'Contador: 40–120 €/mês conforme pacote',
            'Software: gratuito (recibos) ou 0–35 €/mês (certificado)',
            'Seguros profissionais: conforme sector (RC, etc.)',
          ],
        },
      ],
    }),
    ...affiliateSection({
      heading: 'Primeiros passos depois do CAE',
      headingId: 'primeiros-passos',
      intro:
        'Escolher ENI e CAE é só o início. Nos primeiros 30 dias, quem tem guia claro avança mais depressa.',
      items: [
        {
          key: 'hotmartReciboVerde7Dias',
          leadIn:
            'Sequência pós-início de actividade: Finanças, recibos, SS e obrigações — o que este artigo resume.',
          title: 'Recibo Verde em 7 Dias (Hotmart)',
          description: 'Guia completo para novos independentes em Portugal.',
          image: {
            src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=640&h=360&fit=crop&q=80',
            alt: 'Pessoa a estudar guia de trabalho independente',
          },
        },
        {
          key: 'amazonSuporteLaptop',
          leadIn:
            'Horas no portal pedem setup mínimo — suporte de portátil evita desconforto nos primeiros meses.',
          title: 'Suporte para portátil (Amazon)',
          description: 'Home office de freelancer.',
        },
      ],
    }),
    { type: 'link', label: 'Quanto custa abrir actividade?', slug: 'quanto-custa-abrir-actividade-portugal' },
    { type: 'link', label: 'Guia completo do trabalhador independente 2026', slug: 'guia-completo-trabalhador-independente-portugal-2026' },
    ...internalLinksSection({
      title: 'Continuar a leitura',
      slugs: [
        'quanto-custa-abrir-actividade-portugal',
        'seguranca-social-trabalhador-independente',
        'como-emitir-recibo-verde-passo-a-passo',
        'guia-completo-trabalhador-independente-portugal-2026',
      ],
    }),
    legalCallout(),
  ],
}
