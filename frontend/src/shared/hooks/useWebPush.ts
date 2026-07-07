import { useCallback, useState } from 'react'

import { api } from '@/infrastructure/api'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function useWebPush(scope: 'firm' | 'client' = 'firm') {
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(
    () => typeof Notification !== 'undefined' && Notification.permission === 'granted',
  )

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push não suportado neste browser.')
    }
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') throw new Error('Permissão de notificações negada.')

      const { data: vapid } = await api.get<{ publicKey: string | null }>(
        scope === 'firm' ? '/contabil/push/vapid-public-key' : '/client-portal/me/contabil/push/vapid-public-key',
      )
      if (!vapid.publicKey) throw new Error('Push não configurado no servidor.')

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
      })

      const path =
        scope === 'firm' ? '/contabil/push/subscribe' : '/client-portal/me/contabil/push/subscribe'
      await api.post(path, { subscription: sub.toJSON() })
      setEnabled(true)
    } finally {
      setLoading(false)
    }
  }, [scope])

  return { enabled, loading, subscribe }
}
