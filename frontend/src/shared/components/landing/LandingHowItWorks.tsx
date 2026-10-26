import { Link } from 'react-router-dom'

import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'

const STEPS = [
  {
    n: '01',
    title: 'Cria o gabinete',
    body: 'Conta em minutos — equipa, clientes e operação prontos a usar.',
  },
  {
    n: '02',
    title: 'Configura a oferta',
    body: 'Página pública, catálogo, IRS e pagamentos no mesmo sítio.',
  },
  {
    n: '03',
    title: 'Opera e cobra',
    body: 'Documentos, prazos, mensagens e cobranças no mesmo fluxo.',
  },
] as const

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="landing-section scroll-mt-24">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center">
          <p className="landing-kicker">Como funciona</p>
          <h2 className="mt-3 text-[1.85rem] leading-tight sm:text-4xl">Do registo à operação</h2>
          <p className="mt-4 text-[15px] text-[var(--landing-muted)] sm:text-base">
            Sem montar cinco ferramentas. Em três passos está a vender e a servir clientes no Teglion.
          </p>
        </FadeInView>
        <FadeInStagger className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
          {STEPS.map((s) => (
            <FadeInStaggerItem key={s.n}>
              <div className="relative pl-1">
                <span className="landing-display text-5xl font-semibold leading-none text-[var(--landing-navy)]/12">
                  {s.n}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-[var(--landing-navy)]">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--landing-muted)]">{s.body}</p>
              </div>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
        <FadeInView className="mt-12 text-center">
          <Link to={authFirmRegisterUrl()} className="landing-btn-primary px-8">
            Começar 14 dias grátis
          </Link>
        </FadeInView>
      </div>
    </section>
  )
}