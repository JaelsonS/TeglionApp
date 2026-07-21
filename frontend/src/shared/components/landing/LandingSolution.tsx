import { FadeInView } from '@/shared/components/landing/FadeInView'
import { LandingScreenshot } from '@/shared/components/landing/LandingScreenshot'
import { LANDING_SCREENS } from '@/shared/components/landing/landingScreens'

const FIRM_BULLETS = [
  'Visão de todos os clientes num painel',
  'Prazos automáticos e alertas antes de atrasar',
  'Pedidos de documentos com um clique',
  'Faturação integrada no fluxo mensal',
]

const CLIENT_BULLETS = [
  'Envia documentos de forma fácil e rápida',
  'Vê o que está em dia e o que falta',
  'Recebe lembretes sem te ligar outra vez',
  'Fala com o contabilista no mesmo sítio através do chat interno.',
]

export function LandingSolution() {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Uma plataforma, dois espaços</h2>
          <p className="mt-4 text-[#4A5568]">
            O escritório gere a carteira. O cliente entrega sem confusão. Tudo ligado.
          </p>
        </FadeInView>

        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-12">
          <FadeInView>
            <h3 className="text-xl font-semibold text-[#0F2942]">Para o escritório</h3>
            <ul className="mt-4 space-y-2.5">
              {FIRM_BULLETS.map((b) => (
                <li key={b} className="flex gap-2 text-[15px] text-[#4A5568]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8E6D0]" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <LandingScreenshot
                src={LANDING_SCREENS.dashboard}
                alt="Painel operacional do Teglion"
              />
            </div>
          </FadeInView>

          <FadeInView delay={0.08}>
            <h3 className="text-xl font-semibold text-[#0F2942]">Para o cliente</h3>
            <ul className="mt-4 space-y-2.5">
              {CLIENT_BULLETS.map((b) => (
                <li key={b} className="flex gap-2 text-[15px] text-[#4A5568]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E3F0FF] ring-1 ring-[#0F2942]/20" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <LandingScreenshot
                src={LANDING_SCREENS.portalCliente}
                alt="Portal do cliente Teglion no browser — início, pedidos e mensagens"
              />
            </div>
          </FadeInView>
        </div>
      </div>
    </section>
  )
}
