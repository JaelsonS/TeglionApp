import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'

import { authApi, clearClientCsrfCache, prefetchAuthCsrf } from '@/infrastructure/api'
import type { AuthContextValue } from '@/shared/types/auth'
import { authStorage } from '@/shared/utils/authStorage'
import { subscribeAuthChannel } from '@/shared/utils/authRefreshCoordinator'
import { Sentry } from '@/shared/lib/sentry'
import {
  isFirmAccessDeniedError,
  isRecoverableBootstrapError,
  isRefreshTokenMissingError,
} from '@/shared/utils/errors'
import { logger } from '@/shared/utils/logger'
import { writeClientLoginBranding } from '@/shared/utils/clientLoginBrandingStorage'
import { tryNormalizeAuthUser } from '@/shared/utils/authNormalize'
import { authClientLoginUrl, authFirmLoginUrl } from '@/shared/constants/authPaths'
import { getRateLimitBackoffMs } from '@/shared/utils/rate-limit-backoff'
import {
  clearBillingStatusCache,
  seedBillingStatusFromLogin,
} from '@/shared/utils/billingStatusCache'

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const bootstrappedRef = useRef(false)

  const clearSession = useCallback(() => {
    authStorage.clear()
    clearBillingStatusCache()
    bootstrappedRef.current = false
    setUser(null)
    if (Sentry) {
      Sentry.setUser(null)
    }
  }, [])

  const setSession = useCallback((nextUser: unknown): boolean => {
    const normalized = tryNormalizeAuthUser(nextUser)
    if (!normalized) {
      clearSession()
      return false
    }
    authStorage.clear()
    bootstrappedRef.current = true
    setUser(normalized)
    if (Sentry) {
      Sentry.setUser({
        id: normalized.id,
        role: normalized.role,
        tenantSlug: normalized.tenant?.slug,
        clientId: normalized.clientId || undefined,
      })
      Sentry.setTag('user_role', normalized.role)
      if (normalized.tenant?.slug) {
        Sentry.setTag('tenant_slug', normalized.tenant.slug)
      }
      if (normalized.clientId) {
        Sentry.setTag('client_id', normalized.clientId)
      }
    }
    return true
  }, [clearSession])

  const bootstrap = useCallback(async () => {
    const finishWithUser = (mePayload: { user?: unknown } | null | undefined) => {
      const normalized = tryNormalizeAuthUser(mePayload?.user)
      if (normalized) {
        setUser(normalized)
        return true
      }
      return false
    }

    try {
      authStorage.clear()

      const [, meResult] = await Promise.allSettled([prefetchAuthCsrf(), authApi.me()])

      if (meResult.status === 'fulfilled') {
        if (finishWithUser(meResult.value)) return
      } else {
        const err = meResult.reason
        if (isAxiosError(err) && err.response?.status === 429) {
          await sleep(getRateLimitBackoffMs(err, 5_000))
          try {
            const meRetry = await authApi.me()
            if (finishWithUser(meRetry)) return
          } catch (retryErr) {
            if (isRecoverableBootstrapError(retryErr)) return
          }
        } else if (isRecoverableBootstrapError(err)) {
          return
        }
      }

      try {
        const refreshed = await authApi.refresh()
        if (!refreshed?.ok) {
          clearSession()
          return
        }
        const me2 = await authApi.me()
        if (finishWithUser(me2)) return
      } catch (refreshErr) {
        if (isFirmAccessDeniedError(refreshErr)) {
          clearSession()
          return
        }
        if (isRefreshTokenMissingError(refreshErr)) {
          clearSession()
          return
        }
        if (isRecoverableBootstrapError(refreshErr)) return
        throw refreshErr
      }

      clearSession()
    } catch (err) {
      if (!isRecoverableBootstrapError(err)) clearSession()
    } finally {
      setIsBootstrapping(false)
    }
  }, [clearSession])

  const isAppArea = location.pathname.startsWith('/app')
  const ssoBootstrapPending = useRef(false)

  useEffect(() => {
    if (!isAppArea) {
      setIsBootstrapping(false)
      return
    }
    const params = new URLSearchParams(location.search)
    if (params.get('sso') === '1') {
      ssoBootstrapPending.current = true
      bootstrappedRef.current = false
      params.delete('sso')
      const nextSearch = params.toString()
      navigate(
        { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' },
        { replace: true },
      )
    }
    if (user) {
      setIsBootstrapping(false)
      return
    }
    if (bootstrappedRef.current && !ssoBootstrapPending.current) return
    bootstrappedRef.current = true
    ssoBootstrapPending.current = false
    setIsBootstrapping(true)
    void bootstrap()
  }, [bootstrap, isAppArea, user, location.pathname, location.search, navigate])

  useEffect(() => {
    const onExpired = () => {
      toast.error(t('errors.sessionExpired'), {
        description: t('errors.sessionExpiredDescription'),
        duration: 5000,
      })
    }
    window.addEventListener('auth:session-expired', onExpired as EventListener)
    return () => window.removeEventListener('auth:session-expired', onExpired as EventListener)
  }, [t])

  useEffect(() => {
    return subscribeAuthChannel({
      onSessionRefreshed: () => {
        void authApi
          .me()
          .then((me) => {
            const normalized = tryNormalizeAuthUser(me?.user)
            if (normalized) setUser(normalized)
          })
          .catch(() => { })
      },
      onLogout: () => {
        clearSession()
      },
    })
  }, [clearSession])

  const refreshProfileIfNeeded = useCallback((role: string, consultantId?: string, clientId?: string) => {
    const needsRefresh =
      (role === 'CONSULTANT' && !consultantId) || (role === 'CLIENT' && !clientId)
    if (!needsRefresh) return
    authApi
      .me()
      .then((me) => {
        const u = tryNormalizeAuthUser(me?.user)
        if (u) setUser(u)
      })
      .catch(() => { })
  }, [])

  const loginFirm = useCallback(
    async (payload: Parameters<AuthContextValue['loginFirm']>[0]) => {
      const res = await authApi.loginFirm(payload)
      if (!setSession(res.user)) {
        throw new Error(String(t('errors.authPayloadInvalid', { defaultValue: 'Resposta de autenticação inválida.' })))
      }
      seedBillingStatusFromLogin(res.firmAccess)
      refreshProfileIfNeeded(res.user?.role, res.user?.consultantId, res.user?.clientId)
      if (res.firmAccess?.hasAccess === false && res.firmAccess.reason === 'TRIAL_EXPIRED') {
        toast.error('O período de teste terminou. Active o plano para voltar ao escritório.')
      } else {
        toast.success(t('auth.loginSuccess'))
      }
      return res
    },
    [setSession, refreshProfileIfNeeded, t],
  ) as AuthContextValue['loginFirm']

  const loginClient = useCallback(
    async (payload: Parameters<AuthContextValue['loginClient']>[0]) => {
      const res = await authApi.loginClient(payload)
      if (!setSession(res.user)) {
        throw new Error(String(t('errors.authPayloadInvalid', { defaultValue: 'Resposta de autenticação inválida.' })))
      }
      if (res.user?.role === 'CLIENT' && res.user.tenant) {
        writeClientLoginBranding(res.user.tenant)
      }
      refreshProfileIfNeeded(res.user?.role, res.user?.consultantId, res.user?.clientId)
      toast.success(t('auth.loginSuccess'))
      return res
    },
    [setSession, refreshProfileIfNeeded, t],
  ) as AuthContextValue['loginClient']

  const registerFirm = useCallback(
    async (payload: Parameters<AuthContextValue['registerFirm']>[0]) => {
      const res = await authApi.registerFirm(payload)
      if (!setSession(res.user)) {
        throw new Error(String(t('errors.authPayloadInvalid', { defaultValue: 'Resposta de autenticação inválida.' })))
      }
      toast.success(t('auth.registerSuccess'))
      return res
    },
    [setSession, t],
  ) as AuthContextValue['registerFirm']

  function clearOperationalSessionCaches() {
    if (typeof window === 'undefined') return
    try {
      const prefixes = [
        'contabil:clients:list',
        'contabil:dashboard:owner',
        'contabil:dashboard:admin',
      ]
      for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
        const key = window.sessionStorage.key(index)
        if (key && prefixes.some((prefix) => key === prefix || key.startsWith(`${prefix}:`))) {
          window.sessionStorage.removeItem(key)
        }
      }
    } catch {
      /* ignore */
    }
  }

  const logout = useCallback(async () => {
    if (user?.role === 'CLIENT' && user.tenant) {
      writeClientLoginBranding(user.tenant)
    }

    const redirectPath =
      user?.role === 'CLIENT' ? authClientLoginUrl() : authFirmLoginUrl()

    try {
      await authApi.logout()
    } catch (error) {
      logger.warn('Erro ao fazer logout no servidor', error)
    } finally {
      clearClientCsrfCache()
      clearOperationalSessionCaches()
      navigate(redirectPath, { replace: true })
      clearSession()
      toast.message(t('auth.logoutSuccess'))
    }
  }, [clearSession, navigate, t, user?.role, user?.tenant]) as AuthContextValue['logout']

  const recoverPassword = useCallback(async (payload: { email: string; country?: string; locale?: string }) => {
    return authApi.recover(payload)
  }, []) as AuthContextValue['recoverPassword']

  const resetPassword = useCallback(
    async (payload: { token: string; newPassword: string; country?: string; locale?: string }) => {
      return authApi.reset(payload)
    },
    [],
  ) as AuthContextValue['resetPassword']

  const refreshUser = useCallback(async () => {
    const me = await authApi.me()
    setSession(me?.user)
  }, [setSession]) as AuthContextValue['refreshUser']

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      loginFirm,
      loginClient,
      registerFirm,
      logout,
      recoverPassword,
      resetPassword,
      setUser,
      setSession,
      refreshUser,
    }),
    [
      user,
      isBootstrapping,
      loginFirm,
      loginClient,
      registerFirm,
      logout,
      recoverPassword,
      resetPassword,
      setSession,
      refreshUser,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
