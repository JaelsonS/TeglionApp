export const CLIENT_TYPES = ['COMPANY', 'SELF_EMPLOYED', 'INDIVIDUAL'] as const

export const ACCOUNTING_TYPES = ['Contabilidade Organizada', 'Regime Simples'] as const

export const VAT_REGIMES = [
  'Isento',
  'Normal Trimestral',
  'Normal Mensal',
] as const

export const VAT_EXEMPTION_REASONS = [
  'Artigo 16º nº 6 do CIVA',
  'artigo 6º do Decreto-Lei nº 198/90 de junho',
  'Exigibilidade de caixa',
  'Isento Artigo 13º do CIVA',
  'Isento Artigo 14º do CIVA',
  'Isento Artigo 15º do CIVA',
  'Isento Artigo 9º do CIVA',
  'IVA - não confere direto a dedução - Artigo 62º',
  'IVA - Regime de isenção - Artigo 53º nº 1 do CIVA',
  'Regime particular do tabaco',
  'Regime da margem de lucro - Agências de viagens',
  'Regime da margem de lucro - Bens em segunda mão',
  'Regime da margem de lucro - Objetos de arte',
  'Regime da margem de lucro - Objetos de coleção e antiguidades',
  'Isento Artigo 14º do RITI',
  'Outras isenções',
  'IVA - regime forfetário',
  'IVA - não confere direito à dedução (ou similar) - Artigo 72º',
  'Mercadorias à consignação',
  'Isenção de IVA com direito à dedução no cabaz alimentar',
  'IVA - autoliquidação - Artigo 2º nº1 alínea i) do CIVA',
  'IVA - autoliquidação - Artigo 2º nº1 alínea j) do CIVA',
  'IVA - autoliquidação - Artigo 2º nº1 alínea l) do CIVA',
  'IVA - autoliquidação - Artigo 2º nº1 alínea m) do CIVA',
  'IVA - autoliquidação - Artigo 2º nº1 alínea n) do CIVA',
  'IVA - autoliquidação - Artigo 6º nº6 alínea a) do CIVA, a contrário',
  'IVA - autoliquidação - Artigo 8º nº3 RITI',
  'IVA - autoliquidação - Decreto-Lei nº 21/2007, de 29 de janeiro',
  'IVA - autoliquidação - Decreto-Lei nº 362/99, de 16 de setembro',
  'IVA - Regras específicas - Artigo 6º do CIVA',
  'IVA - Regime transfronteiriço de isenção - Artigo 58º-A do CIVA',
  'IVA - e-TaxFree - Decreto-Lei nº 19/2017, de 14/02',
  'Não sujeito ou não tributado',
] as const

export const YES_NO_OPTIONS = ['Sim', 'Não'] as const

export const IRS_FRAMEWORKS = [
  'IRC — Regime geral',
  'IRC — Regime simplificado',
  'IRS — Categoria B',
  'IRS — Organização de contabilidade',
] as const

/** CAE frequentes (valor livre também permitido). */
export const CAE_OPTIONS = [
  '10711 — Fabricação de produtos de padaria',
  '47110 — Comércio a retalho em estabelecimentos não especializados',
  '62010 — Actividades de programação informática',
  '41200 — Construção de edifícios',
  '47730 — Comércio a retalho de produtos farmacêuticos',
  '56101 — Restauração de tipo tradicional',
  '69101 — Actividades jurídicas',
  '68200 — Arrendamento de bens imobiliários',
  '49410 — Transportes rodoviários de mercadorias',
  '70220 — Actividades de consultoria para os negócios',
] as const

export const WIZARD_STEPS = [
  { id: 1, label: 'Identificação' },
  { id: 2, label: 'Fiscal' },
  { id: 3, label: 'Responsáveis' },
  { id: 4, label: 'Serviços' },
] as const
