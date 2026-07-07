import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, Smartphone, X } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  previewUrl: string | null
  loading?: boolean
  onOpenBank?: () => void
  bankLabel?: string
}

function getSessionId() {
  const key = 'contabil.view.session'
  try {
    let id = sessionStorage.getItem(key)
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      sessionStorage.setItem(key, id)
    }
    return id
  } catch {
    return `${Date.now()}`
  }
}

export function getViewSessionId() {
  return getSessionId()
}

export function DocumentPreviewModal({
  open,
  onClose,
  title,
  previewUrl,
  loading,
  onOpenBank,
  bankLabel = 'Abrir app do banco',
}: Props) {
  const openedAt = useRef<number | null>(null)

  useEffect(() => {
    if (open) openedAt.current = Date.now()
    else openedAt.current = null
  }, [open])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            aria-label="Fechar"
            onClick={handleClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="doc-preview-title"
            className={cn(
              'relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden',
              'rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl',
            )}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
              <h2 id="doc-preview-title" className="truncate text-sm font-semibold text-slate-900">
                {title}
              </h2>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                onClick={handleClose}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-[50vh] flex-1 bg-slate-100 sm:min-h-[60vh]">
              {loading ? (
                <div className="flex h-full min-h-[40vh] items-center justify-center text-sm text-slate-500">
                  A carregar documento…
                </div>
              ) : previewUrl ? (
                <iframe
                  title={title}
                  src={previewUrl}
                  className="h-full min-h-[50vh] w-full sm:min-h-[60vh]"
                />
              ) : (
                <div className="flex h-full min-h-[40vh] items-center justify-center text-sm text-slate-500">
                  Pré-visualização indisponível
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4 sm:px-5">
              {onOpenBank ? (
                <button
                  type="button"
                  onClick={onOpenBank}
                  className="cb-btn-primary flex-1 sm:flex-none"
                >
                  <Smartphone className="h-4 w-4" />
                  {bankLabel}
                </button>
              ) : null}
              {previewUrl ? (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir em separador
                </a>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export function useDocumentPreviewTracking() {
  const viewIdRef = useRef<string | null>(null)
  const startRef = useRef<number | null>(null)

  const trackEnd = useCallback(
    async (endViewFn: (viewId: string, seconds: number) => Promise<void>) => {
      if (!viewIdRef.current || !startRef.current) return
      const seconds = Math.round((Date.now() - startRef.current) / 1000)
      await endViewFn(viewIdRef.current, seconds).catch(() => {})
      viewIdRef.current = null
      startRef.current = null
    },
    [],
  )

  const trackStart = useCallback((viewId?: string) => {
    viewIdRef.current = viewId || null
    startRef.current = Date.now()
  }, [])

  return { trackStart, trackEnd, viewIdRef }
}
