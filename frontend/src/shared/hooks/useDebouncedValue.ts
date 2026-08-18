import { useEffect, useState } from 'react'

/**
 * Valor com atraso — para pesquisas. Cancela o timer no unmount
 * (não dispara um fetch extra depois de sair do ecrã).
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
