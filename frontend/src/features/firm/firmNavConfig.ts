import type { LucideIcon } from 'lucide-react'
import {
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Inbox,
  LayoutGrid,
  ListChecks,
  Megaphone,
  MessageSquare,
  Newspaper,
  ReceiptText,
  Settings,
  UserRound,
} from 'lucide-react'

export type FirmNavItemConfig = {
  to: string
  labelKey: string
  labelDefault: string
  icon: LucideIcon
  end?: boolean
  badgeKey?: 'messages'
}

export type FirmNavGroupConfig = {
  id: string
  titleKey: string
  titleDefault: string
  items: FirmNavItemConfig[]
}

export const FIRM_NAV_GROUPS: FirmNavGroupConfig[] = [
  {
    id: 'overview',
    titleKey: 'contabil.firm.nav.overview',
    titleDefault: 'Visão geral',
    items: [
      {
        to: '/app/firm/dashboard',
        labelKey: 'nav.dashboard',
        labelDefault: 'Painel',
        icon: LayoutGrid,
      },
    ],
  },
  {
    id: 'clients',
    titleKey: 'contabil.firm.nav.clients',
    titleDefault: 'Clientes',
    items: [
      {
        to: '/app/firm/clients',
        labelKey: 'contabil.firm.nav.clientsList',
        labelDefault: 'Empresas',
        icon: UserRound,
      },
    ],
  },
  {
    id: 'comms',
    titleKey: 'contabil.firm.nav.comms',
    titleDefault: 'Comunicação',
    items: [
      {
        to: '/app/firm/documents',
        labelKey: 'contabil.firm.nav.documents',
        labelDefault: 'Documentos',
        icon: Inbox,
        end: false,
      },
      {
        to: '/app/firm/messages',
        labelKey: 'contabil.firm.nav.chat',
        labelDefault: 'Mensagens',
        icon: MessageSquare,
        badgeKey: 'messages',
      },
    ],
  },
  {
    id: 'operations',
    titleKey: 'contabil.firm.nav.operations',
    titleDefault: 'Operação',
    items: [
      {
        to: '/app/firm/tasks',
        labelKey: 'contabil.firm.nav.tasks',
        labelDefault: 'Tarefas',
        icon: ListChecks,
        end: false,
      },
      {
        to: '/app/firm/agenda',
        labelKey: 'contabil.firm.nav.consultations',
        labelDefault: 'Consultorias',
        icon: CalendarCheck,
      },
      {
        to: '/app/firm/fiscal-calendar',
        labelKey: 'contabil.firm.nav.fiscalCalendar',
        labelDefault: 'Calendário fiscal',
        icon: CalendarDays,
      },
    ],
  },
  {
    id: 'admin',
    titleKey: 'contabil.firm.nav.admin',
    titleDefault: 'Gestão',
    items: [
      {
        to: '/app/firm/alerts',
        labelKey: 'contabil.firm.nav.alerts',
        labelDefault: 'Central de Alertas',
        icon: Megaphone,
      },
      {
        to: '/app/firm/news',
        labelKey: 'contabil.firm.nav.news',
        labelDefault: 'Notícias',
        icon: Newspaper,
      },
      {
        to: '/app/firm/services',
        labelKey: 'contabil.firm.nav.services',
        labelDefault: 'Serviços',
        icon: ClipboardList,
      },
      {
        to: '/app/firm/billing',
        labelKey: 'nav.billing',
        labelDefault: 'Plano',
        icon: ReceiptText,
      },
      {
        to: '/app/firm/settings',
        labelKey: 'nav.settings',
        labelDefault: 'Definições',
        icon: Settings,
        end: false,
      },
    ],
  },
]

export const FIRM_NAV_FLAT = FIRM_NAV_GROUPS.flatMap((g) => g.items)

/** Ordem do rail desktop (IMG-03): ícones principais + definições no fundo. */
export const FIRM_NAV_RAIL_MAIN: FirmNavItemConfig[] = [
  {
    to: '/app/firm/dashboard',
    labelKey: 'nav.dashboard',
    labelDefault: 'Painel',
    icon: LayoutGrid,
  },
  {
    to: '/app/firm/clients',
    labelKey: 'contabil.firm.nav.clientsList',
    labelDefault: 'Empresas',
    icon: UserRound,
  },
  {
    to: '/app/firm/documents',
    labelKey: 'contabil.firm.nav.documents',
    labelDefault: 'Documentos',
    icon: Inbox,
    end: false,
  },
  {
    to: '/app/firm/messages',
    labelKey: 'contabil.firm.nav.chat',
    labelDefault: 'Mensagens',
    icon: MessageSquare,
    badgeKey: 'messages',
  },
  {
    to: '/app/firm/tasks',
    labelKey: 'contabil.firm.nav.tasks',
    labelDefault: 'Tarefas',
    icon: ListChecks,
    end: false,
  },
  {
    to: '/app/firm/agenda',
    labelKey: 'contabil.firm.nav.consultations',
    labelDefault: 'Consultorias',
    icon: CalendarCheck,
  },
  {
    to: '/app/firm/fiscal-calendar',
    labelKey: 'contabil.firm.nav.fiscalCalendar',
    labelDefault: 'Calendário fiscal',
    icon: CalendarDays,
  },
  {
    to: '/app/firm/alerts',
    labelKey: 'contabil.firm.nav.alerts',
    labelDefault: 'Alertas',
    icon: Megaphone,
  },
  {
    to: '/app/firm/services',
    labelKey: 'contabil.firm.nav.services',
    labelDefault: 'Serviços',
    icon: ClipboardList,
  },
]

export const FIRM_NAV_RAIL_BOTTOM: FirmNavItemConfig[] = [
  {
    to: '/app/firm/billing',
    labelKey: 'nav.billing',
    labelDefault: 'Plano',
    icon: ReceiptText,
  },
  {
    to: '/app/firm/settings',
    labelKey: 'nav.settings',
    labelDefault: 'Definições',
    icon: Settings,
    end: false,
  },
]

/** Barra inferior tablet/mobile — mesma ordem que o rail (primeiros 5 itens). */
export const FIRM_NAV_MOBILE_PRIMARY: FirmNavItemConfig[] = FIRM_NAV_RAIL_MAIN.slice(0, 5)

export const FIRM_NAV_MOBILE_MORE: FirmNavItemConfig[] = [
  ...FIRM_NAV_RAIL_MAIN.slice(5),
  ...FIRM_NAV_RAIL_BOTTOM,
]

/** Drawer: mesma ordem que o rail (sem grupos diferentes). */
export const FIRM_NAV_DRAWER_ITEMS: FirmNavItemConfig[] = [...FIRM_NAV_RAIL_MAIN, ...FIRM_NAV_RAIL_BOTTOM]

/** Rotas com etiqueta para breadcrumb no header. */
export function firmNavLabelForPath(pathname: string): string | null {
  const matches = FIRM_NAV_FLAT.filter((i) => {
    if (pathname === i.to) return true
    if (i.end === false) return pathname.startsWith(`${i.to}/`)
    return false
  })
  if (!matches.length) return null
  const best = matches.sort((a, b) => b.to.length - a.to.length)[0]
  return best.labelDefault
}
