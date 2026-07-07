import { AFFILIATE_LINKS, type AffiliateKey } from '@/content/blog/affiliates'

/** Quando a conta AdSense estiver aprovada e a servir anúncios, definir `VITE_ADSENSE_LIVE=true` no deploy. */
export const ADSENSE_LIVE = import.meta.env.VITE_ADSENSE_LIVE === 'true'

const ROTATION: AffiliateKey[] = [
  'hotmartReciboVerde7Dias',
  'hotmartIrsReciboVerde',
  'amazonLivroGestaoContabil',
  'amazonCasio991',
  'amazonPastaThinkTex26',
  'amazonPastaSanfona12',
  'amazonAgendaBezend',
  'amazonM365Pessoal',
  'amazonBitdefender',
  'amazonCalculadoraCientifica',
]

export type AffiliatePick = (typeof AFFILIATE_LINKS)[AffiliateKey]

function hashSeed(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return h
}

export function pickAffiliateForSlot(seed: string): AffiliatePick {
  const key = ROTATION[hashSeed(seed) % ROTATION.length] ?? 'amazonLivroGestaoContabil'
  return AFFILIATE_LINKS[key]
}
