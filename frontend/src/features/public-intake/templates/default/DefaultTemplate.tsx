import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'
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

  return (
    <div className="min-h-screen bg-background">
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
            return <AboutSection key={section.key} content={section.content} images={config.images} />
          case 'services':
          case 'bookingServices': {
            if (showEmptyServices) {
              if (section.key !== firstServiceKey) return null
              return <EmptyPublicServicesSection key="public-services-empty" />
            }
            return section.type === 'services' ? (
              <ServicesSection key={section.key} content={section.content} ctx={ctx} />
            ) : (
              <BookingServicesSection key={section.key} content={section.content} ctx={ctx} />
            )
          }
          case 'features':
            return <FeaturesSection key={section.key} content={section.content} />
          case 'process':
            return <ProcessSection key={section.key} content={section.content} />
          case 'faq':
            return <FaqSection key={section.key} content={section.content} />
          case 'contact':
            return <ContactSection key={section.key} content={section.content} ctx={ctx} />
          case 'footer':
            return (
              <FooterSection key={section.key} ctx={ctx} socialLinks={config.socialLinks} content={section.content} />
            )
          default:
            return null
        }
      })}
    </div>
  )
}
