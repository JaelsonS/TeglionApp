/** Teglion — modo de produto único. */
export type ProductMode = 'contabil'

export function getProductMode(): ProductMode {
  return 'contabil'
}

export function isContabilMode(): boolean {
  return true
}
