import { Link } from 'react-router-dom'
import { Mail, UserCircle2 } from 'lucide-react'

import { authClientLoginUrl, authProfileChoiceUrl } from '@/shared/constants/authPaths'
import { getAuthProfileCopy, toAuthProfileLocale } from '@/features/auth/authProfileI18n'
import { getInitialAppLocale } from '@/shared/i18n/appLocale'
import { useMemo } from 'react'

export function ClientRegisterPage() {
  const locale = useMemo(() => toAuthProfileLocale(getInitialAppLocale()), [])
  const copy = getAuthProfileCopy(locale)

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] px-5 py-10 dark:bg-[#09090b]">
      <Link to="/" className="text-sm font-semibold">
        {copy.brand}
      </Link>

      <div className="mx-auto mt-12 max-w-md flex-1">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a0a0b] text-white dark:bg-white dark:text-[#0a0a0b]">
          <UserCircle2 className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Conta de cliente</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#52525b] dark:text-[#a1a1aa]">
          O acesso ao portal é criado pelo seu escritório de contabilidade. Peça ao responsável que o convide ou
          aprove o vínculo da sua conta.
        </p>

        <div className="mt-8 space-y-3 rounded-2xl border border-[#0a0a0b]/10 bg-white p-5 dark:border-white/10 dark:bg-[#18181b]">
          <p className="flex items-start gap-2 text-sm">
            <Mail className="mt-0.5 h-4 w-4 shrink-0" />
            Já tem credenciais? Use o login de cliente com o e-mail que o escritório registou.
          </p>
        </div>

        <Link
          to={authClientLoginUrl()}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#0a0a0b] px-6 py-3 text-sm font-semibold text-white dark:bg-white dark:text-[#0a0a0b]"
        >
          Ir para login de cliente
        </Link>

        <Link
          to={authProfileChoiceUrl('register')}
          className="mt-4 block text-center text-sm text-[#52525b] underline-offset-4 hover:underline dark:text-[#a1a1aa]"
        >
          Voltar à escolha de perfil
        </Link>
      </div>
    </div>
  )
}
