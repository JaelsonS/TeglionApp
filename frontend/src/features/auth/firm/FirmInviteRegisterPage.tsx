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
    emailHint: string
    fullNameHint?: string | null
    expiresAt: string
}

function normalizeInviteToken(raw?: string): string {
    const value = decodeURIComponent(String(raw || '')).trim().replace(/^\/+|\/+$/g, '')
    if (!value) return ''
    const hexMatch = value.match(/[a-f0-9]{64}/i)
    return hexMatch ? hexMatch[0].toLowerCase() : value
}

export function FirmInviteRegisterPage() {
    const { token } = useParams<{ token: string }>()
    const normalizedToken = normalizeInviteToken(token)
    const navigate = useNavigate()
    const [preview, setPreview] = useState<InvitePreview | null>(null)
    const [loadingPreview, setLoadingPreview] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { fullName: '', email: '', password: '' },
    })

    useEffect(() => {
        if (!normalizedToken) return
        void (async () => {
            setLoadingPreview(true)
            try {
                const data = await teamInvitePublicApi.preview(normalizedToken)
                setPreview(data)
                form.setValue('email', data.emailHint || '')
                if (data.fullNameHint) form.setValue('fullName', data.fullNameHint)
            } catch (err) {
                toast.error('Convite inválido', { description: getErrorMessage(err) })
            } finally {
                setLoadingPreview(false)
            }
        })()
    }, [normalizedToken, form])

    const onSubmit = form.handleSubmit(async (values) => {
        if (!normalizedToken) return
        setSubmitting(true)
        try {
            await teamInvitePublicApi.accept(normalizedToken, {
                fullName: values.fullName,
                email: values.email,
                password: values.password,
            })
            toast.success('Conta criada. Confirme o e-mail para ativar o acesso.')
            navigate(authFirmLoginUrl(), { replace: true })
        } catch (err) {
            toast.error('Não foi possível concluir o convite', { description: getErrorMessage(err) })
        } finally {
            setSubmitting(false)
        }
    })

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 px-5 py-10">
            <Link to="/" className="text-sm font-semibold text-[#2563eb]">
                TegLion
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

                        <form className="mt-8 space-y-4" onSubmit={(e) => void onSubmit(e)}>
                            <div>
                                <Label htmlFor="fullName">Nome</Label>
                                <Input id="fullName" className="mt-1.5 rounded-xl" {...form.register('fullName')} />
                            </div>
                            <div>
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    className="mt-1.5 rounded-xl"
                                    readOnly
                                    {...form.register('email')}
                                />
                            </div>
                            <div>
                                <Label htmlFor="password">Palavra-passe</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    className="mt-1.5 rounded-xl"
                                    {...form.register('password')}
                                />
                            </div>
                            <Button type="submit" className="w-full rounded-full" disabled={submitting}>
                                {submitting ? 'A concluir...' : 'Concluir convite'}
                            </Button>
                        </form>
                    </>
                ) : (
                    <p className="text-sm text-red-600">Convite inválido ou expirado.</p>
                )}
            </div>
        </div>
    )
}
