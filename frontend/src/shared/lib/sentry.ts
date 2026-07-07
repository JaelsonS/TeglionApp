import * as Sentry from '@sentry/react'

function normalizeSentryDsn(raw: unknown): string {
  let value = String(raw || '').trim()
  if (!value) return ''
  value = value.replace(/^['"]+|['"]+$/g, '').trim()
  return value
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

  try {
    Sentry.init({
      dsn,
      release,
      environment: import.meta.env.MODE,
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: import.meta.env.PROD ? 1.0 : 0,
      sendDefaultPii: false,
      beforeSend(event) {
        if (event.request?.url) {
          event.request.url = String(event.request.url).split('?')[0]
        }
        return event
      },
    })
  } catch {
    return
  }

  Sentry.setTag('service', 'contabil-frontend')
  Sentry.setTag('platform', 'web')
  Sentry.setTag('environment', import.meta.env.MODE)
  Sentry.setTag('app.version', release)
}

export { Sentry }
