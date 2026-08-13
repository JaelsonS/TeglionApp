import { useState } from 'react'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'
import { SheetHiddenTitle } from '@/shared/components/ui/sheet-hidden-title'
import { Chip } from '@/shared/design-system/Chip'
import { SafeImage } from '@/shared/components/ui/SafeImage'
import { useAuth } from '@/shared/hooks/useAuth'
import { cn } from '@/shared/lib/utils'

const INTENTS = [
  { id: 'tour', label: 'Conhecer o Teglion', to: '/app/firm/dashboard' },
  { id: 'public-page', label: 'Configurar minha página', to: '/app/firm/settings?tab=pagina-publica' },
  { id: 'service', label: 'Criar meu primeiro serviço', to: '/app/firm/services' },
  { id: 'irs', label: 'Configurar o IRS', to: '/app/firm/irs' },
  { id: 'agenda', label: 'Configurar minha agenda', to: '/app/firm/agenda' },
  { id: 'requests', label: 'Entender os pedidos', to: '/app/firm/services' },
  { id: 'billing', label: 'Entender a faturação', to: '/app/firm/billing' },
] as const

type MayaAssistantProps = {
  className?: string
}

/**
 * Maya v1 foundation — assistente guiada (sem LLM, sem dados sensíveis).
 * Assets: /maya/maya-avatar.png (não substituir).
 */
export function MayaAssistant({ className }: MayaAssistantProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const firstName = String(user?.fullName || '')
    .trim()
    .split(/\s+/)[0]

  if (!user || user.role === 'CLIENT') return null

  return (
    <>
      <button
        type="button"
        className={cn(
          'fixed bottom-[5.5rem] right-4 z-40 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full',
          'border border-brand/20 bg-card shadow-[var(--cb-shadow-elevated)]',
          'transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2',
          'xl:bottom-6',
          className,
        )}
        aria-label="Abrir Maya, assistente Teglion"
        title="Maya — assistente Teglion"
        onClick={() => setOpen(true)}
      >
        <SafeImage src="/maya/maya-avatar-sm.png" alt="" className="h-full w-full object-cover" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHiddenTitle>Maya</SheetHiddenTitle>
          <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
            <SafeImage
              src="/maya/maya-avatar-sm.png"
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Maya</p>
              <p className="text-caption text-muted-foreground">Assistente Teglion</p>
            </div>
            <Button type="button" size="icon" variant="ghost" aria-label="Fechar" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm leading-relaxed text-foreground">
              <p>Olá{firstName ? `, ${firstName}` : ''}! Eu sou a Maya, a assistente virtual do Teglion.</p>
              <p className="mt-2 text-muted-foreground">
                Ajudo a conhecer o sistema e a configurar o escritório. Não tenho acesso a documentos, dados
                privados nem informações sensíveis.
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Por onde quer começar?</p>
              <div className="flex flex-wrap gap-2">
                {INTENTS.map((intent) => (
                  <Chip
                    key={intent.id}
                    onClick={() => {
                      setOpen(false)
                      navigate(intent.to)
                    }}
                  >
                    {intent.label}
                  </Chip>
                ))}
              </div>
            </div>

            <p className="text-caption text-muted-foreground">
              A ajuda contextual de cada módulo continua disponível no botão «Guia».
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
