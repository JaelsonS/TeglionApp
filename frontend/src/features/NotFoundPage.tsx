import { Link } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'

import { LandingMarketingShell } from '@/shared/components/landing/LandingMarketingShell'
import { authProfileChoiceUrl } from '@/shared/constants/authPaths'
import { BRAND } from '@/shared/config/brand'
import { Button } from '@/shared/components/ui/button'

export function NotFoundPage() {
  return (
    <LandingMarketingShell
      title={`Página não encontrada | ${BRAND.name}`}
      description="O endereço que procurou não existe ou foi movido."
      path="/404"
    >
      <section className="landing-section">
        <div className="landing-container flex min-h-[50vh] flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Erro 404</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Página não encontrada
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            O link pode estar desactualizado ou o endereço foi escrito incorretamente.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="rounded-[10px]">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" aria-hidden />
                Ir para o início
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-[10px]">
              <Link to={authProfileChoiceUrl('login')}>
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                Entrar na conta
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </LandingMarketingShell>
  )
}
