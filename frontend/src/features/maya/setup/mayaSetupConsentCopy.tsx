import type { ReactNode } from 'react'

export const MAYA_SETUP_PRIVACY_HREF = '/privacidade#subcontratantes'
export const MAYA_SETUP_DPA_HREF = '/dpa#subprocessadores'

const linkClass =
  'font-medium text-brand underline underline-offset-2 hover:text-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40'

export function MayaSetupLegalDocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
  )
}

export function MayaSetupConsentIntro() {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      Em poucos minutos pode obter textos genéricos, serviços do catálogo e horários sugeridos — sempre em rascunho,
      para rever antes de publicar. O questionário (incluindo texto livre opcional) é enviado a um subcontratante de
      inteligência artificial autorizado pela AfDigital. Saiba mais na{' '}
      <MayaSetupLegalDocLink href={MAYA_SETUP_PRIVACY_HREF}>Política de Privacidade</MayaSetupLegalDocLink> e no{' '}
      <MayaSetupLegalDocLink href={MAYA_SETUP_DPA_HREF}>acordo de tratamento de dados (DPA)</MayaSetupLegalDocLink>.
    </p>
  )
}
