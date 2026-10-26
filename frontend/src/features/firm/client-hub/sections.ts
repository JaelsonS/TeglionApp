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
  Wallet,
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
  | 'billing'

export const CLIENT_HUB_SECTIONS: Array<{
  id: ClientHubSection
  label: string
  icon: LucideIcon
  /** Uma frase: para que serve esta secção no hub. */
  purpose: string
}> = [
  {
    id: 'overview',
    label: 'Resumo',
    icon: LayoutDashboard,
    purpose: 'Vista rápida: risco, prazos próximos, alertas e atalhos para o resto do hub.',
  },
  {
    id: 'profile',
    label: 'Perfil',
    icon: Building2,
    purpose: 'Dados fiscais e de contacto desta empresa — edite e guarde alterações aqui.',
  },
  {
    id: 'billing',
    label: 'Faturação',
    icon: Wallet,
    purpose: 'Avenças e cobranças deste cliente (carteira do gabinete), não o Plano Teglion.',
  },
  {
    id: 'accesses',
    label: 'Acessos',
    icon: KeyRound,
    purpose: 'Credenciais e acessos oficiais (AT, SS, etc.) guardados para este cliente.',
  },
  {
    id: 'timeline',
    label: 'Actividade',
    icon: Activity,
    purpose: 'Histórico do que aconteceu com este cliente no Teglion.',
  },
  {
    id: 'obligations',
    label: 'Obrigações',
    icon: ClipboardList,
    purpose: 'Obrigações fiscais e prazos associados a este cliente.',
  },
  {
    id: 'documents',
    label: 'Documentos',
    icon: FileStack,
    purpose: 'Pedidos e ficheiros trocados com este cliente.',
  },
  {
    id: 'tasks',
    label: 'Tarefas',
    icon: ScrollText,
    purpose: 'Trabalho interno do gabinete ligado a este cliente.',
  },
  {
    id: 'messages',
    label: 'Comunicação',
    icon: MessageSquare,
    purpose: 'Mensagens e conversas com o portal deste cliente.',
  },
]

export function isClientHubSection(value: string | null): value is ClientHubSection {
  return CLIENT_HUB_SECTIONS.some((section) => section.id === value)
}
