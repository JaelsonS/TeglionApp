import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, ChevronRight, ShieldCheck, UserCircle2 } from 'lucide-react'

import { BrandMark } from '@/shared/components/brand/BrandMark'
import { getInitialAppLocale } from '@/shared/i18n/appLocale'
import { cn } from '@/shared/lib/utils'
import { type AuthIntent, type AuthProfile, resolveAuthTarget } from '@/shared/constants/authPaths'

import { getAuthProfileCopy, toAuthProfileLocale } from './authProfileI18n'

function parseIntent(raw: string | null): AuthIntent {
  if (raw === 'register' || raw === 'trial') return raw
  return 'login'
}

export function AuthProfileChoicePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const intent = parseIntent(params.get('intent'))
  const locale = useMemo(() => toAuthProfileLocale(getInitialAppLocale()), [])
  const copy = getAuthProfileCopy(locale)

  const intentLabel = copy.intents[intent]

  const go = (profile: AuthProfile) => {
    navigate(resolveAuthTarget(intent, profile))
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#0f2942]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-[#2b6cb0]/12 blur-3xl" />

        <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-8 sm:px-6 lg:px-8">
          <BrandMark size="md" variant="onLight" showName linkToHome nameClassName="text-lg" />
          <span className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {intentLabel}
          </span>
        </header>

        <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{copy.title}</h1>
              <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">{copy.subtitle}</p>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Ambiente seguro para escritório e cliente
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
          <ProfileCard
            testId="auth-profile-firm"
            icon={Building2}
            title={copy.firm.title}
            description={copy.firm.description}
            cta={copy.firm.cta}
            onClick={() => go('firm')}
          />
          <ProfileCard
            testId="auth-profile-client"
            icon={UserCircle2}
            title={copy.client.title}
            description={copy.client.description}
            cta={copy.client.cta}
            onClick={() => go('client')}
          />
          </div>

          <Link to="/" className="mt-10 inline-block text-sm font-medium text-slate-500 underline-offset-4 hover:underline">
            {copy.back}
          </Link>
        </main>
      </div>
    </div>
  )
}

function ProfileCard({
  testId,
  icon: Icon,
  title,
  description,
  cta,
  onClick,
}: {
  testId: string
  icon: typeof Building2
  title: string
  description: string
  cta: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-[0_14px_35px_rgba(15,23,42,0.08)] transition',
        'hover:-translate-y-0.5 hover:border-[#0f2942]/35 hover:shadow-[0_20px_45px_rgba(15,23,42,0.12)]',
      )}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f2942]/15 to-[#0f2942]/5 text-[#0f2942]">
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xl font-semibold text-slate-900">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0f2942]">
          {cta}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </button>
  )
}
