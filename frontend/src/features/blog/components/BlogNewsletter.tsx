import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { api } from '@/infrastructure/api'

type Props = {
  variant?: 'default' | 'compact'
  source?: string
}

export function BlogNewsletter({ variant = 'default', source = 'blog' }: Props) {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !consent) {
      toast.error('Indique o e-mail e aceite receber comunicações.')
      return
    }
    setLoading(true)
    try {
      await api.post('/public/blog/newsletter', {
        email: email.trim().toLowerCase(),
        source,
        audience: 'blog',
        consent: true,
      })
      toast.success('Subscrição confirmada. Obrigado!')
      setEmail('')
      setConsent(false)
    } catch {
      toast.error('Não foi possível subscrever. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const isCompact = variant === 'compact'

  return (
    <section className="blog-newsletter" aria-labelledby="blog-newsletter-title">
      <h2 id="blog-newsletter-title" className={isCompact ? 'text-lg font-semibold' : 'text-xl font-semibold sm:text-2xl'}>
        Newsletter TegLion
      </h2>
      <p className={`mt-2 text-white/85 ${isCompact ? 'text-sm' : ''}`}>
        Novos artigos sobre IRS, obrigações e gestão de escritório — sem spam. Donos de escritórios recebem dicas para
        organizar clientes e prazos.
      </p>
      <form className="mt-5 space-y-3" onSubmit={onSubmit} noValidate>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <label className="sr-only" htmlFor="blog-newsletter-email">
            E-mail
          </label>
          <input
            id="blog-newsletter-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="sm:max-w-xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex shrink-0 items-center justify-center rounded-[10px] blog-bg-gold px-5 py-3 text-sm font-semibold blog-text-navy blog-bg-gold-hover disabled:opacity-60 sm:self-start"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Subscrever'}
          </button>
        </div>
        <label className="blog-newsletter-consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
          />
          <span>
            Aceito receber e-mails da TegLion (artigos, novidades do produto). Pode cancelar a qualquer momento.{' '}
            <Link to="/privacidade" className="underline underline-offset-2 hover:text-white">
              Privacidade
            </Link>
            .
          </span>
        </label>
      </form>
      <p className="mt-4 text-xs text-white/70">
        É contabilista?{' '}
        <Link to={authFirmRegisterUrl()} className="font-medium blog-text-gold underline">
          Experimente o TegLion 14 dias grátis
        </Link>
        .
      </p>
    </section>
  )
}
