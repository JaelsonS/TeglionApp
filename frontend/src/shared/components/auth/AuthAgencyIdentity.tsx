import { AgencyProductLine } from '@/shared/components/agency/AgencyNameLink'
import { ExternalLink } from '@/shared/components/agency/ExternalLink'
import { AGENCY } from '@/shared/config/agency'
import { cn } from '@/shared/lib/utils'

type Props = {
  className?: string
  /** Quando false, omite o host do site por baixo da linha de produto. */
  showWebsite?: boolean
}

/**
 * Identidade discreta em telas públicas de auth:
 * «Teglion · Um produto da AfDigital — Soluções Tecnológicas» (nome clicável)
 * + afdigitalweb.com
 */
export function AuthAgencyIdentity({ className, showWebsite = true }: Props) {
  const host = AGENCY.url.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <div className={cn('mb-2 space-y-1 text-center', className)} data-testid="auth-agency-identity">
      <p className="text-[11px] leading-snug text-slate-500">
        <AgencyProductLine linkClassName="text-slate-700 hover:text-slate-900" />
      </p>
      {showWebsite ? (
        <ExternalLink
          href={AGENCY.url}
          className="inline-block text-[11px] font-medium text-slate-700 underline-offset-2 hover:underline"
          aria-label="Website da AfDigital"
        >
          {host}
        </ExternalLink>
      ) : null}
    </div>
  )
}
