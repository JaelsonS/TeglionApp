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

export const postDigitalizarEscritorio: BlogPost = {
  slug: 'digitalizar-escritorio-contabilidade-portugal',
  title: 'Como digitalizar um escritório de contabilidade em Portugal (sem perder clientes)',
  excerpt:
    'Portal do cliente, pedidos de documentos, arquivo digital, RGPD e comunicação profissional — roteiro para PME contabilísticas que ainda vivem no email e no WhatsApp.',
  publishedAt: '2026-06-18',
  updatedAt: '2026-06-18',
  author: 'Equipa TegLion',
  category: 'Escritórios',
  tags: [
    'digitalizar escritório',
    'escritório contabilidade',
    'portal cliente',
    'contabilidade digital',
    'RGPD contabilista',
    'TegLion',
  ],
  readMinutes: 22,
  featured: true,
  coverImage: {
    src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=630&fit=crop&q=80',
    alt: 'Escritório moderno com portáteis e reunião',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Digitalizar escritório de contabilidade Portugal | Blog TegLion',
    description:
      'Guia para digitalizar escritório de contabilidade: portal do cliente, arquivo, prazos e RGPD. Menos email, mais controlo — roteiro prático para Portugal.',
    keywords: [
      'digitalizar escritório contabilidade',
      'portal cliente contabilista',
      'software escritório contabilidade Portugal',
      'contabilidade digital PME',
    ],
  },
  relatedSlugs: [
    'ferramentas-essenciais-contabilista-2026',
    'gestao-prazos-fiscais-escritorio-contabilidade',
    'organizar-documentos-fiscais-arquivo-digital',
    'como-escolher-contabilista-portugal',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Digitalizar não é só «PDF em vez de papel» — é processo: pedir, receber, validar, arquivar, comunicar.',
      'Clientes resistem menos quando veem benefício: menos emails, lista clara do que falta, histórico acessível.',
      'WhatsApp sem registo é risco RGPD e profissional — canal oficial com arquivo protege o escritório.',
      'Migração em fases: 5 clientes piloto → ajustar → rollout — não «big bang» na véspera do IRS.',
      'Portal do cliente (TegLion) complementa o ERP — resolve a última milha com o contribuinte.',
    ]),
    ...proseParagraphs(
      'Muitos escritórios de contabilidade em Portugal já usam ERP robusto — e ainda passam o dia a pedir «aquela factura de Junho» por mensagem. A digitalização que falta não é contabilística; é relacional: como o cliente entrega, como o escritório confirma e como ambos provam que cumpriram.',
      'Este guia é para sócios, directores técnicos e contadores que querem modernizar sem perder a confiança de clientes habituados ao telefone. Também serve a empresas que procuram escritório — saber o que pedir num parceiro digitalmente maduro.',
    ),
    quoteBlock(
      'O cliente não quer «mais uma app» — quer saber em 10 segundos o que falta entregar e ter a certeza de que o escritório recebeu.',
    ),
    ...articleSection({
      h2: 'Diagnóstico: onde está o escritório hoje?',
      id: 'diagnostico',
      paragraphs: [
        'Responda honestamente: quantos pedidos de documentos por semana são por email? Quantos clientes enviam fotos de facturas por WhatsApp? Quanto tempo se perde a «não encontrei o anexo»?',
      ],
      blocks: [
        comparisonTable({
          caption: 'Níveis de maturidade digital (escritório)',
          headers: ['Nível', 'Características', 'Próximo passo'],
          rows: [
            ['1 — Papel', 'Pastas físicas, fax, pouco email', 'Digitalizar entrada + pastas cloud'],
            ['2 — Email', 'PDFs anexos, caixa partilhada caótica', 'Portal de upload por cliente'],
            ['3 — Portal', 'Pedidos formais, estados, mensagens', 'Alertas de prazo integrados'],
            ['4 — Integrado', 'ERP + portal + métricas', 'Automatizar lembretes e relatórios'],
          ],
        }),
      ],
    }),
    sectionDivider(),
    ...articleSection({
      h2: 'Roteiro em 6 passos (90 dias)',
      id: 'roteiro',
      blocks: [
        {
          type: 'ol',
          items: [
            'Mapear fluxos: entrada de documentos, validação, arquivo, resposta ao cliente',
            'Escolher portal do cliente (critérios: marca, RGPD, lista de pedidos, mensagens)',
            'Seleccionar 5–10 clientes piloto — perfis variados (freelancer, Lda., IVA mensal)',
            'Formar equipa interna: um protocolo único («tudo pelo portal, exceto urgências X»)',
            'Comunicar benefícios ao cliente: vídeo curto ou email com capturas de ecrã',
            'Medir: tempo médio de fecho de pedido, documentos em falta no dia 15 vs dia 19',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'RGPD e imagem profissional',
      id: 'rgpd',
      paragraphs: [
        'Trata NIF, moradas, salários, contratos. Email encaminhado para estagiário errado, grupo WhatsApp com nome de cliente visível, ou portátil sem encriptação — são cenários de incidente real.',
        'Portal com autenticação, registo de quem acedeu a quê, e política de retenção clara protege o escritório e tranquiliza clientes corporativos na due diligence.',
      ],
    }),
    ...articleSection({
      h2: 'O que NÃO digitalizar à pressa',
      id: 'cuidados',
      paragraphs: [
        'Não peça ao cliente a senha do Portal das Finanças — use procurações formais. Não prometa «zero papel» se ainda não tem digitalização de entrada fiável. Não lance portal sem suporte telefónico na primeira semana para clientes menos digitais.',
      ],
      blocks: [
        {
          type: 'callout',
          variant: 'info',
          title: 'Para o cliente final',
          text: 'Se o seu contabilista oferece portal, use-o — poupa-lhe emails e prova que entregou a tempo. Se ainda não tem, envie-lhe este artigo ou o nosso guia «Como escolher contabilista».',
        },
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Portal com a marca do seu escritório',
      text: 'TegLion: pedidos de documentos, prazos fiscais, mensagens e portal do cliente — teste 14 dias grátis, sem cartão. Feito para escritórios de contabilidade em Portugal.',
    }),
    ...articleSection({
      h2: 'Stack típico do escritório digital',
      id: 'stack',
      paragraphs: [
        'ERP contabilístico + Microsoft 365 + portal cliente + antivírus + backup. O TegLion ocupa a camada cliente — não compete com PHC ou Primavera, reduz o ruído entre o contador e quem deve enviar a factura.',
      ],
    }),
    teglionCtaBlock({
      variant: 'client',
      title: 'É cliente de um escritório?',
      text: 'Peça ao seu contador um portal seguro para enviar documentos — menos «viu o meu email?» e mais histórico organizado.',
    }),
    ...affiliateSection({
      heading: 'Infraestrutura que acompanha a digitalização',
      headingId: 'infra',
      intro: 'Hardware e software de base para um escritório que deixa de depender só do email.',
      items: [
        {
          key: 'amazonM365Familia',
          leadIn:
            'Colaboradores, estagiários e sócios com email profissional, Teams e OneDrive — base antes do portal.',
          title: 'Microsoft 365 Família — 12 meses (Amazon)',
          description: 'Produtividade e armazenamento cloud.',
        },
        {
          key: 'amazonBitdefender',
          leadIn:
            'Todos os portáteis do escritório — especialmente quem acede a dados de clientes em casa.',
          title: 'Bitdefender Total Security (Amazon)',
          description: 'Protecção multi-dispositivo.',
        },
        {
          key: 'amazonPenDrive32',
          leadIn:
            'Transferência pontual de SAF-T ou backup offline quando o cliente não usa portal — com encriptação e política clara.',
          title: 'Pack pen drives USB 32GB (Amazon)',
          description: 'Backup e transferência controlada.',
        },
        {
          key: 'amazonSuporteLaptop',
          leadIn:
            'Equipa em teletrabalho com horas de ecrã — ergonomia reduz faltas e erros por cansaço.',
          title: 'Suporte ergonómico Amazon Basics (Amazon)',
          description: 'Postura no portátil.',
        },
        {
          key: 'amazonPastaSanfona12',
          leadIn:
            'Transição: papel que ainda entra até estar 100 % digitalizado na entrada.',
          title: 'Pasta sanfonada ThinkTex 12 bolsos (Amazon)',
          description: 'Triagem de documentos em papel.',
        },
      ],
    }),
    ...internalLinksSection({
      title: 'Ler a seguir',
      slugs: [
        'gestao-prazos-fiscais-escritorio-contabilidade',
        'ferramentas-essenciais-contabilista-2026',
        'organizar-documentos-fiscais-arquivo-digital',
        'proteger-dados-fiscais-freelancer-portugal',
        'calendario-fiscal-portugal-2026-completo',
      ],
    }),
    legalCallout('Implementação depende do tamanho e regulamentação do seu escritório — consulte OCC e assessoria jurídica para RGPD.'),
  ],
}
