import { Link } from 'react-router-dom'

import { FirmScrollPage } from '@/features/firm/FirmPageLayout'
import { FirmAboutPanel, FirmHelpSupportPanel } from '@/features/firm/support/FirmSupportPanels'
import { AskMayaButton } from '@/features/maya'
import { Button, PageHeader } from '@/shared/design-system'

export function FirmHelpSupportPage() {
  return (
    <FirmScrollPage>
      <PageHeader
        title="Ajuda e suporte"
        subtitle="Dúvidas sobre o Teglion: abra a Maya, leia o Manual, ou contacte o suporte da AfDigital."
        testId="firm-help-support-header"
        secondary={
          <div className="flex flex-wrap items-center gap-2">
            <AskMayaButton intentId="human-support" />
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to="/manual">Abrir Manual</Link>
            </Button>
          </div>
        }
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
        subtitle="O que é o Teglion, quem o opera (AfDigital — Soluções Tecnológicas) e onde encontrar ajuda."
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
