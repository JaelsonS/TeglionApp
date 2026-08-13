import { ArrowRight, Copy, ExternalLink, HelpCircle, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { openMaya } from '@/features/maya/openMaya'
import type { FirmNextAction } from '@/features/firm/onboarding/firmProgress'

type FirmNextStepCardProps = {
  action: FirmNextAction
  loading?: boolean
}

export function FirmNextStepCard({ action, loading }: FirmNextStepCardProps) {
  return (
    <Card
      className="border-brand/25 shadow-[var(--cb-shadow-card)]"
      data-testid="firm-next-step"
    >
      <CardHeader className="pb-2">
        <p className="text-caption font-semibold uppercase tracking-wide text-brand">Próximo passo</p>
        <CardTitle className="text-lg sm:text-xl">{loading ? 'A calcular…' : action.title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{action.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" variant="primary" size="sm" asChild>
          <Link to={action.to}>
            {action.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        {action.mayaIntentId ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openMaya(action.mayaIntentId)}
          >
            <HelpCircle className="h-4 w-4" />
            Precisa de ajuda?
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

type FirmPublicUrlCardProps = {
  publicUrl: string | null
  published: boolean
}

export function FirmPublicUrlCard({ publicUrl, published }: FirmPublicUrlCardProps) {
  if (!publicUrl) return null

  async function copy() {
    try {
      await navigator.clipboard.writeText(publicUrl!)
      toast.success('Link da página pública copiado')
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }

  return (
    <Card data-testid="firm-public-url-card" className="shadow-[var(--cb-shadow-card)]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-brand" aria-hidden />
          <CardTitle className="text-base">Página pública do escritório</CardTitle>
        </div>
        <CardDescription>
          É aqui que potenciais clientes conhecem os seus serviços e entram em contacto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="truncate text-sm font-medium text-foreground">{publicUrl}</p>
          <p className={`mt-1 text-caption ${published ? 'text-success' : 'text-amber-700 dark:text-amber-400'}`}>
            {published ? 'Página activa (publicada)' : 'Ainda não publicada — falta configurar e publicar'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" asChild>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Ver página
            </a>
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
            <Copy className="h-4 w-4" />
            Copiar link
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link to="/app/firm/settings?tab=pagina-publica">Configurar página</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
