import { Link } from 'react-router-dom'

import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'

const STEPS = [
  {
    n: '01',
    title: 'Cria o gabinete',
    body: 'Regista-te em minutos, sem cartão. Convida a equipa.',
  },
  {
    n: '02',
    title: 'Configura a oferta e o site',
    body: 'Serviços, catálogo IRS e página pública com a tua marca.',
  },
  {
    n: '03',
    title: 'Opera e cobra',
    body: 'Clientes no portal, documentos com rasto, avenças em dia.',
  },
] as const

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="landing-section scroll-mt-24 bg-white">
      <div className="landing-container">
        <FadeInView className="max-w-2xl">
          <p className="landing-kicker">Como funciona</p>
          <h2 className="mt-3 text-[1.85rem] leading-tight sm:text-4xl">
            Três passos até ao gabinete organizado.
          </h2>
        </FadeInView>
        <FadeInStagger className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
          {STEPS.map((s) => (
            <FadeInStaggerItem key={s.n}>
              <div className="relative">
                <span className="landing-display text-5xl font-semibold leading-none text-[var(--landing-navy)]/12">
                  {s.n}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-[var(--landing-navy)]">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--landing-muted)]">{s.body}</p>
              </div>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
        <FadeInView className="mt-12">
          <Link to={authFirmRegisterUrl()} className="landing-btn-primary px-8">
            Começar 14 dias grátis
          </Link>
        </FadeInView>
      </div>
    </section>
  )
}
