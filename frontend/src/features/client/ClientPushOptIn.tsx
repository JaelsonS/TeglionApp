import { useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { useWebPush } from '@/shared/hooks/useWebPush'
import { getErrorMessage } from '@/shared/utils/errors'
import { trackProductEvent } from '@/shared/utils/productAnalytics'

/** Pedido de permissão push no portal do cliente. */
export function ClientPushOptIn({ className }: { className?: string }) {
  const { enabled, loading, subscribe } = useWebPush('client')
  const [hidden, setHidden] = useState(false)

  if (enabled || hidden) return null

  const onActivate = async () => {
    try {
      await subscribe()
      trackProductEvent('client_push_enabled', { surface: 'client' })
      toast.success('Notificações activadas neste dispositivo.')
    } catch (err) {
      toast.error('Não foi possível activar as notificações', {
        description: getErrorMessage(err),
      })
    }
  }

  return (
    <div
      className={
        className ||
        'flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between'
      }
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">Avisos do escritório</p>
        <p className="text-xs text-muted-foreground">
          Receba pedidos, prazos e mensagens mesmo com a app fechada.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="rounded-full"
          disabled={loading}
          onClick={() => void onActivate()}
          aria-label="Activar notificações push"
        >
          {loading ? (
            'A activar…'
          ) : (
            <>
              <Bell className="mr-1.5 h-4 w-4" aria-hidden />
              Activar
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="rounded-full"
          onClick={() => setHidden(true)}
        >
          <BellOff className="mr-1.5 h-4 w-4" aria-hidden />
          Agora não
        </Button>
      </div>
    </div>
  )
}
