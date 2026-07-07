export type AppDataChangedDetail = {
  scope?:
    | 'users'
    | 'consultants'
    | 'clients'
    | 'appointments'
    | 'appointment-requests'
    | 'service-requests'
    | 'reports'
    | 'branding'
    | 'internal-messages'
    | 'messages'
    | 'document-requests'
    | 'documents'
    | 'firm'
    | 'hub'
    | 'live'
  types?: string[]
}

const EVENT_NAME = 'app:data-changed'

export function emitAppDataChanged(detail: AppDataChangedDetail = {}) {
  try {
    window.dispatchEvent(new CustomEvent<AppDataChangedDetail>(EVENT_NAME, { detail }))
  } catch {
    // noop
  }
}

export function onAppDataChanged(handler: (detail: AppDataChangedDetail) => void) {
  const listener = (evt: Event) => {
    const custom = evt as CustomEvent<AppDataChangedDetail>
    handler(custom.detail || {})
  }

  window.addEventListener(EVENT_NAME, listener)
  return () => window.removeEventListener(EVENT_NAME, listener)
}
