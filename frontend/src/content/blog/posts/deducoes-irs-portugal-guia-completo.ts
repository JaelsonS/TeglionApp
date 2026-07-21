import type { BlogPost } from '@/content/blog/types'
import {
  affiliateSection,
  articleSection,
  comparisonTable,
  faqSection,
  internalLinksSection,
  keyTakeaways,
  legalCallout,
  proseParagraphs,
  quoteBlock,
  teglionCtaBlock,
} from '@/content/blog/shared'

export const postDeducoesIrs: BlogPost = {
  slug: 'deducoes-irs-portugal-guia-completo',
  title: 'Deduções no IRS em Portugal: guia completo para famílias e independentes',
  excerpt:
    'Saúde, educação, habitação, pensões e despesas gerais — como funcionam as deduções no Modelo 3, limites e documentos a guardar.',
  publishedAt: '2026-06-18',
  updatedAt: '2026-07-20',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do TegLion · Escreve sobre fiscalidade em Portugal',
  category: 'IRS',
  audience: ['independente', 'pme'],
  tags: ['IRS', 'deduções fiscais', 'Modelo 3', 'saúde', 'educação', 'habitação', 'Portugal'],
  readMinutes: 16,
  featured: false,
  series: {
    id: 'zero-ao-primeiro-irs',
    title: 'Do zero ao primeiro IRS',
    description: 'Deduções, declaração, prazos e erros comuns — trilho para a primeira (ou próxima) entrega de IRS.',
    part: 1,
    totalParts: 4,
  },
  coverImage: {
    src: '/blog/covers/irs.svg',
    alt: 'Deduções no IRS em Portugal',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Deduções IRS Portugal — guia completo 2026 | Blog TegLion',
    description:
      'Entenda deduções à coleta no IRS: saúde, educação, habitação, pensões e despesas gerais. Documentos, limites e erros comuns. Conteúdo informativo.',
    keywords: [
      'deduções IRS Portugal',
      'despesas dedutíveis IRS',
      'IRS saúde educação',
      'Modelo 3 deduções',
      'e-Fatura despesas',
    ],
  },
  relatedSlugs: [
    'declaracao-irs-guia-pratico',
    'prazos-irs-2026-independentes',
    'irs-recibos-verdes-erros-comuns',
    'organizar-documentos-fiscais-arquivo-digital',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Deduções reduzem a coleta de IRS — não confundir com «isentar» rendimentos de actividade.',
      'Muitas despesas só contam se tiver NIF nas facturas e estiverem no e-Fatura ou declaradas manualmente.',
      'Existem limites por categoria (saúde, educação, habitação) e um tecto global de benefício fiscal.',
      'Trabalhador independente deduz despesas de actividade noutros anexos — não misturar com deduções familiares.',
      'Guarde facturas e comprovativos pelo menos 4 anos após a entrega do IRS.',
    ]),
    ...proseParagraphs(
      'Está na mesa do contabilista com um envelope de facturas de farmácia e propinas — e a pergunta é sempre a mesma: «isto conta para o IRS?» Todos os anos milhares de contribuintes perdem dinheiro no IRS não por fraude, mas por não saber que podiam deduzir despesas de saúde, educação ou habitação — ou por não terem guardado a factura com NIF.',
      'Em euros: se tem 800 € de despesas de saúde elegíveis e a percentagem/legalidade do ano fiscal permite deduzir uma fatia, a diferença no reembolso (ou no imposto a pagar) pode ser de dezenas a algumas centenas de euros. Não é «enriquecer» — é não deixar benefício na mesa por desorganização.',
      'Este guia explica, em linguagem clara, como funcionam as principais deduções à coleta no Modelo 3 em Portugal. As regras e percentagens mudam com o Orçamento do Estado; o que segue é estrutura para planear o ano — na entrega, confirme limites do ano fiscal com a AT ou o seu contador.',
    ),
    quoteBlock(
      'A dedução fiscal não é um desconto na loja — é um benefício que só materializa quando entrega o IRS correctamente preenchido.',
    ),
    ...articleSection({
      h2: 'Como funcionam as deduções à coleta',
      id: 'mecanismo',
      paragraphs: [
        'No IRS, parte das despesas que suportou ao longo do ano pode traduzir-se numa redução do imposto a pagar (ou num aumento do reembolso). O mecanismo passa por indicar despesas elegíveis no anexo adequado do Modelo 3; o sistema aplica percentagens legais e respeita tetos máximos.',
        'O e-Fatura facilita: muitas despesas aparecem pré-carregadas se o fornecedor emitiu factura com o seu NIF. Mesmo assim, deve rever linha a linha — erros de terceiros são frequentes.',
      ],
    }),
    ...articleSection({
      h2: 'Principais categorias de dedução',
      id: 'categorias',
      blocks: [
        comparisonTable({
          caption: 'Visão geral — percentagens e limites variam por ano fiscal.',
          headers: ['Categoria', 'Exemplos', 'Notas práticas'],
          rows: [
            ['Saúde', 'Consultas, exames, medicamentos, seguros de saúde', 'Factura com NIF; alguns actos excluídos'],
            ['Educação', 'Propinas, mensalidades, livros escolares', 'Estabelecimentos reconhecidos'],
            ['Habitação', 'Juros de crédito habitação, rendas (conforme regras)', 'Limites específicos por agregado'],
            ['Pensões', 'Entregas para PPR e produtos elegíveis', 'Teto anual de dedução'],
            ['Despesas gerais', 'Restaurantes, reparações, cabeleireiro, etc.', 'Percentagem reduzida; requer atenção ao e-Fatura'],
            ['ENAs / solidariedade', 'Donativos a instituições elegíveis', 'Comprovativos oficiais'],
          ],
        }),
        { type: 'h3', id: 'saude', text: 'Saúde' },
        ...proseParagraphs(
          'Despesas de saúde são das mais utilizadas. Incluem consultas, tratamentos, análises e parte dos medicamentos. O seguro de saúde também pode entrar, dentro dos limites legais. Atenção: nem tudo o que «parece saúde» é dedutível — cosmética estética, por exemplo, em regra não conta.',
          'Peça sempre factura com NIF no acto da consulta. Clínicas que só dão recibo simples sem NIF não ajudam na dedução.',
        ),
        { type: 'h3', id: 'educacao', text: 'Educação' },
        ...proseParagraphs(
          'Mensalidades de ensino básico, secundário e superior, em estabelecimentos reconhecidos, são o núcleo desta categoria. Cursos profissionais e algumas despesas com manuais podem entrar — confirme a elegibilidade anual.',
        ),
        { type: 'h3', id: 'habitacao', text: 'Habitação' },
        ...proseParagraphs(
          'Para muitos agregados, os juros do crédito à habitação (primeira habitação) representam a maior dedução. As regras de rendas e regime de arrendamento mudaram ao longo dos anos — o que era válido há uma década pode não aplicar-se hoje.',
        ),
      ],
    }),
    ...articleSection({
      h2: 'Independentes: não misturar deduções',
      id: 'independentes',
      paragraphs: [
        'Se tem actividade aberta, parte das despesas (software, coworking, material, deslocações) pode ser dedutível como custo de actividade nos anexos de rendimentos empresariais ou categorias A/B — isto é distinto das deduções familiares à coleta.',
        'Misturar despesas pessoais com despesas de negócio é um dos erros que a AT cruza com facturação. Separe contas bancárias e arquivo desde o primeiro mês.',
      ],
      blocks: [
    { type: 'link', label: 'Erros comuns em IRS com recibos verdes', slug: 'irs-recibos-verdes-erros-comuns' },
    { type: 'link', label: 'Regime simplificado vs contabilidade organizada', slug: 'regime-simplificado-vs-contabilidade-organizada' },
    { type: 'link', label: 'Guia prático de declaração de IRS', slug: 'declaracao-irs-guia-pratico' },
      ],
    }),
    ...articleSection({
      h2: 'Checklist de documentos a guardar',
      id: 'checklist',
      blocks: [
        {
          type: 'ol',
          items: [
            'Facturas com o seu NIF (PDF ou papel digitalizado)',
            'Comprovativos de despesas não no e-Fatura (declaração manual no IRS)',
            'Extractos de PPR e certificados de entidades de pensões',
            'Comprovativos de donativos (ENAs)',
            'Mapa de rendimentos de empregadores e recibos verdes emitidos',
            'Comprovativo de entrega do IRS do ano anterior',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Organização',
          text: 'Uma pasta por ano com subpastas «Saúde», «Educação», «Actividade» poupa horas em Abril. O nosso guia de arquivo digital explica estrutura e backup.',
        },
    { type: 'link', label: 'Organizar documentos fiscais — arquivo digital', slug: 'organizar-documentos-fiscais-arquivo-digital' },
        {
          type: 'link',
          label: 'Como escolher contabilista em Portugal',
          slug: 'como-escolher-contabilista-portugal',
        },
        {
          type: 'link',
          label: 'Prazos IRS 2026 para independentes',
          slug: 'prazos-irs-2026-independentes',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Cenário típico de balcão',
          text: 'Casal com um filho, um independente e um por conta de outrem: facturas de saúde sem NIF, propinas pagas por transferência sem PDF, e PPR sem certificado. Resultado: o portal mostra menos do que podiam. Em 20 minutos no e-Fatura + pasta por categoria, recuperam o que o envelope solto tinha escondido.',
        },
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Clientes a enviar facturas só em Abril?',
      text: 'Com TegLion, o escritório pede despesas de saúde, educação e actividade ao longo do ano — o IRS deixa de ser uma caça a PDFs na última semana.',
    }),
    ...faqSection({
      heading: 'Perguntas frequentes sobre deduções',
      headingId: 'faq-deducoes',
      items: [
        {
          question: 'Preciso de factura com NIF para todas as deduções?',
          answer:
            'Na maioria dos casos, sim. Sem NIF na factura, a despesa pode não ser aceite ou ter de ser justificada de outra forma. No e-Fatura, confirme se a despesa aparece associada ao seu NIF.',
        },
        {
          question: 'Posso deduzir despesas de um familiar?',
          answer:
            'Depende da categoria e das regras do agregado familiar. Muitas deduções de saúde e educação aplicam-se a dependentes incluídos na declaração. Consulte as regras do ano fiscal ou o seu contador.',
        },
        {
          question: 'O que acontece se me esquecer de incluir uma despesa?',
          answer:
            'Pode ser possível entregar declaração de substituição ou corrigir dentro dos prazos legais. Após o prazo, a correção pode implicar procedimentos adicionais — melhor rever tudo antes de submeter.',
        },
        {
          question: 'Despesas de actividade entram nas mesmas deduções?',
          answer:
            'Não necessariamente. Custos de negócio tratam-se nos anexos de rendimentos da actividade. Deduções à coleta (saúde, educação, etc.) são um mecanismo separado no Modelo 3.',
        },
        {
          question: 'Vale a pena contratar contador só para deduções?',
          answer:
            'Para agregados simples, muitos entregam sozinhos. Com actividade aberta, imóveis, rendimentos no estrangeiro ou património relevante, um contabilista certificado costuma compensar pelo tempo e pelo risco de erro.',
        },
      ],
    }),
    ...affiliateSection({
      heading: 'Preparar a temporada sem caçar facturas em Abril',
      headingId: 'afiliados-deducoes',
      intro:
        'Quem perde deduções raramente o faz por desconhecer a lei — perde porque a factura da farmácia ficou no bolso do casaco e a propina nunca entrou no e-Fatura. O método é simples: reunir ao longo do ano e rever com calma antes da entrega. Dois apoios práticos fazem a diferença para independentes e agregados familiares.',
      items: [
        {
          key: 'hotmartIrsReciboVerde',
          leadIn:
            'Se tem actividade aberta e ainda vê o IRS como «um bloco único em Abril», um guia faseado em português ajuda a separar rendimentos de recibos verdes, retenções e o que entra nas deduções familiares — útil em paralelo com o Modelo 3 e o seu contador, não em substituição.',
          title: 'IRS & Recibo Verde — Guia Prático (Hotmart)',
          description: 'estrutura a preparação do ano fiscal sem improvisar na última semana.',
        },
        {
          key: 'amazonPastaThinkTex26',
          leadIn:
            'Enquanto digitaliza, uma pasta física com bolsos para saúde, educação, habitação e actividade evita a caixa de sapatos em Março. Um bolso por categoria — e, no fim do mês, fotografar ou digitalizar o que ainda está em papel.',
          title: 'Pasta expansível ThinkTex 26 bolsos (Amazon)',
          description: 'arquivo físico complementar ao e-Fatura e aos PDFs na nuvem.',
        },
      ],
    }),
    ...internalLinksSection({
      title: 'Continuar a ler sobre IRS',
      slugs: [
        'declaracao-irs-guia-pratico',
        'prazos-irs-2026-independentes',
        'irs-recibos-verdes-erros-comuns',
        'retencao-fonte-recibos-verdes',
      ],
    }),
    legalCallout(),
  ],
}
