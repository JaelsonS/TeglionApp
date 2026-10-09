export const MAYA_SETUP_OPEN_EVENT = 'teglion:maya-setup-open'

const PUBLIC_SITE_MAYA_PATH = '/app/firm/settings?tab=pagina-publica&mayaSetup=1'

/** Abre o editor da página pública com painel Maya (preview ao vivo). */
export function openMayaSetupInPublicSiteEditor() {
  if (typeof window === 'undefined') return
  window.location.assign(PUBLIC_SITE_MAYA_PATH)
}

/**
 * Configuração rápida: por defeito vai ao editor + preview.
 * `modal: true` mantém o wizard só em modal (legado).
 */
export function openMayaSetupWizard(options?: { modal?: boolean }) {
  if (typeof window === 'undefined') return
  if (options?.modal) {
    window.dispatchEvent(new CustomEvent(MAYA_SETUP_OPEN_EVENT))
    return
  }
  const onPublicSite =
    typeof window !== 'undefined' &&
    window.location.pathname.includes('/app/firm/settings') &&
    window.location.search.includes('tab=pagina-publica')
  if (onPublicSite) {
    window.dispatchEvent(new CustomEvent(MAYA_SETUP_OPEN_EVENT))
    return
  }
  openMayaSetupInPublicSiteEditor()
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent(MAYA_SETUP_OPEN_EVENT))
  }, 400)
}
