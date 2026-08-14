import { AGENCY } from '@/shared/config/agency'
import { teglionProductOfAgencyLine } from '@/shared/config/supportLinks'
import { openExternalUrl } from '@/shared/utils/openExternalUrl'
import { cn } from '@/shared/lib/utils'

type Props = {
  className?: string
  /** Quando false, omite o link do site (só a linha de produto). */
  showWebsite?: boolean
}

/**
 * Identidade discreta em telas públicas de auth:
 * «Teglion · Um produto da AfDigital — Soluções Tecnológicas»
 * + afdigitalweb.com
 */
export function AuthAgencyIdentity({ className, showWebsite = true }: Props) {
  const host = AGENCY.url.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <div className={cn('mb-2 space-y-1 text-center', className)} data-testid="auth-agency-identity">
      <p className="text-[11px] leading-snug text-slate-500">{teglionProductOfAgencyLine()}</p>
      {showWebsite ? (
        <a
          href={AGENCY.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[11px] font-medium text-slate-700 underline-offset-2 hover:underline"
          aria-label="Website da AfDigital"
          onClick={(e) => {
            e.preventDefault()
            openExternalUrl(AGENCY.url)
          }}
        >
          {host}
        </a>
      ) : null}
    </div>
  )
}
