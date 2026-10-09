import type { MayaSetupProposalV1 } from '@/infrastructure/api/contabil/mayaSetup'

export type MayaSetupSectionPreview = {
  type: string
  title: string
  snippet: string
}

export function listProposalSectionPreviews(proposal: MayaSetupProposalV1): MayaSetupSectionPreview[] {
  const sections = proposal.publicSitePatch?.sections
  if (!Array.isArray(sections)) return []
  return sections
    .filter((s) => s && typeof s === 'object' && s.enabled !== false)
    .map((s) => {
      const type = String((s as { type?: string }).type || 'secção')
      const content = ((s as { content?: Record<string, unknown> }).content || {}) as Record<string, unknown>
      const title =
        String(content.title || content.heading || content.tagline || type).trim() || type
      let snippet = ''
      if (typeof content.body === 'string') snippet = content.body
      else if (typeof content.bio === 'string') snippet = content.bio
      else if (Array.isArray(content.items) && content.items.length) {
        const first = content.items[0] as { title?: string; question?: string }
        snippet = String(first?.title || first?.question || '')
      }
      return {
        type,
        title: title.slice(0, 80),
        snippet: snippet.slice(0, 160),
      }
    })
}

export function proposalThemeSwatch(proposal: MayaSetupProposalV1): { primary: string; secondary: string } {
  const theme = (proposal.publicSitePatch?.theme || {}) as { primaryColor?: string; secondaryColor?: string }
  return {
    primary: theme.primaryColor || '#1e4d8c',
    secondary: theme.secondaryColor || '#0ea5e9',
  }
}
