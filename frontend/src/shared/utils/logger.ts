import { redactInternalIdentifiers } from '@/shared/utils/sanitizePublicDisplay'

type LogMethod = (...args: unknown[]) => void

const isDev = import.meta.env.DEV

const noop: LogMethod = () => {}

function redactArgs(args: unknown[]): unknown[] {
  return args.map((arg) => {
    if (typeof arg === 'string') return redactInternalIdentifiers(arg)
    if (arg instanceof Error && arg.message) {
      const clone = new Error(redactInternalIdentifiers(arg.message))
      clone.name = arg.name
      clone.stack = arg.stack
      return clone
    }
    if (arg && typeof arg === 'object') {
      try {
        const serialized = JSON.stringify(arg)
        return JSON.parse(redactInternalIdentifiers(serialized)) as unknown
      } catch {
        return arg
      }
    }
    return arg
  })
}

function wrap(method: LogMethod): LogMethod {
  return (...args: unknown[]) => method(...redactArgs(args))
}

export const logger = {
  log: isDev ? wrap(console.log.bind(console)) : noop,
  info: isDev ? wrap(console.info.bind(console)) : noop,
  warn: wrap(console.warn.bind(console)),
  error: wrap(console.error.bind(console)),
}
