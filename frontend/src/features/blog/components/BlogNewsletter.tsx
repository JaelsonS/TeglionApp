import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { subscribeBlogNewsletter } from '@/features/blog/subscribeBlogNewsletter'
import { trackBlogEvent } from '@/features/blog/blogAnalytics'

type Props = {
  variant?: 'default' | 'compact' | 'rail'
  source?: string
  /** Insight da semana (Fase 3) */
  insight?: string
}

export function BlogNewsletter({
  variant = 'default',
  source = 'blog',
  insight = 'Esta semana: confira o calendário de prazos AT/SS e feche documentos pendentes antes do fecho do mês.',
}: Props) {
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
      await subscribeBlogNewsletter({ email, source, consent: true })
      trackBlogEvent('blog_newsletter_subscribe', { source })
      toast.success('Subscrição confirmada. Obrigado!')
      setEmail('')
      setConsent(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível subscrever.')
    } finally {
      setLoading(false)
    }
  }

  const isRail = variant === 'rail'
  const isCompact = variant === 'compact' || isRail

  if (isRail) {
    return (
      <aside className="blog-lead-magnet" aria-labelledby="blog-newsletter-title">
        <p className="blog-rail-eyebrow">Newsletter</p>
        <h2 id="blog-newsletter-title" className="blog-rail-title">
          Insight fiscal + produto
        </h2>
        <p className="blog-rail-text mt-2">{insight}</p>
        <p className="blog-rail-text mt-2">
          <Link to={authFirmRegisterUrl()} className="font-semibold blog-text-navy underline-offset-2 hover:underline">
            Testar TegLion 14 dias →
          </Link>
        </p>
        <form className="mt-4 space-y-2" onSubmit={onSubmit} noValidate>
          <label className="sr-only" htmlFor="blog-newsletter-email-rail">
            E-mail
          </label>
          <input
            id="blog-newsletter-email-rail"
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="blog-lead-input"
          />
          <label className="blog-lead-consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
            <span>
              Aceito e-mails da TegLion.{' '}
              <Link to="/privacidade" className="underline underline-offset-2">
                Privacidade
              </Link>
            </span>
          </label>
          <button type="submit" disabled={loading} className="landing-btn-primary w-full text-sm disabled:opacity-60">
            {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-hidden /> : 'Subscrever'}
          </button>
        </form>
      </aside>
    )
  }

  return (
    <section className="blog-newsletter" aria-labelledby="blog-newsletter-title">
      <h2 id="blog-newsletter-title" className={isCompact ? 'text-lg font-semibold' : 'text-xl font-semibold sm:text-2xl'}>
        Newsletter TegLion
      </h2>
      <p className={`mt-2 text-white/85 ${isCompact ? 'text-sm' : ''}`}>
        {insight} Sem spam — artigos e dicas para escritórios e independentes.
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
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
          <span>
            Aceito receber e-mails da TegLion. Pode cancelar a qualquer momento.{' '}
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
