export const MAYA_SETUP_OPEN_EVENT = 'teglion:maya-setup-open'

export function openMayaSetupWizard() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(MAYA_SETUP_OPEN_EVENT))
}
