import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileArchive,
  Home,
  Inbox,
  Landmark,
  LayoutGrid,
  ListChecks,
  Megaphone,
  MessageSquare,
  Newspaper,
  ReceiptText,
  Settings,
  UserRound,
  Wallet,
  Calculator,
} from 'lucide-react'

export type FirmNavItemConfig = {
  to: string
  labelKey: string
  labelDefault: string
  icon: LucideIcon
  end?: boolean
  badgeKey?: 'messages' | 'serviceInquiries' | 'consultations' | 'documents' | 'tasks' | 'obligations'
}

export type FirmNavGroupConfig = {
  id: string
  titleKey: string
  titleDefault: string
  items: FirmNavItemConfig[]
}

/** Grupos legíveis (repaginação): mesmas rotas, nomes que explicam o quê. */
export const FIRM_NAV_GROUPS: FirmNavGroupConfig[] = [
  {
    id: 'overview',
    titleKey: 'contabil.firm.nav.overview',
    titleDefault: 'Hoje',
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
    titleDefault: 'Clientes e carteira',
    items: [
      {
        to: '/app/firm/clients',
        labelKey: 'contabil.firm.nav.clientsList',
        labelDefault: 'Clientes',
        icon: UserRound,
      },
      {
        to: '/app/firm/payments',
        labelKey: 'contabil.firm.nav.payments',
        labelDefault: 'Pagamentos (carteira)',
        icon: Wallet,
      },
      {
        to: '/app/firm/client-rentals',
        labelKey: 'contabil.firm.nav.clientRentals',
        labelDefault: 'Arrendamentos (clientes)',
        icon: Home,
      },
      {
        to: '/app/firm/rentals',
        labelKey: 'contabil.firm.nav.rentals',
        labelDefault: 'Custos do gabinete',
        icon: Building2,
      },
      {
        to: '/app/firm/saft',
        labelKey: 'contabil.firm.nav.saft',
        labelDefault: 'SAF-T (consulta)',
        icon: FileArchive,
      },
      {
        to: '/app/firm/tasks/obligations',
        labelKey: 'contabil.firm.nav.obligations',
        labelDefault: 'Obrigações por cliente',
        icon: ClipboardCheck,
        end: false,
        badgeKey: 'obligations',
      },
    ],
  },
  {
    id: 'operations',
    titleKey: 'contabil.firm.nav.operations',
    titleDefault: 'Trabalho do gabinete',
    items: [
      {
        to: '/app/firm/tasks',
        labelKey: 'contabil.firm.nav.tasks',
        labelDefault: 'Tarefas',
        icon: ListChecks,
        end: false,
        badgeKey: 'tasks',
      },
      {
        to: '/app/firm/agenda',
        labelKey: 'contabil.firm.nav.consultations',
        labelDefault: 'Agendamentos',
        icon: CalendarCheck,
        badgeKey: 'consultations',
      },
      {
        to: '/app/firm/irs',
        labelKey: 'contabil.firm.nav.irs',
        labelDefault: 'Área IRS',
        icon: Landmark,
      },
      {
        to: '/app/firm/services',
        labelKey: 'contabil.firm.nav.services',
        labelDefault: 'Serviços',
        icon: ClipboardList,
        badgeKey: 'serviceInquiries',
      },
      {
        to: '/app/firm/fiscal-calendar',
        labelKey: 'contabil.firm.nav.fiscalCalendar',
        labelDefault: 'Calendário fiscal',
        icon: CalendarDays,
      },
      {
        to: '/app/firm/calculators',
        labelKey: 'contabil.firm.nav.calculators',
        labelDefault: 'Calculadoras',
        icon: Calculator,
        end: false,
      },
    ],
  },
  {
    id: 'comms',
    titleKey: 'contabil.firm.nav.comms',
    titleDefault: 'Comunicar',
    items: [
      {
        to: '/app/firm/documents',
        labelKey: 'contabil.firm.nav.documents',
        labelDefault: 'Documentos',
        icon: Inbox,
        end: false,
        badgeKey: 'documents',
      },
      {
        to: '/app/firm/messages',
        labelKey: 'contabil.firm.nav.chat',
        labelDefault: 'Mensagens',
        icon: MessageSquare,
        badgeKey: 'messages',
      },
      {
        to: '/app/firm/alerts',
        labelKey: 'contabil.firm.nav.alerts',
        labelDefault: 'Alertas',
        icon: Megaphone,
      },
      {
        to: '/app/firm/news',
        labelKey: 'contabil.firm.nav.news',
        labelDefault: 'Blog / Notícias',
        icon: Newspaper,
      },
    ],
  },
  {
    id: 'admin',
    titleKey: 'contabil.firm.nav.admin',
    titleDefault: 'Conta Teglion',
    items: [
      {
        to: '/app/firm/billing',
        labelKey: 'nav.billing',
        labelDefault: 'Plano Teglion',
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

function parseNavTarget(to: string): { pathname: string; search: string } {
  const queryIndex = to.indexOf('?')
  if (queryIndex === -1) return { pathname: to, search: '' }
  return { pathname: to.slice(0, queryIndex), search: to.slice(queryIndex) }
}

/** Diferente do `isActive` nativo do `NavLink` (que ignora a query string por
 * completo), permite dois itens apontarem para o mesmo pathname com queries
 * diferentes — ex.: "Serviços" e "IRS" apontam ambos para
 * `/app/firm/services`, só o segundo fixa `?tab=irs`. Sem isto os dois
 * apareceriam activos ao mesmo tempo, o que é confuso no menu. */
export function isFirmNavItemActive(
  item: FirmNavItemConfig,
  pathname: string,
  search: string,
  allItems: FirmNavItemConfig[],
): boolean {
  const target = parseNavTarget(item.to)
  const pathMatches =
    pathname === target.pathname || (item.end !== true && pathname.startsWith(`${target.pathname}/`))
  if (!pathMatches) return false
  if (target.search) return search === target.search
  const shadowedByMoreSpecificSibling = allItems.some((other) => {
    if (other === item) return false
    const otherTarget = parseNavTarget(other.to)
    if (Boolean(otherTarget.search) && otherTarget.pathname === target.pathname && search === otherTarget.search) {
      return true
    }
    // Um item cujo caminho é um sub-caminho deste (ex.: "Tarefas" vs "Obrigações
    // dos Clientes" em /tasks/obligations) não deve ficar activo ao mesmo tempo
    // que o item mais específico — o mais específico "ganha".
    if (
      otherTarget.pathname.length > target.pathname.length &&
      otherTarget.pathname.startsWith(`${target.pathname}/`) &&
      (pathname === otherTarget.pathname || (other.end !== true && pathname.startsWith(`${otherTarget.pathname}/`)))
    ) {
      return true
    }
    return false
  })
  return !shadowedByMoreSpecificSibling
}

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
    labelDefault: 'Clientes',
    icon: UserRound,
  },
  {
    to: '/app/firm/payments',
    labelKey: 'contabil.firm.nav.payments',
    labelDefault: 'Pagamentos (carteira)',
    icon: Wallet,
  },
  {
    to: '/app/firm/client-rentals',
    labelKey: 'contabil.firm.nav.clientRentals',
    labelDefault: 'Arrendamentos (clientes)',
    icon: Home,
  },
  {
    to: '/app/firm/rentals',
    labelKey: 'contabil.firm.nav.rentals',
    labelDefault: 'Custos do gabinete',
    icon: Building2,
  },
  {
    to: '/app/firm/saft',
    labelKey: 'contabil.firm.nav.saft',
    labelDefault: 'SAF-T (consulta)',
    icon: FileArchive,
  },
  {
    to: '/app/firm/documents',
    labelKey: 'contabil.firm.nav.documents',
    labelDefault: 'Documentos',
    icon: Inbox,
    end: false,
    badgeKey: 'documents',
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
    badgeKey: 'tasks',
  },
  {
    to: '/app/firm/agenda',
    labelKey: 'contabil.firm.nav.consultations',
    labelDefault: 'Agendamentos',
    icon: CalendarCheck,
    badgeKey: 'consultations',
  },
  {
    to: '/app/firm/fiscal-calendar',
    labelKey: 'contabil.firm.nav.fiscalCalendar',
    labelDefault: 'Calendário fiscal',
    icon: CalendarDays,
  },
  {
    to: '/app/firm/calculators',
    labelKey: 'contabil.firm.nav.calculators',
    labelDefault: 'Calculadoras',
    icon: Calculator,
    end: false,
  },
  {
    to: '/app/firm/alerts',
    labelKey: 'contabil.firm.nav.alerts',
    labelDefault: 'Alertas',
    icon: Megaphone,
  },
  {
    to: '/app/firm/irs',
    labelKey: 'contabil.firm.nav.irs',
    labelDefault: 'Área IRS',
    icon: Landmark,
  },
  {
    to: '/app/firm/services',
    labelKey: 'contabil.firm.nav.services',
    labelDefault: 'Serviços',
    icon: ClipboardList,
    badgeKey: 'serviceInquiries',
  },
  {
    to: '/app/firm/tasks/obligations',
    labelKey: 'contabil.firm.nav.obligations',
    labelDefault: 'Obrigações por cliente',
    icon: ClipboardCheck,
    end: false,
    badgeKey: 'obligations',
  },
]

export const FIRM_NAV_RAIL_BOTTOM: FirmNavItemConfig[] = [
  {
    to: '/app/firm/billing',
    labelKey: 'nav.billing',
    labelDefault: 'Plano Teglion',
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
    const { pathname: targetPath } = parseNavTarget(i.to)
    if (pathname === targetPath) return true
    if (i.end === false) return pathname.startsWith(`${targetPath}/`)
    return false
  })
  if (!matches.length) return null
  const best = matches.sort((a, b) => parseNavTarget(b.to).pathname.length - parseNavTarget(a.to).pathname.length)[0]
  return best.labelDefault
}
