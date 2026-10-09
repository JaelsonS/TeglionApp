import { useRef, useState } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { firmPublicSiteApi } from '@/infrastructure/api/contabil/firmPublicSite'
import type { PublicSiteImageRef } from '@/shared/types/firmPublicSite'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Label } from '@/shared/components/ui/label'
import { getErrorMessage } from '@/shared/utils/errors'
import { MAYA_SETUP_SERVICE_OPTIONS_BR, MAYA_SETUP_SERVICE_OPTIONS_PT } from '@/features/maya/setup/mayaSetupCatalog'

export type MayaSetupMediaState = {
  logoUploaded: boolean
  heroImage: Pick<PublicSiteImageRef, 'id' | 'storageKey' | 'alt'> | null
  aboutImage: Pick<PublicSiteImageRef, 'id' | 'storageKey' | 'alt'> | null
  prepareServicesForPublicPage: boolean
  includeDemoClients: boolean
  serviceImages: Record<string, string>
}

type Props = {
  value: MayaSetupMediaState
  onChange: (next: MayaSetupMediaState) => void
  serviceCatalogKeys: string[]
  countryCode: 'PT' | 'BR'
  demoOfficeAllowed: boolean
  onBack: () => void
  onGenerate: () => void
  generateDisabled?: boolean
  generating?: boolean
}

export function MayaSetupMediaStep({
  value,
  onChange,
  serviceCatalogKeys,
  countryCode,
  demoOfficeAllowed,
  onBack,
  onGenerate,
  generateDisabled,
  generating,
}: Props) {
  const logoRef = useRef<HTMLInputElement>(null)
  const heroRef = useRef<HTMLInputElement>(null)
  const aboutRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'logo' | 'hero' | 'about' | string | null>(null)

  const labels = (countryCode === 'BR' ? MAYA_SETUP_SERVICE_OPTIONS_BR : MAYA_SETUP_SERVICE_OPTIONS_PT).reduce<
    Record<string, string>
  >((acc, o) => {
    acc[o.catalogKey] = o.label
    return acc
  }, {})

  async function uploadLogo(file: File) {
    setBusy('logo')
    try {
      await firmPublicSiteApi.uploadPublicLogo(file, 'shared')
      onChange({ ...value, logoUploaded: true })
      toast.success('Logótipo guardado no rascunho da página')
    } catch (e) {
      toast.error(getErrorMessage(e) || 'Não foi possível enviar o logótipo')
    } finally {
      setBusy(null)
    }
  }

  async function uploadHero(file: File) {
    setBusy('hero')
    try {
      const image = await firmPublicSiteApi.uploadImage('hero', file)
      onChange({
        ...value,
        heroImage: { id: image.id, storageKey: image.storageKey, alt: image.alt || '' },
      })
      toast.success('Imagem de destaque guardada')
    } catch (e) {
      toast.error(getErrorMessage(e) || 'Não foi possível enviar a imagem')
    } finally {
      setBusy(null)
    }
  }

  async function uploadAbout(file: File) {
    setBusy('about')
    try {
      const image = await firmPublicSiteApi.uploadImage('institutional', file)
      onChange({
        ...value,
        aboutImage: { id: image.id, storageKey: image.storageKey, alt: image.alt || '' },
      })
      toast.success('Imagem «Sobre» guardada')
    } catch (e) {
      toast.error(getErrorMessage(e) || 'Não foi possível enviar a imagem')
    } finally {
      setBusy(null)
    }
  }

  async function uploadServiceImage(catalogKey: string, file: File) {
    setBusy(`svc-${catalogKey}`)
    try {
      const res = await contabilAccountingServicesApi.uploadImage(file)
      const key = res.storageKey
      if (!key) throw new Error('Resposta inválida')
      onChange({
        ...value,
        serviceImages: { ...value.serviceImages, [catalogKey]: key },
      })
      toast.success('Imagem do serviço guardada')
    } catch (e) {
      toast.error(getErrorMessage(e) || 'Não foi possível enviar a imagem do serviço')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Imagens validadas pelo servidor (JPEG, PNG, WebP) — como no editor manual. A IA só gera textos; ficheiros
        nunca passam pela OpenAI.
      </p>

      <div className="space-y-3 rounded-lg border border-border/60 p-3">
        <div>
          <Label>Logótipo</Label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              ref={logoRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void uploadLogo(f)
                e.target.value = ''
              }}
            />
            <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => logoRef.current?.click()}>
              {busy === 'logo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {value.logoUploaded ? 'Substituir logótipo' : 'Enviar logótipo'}
            </Button>
            {value.logoUploaded ? <span className="text-caption text-success">Enviado</span> : null}
          </div>
        </div>

        <div>
          <Label>Imagem de destaque (hero)</Label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              ref={heroRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void uploadHero(f)
                e.target.value = ''
              }}
            />
            <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => heroRef.current?.click()}>
              {busy === 'hero' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {value.heroImage ? 'Substituir destaque' : 'Enviar destaque'}
            </Button>
          </div>
        </div>

        <div>
          <Label>Imagem «Sobre» (opcional)</Label>
          <div className="mt-2">
            <input
              ref={aboutRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void uploadAbout(f)
                e.target.value = ''
              }}
            />
            <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => aboutRef.current?.click()}>
              {busy === 'about' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              Enviar imagem institucional
            </Button>
          </div>
        </div>
      </div>

      {serviceCatalogKeys.length > 0 ? (
        <div className="space-y-2 rounded-lg border border-dashed border-border/60 p-3">
          <Label>Imagens nos serviços (opcional)</Label>
          <p className="text-caption text-muted-foreground">
            Uma imagem por serviço seleccionado — aplicada ao criar o serviço no escritório.
          </p>
          <ul className="space-y-2">
            {serviceCatalogKeys.map((key) => (
              <li key={key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{labels[key] || key}</span>
                <span className="flex items-center gap-2">
                  {value.serviceImages[key] ? (
                    <span className="text-caption text-success">Imagem pronta</span>
                  ) : null}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="max-w-[140px] text-caption"
                    disabled={busy !== null}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void uploadServiceImage(key, f)
                      e.target.value = ''
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <label className="flex items-start gap-2 text-sm">
        <Checkbox
          checked={value.prepareServicesForPublicPage}
          onCheckedChange={(v: boolean | 'indeterminate') =>
            onChange({ ...value, prepareServicesForPublicPage: v === true })
          }
        />
        <span>
          Preparar serviços para a página (activos com slug público). A página continua em rascunho até publicar.
        </span>
      </label>

      {demoOfficeAllowed ? (
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={value.includeDemoClients}
            onCheckedChange={(v: boolean | 'indeterminate') =>
              onChange({ ...value, includeDemoClients: v === true })
            }
          />
          <span>
            Modo demonstração (staging/piloto): criar clientes fictícios com e-mail @example.invalid — só para
            treino; pode apagar depois. Nunca usa dados reais.
          </span>
        </label>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={onGenerate} disabled={generateDisabled || generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Gerar proposta com IA
        </Button>
      </div>
    </div>
  )
}
