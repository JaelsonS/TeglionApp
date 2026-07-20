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

export const postDeclaracaoIrs: BlogPost = {
  slug: 'declaracao-irs-guia-pratico',
  title: 'Declaração de IRS: guia prático para quem nunca entregou',
  excerpt:
    'Passo a passo simples para perceber prazos, documentos e o Portal das Finanças — sem juridiquês. Ideal para trabalhadores por conta própria e primeiras declarações.',
  publishedAt: '2026-05-20',
  updatedAt: '2026-07-20',
  author: 'Liliana Nunes',
  authorRole: 'Revisão editorial TegLion · Guias de fiscalidade portuguesa',
  category: 'IRS',
  audience: ['independente', 'pme'],
  featured: false,
  tags: ['IRS', 'declaração', 'Portal das Finanças', 'prazos', 'Portugal'],
  readMinutes: 14,
  series: {
    id: 'zero-ao-primeiro-irs',
    title: 'Do zero ao primeiro IRS',
    description: 'Deduções, declaração, prazos e erros comuns — trilho para a primeira (ou próxima) entrega de IRS.',
    part: 2,
    totalParts: 4,
  },
  coverImage: {
    src: '/blog/covers/irs.svg',
    alt: 'Declaração de IRS e documentos fiscais',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Como entregar a declaração de IRS em Portugal (guia 2026) | Blog TegLion',
    description:
      'Aprenda o básico da declaração de IRS: prazos, documentos, Portal das Finanças e erros comuns. Conteúdo informativo — confirme sempre com um contador certificado.',
    keywords: [
      'declaração IRS',
      'como fazer IRS',
      'Portal das Finanças',
      'prazo IRS Portugal',
      'IRS trabalhador independente',
    ],
  },
  relatedSlugs: [
    'deducoes-irs-portugal-guia-completo',
    'prazos-irs-2026-independentes',
    'portal-financas-guia-completo-iniciantes',
    'irs-recibos-verdes-erros-comuns',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'IRS compara o imposto retido durante o ano com o imposto devido — pode haver reembolso ou pagamento.',
      'Trabalhadores independentes declaram rendimentos de actividade nos anexos adequados.',
      'O portal pré-preenche muito — mas erros de terceiros são frequentes; revise tudo.',
      'Prazo típico: primavera até início de verão — confirme datas oficiais da AT.',
      'Guarde o PDF de entrega e organize documentos pelo menos 4 anos.',
    ]),
    ...proseParagraphs(
      'É Domingo à noite, o prazo fecha na sexta, e ainda não abriu o Modelo 3 — ou abriu, viu números pré-preenchidos e fechou o separador com medo de «partir alguma coisa». No balcão do escritório, essa história chega todos os anos. Este guia existe para a transformar num checklist.',
      'Todos os anos chega a mesma dúvida: «Tenho de entregar IRS? Como é que se faz?» Se nunca entregou uma declaração — ou se entregou à mão de outra pessoa e quer perceber o processo — aqui está o essencial em linguagem clara.',
      'Este artigo foca o Modelo 3 para pessoas singulares. Sociedades entregam IRC e têm fluxos diferentes. Se teve rendimentos no estrangeiro, criptoactivos relevantes ou vários imóveis, considere apoio profissional desde o início (muitas vezes 80–150 € pela declaração complexa compensam uma coima).',
    ),
    quoteBlock(
      'O portal pré-preenche — não pré-valida a sua vida. Cruzar recibos e retenções ainda é trabalho seu (ou do contador).',
      'Prática comum em escritórios',
    ),
    { type: 'h2', id: 'o-que-e', text: 'O que é a declaração de IRS?' },
    {
      type: 'p',
      text: 'O IRS (Imposto sobre o Rendimento das Pessoas Singulares) é liquidado anualmente. Na prática, compara o que reteve ao longo do ano com o imposto devido. Se pagou a mais, pode haver reembolso; se pagou de menos, pode haver imposto a pagar — e esse valor aparece em euros no final da simulação.',
    },
    {
      type: 'ul',
      items: [
        'Trabalhadores por conta de outrem (recibos de vencimento)',
        'Trabalhadores independentes (recibos verdes / facturas)',
        'Reformados e pensionistas (conforme rendimentos)',
        'Quem teve rendimentos de arrendamento, mais-valias ou outros',
      ],
    },
    {
      type: 'link',
      label: 'Portal das Finanças — guia para iniciantes',
      slug: 'portal-financas-guia-completo-iniciantes',
    },
    { type: 'h2', id: 'prazos', text: 'Quando entregar?' },
    {
      type: 'p',
      text: 'O calendário oficial é publicado todos os anos pela Autoridade Tributária. Em geral, a declaração abre na primavera e fecha no final de junho ou início de julho. Confirme sempre as datas exactas no Portal das Finanças — não assuma o ano passado.',
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Dica de balcão',
      text: 'Marque no telemóvel o último dia útil do prazo — e um alerta 14 dias antes. Entregar no último dia é arriscado: o portal sobrecarrega-se e erros de última hora custam tempo (e por vezes juros).',
    },
    {
      type: 'link',
      label: 'Prazos IRS 2026 para independentes',
      slug: 'prazos-irs-2026-independentes',
    },
    {
      type: 'link',
      label: 'Calendário fiscal Portugal 2026 completo',
      slug: 'calendario-fiscal-portugal-2026-completo',
    },
    { type: 'h2', id: 'documentos', text: 'Documentos que costumam ser necessários' },
    {
      type: 'ol',
      items: [
        'NIF e senha de acesso ao Portal das Finanças (ou Chave Móvel Digital)',
        'Recibos de vencimento ou mapa de rendimentos do empregador',
        'Recibos verdes / facturas emitidas (se for independente) — some o total em euros',
        'Comprovativos de despesas dedutíveis (saúde, educação, habitação — conforme elegibilidade)',
        'IBAN para reembolso ou débito',
        'Dados do agregado familiar, se aplicável',
        'Comprovativos de retenção na fonte e de contribuições SS (quando relevantes)',
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'Checklist 48 horas antes de submeter',
      text: '(1) Somar recibos emitidos e confrontar com o portal; (2) rever e-Fatura linha a linha; (3) confirmar IBAN; (4) validar agregado; (5) guardar PDF da simulação; (6) só depois submeter e guardar comprovativo.',
    },
    { type: 'h2', id: 'passos', text: 'Passos resumidos no Portal das Finanças' },
    {
      type: 'ol',
      items: [
        'Entrar em portaldasfinancas.gov.pt com NIF + senha ou CMD',
        'Abrir «IRS» → «Entregar declaração»',
        'Confirmar rendimentos pré-preenchidos (se existirem)',
        'Indicar despesas e benefícios fiscais elegíveis',
        'Validar e submeter — guarde o comprovativo PDF',
      ],
    },
    {
      type: 'link',
      label: 'Erros comuns em IRS com recibos verdes',
      slug: 'irs-recibos-verdes-erros-comuns',
    },
    { type: 'h2', id: 'erros', text: 'Erros comuns de principiantes' },
    {
      type: 'ul',
      items: [
        'Esquecer rendimentos de plataformas digitais ou trabalhos pontuais',
        'Não cruzar valores com recibos verdes emitidos',
        'Assumir que «o portal já está correcto» sem rever',
        'Deixar para a véspera do prazo',
        'Não guardar comprovativo de entrega',
        'Misturar despesas pessoais com custos de actividade',
      ],
    },
    teglionCtaBlock({
      variant: 'firm',
      title: 'Clientes a entregar PDFs só na última semana?',
      text: 'Com TegLion, o escritório pede documentos ao longo do ano — a declaração deixa de ser uma maratona de Abril. Portal com a marca do escritório, histórico e menos WhatsApp.',
    }),
    { type: 'h2', id: 'backup-cloud', text: 'Backup na cloud além do pen drive' },
    {
      type: 'p',
      text: 'Pen drive offline é excelente para o PDF da declaração entregue — mas recibos e folhas Excel acumulam-se durante o ano. Sincronizar uma pasta «Fiscal 2026» no OneDrive (ou equivalente) evita perder tudo se o portátil avariar na véspera do prazo. Combine backup automático com antivírus: dados fiscais são alvo de ransomware.',
    },
    ...affiliateSection({
      heading: 'Preparar a mesa antes de abrir o portal',
      headingId: 'preparar',
      intro:
        'O erro clássico é abrir o Portal das Finanças à meia-noite do último dia, sem ter somado os recibos. Quem prepara números e documentos com antecedência entrega em meia hora; quem improvisa passa a noite a duvidar dos totais pré-preenchidos.',
      items: [
        {
          key: 'hotmartIrsReciboVerde',
          leadIn:
            'Na primeira declaração com actividade aberta, o anexo B e as retenções geram mais dúvidas do que o próprio login. Um guia dedicado a IRS e recibos verdes em Portugal preenche lacunas deste artigo — sempre a validar com contador certificado.',
          title: 'IRS & Recibo Verde — guia prático (Hotmart)',
          description: 'estrutura a preparação para independentes sem improvisar na última semana.',
        },
        {
          key: 'amazonCasio991',
          leadIn:
            'Antes de aceitar os valores do portal, some manualmente recibos emitidos e retenções na fonte. Uma calculadora científica com memória ajuda a detectar diferenças face ao pré-preenchido — o tipo de verificação que evita rectificações depois.',
          title: 'Calculadora Casio fx-991ES Plus (Amazon)',
          description: 'cruzar totais antes de submeter o Modelo 3.',
        },
      ],
    }),
    { type: 'h2', id: 'quando-contador', text: 'Quando falar com um contador?' },
    {
      type: 'p',
      text: 'Se teve rendimentos no estrangeiro, actividade aberta, vários empregadores, arrendamento, crypto, ou heranças no ano, a declaração deixa de ser «básica». Um contador certificado evita coimas e optimiza legalmente a situação — honorários pontuais de IRS costumam ficar bem abaixo do custo de uma correcção mal feita.',
    },
    {
      type: 'link',
      label: 'Como escolher contabilista em Portugal',
      slug: 'como-escolher-contabilista-portugal',
    },
    ...articleSection({
      h2: 'Deduções à coleta: o que muita gente esquece',
      id: 'deducoes',
      paragraphs: [
        'Além dos rendimentos, o IRS permite reduzir a coleta com despesas de saúde, educação, habitação e outras categorias — desde que tenha facturas com NIF e respeite limites legais. Em agregados com filhos e crédito habitação, a diferença no reembolso pode ser de centenas de euros.',
        'Trabalhador independente: não misture despesas pessoais com custos de actividade. Temos um guia completo só sobre deduções.',
      ],
      blocks: [
    { type: 'link', label: 'Guia completo de deduções no IRS', slug: 'deducoes-irs-portugal-guia-completo' },
      ],
    }),
    ...internalLinksSection({
      title: 'Artigos relacionados',
      slugs: [
        'deducoes-irs-portugal-guia-completo',
        'prazos-irs-2026-independentes',
        'irs-recibos-verdes-erros-comuns',
        'calendario-fiscal-portugal-2026-completo',
      ],
    }),
    legalCallout('As regras e limites de dedução mudam — confirme o enquadramento do ano fiscal em curso.'),
  ],
}
