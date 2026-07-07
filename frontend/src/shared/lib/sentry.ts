import * as Sentry from '@sentry/react'

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  const release =
    import.meta.env.VITE_APP_VERSION ||
    import.meta.env.VITE_SENTRY_RELEASE ||
    import.meta.env.VITE_BUILD_VERSION ||
    import.meta.env.npm_package_version ||
    'unknown'

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

  Sentry.setTag('service', 'contabil-frontend')
  Sentry.setTag('platform', 'web')
  Sentry.setTag('environment', import.meta.env.MODE)
  Sentry.setTag('app.version', release)
}

export { Sentry }
