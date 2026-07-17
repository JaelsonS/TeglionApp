import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { contabilPt as t } from '@/shared/i18n/contabilPt'
import { authClientLoginUrl } from '@/shared/constants/authPaths'
import { api } from '@/infrastructure/api'
import { useAuth } from '@/shared/hooks/useAuth'
import { getErrorMessage } from '@/shared/utils/errors'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { PasswordInput } from '@/shared/components/ui/password-input'
import { Label } from '@/shared/components/ui/label'
import { PASSWORD_MIN_LENGTH, passwordPolicySchema } from '@/shared/utils/passwordPolicy'

const schema = z
  .object({
    fullName: z.string().min(2, 'Nome obrigatório'),
    email: z.string().email('E-mail inválido'),
    password: passwordPolicySchema,
    confirmPassword: z.string().min(1, 'Confirme a palavra-passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As palavras-passe não coincidem',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

type InvitePreview = {
  firmName: string
  clientName?: string | null
  emailHint?: string | null
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-sm text-red-600">{message}</p>
}

export function ClientInviteRegisterPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form

  useEffect(() => {
    if (!token) {
      setLoadingPreview(false)
      setPreviewError(t.invite.invalid)
      return
    }
    let cancelled = false
    void (async () => {
      setLoadingPreview(true)
      setPreviewError(null)
      try {
        const data = (await api.get(`/public/client-invite/${encodeURIComponent(token)}`)).data as InvitePreview
        if (cancelled) return
        setPreview(data)
        if (data.emailHint) setValue('email', data.emailHint)
        if (data.clientName) setValue('fullName', data.clientName)
      } catch (err) {
        if (cancelled) return
        const message = getErrorMessage(err)
        setPreview(null)
        setPreviewError(message)
        toast.error(t.invite.invalid, { description: message })
      } finally {
        if (!cancelled) setLoadingPreview(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, setValue])

  const onValid = async (values: FormValues) => {
    if (!token) return
    setSubmitting(true)
    try {
      const res = await api.post('/auth/register-client-invite', {
        token,
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      })
      const data = res.data as { user: unknown }
      if (!data?.user || !setSession(data.user)) {
        toast.warning(
          'Conta criada. Como não foi possível iniciar sessão automaticamente, inicie sessão com o mesmo e‑mail.',
        )
        navigate(authClientLoginUrl(), { replace: true })
        return
      }
      toast.success('Conta criada com sucesso')
      navigate('/app/client', { replace: true })
    } catch (err) {
      toast.error('Não foi possível criar a conta', { description: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  const onInvalid = () => {
    toast.error('Verifique os dados', {
      description: `A palavra-passe precisa de pelo menos ${PASSWORD_MIN_LENGTH} caracteres, com maiúscula, minúscula e número.`,
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 px-5 py-10 pb-24">
      <Link to="/" className="text-sm font-semibold text-[#2563eb]">
        {t.brand}
      </Link>

      <div className="mx-auto mt-10 w-full max-w-md flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loadingPreview ? (
          <p className="text-sm text-slate-500">{t.invite.loading}</p>
        ) : preview ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.invite.invitedBy}</p>
            <h1 className="mt-1 text-2xl font-semibold">{preview.firmName}</h1>
            <p className="mt-2 text-sm text-slate-600">{t.invite.title}</p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit(onValid, onInvalid)} noValidate>
              <div>
                <Label htmlFor="fullName">{t.invite.name}</Label>
                <Input id="fullName" className="mt-1.5 h-11 rounded-xl" autoComplete="name" {...register('fullName')} />
                <FieldError message={errors.fullName?.message} />
              </div>
              <div>
                <Label htmlFor="email">{t.invite.email}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="mt-1.5 h-11 rounded-xl bg-slate-50"
                  readOnly={Boolean(preview.emailHint)}
                  {...register('email')}
                />
                <FieldError message={errors.email?.message} />
              </div>
              <div>
                <Label htmlFor="password">{t.invite.password}</Label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  className="mt-1.5 h-11 rounded-xl"
                  {...register('password')}
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Mínimo {PASSWORD_MIN_LENGTH} caracteres, com maiúscula, minúscula e número.
                </p>
                <FieldError message={errors.password?.message} />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar palavra-passe</Label>
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  className="mt-1.5 h-11 rounded-xl"
                  {...register('confirmPassword')}
                />
                <FieldError message={errors.confirmPassword?.message} />
              </div>
              <Button
                type="submit"
                className="h-12 w-full touch-manipulation rounded-full text-base"
                disabled={submitting}
              >
                {submitting ? 'A criar…' : t.invite.submit}
              </Button>
            </form>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600">{previewError || t.invite.invalid}</p>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link to={authClientLoginUrl()}>Ir para o login</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
