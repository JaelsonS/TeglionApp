import type { ChangeEvent } from 'react'

import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'
import type { FirmSettingsBundle } from '@/shared/types/firmSettings'

import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { PublicSiteLegalFieldsEditor } from '@/features/firm/public-site/PublicSiteLegalFieldsEditor'
import { Input } from '@/shared/components/ui/input'

type Props = {
  overlayDraft: PublicSiteConfig
  onOverlayChange: (next: PublicSiteConfig) => void
  bundle: FirmSettingsBundle
  onBack: () => void
  onContinue: () => void
  onOpenContactSection?: () => void
  onOpenFooterSection?: () => void
}

function stripPrefix(value: string | null | undefined, prefixes: string[]) {
  let v = (value || '').trim()
  for (const p of prefixes) {
    if (v.toLowerCase().startsWith(p.toLowerCase())) v = v.slice(p.length)
  }
  return v
}

export function MayaSetupBrandLegalStep({
  overlayDraft,
  onOverlayChange,
  bundle,
  onBack,
  onContinue,
  onOpenContactSection,
  onOpenFooterSection,
}: Props) {
  const social = overlayDraft.socialLinks || {}

  function patchSocial(key: keyof NonNullable<PublicSiteConfig['socialLinks']>, raw: string) {
    onOverlayChange({
      ...overlayDraft,
      socialLinks: { ...overlayDraft.socialLinks, [key]: raw.trim() || null },
    })
  }

  function patchTheme(primary: string, secondary: string) {
    onOverlayChange({
      ...overlayDraft,
      theme: {
        ...overlayDraft.theme,
        primaryColor: primary || overlayDraft.theme.primaryColor,
        secondaryColor: secondary || overlayDraft.theme.secondaryColor,
      },
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Redes, cores e links legais — vê o efeito <strong className="font-medium text-foreground">já no preview</strong>{' '}
        à direita. A IA só entra no passo seguinte (textos). Pode abrir as secções Contactos / Rodapé para enquadrar
        imagens e alinhamento.
      </p>

      <div className="grid gap-3 rounded-lg border border-border/60 p-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="maya-primary">Cor primária</Label>
          <Input
            id="maya-primary"
            type="color"
            className="mt-1 h-10 w-full cursor-pointer"
            value={overlayDraft.theme.primaryColor || '#1e4d8c'}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              patchTheme(e.target.value, overlayDraft.theme.secondaryColor || '#0ea5e9')
            }
          />
        </div>
        <div>
          <Label htmlFor="maya-secondary">Cor secundária</Label>
          <Input
            id="maya-secondary"
            type="color"
            className="mt-1 h-10 w-full cursor-pointer"
            value={overlayDraft.theme.secondaryColor || '#0ea5e9'}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              patchTheme(overlayDraft.theme.primaryColor || '#1e4d8c', e.target.value)
            }
          />
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-dashed border-border/60 p-3">
        <Label>Redes sociais (opcional)</Label>
        <p className="text-caption text-muted-foreground">
          Telefone do escritório: {bundle.contact?.phone || '—'} (editável na secção Contactos).
        </p>
        <Input
          placeholder="Instagram (utilizador ou URL)"
          value={stripPrefix(social.instagram, ['https://instagram.com/', 'https://www.instagram.com/', '@'])}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            patchSocial('instagram', e.target.value ? `https://instagram.com/${e.target.value.replace(/^@/, '')}` : '')
          }
        />
        <Input
          placeholder="Facebook (página ou URL)"
          value={stripPrefix(social.facebook, ['https://facebook.com/', 'https://www.facebook.com/'])}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            patchSocial('facebook', e.target.value ? `https://facebook.com/${e.target.value}` : '')
          }
        />
        <Input
          placeholder="LinkedIn (perfil ou URL)"
          value={stripPrefix(social.linkedin, ['https://linkedin.com/in/', 'https://www.linkedin.com/in/'])}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            patchSocial('linkedin', e.target.value ? `https://linkedin.com/in/${e.target.value}` : '')
          }
        />
        <Input
          placeholder="WhatsApp (número com indicativo)"
          value={social.whatsapp || ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => patchSocial('whatsapp', e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {onOpenContactSection ? (
            <Button type="button" size="sm" variant="outline" onClick={onOpenContactSection}>
              Abrir secção Contactos
            </Button>
          ) : null}
          {onOpenFooterSection ? (
            <Button type="button" size="sm" variant="outline" onClick={onOpenFooterSection}>
              Abrir rodapé legal
            </Button>
          ) : null}
        </div>
      </div>

      <PublicSiteLegalFieldsEditor draft={overlayDraft} onDraftChange={onOverlayChange} />

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={onContinue}>Continuar — imagens</Button>
      </div>
    </div>
  )
}
