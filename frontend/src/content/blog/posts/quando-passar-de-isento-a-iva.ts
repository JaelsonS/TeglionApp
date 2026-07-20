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

export const postPassarIsentoIva: BlogPost = {
  slug: 'quando-passar-de-isento-a-iva',
  title: 'Quando passar de isento de IVA a sujeito passivo',
  excerpt:
    'Sinais de que ultrapassou o limite de isenção, o que preparar antes da mudança, impacto na facturação, preços e software certificado — guia completo para freelancers.',
  publishedAt: '2026-05-20',
  updatedAt: '2026-06-17',
  author: 'Liliana Nunes',
  authorRole: 'Revisão editorial TegLion · Guias de fiscalidade portuguesa',
  category: 'IVA',
  audience: ['independente', 'pme'],
  featured: false,
  tags: ['IVA', 'isenção', 'sujeito passivo', 'volume negócios', 'facturação'],
  readMinutes: 11,
  coverImage: {
    src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=630&fit=crop&q=80',
    alt: 'Terminal de pagamento',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Passar de isento a sujeito passivo de IVA | Blog TegLion',
    description:
      'Quando deixa de estar isento de IVA em Portugal: limites, preparação, software certificado, ajuste de preços e declarações periódicas.',
    keywords: ['passar a sujeito passivo IVA', 'fim isenção IVA', 'limite IVA Portugal', 'transição IVA freelancer'],
  },
  relatedSlugs: [
    'iva-quando-preciso-de-me-registar',
    'escolher-software-faturacao-portugal',
    'recibos-verdes-vs-faturacao',
    'calendario-fiscal-portugal-2026-completo',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'A isenção de IVA (art. 53.º CIVA) tem um limite anual de volume de negócios — ultrapassá-lo obriga, em regra, a passar a sujeito passivo.',
      'Pode optar voluntariamente por IVA antes do limite se clientes B2B precisarem de deduzir IVA nas compras.',
      'A transição implica software certificado, facturas com IVA e declarações periódicas (mensais ou trimestrais).',
      'Reveja preços: o IVA pode ser repercutido ao cliente ou absorvido na margem — decisão comercial, não só fiscal.',
      'Planeie com o contador 2–3 meses antes de atingir o limite para não emitir documentos inválidos.',
    ]),
    ...proseParagraphs(
      'Crescer é bom — mas quando a facturação se aproxima do limite de isenção de IVA, convém planear a transição com calma. Passar a sujeito passivo muda facturas, preços, deduções nas compras e o software que usa no dia a dia.',
      'Muitos freelancers descobrem a mudança quando um cliente empresarial recusa continuar sem factura com IVA dedutível, ou quando o portal das Finanças notifica que ultrapassou o volume de negócios. Em ambos os casos, reagir tarde significa recibos errados, coimas e conversas difíceis com contabilidade.',
      'Este guia explica os sinais de alerta, o que preparar antes da data efectiva, como ajustar preços e que obrigações mensais entram no calendário. Os valores exactos do limite de isenção actualizam-se por lei — confirme sempre o vigente no ano fiscal.',
    ),
    {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=960&h=540&fit=crop&q=80',
      alt: 'Pagamento com cartão num terminal',
      caption: 'Mudar de regime IVA afecta como apresenta preços e documentos aos clientes.',
    },
    ...articleSection({
      h2: 'Como funciona a isenção de IVA',
      id: 'isenção',
      paragraphs: [
        'Em Portugal, muitos pequenos prestadores de serviços e comerciantes começam isentos de IVA ao abrigo do artigo 53.º do Código do IVA. Enquanto isento, não cobra IVA nas vendas — mas também não deduz IVA nas compras relacionadas com a actividade (salvo excepções previstas na lei).',
        'O limite de isenção refere-se ao volume de negócios anual: soma do que facturou (ou deveria ter facturado) no ano civil. Ultrapassar esse limite, em regra, obriga a inscrição como sujeito passivo de IVA a partir do momento legalmente definido — não «quando lhe apetecer».',
        'Há também a opção voluntária: antes de atingir o limite, pode pedir para passar a sujeito passivo se isso fizer sentido comercialmente — por exemplo, se a maioria dos clientes são empresas que preferem fornecedores com IVA dedutível.',
      ],
    }),
    ...articleSection({
      h2: 'Sinais de alerta: está na hora de planear',
      id: 'sinais',
      paragraphs: [
        'Não espere pela carta das Finanças para começar a preparar-se. Estes indicadores sugerem que a transição está próxima:',
      ],
      blocks: [
        {
          type: 'ul',
          items: [
            'Facturação anual a 70–80 % do limite de isenção — projecte o resto do ano com base nos contratos em curso',
            'Clientes empresas pedem factura com IVA e NIF para dedução contabilística',
            'Margens apertadas em que deduzir IVA em equipamento, software e subcontratação faria diferença',
            'Actividade predominantemente B2B com volume crescente trimestre a trimestre',
            'Plataformas ou marketplaces exigem documentação fiscal «de empresa»',
            'Contador recomenda mudança por despesas elevadas não reflectidas no regime simplificado',
          ],
        },
      ],
    }),
    sectionDivider(),
    comparisonTable({
      caption: 'Isento de IVA vs sujeito passivo — impacto prático',
      headers: ['Aspecto', 'Isento (art. 53.º)', 'Sujeito passivo'],
      rows: [
        ['Documento de venda', 'Recibo verde ou factura simplificada', 'Factura com IVA (software certificado)'],
        ['IVA nas vendas', 'Não cobra', 'Cobra (taxa normal, intermédia ou reduzida)'],
        ['IVA nas compras', 'Em regra não deduz', 'Deduz IVA suportado nas compras da actividade'],
        ['Declarações periódicas', 'Pode haver obrigações informativas', 'Declaração periódica mensal ou trimestral'],
        ['Software', 'Portal Finanças / apps autorizadas', 'Software de facturação certificado pela AT'],
        ['Preços ao cliente', 'Valor líquido = valor cobrado', 'Decidir se preço é «mais IVA» ou IVA incluído'],
      ],
    }),
    ...articleSection({
      h2: 'O que preparar antes da mudança',
      id: 'preparar',
      paragraphs: [
        'Uma transição bem feita demora semanas, não horas. Use esta sequência como roteiro — o contador ajusta datas e formalidades ao seu caso.',
      ],
      blocks: [
        {
          type: 'ol',
          items: [
            'Simular com contador: data efectiva, regime de IVA (mensal vs trimestral), impacto no IRS',
            'Escolher e configurar software de facturação certificado — testar emissão de factura de teste',
            'Rever contratos e propostas comerciais: preços com ou sem IVA, cláusulas de revisão',
            'Organizar fornecedores: pedir facturas com NIF da actividade para dedução futura',
            'Actualizar dados no Portal das Finanças e comunicar mudança a clientes recorrentes',
            'Formar-se na declaração periódica de IVA ou delegar ao contador com documentos a tempo',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Ajustar preços: repercutir ou absorver IVA?',
      id: 'precos',
      paragraphs: [
        'Esta é a decisão comercial mais sensível. Se cobrava 1.000 € por um serviço isento, passar a sujeito passivo com taxa normal de 23 % pode significar:',
        'Repercutir: o cliente paga 1.230 € (1.000 € + 230 € de IVA). O seu rendimento líquido mantém-se se o mercado aceitar.',
        'Absorver: mantém 1.000 € ao cliente, dos quais 813 € são base tributável e 187 € são IVA que entrega ao Estado — margem menor.',
        'Em B2B, repercutir é habitual porque o cliente deduz o IVA. Em B2C ou mercados sensíveis ao preço, muitos freelancers absorvem parcialmente no primeiro ano e ajustam gradualmente.',
      ],
    }),
    ...articleSection({
      h2: 'Erros comuns na transição',
      id: 'erros',
      blocks: [
        {
          type: 'ul',
          items: [
            'Continuar a emitir recibos verdes simples após a data de sujeição a IVA',
            'Não emitir factura no mês da mudança — lacunas no e-Fatura geram coimas',
            'Esquecer de comunicar SAF-T ou ficheiros de facturação conforme regime',
            'Não guardar facturas de compra com IVA dedutível',
            'Assumir que o contador «trata de tudo» sem enviar documentos a tempo',
          ],
        },
      ],
    }),
    affiliateBlock({
      key: 'hotmartReciboVerde7Dias',
      leadIn:
        'Aproximar-se do limite de isenção assusta — mas mudar de regime sem arquivo organizado é pior. Consolide recibos verdes e documentos enquanto ainda isento; depois escolha software certificado com calma.',
      title: 'Ainda em recibos verdes? Consolide a base (Hotmart)',
      description:
        'Antes de mudar de regime IVA, domine abertura de actividade, recibos e obrigações mensais com um guia passo a passo para Portugal.',
    }),
    { type: 'link', label: 'IVA: quando preciso de me registar?', slug: 'iva-quando-preciso-de-me-registar' },
    { type: 'link', label: 'Escolher software de facturação', slug: 'escolher-software-faturacao-portugal' },
    ...internalLinksSection({
      title: 'Continuar a ler',
      intro: 'Artigos relacionados para completar a transição de regime.',
      slugs: [
        'iva-quando-preciso-de-me-registar',
        'escolher-software-faturacao-portugal',
        'obrigacoes-fiscais-mes-a-mes',
        'calendario-fiscal-portugal-2026-completo',
      ],
    }),
    legalCallout('Limites legais de isenção e prazos actualizam-se — confirme valores vigentes no Portal das Finanças e com contador certificado.'),
  ],
}
