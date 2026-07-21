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

export const postRetencaoFonte: BlogPost = {
  slug: 'retencao-fonte-recibos-verdes',
  title: 'Retenção na fonte nos recibos verdes: como funciona',
  excerpt:
    'Quando o cliente retém IRS, que taxas aplicar, como reflectir no recibo, no IRS anual e no fluxo de caixa — guia completo para independentes em Portugal.',
  publishedAt: '2026-05-23',
  updatedAt: '2026-06-17',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do Teglion · Escreve sobre fiscalidade em Portugal',
  category: 'Facturação',
  audience: ['independente', 'pme'],
  featured: false,
  tags: ['retenção na fonte', 'IRS', 'recibos verdes', 'retenções', 'freelancer'],
  readMinutes: 11,
  coverImage: {
    src: '/blog/covers/irs.svg',
    alt: 'Retenção na fonte nos recibos verdes',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Retenção na fonte recibos verdes explicada | Blog Teglion',
    description:
      'Perceba retenções IRS nos recibos verdes: quando aplicam, taxas comuns, cálculo bruto/líquido e impacto na declaração anual de rendimentos.',
    keywords: ['retenção na fonte recibos verdes', 'IRS retenção freelancer', 'taxa retenção independente', 'retenção IRS Portugal'],
  },
  relatedSlugs: [
    'como-emitir-recibo-verde-passo-a-passo',
    'declaracao-irs-guia-pratico',
    'irs-recibos-verdes-erros-comuns',
    'deducoes-irs-portugal-guia-completo',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'A retenção na fonte é IRS que o cliente (entidade) retém e entrega ao Estado em seu nome.',
      'Aplica-se sobretudo a prestações de serviços B2B — particulares raramente retêm.',
      'No recibo verde: valor bruto − retenção IRS = valor líquido que recebe na conta.',
      'As retenções aparecem pré-preenchidas no IRS anual — devem coincidir com os recibos emitidos.',
      'Taxas variam conforme tipo de rendimento e enquadramento — confirme a aplicável antes de emitir.',
    ]),
    ...proseParagraphs(
      'Quando presta serviços a empresas, o cliente pode ser obrigado a reter uma parte do IRS na fonte. Essa retenção aparece no recibo verde e depois no seu IRS anual — por isso convém perceber o fluxo desde o primeiro documento.',
      'O erro mais frequente: emitir o recibo com valor bruto, esperar receber esse valor na transferência, e descobrir que o cliente pagou menos porque reteve IRS. Outro erro: não declarar as retenções no IRS e pagar imposto em duplicado.',
      'Este artigo explica quem retém, como calcular, o que preencher no portal e como cruzar totais no fim do ano. As taxas exactas dependem da legislação em vigor — use sempre o enquadramento actualizado ou o contador.',
    ),
    ...articleSection({
      h2: 'O que é retenção na fonte',
      id: 'conceito',
      paragraphs: [
        'A retenção na fonte é um mecanismo em que quem paga rendimentos (o cliente, como entidade) retém uma percentagem de IRS e entrega-a directamente à Autoridade Tributária. Para si, funciona como um «pagamento antecipado» de imposto — não é um custo extra do cliente, é parte do seu IRS que já foi paga.',
        'No recibo verde emitido no Portal das Finanças, indica o valor bruto da prestação, a taxa de retenção aplicável e o valor líquido. O cliente transfere-lhe o líquido; a retenção é responsabilidade dele perante a AT.',
      ],
    }),
    ...articleSection({
      h2: 'Quando há retenção',
      id: 'quando',
      paragraphs: [
        'Depende do tipo de rendimento, do cliente (empresa vs particular) e das regras em vigor. Em termos práticos:',
      ],
      blocks: [
        {
          type: 'ul',
          items: [
            'Prestações de serviços a empresas (B2B): retenção frequente, com taxa definida por categoria de rendimento',
            'Prestações a particulares: em regra sem retenção na fonte',
            'Alguns rendimentos têm taxas específicas ou isenções (ex.: primeiros anos de actividade em certos casos)',
            'Clientes do estrangeiro com estabelecimento estável em Portugal podem aplicar regras diferentes',
          ],
        },
      ],
    }),
    sectionDivider(),
    comparisonTable({
      caption: 'Bruto, retenção e líquido — exemplo ilustrativo',
      headers: ['Conceito', 'Exemplo (1.000 € bruto, 25 % retenção)'],
      rows: [
        ['Valor bruto (prestação)', '1.000,00 €'],
        ['Retenção IRS (25 %)', '250,00 €'],
        ['Valor líquido recebido', '750,00 €'],
        ['O que declara no IRS', '1.000 € de rendimento + 250 € de retenção já paga'],
        ['Impacto no imposto final', 'A retenção abate ao IRS devido — pode gerar reembolso'],
      ],
    }),
    ...articleSection({
      h2: 'No momento de emitir o recibo',
      id: 'recibo',
      paragraphs: [
        'Antes de carregar em «emitir», confirme com o cliente se há retenção e qual a taxa. Empresas com departamento financeiro enviam frequentemente essa informação por email.',
      ],
      blocks: [
        {
          type: 'ol',
          items: [
            'Identifique o tipo de rendimento correcto no portal (categoria da prestação)',
            'Indique a taxa de IRS correcta ou isenção, se aplicável ao seu enquadramento',
            'Verifique: valor líquido = bruto − retenção (e − Segurança Social se aplicável)',
            'Envie o PDF ao cliente e guarde cópia — prova para o IRS e para cobrança',
            'Registe no seu controlo mensal: bruto, retenção, líquido, data de pagamento',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Retenções no IRS anual',
      id: 'irs-anual',
      paragraphs: [
        'No anexo de rendimentos da actividade independente, o portal pré-preenche rendimentos e retenções com base nos recibos comunicados. O seu trabalho é validar:',
        'Total de recibos emitidos no ano = rendimentos declarados? Total de retenções nos recibos = retenções declaradas? Se houver divergência, corrija antes de submeter — ou peça ao cliente para regularizar documentos em falta.',
        'Se reteve mais do que o imposto final devido, há reembolso. Se reteve de menos (recibos sem retenção quando devia haver), pode haver imposto a pagar no acerto.',
      ],
    }),
    ...articleSection({
      h2: 'Fluxo de caixa: planear com retenções',
      id: 'caixa',
      paragraphs: [
        'Freelancers que facturam valores altos a empresas devem planear que parte do «bruto» não entra na conta de imediato. Uma prática útil: separar mentalmente 25–30 % do bruto B2B para impostos, mesmo que parte já tenha sido retida — o IRS anual pode ainda exigir pagamento adicional após deduções e coeficientes do regime simplificado.',
      ],
    }),
    ...articleSection({
      h2: 'Isenções e primeiros anos de actividade',
      id: 'isencoes',
      paragraphs: [
        'Em certos enquadramentos, pode existir isenção ou taxa reduzida de retenção nos primeiros anos de actividade independente. As regras mudam com a legislação — não assuma que «sempre foi assim» continua válido.',
        'Se beneficiar de isenção, documente no recibo e guarde comprovativo do enquadramento. O cliente pode pedir justificação antes de emitir sem retenção.',
      ],
    }),
    ...articleSection({
      h2: 'Retenção IRS vs contribuição para a Segurança Social',
      id: 'irs-vs-ss',
      paragraphs: [
        'Não confunda retenção na fonte (IRS, paga pelo cliente à AT) com a contribuição para a Segurança Social (paga por si à SS). São entidades, prazos e bases de cálculo diferentes.',
        'Em alguns tipos de prestação pode haver retenção à Segurança Social pelo cliente — confirme o enquadramento da sua actividade. O recibo deve reflectir cada componente separadamente para o IRS anual bater certo.',
      ],
    }),
    ...articleSection({
      h2: 'Quando o cliente erra a retenção',
      id: 'erros-cliente',
      paragraphs: [
        'Cliente retém de menos: pode ter imposto a pagar no acerto anual. Cliente retém de mais: reembolso possível no IRS, mas o fluxo de caixa sofre no meio do ano.',
        'Se o cliente recusa corrigir um recibo errado, guarde emails e PDFs — o contabilista pode orientar sobre regularização. Não anule recibos sem perceber o impacto na cadeia de comunicação à AT.',
      ],
      blocks: [
        {
          type: 'callout',
          variant: 'tip',
          title: 'Antes de cobrar o cliente',
          text: 'Confirme por escrito: valor bruto, taxa de retenção e valor líquido esperado na transferência. Evita disputas quando o departamento financeiro aplica taxa diferente da combinada.',
        },
      ],
    }),
    ...affiliateSection({
      heading: 'Calcular antes de emitir o recibo',
      headingId: 'calcular',
      intro:
        'Muitos independentes só percebem a retenção quando o cliente paga menos do que esperavam. Fazer as contas antes de carregar em «emitir» evita recibos errados e conversas embaraçosas.',
      items: [
        {
          key: 'hotmartIrsReciboVerde',
          leadIn:
            'O guia IRS & Recibo Verde dedica capítulos a retenções, Segurança Social e cálculo de impostos — ideal se ainda confunde bruto, líquido e taxa de IRS na fonte.',
          title: 'IRS & Recibo Verde (Hotmart)',
          description: 'Ebook prático para independentes em Portugal.',
        },
        {
          key: 'amazonCasio991',
          leadIn:
            'Exemplo: serviço de 1.000 € com retenção de 25 % — quanto recebe na transferência? Simule na calculadora antes de preencher o portal.',
          title: 'Calculadora Casio fx-991ES Plus (Amazon)',
          description: 'Validação rápida de retenções e totais anuais.',
        },
      ],
    }),
    { type: 'link', label: 'Como emitir recibo verde passo a passo', slug: 'como-emitir-recibo-verde-passo-a-passo' },
    { type: 'link', label: 'Erros comuns em IRS com recibos verdes', slug: 'irs-recibos-verdes-erros-comuns' },
    ...internalLinksSection({
      title: 'Artigos relacionados',
      slugs: [
        'como-emitir-recibo-verde-passo-a-passo',
        'declaracao-irs-guia-pratico',
        'irs-recibos-verdes-erros-comuns',
      ],
    }),
    legalCallout('Taxas de retenção e isenções variam conforme legislação — confirme enquadramento actualizado com AT ou contador.'),
  ],
}
