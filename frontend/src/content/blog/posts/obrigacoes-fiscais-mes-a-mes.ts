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
  author: 'Liliana Nunes',
  authorRole: 'Revisão editorial TegLion · Guias de fiscalidade portuguesa',
  category: 'Obrigações',
  audience: ['independente', 'escritorio', 'pme'],
  featured: false,
  tags: ['obrigações', 'IVA', 'Segurança Social', 'calendário fiscal', 'PME'],
  readMinutes: 8,
  coverImage: {
    src: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&h=630&fit=crop&q=80',
    alt: 'Calendário e documentos fiscais organizados',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Obrigações fiscais mensais em Portugal (checklist) | Blog TegLion',
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
      src: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=960&h=540&fit=crop&q=80',
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
      heading: 'Do calendário à gaveta: organizar sem stress',
      headingId: 'recursos',
      intro:
        'Conhecemos freelancers que só descobrem em Abril que falta o PDF de um recibo de Outubro. O calendário fiscal só funciona se cada mês tiver sítio para os papéis — senão, vira corrida contra o prazo do IRS.',
      items: [
        {
          key: 'hotmartReciboVerde7Dias',
          leadIn:
            'Se ainda está a montar a rotina mensal, vale começar por um guia que amarra abertura de actividade, emissão de recibos e primeiras contribuições — antes de investir em pastas ou software.',
          title: 'Recibo Verde em 7 Dias (Hotmart)',
          description:
            'Ebook passo a passo para Portugal: Finanças, recibos verdes, Segurança Social e declarações. Complementa este calendário — não substitui o contador.',
        },
        {
          key: 'amazonPastaThinkTex26',
          leadIn:
            'Depois de ler a lista mensal acima, a pergunta prática é: «onde guardo isto?». Uma pasta sanfona com um bolso por trimestre (IVA, SS, despesas, IRS) evita a gaveta do «vou tratar disso depois».',
          title: 'Pasta ThinkTex A4 — 26 bolsos (Amazon)',
          description:
            'Organizador expansível para separar documentos por mês ou obrigação. Cabe numa mochila — útil para quem trabalha em casa e no coworking.',
        },
        {
          key: 'amazonEtiquetasPastas',
          leadIn:
            'Pastas sem nome viram arquivo morto. Etiquetar «T1-2026 IVA» ou «Recibos emitidos» poupa horas quando o contador pede um comprovativo ou quando abre o Portal das Finanças.',
          title: 'Etiquetas para pastas de arquivo (Amazon)',
          description: 'Pack de etiquetas autoadesivas para lombadas — identificação rápida sem imprimir folhas A4.',
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
