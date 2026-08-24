import { useState, type KeyboardEvent } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { ChevronDown, ChevronUp, Eye, EyeOff, Loader2, Plus, Power, PowerOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import type { AccountingServiceGroup } from '@/shared/types/contabil'

/**
 * Gestão de grupos de serviço (1 nível de hierarquia: grupo -> serviços).
 * Mesmo padrão visual de lista + reordenação por setas já usado em
 * ServicesCatalogWorkspace.tsx, dentro de um Dialog centralizado.
 */
export function ServiceGroupsManager({
  open,
  onOpenChange,
  groups,
  onReload,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: AccountingServiceGroup[]
  onReload: () => void
}) {
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const sorted = [...groups].sort((a, b) => a.sortOrder - b.sortOrder)

  const createGroup = async () => {
    const name = newName.trim()
    if (!name) return
    setCreating(true)
    try {
      await contabilAccountingServicesApi.createGroup({ name, sortOrder: (sorted.length + 1) * 10 })
      setNewName('')
      toast.success('Grupo criado')
      await onReload()
    } catch (err) {
      toast.error('Não foi possível criar o grupo', { description: getErrorMessage(err) })
    } finally {
      setCreating(false)
    }
  }

  const startRename = (g: AccountingServiceGroup) => {
    setRenamingId(g.id)
    setRenameValue(g.name)
  }

  const commitRename = async (g: AccountingServiceGroup) => {
    const name = renameValue.trim()
    setRenamingId(null)
    if (!name || name === g.name) return
    setBusyId(g.id)
    try {
      await contabilAccountingServicesApi.patchGroup(g.id, { name })
      toast.success('Grupo renomeado')
      await onReload()
    } catch (err) {
      toast.error('Não foi possível renomear', { description: getErrorMessage(err) })
    } finally {
      setBusyId(null)
    }
  }

  const toggle = async (g: AccountingServiceGroup, field: 'isActive' | 'isPubliclyListed') => {
    setBusyId(g.id)
    try {
      await contabilAccountingServicesApi.patchGroup(g.id, { [field]: !g[field] })
      await onReload()
    } catch (err) {
      toast.error('Erro ao atualizar', { description: getErrorMessage(err) })
    } finally {
      setBusyId(null)
    }
  }

  const move = async (index: number, direction: -1 | 1) => {
    const other = index + direction
    if (other < 0 || other >= sorted.length) return
    const ordered = [...sorted]
    const [item] = ordered.splice(index, 1)
    ordered.splice(other, 0, item)
    setBusyId(item.id)
    try {
      await Promise.all(
        ordered.map((g, i) => contabilAccountingServicesApi.patchGroup(g.id, { sortOrder: (i + 1) * 10 })),
      )
      await onReload()
    } catch (err) {
      toast.error('Não foi possível reordenar', { description: getErrorMessage(err) })
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (g: AccountingServiceGroup) => {
    if (!window.confirm(`Apagar o grupo "${g.name}"? Os serviços dentro dele ficam sem grupo, não são apagados.`)) return
    setBusyId(g.id)
    try {
      await contabilAccountingServicesApi.removeGroup(g.id)
      toast.success('Grupo apagado')
      await onReload()
    } catch (err) {
      toast.error('Não foi possível apagar', { description: getErrorMessage(err) })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Grupos de serviços</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Um grupo organiza vários serviços na Página Pública (ex.: "Consultorias" reunindo "Consultoria para
          Empresas", "Consultoria Individual"…). Ordene, ative/desative, e controle se aparece publicamente.
        </p>

        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e: FormChangeEvent) => setNewName(e.target.value)}
            placeholder="Nome do novo grupo (ex.: Consultorias)"
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') void createGroup()
            }}
          />
          <Button type="button" size="sm" disabled={creating || !newName.trim()} onClick={() => void createGroup()}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        <ul className="max-h-72 space-y-1.5 overflow-y-auto">
          {sorted.length === 0 ? (
            <li className="py-6 text-center text-xs text-muted-foreground">Nenhum grupo criado ainda.</li>
          ) : (
            sorted.map((g, index) => (
              <li
                key={g.id}
                className={cn(
                  'flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-2',
                  !g.isActive && 'opacity-50',
                )}
              >
                {renamingId === g.id ? (
                  <Input
                    autoFocus
                    className="h-8 flex-1 text-sm"
                    value={renameValue}
                    onChange={(e: FormChangeEvent) => setRenameValue(e.target.value)}
                    onBlur={() => void commitRename(g)}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') void commitRename(g)
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:underline"
                    onClick={() => startRename(g)}
                    title="Clique para renomear"
                  >
                    {g.name}
                  </button>
                )}
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={busyId === g.id || index === 0}
                    onClick={() => void move(index, -1)}
                    title="Subir"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={busyId === g.id || index === sorted.length - 1}
                    onClick={() => void move(index, 1)}
                    title="Descer"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={busyId === g.id}
                    onClick={() => void toggle(g, 'isPubliclyListed')}
                    title={g.isPubliclyListed ? 'Visível na Página Pública' : 'Oculto na Página Pública'}
                  >
                    {g.isPubliclyListed ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={busyId === g.id}
                    onClick={() => void toggle(g, 'isActive')}
                    title={g.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {g.isActive ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    disabled={busyId === g.id}
                    onClick={() => void remove(g)}
                    title="Apagar grupo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
