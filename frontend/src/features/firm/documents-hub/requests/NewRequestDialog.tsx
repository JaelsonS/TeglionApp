import { useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'

import { ClientSearchSelect } from '@/features/firm/components/ClientSearchSelect'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import type { Client } from '@/shared/types/clients'

export function NewRequestDialog({
  open,
  onOpenChange,
  clients,
  defaultClientId,
  sending,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: Client[]
  defaultClientId?: string
  sending: boolean
  onSubmit: (payload: { clientId: string; title: string; instructions: string }) => Promise<void>
}) {
  const [form, setForm] = useState({
    clientId: defaultClientId || '',
    title: '',
    instructions: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clientId || !form.instructions.trim()) return
    await onSubmit({
      clientId: form.clientId,
      title: form.title.trim(),
      instructions: form.instructions.trim(),
    })
    setForm({ clientId: form.clientId, title: '', instructions: '' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Novo pedido formal</DialogTitle>
          <DialogDescription>
            O cliente recebe instruções estruturadas no portal — não é uma mensagem de chat.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <ClientSearchSelect
            clients={clients}
            value={form.clientId}
            onChange={(id) => setForm((f) => ({ ...f, clientId: id }))}
          />
          <Input
            placeholder="Título (ex: IVA — abril 2026)"
            value={form.title}
            onChange={(e: FormChangeEvent) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="rounded-xl"
          />
          <Textarea
            placeholder="Instruções oficiais para o cliente…"
            value={form.instructions}
            onChange={(e: FormChangeEvent) => setForm((f) => ({ ...f, instructions: e.target.value }))}
            rows={5}
            className="rounded-xl"
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={sending} className="rounded-full">
              Criar pedido
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
