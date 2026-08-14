/** Agência — crédito «Desenvolvido por» e identidade institucional do Teglion. */
export const AGENCY = {
  /** Nome curto da marca (junto, sem espaço). */
  name: 'AfDigital',
  slogan: 'Soluções Tecnológicas',
  /** Nome completo para créditos e links. */
  displayName: 'AfDigital — Soluções Tecnológicas',
  url: 'https://afdigitalweb.com/',
  /**
   * Relação produto → empresa (Teglion continua a ser a marca do SaaS).
   * Ex.: «Teglion · Um produto da AfDigital — Soluções Tecnológicas»
   */
  productOfLabel: 'Um produto da AfDigital — Soluções Tecnológicas',
  creditLabel: 'Desenvolvido por',
  promoTitle: 'Precisa de site ou sistema?',
  promoBody:
    'A AfDigital — Soluções Tecnológicas cria sites e sistemas à medida para escritórios e empresas em Portugal.',
  promoCta: 'Conhecer a AfDigital',
  /** Canais oficiais da empresa (nunca URLs /admin/). */
  socials: {
    instagram: 'https://www.instagram.com/afdigitalweb/',
    facebook: 'https://www.facebook.com/afdigitalsolucoestecnologicas',
    linkedin: 'https://www.linkedin.com/company/137384112/',
  },
} as const

export type AgencySocialId = keyof typeof AGENCY.socials
