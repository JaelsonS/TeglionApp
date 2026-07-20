import { getErrorMessage } from '@/shared/utils/errors'
import { api } from '@/infrastructure/api'

/** Subscrição newsletter / lead magnet — audience estável para evitar 400 em produção. */
export async function subscribeBlogNewsletter(input: {
  email: string
  source?: string
  consent: boolean
}): Promise<void> {
  const email = input.email.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('E-mail inválido')
  }
  if (!input.consent) {
    throw new Error('Consentimento obrigatório')
  }

  const source = String(input.source || 'blog')
    .replace(/[^a-zA-Z0-9._:-]+/g, '-')
    .slice(0, 80)

  try {
    await api.post('/public/blog/newsletter', {
      email,
      source,
      audience: 'blog',
      consent: true,
      locale: 'pt-PT',
    })
  } catch (err) {
    const msg = getErrorMessage(err)
    throw new Error(msg || 'Não foi possível subscrever')
  }
}
