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
  author: 'Equipa TegLion',
  category: 'Facturação',
  tags: ['recibos verdes', 'e-Fatura', 'facturação certificada', 'AT', 'freelancer'],
  readMinutes: 15,
  coverImage: {
    src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop&q=80',
    alt: 'Ecrã de computador com gráficos de negócio',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Recibos verdes ou factura certificada? | Blog TegLion',
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
      'A transição de recibos para factura deve ser planeada com contador para não haver lacunas documentais.',
    ]),
    ...proseParagraphs(
      '«Emito recibo verde ou factura?» É uma das primeiras perguntas de quem abre actividade. Não existe uma resposta única: depende do regime de IVA, do tipo de cliente e do volume de negócio.',
      'Confundir os dois regimes gera erros de IVA, coimas e conversas difíceis com clientes que precisam de documentos dedutíveis. Este guia compara lado a lado e indica quando faz sentido evoluir.',
    ),
    {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=960&h=540&fit=crop&q=80',
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
        'Mude de regime num fim de mês ou trimestre acordado com o contador — não a meio de uma série de recibos sem comunicar ao cliente.',
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
      heading: 'Começar simples, crescer com método',
      headingId: 'comecar',
      intro:
        'Recibos verdes no e-Fatura bastam para muitos — até a facturação crescer ou o IVA bater à porta.',
      items: [
        {
          key: 'hotmartReciboVerde7Dias',
          leadIn:
            'Se ainda não tem actividade aberta ou acaba de emitir o primeiro recibo, este guia amarra os passos legais em Portugal.',
          title: 'Recibo Verde em 7 Dias (Hotmart)',
          description: 'Base para decidir facturação certificada depois.',
        },
        {
          key: 'amazonCasio991',
          leadIn:
            'Simule retenções e totais mensais antes de fechar o mês.',
          title: 'Calculadora Casio fx-991ES Plus (Amazon)',
          description: 'Cálculos de retenções e totais anuais.',
        },
        {
          key: 'amazonPastaSanfona12',
          leadIn:
            'Um bolso por mês para PDFs — histórico organizado na mudança de software.',
          title: 'Pasta sanfonada ThinkTex 12 bolsos (Amazon)',
          description: 'Arquivo portátil A4.',
        },
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Escritórios de contabilidade',
      text: 'Receber documentos desorganizados de dezenas de clientes consome horas. O TegLion centraliza pedidos e prazos por cliente.',
    }),
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
