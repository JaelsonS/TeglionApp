import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Building2,
  ClipboardList,
  FileStack,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  ScrollText,
} from 'lucide-react'

export type ClientHubSection =
  | 'overview'
  | 'profile'
  | 'accesses'
  | 'timeline'
  | 'obligations'
  | 'documents'
  | 'tasks'
  | 'messages'

export const CLIENT_HUB_SECTIONS: Array<{
  id: ClientHubSection
  label: string
  icon: LucideIcon
}> = [
  { id: 'overview', label: 'Resumo', icon: LayoutDashboard },
  { id: 'profile', label: 'Perfil', icon: Building2 },
  { id: 'accesses', label: 'Acessos', icon: KeyRound },
  { id: 'timeline', label: 'Actividade', icon: Activity },
  { id: 'obligations', label: 'Obrigações', icon: ClipboardList },
  { id: 'documents', label: 'Documentos', icon: FileStack },
  { id: 'tasks', label: 'Tarefas', icon: ScrollText },
  { id: 'messages', label: 'Comunicação', icon: MessageSquare },
]

export function isClientHubSection(value: string | null): value is ClientHubSection {
  return CLIENT_HUB_SECTIONS.some((section) => section.id === value)
}
