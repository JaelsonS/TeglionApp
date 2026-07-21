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

export const postFerramentasContabilista: BlogPost = {
  slug: 'ferramentas-essenciais-contabilista-2026',
  title: 'Ferramentas essenciais para o contabilista em 2026: calculadora, arquivo e software',
  excerpt:
    'O kit de trabalho do contabilista certificado: calculadora, Excel/365, segurança, arquivo e software de gestão de clientes — com comparação entre email/WhatsApp e portal moderno.',
  publishedAt: '2026-06-18',
  updatedAt: '2026-07-20',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do Teglion · Escreve sobre fiscalidade em Portugal',
  category: 'Escritórios',
  audience: ['escritorio'],
  tags: [
    'ferramentas contabilista',
    'OCC',
    'calculadora Casio',
    'escritório contabilidade',
    'software contabilidade',
    'Microsoft 365',
  ],
  readMinutes: 12,
  featured: false,
  series: {
    id: 'carreira-contabilidade',
    title: 'Carreira em contabilidade',
    description: 'Do estudo à prática profissional — estudantes, estagiários e escritórios.',
    part: 2,
    totalParts: 3,
  },
  coverImage: {
    src: '/blog/covers/software.svg',
    alt: 'Ferramentas essenciais do contabilista',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Ferramentas essenciais contabilista 2026 | Blog Teglion',
    description:
      'Calculadora, Microsoft 365, arquivo, antivírus e software de gestão para contabilistas certificados e escritórios em Portugal. Guia prático com recomendações.',
    keywords: [
      'ferramentas contabilista',
      'software escritório contabilidade',
      'calculadora contador',
      'Microsoft 365 contabilidade',
      'gestão clientes contabilista',
    ],
  },
  relatedSlugs: [
    'digitalizar-escritorio-contabilidade-portugal',
    'gestao-prazos-fiscais-escritorio-contabilidade',
    'estudar-contabilidade-portugal-guia-estudantes',
    'organizar-documentos-fiscais-arquivo-digital',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Calculadora científica de confiança (Casio fx-991 ou equivalente) continua obrigatória na mesa — mesmo com Excel aberto.',
      'Microsoft 365 com OneDrive é o padrão de facto para mapas, SAF-T e partilha segura com clientes.',
      'Antivírus e backup não são luxo — lidam com NIF, senhas e documentos sensíveis todos os dias.',
      'Email + WhatsApp sem registo é risco profissional e de RGPD — portal estruturado reduz disputas.',
      'Software de gestão de escritório (Teglion) centraliza prazos, documentos e comunicação com clientes.',
    ]),
    ...proseParagraphs(
      'Um contabilista certificado em 2026 usa mais tecnologia do que há dez anos — mas ainda perde horas a perseguir PDFs por email. Este artigo lista o que realmente importa na secretária: do objecto físico ao portal onde o cliente envia facturas.',
      'Escrito para contabilistas em exercício, sócios de escritórios e estagiários OCC que querem montar o posto de trabalho certo desde o início. Estudantes encontram aqui um mapa do que a profissão usa no dia a dia.',
    ),
    quoteBlock(
      'O melhor software do mundo não substitui o julgamento profissional — mas o pior fluxo de trabalho pode roubar-lhe o tempo para exercer esse julgamento.',
    ),
    ...articleSection({
      h2: 'Camada 1: a mesa física',
      id: 'mesa',
      paragraphs: [
        'Calculadora, caneta fiável, pastas etiquetadas e destruição segura de papel. Parece básico — até ao dia em que precisa de refazer um cálculo de retenção em 30 segundos numa chamada com o cliente.',
        'Pastas sanfonadas por cliente ou por obrigação (IVA T1, IRS 2025, SS) funcionam em paralelo com o arquivo digital. Etiquetas consistentes poupam horas em Março.',
      ],
      blocks: [
        comparisonTable({
          caption: 'Ferramentas físicas — prioridade',
          headers: ['Ferramenta', 'Prioridade', 'Uso típico'],
          rows: [
            ['Calculadora científica', 'Alta', 'Verificações rápidas, exames, reuniões'],
            ['Pastas A4 etiquetadas', 'Alta', 'Entrada de documentos em papel'],
            ['Agenda / calendário', 'Alta', 'Prazos por cliente'],
            ['Triturador de papel', 'Média', 'Destruição segura de cópias'],
            ['Suporte ergonómico portátil', 'Média', 'Teletrabalho prolongado'],
          ],
        }),
      ],
    }),
    sectionDivider(),
    ...articleSection({
      h2: 'Camada 2: produtividade digital',
      id: 'digital',
      paragraphs: [
        'Excel continua rei para mapas ad hoc; Word para cartas e relatórios; OneDrive ou SharePoint para versões e backup. Muitos escritórios partilham M365 Família ou Business — o importante é 2FA activo e pastas por cliente com permissões.',
        'Evite enviar SAF-T ou mapas com dados pessoais por email sem encriptação. Links de partilha com expiração ou portal com upload autenticado são o padrão que clientes corporativos esperam.',
      ],
    }),
    ...articleSection({
      h2: 'Camada 3: segurança e conformidade',
      id: 'seguranca',
      paragraphs: [
        'Phishing «da AT» atinge contabilistas com frequência — têm acesso a dados de dezenas de empresas. Antivírus actualizado, passwords únicas (gestor de passwords) e VPN em redes públicas são higiene mínima.',
        'RGPD: saiba que dados guarda, por quanto tempo, e como o cliente pode exercer direitos. Triturar papel com NIF e contratos não é paranóia — é boa prática.',
      ],
    }),
    ...articleSection({
      h2: 'Camada 4: gestão de clientes e prazos',
      id: 'gestao',
      paragraphs: [
        'ERP contabilístico (PHC, Primavera, etc.) trata da contabilidade formal. Mas entre o ERP e o cliente há um vazio: pedir documentos, lembrar prazos, responder mensagens, partilhar comprovativos.',
        'É aqui que um portal de escritório como o Teglion encaixa — não substitui o ERP, complementa a relação com o cliente: pedidos formais, estado de entregas, mensagens registadas, marca do escritório.',
      ],
      blocks: [
        comparisonTable({
          caption: 'Email/WhatsApp vs portal do cliente',
          headers: ['Aspecto', 'Email / WhatsApp', 'Portal (ex.: Teglion)'],
          rows: [
            ['Registo de pedidos', 'Caixa dispersa', 'Lista por cliente com estado'],
            ['Prova de entrega', 'Difícil', 'Upload com data e utilizador'],
            ['Prazos', 'Calendário pessoal', 'Alertas por empresa'],
            ['RGPD / arquivo', 'Risco elevado', 'Canal dedicado e controlado'],
            ['Imagem profissional', 'Informal', 'Marca do escritório'],
          ],
        }),
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Menos «já enviei por email» — mais controlo',
      text: 'Teste o Teglion 14 dias grátis: portal do cliente, pedidos de documentos, prazos e mensagens. Pensado para escritórios de contabilidade em Portugal.',
    }),
    ...affiliateSection({
      heading: 'Duas peças que o escritório usa todos os dias',
      headingId: 'equipamento',
      intro:
        'A lista de «ferramentas do contabilista» pode crescer sem fim. Na prática, o que separa um dia fluido de um dia a caçar ficheiros é o básico bem escolhido: uma calculadora de confiança na mesa e uma subscrição Office partilhada pela equipa. O resto — pastas, antivírus, agendas — só vale depois desta fundação.',
      items: [
        {
          key: 'amazonCasio991',
          leadIn:
            'Em reunião com o cliente, quando o Excel ainda não está aberto e alguém pergunta «quanto fica o IVA neste total?», a Casio na mão resolve em segundos. É também a última verificação antes de submeter um mapa — o hábito que evita erros caros.',
          title: 'Casio fx-991ES Plus 2ª Edição (Amazon)',
          description: 'padrão profissional e académico; a mesma máquina do estágio ao balcão.',
        },
        {
          key: 'amazonM365Familia',
          leadIn:
            'Escritórios com três a seis pessoas ganham mais a partilhar Excel, Outlook e OneDrive do que a comprar «mais um software» sem disciplina de ficheiros. Um terabyte por utilizador e calendário partilhado são a espinha dorsal antes do ERP e do portal do cliente.',
          title: 'Microsoft 365 Família — 12 meses (Amazon)',
          description: 'até 6 pessoas — a escala natural de um escritório pequeno em Portugal.',
        },
      ],
    }),
    { type: 'link', label: 'Digitalizar o escritório de contabilidade', slug: 'digitalizar-escritorio-contabilidade-portugal' },
    { type: 'link', label: 'Software para escritório de contabilidade', slug: 'software-escritorio-contabilidade-portugal' },
    ...internalLinksSection({
      title: 'Para escritórios que querem ir mais longe',
      slugs: [
        'digitalizar-escritorio-contabilidade-portugal',
        'gestao-prazos-fiscais-escritorio-contabilidade',
        'organizar-documentos-fiscais-arquivo-digital',
        'calendario-fiscal-portugal-2026-completo',
      ],
    }),
    legalCallout('Recomendações de produto são informativas — avalie necessidades do seu escritório e política de TI.'),
  ],
}
