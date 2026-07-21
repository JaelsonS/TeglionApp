import type { BlogPost } from '@/content/blog/types'
import {
  affiliateSection,
  articleSection,
  internalLinksSection,
  keyTakeaways,
  legalCallout,
  proseParagraphs,
  quoteBlock,
  teglionCtaBlock,
} from '@/content/blog/shared'

export const postGuiaCompletoIndependente: BlogPost = {
  slug: 'guia-completo-trabalhador-independente-portugal-2026',
  title: 'Guia completo do trabalhador independente em Portugal (2026)',
  excerpt:
    'Do zero ao primeiro recibo, SS, IRS e arquivo: mapa completo com ligações a todos os guias do blog — para freelancers e prestadores de serviços em Portugal.',
  publishedAt: '2026-06-17',
  updatedAt: '2026-07-21',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do TegLion · Escreve sobre fiscalidade em Portugal',
  category: 'Guias completos',
  audience: ['independente', 'pme'],
  tags: ['trabalhador independente', 'freelancer', 'recibos verdes', 'IRS', 'guia 2026', 'Portugal'],
  readMinutes: 18,
  featured: true,
  series: {
    id: 'independente-2026',
    title: 'Trabalhador independente em Portugal',
    description: 'Série completa para quem abre actividade ou já factura em recibos verdes.',
    part: 1,
    totalParts: 5,
  },
  coverImage: {
    src: '/blog/covers/independente.svg',
    alt: 'Guia do trabalhador independente em Portugal',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Trabalhador independente Portugal 2026 — guia completo',
    description:
      'Tudo o que precisa para ser trabalhador independente em Portugal: abrir actividade, recibos verdes, Segurança Social, IRS, IVA e organização. Mapa com links para cada tema.',
    keywords: [
      'trabalhador independente Portugal',
      'guia freelancer Portugal 2026',
      'recibos verdes guia completo',
      'abrir actividade Portugal',
    ],
  },
  relatedSlugs: [
    'calendario-fiscal-portugal-2026-completo',
    'deducoes-irs-portugal-guia-completo',
    'abrir-empresa-individual-eni',
    'como-emitir-recibo-verde-passo-a-passo',
    'declaracao-irs-guia-pratico',
    'obrigacoes-fiscais-mes-a-mes',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Independente em Portugal: actividade nas Finanças, Segurança Social, facturação regular e IRS anual.',
      'Muitos começam com recibos verdes; IVA e software certificado entram quando o volume cresce.',
      'Arquivo digital desde o primeiro mês poupa horas em Abril.',
      'Um contabilista certificado (OCC) vale a pena com vários rendimentos, imóveis ou clientes B2B.',
      'Use este artigo como mapa: cada fase tem um guia próprio mais abaixo.',
    ]),
    ...proseParagraphs(
      'O cliente pede o recibo «até amanhã» e apercebe-se: ainda não tem actividade aberta — ou tem, mas não sabe se a Segurança Social e o IRS estão alinhados. Este guia existe para ordenar essa conversa: o que fazer primeiro, o que vem a seguir, e onde aprofundar.',
      'Ser trabalhador independente em Portugal não se resume a emitir recibos verdes. Há um percurso concreto — abrir actividade, contribuir para a Segurança Social, facturar bem, guardar comprovativos e entregar o IRS a tempo. Aqui fica o mapa; em cada fase, ligamos aos guias detalhados.',
      'Se ainda está a decidir entre abrir actividade e continuar «por fora», fale com um contabilista antes de facturar. Regularizar atrasos quase sempre sai mais caro do que começar bem.',
    ),
    quoteBlock(
      'A maioria dos problemas fiscais de freelancers não vem de fraude — vem de desorganização e de não saber o que vem a seguir no calendário.',
      'Prática comum em escritórios de contabilidade',
    ),
    ...articleSection({
      h2: 'Quem é trabalhador independente em Portugal?',
      id: 'quem-e',
      paragraphs: [
        'Em termos práticos, é quem presta serviços ou vende bens por conta própria, com actividade aberta nas Finanças (CAE adequado). Pode ser designer, programador, consultor, fotógrafo, professor particular — ou outra profissão liberal enquadrada na lei.',
        'Não confunda «ter NIF» com «ter actividade aberta». Muita gente tem NIF há anos e só abre início de actividade quando começa a facturar — é aí que o calendário fiscal passa a contar.',
      ],
      blocks: [
        {
          type: 'callout',
          variant: 'info',
          title: 'ENI vs sociedade',
          text: 'Empresário em Nome Individual (ENI) é a forma mais simples para começar. Uma sociedade (Lda.) faz sentido com sócios, investimento estruturado ou necessidade de separar património pessoal e empresarial — decisão para contabilista e, se preciso, advogado.',
        },
    { type: 'link', label: 'Abrir empresa individual (ENI): o primeiro passo', slug: 'abrir-empresa-individual-eni' },
      ],
    }),
    ...articleSection({
      h2: 'Quanto custa estar regularizado?',
      id: 'custos',
      paragraphs: [
        'Além de impostos sobre rendimento (IRS) e eventual IVA, há contribuições mensais à Segurança Social. O valor depende da base contributiva declarada. Nos primeiros meses existem regras de transição — não assuma que «ainda não facturei muito» dispensa pagamento.',
        'Na prática de balcão: um independente a facturar 1 500–2 500 €/mês brutos costuma reservar mentalmente 20–30 % para «Estado + SS + eventual contabilista». Não é regra fiscal — é margem de segurança para não gastar o que ainda não é seu.',
        'Software de facturação pode ser gratuito no início (recibos verdes no portal) ou 10–30 €/mês quando precisa de certificação AT. Contabilista: muitos cobram 40–120 €/mês conforme volume — compare preço com o tempo que poupa e com o custo de uma coima.',
      ],
      blocks: [
        {
          type: 'callout',
          variant: 'tip',
          title: 'Checklist de custos no mês 1',
          text: 'Anote: contribuição SS estimada, mensalidade do contabilista (se houver), software, e uma reserva de 200–400 € para imprevistos (atrasos, declarações, material). Quem começa sem esta lista gasta o primeiro recibo como se fosse lucro líquido.',
        },
    { type: 'link', label: 'Quanto custa abrir actividade?', slug: 'quanto-custa-abrir-actividade-portugal' },
    { type: 'link', label: 'Segurança Social do trabalhador independente', slug: 'seguranca-social-trabalhador-independente' },
      ],
    }),
    { type: 'h2', id: 'fases', text: 'As 6 fases do independente' },
    {
      type: 'ol',
      items: [
        'Decidir estrutura (ENI, unipessoal, etc.) e abrir actividade nas Finanças',
        'Inscrever-se na Segurança Social e perceber contribuições',
        'Emitir recibos ou facturas conforme o regime',
        'Cumprir obrigações mensais e trimestrais (IVA, retenções, SS)',
        'Organizar arquivo digital e físico de comprovativos',
        'Entregar IRS anual e planear o ano seguinte',
      ],
    },
    {
      type: 'link',
      label: 'Calendário fiscal 2026: marque os prazos do ano',
      slug: 'calendario-fiscal-portugal-2026-completo',
    },
    {
      type: 'link',
      label: 'Como emitir o primeiro recibo verde (passo a passo)',
      slug: 'como-emitir-recibo-verde-passo-a-passo',
    },
    {
      type: 'link',
      label: 'Portal das Finanças para iniciantes',
      slug: 'portal-financas-guia-completo-iniciantes',
    },
    ...internalLinksSection({
      title: 'Fase 1 — Abrir actividade',
      intro: 'Comece por aqui se ainda não tem NIF de actividade aberta.',
      slugs: [
        'abrir-empresa-individual-eni',
        'quanto-custa-abrir-actividade-portugal',
        'portal-financas-guia-completo-iniciantes',
      ],
    }),
    ...internalLinksSection({
      title: 'Fase 2 — Facturar e receber',
      intro: 'Depois da actividade aberta, o dia-a-dia passa por emitir documentos de venda.',
      slugs: [
        'como-emitir-recibo-verde-passo-a-passo',
        'recibos-verdes-vs-faturacao',
        'escolher-software-faturacao-portugal',
      ],
    }),
    ...internalLinksSection({
      title: 'Fase 3 — Segurança Social e obrigações',
      intro: 'Mensalmente há prazos que não perdoam — marque no calendário.',
      slugs: [
        'seguranca-social-trabalhador-independente',
        'obrigacoes-fiscais-mes-a-mes',
        'retencao-fonte-recibos-verdes',
      ],
    }),
    ...internalLinksSection({
      title: 'Fase 4 — IRS e regimes',
      intro: 'No início do ano, o IRS junta tudo o que fez nos 12 meses anteriores.',
      slugs: [
        'deducoes-irs-portugal-guia-completo',
        'declaracao-irs-guia-pratico',
        'prazos-irs-2026-independentes',
        'irs-recibos-verdes-erros-comuns',
        'regime-simplificado-vs-contabilidade-organizada',
      ],
    }),
    ...internalLinksSection({
      title: 'Calendário completo 2026',
      intro: 'Todos os prazos num só artigo — use como referência ao longo do ano.',
      slugs: ['calendario-fiscal-portugal-2026-completo', 'obrigacoes-fiscais-mes-a-mes'],
    }),
    ...internalLinksSection({
      title: 'Fase 5 — IVA (quando aplicável)',
      intro: 'Muitos começam isentos; saiba quando isso muda.',
      slugs: ['iva-quando-preciso-de-me-registar', 'quando-passar-de-isento-a-iva'],
    }),
    ...internalLinksSection({
      title: 'Fase 6 — Organização e contador',
      intro: 'Quem organiza documentos poupa horas — e dinheiro em coimas.',
      slugs: [
        'organizar-documentos-fiscais-arquivo-digital',
        'proteger-dados-fiscais-freelancer-portugal',
        'como-escolher-contabilista-portugal',
      ],
    }),
    {
      type: 'link',
      label: 'Como escolher contabilista em Portugal',
      slug: 'como-escolher-contabilista-portugal',
    },
    teglionCtaBlock({
      variant: 'firm',
      title: 'Independentes pedem canal claro ao escritório',
      text: 'Com TegLion, o seu cliente envia recibos e despesas pelo portal — menos WhatsApp, mais prazos cumpridos e histórico auditável para a época de IRS.',
    }),
    ...affiliateSection({
      heading: 'Se está a abrir actividade pela primeira vez',
      headingId: 'recursos',
      intro:
        'Os guias gratuitos deste blog cobrem o mapa. No terreno, quem abre recibos verdes pela primeira vez costuma precisar de um roteiro impresso para a primeira semana — e, mais tarde, de um guia só para o IRS. Dois ebooks em português resolvem esses momentos sem substituir o contabilista certificado.',
      items: [
        {
          key: 'hotmartReciboVerde7Dias',
          leadIn:
            'No dia em que abre actividade, a lista mental explode: Segurança Social, emissão do primeiro recibo, IVA sim ou não, o que dizer ao cliente. Um ebook passo-a-passo com checklists é o que muitos pedem quando querem fazer a primeira semana com método — e depois validar com o contador.',
          title: 'Recibo Verde em 7 Dias (Hotmart)',
          description: 'actividade, SS, emissão de recibos e declarações iniciais, em português.',
        },
        {
          key: 'hotmartIrsReciboVerde',
          leadIn:
            'Quando o calendário chega à primavera, o problema muda: rendimentos de prestação de serviços, retenções e anexos do Modelo 3. Um guia prático focado em recibo verde complementa o nosso artigo de declaração anual e reduz os erros mais comuns no primeiro IRS com actividade.',
          title: 'IRS & Recibo Verde — Guia Prático (Hotmart)',
          description: 'foco em rendimentos de serviços e na preparação sem improvisar na última semana.',
        },
      ],
    }),
    legalCallout(),
  ],
}
