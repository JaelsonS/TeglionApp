/** Re-export — ícones de marca vivem em `@/shared/components/brand/BrandChannelIcons`. */
export {
  IconWhatsApp,
  IconLinkedIn,
  IconInstagram,
  IconFacebook,
  IconX,
  IconThreads,
  IconTikTok,
  IconGitHub,
  IconMailBrand as IconMail,
} from '@/shared/components/brand/BrandChannelIcons'

import {
  IconFacebook,
  IconGitHub,
  IconInstagram,
  IconLinkedIn,
  IconMailBrand,
  IconThreads,
  IconTikTok,
  IconWhatsApp,
  IconX,
} from '@/shared/components/brand/BrandChannelIcons'

export function BlogSocialBrandIcon({ id, className = 'blog-author-social-icon' }: { id: string; className?: string }) {
  switch (id) {
    case 'whatsapp':
      return <IconWhatsApp className={className} />
    case 'linkedin':
      return <IconLinkedIn className={className} />
    case 'x':
      return <IconX className={className} />
    case 'instagram':
      return <IconInstagram className={className} />
    case 'facebook':
      return <IconFacebook className={className} />
    case 'threads':
      return <IconThreads className={className} />
    case 'tiktok':
      return <IconTikTok className={className} />
    case 'github':
      return <IconGitHub className={className} />
    case 'email':
    default:
      return <IconMailBrand className={className} />
  }
}
