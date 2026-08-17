import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'
import { TeglionPublicCredit } from '@/features/public-intake/TeglionPublicCredit'
import {
  AboutSection,
  BookingServicesSection,
  ContactSection,
  EmptyPublicServicesSection,
  FaqSection,
  FeaturesSection,
  FooterSection,
  HeaderSection,
  HeroSection,
  ProcessSection,
  ServicesSection,
  type PublicSiteRenderContext,
} from './DefaultSections'

type Props = {
  config: PublicSiteConfig
  ctx: PublicSiteRenderContext
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

  return (
    <div
      className={pageBg ? 'relative min-h-full' : 'relative min-h-full bg-background'}
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
        switch (section.type) {
          case 'header':
            return <HeaderSection key={section.key} ctx={ctx} content={section.content} />
          case 'hero':
            return (
              <HeroSection
                key={section.key}
                content={section.content}
                ctx={ctx}
                socialLinks={config.socialLinks}
                images={config.images}
              />
            )
          case 'about':
            return (
              <AboutSection
                key={section.key}
                content={section.content}
                images={config.images}
                ctx={ctx}
                socialLinks={config.socialLinks}
              />
            )
          case 'services':
          case 'bookingServices': {
            const hasCtas = (section.content.ctas?.length ?? 0) > 0
            if (showEmptyServices && !hasCtas) {
              if (section.key !== firstServiceKey) return null
              return <EmptyPublicServicesSection key="public-services-empty" />
            }
            return section.type === 'services' ? (
              <ServicesSection key={section.key} content={section.content} ctx={ctx} socialLinks={config.socialLinks} />
            ) : (
              <BookingServicesSection
                key={section.key}
                content={section.content}
                ctx={ctx}
                socialLinks={config.socialLinks}
              />
            )
          }
          case 'features':
            return <FeaturesSection key={section.key} content={section.content} />
          case 'process':
            return <ProcessSection key={section.key} content={section.content} />
          case 'faq':
            return <FaqSection key={section.key} content={section.content} />
          case 'contact':
            return <ContactSection key={section.key} content={section.content} ctx={ctx} socialLinks={config.socialLinks} />
          case 'footer':
            return (
              <FooterSection key={section.key} ctx={ctx} socialLinks={config.socialLinks} content={section.content} />
            )
          default:
            return null
        }
      })}
      <TeglionPublicCredit visible={ctx.showTeglionCredit !== false} />
    </div>
  )
}
