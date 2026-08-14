import { Link } from 'react-router-dom'

import { FirmScrollPage } from '@/features/firm/FirmPageLayout'
import { FirmAboutPanel, FirmHelpSupportPanel } from '@/features/firm/support/FirmSupportPanels'
import { AskMayaButton } from '@/features/maya'
import { PageHeader } from '@/shared/design-system'

export function FirmHelpSupportPage() {
  return (
    <FirmScrollPage>
      <PageHeader
        title="Ajuda e suporte"
        subtitle="Precisa de ajuda? Consulte a Maya ou fale directamente com uma pessoa da equipa."
        testId="firm-help-support-header"
        secondary={<AskMayaButton intentId="human-support" />}
      />
      <FirmHelpSupportPanel />
      <p className="mt-6 text-sm text-muted-foreground">
        Saiba mais em{' '}
        <Link to="/app/firm/sobre" className="font-medium text-brand underline-offset-2 hover:underline">
          Sobre o Teglion
        </Link>
        .
      </p>
    </FirmScrollPage>
  )
}

export function FirmAboutPage() {
  return (
    <FirmScrollPage>
      <PageHeader
        title="Sobre o Teglion"
        subtitle="Identidade do produto e da AfDigital — Soluções Tecnológicas."
        testId="firm-about-header"
      />
      <FirmAboutPanel />
      <p className="mt-6 text-sm text-muted-foreground">
        Precisa de ajuda?{' '}
        <Link to="/app/firm/ajuda" className="font-medium text-brand underline-offset-2 hover:underline">
          Ajuda e suporte
        </Link>
        .
      </p>
    </FirmScrollPage>
  )
}
