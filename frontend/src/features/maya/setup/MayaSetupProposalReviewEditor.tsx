import type { ChangeEvent, ReactNode } from 'react'

import type { MayaSetupProposalV1 } from '@/infrastructure/api/contabil/mayaSetup'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  patchProposalBookingDay,
  patchProposalBookingTimezone,
  patchProposalIrs,
  patchProposalSectionContent,
  patchProposalSeo,
  patchProposalService,
  readSectionContent,
} from '@/features/maya/setup/mayaSetupProposalEdit'

const WEEKDAYS: Array<{ d: number; label: string }> = [
  { d: 1, label: 'Segunda' },
  { d: 2, label: 'Terça' },
  { d: 3, label: 'Quarta' },
  { d: 4, label: 'Quinta' },
  { d: 5, label: 'Sexta' },
]

type Tab = 'site' | 'services' | 'irs' | 'booking'

type Props = {
  proposal: MayaSetupProposalV1
  onChange: (next: MayaSetupProposalV1) => void
  previewTab: Tab
  setPreviewTab: (t: Tab) => void
  countryCode: 'PT' | 'BR'
  busy: boolean
  onBack: () => void
  onApply: () => void
}

export function MayaSetupProposalReviewEditor({
  proposal,
  onChange,
  previewTab,
  setPreviewTab,
  countryCode,
  busy,
  onBack,
  onApply,
}: Props) {
  const hero = readSectionContent(proposal, 'hero')
  const about = readSectionContent(proposal, 'about')
  const seo = (proposal.publicSitePatch?.seo || {}) as { title?: string; description?: string }

  function bookingInterval(day: number): { start: string; end: string } | null {
    const schedule = proposal.booking?.defaultSchedule || {}
    const intervals = schedule[day] ?? schedule[String(day) as unknown as number]
    if (!Array.isArray(intervals) || !intervals[0]) return null
    return { start: intervals[0].start, end: intervals[0].end }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Edite aqui o que a IA sugeriu — o preview à direita actualiza na hora. «Aplicar rascunho» grava isto no
        escritório (sem publicar).
      </p>
      <div className="flex flex-wrap gap-1">
        {(
          [
            ['site', 'Página'],
            ['services', 'Serviços'],
            ['irs', 'IRS'],
            ['booking', 'Horários'],
          ] as const
        ).map(([id, label]) => (
          <Button key={id} size="sm" variant={previewTab === id ? 'default' : 'outline'} onClick={() => setPreviewTab(id)}>
            {label}
          </Button>
        ))}
      </div>

      <div className="space-y-3 rounded-lg border bg-muted/20 p-3 text-sm">
        {previewTab === 'site' ? (
          <>
            <Field label="Título (SEO)" id="maya-seo-title">
              <Input
                id="maya-seo-title"
                value={seo.title || ''}
                maxLength={70}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onChange(patchProposalSeo(proposal, { title: e.target.value }))
                }
              />
            </Field>
            <Field label="Descrição (SEO)" id="maya-seo-desc">
              <textarea
                id="maya-seo-desc"
                className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={seo.description || ''}
                maxLength={200}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  onChange(patchProposalSeo(proposal, { description: e.target.value }))
                }
              />
            </Field>
            <Field label="Destaque — título" id="maya-hero-title">
              <Input
                id="maya-hero-title"
                value={hero.title || ''}
                maxLength={120}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onChange(patchProposalSectionContent(proposal, 'hero', { title: e.target.value }))
                }
              />
            </Field>
            <Field label="Destaque — subtítulo" id="maya-hero-tag">
              <Input
                id="maya-hero-tag"
                value={hero.tagline || ''}
                maxLength={160}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onChange(patchProposalSectionContent(proposal, 'hero', { tagline: e.target.value }))
                }
              />
            </Field>
            <Field label="Destaque — texto" id="maya-hero-bio">
              <textarea
                id="maya-hero-bio"
                className="min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={hero.bio || ''}
                maxLength={2000}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  onChange(patchProposalSectionContent(proposal, 'hero', { bio: e.target.value }))
                }
              />
            </Field>
            <Field label="Sobre — título" id="maya-about-h">
              <Input
                id="maya-about-h"
                value={about.heading || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onChange(patchProposalSectionContent(proposal, 'about', { heading: e.target.value }))
                }
              />
            </Field>
            <Field label="Sobre — texto" id="maya-about-body">
              <textarea
                id="maya-about-body"
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={about.body || ''}
                maxLength={4000}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  onChange(patchProposalSectionContent(proposal, 'about', { body: e.target.value }))
                }
              />
            </Field>
          </>
        ) : null}

        {previewTab === 'services' ? (
          <ul className="space-y-3">
            {proposal.services.length ? (
              proposal.services.map((s) => (
                <li key={s.catalogKey} className="space-y-2 rounded-md border border-border/50 bg-background p-2">
                  <p className="text-caption text-muted-foreground">{s.catalogKey}</p>
                  <Input
                    placeholder="Nome público"
                    value={s.name || ''}
                    maxLength={200}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      onChange(patchProposalService(proposal, s.catalogKey, { name: e.target.value }))
                    }
                  />
                  <textarea
                    className="min-h-[56px] w-full rounded-md border border-input px-2 py-1 text-sm"
                    placeholder="Descrição (opcional)"
                    value={s.description || ''}
                    maxLength={500}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      onChange(
                        patchProposalService(proposal, s.catalogKey, { description: e.target.value || null }),
                      )
                    }
                  />
                </li>
              ))
            ) : (
              <p className="text-muted-foreground">
                Só serviços personalizados no questionário — serão criados no apply; nomes já indicados no passo
                anterior.
              </p>
            )}
          </ul>
        ) : null}

        {previewTab === 'irs' ? (
          countryCode === 'PT' ? (
            <label className="flex items-start gap-2">
              <Checkbox
                checked={proposal.irs.activateCampaign}
                onCheckedChange={(v: boolean | 'indeterminate') =>
                  onChange(patchProposalIrs(proposal, { activateCampaign: v === true }))
                }
              />
              <span>
                Activar campanha IRS Modelo 3 (recolha de documentos — não cálculo AT). Revise depois em Área IRS.
              </span>
            </label>
          ) : (
            <p className="text-muted-foreground">Campanha IRS só para escritórios PT.</p>
          )
        ) : null}

        {previewTab === 'booking' ? (
          <div className="space-y-3">
            <Field label="Fuso horário" id="maya-tz">
              <select
                id="maya-tz"
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={proposal.booking?.timezone || 'Europe/Lisbon'}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  onChange(patchProposalBookingTimezone(proposal, e.target.value))
                }
              >
                <option value="Europe/Lisbon">Europe/Lisbon</option>
                <option value="UTC">UTC</option>
              </select>
            </Field>
            {WEEKDAYS.map(({ d, label }) => {
              const iv = bookingInterval(d)
              const enabled = Boolean(iv)
              return (
                <div key={d} className="flex flex-wrap items-end gap-2 rounded-md border border-border/40 bg-background p-2">
                  <label className="flex min-w-[120px] items-center gap-2 text-sm">
                    <Checkbox
                      checked={enabled}
                      onCheckedChange={(v: boolean | 'indeterminate') => {
                        if (v === true) {
                          onChange(
                            patchProposalBookingDay(proposal, d, iv || { start: '09:00', end: '13:00' }),
                          )
                        } else {
                          onChange(patchProposalBookingDay(proposal, d, null))
                        }
                      }}
                    />
                    {label}
                  </label>
                  {enabled ? (
                    <>
                      <Input
                        type="time"
                        className="h-9 w-[120px]"
                        value={iv?.start || '09:00'}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          onChange(
                            patchProposalBookingDay(proposal, d, {
                              start: e.target.value,
                              end: iv?.end || '13:00',
                            }),
                          )
                        }
                      />
                      <span className="text-muted-foreground">até</span>
                      <Input
                        type="time"
                        className="h-9 w-[120px]"
                        value={iv?.end || '13:00'}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          onChange(
                            patchProposalBookingDay(proposal, d, {
                              start: iv?.start || '09:00',
                              end: e.target.value,
                            }),
                          )
                        }
                      />
                    </>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Voltar ao questionário
        </Button>
        <Button onClick={onApply} disabled={busy}>
          Aplicar rascunho
        </Button>
      </div>
    </div>
  )
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}
