import type { BlogPost } from '@/content/blog/types'
import {
  affiliateSection,
  articleSection,
  comparisonTable,
  internalLinksSection,
  keyTakeaways,
  legalCallout,
  proseParagraphs,
  quoteBlock,
  sectionDivider,
  teglionCtaBlock,
} from '@/content/blog/shared'

export const postContabilidadeLeigos: BlogPost = {
  slug: 'contabilidade-explicada-leigos-portugal',
  title: 'Contabilidade explicada para quem quer conhecer a área de contabilidade: o que é e por que importa',
  excerpt:
    'Balanço, IRS, IVA, recibos verdes e contador — conceitos fiscais em linguagem normal, para empreendedores, estudantes e pessoas que queiram perceber o sistema sem licenciatura.',
  publishedAt: '2026-06-18',
  updatedAt: '2026-06-18',
  author: 'Liliana Nunes',
  authorRole: 'Revisão editorial TegLion · Guias de fiscalidade portuguesa',
  category: 'Guias completos',
  audience: ['independente', 'pme'],
  tags: [
    'contabilidade para leigos',
    'fiscalidade explicada',
    'quem quer conhecer a área de contabilidade',
    'IRS explicado',
    'IVA simples',
    'empreendedor',
  ],
  readMinutes: 8,
  featured: false,
  coverImage: {
    src: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&h=630&fit=crop&q=80&auto=format',
    alt: 'Pessoa a olhar para documentos e calculadora com ar curioso',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Contabilidade explicada para leigos Portugal | Blog TegLion',
    description:
      'Balanço, IRS, IVA e recibos verdes em linguagem clara — para empreendedores e quem quer perceber contabilidade em Portugal sem juridiquês.',
    keywords: [
      'contabilidade para leigos',
      'fiscalidade explicada Portugal',
      'o que é IRS',
      'recibos verdes explicado',
      'aprender contabilidade sozinho',
    ],
  },
  relatedSlugs: [
    'estudar-contabilidade-portugal-guia-estudantes',
    'guia-completo-trabalhador-independente-portugal-2026',
    'declaracao-irs-guia-pratico',
    'recibos-verdes-vs-faturacao',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Contabilidade é registar o que a empresa ganha, gasta e deve — para decidir e para cumprir a lei.',
      'IRS é imposto sobre rendimento das pessoas; IVA é imposto sobre consumo que muitas empresas cobram e entregam ao Estado.',
      'Recibo verde = documento de quem trabalha por conta própria em Portugal (não é «cor de papel» — é regime).',
      'Contador certificado (OCC) traduz regras complexas — não é luxo para quem tem actividade aberta.',
      'Perceber o básico poupa dinheiro, evita multas e torna conversas com o contador muito mais produtivas.',
    ]),
    ...proseParagraphs(
      '«Contabilidade» assusta. Parece linguagem de outro planeta — débito, crédito, anexo B, coeficiente, sujeito passivo. Mas no fundo, é a forma como a sociedade pergunta: quanto ganhaste, quanto gastaste, quanto deves ao Estado?',
      'Este artigo é para si se: pensa abrir um negócio, ouve o contador e faz cara de paisagem, é estudante de outra área curioso, ou quer impressionar alguém no jantar explicando a diferença entre IRS e IVA. Sem formulas pesadas — com analogias e ligações ao dia a dia em Portugal.',
    ),
    quoteBlock(
      'Não precisa de ser contador para não ser enganado — precisa de perceber o mapa, ainda que alguém conduza o carro.',
    ),
    ...articleSection({
      h2: 'O que é contabilidade (em uma frase útil)',
      id: 'o-que-e',
      paragraphs: [
        'Imagine um caderno gigante onde se regista tudo o que entra e sai de dinheiro (e o que a empresa promete pagar ou receber). Contabilidade é esse registo organizado — para saber se o negócio é saudável e para entregar números certos às Finanças.',
        '«Finanças» (Autoridade Tributária) não é o mesmo que «contabilidade» — mas estão ligados: a contabilidade alimenta as declarações fiscais.',
      ],
    }),
    sectionDivider(),
    comparisonTable({
      caption: 'Palavras que ouve — tradução honesta',
      headers: ['Termo', 'Tradução para humanos', 'Exemplo'],
      rows: [
        ['NIF', 'Número fiscal da pessoa ou empresa', 'Como o BI do imposto'],
        ['Recibo verde', 'Documento de venda do independente', 'Consultor emite após projecto'],
        ['Factura com IVA', 'Documento de empresa sujeita a IVA', 'Loja ou fornecedor B2B'],
        ['IRS', 'Imposto sobre o rendimento anual', 'Entrega na primavera'],
        ['IVA', 'Imposto nas compras e vendas', '23 % em muitos bens'],
        ['Segurança Social', 'Contribuições para protecção social', 'Pagamento mensal do independente'],
        ['OCC', 'Ordem dos Contabilistas Certificados', 'Quem é «contador oficial»'],
      ],
    }),
    ...articleSection({
      h2: 'IRS vs IVA vs SS — não misture os três',
      id: 'tres-impostos',
      paragraphs: [
        'IRS: «Quanto ganhei no ano e quanto imposto devo sobre isso?» — declaração anual (e retenções ao longo do ano).',
        'IVA: «Quanto cobrei de imposto aos clientes e quanto paguei em compras?» — declarações mensais ou trimestrais se for empresa sujeita a IVA.',
        'Segurança Social: «Quanto contribuo para pensão e subsídios?» — pagamento mensal, entidade diferente das Finanças.',
        'Cumprir um não dispensa os outros. O calendário do blog TegLion ajuda a visualizar prazos — confirme sempre com profissional.',
      ],
    }),
    ...articleSection({
      h2: 'Trabalhador por conta de outrem vs independente',
      id: 'vinculos',
      paragraphs: [
        'Empregado: salário, empresa retém IRS, entrega declaração anual (muitas vezes simplificada). Independentemente: factura ou recibo por serviço, paga SS, trata do IRS da actividade, guarda documentos.',
        'Híbrido (empregado + freelance) é possível — e é onde muita gente se confunde. Cada euro tem endereço fiscal diferente.',
      ],
      blocks: [
    { type: 'link', label: 'Guia completo do trabalhador independente 2026', slug: 'guia-completo-trabalhador-independente-portugal-2026' },
      ],
    }),
    ...articleSection({
      h2: 'Preciso mesmo de contador?',
      id: 'contador',
      paragraphs: [
        'Legalmente, algumas situações simples permitem entregar IRS sozinho. Pragmaticamente, actividade aberta, IVA, despesas dedutíveis e retenções justificam um contador — o custo mensal evita multas que custam mais.',
        'Escolha um inscrito na OCC, com comunicação clara e, idealmente, portal para enviar documentos sem caos de email.',
      ],
      blocks: [
    { type: 'link', label: 'Como escolher contabilista em Portugal', slug: 'como-escolher-contabilista-portugal' },
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'É contabilista? Ajude clientes leigos a entregar bem',
      text: 'Com o TegLion, o cliente vê o que falta enviar — menos confusão, menos telefonemas. Teste grátis 14 dias no escritório.',
    }),
    ...articleSection({
      h2: 'Quero aprender mais — por onde começo?',
      id: 'aprender',
      paragraphs: [
        '1) Leia o nosso guia do independente e o artigo sobre IRS. 2) Experimente um curso introdutório em português. 3) Se gostar, considere formação formal — artigo para estudantes no blog.',
      ],
    }),
    ...affiliateSection({
      heading: 'Do conceito à prática, sem jargão',
      headingId: 'recursos-leigos',
      intro:
        'Perceber balanço, IRS e IVA em linguagem normal é o primeiro passo. O segundo é aplicar: ou com um livro que explica gestão para quem não é contador, ou com um roteiro concreto se a dúvida for abrir actividade e emitir o primeiro recibo em Portugal.',
      items: [
        {
          key: 'amazonLivroGestaoContabil',
          leadIn:
            'Se quer vocabulário sólido — mapas, resultados, fluxo de caixa — sem assumir licenciatura, este livro em português é o ponto de partida mais útil para empreendedores e curiosos pela área.',
          title: 'Gestão Contábil — Para Contadores e Não Contadores (Amazon)',
          description: 'conceitos fundamentais em linguagem acessível.',
        },
        {
          key: 'hotmartReciboVerde7Dias',
          leadIn:
            'Se a curiosidade passou a «preciso facturar legalmente este mês», um guia curto focado em Finanças e recibos verdes em Portugal liga a teoria deste artigo à primeira semana de actividade.',
          title: 'Recibo Verde em 7 Dias (Hotmart)',
          description: 'passo a passo para independentes, complementar aos artigos do blog.',
        },
      ],
    }),
    ...internalLinksSection({
      title: 'Próximos passos no blog',
      slugs: [
        'estudar-contabilidade-portugal-guia-estudantes',
        'quanto-custa-abrir-actividade-portugal',
        'como-emitir-recibo-verde-passo-a-passo',
        'iva-quando-preciso-de-me-registar',
        'declaracao-irs-guia-pratico',
      ],
    }),
    legalCallout('Analogias simplificam — a sua situação concreta pode ter excepções. Consulte OCC para decisões com impacto fiscal.'),
  ],
}
