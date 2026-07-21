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
  teglionCtaBlock,
} from '@/content/blog/shared'

export const postRecibos: BlogPost = {
  slug: 'recibos-verdes-vs-faturacao',
  title: 'Recibos verdes vs facturação certificada: o que precisa de saber',
  excerpt:
    'Diferenças práticas entre emitir recibos no e-Fatura e usar software certificado — quando usar cada um, custos, IVA e transição para PME.',
  publishedAt: '2026-05-12',
  updatedAt: '2026-06-17',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do Teglion · Escreve sobre fiscalidade em Portugal',
  category: 'Facturação',
  audience: ['independente', 'pme'],
  featured: false,
  tags: ['recibos verdes', 'e-Fatura', 'facturação certificada', 'AT', 'freelancer'],
  readMinutes: 8,
  coverImage: {
    src: '/blog/covers/iva.svg',
    alt: 'Recibos verdes vs facturação certificada',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Recibos verdes ou factura certificada? | Blog Teglion',
    description:
      'Compare recibos verdes (e-Fatura) e facturação certificada em Portugal: custos, IVA, obrigações e quando mudar de regime. Guia para independentes.',
    keywords: [
      'recibos verdes',
      'facturação certificada',
      'e-Fatura recibos',
      'freelancer Portugal factura',
      'software certificado AT',
    ],
  },
  relatedSlugs: [
    'como-emitir-recibo-verde-passo-a-passo',
    'escolher-software-faturacao-portugal',
    'iva-quando-preciso-de-me-registar',
    'quando-passar-de-isento-a-iva',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Recibos verdes no e-Fatura são gratuitos e adequados a muitos prestadores de serviços isentos de IVA.',
      'Facturação certificada exige software homologado pela AT — obrigatória quando sujeito passivo de IVA.',
      'Clientes empresas preferem facturas com IVA dedutível; particulares muitas vezes aceitam recibo verde.',
      'Em ambos os casos, todos os rendimentos devem ser declarados no IRS.',
      'A transição de recibos para factura deve ser planeada com contabilista para não haver lacunas documentais.',
    ]),
    ...proseParagraphs(
      '«Emito recibo verde ou factura?» É uma das primeiras perguntas de quem abre actividade. Não existe uma resposta única: depende do regime de IVA, do tipo de cliente e do volume de negócio.',
      'Confundir os dois regimes gera erros de IVA, coimas e conversas difíceis com clientes que precisam de documentos dedutíveis. Este guia compara lado a lado e indica quando faz sentido evoluir.',
    ),
    {
      type: 'image',
      src: '/blog/covers/iva.svg',
      alt: 'Dashboard de analytics num portátil',
      caption: 'Organizar emissões de documentos desde o primeiro mês facilita o IRS.',
    },
    ...articleSection({
      h2: 'O que são recibos verdes (e-Fatura)',
      id: 'recibos-verdes',
      paragraphs: [
        'São documentos de prestação de serviços emitidos no Portal das Finanças / e-Fatura, sem custo de software externo. Muito usados por profissionais liberais, consultores e freelancers isentos de IVA ao abrigo do artigo 53.º do CIVA.',
        'Cada recibo fica associado ao NIF do adquirente, comunica-se à AT e alimenta o cruzamento de dados no IRS. O PDF deve ser guardado e enviado ao cliente.',
        'Limitações: menos flexibilidade em séries de facturação, IVA completo, integrações com lojas online ou exportação SAF-T avançada — quando o negócio cresce, o tecto aparece.',
      ],
    }),
    ...articleSection({
      h2: 'O que é facturação certificada',
      id: 'factura-certificada',
      paragraphs: [
        'Software homologado pela AT (Moloni, InvoiceXpress, PHC, Jasmin, etc.) gera facturas com requisitos legais completos: numeração sequencial, comunicação automática, suporte a taxas de IVA, intracomunitário e exportação contabilística.',
        'Obrigatório ou fortemente recomendado quando é sujeito passivo de IVA, quando a actividade comercial exige facturação formal, ou quando o volume e os clientes B2B exigem documentos dedutíveis.',
      ],
    }),
    sectionDivider(),
    comparisonTable({
      caption: 'Recibos verdes vs facturação certificada',
      headers: ['Critério', 'Recibos verdes (e-Fatura)', 'Facturação certificada'],
      rows: [
        ['Custo software', 'Gratuito (portal AT)', '0–35 €/mês típico'],
        ['IVA', 'Isento em regra (art. 53.º)', 'Cobrança e dedução completas'],
        ['Cliente B2B', 'Aceite; sem IVA dedutível', 'Factura com IVA dedutível'],
        ['SAF-T / contabilidade', 'Limitado', 'Exportação para contador'],
        ['Escalabilidade', 'Baixa–média', 'Alta'],
        ['Curva de aprendizagem', 'Baixa', 'Média'],
      ],
    }),
    {
      type: 'callout',
      variant: 'tip',
      title: 'Regra prática',
      text: 'Se a maioria dos clientes são empresas que precisam de deduzir IVA, ou se ultrapassou o limite de isenção, planeie facturação certificada — não apenas recibos simplificados.',
    },
    ...articleSection({
      h2: 'Como fazer a transição',
      id: 'transicao',
      paragraphs: [
        'Mude de regime num fim de mês ou trimestre acordado com o contabilista — não a meio de uma série de recibos sem comunicar ao cliente.',
        'Exporte histórico de recibos do e-Fatura antes de migrar. Configure o software certificado com NIF, morada, CAE e regime de IVA correctos.',
        'Informe clientes recorrentes sobre o novo formato de documento e se os preços passam a incluir ou acrescentar IVA.',
      ],
    }),
    ...articleSection({
      h2: 'Erros comuns',
      id: 'erros',
      blocks: [
        {
          type: 'ul',
          items: [
            'Continuar em recibos verdes após passar a sujeito passivo de IVA',
            'Emitir recibo para venda de bens quando a actividade exige factura',
            'Não guardar PDF ou não enviar ao cliente',
            'Misturar despesas pessoais com documentos de actividade',
            'Assumir que «recibo» substitui contrato ou proposta comercial',
          ],
        },
      ],
    }),
    ...affiliateSection({
      heading: 'Começar no e-Fatura com método',
      headingId: 'comecar',
      intro:
        'Recibos verdes no portal bastam para muitos prestadores — até o volume, o IVA ou os clientes B2B pedirem software certificado. O salto corre melhor quando a base legal está clara e o histórico mensal já está arquivado.',
      items: [
        {
          key: 'hotmartReciboVerde7Dias',
          leadIn:
            'Se ainda não tem actividade aberta ou acaba de emitir o primeiro recibo, um guia curto em português amarra Finanças, emissão e primeiras obrigações — o alicerce antes de comparar planos certificados.',
          title: 'Recibo Verde em 7 Dias (Hotmart)',
          description: 'roteiro prático para Portugal, útil antes de mudar de regime de facturação.',
        },
        {
          key: 'amazonPastaSanfona12',
          leadIn:
            'Quando mudar de e-Fatura para software homologado, o contabilista vai pedir o histórico. Um bolso por mês (ou por trimestre) para PDFs e comprovativos evita caçar ficheiros no meio da migração.',
          title: 'Pasta sanfonada ThinkTex 12 bolsos (Amazon)',
          description: 'arquivo portátil A4 para acompanhar a transição sem perder meses.',
        },
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Escritórios de contabilidade',
      text: 'Receber documentos desorganizados de dezenas de clientes consome horas. O Teglion centraliza pedidos e prazos por cliente.',
    }),
    { type: 'link', label: 'Como emitir recibo verde passo a passo', slug: 'como-emitir-recibo-verde-passo-a-passo' },
    { type: 'link', label: 'Escolher software de facturação', slug: 'escolher-software-faturacao-portugal' },
    ...internalLinksSection({
      title: 'Artigos relacionados',
      slugs: [
        'como-emitir-recibo-verde-passo-a-passo',
        'escolher-software-faturacao-portugal',
        'iva-quando-preciso-de-me-registar',
        'declaracao-irs-guia-pratico',
      ],
    }),
    legalCallout(),
  ],
}
