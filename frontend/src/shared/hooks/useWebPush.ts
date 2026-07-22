import { useCallback, useState } from 'react'

import { api } from '@/infrastructure/api'
import {
  PushSetupError,
  ensurePushServiceWorker,
  needsPwaInstallForPush,
  type PushSetupIssue,
} from '@/shared/utils/pushSetup'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export type WebPushSubscribeResult = 'subscribed' | 'already_granted'

export function useWebPush(scope: 'firm' | 'client' = 'firm') {
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(
    () => typeof Notification !== 'undefined' && Notification.permission === 'granted',
  )
  const [lastIssue, setLastIssue] = useState<PushSetupIssue | null>(null)

  const subscribe = useCallback(async (): Promise<WebPushSubscribeResult> => {
    setLastIssue(null)

    if (scope === 'client' && needsPwaInstallForPush()) {
      const err = new PushSetupError(
        'needs_install',
        'No iPhone, instale o Teglion no ecrã inicial antes de activar notificações.',
      )
      setLastIssue(err.issue)
      throw err
    }

    setLoading(true)
    try {
      const reg = await ensurePushServiceWorker()

      let perm = Notification.permission
      if (perm === 'default') {
        perm = await Notification.requestPermission()
      }
      if (perm !== 'granted') {
        const err = new PushSetupError(
          'permission_denied',
          'Permissão de notificações negada. Active nas definições do dispositivo ou browser.',
        )
        setLastIssue(err.issue)
        throw err
      }

      const { data: vapid } = await api.get<{ publicKey: string | null }>(
        scope === 'firm' ? '/contabil/push/vapid-public-key' : '/client-portal/me/contabil/push/vapid-public-key',
      )
      if (!vapid.publicKey) {
        const err = new PushSetupError(
          'server_not_configured',
          'As notificações ainda não estão configuradas no servidor. Tente mais tarde.',
        )
        setLastIssue(err.issue)
        throw err
      }

      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        const path =
          scope === 'firm' ? '/contabil/push/subscribe' : '/client-portal/me/contabil/push/subscribe'
        await api.post(path, { subscription: existing.toJSON() })
        setEnabled(true)
        return 'already_granted'
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
      })

      const path =
        scope === 'firm' ? '/contabil/push/subscribe' : '/client-portal/me/contabil/push/subscribe'
      await api.post(path, { subscription: sub.toJSON() })
      setEnabled(true)
      return 'subscribed'
    } catch (err) {
      if (err instanceof PushSetupError) {
        setLastIssue(err.issue)
        throw err
      }
      const wrapped = new PushSetupError(
        'service_worker_failed',
        err instanceof Error ? err.message : 'Não foi possível activar as notificações.',
      )
      setLastIssue(wrapped.issue)
      throw wrapped
    } finally {
      setLoading(false)
    }
  }, [scope])

  return { enabled, loading, subscribe, lastIssue }
}
