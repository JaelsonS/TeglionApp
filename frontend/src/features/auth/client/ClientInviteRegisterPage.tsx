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
import { Label } from '@/shared/components/ui/label'
import { passwordPolicySchema } from '@/shared/utils/passwordPolicy'

const schema = z.object({
  fullName: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: passwordPolicySchema,
})

type FormValues = z.infer<typeof schema>

type InvitePreview = {
  firmName: string
  clientName?: string | null
  emailHint?: string | null
}

export function ClientInviteRegisterPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '' },
  })

  useEffect(() => {
    if (!token) return
    void (async () => {
      setLoadingPreview(true)
      try {
        const data = (await api.get(`/public/client-invite/${encodeURIComponent(token)}`)).data as InvitePreview
        setPreview(data)
        if (data.emailHint) form.setValue('email', data.emailHint)
        if (data.clientName) form.setValue('fullName', data.clientName)
      } catch (err) {
        toast.error(t.invite.invalid, { description: getErrorMessage(err) })
      } finally {
        setLoadingPreview(false)
      }
    })()
  }, [token, form])

  const onSubmit = form.handleSubmit(async (values) => {
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
  })

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 px-5 py-10">
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

            <form className="mt-8 space-y-4" onSubmit={(e) => void onSubmit(e)}>
              <div>
                <Label htmlFor="fullName">{t.invite.name}</Label>
                <Input id="fullName" className="mt-1.5 rounded-xl" {...form.register('fullName')} />
              </div>
              <div>
                <Label htmlFor="email">{t.invite.email}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="mt-1.5 rounded-xl"
                  readOnly={Boolean(preview.emailHint)}
                  {...form.register('email')}
                />
              </div>
              <div>
                <Label htmlFor="password">{t.invite.password}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="mt-1.5 rounded-xl"
                  {...form.register('password')}
                />
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={submitting}>
                {submitting ? 'A criar…' : t.invite.submit}
              </Button>
            </form>
          </>
        ) : (
          <p className="text-sm text-red-600">{t.invite.invalid}</p>
        )}
      </div>
    </div>
  )
}
