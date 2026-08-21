import { useState } from 'react'

import { ClientSearchSelect } from '@/features/firm/components/ClientSearchSelect'
import { safeDisplayText } from '@/shared/utils/safeDisplayText'
import type { Client } from '@/shared/types/clients'

/**
 * Seleção de vários clientes com busca — mesmo padrão já usado para destinatários de
 * Alertas (AlertComposer.tsx: ClientSearchSelect + chips removíveis), generalizado aqui
 * para reuso em outras telas (tarefas com múltiplos clientes).
 */
export function ClientMultiSelect({
  clients,
  value,
  onChange,
  placeholder = 'Adicionar cliente (nome, e-mail, NIF)…',
  requireQuery = false,
}: {
  clients: Client[]
  value: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
  /** Só mostra resultados depois de escrever — ver ClientSearchSelect. */
  requireQuery?: boolean
}) {
  const [picker, setPicker] = useState('')

  const addClient = (id: string) => {
    if (!id || value.includes(id)) return
    onChange([...value, id])
    setPicker('')
  }

  const removeClient = (id: string) => {
    onChange(value.filter((x) => x !== id))
  }

  return (
    <div className="space-y-2">
      <ClientSearchSelect
        clients={clients.filter((c) => !value.includes(c._id))}
        value={picker}
        onChange={addClient}
        placeholder={placeholder}
        requireQuery={requireQuery}
      />
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((id) => {
            const c = clients.find((x) => x._id === id)
            return (
              <li
                key={id}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs font-medium shadow-sm"
              >
                {safeDisplayText(c?.fullName || c?.name || c?.displayName, id.slice(0, 8))}
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => removeClient(id)}
                  aria-label="Remover cliente"
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhum cliente selecionado.</p>
      )}
    </div>
  )
}
