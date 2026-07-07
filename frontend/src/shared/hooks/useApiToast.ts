import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { getErrorMessage } from '@/shared/utils/errors'

export function useApiToast() {
  const { t } = useTranslation('common')
  const isGeneric = (value: string) => {
    const lowered = String(value || '').toLowerCase().trim()
    if (!lowered) return true
    return (
      lowered === t('common.errors.generic').toLowerCase() ||
      lowered === t('common.errors.invalidRequest').toLowerCase() ||
      lowered === t('common.errors.serverUnavailable').toLowerCase()
    )
  }
  return {
    success: (msg: string, opts?: { description?: string }) => toast.success(msg, opts),
    error: (err: unknown, fallback = t('toasts.genericError')) => {
      if (typeof err === 'string') {
        toast.error(err)
        return
      }
      const message = getErrorMessage(err)
      const fallbackText = String(fallback || t('toasts.genericError'))
      if (message && !isGeneric(message)) {
        toast.error(message)
        return
      }
      toast.error(fallbackText, { description: message })
    },
  }
}
