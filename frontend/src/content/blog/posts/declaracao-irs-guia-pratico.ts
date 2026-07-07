import type { BlogPost } from '@/content/blog/types'
import {
  affiliateSection,
  articleSection,
  internalLinksSection,
  keyTakeaways,
  legalCallout,
  proseParagraphs,
} from '@/content/blog/shared'

export const postDeclaracaoIrs: BlogPost = {
  slug: 'declaracao-irs-guia-pratico',
  title: 'Declaração de IRS: guia prático para quem nunca entregou',
  excerpt:
    'Passo a passo simples para perceber prazos, documentos e o Portal das Finanças — sem juridiquês. Ideal para trabalhadores por conta própria e primeiras declarações.',
  publishedAt: '2026-05-20',
  updatedAt: '2026-05-24',
  author: 'Equipa TegLion',
  category: 'IRS',
  tags: ['IRS', 'declaração', 'Portal das Finanças', 'prazos', 'Portugal'],
  readMinutes: 18,
  coverImage: {
    src: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&h=630&fit=crop&q=80&auto=format',
    alt: 'Pessoa a organizar documentos fiscais numa secretária',
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
    'abrir-empresa-individual-eni',
    'obrigacoes-fiscais-mes-a-mes',
    'proteger-dados-fiscais-freelancer-portugal',
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
      'Todos os anos chega a mesma dúvida: «Tenho de entregar IRS? Como é que se faz?» Se nunca entregou uma declaração — ou se entregou à mão de outra pessoa e quer perceber o processo — este guia explica o essencial em linguagem clara.',
      'Este artigo foca o Modelo 3 para pessoas singulares. Sociedades entregam IRC e têm fluxos diferentes. Se teve rendimentos no estrangeiro, criptoactivos relevantes ou vários imóveis, considere apoio profissional desde o início.',
    ),
    {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=960&h=540&fit=crop&q=80&auto=format',
      alt: 'Documentos e calculadora sobre uma mesa de trabalho',
      caption: 'Organizar documentos antes de abrir o Portal das Finanças poupa tempo e evita erros.',
    },
    { type: 'h2', id: 'o-que-e', text: 'O que é a declaração de IRS?' },
    {
      type: 'p',
      text: 'O IRS (Imposto sobre o Rendimento das Pessoas Singulares) é liquidado anualmente. Na prática, compara o que reteve ao longo do ano com o imposto devido. Se pagou a mais, pode haver reembolso; se pagou de menos, pode haver imposto a pagar.',
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
    { type: 'h2', id: 'prazos', text: 'Quando entregar?' },
    {
      type: 'p',
      text: 'O calendário oficial é publicado todos os anos pela Autoridade Tributária. Em geral, a declaração abre na primavera e fecha no final de junho ou início de julho. Confirme sempre as datas exactas no Portal das Finanças — não assuma o ano passado.',
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Dica',
      text: 'Marque no telemóvel o último dia útil do prazo. Entregar no último dia é arriscado: o portal pode estar sobrecarregado.',
    },
    { type: 'h2', id: 'documentos', text: 'Documentos que costumam ser necessários' },
    {
      type: 'ol',
      items: [
        'NIF e senha de acesso ao Portal das Finanças (ou Chave Móvel Digital)',
        'Recibos de vencimento ou mapa de rendimentos do empregador',
        'Recibos verdes / facturas emitidas (se for independente)',
        'Comprovativos de despesas dedutíveis (saúde, educação, habitação — conforme elegibilidade)',
        'IBAN para reembolso ou débito',
        'Dados do agregado familiar, se aplicável',
      ],
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
      type: 'image',
      src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=960&h=540&fit=crop&q=80',
      alt: 'Portátil com gráficos e notas sobre uma mesa',
      caption: 'Revise rendimentos pré-preenchidos linha a linha — erros de terceiros acontecem.',
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
      ],
    },
    { type: 'h2', id: 'backup-cloud', text: 'Backup na cloud além do pen drive' },
    {
      type: 'p',
      text: 'Pen drive offline é excelente para o PDF da declaração entregue — mas recibos e folhas Excel acumulam-se durante o ano. Sincronizar uma pasta «Fiscal 2026» no OneDrive (ou equivalente) evita perder tudo se o portátil avariar na véspera do prazo. Combine backup automático com antivírus: dados fiscais são alvo de ransomware.',
    },
    ...affiliateSection({
      heading: 'Preparar a mesa antes de abrir o portal',
      headingId: 'preparar',
      intro:
        'O erro clássico é abrir o Portal das Finanças à meia-noite do último dia, sem ter somado os recibos. Quem prepara números e cópias em papel (ou PDF) entrega em meia hora — quem não prepara, passa a noite em dúvida.',
      items: [
        {
          key: 'hotmartIrsReciboVerde',
          leadIn:
            'Se é a primeira declaração com actividade aberta, um guia dedicado a IRS e recibos verdes em Portugal preenche lacunas que este artigo não cobre — especialmente cálculo de impostos e anexo B.',
          title: 'IRS & Recibo Verde — guia prático (Hotmart)',
          description:
            'Ebook com linguagem simples para independentes. Complementa este guia — confirme sempre com contador certificado.',
          image: {
            src: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=640&h=360&fit=crop&q=80',
            alt: 'Calculadora e documentos fiscais',
          },
        },
        {
          key: 'amazonCasio991',
          leadIn:
            'Antes de aceitar os valores pré-preenchidos, some manualmente os recibos emitidos e as retenções na fonte. A Casio fx-991ES Plus é o modelo usado em escolas portuguesas — memória e estatísticas ajudam a detectar diferenças.',
          title: 'Calculadora Casio fx-991ES Plus (Amazon)',
          description: 'Certificada para currículo PT/ES. Ideal para cruzar totais antes de submeter.',
          image: {
            src: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=640&h=360&fit=crop&q=80',
            alt: 'Calculadora científica',
          },
        },
        {
          key: 'amazonM365Pessoal',
          leadIn:
            'Para somar recibos num Excel e guardar PDFs com sync automático, o Microsoft 365 Pessoal inclui Office e 1 TB OneDrive — útil durante todo o ano, não só na semana do IRS.',
          title: 'Microsoft 365 Pessoal — 12 meses (Amazon)',
          description: 'Word, Excel e 1 TB OneDrive. Código de activação por email.',
        },
        {
          key: 'amazonPenDrive32',
          leadIn:
            'Guarde o PDF da declaração submetida, os recibos do ano e o comprovativo de entrega num pen drive à parte do portátil. Se o disco falhar ou a cloud tiver problema, ainda tem prova do que entregou.',
          title: 'Pen drives USB 32GB — backup (Amazon)',
          description: 'Pack económico para cópia offline de PDFs fiscais — um drive por ano fiscal.',
        },
      ],
    }),
    { type: 'h2', id: 'quando-contador', text: 'Quando falar com um contador?' },
    {
      type: 'p',
      text: 'Se teve rendimentos no estrangeiro, actividade aberta, vários empregadores, arrendamento, crypto, ou heranças no ano, a declaração deixa de ser «básica». Um contador certificado evita coimas e optimiza legalmente a situação.',
    },
    ...articleSection({
      h2: 'Deduções à coleta: o que muita gente esquece',
      id: 'deducoes',
      paragraphs: [
        'Além dos rendimentos, o IRS permite reduzir a coleta com despesas de saúde, educação, habitação e outras categorias — desde que tenha facturas com NIF e respeite limites legais.',
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
