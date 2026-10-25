/** Catálogo das calculadoras fiscais (hub + deep-links). */
export const FIRM_CALCULATORS = [
  {
    id: 'iva',
    to: '/app/firm/calculators/iva',
    title: 'IVA',
    description: 'Calcular IVA a partir de valores com ou sem imposto (simulação PT 2026).',
  },
  {
    id: 'irs',
    to: '/app/firm/calculators/irs',
    title: 'IRS',
    description: 'Simular retenções e estimativas de IRS para conferência interna.',
  },
  {
    id: 'ss',
    to: '/app/firm/calculators/ss',
    title: 'Segurança Social',
    description: 'Estimativas de contribuições de trabalhadores independentes.',
  },
  {
    id: 'retencao',
    to: '/app/firm/calculators/retencao',
    title: 'Retenção na fonte',
    description: 'Tabelas de retenção IRS (simulação) para salários e recibos.',
  },
  {
    id: 'imt',
    to: '/app/firm/calculators/imt',
    title: 'IMT',
    description: 'Imposto municipal sobre as transmissões (continente 2026).',
  },
  {
    id: 'irc',
    to: '/app/firm/calculators/irc',
    title: 'IRC',
    description: 'Simular IRC, derramas e tributação associada (uso interno).',
  },
] as const
