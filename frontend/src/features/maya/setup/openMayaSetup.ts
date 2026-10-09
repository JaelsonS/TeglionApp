export const MAYA_SETUP_OPEN_EVENT = 'teglion:maya-setup-open'

const PUBLIC_SITE_SETTINGS_PATH = '/app/firm/settings?tab=pagina-publica'

/** Abre Definições → Página pública (sem questionário inline). */
export function openMayaSetupInPublicSiteEditor() {
  if (typeof window === 'undefined') return
  window.location.assign(PUBLIC_SITE_SETTINGS_PATH)
}

/** Configuração rápida IA — sempre em modal (`MayaSetupWizard`), nunca inline no editor. */
export function openMayaSetupWizard(options?: { modal?: boolean }) {
  if (typeof window === 'undefined') return
  void options
  const onPublicSite =
    window.location.pathname.includes('/app/firm/settings') &&
    window.location.search.includes('tab=pagina-publica')
  if (!onPublicSite) {
    openMayaSetupInPublicSiteEditor()
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(MAYA_SETUP_OPEN_EVENT))
    }, 400)
    return
  }
  window.dispatchEvent(new CustomEvent(MAYA_SETUP_OPEN_EVENT))
}
