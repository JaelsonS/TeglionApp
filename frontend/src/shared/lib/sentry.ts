import * as Sentry from '@sentry/react'

function normalizeSentryDsn(raw: unknown): string {
  let value = String(raw || '').trim()
  if (!value) return ''
  value = value.replace(/^['"]+|['"]+$/g, '').trim()
  return value
}

/** Vite `MODE` em builds de staging.teglion.com é `production` — distinguir via env/host. */
function resolveSentryEnvironment(): string {
  const fromEnv = String(import.meta.env.VITE_SENTRY_ENVIRONMENT || '').trim()
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase()
    if (host === 'staging.teglion.com' || host.endsWith('.staging.teglion.com')) return 'staging'
    if (host === 'teglion.com' || host === 'www.teglion.com') return 'production'
  }
  return import.meta.env.MODE || 'development'
}

/** Chunks Vite com hash mudam a cada deploy — erros de "Failed to fetch dynamically imported module" são esperados com abas antigas. */
function isStaleChunkLoadError(event: Sentry.ErrorEvent, hint?: Sentry.EventHint): boolean {
  const messages: string[] = []
  if (event.message) messages.push(event.message)
  for (const ex of event.exception?.values || []) {
    if (ex.value) messages.push(ex.value)
    if (ex.type) messages.push(ex.type)
  }
  const hintError = hint?.originalException
  if (hintError instanceof Error) messages.push(hintError.message)
  else if (typeof hintError === 'string') messages.push(hintError)

  const text = messages.join(' ')
  return (
    text.includes('Failed to fetch dynamically imported module') ||
    text.includes('Importing a module script failed') ||
    text.includes('Loading chunk') ||
    text.includes('error loading dynamically imported module')
  )
}

export function initSentry() {
  const dsn = normalizeSentryDsn(import.meta.env.VITE_SENTRY_DSN)
  if (!dsn) return

  // Accept only canonical Sentry DSN format to avoid runtime parser errors from malformed env values.
  if (!/^https:\/\/[0-9a-f]+@o\d+\.ingest(\.de)?\.sentry\.io\/\d+$/i.test(dsn)) return

  const release =
    import.meta.env.VITE_APP_VERSION ||
    import.meta.env.VITE_SENTRY_RELEASE ||
    import.meta.env.VITE_BUILD_VERSION ||
    import.meta.env.npm_package_version ||
    'unknown'

  const environment = resolveSentryEnvironment()
  // Staging e prod fazem build Vite `production` — amostrar ambos; local/dev fica quieto.
  const isDeployedBuild = import.meta.env.PROD

  try {
    Sentry.init({
      dsn,
      release,
      environment,
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
      tracesSampleRate: isDeployedBuild ? 0.1 : 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: isDeployedBuild ? 1.0 : 0,
      sendDefaultPii: false,
      beforeSend(event, hint) {
        if (isStaleChunkLoadError(event, hint)) {
          return null
        }
        if (event.request?.url) {
          event.request.url = String(event.request.url).split('?')[0]
        }
        return event
      },
      ignoreErrors: [
        'Failed to fetch dynamically imported module',
        'Importing a module script failed',
        /Loading chunk [\d]+ failed/i,
        /error loading dynamically imported module/i,
      ],
    })
  } catch {
    return
  }

  Sentry.setTag('service', 'contabil-frontend')
  Sentry.setTag('platform', 'web')
  Sentry.setTag('environment', environment)
  Sentry.setTag('app.version', release)
}

export { Sentry, isStaleChunkLoadError }
