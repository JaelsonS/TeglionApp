import { useEffect, useState } from 'react'

import { MayaAssistant } from '@/features/maya/MayaAssistant'
import { openMaya } from '@/features/maya/openMaya'
import { Button } from '@/shared/components/ui/button'
import { BRAND } from '@/shared/config/brand'
import { ensureContabilStyles } from '@/shared/styles/loadContabilStyles'

const EXIT_INTENT_KEY = 'teglion:landing-exit-intent'

function LandingExitIntent() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (window.sessionStorage.getItem(EXIT_INTENT_KEY)) return
    } catch {
      return
    }

    function markSeen() {
      try {
        window.sessionStorage.setItem(EXIT_INTENT_KEY, '1')
      } catch {
        /* ignore quota */
      }
    }

    function showOnce() {
      markSeen()
      setOpen(true)
      window.removeEventListener('mouseout', onMouseOut)
      document.removeEventListener('visibilitychange', onHidden)
    }

    function onMouseOut(event: MouseEvent) {
      if (event.clientY > 0) return
      if (event.relatedTarget) return
      showOnce()
    }

    function onHidden() {
      if (document.visibilityState === 'hidden') showOnce()
    }

    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (coarse) document.addEventListener('visibilitychange', onHidden)
    else window.addEventListener('mouseout', onMouseOut)
    return () => {
      window.removeEventListener('mouseout', onMouseOut)
      document.removeEventListener('visibilitychange', onHidden)
    }
  }, [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
      role="dialog"
      aria-labelledby="landing-exit-title"
      aria-modal="true"
      data-testid="landing-exit-intent"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-xl">
        <p id="landing-exit-title" className="text-base font-semibold text-foreground">
          Posso ajudar?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sou a Maya. Explico o Teglion em um minuto — ou falo consigo no WhatsApp se preferir uma
          pessoa da AfDigital.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            type="button"
            className="rounded-full text-white"
            onClick={() => {
              setOpen(false)
              openMaya('landing-what')
            }}
          >
            Sim, falar com a Maya
          </Button>
          <Button type="button" variant="outline" className="rounded-full" asChild>
            <a href={BRAND.phone.whatsapp} target="_blank" rel="noopener noreferrer">
              Falar no WhatsApp
            </a>
          </Button>
          <button
            type="button"
            className="text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => setOpen(false)}
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}

/** Maya comercial na landing — reutiliza o assistente estático + convite ao sair. */
export function LandingSalesMaya() {
  useEffect(() => {
    ensureContabilStyles()
  }, [])

  return (
    <>
      <MayaAssistant surface="landing" />
      <LandingExitIntent />
    </>
  )
}
