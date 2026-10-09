export const ACTIVATION_ASSISTANT_OPEN_EVENT = 'teglion:activation-assistant-open'
export const MAYA_SETUP_APPLIED_EVENT = 'teglion:maya-setup-applied'

export function openActivationAssistant() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ACTIVATION_ASSISTANT_OPEN_EVENT))
}
