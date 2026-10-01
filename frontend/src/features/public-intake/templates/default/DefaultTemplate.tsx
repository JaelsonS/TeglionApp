import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'
import { TeglionPublicCredit } from '@/features/public-intake/TeglionPublicCredit'
import {
  findEnabledFooterContent,
  resolvePublicSiteContact,
} from '@/features/public-intake/publicSiteContactResolve'
import { PublicSitePreviewZone } from '@/features/firm/public-site/PublicSitePreviewZone'
import { HeaderSection } from '@/features/public-intake/PublicSiteHeader'
import {
  AboutSection,
  BookingServicesSection,
  ContactSection,
  EmptyPublicServicesSection,
  FaqSection,
  FeaturesSection,
  FooterSection,
  HeroSection,
  ProcessSection,
  ServicesSection,
  type PublicSiteRenderContext,
} from './DefaultSections'

type Props = {
  config: PublicSiteConfig
  ctx: PublicSiteRenderContext
}

function isPreviewHighlight(ctx: PublicSiteRenderContext, sectionKey: string): boolean {
  return Boolean(ctx.editorPreviewHighlightKeys?.includes(sectionKey))
}

/**
 * Único template hoje ("default") — a costura para múltiplos templates no
 * futuro é o `TEMPLATE_REGISTRY` (ver `templates/index.ts`), não isto: este
 * componente só sabe compor as secções deste template específico, na ordem
 * configurada pelo escritório.
 */
export function DefaultTemplate({ config, ctx }: Props) {
  const sections = [...config.sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order)
  const hasServiceSection = sections.some((s) => s.type === 'services' || s.type === 'bookingServices')
  const showEmptyServices = hasServiceSection && ctx.services.length === 0
  const firstServiceKey = sections.find((s) => s.type === 'services' || s.type === 'bookingServices')?.key
  const pageBgRaw = String(config.theme?.backgroundColor || '').trim()
  const pageBg = /^#[0-9a-f]{6}$/i.test(pageBgRaw) ? pageBgRaw : null
  const footerContent = findEnabledFooterContent(config)
  const contactSectionEnabled = sections.some((s) => s.type === 'contact')
  const displayCtx: PublicSiteRenderContext = {
    ...ctx,
    contact: resolvePublicSiteContact(ctx.contact, footerContent),
    termsText: ctx.termsText ?? config.termsText ?? null,
    privacyText: ctx.privacyText ?? config.privacyText ?? null,
  }

  return (
    <div
      className={`cb-public-site-container relative w-full ${ctx.useEditorHeroFrame ? 'min-h-0' : 'min-h-full'} ${pageBg ? '' : 'bg-background'}`}
      style={pageBg ? { backgroundColor: pageBg } : undefined}
      data-public-page-bg={pageBg || undefined}
    >
      {/* Camada de fundo explícita — garante que a cor se vê mesmo com secções transparentes */}
      {pageBg ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ backgroundColor: pageBg }}
        />
      ) : null}
      {sections.map((section) => {
        const highlight = isPreviewHighlight(displayCtx, section.key)
        switch (section.type) {
          case 'header':
            return (
              <PublicSitePreviewZone key={section.key} sectionKey={section.key} zone="header" highlight={highlight}>
                <HeaderSection ctx={displayCtx} content={section.content} />
              </PublicSitePreviewZone>
            )
          case 'hero':
            return (
              <PublicSitePreviewZone key={section.key} sectionKey={section.key} zone="hero" highlight={highlight}>
                <HeroSection
                  content={section.content}
                  ctx={displayCtx}
                  socialLinks={config.socialLinks}
                  images={config.images}
                />
              </PublicSitePreviewZone>
            )
          case 'about':
            return (
              <PublicSitePreviewZone key={section.key} sectionKey={section.key} zone="about" highlight={highlight}>
                <AboutSection
                  content={section.content}
                  images={config.images}
                  ctx={displayCtx}
                  socialLinks={config.socialLinks}
                  sectionKey={section.key}
                />
              </PublicSitePreviewZone>
            )
          case 'services':
          case 'bookingServices': {
            const hasCtas = (section.content.ctas?.length ?? 0) > 0
            if (showEmptyServices && !hasCtas) {
              if (section.key !== firstServiceKey) return null
              return (
                <PublicSitePreviewZone
                  key="public-services-empty"
                  sectionKey={firstServiceKey || section.key}
                  zone={section.type}
                  highlight={isPreviewHighlight(displayCtx, firstServiceKey || section.key)}
                >
                  <EmptyPublicServicesSection />
                </PublicSitePreviewZone>
              )
            }
            return (
              <PublicSitePreviewZone
                key={section.key}
                sectionKey={section.key}
                zone={section.type}
                highlight={highlight}
              >
                {section.type === 'services' ? (
                  <ServicesSection content={section.content} ctx={displayCtx} socialLinks={config.socialLinks} />
                ) : (
                  <BookingServicesSection
                    content={section.content}
                    ctx={displayCtx}
                    socialLinks={config.socialLinks}
                  />
                )}
              </PublicSitePreviewZone>
            )
          }
          case 'features':
            return (
              <PublicSitePreviewZone key={section.key} sectionKey={section.key} zone="features" highlight={highlight}>
                <FeaturesSection content={section.content} images={config.images} sectionKey={section.key} />
              </PublicSitePreviewZone>
            )
          case 'process':
            return (
              <PublicSitePreviewZone key={section.key} sectionKey={section.key} zone="process" highlight={highlight}>
                <ProcessSection content={section.content} images={config.images} sectionKey={section.key} />
              </PublicSitePreviewZone>
            )
          case 'faq':
            return (
              <PublicSitePreviewZone key={section.key} sectionKey={section.key} zone="faq" highlight={highlight}>
                <FaqSection content={section.content} images={config.images} sectionKey={section.key} />
              </PublicSitePreviewZone>
            )
          case 'contact':
            return (
              <PublicSitePreviewZone key={section.key} sectionKey={section.key} zone="contact" highlight={highlight}>
                <ContactSection
                  content={section.content}
                  ctx={displayCtx}
                  socialLinks={config.socialLinks}
                  images={config.images}
                  sectionKey={section.key}
                />
              </PublicSitePreviewZone>
            )
          case 'footer':
            return (
              <PublicSitePreviewZone key={section.key} sectionKey={section.key} zone="footer" highlight={highlight}>
                <FooterSection
                  ctx={displayCtx}
                  socialLinks={config.socialLinks}
                  content={section.content}
                  showContactDetails={!contactSectionEnabled}
                  showSocialIcons={!contactSectionEnabled}
                />
              </PublicSitePreviewZone>
            )
          default:
            return null
        }
      })}
      <TeglionPublicCredit visible={ctx.showTeglionCredit !== false} />
    </div>
  )
}
