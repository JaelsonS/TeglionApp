import { describe, expect, it } from 'vitest'

import { isAuthenticatedAppRoute, isLightweightPublicRoute, isPublicIntakeRoute } from '@/shared/utils/publicRoutes'

describe('isPublicIntakeRoute', () => {
  it('reconhece o mini-portal por token', () => {
    expect(isPublicIntakeRoute('/pedidos/abc123')).toBe(true)
  })

  it('reconhece a página pública de captação de um serviço', () => {
    expect(isPublicIntakeRoute('/llcnunes/servicos/irs-2026')).toBe(true)
  })

  it('não reconhece rotas de marketing/blog', () => {
    expect(isPublicIntakeRoute('/')).toBe(false)
    expect(isPublicIntakeRoute('/blog/algum-artigo')).toBe(false)
    expect(isPublicIntakeRoute('/pricing')).toBe(false)
  })

  it('não reconhece rotas autenticadas', () => {
    expect(isPublicIntakeRoute('/app/firm/dashboard')).toBe(false)
    expect(isPublicIntakeRoute('/auth/firm/login')).toBe(false)
  })

  it('reconhece a página pública unificada de um escritório (/:firmSlug) — regressão: caía sem nenhum provider e a useQuery rebentava com "No QueryClient set"', () => {
    expect(isPublicIntakeRoute('/jaelson')).toBe(true)
    expect(isPublicIntakeRoute('/llcnunes')).toBe(true)
    expect(isPublicIntakeRoute('/llcnunes/')).toBe(true)
  })

  it('não reconhece a raiz nem caminhos vazios como slug de escritório', () => {
    expect(isPublicIntakeRoute('/')).toBe(false)
  })

  it('nunca colide com isLightweightPublicRoute nem isAuthenticatedAppRoute (categorias mutuamente exclusivas)', () => {
    const samples = [
      '/', '/blog', '/blog/algum-post', '/pricing', '/case-studies', '/suporte',
      '/termos', '/privacidade', '/cookies', '/dpa', '/aviso-legal',
      '/app/firm/dashboard', '/auth/firm/login', '/recover-password', '/reset-password',
      '/pedidos/xyz', '/llcnunes/servicos/consultoria',
    ]
    for (const path of samples) {
      const flags = [isLightweightPublicRoute(path), isAuthenticatedAppRoute(path), isPublicIntakeRoute(path)]
      expect(flags.filter(Boolean).length).toBeLessThanOrEqual(1)
    }
  })
})
