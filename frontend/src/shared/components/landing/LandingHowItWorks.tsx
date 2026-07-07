import { Link } from 'react-router-dom'

import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'

const STEPS = [
  { n: '01', title: 'Configura o escritório em 5 minutos', body: 'Crias a conta, o nome do escritório e estás pronto.' },
  {
    n: '02',
    title: 'Convida os teus clientes',
    body: 'Acedem ao portal no browser — no telemóvel ou no computador, sem instalar nada.',
  },
  { n: '03', title: 'Fecha obrigações com tudo no sítio', body: 'Documentos, prazos e mensagens no mesmo fluxo mensal.' },
] as const

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="landing-section scroll-mt-24 bg-white">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Como funciona</h2>
        </FadeInView>
        <FadeInStagger className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <FadeInStaggerItem key={s.n}>
              <div>
                <span className="text-4xl font-bold text-[#0F2942]/15">{s.n}</span>
                <h3 className="mt-2 text-lg font-semibold text-[#0F2942]">{s.title}</h3>
                <p className="mt-2 text-[15px] text-[#4A5568]">{s.body}</p>
              </div>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
        <FadeInView className="mt-12 text-center">
          <Link to={authFirmRegisterUrl()} className="landing-btn-primary px-8 py-3.5">
            Começar 14 dias grátis
          </Link>
        </FadeInView>
      </div>
    </section>
  )
}
