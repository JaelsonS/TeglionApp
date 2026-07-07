import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { authFirmLoginUrl } from '@/shared/constants/authPaths'
import { teamInvitePublicApi } from '@/infrastructure/api/contabil/teamManagement'
import { getErrorMessage } from '@/shared/utils/errors'
import { Button } from '@/shared/components/ui/button'

export function FirmInviteEmailConfirmPage() {
    const { token } = useParams<{ token: string }>()
    const navigate = useNavigate()
    const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
    const [message, setMessage] = useState('A validar confirmação de e-mail...')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('Token de confirmação ausente.')
            return
        }
        void (async () => {
            try {
                await teamInvitePublicApi.confirmEmail(token)
                setStatus('ok')
                setMessage('E-mail confirmado com sucesso. Já pode iniciar sessão no painel do escritório.')
            } catch (err) {
                setStatus('error')
                setMessage(getErrorMessage(err))
            }
        })()
    }, [token])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5 py-10">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirmação de e-mail</p>
                <h1 className="mt-2 text-2xl font-semibold">
                    {status === 'loading' ? 'A confirmar...' : status === 'ok' ? 'Tudo pronto' : 'Não foi possível confirmar'}
                </h1>
                <p className="mt-3 text-sm text-slate-600">{message}</p>
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
