import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Globe, HelpCircle, Mail, Phone } from 'lucide-react'

import {
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
  IconWhatsApp,
} from '@/shared/components/brand/BrandChannelIcons'
import { AskMayaButton, openMaya } from '@/features/maya'
import { AGENCY } from '@/shared/config/agency'
import { BRAND } from '@/shared/config/brand'
import {
  agencySocialUrl,
  agencyWebsiteUrl,
  mailtoSupportUrl,
  supportEmailDisplay,
  supportPhoneDisplay,
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
import { cn } from '@/shared/lib/utils'

const ICON_CLASS = 'h-4 w-4 shrink-0 text-muted-foreground'

function ChannelRow({
  href,
  icon,
  title,
  subtitle,
  external,
}: {
  href: string
  icon: ReactNode
  title: string
  subtitle?: string
  external?: boolean
}) {
  if (!href) return null
  const className = cn(
    'flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5',
    'text-left transition hover:border-brand/30 hover:bg-muted/20',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
  )
  const body = (
    <>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        {subtitle ? <span className="block text-xs text-muted-foreground">{subtitle}</span> : null}
      </span>
    </>
  )
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {body}
      </a>
    )
  }
  return (
    <a href={href} className={className}>
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
            Estamos aqui para ajudar. Consulte a ajuda do Teglion ou fale directamente com a nossa
            equipa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <AskMayaButton intentId="human-support" />
          </div>
          <p className="text-xs text-muted-foreground">
            A Maya é a assistente guiada do Teglion — não substitui o suporte humano.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Falar com uma pessoa</CardTitle>
          <CardDescription>
            Contacte a equipa Teglion / AfDigital pelos canais oficiais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {wa ? (
              <Button type="button" variant="primary" size="sm" className="gap-1.5" asChild>
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <IconWhatsApp className="h-4 w-4 shrink-0" />
                  Falar com suporte
                </a>
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="gap-1.5"
                onClick={() => openMaya('human-support')}
              >
                <HelpCircle className="h-4 w-4" aria-hidden />
                Falar com suporte
              </Button>
            )}
            {wa ? (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <IconWhatsApp className={ICON_CLASS} />
                  Falar pelo WhatsApp
                </a>
              </Button>
            ) : null}
            {mail ? (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                <a href={mail}>
                  <Mail className={ICON_CLASS} aria-hidden />
                  Enviar email
                </a>
              </Button>
            ) : null}
            {tel ? (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                <a href={tel}>
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
          />
          <ChannelRow
            href={mail}
            icon={<Mail className={ICON_CLASS} aria-hidden />}
            title="Email"
            subtitle={supportEmailDisplay()}
          />
          <ChannelRow
            href={tel}
            icon={<Phone className={ICON_CLASS} aria-hidden />}
            title="Telefone"
            subtitle={supportPhoneDisplay()}
          />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Também pode abrir a página pública de atendimento em{' '}
        <Link to="/suporte" className="font-medium text-brand underline-offset-2 hover:underline">
          /suporte
        </Link>
        .
      </p>
    </div>
  )
}

/** Conteúdo Sobre o Teglion + AfDigital. */
export function FirmAboutPanel({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)} data-testid="firm-about-panel">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sobre o {BRAND.name}</CardTitle>
          <CardDescription>
            O {BRAND.name} é uma plataforma de gestão desenvolvida para ajudar escritórios de
            contabilidade a centralizar a sua operação, serviços, clientes, comunicação e presença
            digital.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground">
            O {BRAND.name} é um produto da {AGENCY.displayName}.
          </p>
          <Button type="button" variant="primary" size="sm" className="gap-1.5" asChild>
            <a href={agencyWebsiteUrl()} target="_blank" rel="noopener noreferrer">
              <Globe className={ICON_CLASS} aria-hidden />
              Conhecer a AfDigital
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conheça a AfDigital</CardTitle>
          <CardDescription>Canais oficiais da empresa responsável pelo {BRAND.name}.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <ChannelRow
            href={agencyWebsiteUrl()}
            external
            icon={<Globe className={ICON_CLASS} aria-hidden />}
            title="Website"
            subtitle={AGENCY.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          />
          <ChannelRow
            href={agencySocialUrl('instagram')}
            external
            icon={<IconInstagram className={ICON_CLASS} />}
            title="Instagram"
          />
          <ChannelRow
            href={agencySocialUrl('facebook')}
            external
            icon={<IconFacebook className={ICON_CLASS} />}
            title="Facebook"
          />
          <ChannelRow
            href={agencySocialUrl('linkedin')}
            external
            icon={<IconLinkedIn className={ICON_CLASS} />}
            title="LinkedIn"
          />
        </CardContent>
      </Card>
    </div>
  )
}
