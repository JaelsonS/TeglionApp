import { useCallback, useEffect, useRef } from 'react'

/**
 * Debounce que faz flush do último pedido no unmount —
 * evita perder saves ao sair da ficha antes do delay.
 */
export function useDebouncedCallback<T extends (...args: never[]) => void>(fn: T, delayMs: number) {
  const fnRef = useRef(fn)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastArgsRef = useRef<Parameters<T> | null>(null)

  fnRef.current = fn

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
        if (lastArgsRef.current) {
          const args = lastArgsRef.current
          lastArgsRef.current = null
          fnRef.current(...args)
        }
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        const pending = lastArgsRef.current
        lastArgsRef.current = null
        if (pending) fnRef.current(...pending)
      }, delayMs)
    },
    [delayMs],
  ) as T
}
