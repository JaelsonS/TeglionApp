/** Percursos de leitura e séries — liga artigos entre si para SEO e retenção. */
export type BlogReadingPath = {
  id: string
  title: string
  description: string
  slugs: string[]
}

export const BLOG_READING_PATHS: BlogReadingPath[] = [
  {
    id: 'comecar-zero',
    title: 'Começar do zero',
    description: 'Abrir actividade, emitir o primeiro recibo e perceber obrigações mensais.',
    slugs: [
      'guia-completo-trabalhador-independente-portugal-2026',
      'calendario-fiscal-portugal-2026-completo',
      'abrir-empresa-individual-eni',
      'quanto-custa-abrir-actividade-portugal',
      'como-emitir-recibo-verde-passo-a-passo',
      'seguranca-social-trabalhador-independente',
    ],
  },
  {
    id: 'irs-recibos',
    title: 'IRS e recibos verdes',
    description: 'Declarar rendimentos, evitar erros e cumprir prazos sem stress.',
    slugs: [
      'deducoes-irs-portugal-guia-completo',
      'declaracao-irs-guia-pratico',
      'prazos-irs-2026-independentes',
      'irs-recibos-verdes-erros-comuns',
      'retencao-fonte-recibos-verdes',
      'recibos-verdes-vs-faturacao',
    ],
  },
  {
    id: 'calendario-prazos',
    title: 'Calendário e prazos 2026',
    description: 'Mapa anual de obrigações para independentes e PME.',
    slugs: [
      'calendario-fiscal-portugal-2026-completo',
      'obrigacoes-fiscais-mes-a-mes',
      'prazos-irs-2026-independentes',
      'seguranca-social-trabalhador-independente',
    ],
  },
  {
    id: 'iva-facturacao',
    title: 'IVA e facturação',
    description: 'Isenção, limites, software certificado e transição para sujeito passivo.',
    slugs: [
      'iva-quando-preciso-de-me-registar',
      'quando-passar-de-isento-a-iva',
      'escolher-software-faturacao-portugal',
      'regime-simplificado-vs-contabilidade-organizada',
    ],
  },
  {
    id: 'escritorio-contabilidade',
    title: 'Escritório de contabilidade',
    description: 'Digitalizar, ferramentas, prazos e gestão de clientes para contabilistas certificados.',
    slugs: [
      'digitalizar-escritorio-contabilidade-portugal',
      'gestao-prazos-fiscais-escritorio-contabilidade',
      'saft-efatura-validacao-documentos-escritorio',
      'software-escritorio-contabilidade-portugal',
      'caso-escritorio-digitalizacao-prazos',
      'ferramentas-essenciais-contabilista-2026',
      'organizar-documentos-fiscais-arquivo-digital',
      'calendario-fiscal-portugal-2026-completo',
    ],
  },
  {
    id: 'zero-ao-primeiro-irs',
    title: 'Do zero ao primeiro IRS',
    description: 'Deduções, declaração prática, prazos e erros comuns — do envelope à submissão.',
    slugs: [
      'deducoes-irs-portugal-guia-completo',
      'declaracao-irs-guia-pratico',
      'prazos-irs-2026-independentes',
      'irs-recibos-verdes-erros-comuns',
      'portal-financas-guia-completo-iniciantes',
      'retencao-fonte-recibos-verdes',
    ],
  },
  {
    id: 'operacoes-escritorio-teglion',
    title: 'Operações do escritório',
    description: 'Digitalizar, prazos, documentos e software — o dia-a-dia do escritório OCC.',
    slugs: [
      'digitalizar-escritorio-contabilidade-portugal',
      'gestao-prazos-fiscais-escritorio-contabilidade',
      'saft-efatura-validacao-documentos-escritorio',
      'software-escritorio-contabilidade-portugal',
      'caso-escritorio-digitalizacao-prazos',
    ],
  },
  {
    id: 'pme-sociedades',
    title: 'PME e sociedades',
    description: 'De ENI a Lda: IRC, constituição passo a passo e casos práticos de transição.',
    slugs: [
      'irc-sociedades-lda-portugal-guia',
      'abrir-sociedade-lda-portugal-passo-a-passo',
      'caso-pme-transicao-eni-lda',
      'regime-simplificado-vs-contabilidade-organizada',
      'abrir-empresa-individual-eni',
      'como-escolher-contabilista-portugal',
    ],
  },
  {
    id: 'estudantes-carreira',
    title: 'Estudantes e carreira OCC',
    description: 'Estudar contabilidade, escolher material e dar os primeiros passos na profissão.',
    slugs: [
      'estudar-contabilidade-portugal-guia-estudantes',
      'contabilidade-explicada-leigos-portugal',
      'ferramentas-essenciais-contabilista-2026',
      'como-escolher-contabilista-portugal',
      'regime-simplificado-vs-contabilidade-organizada',
    ],
  },
  {
    id: 'organizar-proteger',
    title: 'Organizar e proteger',
    description: 'Arquivo digital, Portal das Finanças e segurança dos seus dados fiscais.',
    slugs: [
      'portal-financas-guia-completo-iniciantes',
      'organizar-documentos-fiscais-arquivo-digital',
      'proteger-dados-fiscais-freelancer-portugal',
      'freelancer-estrangeiro-portugal',
      'como-escolher-contabilista-portugal',
      'calendario-fiscal-portugal-2026-completo',
    ],
  },
]

export const BLOG_CATEGORIES = [
  { id: 'todos', label: 'Todos' },
  { id: 'Guias completos', label: 'Guias completos' },
  { id: 'Escritórios', label: 'Escritórios' },
  { id: 'Estudantes', label: 'Estudantes' },
  { id: 'Facturação', label: 'Facturação' },
  { id: 'IRS', label: 'IRS' },
  { id: 'IVA', label: 'IVA' },
  { id: 'Actividade', label: 'Actividade' },
  { id: 'Obrigações', label: 'Obrigações' },
  { id: 'Segurança Social', label: 'Segurança Social' },
  { id: 'Organização', label: 'Organização' },
  { id: 'Contabilidade', label: 'Contabilidade' },
] as const
