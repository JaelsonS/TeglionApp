import type { BlogPost } from '@/content/blog/types'
import {
  affiliateBlock,
  articleSection,
  comparisonTable,
  internalLinksSection,
  keyTakeaways,
  legalCallout,
  proseParagraphs,
  sectionDivider,
} from '@/content/blog/shared'

export const postIva: BlogPost = {
  slug: 'iva-quando-preciso-de-me-registar',
  title: 'IVA: quando preciso de me registar e emitir facturas com IVA?',
  excerpt:
    'Regime de isenção, limite de volume de negócios, declaração periódica, taxas de IVA e sinais de transição — guia completo para não especialistas.',
  publishedAt: '2026-05-14',
  updatedAt: '2026-06-17',
  author: 'Equipa TegLion',
  authorRole: 'Equipa editorial · Guias de fiscalidade portuguesa',
  category: 'IVA',
  audience: ['independente', 'pme'],
  featured: false,
  tags: ['IVA', 'isenção', 'facturação', 'volume de negócios', 'AT', 'declaração periódica'],
  readMinutes: 18,
  coverImage: {
    src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=630&fit=crop&q=80',
    alt: 'Pagamento com cartão num terminal de loja',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'IVA em Portugal: quando sou obrigado? | Blog TegLion',
    description:
      'Perceba isenção de IVA, limites de volume de negócios, declaração periódica e facturação certificada. Guia completo para independentes em Portugal.',
    keywords: ['IVA Portugal', 'isenção IVA', 'registar IVA', 'volume negócios IVA', 'factura com IVA', 'artigo 53 CIVA'],
  },
  relatedSlugs: [
    'quando-passar-de-isento-a-iva',
    'escolher-software-faturacao-portugal',
    'recibos-verdes-vs-faturacao',
    'obrigacoes-fiscais-mes-a-mes',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Muitos pequenos negócios começam isentos de IVA (art. 53.º CIVA) dentro de um limite anual de volume de negócios.',
      'Ultrapassar o limite ou optar voluntariamente obriga a cobrar IVA e usar software certificado.',
      'Clientes empresas preferem fornecedores com IVA dedutível — factor decisivo em B2B.',
      'Sujeito passivo entrega declaração periódica de IVA (mensal ou trimestral).',
      'Taxas comuns: normal 23 %, intermédia 13 %, reduzida 6 % — conforme bem/serviço.',
    ]),
    ...proseParagraphs(
      'O IVA aparece nas facturas do supermercado — mas quando é que o seu negócio tem de cobrar IVA aos clientes? A resposta depende do regime de isenção, do volume de facturação e do tipo de clientes.',
      'Este guia explica a lógica da isenção, obrigações após passar a sujeito passivo e impacto nos preços. Os valores exactos do limite de isenção actualizam-se por lei — confirme o vigente.',
    ),
    {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=960&h=540&fit=crop&q=80',
      alt: 'Terminal de pagamento num comercio',
      caption: 'Clientes finais veem IVA todos os dias — para empresas, as regras são diferentes.',
    },
    ...articleSection({
      h2: 'Regime de isenção (artigo 53.º CIVA)',
      id: 'isencao',
      paragraphs: [
        'Muitos pequenos prestadores de serviços e comerciantes começam isentos de IVA. Enquanto isento, normalmente não cobra IVA nas vendas — mas também não deduz IVA nas compras da actividade da mesma forma que um sujeito passivo normal.',
        'A isenção não elimina todas as obrigações: pode haver declarações informativas ou comunicações à AT conforme a actividade.',
      ],
    }),
    {
      type: 'callout',
      variant: 'warning',
      title: 'Limite anual de volume de negócios',
      text: 'Se ultrapassar o limite legal, pode ser obrigado a passar a sujeito passivo. A 70–80 % do limite, fale com o contador — não espere a notificação da AT.',
    },
    sectionDivider(),
    comparisonTable({
      caption: 'Isento vs sujeito passivo — resumo',
      headers: ['Aspecto', 'Isento (art. 53.º)', 'Sujeito passivo'],
      rows: [
        ['Cobrança de IVA', 'Não (em regra)', 'Sim, nas facturas'],
        ['Dedução IVA compras', 'Limitada', 'Deduz IVA suportado'],
        ['Documento', 'Recibo verde / factura simplificada', 'Factura certificada'],
        ['Declaração periódica', 'Conforme regime', 'Mensal ou trimestral'],
        ['Software', 'Portal AT', 'Certificado AT'],
      ],
    }),
    ...articleSection({
      h2: 'Sinais de que deve rever o regime',
      id: 'sinais',
      blocks: [
        {
          type: 'ul',
          items: [
            'Facturação a 70–80 % do limite de isenção',
            'Clientes empresas a pedir factura com IVA dedutível',
            'Margens apertadas — deduzir IVA em compras compensaria',
            'Actividade B2B com volume crescente',
            'Expansão UE (regras OSS/intracomunitário)',
            'Sector onde concorrentes já facturam com IVA',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Taxas de IVA em Portugal (visão geral)',
      id: 'taxas',
      paragraphs: [
        'As taxas aplicáveis dependem do bem ou serviço: taxa normal (23 %), intermédia (13 %) e reduzida (6 %), com excepções e isenções específicas por sector.',
        'Na factura, cada linha indica a taxa correcta. Erro de taxa gera regularizações e coimas — configure correctamente no software certificado.',
      ],
    }),
    ...articleSection({
      h2: 'Declaração periódica de IVA',
      id: 'declaracao',
      paragraphs: [
        'Sujeitos passivos entregam declaração periódica onde reportam IVA liquidado (vendas) e dedutível (compras). Periodicidade: mensal ou trimestral, conforme volume e tipo de actividade.',
        'Prazo típico: até ao dia 20 do mês seguinte ao período (confirmar calendário oficial). Atrasos geram juros e coimas.',
      ],
    }),
    ...articleSection({
      h2: 'O que muda na factura e nos preços',
      id: 'factura',
      paragraphs: [
        'Com IVA, cada linha mostra base tributável, taxa e valor de IVA. Deve usar software certificado pela AT.',
        'Decida se preços ao cliente são «mais IVA» ou IVA incluído — em B2B, repercutir é habitual porque o cliente deduz.',
      ],
    }),
    {
      type: 'callout',
      variant: 'info',
      title: 'B2B vs B2C',
      text: 'Empresas preferem fornecedores sujeitos passivos para deduzir IVA. Particulares podem preferir preço sem IVA visível — avalie o seu mercado.',
    },
    ...articleSection({
      h2: 'Registo voluntário: quando compensa pedir IVA antes da obrigação',
      id: 'voluntario',
      paragraphs: [
        'Pode solicitar enquadramento como sujeito passivo mesmo abaixo do limite de isenção — útil se compra muito material dedutível (equipamento, stock) ou se clientes B2B exigem factura com IVA.',
        'A decisão não é só fiscal: passa a ter obrigações mensais ou trimestrais e custo de software. Simule com contador o impacto líquido (IVA a pagar vs IVA dedutido) antes de optar.',
      ],
      blocks: [
        comparisonTable({
          caption: 'Optar voluntariamente por IVA — prós e contras',
          headers: ['Vantagem', 'Desvantagem'],
          rows: [
            ['Deduz IVA em compras da actividade', 'Mais burocracia e prazos'],
            ['Mais credível para clientes empresas', 'Software certificado obrigatório'],
            ['Prepara crescimento sem mudança brusca', 'Pode pagar IVA líquido se poucas despesas'],
          ],
        }),
      ],
    }),
    ...articleSection({
      h2: 'Erros frequentes no primeiro ano com IVA',
      id: 'erros-iva',
      paragraphs: [
        'Confundir recibo verde isento com factura com IVA; não guardar facturas de compras com NIF; entregar declaração periódica com valor zero sem conferir mapas; cobrar 23 % em serviço que devia taxa reduzida.',
        'Cada erro pode gerar regularização, juros ou perda de dedução. Configure o software com ajuda do contador e revise o primeiro trimestre linha a linha.',
      ],
    }),
    ...internalLinksSection({
      title: 'Aprofundar IVA e facturação',
      slugs: [
        'quando-passar-de-isento-a-iva',
        'escolher-software-faturacao-portugal',
        'recibos-verdes-vs-faturacao',
        'calendario-fiscal-portugal-2026-completo',
      ],
    }),
    affiliateBlock({
      key: 'hotmartReciboVerde7Dias',
      leadIn:
        'Enquanto isento, a maioria emite recibos verdes no e-Fatura. Este guia consolida essa fase antes de software certificado.',
      title: 'Recibo Verde em 7 Dias (Hotmart)',
      description: 'Organize actividade e recibos antes da transição para sujeito passivo.',
    }),
    legalCallout('Taxas e limites de IVA alteram-se — confirme valores legais vigentes com AT ou contador.'),
  ],
}
