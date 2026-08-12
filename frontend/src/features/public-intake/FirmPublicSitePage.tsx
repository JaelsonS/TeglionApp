import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { contabilPublicApi } from '@/infrastructure/api'
import { applyFirmBranding } from '@/shared/utils/firmBranding'
import { applyPageSeo } from '@/shared/utils/seo'
import { resolveTemplate } from '@/features/public-intake/templates'

function setRobotsMeta(content: string) {
  let el = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', 'robots')
    document.head.appendChild(el)
  }
  el.content = content
}

/**
 * Página pública unificada de um escritório (`/:firmSlug`) — v9 (ver plan
 * file da sessão). Renderiza o template configurado através de Definições →
 * Página pública: `?preview=<token>` mostra o rascunho ainda não publicado
 * (com aviso + noindex), qualquer outro visitante vê sempre `published`.
 */
export function FirmPublicSitePage() {
  const { firmSlug = '' } = useParams()
  const [searchParams] = useSearchParams()
  const previewToken = searchParams.get('preview') || undefined

  const query = useQuery({
    queryKey: ['public-firm-site', firmSlug, previewToken],
    queryFn: () => contabilPublicApi.getPublicFirmSite(firmSlug, previewToken),
    retry: false,
  })

  useEffect(() => {
    if (!query.data) return
    applyFirmBranding({
      primaryColor: query.data.theme.primaryColor,
      secondaryColor: query.data.theme.secondaryColor,
      textColor: query.data.theme.textColor,
    })
    applyPageSeo({
      title: query.data.seo.title || query.data.firmName,
      description: query.data.seo.description || undefined,
      path: `/${firmSlug}`,
    })
    setRobotsMeta(query.data.isPreview ? 'noindex' : 'index, follow')
    return () => {
      applyFirmBranding(null)
      setRobotsMeta('index, follow')
    }
  }, [query.data, firmSlug])

  if (query.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="text-lg font-semibold">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verifique o link recebido — pode estar incompleto ou já não existir.
        </p>
      </div>
    )
  }

  const data = query.data
  const Template = resolveTemplate(data.templateKey)

  return (
    <div>
      {data.isPreview ? (
        <div className="bg-amber-500 py-1.5 text-center text-xs font-medium text-amber-950">
          Pré-visualização — esta versão ainda não está publicada
        </div>
      ) : null}
      <Template
        config={{
          schemaVersion: 1,
          seo: data.seo,
          theme: data.theme,
          images: data.images,
          socialLinks: data.socialLinks,
          sections: data.sections,
          showPrices: data.showPrices !== false,
          termsText: data.termsText,
          privacyText: data.privacyText,
          complaintsBookUrl: data.complaintsBookUrl,
          complaintsBookLabel: data.complaintsBookLabel,
          praiseUrl: data.praiseUrl,
          praiseLabel: data.praiseLabel,
          praiseContact: data.praiseContact,
        }}
        ctx={{
          firmSlug,
          firmName: data.firmName,
          logoUrl: data.logoUrl,
          services: data.services,
          contact: data.contact,
          showPrices: data.showPrices !== false,
          complaintsBookUrl: data.complaintsBookUrl,
          complaintsBookLabel: data.complaintsBookLabel,
          praiseUrl: data.praiseUrl,
          praiseLabel: data.praiseLabel,
          praiseContact: data.praiseContact,
        }}
      />
    </div>
  )
}
