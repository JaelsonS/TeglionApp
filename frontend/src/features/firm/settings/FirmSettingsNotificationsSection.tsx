import { Bell, BellOff, Mail } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { useWebPush } from '@/shared/hooks/useWebPush'
import { getErrorMessage } from '@/shared/utils/errors'

export function FirmSettingsNotificationsSection() {
  const { enabled, loading, subscribe } = useWebPush('firm')

  const onActivate = async () => {
    try {
      await subscribe()
      toast.success('Notificações push activadas.')
    } catch (err) {
      toast.error('Não foi possível activar as notificações', {
        description: getErrorMessage(err),
      })
    }
  }

  const onTest = () => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      toast.error('Active primeiro as notificações push.')
      return
    }
    try {
      new Notification('Teglion', {
        body: 'Teste de notificação — os alertas vão aparecer assim.',
        icon: '/icons/icon.svg',
      })
      toast.success('Notificação de teste enviada.')
    } catch (err) {
      toast.error('Não foi possível mostrar o teste', { description: getErrorMessage(err) })
    }
  }

  return (
    <div className="space-y-4">
      <section className="cb-settings-panel">
        <div className="cb-settings-panel-hd">
          <span className="cb-settings-panel-icon">
            <Bell className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="cb-settings-panel-title">Alertas push (PWA)</h3>
            <p className="cb-settings-panel-sub">
              Receba avisos de prazos e mensagens mesmo com o browser fechado.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Estado</p>
            <p className="text-xs text-muted-foreground">
              {enabled ? 'Notificações activas neste dispositivo.' : 'Ainda não activou neste browser.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={enabled ? 'secondary' : 'default'}
              className="rounded-lg"
              disabled={loading || enabled}
              onClick={() => void onActivate()}
            >
              {enabled ? (
                <>
                  <Bell className="mr-1.5 h-4 w-4" /> Activas
                </>
              ) : (
                <>
                  <BellOff className="mr-1.5 h-4 w-4" /> {loading ? 'A activar…' : 'Activar push'}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" className="rounded-lg" disabled={!enabled} onClick={onTest}>
              Testar notificação
            </Button>
          </div>
        </div>
      </section>

      <section className="cb-settings-panel">
        <div className="cb-settings-panel-hd">
          <span className="cb-settings-panel-icon">
            <Mail className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="cb-settings-panel-title">E-mails transaccionais</h3>
            <p className="cb-settings-panel-sub">
              Convites, confirmações e redefinição de palavra-passe são sempre enviados quando o evento
              acontece. Preferências granulares por tipo de alerta chegam numa próxima versão.
            </p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2">Convites de equipa e clientes</li>
          <li className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2">Confirmação de e-mail e reset de senha</li>
          <li className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2">Avisos críticos do escritório</li>
        </ul>
      </section>
    </div>
  )
}
