import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import type { PublicSiteEditorPreviewDevice } from './PublicSiteEditorPreviewFrame'

type Props = {
  device: PublicSiteEditorPreviewDevice
  children: ReactNode
  className?: string
}

export function PublicSiteEditorDeviceChrome({ device, children, className }: Props) {
  if (device === 'mobile') {
    return (
      <div className={cn('cb-public-site-device cb-public-site-device--mobile mx-auto', className)}>
        <div className="cb-public-site-device-mobile-notch" aria-hidden />
        <div className="cb-public-site-device-screen">{children}</div>
        <div className="cb-public-site-device-mobile-home" aria-hidden />
      </div>
    )
  }

  if (device === 'tablet') {
    return (
      <div className={cn('cb-public-site-device cb-public-site-device--tablet mx-auto', className)}>
        <div className="cb-public-site-device-tablet-cam" aria-hidden />
        <div className="cb-public-site-device-screen">{children}</div>
      </div>
    )
  }

  return (
    <div className={cn('cb-public-site-device cb-public-site-device--desktop mx-auto w-full', className)}>
      <div className="cb-public-site-device-desktop-bar" aria-hidden>
        <span className="cb-public-site-device-dot bg-[#ff5f57]" />
        <span className="cb-public-site-device-dot bg-[#febc2e]" />
        <span className="cb-public-site-device-dot bg-[#28c840]" />
        <span className="cb-public-site-device-desktop-url">teglion.com</span>
      </div>
      <div className="cb-public-site-device-screen cb-public-site-device-screen--desktop">{children}</div>
      <div className="cb-public-site-device-desktop-stand" aria-hidden />
    </div>
  )
}
