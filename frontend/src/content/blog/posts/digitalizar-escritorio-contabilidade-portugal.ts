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
  updatedAt: '2026-07-20',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do TegLion · Dev de software · Contabilidade (BR) → fiscalidade PT',
  category: 'Escritórios',
  audience: ['escritorio'],
  tags: [
    'digitalizar escritório',
    'escritório contabilidade',
    'portal cliente',
    'contabilidade digital',
    'RGPD contabilista',
    'TegLion',
  ],
  readMinutes: 16,
  featured: true,
  series: {
    id: 'operacoes-escritorio-teglion',
    title: 'Operações do escritório com TegLion',
    description: 'Digitalizar, prazos, SAF-T e software — trilho operacional para escritórios de contabilidade.',
    part: 1,
    totalParts: 5,
  },
  coverImage: {
    src: '/blog/covers/escritorio.svg',
    alt: 'Digitalizar escritório de contabilidade',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Digitalizar escritório de contabilidade em Portugal',
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
    'software-escritorio-contabilidade-portugal',
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
      'Recebeu um email do cliente às 23h com «segue a factura» em anexo — e no dia seguinte a mesma pessoa diz que já tinha enviado no WhatsApp a semana passada. Se isto soa familiar, a digitalização do escritório não é um luxo de TI: é o único caminho para recuperar o calendário fiscal sem perder clientes.',
      'No balcão, o custo escondido é tempo: 15 minutos a caçar um PDF × 40 clientes × 12 meses = centenas de horas. A 25–40 €/hora de custo interno da equipa, o «WhatsApp gratuito» sai caro. Digitalizar é recuperar margem e nervos.',
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
        {
          type: 'link',
          label: 'Caso real: escritório saiu do WhatsApp e recuperou prazos',
          slug: 'caso-escritorio-digitalizacao-prazos',
        },
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
    ...articleSection({
      h2: 'RGPD e imagem profissional',
      id: 'rgpd',
      paragraphs: [
        'Trata NIF, moradas, salários, contratos. Email encaminhado para estagiário errado, grupo WhatsApp com nome de cliente visível, ou portátil sem encriptação — são cenários de incidente real.',
        'Portal com autenticação, registo de quem acedeu a quê, e política de retenção clara protege o escritório e tranquiliza clientes corporativos na due diligence.',
      ],
      blocks: [
        {
          type: 'link',
          label: 'Proteger dados fiscais (visão freelancer / cliente)',
          slug: 'proteger-dados-fiscais-freelancer-portugal',
        },
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
        {
          type: 'link',
          label: 'Ferramentas essenciais do contabilista em 2026',
          slug: 'ferramentas-essenciais-contabilista-2026',
        },
        {
          type: 'link',
          label: 'Software para escritório de contabilidade em Portugal',
          slug: 'software-escritorio-contabilidade-portugal',
        },
        {
          type: 'ol',
          items: [
            'Inventariar canais actuais (email, WhatsApp, Drive partilhado)',
            'Definir canal oficial único a partir de data X',
            'Escolher 5 clientes piloto e medir tempo de fecho',
            'Formar equipa 1 hora — protocolo escrito de 1 página',
            'Comunicar aos restantes clientes com vídeo/email curto',
          ],
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
        'Orçamento orientativo para um escritório pequeno (3–8 pessoas): cloud/Office 10–20 €/utilizador/mês, portal do cliente conforme plano, e 1–2 dias de onboarding interno. O retorno aparece quando deixa de haver «fogo» no dia 19.',
      ],
    }),
    teglionCtaBlock({
      variant: 'client',
      title: 'É cliente de um escritório?',
      text: 'Peça ao seu contador um portal seguro para enviar documentos — menos «viu o meu email?» e mais histórico organizado.',
    }),
    ...affiliateSection({
      heading: 'A base técnica antes do portal do cliente',
      headingId: 'infra',
      intro:
        'Digitalizar o escritório não começa pelo software de contabilidade — começa por email profissional, ficheiros na nuvem e portáteis protegidos. Sem essa base, o portal do cliente vira mais um sítio onde os PDFs se perdem. Dois investimentos cobrem o essencial para uma equipa pequena em Portugal.',
      items: [
        {
          key: 'amazonM365Familia',
          leadIn:
            'Sócios, colaboradores e estagiários a partilhar Outlook, Teams e OneDrive deixam de depender de «manda outra vez o email». Antes de pedir ao cliente que use o portal, a equipa precisa de um sítio comum onde os documentos já entram e ficam versionados.',
          title: 'Microsoft 365 Família — 12 meses (Amazon)',
          description: 'até 6 pessoas com apps Office e armazenamento cloud — escala natural para escritórios pequenos.',
        },
        {
          key: 'amazonBitdefender',
          leadIn:
            'Quem acede a dados fiscais de dezenas de clientes em casa ou no café precisa de mais do que «o antivírus que veio com o Windows». Um pacote multi-dispositivo fecha a lacuna de segurança que o RGPD e a confiança do cliente exigem.',
          title: 'Bitdefender Total Security (Amazon)',
          description: 'protecção em vários portáteis e telemóveis do escritório e do teletrabalho.',
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
