/** Chaves alinhadas a `CONSULTING_SERVICES_CATALOG` (backend). */
export const MAYA_SETUP_SERVICE_OPTIONS_PT = [
  { catalogKey: 'consultoria-individual', label: 'Consultoria individual' },
  { catalogKey: 'simulacao-irs', label: 'Simulação de IRS' },
  { catalogKey: 'entrega-irs-orcamento', label: 'Entrega IRS (sob orçamento)' },
  { catalogKey: 'abertura-atividade', label: 'Abertura de atividade' },
  { catalogKey: 'abertura-empresa', label: 'Abertura de empresa' },
  { catalogKey: 'iva-isolada', label: 'IVA (isolada)' },
  { catalogKey: 'irs-modelo-3', label: 'IRS Modelo 3 (campanha)' },
] as const

export const MAYA_SETUP_SERVICE_OPTIONS_BR = [
  { catalogKey: 'consultoria-individual', label: 'Consultoria contábil' },
  { catalogKey: 'abertura-empresa', label: 'Abertura de empresa' },
] as const

export const MAYA_SETUP_SPECIALTIES = [
  'IRS',
  'IVA',
  'Contabilidade empresarial',
  'Recursos humanos / SS',
  'Autónomos',
  'e-Fatura',
] as const
