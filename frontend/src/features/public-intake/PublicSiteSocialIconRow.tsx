import type { CSSProperties } from 'react'
import { Facebook, Globe, Instagram, Linkedin, MessageCircle } from 'lucide-react'

import type { PublicSiteSocialLinks } from '@/shared/types/firmPublicSite'

type Props = {
  socialLinks: Partial<PublicSiteSocialLinks>
  className?: string
  iconClassName?: string
  style?: CSSProperties
}

export function PublicSiteSocialIconRow({ socialLinks, className, iconClassName, style }: Props) {
  const entries = [
    { key: 'instagram', href: socialLinks.instagram, label: 'Instagram', Icon: Instagram },
    { key: 'facebook', href: socialLinks.facebook, label: 'Facebook', Icon: Facebook },
    { key: 'linkedin', href: socialLinks.linkedin, label: 'LinkedIn', Icon: Linkedin },
    { key: 'whatsapp', href: socialLinks.whatsapp, label: 'WhatsApp', Icon: MessageCircle },
    { key: 'website', href: socialLinks.website, label: 'Site', Icon: Globe },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href))

  if (entries.length === 0) return null

  return (
    <div className={className ?? 'flex flex-wrap items-center gap-2.5'}>
      {entries.map(({ key, href, label, Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={
            iconClassName ??
            'inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/50 transition hover:opacity-80'
          }
          style={style}
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  )
}
