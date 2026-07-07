import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Building2,
  ClipboardList,
  FileStack,
  LayoutDashboard,
  MessageSquare,
  ScrollText,
} from 'lucide-react'

export type ClientHubSection = 'overview' | 'profile' | 'timeline' | 'obligations' | 'documents' | 'tasks' | 'messages'

export const CLIENT_HUB_SECTIONS: Array<{
  id: ClientHubSection
  label: string
  icon: LucideIcon
}> = [
  { id: 'overview', label: 'Resumo', icon: LayoutDashboard },
  { id: 'profile', label: 'Empresa', icon: Building2 },
  { id: 'timeline', label: 'Actividade', icon: Activity },
  { id: 'obligations', label: 'Obrigações', icon: ClipboardList },
  { id: 'documents', label: 'Documentos', icon: FileStack },
  { id: 'tasks', label: 'Tarefas', icon: ScrollText },
  { id: 'messages', label: 'Comunicação', icon: MessageSquare },
]
