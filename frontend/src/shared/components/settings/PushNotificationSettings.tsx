import { Bell, BellOff } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { useWebPush } from '@/shared/hooks/useWebPush'

export function PushNotificationSettings({ scope = 'firm' }: { scope?: 'firm' | 'client' }) {
  const { enabled, loading, subscribe } = useWebPush(scope)

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card p-4">
      <div>
        <p className="text-sm font-medium text-foreground">Notificações push</p>
        <p className="text-xs text-muted-foreground">
          Alertas de prazos e mensagens mesmo com o browser fechado (PWA).
        </p>
      </div>
      <Button
        type="button"
        variant={enabled ? 'secondary' : 'default'}
        size="sm"
        disabled={loading || enabled}
        onClick={() => void subscribe().catch(() => {})}
      >
        {enabled ? (
          <>
            <Bell className="mr-1.5 h-4 w-4" /> Activas
          </>
        ) : (
          <>
            <BellOff className="mr-1.5 h-4 w-4" /> {loading ? 'A activar…' : 'Activar'}
          </>
        )}
      </Button>
    </div>
  )
}
