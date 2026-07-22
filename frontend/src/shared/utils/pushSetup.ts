export const PUSH_SW_URL = '/sw-push.js'

export type PushPlatform = 'ios' | 'android' | 'desktop' | 'unknown'

export type PushSetupIssue =
  | 'unsupported'
  | 'needs_install'
  | 'permission_denied'
  | 'server_not_configured'
  | 'service_worker_failed'

export class PushSetupError extends Error {
  issue: PushSetupIssue

  constructor(issue: PushSetupIssue, message: string) {
    super(message)
    this.name = 'PushSetupError'
    this.issue = issue
  }
}

export function isPushApiSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function detectPushPlatform(): PushPlatform {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  if (/Macintosh|Windows|Linux/i.test(ua)) return 'desktop'
  return 'unknown'
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  if (nav.standalone) return true
  return window.matchMedia('(display-mode: standalone)').matches
}

/** No iPhone/iPad, Web Push só funciona com a app instalada no ecrã inicial (iOS 16.4+). */
export function needsPwaInstallForPush(): boolean {
  return detectPushPlatform() === 'ios' && !isStandalonePwa()
}

export function isPushServiceWorkerScript(url: string | undefined): boolean {
  return Boolean(url?.includes('sw-push.js'))
}

export async function ensurePushServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!isPushApiSupported()) {
    throw new PushSetupError(
      'unsupported',
      'Este browser não suporta notificações push. Use Chrome, Safari ou Edge actualizado.',
    )
  }

  try {
    let registration = await navigator.serviceWorker.getRegistration('/')
    const scriptUrl = registration?.active?.scriptURL || registration?.installing?.scriptURL

    if (!registration || !isPushServiceWorkerScript(scriptUrl)) {
      registration = await navigator.serviceWorker.register(PUSH_SW_URL, { scope: '/' })
    }

    return navigator.serviceWorker.ready
  } catch {
    throw new PushSetupError(
      'service_worker_failed',
      'Não foi possível preparar as notificações neste dispositivo. Recarregue a página e tente novamente.',
    )
  }
}

export type PushGuideStep = { title: string; detail: string }

export function getPushInstallGuide(platform: PushPlatform): PushGuideStep[] {
  if (platform === 'ios') {
    return [
      {
        title: 'Abra no Safari',
        detail: 'No iPhone, as notificações só funcionam se abrir o portal no Safari (não no Chrome).',
      },
      {
        title: 'Partilhar → «Adicionar ao Ecrã Inicial»',
        detail: 'Toque no ícone de partilhar (quadrado com seta) e escolha «Adicionar ao Ecrã Inicial».',
      },
      {
        title: 'Abra pela app instalada',
        detail: 'Entre no Teglion pelo ícone no ecrã inicial — não pelo browser.',
      },
      {
        title: 'Active as notificações',
        detail: 'Volte aqui e toque em «Activar». Quando o iPhone pedir, escolha «Permitir».',
      },
    ]
  }

  if (platform === 'android') {
    return [
      {
        title: 'Instale a app (recomendado)',
        detail: 'No Chrome, abra o menu (⋮) e escolha «Instalar app» ou «Adicionar ao ecrã inicial».',
      },
      {
        title: 'Ou use o Chrome directamente',
        detail: 'Também pode activar notificações no browser, mas a app instalada é mais fiável.',
      },
      {
        title: 'Permita notificações',
        detail: 'Toque em «Activar» e confirme «Permitir» quando o telemóvel pedir.',
      },
    ]
  }

  return [
    {
      title: 'Use um browser moderno',
      detail: 'Chrome, Edge ou Safari actualizado suportam notificações do Teglion.',
    },
    {
      title: 'Permita notificações',
      detail: 'Clique em «Activar» e confirme «Permitir» no pedido do browser.',
    },
    {
      title: 'Mantenha o portal aberto ou instalado',
      detail: 'Para receber avisos com o computador fechado, instale a app pelo ícone na barra de endereço.',
    },
  ]
}

export function getPermissionDeniedGuide(platform: PushPlatform): PushGuideStep[] {
  if (platform === 'ios') {
    return [
      {
        title: 'Ajustes → Notificações',
        detail: 'Abra Ajustes no iPhone, procure a app Teglion e active «Permitir Notificações».',
      },
      {
        title: 'Confirme que abriu pela app instalada',
        detail: 'Se entrou pelo Safari normal, instale primeiro no ecrã inicial e abra por esse ícone.',
      },
      {
        title: 'Volte e toque em Activar',
        detail: 'Depois de permitir, regresse ao portal e active novamente.',
      },
    ]
  }

  if (platform === 'android') {
    return [
      {
        title: 'Definições do site',
        detail: 'No Chrome, toque no cadeado/ícone ao lado do endereço → Permissões → Notificações → Permitir.',
      },
      {
        title: 'Ou nas definições do telemóvel',
        detail: 'Definições → Apps → Chrome (ou Teglion) → Notificações → activar.',
      },
    ]
  }

  return [
    {
      title: 'Ícone do cadeado na barra de endereço',
      detail: 'Clique no cadeado → Definições do site → Notificações → Permitir.',
    },
    {
      title: 'Recarregue e tente de novo',
      detail: 'Depois de alterar a permissão, volte ao portal e clique em «Activar».',
    },
  ]
}
