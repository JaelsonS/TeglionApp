import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

import { FadeInView } from '@/shared/components/landing/FadeInView'
import { LandingScreenshot } from '@/shared/components/landing/LandingScreenshot'
import { LANDING_CAROUSEL_SLIDES } from '@/shared/components/landing/landingScreens'
import { cn } from '@/shared/lib/utils'

export function LandingProductCarousel() {
  const reduce = useReducedMotion()
  const [selected, setSelected] = useState(0)

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'center', duration: 30 },
    reduce ? [] : [Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })],
  )

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    onSelect()
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  return (
    <section id="produto" className="landing-section scroll-mt-24 bg-white">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Vê o Teglion por dentro</h2>
          <p className="mt-4 text-[#4A5568]">Capturas reais do produto — o dia-a-dia do teu escritório.</p>
        </FadeInView>

        <div className="relative mt-12">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex touch-pan-y">
              {LANDING_CAROUSEL_SLIDES.map((slide, i) => (
                <div
                  key={slide.title}
                  className="min-w-0 flex-[0_0_100%] px-2 sm:flex-[0_0_85%] sm:px-4 lg:flex-[0_0_75%]"
                >
                  <motion.div
                    className="mx-auto max-w-4xl"
                    animate={{
                      opacity: selected === i ? 1 : 0.55,
                      scale: selected === i ? 1 : 0.96,
                    }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                  >
                    <LandingScreenshot src={slide.src} alt={slide.alt} />
                    <div className="mt-5 text-center">
                      <p className="text-lg font-semibold text-[#0F2942]">{slide.title}</p>
                      <p className="mt-1 text-[15px] text-[#4A5568]">{slide.copy}</p>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="absolute left-0 top-[38%] z-10 hidden -translate-y-1/2 rounded-full border border-[#E2E8F0] bg-white p-2 shadow-sm hover:bg-[#FAFAF7] sm:flex"
            aria-label="Slide anterior"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-5 w-5 text-[#0F2942]" />
          </button>
          <button
            type="button"
            className="absolute right-0 top-[38%] z-10 hidden -translate-y-1/2 rounded-full border border-[#E2E8F0] bg-white p-2 shadow-sm hover:bg-[#FAFAF7] sm:flex"
            aria-label="Slide seguinte"
            onClick={scrollNext}
          >
            <ChevronRight className="h-5 w-5 text-[#0F2942]" />
          </button>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {LANDING_CAROUSEL_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir para slide ${i + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all',
                  selected === i ? 'w-6 bg-[#0F2942]' : 'w-2 bg-[#0F2942]/25',
                )}
                onClick={() => scrollTo(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
