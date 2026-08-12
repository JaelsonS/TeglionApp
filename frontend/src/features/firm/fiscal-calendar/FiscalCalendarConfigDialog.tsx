import type { FormEvent, ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { FirmFiscalCalendar, FirmFiscalCategory } from '@/infrastructure/api/contabil/fiscalCalendar'
import { contabilFiscalCalendarApi } from '@/infrastructure/api'
import { CALENDAR_COLOR_PALETTE, getCalendarColorStyle } from '@/shared/calendar'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { cn } from '@/shared/lib/utils'
import { getErrorMessage } from '@/shared/utils/errors'

export function FiscalCalendarConfigDialog({
  open,
  onOpenChange,
  calendar,
  categories,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  calendar: FirmFiscalCalendar | null
  categories: FirmFiscalCategory[]
  onSaved: () => void
}) {
  const [tab, setTab] = useState<'geral' | 'categorias' | 'preferencias'>('geral')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [defaultView, setDefaultView] = useState<'month' | 'list' | 'year'>('month')
  const [showInternal, setShowInternal] = useState(true)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('slate')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !calendar) return
    setName(calendar.name || '')
    setDescription(calendar.description || '')
    setDefaultView(calendar.preferences?.defaultView || 'month')
    setShowInternal(calendar.preferences?.showInternalEvents !== false)
    setTab('geral')
  }, [open, calendar])

  async function saveGeneral(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await contabilFiscalCalendarApi.updateWorkspace({
        name,
        description,
        preferences: {
          defaultView,
          showInternalEvents: showInternal,
          firstDayOfWeek: 1,
        },
      })
      toast.success('Calendário atualizado')
      onSaved()
    } catch (err) {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  async function addCategory(e: FormEvent) {
    e.preventDefault()
    if (!newCatName.trim()) return
    setSaving(true)
    try {
      await contabilFiscalCalendarApi.createCategory({
        name: newCatName.trim(),
        colorToken: newCatColor,
      })
      setNewCatName('')
      toast.success('Categoria criada')
      onSaved()
    } catch (err) {
      toast.error('Não foi possível criar categoria', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  async function toggleCategory(cat: FirmFiscalCategory) {
    try {
      await contabilFiscalCalendarApi.updateCategory(cat.id, { isActive: !cat.isActive })
      onSaved()
    } catch (err) {
      toast.error('Não foi possível atualizar', { description: getErrorMessage(err) })
    }
  }

  async function updateCategoryColor(cat: FirmFiscalCategory, colorToken: string) {
    try {
      await contabilFiscalCalendarApi.updateCategory(cat.id, { colorToken })
      onSaved()
    } catch (err) {
      toast.error('Não foi possível atualizar cor', { description: getErrorMessage(err) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="shrink-0 border-b border-border/60 px-5 py-4 text-left">
          <DialogTitle>Configurar calendário fiscal</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Defina o nome, categorias e preferências do calendário do escritório.
          </p>
        </DialogHeader>

        <div className="flex shrink-0 gap-1 border-b border-border/60 px-3 py-2">
          {(
            [
              ['geral', 'Geral'],
              ['categorias', 'Categorias'],
              ['preferencias', 'Preferências'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium',
                tab === id ? 'bg-brand text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
              )}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {tab === 'geral' || tab === 'preferencias' ? (
            <form id="fiscal-cal-config-form" onSubmit={(e) => void saveGeneral(e)} className="space-y-4">
              {tab === 'geral' ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="fiscal-cal-name">Nome</Label>
                    <Input id="fiscal-cal-name" value={name} onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fiscal-cal-desc">Descrição</Label>
                    <Textarea
                      id="fiscal-cal-desc"
                      value={description}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="fiscal-cal-view">Vista predefinida</Label>
                    <select
                      id="fiscal-cal-view"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={defaultView}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setDefaultView(e.target.value as 'month' | 'list' | 'year')}
                    >
                      <option value="month">Mês</option>
                      <option value="list">Lista</option>
                      <option value="year">Ano</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showInternal}
                      onChange={(e) => setShowInternal(e.target.checked)}
                    />
                    Mostrar eventos internos
                  </label>
                  <p className="text-xs text-muted-foreground">Primeiro dia da semana: Segunda</p>
                </>
              )}
            </form>
          ) : (
            <div className="space-y-4">
              <ul className="space-y-2">
                {categories.map((cat) => {
                  const style = getCalendarColorStyle(cat.colorToken)
                  return (
                    <li
                      key={cat.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn('h-2.5 w-2.5 rounded-full', style.dot)} />
                        <span className={cn('text-sm font-medium', !cat.isActive && 'opacity-50 line-through')}>
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {CALENDAR_COLOR_PALETTE.slice(0, 6).map((token) => (
                          <button
                            key={token}
                            type="button"
                            className={cn(
                              'h-5 w-5 rounded-full',
                              getCalendarColorStyle(token).dot,
                              cat.colorToken === token && 'ring-2 ring-brand ring-offset-1',
                            )}
                            aria-label={token}
                            onClick={() => void updateCategoryColor(cat, token)}
                          />
                        ))}
                        <Button type="button" size="sm" variant="ghost" onClick={() => void toggleCategory(cat)}>
                          {cat.isActive ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <form onSubmit={(e) => void addCategory(e)} className="space-y-2 rounded-xl border border-dashed border-border/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nova categoria</p>
                <Input
                  value={newCatName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewCatName(e.target.value)}
                  placeholder="Nome da categoria"
                />
                <div className="flex flex-wrap gap-1.5">
                  {CALENDAR_COLOR_PALETTE.map((token) => (
                    <button
                      key={token}
                      type="button"
                      className={cn(
                        'h-6 w-6 rounded-full',
                        getCalendarColorStyle(token).dot,
                        newCatColor === token && 'ring-2 ring-brand ring-offset-1',
                      )}
                      onClick={() => setNewCatColor(token)}
                      aria-label={token}
                    />
                  ))}
                </div>
                <Button type="submit" size="sm" disabled={saving || !newCatName.trim()}>
                  Adicionar
                </Button>
              </form>
            </div>
          )}
        </div>

        {tab !== 'categorias' ? (
          <DialogFooter className="shrink-0 border-t border-border/60 px-5 py-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button type="submit" form="fiscal-cal-config-form" disabled={saving}>
              {saving ? 'A guardar…' : 'Guardar'}
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter className="shrink-0 border-t border-border/60 px-5 py-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
