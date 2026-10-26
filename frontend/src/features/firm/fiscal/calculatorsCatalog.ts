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

/** Catálogo das calculadoras fiscais (hub + páginas por ferramenta). */
export const FIRM_CALCULATORS: readonly {
  id: FirmCalculatorId
  title: string
  description: string
  purpose: string
  badge: string
  icon: LucideIcon
}[] = [
  {
    id: 'iva',
    title: 'IVA',
    description: 'Líquido ↔ total com taxas 23 %, 13 % e 6 % (simulação PT 2026).',
    purpose: 'Converta valores com e sem IVA, guarde a discriminação e reabra no histórico.',
    badge: 'Mais usada',
    icon: Percent,
  },
  {
    id: 'irs',
    title: 'IRS',
    description: 'Estimativas de IRS para conferência interna do gabinete.',
    purpose: 'Estime a coleta sobre rendimento coletável (escalões + solidariedade opcional).',
    badge: 'Rendimentos',
    icon: Landmark,
  },
  {
    id: 'ss',
    title: 'Segurança Social',
    description: 'Contribuições estimadas de trabalhadores independentes.',
    purpose: 'Simule contribuições TCO/TI a partir da base ou da prestação de serviços.',
    badge: 'TI',
    icon: Shield,
  },
  {
    id: 'retencao',
    title: 'Retenção na fonte',
    description: 'Tabelas de retenção IRS para salários e recibos verdes.',
    purpose: 'Aplique tabelas I–III (continente) a remunerações mensais com dependentes.',
    badge: 'Tabelas',
    icon: Receipt,
  },
  {
    id: 'imt',
    title: 'IMT',
    description: 'Imposto municipal sobre as transmissões (continente 2026).',
    purpose: 'Estime IMT por tabelas de habitação ou taxas fixas — sem imposto do selo.',
    badge: 'Imóveis',
    icon: Home,
  },
  {
    id: 'irc',
    title: 'IRC',
    description: 'IRC, derramas e tributação associada — uso interno.',
    purpose: 'Simule IRC (geral/PME/Interior) com derrama estadual e municipal opcional.',
    badge: 'Empresas',
    icon: Building2,
  },
] as const

export function isFirmCalculatorId(value: string | null | undefined): value is FirmCalculatorId {
  return FIRM_CALCULATORS.some((c) => c.id === value)
}
