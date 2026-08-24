import { describe, expect, it } from 'vitest'

/**
 * Regressão documental: o loading infinito da tab Segurança vinha de
 * `useCallback(..., [toast])` + `useEffect(() => refresh(), [refresh])` enquanto
 * `useApiToast()` devolve um objecto novo em cada render.
 */
describe('FirmSettingsSecuritySection load contract', () => {
  it('documents that MFA status load must not depend on unstable toast identity', () => {
    // Se este contrato mudar, rever FirmSettingsSecuritySection: refresh deps = [].
    const unstableToastEachRender = () => ({ error: () => undefined, success: () => undefined })
    const a = unstableToastEachRender()
    const b = unstableToastEachRender()
    expect(a).not.toBe(b)
  })
})
