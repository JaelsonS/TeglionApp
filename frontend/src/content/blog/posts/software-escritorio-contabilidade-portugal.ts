import type { BlogPost } from '@/content/blog/types'
import {
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

export const postSoftwareEscritorioPortugal: BlogPost = {
  slug: 'software-escritorio-contabilidade-portugal',
  title: 'Software para escritório de contabilidade em Portugal: o que precisa em 2026',
  excerpt:
    'WhatsApp vs portal do cliente, SAF-T, documentos e prazos — o que um escritório OCC precisa de software em 2026 para operar com controlo e menos caos.',
  publishedAt: '2026-07-20',
  updatedAt: '2026-07-21',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do Teglion · Escreve sobre fiscalidade em Portugal',
  category: 'Escritórios',
  audience: ['escritorio'],
  featured: false,
  tags: [
    'software escritório contabilidade',
    'portal cliente OCC',
    'gestão clientes contabilista',
    'Teglion',
    'escritório digital',
  ],
  readMinutes: 12,
  series: {
    id: 'operacoes-escritorio-teglion',
    title: 'Operações do escritório',
    description: 'Digitalizar, prazos, SAF-T e software — trilho operacional para escritórios de contabilidade.',
    part: 4,
    totalParts: 5,
  },
  coverImage: {
    src: '/blog/covers/escritorio-software.svg',
    alt: 'Software para escritório de contabilidade',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Software para escritório de contabilidade 2026',
    description:
      'Software para escritório de contabilidade em Portugal: portal do cliente OCC, pedidos de documentos, prazos, SAF-T e menos WhatsApp. Ferramentas para 2026.',
    keywords: [
      'software escritório contabilidade Portugal',
      'gestão clientes contabilista',
      'portal cliente OCC',
      'software contabilista 2026',
      'portal documentos escritório',
      'WhatsApp vs portal contabilista',
    ],
  },
  relatedSlugs: [
    'digitalizar-escritorio-contabilidade-portugal',
    'gestao-prazos-fiscais-escritorio-contabilidade',
    'saft-efatura-validacao-documentos-escritorio',
    'ferramentas-essenciais-contabilista-2026',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'O ERP faz a contabilidade; o portal do cliente organiza pedidos e prazos — são camadas diferentes.',
      'WhatsApp sem registo escala mal: 50 clientes × mensagens soltas = prazos em risco e RGPD frágil.',
      'Em 2026, o conjunto mínimo sensato: ERP + arquivos na cloud + portal com pedidos/prazos + backup.',
      'SAF-T e e-Fatura pedem validação de documentos antes do fecho — não «fotos às 23h».',
      'Ferramentas como o Teglion cobrem portal, pedidos e alertas com a marca do escritório — a complementar o ERP.',
    ]),
    ...proseParagraphs(
      'Segunda-feira de manhã: o telemóvel do sócio tem 37 mensagens por ler no WhatsApp Business, três «segue a factura» no email pessoal, e um Drive onde ninguém sabe qual PDF é a versão correcta. O ERP está impecável — o caos está na relação com o cliente.',
      'Este guia é para equipas OCC que já têm (ou vão escolher) ferramentas e querem perceber o que falta para trabalhar em 2026 sem viver de mensagens. Não é uma lista de marcas de facturação: é um mapa de capacidades — portal do cliente, prazos, SAF-T e onde encaixa um portal como o Teglion.',
    ),
    quoteBlock(
      'Software que só o contabilista usa não digitaliza o escritório — digitaliza a secretária. O cliente continua no WhatsApp.',
    ),
    ...articleSection({
      h2: 'Caos do WhatsApp vs operação com portal',
      id: 'whatsapp-vs-ops',
      paragraphs: [
        'WhatsApp serve para urgências pontuais. Como canal oficial de documentos fiscais, falha: não há lista do que falta, não há prova clara de pedido, e misturar conversas pessoais com NIF de clientes é risco RGPD real.',
        'Operar com estrutura significa: pedido formal → prazo → upload → validação → arquivo. O cliente vê o estado; o escritório mede a percentagem de documentos no dia 15. Isso não cabe numa conversa de chat.',
      ],
      blocks: [
        comparisonTable({
          caption: 'Canal de documentos — impacto no dia a dia',
          headers: ['Critério', 'WhatsApp / email solto', 'Portal + pedidos'],
          rows: [
            ['Lista do que falta', 'Memória / Excel paralelo', 'Visível para cliente e equipa'],
            ['Prova de pedido', 'Frágil', 'Histórico com data'],
            ['RGPD / acesso', 'Telemóvel pessoal', 'Contas e permissões'],
            ['Escala (80+ clientes)', 'Quebra no dia 19', 'Ritmo dia 5 → 15 → 19'],
            ['Custo escondido', 'Horas de follow-up', 'Onboarding + hábito'],
          ],
        }),
        {
          type: 'link',
          label: 'Como digitalizar o escritório (roteiro 90 dias)',
          slug: 'digitalizar-escritorio-contabilidade-portugal',
        },
        {
          type: 'link',
          label: 'Caso: escritório recuperou prazos ao sair do WhatsApp',
          slug: 'caso-escritorio-digitalizacao-prazos',
        },
      ],
    }),
    sectionDivider(),
    ...articleSection({
      h2: 'O que o software tem de cobrir em 2026',
      id: 'capacidades',
      paragraphs: [
        'Pense em camadas, não num «programa único que faz tudo». Misturar facturação do cliente, ERP do escritório e portal de pedidos no mesmo produto raramente é o melhor desenho — o importante é que as camadas se falem (ou pelo menos não se contradigam).',
      ],
      blocks: [
        {
          type: 'ol',
          items: [
            'Contabilidade / ERP — lançamentos, mapas, obrigações (o coração técnico)',
            'Facturação do cliente — software certificado AT quando aplicável (lado do contribuinte)',
            'Portal do cliente — pedidos, uploads, mensagens, marca do escritório',
            'Prazos e alertas — calendário por cliente e por obrigação',
            'Validação SAF-T / e-Fatura — cruzamento antes do fecho',
            'Segurança — acessos, backups, política de retenção',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Checklist de compra (15 minutos)',
          text: 'Antes de assinar: (1) quem exporta SAF-T e com que frequência?; (2) o cliente vê o que falta entregar?; (3) há alertas no dia 5/15?; (4) marca branca / portal próprio?; (5) RGPD e localização de dados?; (6) preço por cliente vs por utilizador — projete a 100 e a 200 clientes.',
        },
        {
          type: 'link',
          label: 'Gestão de prazos fiscais no escritório',
          slug: 'gestao-prazos-fiscais-escritorio-contabilidade',
        },
        {
          type: 'link',
          label: 'SAF-T, e-Fatura e validação de documentos',
          slug: 'saft-efatura-validacao-documentos-escritorio',
        },
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Portal do cliente com a marca do escritório',
      text: 'Teglion: pedidos de documentos, prazos, mensagens e histórico — feito para escritórios OCC em Portugal. Teste 14 dias grátis, sem cartão. Complementa o ERP; não o substitui.',
    }),
    ...articleSection({
      h2: 'SAF-T, documentos e prazos — o trio que o software tem de servir',
      id: 'saft-docs-prazos',
      paragraphs: [
        'Sem documentos validados a tempo, o melhor ERP do mundo espera. Sem prazos internos (dia 15/19), o portal enche-se e ninguém fecha. Sem cruzamento com e-Fatura/SAF-T, o fecho de IVA vira caça ao PDF.',
        'Na prática de balcão: um escritório com 60 clientes de IVA mensal que reduz o follow-up de 20 para 8 minutos por cliente no dia 10 recupera dezenas de horas por mês — isso paga software e ainda sobra margem para consultoria.',
      ],
      blocks: [
        {
          type: 'link',
          label: 'Ferramentas essenciais do contabilista em 2026',
          slug: 'ferramentas-essenciais-contabilista-2026',
        },
        {
          type: 'ul',
          items: [
            'Pedido de documentos com prazo visível ao cliente',
            'Upload único (nada de «já enviei no outro chat»)',
            'Estados: pedido → recebido → validado → arquivado',
            'Alertas alinhados com o calendário fiscal português',
            'Export / histórico para auditoria e mudança de colaborador',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Como encaixar Teglion sem trocar o ERP',
      id: 'teglion',
      paragraphs: [
        'Teglion ocupa a camada portal + pedidos + prazos + comunicação. O PHC, Primavera, Sage ou o software que já usa continua a ser o motor contabilístico. A equipa deixa de pedinchar facturas por mensagem; o cliente deixa de perguntar «já receberam?».',
        'Onboarding típico: 5–10 clientes piloto → protocolo interno de 1 página («tudo pelo portal») → rollout. Quem tenta «big bang» na véspera do IRS sofre — quem faseia, fica.',
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Pronto para estruturar as operações?',
      text: 'Crie a conta do escritório no Teglion, personalize o portal e convide os primeiros clientes. Menos caos no telemóvel — mais fechos no dia 19.',
    }),
    ...internalLinksSection({
      title: 'Continuar na trilha do escritório',
      intro: 'Artigos que completam este mapa de software e operações.',
      slugs: [
        'digitalizar-escritorio-contabilidade-portugal',
        'gestao-prazos-fiscais-escritorio-contabilidade',
        'saft-efatura-validacao-documentos-escritorio',
        'ferramentas-essenciais-contabilista-2026',
        'caso-escritorio-digitalizacao-prazos',
      ],
    }),
    legalCallout(
      'Escolha de software depende do tamanho, ERP actual e obrigações dos seus clientes — valide com a equipa técnica e, quando aplicável, com assessoria OCC/RGPD.',
    ),
  ],
}
