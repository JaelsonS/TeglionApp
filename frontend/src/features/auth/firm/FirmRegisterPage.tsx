import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { MailCheck } from 'lucide-react'

import { AuthCard } from '@/shared/components/auth/AuthCard'
import { AuthDivider } from '@/shared/components/auth/AuthDivider'
import { AuthFooter } from '@/shared/components/auth/AuthFooter'
import { AuthHeader } from '@/shared/components/auth/AuthHeader'
import { AuthLayout } from '@/shared/components/auth/AuthLayout'
import { GoogleAuthButton } from '@/shared/components/auth/GoogleAuthButton'
import { OfficeScreensCarousel } from '@/shared/components/auth/OfficeScreensCarousel'
import { contabilPt as t } from '@/shared/i18n/contabilPt'
import { authFirmLoginUrl, authProfileChoiceUrl } from '@/shared/constants/authPaths'
import { contabilFirmApi, getGoogleAuthStartUrl } from '@/infrastructure/api'
import { useAuth } from '@/shared/hooks/useAuth'
import { getErrorMessage } from '@/shared/utils/errors'
import { Input } from '@/shared/components/ui/input'
import { PasswordInput } from '@/shared/components/ui/password-input'
import { Label } from '@/shared/components/ui/label'
import {
  LegalConsentBlock,
  buildFirmLegalConsentPayload,
  emptyFirmLegalConsent,
  isFirmLegalConsentComplete,
  type FirmLegalConsentState,
} from '@/shared/components/legal/LegalConsentBlock'
import { passwordPolicySchema } from '@/shared/utils/passwordPolicy'

const schema = z.object({
  firmName: z.string().min(2, 'Nome do escritório obrigatório'),
  ownerName: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: passwordPolicySchema,
})

type FormValues = z.infer<typeof schema>

type PendingConfirm = {
  email: string
  firmName: string
  emailSent: boolean
}

export function FirmRegisterPage() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [legal, setLegal] = useState<FirmLegalConsentState>(emptyFirmLegalConsent)
  const [legalError, setLegalError] = useState<string | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)
  const countryCode = 'PT'

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firmName: '', ownerName: '', email: '', password: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isFirmLegalConsentComplete(legal)) {
      setLegalError('Deve aceitar todos os documentos legais para criar a conta.')
      return
    }
    setLegalError(null)
    setSubmitting(true)
    try {
      const res = (await contabilFirmApi.register({
        firmName: values.firmName.trim(),
        ownerName: values.ownerName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        countryCode,
        legalConsents: buildFirmLegalConsentPayload(legal),
      })) as {
        needsEmailConfirmation?: boolean
        emailSent?: boolean
        email?: string
        firmName?: string
        message?: string
        user?: unknown
      }

      if (res.needsEmailConfirmation) {
        setPendingConfirm({
          email: res.email || values.email.trim().toLowerCase(),
          firmName: res.firmName || values.firmName.trim(),
          emailSent: res.emailSent !== false,
        })
        toast.success('Conta criada — confirme o e-mail para activar')
        return
      }

      if (!setSession(res.user as never)) {
        toast.warning(
          'Conta criada. Como não foi possível iniciar sessão automaticamente, inicie sessão com o mesmo e‑mail.',
        )
        navigate(authFirmLoginUrl(), { replace: true })
        return
      }
      toast.success('Conta criada com sucesso')
      navigate('/app/firm/dashboard', { replace: true })
    } catch (err) {
      let title = 'Não foi possível criar a conta'
      if (isAxiosError(err)) {
        const status = err.response?.status
        const code = String((err.response?.data as { code?: string })?.code || '').toUpperCase()
        if (status === 409) title = 'Este e‑mail já está registado'
        else if (status === 500)
          title = 'Erro temporário no servidor — tente de novo ou use recuperação de palavra-passe se já tentou antes'
        else if (status === 403 && code === 'CSRF_INVALID')
          title = 'Sessão de segurança expirada. Actualize a página e tente de novo.'
        else if (code === 'LEGAL_CONSENT_REQUIRED' || code === 'LEGAL_CONSENT_INCOMPLETE')
          title = 'Aceite todos os documentos legais'
        else if (code === 'LEGAL_VERSION_MISMATCH')
          title = 'Documentos legais actualizados — recarregue a página'
      }
      toast.error(title, { description: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <AuthLayout
      title="Começar com o Teglion"
      subtitle="Registe o seu escritório e comece a gerir clientes e obrigações com confiança."
      leftPanelSlot={<OfficeScreensCarousel />}
    >
      <div className="mx-auto max-w-md">
        <AuthCard>
          {pendingConfirm ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <MailCheck className="h-7 w-7" aria-hidden />
              </div>
              <AuthHeader
                title="Confirme o seu e-mail"
                subtitle={`Enviámos um link para ${pendingConfirm.email}`}
              />
              <div className="mt-6 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-left text-sm text-emerald-900">
                <p>
                  A conta do escritório <strong>{pendingConfirm.firmName}</strong> foi criada.
                </p>
                <p>
                  {pendingConfirm.emailSent
                    ? 'Abra a caixa de entrada (e o spam), clique em «Confirmar e-mail» e depois entre no login com a palavra-passe que definiu.'
                    : 'Não foi possível enviar o e-mail agora. Tente mais tarde ou contacte o suporte Teglion.'}
                </p>
                <p className="text-emerald-800/90">O link é válido durante 48 horas.</p>
              </div>
              <Link
                to={authFirmLoginUrl()}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#0f2942] to-[#195285] text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,41,66,0.28)] transition hover:brightness-105"
              >
                Ir para o login
              </Link>
            </div>
          ) : (
            <>
              <AuthHeader
                title="Criar conta de escritório"
                subtitle="Insira os dados básicos e aceite os termos legais para começar."
              />

              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Depois de criar a conta, confirma o e-mail — só assim o acesso fica activo. Com Google, o e-mail
                já vem confirmado.
              </div>

              <form id="email-register" className="mt-8 space-y-5" onSubmit={(e) => void onSubmit(e)}>
                <div>
                  <Label htmlFor="firmName">{t.auth.firmName}</Label>
                  <Input id="firmName" className="mt-3" {...form.register('firmName')} />
                  {form.formState.errors.firmName ? (
                    <p className="mt-2 text-sm text-red-600">{form.formState.errors.firmName.message}</p>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="ownerName">{t.auth.ownerName}</Label>
                  <Input id="ownerName" className="mt-3" {...form.register('ownerName')} />
                </div>

                <div>
                  <Label htmlFor="email">{t.auth.email}</Label>
                  <Input id="email" type="email" autoComplete="email" className="mt-3" {...form.register('email')} />
                </div>

                <div>
                  <Label htmlFor="password">{t.auth.password}</Label>
                  <div className="mt-3">
                    <PasswordInput id="password" autoComplete="new-password" {...form.register('password')} />
                  </div>
                </div>

                <LegalConsentBlock
                  value={legal}
                  onChange={(next) => {
                    setLegal(next)
                    if (isFirmLegalConsentComplete(next)) setLegalError(null)
                  }}
                  disabled={submitting}
                  error={legalError}
                />

                <button
                  type="submit"
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#0f2942] to-[#195285] text-white shadow-[0_14px_28px_rgba(15,41,66,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submitting || !isFirmLegalConsentComplete(legal)}
                >
                  {submitting ? 'A criar…' : t.auth.registerSubmit}
                </button>

                <AuthDivider label="ou" />

                <GoogleAuthButton
                  href={getGoogleAuthStartUrl({ intent: 'register', countryCode })}
                  label="Continuar com Google"
                  disabled={submitting}
                />

                <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-slate-600">Já possui conta?</span>
                  <Link to={authFirmLoginUrl()} className="font-medium text-slate-900 hover:underline">
                    Entrar
                  </Link>
                </div>
              </form>
            </>
          )}
        </AuthCard>

        <AuthFooter className="mt-6">
          <Link to={authProfileChoiceUrl('login')} className="font-semibold text-slate-900 hover:underline">
            Voltar à escolha de perfil
          </Link>
        </AuthFooter>
      </div>
    </AuthLayout>
  )
}
