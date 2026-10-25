import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Home,
  Landmark,
  Percent,
  Receipt,
  Shield,
} from 'lucide-react'

export type FirmCalculatorId = 'iva' | 'irs' | 'ss' | 'retencao' | 'imt' | 'irc'

/** Catálogo das calculadoras fiscais (hub + modais). */
export const FIRM_CALCULATORS: readonly {
  id: FirmCalculatorId
  title: string
  description: string
  badge: string
  icon: LucideIcon
}[] = [
  {
    id: 'iva',
    title: 'IVA',
    description: 'Líquido ↔ total com taxas 23 %, 13 % e 6 % (simulação PT 2026).',
    badge: 'Mais usada',
    icon: Percent,
  },
  {
    id: 'irs',
    title: 'IRS',
    description: 'Estimativas de IRS para conferência interna do gabinete.',
    badge: 'Rendimentos',
    icon: Landmark,
  },
  {
    id: 'ss',
    title: 'Segurança Social',
    description: 'Contribuições estimadas de trabalhadores independentes.',
    badge: 'TI',
    icon: Shield,
  },
  {
    id: 'retencao',
    title: 'Retenção na fonte',
    description: 'Tabelas de retenção IRS para salários e recibos verdes.',
    badge: 'Tabelas',
    icon: Receipt,
  },
  {
    id: 'imt',
    title: 'IMT',
    description: 'Imposto municipal sobre as transmissões (continente 2026).',
    badge: 'Imóveis',
    icon: Home,
  },
  {
    id: 'irc',
    title: 'IRC',
    description: 'IRC, derramas e tributação associada — uso interno.',
    badge: 'Empresas',
    icon: Building2,
  },
] as const

export function isFirmCalculatorId(value: string | null | undefined): value is FirmCalculatorId {
  return FIRM_CALCULATORS.some((c) => c.id === value)
}
