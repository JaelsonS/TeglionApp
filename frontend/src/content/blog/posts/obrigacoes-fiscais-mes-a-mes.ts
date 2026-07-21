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

export const postObrigacoesMes: BlogPost = {
  slug: 'obrigacoes-fiscais-mes-a-mes',
  title: 'Obrigações fiscais mês a mês para pequenos negócios',
  excerpt:
    'Calendário simplificado: o que normalmente acontece cada mês quando tem actividade aberta — facturas, IVA, SS e retenções.',
  publishedAt: '2026-05-16',
  updatedAt: '2026-06-17',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do TegLion · Dev de software · Contabilidade (BR) → fiscalidade PT',
  category: 'Obrigações',
  audience: ['independente', 'escritorio', 'pme'],
  featured: false,
  tags: ['obrigações', 'IVA', 'Segurança Social', 'calendário fiscal', 'PME'],
  readMinutes: 8,
  coverImage: {
    src: '/blog/covers/fiscal-calendar.svg',
    alt: 'Obrigações fiscais mês a mês',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Obrigações fiscais mensais em Portugal — checklist',
    description:
      'Checklist informativa das obrigações que um pequeno negócio em Portugal costuma ter ao longo do ano. Confirme prazos e enquadramento com contador certificado.',
    keywords: [
      'obrigações fiscais Portugal',
      'calendário fiscal PME',
      'IVA trimestral',
      'Segurança Social independente',
      'prazos AT',
    ],
  },
  relatedSlugs: [
    'calendario-fiscal-portugal-2026-completo',
    'declaracao-irs-guia-pratico', 'iva-quando-preciso-de-me-registar', 'recibos-verdes-vs-faturacao'],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Facturar no momento da prestação — não acumular recibos «para o fim do mês».',
      'Segurança Social: pagamento mensal até ao dia 20 (regra geral).',
      'IVA: só se aplica se estiver enquadrado — mensal ou trimestral.',
      'IRS é anual; o trabalho de preparação é mensal (arquivo).',
      'Para mapa completo de 2026, veja o calendário fiscal dedicado.',
    ]),
    ...proseParagraphs(
      'Ter actividade aberta não é só «emitir facturas». Há um ritmo mensal ou trimestral de entregas e pagamentos. Este artigo organiza o calendário em linguagem simples — mas os prazos exactos dependem do seu regime.',
      'Se gere um escritório de contabilidade com dezenas de clientes, cada um pode ter regimes diferentes. Para freelancers a solo, o padrão abaixo cobre 80% dos casos — confirme sempre com o seu contador.',
    ),
    {
      type: 'image',
      src: '/blog/covers/fiscal-calendar.svg',
      alt: 'Calendário de parede num escritório',
      caption: 'Um calendário fiscal evita surpresas — o contador pode personalizar o seu.',
    },
    { type: 'h2', id: 'mensal', text: 'Todos os meses (quase sempre)' },
    {
      type: 'ul',
      items: [
        'Emitir documentos de venda (factura/recibo) por cada prestação — no dia ou na semana, não no último dia do mês',
        'Registar despesas com factura válida e NIF (se forem dedutíveis ou custo de actividade)',
        'Pagar contribuições à Segurança Social (trabalhador independente) até ao dia 20',
        'Arquivar PDFs e comprovativos (mínimo 4–10 anos conforme tipo de documento)',
        'Reconciliar banco: entradas = recibos emitidos?',
      ],
    },
    ...articleSection({
      h2: 'Rotina semanal recomendada',
      id: 'rotina',
      paragraphs: [
        'Profissionais que facturam pouco podem adoptar uma rotina de sexta-feira: emitir recibos em falta, digitalizar despesas da semana, verificar se o cliente pagou. Quem factura muito deve automatizar com software certificado.',
      ],
      blocks: [
        comparisonTable({
          caption: 'Quem faz o quê — independente vs contador',
          headers: ['Tarefa', 'Independentemente', 'Com contador'],
          rows: [
            ['Emitir recibos', 'Sim', 'Pode delegar em software'],
            ['Pagar SS', 'Sim (ou débito directo)', 'Lembra e valida'],
            ['Declaração IVA', 'Sim, se aplicável', 'Prepara e submete'],
            ['IRS anual', 'Pode entregar sozinho', 'Recomendado com actividade'],
            ['Arquivo', 'Sim — origem dos PDFs', 'Pede documentos em falta'],
          ],
        }),
      ],
    }),
    sectionDivider(),
    comparisonTable({
      caption: 'Destaques por época do ano (independente típico)',
      headers: ['Época', 'Foco principal', 'Erro comum'],
      rows: [
        ['Jan–Mar', 'Arquivo do ano anterior + 1.ª declaração IVA do ano', 'Não reunir PDFs para o IRS'],
        ['Abr–Jun', 'Prazo IRS (abril–junho conforme calendário)', 'Entregar IRS sem validar retenções'],
        ['Jul–Set', 'Férias ≠ pausa fiscal — SS dia 20 continua', 'Esquecer SS em Agosto'],
        ['Out–Dez', 'Planeamento: provisão IRS + revisão IVA', 'Emitir recibos em Dezembro «para fechar o ano»'],
      ],
    }),
    {
      type: 'p',
      text: 'Arquivo digital exige mais do que uma pasta no Desktop: backup automático, antivírus e cuidado com emails falsos das Finanças. Veja o nosso guia sobre protecção de dados fiscais no portátil.',
    },
    { type: 'link', label: 'Proteger dados fiscais no portátil', slug: 'proteger-dados-fiscais-freelancer-portugal' },
    { type: 'h2', id: 'trimestral', text: 'Trimestral ou mensal: IVA' },
    {
      type: 'p',
      text: 'Se está enquadrado em IVA, entrega declaração periódica (mensal ou trimestral). O regime depende do volume de facturação e do código de actividade. Erros aqui geram juros e coimas.',
    },
    { type: 'link', label: 'Artigo: IVA — quando preciso de me registar?', slug: 'iva-quando-preciso-de-me-registar' },
    { type: 'h2', id: 'anual', text: 'Anual' },
    {
      type: 'ul',
      items: [
        'Declaração de IRS (rendimentos do ano anterior)',
        'Modelo 22 / IRC se for sociedade (não ENI)',
        'Inventários ou mapas contabilísticos conforme regime',
        'Comunicações específicas do sector (ex.: IES para algumas entidades)',
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'Donos de escritórios de contabilidade',
      text: 'Se gere dezenas de clientes com prazos diferentes, um software com alertas por empresa (como o TegLion) reduz o risco de falhar entregas — experimente o teste gratuito de 14 dias.',
    },
    ...affiliateSection({
      heading: 'Do calendário ao arquivo mensal',
      headingId: 'recursos',
      intro:
        'O ritmo fiscal só funciona se cada mês tiver sítio para os comprovativos. Quem deixa PDFs e papel na gaveta do «depois» descobre em Abril que falta o recibo de Outubro — e o prazo do IRS não espera.',
      items: [
        {
          key: 'hotmartReciboVerde7Dias',
          leadIn:
            'Se ainda está a montar a rotina, comece por um roteiro que amarra abertura de actividade, emissão e primeiras contribuições. Sem essa base, o calendário mensal vira lista de tarefas sem contexto.',
          title: 'Recibo Verde em 7 Dias (Hotmart)',
          description: 'ebook passo a passo para Portugal — complementa este checklist, não substitui o contador.',
        },
        {
          key: 'amazonPastaThinkTex26',
          leadIn:
            'Depois da lista mensal, a pergunta prática é onde guardar IVA, SS, despesas e IRS. Uma pasta expansível com um bolso por trimestre (ou por obrigação) evita a mistura que o contador depois tem de desemaranhar.',
          title: 'Pasta ThinkTex A4 — 26 bolsos (Amazon)',
          description: 'arquivo físico portátil para acompanhar o ritmo mês a mês.',
        },
      ],
    }),
    { type: 'link', label: 'Calendário fiscal 2026 completo', slug: 'calendario-fiscal-portugal-2026-completo' },
    ...internalLinksSection({
      title: 'Ler a seguir',
      slugs: [
        'calendario-fiscal-portugal-2026-completo',
        'seguranca-social-trabalhador-independente',
        'iva-quando-preciso-de-me-registar',
        'organizar-documentos-fiscais-arquivo-digital',
      ],
    }),
    legalCallout('Prazos oficiais: consulte portaldasfinancas.gov.pt e seguranca-social.pt.'),
  ],
}
