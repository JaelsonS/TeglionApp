import type { BlogPost } from '@/content/blog/types'
import {
  affiliateSection,
  articleSection,
  internalLinksSection,
  keyTakeaways,
  legalCallout,
  proseParagraphs,
  sectionDivider,
  teglionCtaBlock,
} from '@/content/blog/shared'

export const postPortalFinancas: BlogPost = {
  slug: 'portal-financas-guia-completo-iniciantes',
  title: 'Portal das Finanças: guia completo para iniciantes',
  excerpt:
    'Senha, Chave Móvel Digital, e-Fatura, recibos verdes e consulta de dívidas — tudo o que um independente usa no portal, explicado por secção.',
  publishedAt: '2026-06-15',
  updatedAt: '2026-07-17',
  author: 'Equipa TegLion',
  authorRole: 'Equipa editorial · Guias de fiscalidade portuguesa',
  category: 'Organização',
  audience: ['independente', 'escritorio'],
  tags: ['Portal das Finanças', 'e-Fatura', 'AT', 'recibos verdes', 'Chave Móvel Digital'],
  readMinutes: 22,
  featured: false,
  series: {
    id: 'independente-2026',
    title: 'Trabalhador independente em Portugal',
    description: 'Série completa para quem abre actividade ou já factura em recibos verdes.',
    part: 3,
    totalParts: 5,
  },
  coverImage: {
    src: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&h=630&fit=crop&q=80',
    alt: 'Pessoa a usar computador portátil com documentos',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Portal das Finanças para iniciantes (guia completo) | Blog TegLion',
    description:
      'Aprenda a usar o Portal das Finanças: login, e-Fatura, emitir recibos, consultar situação fiscal e evitar erros comuns. Guia para trabalhadores independentes.',
    keywords: ['Portal das Finanças guia', 'e-Fatura iniciantes', 'recibo verde portal', 'AT login'],
  },
  relatedSlugs: [
    'como-emitir-recibo-verde-passo-a-passo',
    'abrir-empresa-individual-eni',
    'declaracao-irs-guia-pratico',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'portaldasfinancas.gov.pt concentra actividade, recibos, IRS, IVA e notificações da AT.',
      'Chave Móvel Digital (CMD) é o método de acesso mais prático no dia a dia.',
      'Nunca partilhe a senha das Finanças — nem com o contador (use procuração ou envio de documentos).',
      'Notificações electrónicas no portal têm prazos legais — consulte regularmente.',
      'e-Fatura é onde emite recibos verdes e consulta histórico para o IRS.',
    ]),
    ...proseParagraphs(
      'O Portal das Finanças é a porta de entrada para quase tudo o que um trabalhador independente faz com a Autoridade Tributária: abrir actividade, emitir recibos, entregar declarações e consultar dívidas.',
      'Este guia percorre as áreas mais usadas — sem substituir o manual oficial da AT. Para emitir o primeiro recibo passo a passo, veja o artigo dedicado no blog.',
    ),
    { type: 'h2', id: 'acesso', text: 'Como entrar no portal' },
    {
      type: 'ul',
      items: [
        'NIF + senha das Finanças (entrega presencial ou pedido online)',
        'Chave Móvel Digital (CMD) — cada vez mais comum e prática',
        'Cartão de Cidadão com leitor, em alguns fluxos',
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Guarde credenciais em local seguro',
      text: 'Use um gestor de palavras-passe. Nunca partilhe a senha das Finanças por email ou WhatsApp — nem com o contador (ele deve pedir procuração ou documentos, não a sua senha).',
    },
    { type: 'h2', id: 'areas', text: 'Áreas que vai usar com frequência' },
    {
      type: 'h3',
      id: 'efatura',
      text: 'e-Fatura e recibos verdes',
    },
    {
      type: 'p',
      text: 'Em «Faturas e recibos» emite documentos de venda, consulta histórico e exporta PDFs. Cada recibo fica associado ao NIF do cliente e alimenta o cruzamento de dados no IRS.',
    },
    { type: 'link', label: 'Passo a passo para emitir recibo verde', slug: 'como-emitir-recibo-verde-passo-a-passo' },
    {
      type: 'h3',
      id: 'irs',
      text: 'IRS — entrega e simulação',
    },
    {
      type: 'p',
      text: 'Na época de IRS, o Modelo 3 é preenchido aqui. Pode simular antes de submeter e ver se há imposto a pagar ou reembolso. Guarde comprovativo de entrega.',
    },
    { type: 'link', label: 'Guia prático de declaração de IRS', slug: 'declaracao-irs-guia-pratico' },
    {
      type: 'h3',
      id: 'iva',
      text: 'IVA e início de actividade',
    },
    {
      type: 'p',
      text: 'Abertura de actividade, alteração de CAE e consulta de regime de IVA fazem-se no portal. Se passar a sujeito passivo, as declarações periódicas de IVA também.',
    },
    { type: 'link', label: 'Quando preciso de me registar em IVA?', slug: 'iva-quando-preciso-de-me-registar' },
    sectionDivider(),
    ...articleSection({
      h2: 'Notificações e situação tributária',
      id: 'notificacoes',
      paragraphs: [
        'A AT comunica coimas, pedidos de esclarecimento e avisos através de notificações electrónicas no portal. Ignorar a caixa de mensagens pode significar perder prazos de contestação.',
        'Na área de situação tributária consulta dívidas, planos de pagamento e estado de processos. Resolva pendências antes da época de IRS para evitar bloqueios.',
      ],
    }),
    ...articleSection({
      h2: 'Primeira semana no portal: checklist',
      id: 'primeira-semana',
      paragraphs: [
        'Se acabou de abrir actividade (ou ainda nunca abriu o portal com calma), faça isto uma vez e anote onde está cada área. Na segunda visita já sabe onde clicar.',
      ],
      blocks: [
        {
          type: 'ol',
          items: [
            'Confirmar que consegue entrar com CMD ou NIF+senha sem partilhar credenciais.',
            'Actualizar IBAN e email de contacto (reembolsos e avisos dependem disto).',
            'Abrir a caixa de notificações e marcar o que já leu.',
            'Localizar e-Fatura / emissão de recibos e guardar um PDF de teste (se já tem actividade).',
            'Anotar o caminho para «início de actividade» / alteração de dados — vai precisar quando mudar CAE ou morada.',
            'Criar pasta no computador «Finanças — acessos» só com links úteis e sem passwords em texto claro.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Phishing «da AT»',
          text: 'Emails a pedir senha, SMS com links estranhos ou páginas que não terminam em gov.pt são fraudelentos. Entre sempre pelo endereço oficial ou pelos favoritos — nunca pelo link do email.',
        },
      ],
    }),
    ...articleSection({
      h2: 'Cidadão e dados pessoais',
      id: 'dados',
      paragraphs: [
        'Actualize morada, contactos e IBAN em «Dados pessoais» / área equivalente. IBAN incorrecto atrasa reembolsos de IRS.',
        'Se mudar de contador, não dê a senha — peça-lhe lista de documentos e use portal do cliente ou email seguro.',
      ],
    }),
    { type: 'h2', id: 'erros', text: 'Erros que custam caro' },
    {
      type: 'ul',
      items: [
        'Emitir recibo com NIF errado do cliente',
        'Não guardar PDF do recibo emitido',
        'Ignorar notificações electrónicas no portal',
        'Entregar IRS sem conferir rendimentos importados automaticamente',
        'Usar descrições vagas («serviços») que dificultam auditoria',
        'Partilhar senha das Finanças com terceiros «só desta vez»',
      ],
    },
    ...articleSection({
      h2: 'Como o portal se liga ao resto da sua vida fiscal',
      id: 'ecossistema',
      paragraphs: [
        'O portal não substitui a Segurança Social, o banco nem o software de facturação — mas é o sítio onde a AT junta a maior parte da história. Quem organiza o arquivo digital e os prazos mensais usa o portal como «fonte da verdade» e o resto como apoio.',
        'Se trabalha com contador, alinhem quem emite recibos, quem entrega IVA/IRS e quem responde a notificações. Dois donos para a mesma caixa de mensagens é receita para prazo perdido.',
      ],
      blocks: [
        {
          type: 'link',
          label: 'Obrigações fiscais mês a mês',
          slug: 'obrigacoes-fiscais-mes-a-mes',
        },
        {
          type: 'link',
          label: 'Organizar documentos fiscais (arquivo digital)',
          slug: 'organizar-documentos-fiscais-arquivo-digital',
        },
      ],
    }),
    ...internalLinksSection({
      title: 'Aprofundar no blog',
      intro: 'Artigos que complementam este guia do portal.',
      slugs: [
        'guia-completo-trabalhador-independente-portugal-2026',
        'irs-recibos-verdes-erros-comuns',
        'prazos-irs-2026-independentes',
        'obrigacoes-fiscais-mes-a-mes',
      ],
    }),
    ...affiliateSection({
      heading: 'Ferramentas que facilitam o dia-a-dia',
      headingId: 'ferramentas',
      intro: 'O portal resolve a relação com a AT; estes extras ajudam a não perder prazos nem documentos.',
      items: [
        {
          key: 'amazonM365Pessoal',
          leadIn: 'OneDrive incluído — útil para guardar PDFs de recibos com backup automático.',
          title: 'Microsoft 365 Pessoal (Amazon)',
          description: '1 TB de armazenamento na nuvem + Office.',
        },
        {
          key: 'amazonBitdefender',
          leadIn: 'O portátil onde acede ao portal deve estar protegido — phishing de «AT» é frequente.',
          title: 'Bitdefender Total Security (Amazon)',
          description: 'Antivírus para PC e telemóvel.',
        },
        {
          key: 'amazonAgendaBezend',
          leadIn: 'Marque no papel (ou digital) os dias de SS, IVA e fecho mensal — o portal não lembra por si.',
          title: 'Agenda semanal A5 (Amazon)',
          description: 'Útil para independentes sem secretária a tempo inteiro.',
        },
        {
          key: 'hotmartReciboVerde7Dias',
          leadIn: 'Se ainda está a montar o hábito de emitir e arquivar, um guia prático em vídeo ajuda a não saltar passos.',
          title: 'Recibo Verde em 7 Dias (Hotmart)',
          description: 'Roteiro curto para quem está a começar.',
        },
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Contador com dezenas de clientes no portal?',
      text: 'O Teglion centraliza pedidos de documentos e validação — menos email perdido, mais tempo para consultoria.',
    }),
    legalCallout(),
  ],
}
