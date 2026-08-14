import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Mail, Phone } from 'lucide-react'

import {
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
  IconWhatsApp,
} from '@/shared/components/brand/BrandChannelIcons'
import { AskMayaButton } from '@/features/maya'
import { AGENCY } from '@/shared/config/agency'
import { BRAND } from '@/shared/config/brand'
import {
  agencySocialUrl,
  agencyWebsiteUrl,
  mailtoSupportUrl,
  supportEmailDisplay,
  supportPhoneDisplay,
  teglionProductOfAgencyLine,
  telSupportUrl,
  whatsappSupportUrl,
} from '@/shared/config/supportLinks'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/design-system'
import { openExternalUrl } from '@/shared/utils/openExternalUrl'
import { cn } from '@/shared/lib/utils'

const ICON_CLASS = 'h-4 w-4 shrink-0 text-muted-foreground'

const LEGAL_LINKS = [
  { to: '/termos', label: 'Termos e Condições' },
  { to: '/privacidade', label: 'Política de Privacidade' },
  { to: '/cookies', label: 'Política de Cookies' },
  { to: '/dpa', label: 'DPA / Acordo de Tratamento de Dados' },
  { to: '/aviso-legal', label: 'Aviso Legal' },
] as const

function ChannelRow({
  href,
  icon,
  title,
  subtitle,
  external,
  ariaLabel,
}: {
  href: string
  icon: ReactNode
  title: string
  subtitle?: string
  external?: boolean
  ariaLabel: string
}) {
  if (!href) return null
  const className = cn(
    'flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5',
    'text-left transition hover:border-brand/30 hover:bg-muted/20',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
  )
  const body = (
    <>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        {subtitle ? <span className="block text-xs text-muted-foreground">{subtitle}</span> : null}
      </span>
    </>
  )
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={ariaLabel}
        onClick={(e) => {
          e.preventDefault()
          openExternalUrl(href)
        }}
      >
        {body}
      </a>
    )
  }
  return (
    <a href={href} className={className} aria-label={ariaLabel}>
      {body}
    </a>
  )
}

/** Conteúdo reutilizável — página Ajuda e tab Definições. */
export function FirmHelpSupportPanel({ className }: { className?: string }) {
  const wa = whatsappSupportUrl()
  const mail = mailtoSupportUrl()
  const tel = telSupportUrl()

  return (
    <div className={cn('space-y-4', className)} data-testid="firm-help-support-panel">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Precisa de ajuda?</CardTitle>
          <CardDescription>
            Fale directamente com a equipa responsável pelo {BRAND.name}, ou use a Maya para
            orientação no produto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <AskMayaButton intentId="human-support" />
          <p className="text-xs text-muted-foreground">
            A Maya é a assistente guiada do {BRAND.name} — não substitui o suporte humano.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Falar com uma pessoa</CardTitle>
          <CardDescription>Canais oficiais de contacto (sem SLA inventado).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {wa ? (
              <Button type="button" variant="primary" size="sm" className="gap-1.5" asChild>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Falar com o suporte pelo WhatsApp"
                  onClick={(e) => {
                    e.preventDefault()
                    openExternalUrl(wa)
                  }}
                >
                  <IconWhatsApp className="h-4 w-4 shrink-0" aria-hidden />
                  Falar pelo WhatsApp
                </a>
              </Button>
            ) : null}
            {mail ? (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                <a href={mail} aria-label="Enviar email para o suporte">
                  <Mail className={ICON_CLASS} aria-hidden />
                  Enviar email
                </a>
              </Button>
            ) : null}
            {tel ? (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                <a href={tel} aria-label="Ligar para o suporte">
                  <Phone className={ICON_CLASS} aria-hidden />
                  Ligar
                </a>
              </Button>
            ) : null}
          </div>

          <ChannelRow
            href={wa}
            external
            icon={<IconWhatsApp className={ICON_CLASS} />}
            title="WhatsApp"
            subtitle={supportPhoneDisplay()}
            ariaLabel="Falar com o suporte pelo WhatsApp"
          />
          <ChannelRow
            href={mail}
            icon={<Mail className={ICON_CLASS} aria-hidden />}
            title="Email"
            subtitle={supportEmailDisplay()}
            ariaLabel="Enviar email para o suporte"
          />
          <ChannelRow
            href={tel}
            icon={<Phone className={ICON_CLASS} aria-hidden />}
            title="Telefone"
            subtitle={supportPhoneDisplay()}
            ariaLabel="Ligar para o suporte"
          />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Página pública de atendimento:{' '}
        <Link to="/suporte" className="font-medium text-brand underline-offset-2 hover:underline">
          Central de ajuda
        </Link>
        .
      </p>
    </div>
  )
}

/** Conteúdo Sobre o Teglion + AfDigital + links legais. */
export function FirmAboutPanel({ className }: { className?: string }) {
  const site = agencyWebsiteUrl()

  return (
    <div className={cn('space-y-4', className)} data-testid="firm-about-panel">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{BRAND.name}</CardTitle>
          <CardDescription>{teglionProductOfAgencyLine()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-foreground">
          <p>
            O {BRAND.name} é uma plataforma de gestão para escritórios de contabilidade, desenvolvida e
            operada pela {AGENCY.displayName}. {BRAND.name} é o nome do produto — não uma empresa
            independente.
          </p>
          <p className="text-muted-foreground">
            Foi criado para ajudar escritórios a centralizar operação, clientes, serviços, agenda,
            documentos, comunicações e presença digital num único sistema.
          </p>
          <p className="text-xs text-muted-foreground">
            Desenvolvido e operado por {AGENCY.displayName}.
          </p>
          {site ? (
            <Button type="button" variant="primary" size="sm" className="gap-1.5" asChild>
              <a
                href={site}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Conhecer a AfDigital no site oficial"
                onClick={(e) => {
                  e.preventDefault()
                  openExternalUrl(site)
                }}
              >
                <Globe className={ICON_CLASS} aria-hidden />
                Conhecer a AfDigital
              </a>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">AfDigital — canais oficiais</CardTitle>
          <CardDescription>Empresa responsável pelo produto {BRAND.name}.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <ChannelRow
            href={site}
            external
            icon={<Globe className={ICON_CLASS} aria-hidden />}
            title="Website"
            subtitle={AGENCY.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            ariaLabel="Website da AfDigital"
          />
          <ChannelRow
            href={agencySocialUrl('instagram')}
            external
            icon={<IconInstagram className={ICON_CLASS} />}
            title="Instagram"
            ariaLabel="Instagram da AfDigital"
          />
          <ChannelRow
            href={agencySocialUrl('facebook')}
            external
            icon={<IconFacebook className={ICON_CLASS} />}
            title="Facebook"
            ariaLabel="Facebook da AfDigital"
          />
          <ChannelRow
            href={agencySocialUrl('linkedin')}
            external
            icon={<IconLinkedIn className={ICON_CLASS} />}
            title="LinkedIn"
            ariaLabel="LinkedIn da AfDigital"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informações legais</CardTitle>
          <CardDescription>
            Documentos publicados no site — o conteúdo jurídico detalhado está nas páginas
            respectivas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {LEGAL_LINKS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="font-medium text-brand underline-offset-2 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
