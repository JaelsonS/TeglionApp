import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { api } from '@/infrastructure/api'
import { authClientLoginUrl, authFirmLoginUrl } from '@/shared/constants/authPaths'
import { normalizeRecoveryProfile, readFirmSlugFromRecoveryContext } from '@/shared/utils/recoveryAuth'
import { useApiToast } from '@/shared/hooks/useApiToast'
import { usePasswordStrength } from '@/shared/hooks/usePasswordStrength'
import { PasswordStrengthIndicator } from '@/shared/components/PasswordStrengthIndicator'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { PasswordInput } from '@/shared/components/ui/password-input'
import { Label } from '@/shared/components/ui/label'
import { PASSWORD_MIN_LENGTH, passwordPolicyMessages } from '@/shared/utils/passwordPolicy'

/**
 * Schema de validação — mensagens alinhadas com o backend.
 */
function buildResetPasswordSchema(t: (key: string) => string) {
  return z
    .object({
      newPassword: z
        .string()
        .min(PASSWORD_MIN_LENGTH, t('resetPassword.errors.min8'))
        .regex(/[A-Z]/, passwordPolicyMessages.uppercase)
        .regex(/[a-z]/, passwordPolicyMessages.lowercase)
        .regex(/\d/, passwordPolicyMessages.digit),
      confirmPassword: z.string().min(1, t('resetPassword.errors.confirmRequired')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('resetPassword.errors.mismatch'),
      path: ['confirmPassword'],
    })
}

type ResetPasswordValues = z.infer<ReturnType<typeof buildResetPasswordSchema>>

interface ResetPasswordStep {
  type: 'initial' | 'loading' | 'invalid-token' | 'success' | 'error'
  message?: string
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation('common')
  const toast = useApiToast()
  const [searchParams] = useSearchParams()

  // Estado
  const token = searchParams.get('token') || ''
  const roleFromState = String((location.state as { role?: string } | null)?.role || '')
  const profile = normalizeRecoveryProfile(roleFromState || searchParams.get('role'))
  const firmSlug = readFirmSlugFromRecoveryContext(
    searchParams,
    (location.state as { firmSlug?: string } | null) ?? null,
  )
  const backToLogin = profile === 'client' ? authClientLoginUrl(firmSlug) : authFirmLoginUrl()
  const recoverUrl =
    profile === 'client'
      ? firmSlug
        ? `/recover-password?role=client&firmSlug=${encodeURIComponent(firmSlug)}`
        : '/recover-password?role=client'
      : '/recover-password?role=firm'
  const [step, setStep] = useState<ResetPasswordStep>({ type: 'initial' })
  const [isValidatingToken, setIsValidatingToken] = useState(true)

  const resetPasswordSchema = useMemo(() => buildResetPasswordSchema(t), [t])

  useEffect(() => {
    document.title = t('resetPassword.documentTitle')
    return () => {
      document.title = 'TegLion — Escritórios de contabilidade'
    }
  }, [t])

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const newPassword = watch('newPassword')
  const passwordStrength = usePasswordStrength(newPassword)

  // Validar token ao carregar
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setStep({ type: 'invalid-token', message: t('resetPassword.tokenNotProvided', { defaultValue: 'Token não fornecido' }) })
        setIsValidatingToken(false)
        return
      }

      try {
        setIsValidatingToken(true)
        // Fazer requisição para validar token no backend
        await api.post('/auth/validate-reset-token', { token })
        setStep({ type: 'initial' })
      } catch (err: any) {
        const status = err?.response?.status
        const message = err?.response?.data?.message || err?.message || ''

        if (status === 400 || status === 401) {
          setStep({
            type: 'invalid-token',
            message: t('resetPassword.invalidOrExpiredTokenMessage', { defaultValue: 'Token inválido ou expirado. Solicite uma nova redefinição de senha.' }),
          })
        } else {
          setStep({
            type: 'error',
            message: t('resetPassword.validateTokenError', { defaultValue: 'Erro ao validar token. Tente novamente mais tarde.' }),
          })
        }
      } finally {
        setIsValidatingToken(false)
      }
    }

    validateToken()
  }, [token, t])

  // Envia a nova senha com o token do link
  async function onSubmit(values: ResetPasswordValues) {
    if (!token) {
      setStep({ type: 'invalid-token', message: t('resetPassword.expiredToken', { defaultValue: 'Token expirado' }) })
      return
    }

    try {
      setStep({ type: 'loading' })

      const response = await api.post('/auth/reset-password', {
        token,
        newPassword: values.newPassword,
      })

      setStep({ type: 'success' })
      toast.success(t('resetPassword.successRedirect3s', { defaultValue: 'Senha redefinida com sucesso! Você será redirecionado em 3 segundos.' }))

      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate(backToLogin, {
          replace: true,
          state: profile === 'client' ? { firmSlug } : undefined,
        })
      }, 3000)
    } catch (err: any) {
      const status = err?.response?.status
      const message = err?.response?.data?.message || ''

      if (status === 429) {
        setStep({
          type: 'error',
          message: t('resetPassword.tooManyAttempts', { defaultValue: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.' }),
        })
      } else if (status === 400 || status === 401) {
        setStep({
          type: 'invalid-token',
          message: t('resetPassword.invalidOrExpiredTokenMessage', { defaultValue: 'Token inválido ou expirado. Solicite uma nova redefinição de senha.' }), // Especifica a acao.
        })
      } else {
        setStep({
          type: 'error',
          message: t('resetPassword.genericResetError', { defaultValue: 'Erro ao redefinir senha. Tente novamente.' }),
        })
      }

      toast.error(err, t('resetPassword.resetErrorTitle', { defaultValue: 'Erro ao redefinir senha' }))
    }
  }

  // Estado: Validando token
  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <CardTitle>{t('resetPassword.validatingLink', { defaultValue: 'Validando link…' })}</CardTitle>
            <CardDescription>{t('resetPassword.validatingDescription', { defaultValue: 'Aguarde enquanto verificamos seu link de redefinição' })}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Estado: Token inválido ou expirado
  if (step.type === 'invalid-token') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <Card className="w-full max-w-md shadow-lg border-red-200">
          <CardHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-red-600">{t('resetPassword.expiredOrInvalidLink', { defaultValue: 'Link expirado ou inválido' })}</CardTitle>
            <CardDescription className="text-slate-600">{step.message}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                {t('resetPassword.linkExpiresHint', { defaultValue: 'O link de redefinição de senha expira após 15 minutos por segurança.' })}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-600 text-center">{t('resetPassword.whatYouCanDo', { defaultValue: 'O que você pode fazer:' })}</p>
              <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                <li>{t('resetPassword.requestNewLink', { defaultValue: 'Solicite um novo link de redefinição' })}</li>
                <li>{t('resetPassword.checkSpam', { defaultValue: 'Verifique sua caixa de spam' })}</li>
                <li>{t('resetPassword.contactSupport', { defaultValue: 'Entre em contato com o suporte' })}</li>
              </ol>
            </div>
          </CardContent>

          <CardContent className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={() => navigate(backToLogin, { replace: true })}>
              {t('resetPassword.backToLogin', { defaultValue: 'Voltar ao login' })}
            </Button>
            <Button
              className="flex-1"
              onClick={() =>
                navigate(recoverUrl, {
                  state: profile === 'client' ? { role: 'client', firmSlug } : { role: 'firm' },
                })
              }
            >
              {t('resetPassword.requestNewLinkButton', { defaultValue: 'Solicitar novo link' })}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado: Sucesso
  if (step.type === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <Card className="w-full max-w-md shadow-lg border-green-200">
          <CardHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-green-600">{t('resetPassword.passwordResetSuccessTitle', { defaultValue: 'Senha redefinida com sucesso!' })}</CardTitle>
            <CardDescription>{t('resetPassword.redirectingToLoginSoon', { defaultValue: 'Você será redirecionado para o login em alguns segundos.' })}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                {t('resetPassword.canLoginNow', { defaultValue: 'Você pode agora fazer login com sua nova senha.' })}
              </p>
            </div>

            <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 animate-[slideInFromLeft_3s_ease-in-out]" />
            </div>
          </CardContent>

          <CardContent className="pt-4 border-t">
            <Button
              className="w-full"
              onClick={() =>
                navigate(backToLogin, {
                  replace: true,
                  state: profile === 'client' ? { firmSlug } : undefined,
                })
              }
            >
              {t('resetPassword.goToLoginNow', { defaultValue: 'Ir para login agora' })}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado: Erro
  if (step.type === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <Card className="w-full max-w-md shadow-lg border-orange-200">
          <CardHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-orange-600">{t('resetPassword.resetErrorTitle', { defaultValue: 'Erro ao redefinir senha' })}</CardTitle>
            <CardDescription>{step.message}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-700">
                {t('resetPassword.securityReasonExpiredHint', { defaultValue: 'Por motivos de segurança, o link pode ter expirado. Solicite um novo link.' })}
              </p>
            </div>
          </CardContent>

          <CardContent className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={() => navigate(backToLogin, { replace: true })}>
              {t('resetPassword.backToLogin', { defaultValue: 'Voltar ao login' })}
            </Button>
            <Button className="flex-1" onClick={() => navigate('/recover-password', { state: { role: profile } })}>
              {t('resetPassword.requestNewLinkButton', { defaultValue: 'Solicitar novo link' })}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado: Formulário ativo
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">{t('resetPassword.title', { defaultValue: 'Redefinir senha' })}</CardTitle>
          <CardDescription>
            {t('resetPassword.subtitle', { defaultValue: 'Digite sua nova senha para reativar sua conta' })}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Campo: Nova Senha */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="font-medium">
                {t('resetPassword.newPasswordLabel', { defaultValue: 'Nova senha' })}
              </Label>

              <div className="relative">
                <PasswordInput
                  id="newPassword"
                  placeholder={t('resetPassword.newPasswordPlaceholder', { defaultValue: 'Digite sua nova senha' })}
                  {...register('newPassword')}
                  className={errors.newPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  autoComplete="new-password"
                />
              </div>

              {errors.newPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.newPassword.message}
                </p>
              )}

              {/* Indicador de força */}
              {newPassword && (
                <PasswordStrengthIndicator
                  strength={passwordStrength.strength}
                  score={passwordStrength.score}
                  message={passwordStrength.message}
                  feedback={passwordStrength.feedback}
                  showFeedback={true}
                />
              )}
            </div>

            {/* Campo: Confirmar Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-medium">
                {t('resetPassword.confirmPasswordLabel', { defaultValue: 'Confirmar senha' })}
              </Label>

              <div className="relative">
                <PasswordInput
                  id="confirmPassword"
                  placeholder={t('resetPassword.confirmPasswordPlaceholder', { defaultValue: 'Confirme sua nova senha' })}
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  autoComplete="new-password"
                />
              </div>

              {errors.confirmPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Dicas de segurança */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-900 mb-2">{t('resetPassword.securityTipTitle', { defaultValue: 'Dica de segurança' })}</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>{t('resetPassword.securityTipUnique', { defaultValue: 'Use uma senha única (não reutilize)' })}</li>
                <li>{t('resetPassword.securityTipMinLength', { defaultValue: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres` })}</li>
                <li>{t('resetPassword.securityTipMixChars', { defaultValue: 'Misture maiúsculas, minúsculas e números' })}</li>
              </ul>
            </div>

            {/* Botão Submit — nunca desactivar por isValid (em mobile parece “não funcionar”) */}
            <Button
              type="submit"
              className="h-12 w-full touch-manipulation text-base"
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  {t('resetPassword.submitting', { defaultValue: 'Redefinindo…' })}
                </>
              ) : (
                t('resetPassword.submitButton', { defaultValue: 'Redefinir senha' })
              )}
            </Button>
          </form>
        </CardContent>

        <CardContent className="pt-4 border-t flex justify-center">
          <button
            onClick={() => navigate(backToLogin, { replace: true })}
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            {t('resetPassword.backToLogin', { defaultValue: 'Voltar ao login' })}
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
