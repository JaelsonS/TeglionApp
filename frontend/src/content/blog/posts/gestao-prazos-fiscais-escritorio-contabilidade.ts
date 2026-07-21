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

export const postGestaoPrazosEscritorio: BlogPost = {
  slug: 'gestao-prazos-fiscais-escritorio-contabilidade',
  title: 'Gestão de prazos fiscais no escritório de contabilidade: método que evita falhas',
  excerpt:
    'Calendário por cliente, alertas, responsáveis, checklist do dia 15 e do dia 19 — como escritórios organizados cumprem SS, IVA e IRS sem depender da memória de uma pessoa.',
  publishedAt: '2026-06-18',
  updatedAt: '2026-07-20',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do Teglion · Escreve sobre fiscalidade em Portugal',
  category: 'Escritórios',
  audience: ['escritorio'],
  tags: [
    'prazos fiscais',
    'escritório contabilidade',
    'gestão escritório',
    'calendário fiscal',
    'IVA prazo',
    'alertas fiscais',
  ],
  readMinutes: 14,
  featured: false,
  series: {
    id: 'operacoes-escritorio-teglion',
    title: 'Operações do escritório',
    description: 'Digitalizar, prazos, SAF-T e software — trilho operacional para escritórios de contabilidade.',
    part: 2,
    totalParts: 5,
  },
  coverImage: {
    src: '/blog/covers/escritorio-prazos.svg',
    alt: 'Gestão de prazos fiscais no escritório',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Gestão de prazos fiscais no escritório OCC',
    description:
      'Como gerir prazos fiscais num escritório de contabilidade: calendário por cliente, alertas, checklists e software. Evite falhas em IVA, SS e IRS.',
    keywords: [
      'prazos fiscais escritório',
      'gestão escritório contabilidade',
      'calendário fiscal contabilista',
      'alertas IVA IRS',
      'software prazos fiscais',
    ],
  },
  relatedSlugs: [
    'calendario-fiscal-portugal-2026-completo',
    'digitalizar-escritorio-contabilidade-portugal',
    'software-escritorio-contabilidade-portugal',
    'saft-efatura-validacao-documentos-escritorio',
    'ferramentas-essenciais-contabilista-2026',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Prazo fiscal falhado custa juros, coimas e confiança do cliente — o calendário é produto do escritório, não da memória.',
      'Separe prazos por cliente, obrigação e responsável — uma folha Excel única explode com 80 clientes.',
      'Dia 15: documentos em falta; dia 19: submissão; dia 20: pagamento — ritmo interno antes do prazo legal.',
      'Alertas automáticos + portal de documentos reduzem o «ainda não recebi a factura» na véspera.',
      'Software como Teglion centraliza prazos e pedidos — complementa ERP e calendário de parede.',
    ]),
    ...proseParagraphs(
      'É dia 19 às 18h: três clientes ainda não enviaram compras, o IVA de um quarto está «quase» e o estagiário pergunta quem é responsável pelo fecho da Lda. X. Em Janeiro parece controlável. Em Março, com IRS a aproximar-se e IVA de dezenas de clientes no mesmo dia 20, escritórios sem sistema falham — ou queimam equipas.',
      'Uma coima de algumas centenas de euros (ou juros de mora) dói; perder um cliente de 120 €/mês dói mais. A gestão de prazos não é glamour — é o que separa o escritório de referência do que «só falha uma vez por ano».',
      'Este artigo é para gestores de escritório, contadores sénior e estagiários que querem entender como opera um sistema de prazos maduro. Freelancers com um cliente (si próprios) também beneficiam de adaptar a lógica à escala de um.',
    ),
    quoteBlock(
      'Cliente perdoa atraso de resposta a email; perdoa mal imposto entregue fora de prazo muito menos.',
    ),
    ...articleSection({
      h2: 'Anatomia de uma falha de prazo',
      id: 'anatomia',
      paragraphs: [
        'Quase sempre é cadeia: documento não chegou → mapa não fechou → revisão não houve → submissão às 23h58 → portal lento → falha. O ponto de ruptura costuma ser documento em falta no dia 12, não incompetência técnica no dia 20.',
      ],
      blocks: [
        comparisonTable({
          caption: 'Causa raiz vs solução estrutural',
          headers: ['Sintoma', 'Causa provável', 'Solução'],
          rows: [
            ['IVA sem compras', 'Cliente enviou tarde', 'Pedido automático dia 5'],
            ['SS não paga', 'Cliente ignorou', 'Débito directo + alerta escritório'],
            ['IRS incompleto', 'PDFs dispersos', 'Portal com lista de falhas'],
            ['Dois clientes, um prazo', 'Sem priorização', 'Calendário por responsável'],
            ['Erro de submissão', 'Sem revisão a quatro olhos', 'Checklist pré-envio'],
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
      h2: 'Calendário mestre do escritório',
      id: 'calendario-mestre',
      paragraphs: [
        'Camadas: (1) calendário nacional — feriados, alterações AT; (2) calendário por regime — mensal vs trimestral IVA; (3) calendário por cliente — excepções, acordos de pagamento.',
        'Sincronize com o artigo «Calendário fiscal 2026» do blog como base — depois personalize no software ou agenda.',
      ],
      blocks: [
    { type: 'link', label: 'Calendário fiscal Portugal 2026 completo', slug: 'calendario-fiscal-portugal-2026-completo' },
        {
          type: 'link',
          label: 'Software para escritório de contabilidade em Portugal',
          slug: 'software-escritorio-contabilidade-portugal',
        },
      ],
    }),
    ...articleSection({
      h2: 'Ritmo interno: dias 5, 15 e 19',
      id: 'ritmo',
      paragraphs: [
        'O prazo legal é o dia 20 — o prazo interno tem de ser anterior. Escritórios que trabalham «contra o relógio do cliente» vivem em modo bombeiro; quem define ritmo próprio recupera margem (e horas de sono).',
      ],
      blocks: [
        {
          type: 'ul',
          items: [
            'Dia 5: pedido automático de documentos do período (via portal ou email template)',
            'Dia 10: primeiro follow-up formal a clientes em falta',
            'Dia 15: fecho de mapas — sem documentos novos excepto urgência aprovada',
            'Dia 17–18: revisão por segundo colaborador em clientes de risco',
            'Dia 19: submissões — margem antes do dia 20 legal',
            'Dia 20: pagamentos SS/IVA e confirmação de comprovativos arquivados',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Checklist do dia 15 (imprimir / partilhar na equipa)',
          text: 'Para cada cliente do período: documentos completos? Totais batem com extracto/SAF-T? Pedidos em aberto registados? Responsável de submissão definido? Se algum «não» — escalar agora, não no dia 19 às 18h.',
        },
        {
          type: 'link',
          label: 'SAF-T, e-Fatura e validação de documentos',
          slug: 'saft-efatura-validacao-documentos-escritorio',
        },
      ],
    }),
    ...articleSection({
      h2: 'Papéis na equipa',
      id: 'equipa',
      paragraphs: [
        'Estagiário: entrada e validação de documentos. Contador: mapas e submissão. Revisor: checklist pré-envio em clientes acima de limiar de risco. Gestor: excepções e relacionamento quando o cliente falha repetidamente.',
        'Um único «herói» que sabe tudo dos 100 clientes é risco de negócio — documente processos. Se esse herói sai, o calendário não pode sair com ele.',
      ],
      blocks: [
        {
          type: 'link',
          label: 'Como digitalizar o escritório de contabilidade',
          slug: 'digitalizar-escritorio-contabilidade-portugal',
        },
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Prazos e documentos no mesmo sítio',
      text: 'Teglion alerta por cliente, regista pedidos de documentos e reduz falhas na véspera do dia 20. Teste grátis 14 dias — feito para escritórios portugueses.',
    }),
    ...articleSection({
      h2: 'Métricas simples para o sócio',
      id: 'metricas',
      paragraphs: [
        '% clientes com documentos completos no dia 15; número de submissões no dia 20 vs dia 19; incidentes de prazo falhado por trimestre. Três números — foco de melhoria contínua.',
        'Se mais de 20 % das submissões caem no dia 20, o sistema de pedidos está atrasado — não «a equipa é lenta». Corrija o dia 5 e o portal antes de contratar mais horas.',
      ],
      blocks: [
        {
          type: 'link',
          label: 'Ferramentas essenciais do contabilista em 2026',
          slug: 'ferramentas-essenciais-contabilista-2026',
        },
      ],
    }),
    ...affiliateSection({
      heading: 'O que o calendário precisa além do software',
      headingId: 'ferramentas-prazos',
      intro:
        'Um CRM de prazos só funciona se a equipa o consultar — e se a semana crítica estiver visível quando o ecrã está cheio de mapas. Escritórios que falham menos prazos costumam combinar um calendário partilhado com um ritual físico à segunda-feira: olhar a semana, marcar urgências, fechar o que ficou em aberto.',
      items: [
        {
          key: 'amazonAgendaBezend',
          leadIn:
            'Na reunião de segunda, quando cada colaborador traz a lista de IVA e SS da semana, uma agenda A5 aberta na mesa evita que o prazo «desapareça» entre notificações. Marque o dia 20 a lápis — e o dia 18 como buffer interno.',
          title: 'Agenda semanal BEZEND A5 (Amazon)',
          description: 'visão semanal clara para alinhar a equipa sem abrir mais um ecrã.',
        },
        {
          key: 'amazonM365Pessoal',
          leadIn:
            'Antes de investir em software especializado, muitos escritórios pequenos partilham um calendário Outlook com lembretes por obrigação e por cliente. É a base: quem não tem calendário cloud raramente consegue escalar alertas.',
          title: 'Microsoft 365 Pessoal (Amazon)',
          description: 'Outlook + calendário na nuvem para quem gere prazos no dia a dia.',
        },
      ],
    }),
    ...internalLinksSection({
      title: 'Trilha escritório de contabilidade',
      slugs: [
        'digitalizar-escritorio-contabilidade-portugal',
        'software-escritorio-contabilidade-portugal',
        'ferramentas-essenciais-contabilista-2026',
        'obrigacoes-fiscais-mes-a-mes',
        'organizar-documentos-fiscais-arquivo-digital',
      ],
    }),
    legalCallout('Prazos legais são publicados pela AT e SS — confirme sempre fontes oficiais antes de submeter.'),
  ],
}
