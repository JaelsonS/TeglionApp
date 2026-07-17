import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { api } from '@/infrastructure/api'
import { AuthCard } from '@/shared/components/auth/AuthCard'
import { AuthFooter } from '@/shared/components/auth/AuthFooter'
import { AuthHeader } from '@/shared/components/auth/AuthHeader'
import { AuthLayout } from '@/shared/components/auth/AuthLayout'
import { OfficeScreensCarousel } from '@/shared/components/auth/OfficeScreensCarousel'
import { authClientLoginUrl, authFirmLoginUrl } from '@/shared/constants/authPaths'
import { readFirmSlugFromRecoveryContext } from '@/shared/utils/recoveryAuth'
import { useApiToast } from '@/shared/hooks/useApiToast'
import { useAuth } from '@/shared/hooks/useAuth'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { PasswordInput } from '@/shared/components/ui/password-input'
import { Label } from '@/shared/components/ui/label'
import { COPY as recoverCopyByLocale } from './i18n'

const recoverSchema = z.object({
  email: z.string().min(1, 'REQUIRED').email('INVALID_EMAIL'),
})

type RecoverValues = z.infer<typeof recoverSchema>

const resetSchema = z
  .object({
    token: z.string().min(1, 'REQUIRED'),
    newPassword: z
      .string()
      .min(8, 'PASSWORD_MIN')
      .regex(/[A-Za-z]/, 'PASSWORD_LETTER_NUMBER')
      .regex(/\d/, 'PASSWORD_LETTER_NUMBER'),
    confirmPassword: z.string().min(1, 'REQUIRED'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'PASSWORD_MISMATCH',
  })

type ResetValues = z.infer<typeof resetSchema>

export function RecoverPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useApiToast()
  const { recoverPassword, resetPassword } = useAuth()
  const copy = recoverCopyByLocale['pt-PT']

  const [search] = useSearchParams()
  const tokenFromUrl = search.get('token') || ''
  const roleFromUrl = search.get('role')
  const roleFromState = String((location.state as { role?: string } | null)?.role || '')
  const profile = roleFromUrl === 'client' || roleFromState === 'client' ? 'client' : 'firm'
  const firmSlug = readFirmSlugFromRecoveryContext(
    search,
    (location.state as { firmSlug?: string } | null) ?? null,
  )

  const [recoverSent, setRecoverSent] = useState(false)

  const isReset = Boolean(tokenFromUrl)
  const backToLoginHref =
    profile === 'client' ? authClientLoginUrl(firmSlug) : authFirmLoginUrl()

  const recoverForm = useForm<RecoverValues>({
    resolver: zodResolver(recoverSchema),
    mode: 'onChange',
    defaultValues: { email: '' },
  })

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    mode: 'onChange',
    defaultValues: {
      token: tokenFromUrl,
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    resetForm.setValue('token', tokenFromUrl, { shouldDirty: false, shouldValidate: true })
  }, [resetForm, tokenFromUrl])

  const recoverErrors = recoverForm.formState.errors
  const resetErrors = resetForm.formState.errors

  const messages = {
    required: copy.validation.required,
    invalidEmail: copy.validation.invalidEmail,
    passwordMin: copy.validation.passwordMin,
    passwordLetterNumber: copy.validation.passwordLetterNumber,
    passwordMismatch: copy.validation.passwordMismatch,
    invalidOrExpired: copy.errors.invalidOrExpired,
    weakPassword: copy.errors.weakPassword,
    tooManyAttempts: copy.errors.tooManyAttempts,
    generic: copy.errors.generic,
  }

  const canRecover = recoverForm.formState.isValid && !recoverForm.formState.isSubmitting
  const canReset = resetForm.formState.isValid && !resetForm.formState.isSubmitting

  async function handleRecover(values: RecoverValues) {
    try {
      setRecoverSent(false)
      await recoverPassword({
        email: values.email,
        role: profile,
      })

      setRecoverSent(true)
      toast.success(copy.messages.requestSentTitle, { description: copy.messages.requestSentBody })
    } catch (err: any) {
      const status = err?.response?.status
      const code = err?.response?.data?.code || err?.code
      const message = err?.response?.data?.message || err?.message
      if (status === 429) {
        toast.error(messages.tooManyAttempts)
      } else if (status === 503 || code === 'EMAIL_UNAVAILABLE' || code === 'EMAIL_DELIVERY_FAILED') {
        toast.error(typeof message === 'string' && message.length > 8 ? message : 'Serviço de e-mail indisponível. Tente mais tarde ou contacte o suporte.')
      } else {
        toast.error(messages.generic)
      }
    }
  }

  async function handleReset(values: ResetValues) {
    try {
      const { confirmPassword, ...payload } = values
      void confirmPassword

      await resetPassword({
        ...payload,
      })

      toast.success(copy.messages.resetSuccessTitle, { description: copy.messages.resetSuccessBody })
      navigate(backToLoginHref, {
        replace: true,
        state: profile === 'client' ? { firmSlug } : undefined,
      })
    } catch (err: any) {
      const msg = String(err?.response?.data?.message || err?.message || '')
      const status = err?.response?.status

      if (status === 429) {
        toast.error(messages.tooManyAttempts)
        return
      }

      if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('expir')) {
        toast.error(messages.invalidOrExpired)
        return
      }

      if (msg.toLowerCase().includes('senha') || msg.toLowerCase().includes('password')) {
        toast.error(messages.weakPassword)
        return
      }

      toast.error(messages.generic)
    }
  }

  return (
    <AuthLayout
      title={isReset ? copy.titleReset : copy.titleRecover}
      subtitle={isReset ? copy.subtitleReset : copy.subtitleRecover}
      leftPanelSlot={<OfficeScreensCarousel />}
    >
      <div className="mx-auto max-w-md">
        <AuthCard>
          <AuthHeader
            title={isReset ? copy.titleReset : copy.titleRecover}
            subtitle={isReset ? copy.subtitleReset : copy.subtitleRecover}
          />

          <div className="mt-6 rounded-2xl border border-[#0f2942]/10 bg-[#0f2942]/5 px-4 py-3 text-sm text-slate-700">
            {copy.messages.ethics}
          </div>

          <div className="mt-8 space-y-5">
            {!isReset ? (
              <form onSubmit={recoverForm.handleSubmit(handleRecover)} className="space-y-5">
                <div>
                  <Label htmlFor="email">{copy.fields.email}</Label>
                  <Input
                    id="email"
                    autoComplete="email"
                    className="mt-3"
                    placeholder={copy.placeholders.email}
                    {...recoverForm.register('email')}
                  />
                  {recoverErrors.email && (
                    <p className="mt-2 text-sm text-red-600">
                      {recoverErrors.email.message === 'INVALID_EMAIL' ? messages.invalidEmail : messages.required}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={!canRecover} className="cb-btn-primary h-12 w-full rounded-2xl">
                  {recoverForm.formState.isSubmitting ? copy.actions.sending : copy.actions.sendLink}
                </Button>

                {recoverSent ? <p className="text-sm text-slate-600">{copy.messages.requestSentBody}</p> : null}
              </form>
            ) : (
              <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-5">
                <div>
                  <Label htmlFor="newPassword">{copy.fields.newPassword}</Label>
                  <div className="mt-3">
                    <PasswordInput
                      id="newPassword"
                      autoComplete="new-password"
                      placeholder={copy.placeholders.newPassword}
                      {...resetForm.register('newPassword')}
                    />
                  </div>
                  {resetErrors.newPassword && (
                    <p className="mt-2 text-sm text-red-600">
                      {resetErrors.newPassword.message === 'PASSWORD_MIN'
                        ? messages.passwordMin
                        : messages.passwordLetterNumber}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-slate-500">
                    {messages.passwordMin} · {messages.passwordLetterNumber}
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">{copy.fields.confirmPassword}</Label>
                  <div className="mt-3">
                    <PasswordInput
                      id="confirmPassword"
                      autoComplete="new-password"
                      placeholder={copy.placeholders.confirmPassword}
                      {...resetForm.register('confirmPassword')}
                    />
                  </div>
                  {resetErrors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">
                      {resetErrors.confirmPassword.message === 'PASSWORD_MISMATCH'
                        ? messages.passwordMismatch
                        : messages.required}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={!canReset} className="cb-btn-primary h-12 w-full rounded-2xl">
                  {resetForm.formState.isSubmitting ? copy.actions.resetting : copy.actions.resetPassword}
                </Button>
              </form>
            )}
          </div>
        </AuthCard>

        <AuthFooter className="mt-6">
          <Link to={backToLoginHref} className="font-semibold text-slate-900 hover:underline">
            {copy.actions.backToLogin}
          </Link>
          <span className="mx-2">·</span>
          <span>© {new Date().getFullYear()} {copy.brand}</span>
        </AuthFooter>
      </div>
    </AuthLayout>
  )
}