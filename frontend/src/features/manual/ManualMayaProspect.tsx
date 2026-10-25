import { Link } from 'react-router-dom'

import { MayaAssistant } from '@/features/maya/MayaAssistant'
import { MayaAvatar } from '@/features/maya'
import { openMaya } from '@/features/maya/openMaya'
import { Button } from '@/shared/components/ui/button'
import { authFirmRegisterUrl } from '@/shared/constants/authPaths'

/**
 * Maya para quem ainda não é cliente: FAB + cartão de convite no Manual público.
 * Conteúdo estático (surface landing) — sem APIs autenticadas.
 */
export function ManualMayaProspect() {
  return (
    <>
      <MayaAssistant surface="landing" />
      <div className="rounded-2xl border border-brand/25 bg-gradient-to-br from-brand/[0.1] via-sky-500/[0.05] to-transparent p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <MayaAvatar size="lg" variant="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#0B3A6E]">Maya</p>
            <p className="mt-1 text-sm text-[#4A5568]">
              Ainda não tem conta? Eu explico o Teglion em linguagem simples — e posso apontá-lo para
              o trial de 14 dias. Se já é cliente, entre na app e peça-me ajuda no mesmo ícone.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => openMaya('landing-manual')}>
                Falar com a Maya
              </Button>
              <Button type="button" size="sm" variant="outline" asChild>
                <Link to={authFirmRegisterUrl()}>Testar 14 dias</Link>
              </Button>
              <Button type="button" size="sm" variant="ghost" asChild>
                <Link to="/auth/client/login">Sou cliente do gabinete</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
