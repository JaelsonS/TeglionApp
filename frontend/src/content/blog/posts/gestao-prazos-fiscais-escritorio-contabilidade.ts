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
  updatedAt: '2026-06-18',
  author: 'Equipa TegLion',
  category: 'Escritórios',
  tags: [
    'prazos fiscais',
    'escritório contabilidade',
    'gestão escritório',
    'calendário fiscal',
    'IVA prazo',
    'alertas fiscais',
  ],
  readMinutes: 20,
  featured: true,
  series: {
    id: 'carreira-contabilidade',
    title: 'Carreira em contabilidade',
    description: 'Do estudo à prática profissional — estudantes, estagiários e escritórios.',
    part: 3,
    totalParts: 3,
  },
  coverImage: {
    src: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=1200&h=630&fit=crop&q=80',
    alt: 'Calendário com prazos marcados num escritório',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Gestão prazos fiscais escritório contabilidade | Blog TegLion',
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
    'ferramentas-essenciais-contabilista-2026',
    'obrigacoes-fiscais-mes-a-mes',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Prazo fiscal falhado custa juros, coimas e confiança do cliente — o calendário é produto do escritório, não da memória.',
      'Separe prazos por cliente, obrigação e responsável — uma folha Excel única explode com 80 clientes.',
      'Dia 15: documentos em falta; dia 19: submissão; dia 20: pagamento — ritmo interno antes do prazo legal.',
      'Alertas automáticos + portal de documentos reduzem o «ainda não recebi a factura» na véspera.',
      'Software como TegLion centraliza prazos e pedidos — complementa ERP e calendário de parede.',
    ]),
    ...proseParagraphs(
      'Em Janeiro parece controlável. Em Março, com IRS a aproximar-se e IVA de dezenas de clientes no mesmo dia 20, escritórios sem sistema falham — ou queimam equipas. A gestão de prazos não é glamour — é o que separa o escritório de referência do que «só falha uma vez por ano» (essa vez custa caro).',
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
      ],
    }),
    ...articleSection({
      h2: 'Ritmo interno: dias 5, 15 e 19',
      id: 'ritmo',
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
          title: 'Agenda física + digital',
          text: 'Muitos contadores mantêm agenda de parede com código de cores por tipo de obrigação — funciona em paralelo com software, não em substituição.',
        },
      ],
    }),
    ...articleSection({
      h2: 'Papéis na equipa',
      id: 'equipa',
      paragraphs: [
        'Estagiário: entrada e validação de documentos. Contador: mapas e submissão. Revisor: checklist pré-envio em clientes acima de limiar de risco. Gestor: excepções e relacionamento quando o cliente falha repetidamente.',
        'Um único «herói» que sabe tudo dos 100 clientes é risco de negócio — documente processos.',
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Prazos e documentos no mesmo sítio',
      text: 'TegLion alerta por cliente, regista pedidos de documentos e reduz falhas na véspera do dia 20. Teste grátis 14 dias — feito para escritórios portugueses.',
    }),
    ...articleSection({
      h2: 'Métricas simples para o sócio',
      id: 'metricas',
      paragraphs: [
        '% clientes com documentos completos no dia 15; número de submissões no dia 20 vs dia 19; incidentes de prazo falhado por trimestre. Três números — foco de melhoria contínua.',
      ],
    }),
    ...affiliateSection({
      heading: 'Ferramentas que suportam o calendário',
      headingId: 'ferramentas-prazos',
      intro: 'Complementos físicos e digitais ao software de gestão de prazos.',
      items: [
        {
          key: 'amazonAgendaBezend',
          leadIn:
            'Visão semanal na secretária — útil em reunião de equipa à segunda-feira para a semana de prazos.',
          title: 'Agenda semanal BEZEND A5 (Amazon)',
          description: 'Planeamento visual complementar.',
        },
        {
          key: 'amazonEtiquetasPastas',
          leadIn:
            'Pastas físicas de clientes com prazo crítico na semana — «IVA T2 — ENTREGAR 19» na lombada.',
          title: 'Etiquetas para pastas (Amazon)',
          description: 'Identificação rápida de urgências.',
        },
        {
          key: 'amazonM365Pessoal',
          leadIn:
            'Calendário Outlook partilhado com lembretes — base antes de software especializado.',
          title: 'Microsoft 365 Pessoal (Amazon)',
          description: 'Outlook + calendário cloud.',
        },
        {
          key: 'amazonCasio991',
          leadIn:
            'Validar totais de IVA antes de submeter — última verificação na calculadora de confiança.',
          title: 'Casio fx-991ES Plus (Amazon)',
          description: 'Verificação rápida de totais.',
        },
        {
          key: 'amazonLivroGestaoContabil',
          leadIn:
            'Formar estagiários na lógica de obrigações — menos erros de prazo por desconhecimento.',
          title: 'Gestão Contábil (Amazon)',
          description: 'Formação de base em português.',
        },
      ],
    }),
    ...internalLinksSection({
      title: 'Trilha escritório de contabilidade',
      slugs: [
        'digitalizar-escritorio-contabilidade-portugal',
        'ferramentas-essenciais-contabilista-2026',
        'obrigacoes-fiscais-mes-a-mes',
        'organizar-documentos-fiscais-arquivo-digital',
        'estudar-contabilidade-portugal-guia-estudantes',
      ],
    }),
    legalCallout('Prazos legais são publicados pela AT e SS — confirme sempre fontes oficiais antes de submeter.'),
  ],
}
