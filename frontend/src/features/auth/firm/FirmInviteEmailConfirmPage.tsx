import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

import { authFirmLoginUrl } from '@/shared/constants/authPaths'
import { teamInvitePublicApi } from '@/infrastructure/api/contabil/teamManagement'
import { getErrorMessage } from '@/shared/utils/errors'
import { Button } from '@/shared/components/ui/button'

export function FirmInviteEmailConfirmPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('A validar o seu e-mail…')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Link de confirmação incompleto. Peça um novo e-mail ou contacte o suporte.')
      return
    }
    void (async () => {
      try {
        await teamInvitePublicApi.confirmEmail(token)
        setStatus('ok')
        setMessage(
          'E-mail confirmado. A sua conta está activa — pode entrar no painel do escritório com o e-mail e a palavra-passe.',
        )
      } catch (err) {
        setStatus('error')
        setMessage(getErrorMessage(err))
      }
    })()
  }, [token])

  useEffect(() => {
    if (status !== 'ok') return
    const t = window.setTimeout(() => {
      navigate(authFirmLoginUrl(), { replace: true })
    }, 3500)
    return () => window.clearTimeout(t)
  }, [status, navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirmação de e-mail</p>
        <div className="mx-auto mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          {status === 'loading' ? (
            <Loader2 className="h-6 w-6 animate-spin text-slate-600" aria-hidden />
          ) : status === 'ok' ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden />
          ) : (
            <AlertCircle className="h-6 w-6 text-red-600" aria-hidden />
          )}
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">
          {status === 'loading'
            ? 'A confirmar…'
            : status === 'ok'
              ? 'Conta activada'
              : 'Não foi possível confirmar'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{message}</p>
        {status === 'ok' ? (
          <p className="mt-2 text-xs text-slate-500">A redireccionar para o login em instantes…</p>
        ) : null}
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button type="button" onClick={() => navigate(authFirmLoginUrl(), { replace: true })}>
            Ir para login
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/">Ir para site</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
