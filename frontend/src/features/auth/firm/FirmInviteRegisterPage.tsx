import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { authFirmLoginUrl } from '@/shared/constants/authPaths'
import { teamInvitePublicApi } from '@/infrastructure/api/contabil/teamManagement'
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
  emailHint: string
  fullNameHint?: string | null
  expiresAt: string
}

function normalizeInviteToken(raw?: string): string {
  const value = decodeURIComponent(String(raw || ''))
    .trim()
    .replace(/^\/+|\/+$/g, '')
  if (!value) return ''
  const hexMatch = value.match(/[a-f0-9]{64}/i)
  return hexMatch ? hexMatch[0].toLowerCase() : value
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-sm text-red-600">{message}</p>
}

export function FirmInviteRegisterPage() {
  const { token } = useParams<{ token: string }>()
  const normalizedToken = normalizeInviteToken(token)
  const navigate = useNavigate()
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
    if (!normalizedToken) {
      setLoadingPreview(false)
      setPreviewError('Link de convite inválido.')
      return
    }
    let cancelled = false
    void (async () => {
      setLoadingPreview(true)
      setPreviewError(null)
      try {
        const data = await teamInvitePublicApi.preview(normalizedToken)
        if (cancelled) return
        setPreview(data)
        setValue('email', data.emailHint || '')
        if (data.fullNameHint) setValue('fullName', data.fullNameHint)
      } catch (err) {
        if (cancelled) return
        const message = getErrorMessage(err)
        setPreview(null)
        setPreviewError(message)
        toast.error('Convite inválido', { description: message })
      } finally {
        if (!cancelled) setLoadingPreview(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [normalizedToken, setValue])

  const onValid = async (values: FormValues) => {
    if (!normalizedToken) return
    setSubmitting(true)
    try {
      const result = await teamInvitePublicApi.accept(normalizedToken, {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      })
      if (result?.emailSent === false) {
        toast.warning(
          'Conta criada, mas o e-mail de confirmação não foi enviado. Peça um novo link ao administrador.',
        )
      } else {
        toast.success('Conta criada. Confirme o e-mail para ativar o acesso.')
      }
      navigate(authFirmLoginUrl(), { replace: true })
    } catch (err) {
      toast.error('Não foi possível concluir o convite', { description: getErrorMessage(err) })
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
        Teglion
      </Link>

      <div className="mx-auto mt-10 w-full max-w-md flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loadingPreview ? (
          <p className="text-sm text-slate-500">A validar convite...</p>
        ) : preview ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Convite para equipa</p>
            <h1 className="mt-1 text-2xl font-semibold">{preview.firmName}</h1>
            <p className="mt-2 text-sm text-slate-600">
              Defina os seus dados de acesso. Após concluir, será necessário confirmar o e-mail.
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit(onValid, onInvalid)} noValidate>
              <div>
                <Label htmlFor="fullName">Nome</Label>
                <Input
                  id="fullName"
                  className="mt-1.5 h-11 rounded-xl"
                  autoComplete="name"
                  {...register('fullName')}
                />
                <FieldError message={errors.fullName?.message} />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="mt-1.5 h-11 rounded-xl bg-slate-50"
                  readOnly
                  {...register('email')}
                />
                <FieldError message={errors.email?.message} />
              </div>
              <div>
                <Label htmlFor="password">Palavra-passe</Label>
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
                {submitting ? 'A concluir...' : 'Criar palavra-passe e concluir'}
              </Button>
            </form>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600">{previewError || 'Convite inválido ou expirado.'}</p>
            <p className="text-sm text-slate-600">
              Se o administrador reenviou o convite, use apenas o link do e-mail mais recente.
            </p>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link to={authFirmLoginUrl()}>Ir para o login</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
