import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { subscribeBlogNewsletter } from '@/features/blog/subscribeBlogNewsletter'
import { trackBlogEvent } from '@/features/blog/blogAnalytics'

type Props = {
  source?: string
  title?: string
  description?: string
}

export function BlogLeadMagnet({
  source = 'blog-lead-magnet',
  title = 'Checklist IRS independentes 2026',
  description = 'Receba no e-mail a checklist mensal (documentos, prazos AT/SS e erros a evitar). Sem spam.',
}: Props) {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !consent) {
      toast.error('Indique o e-mail e aceite receber a checklist.')
      return
    }
    setLoading(true)
    try {
      await subscribeBlogNewsletter({ email, source: source.slice(0, 80), consent: true })
      trackBlogEvent('blog_lead_magnet_subscribe', { source: source.slice(0, 40) })
      toast.success('Checklist pedida. Em breve recebe novidades no e-mail.')
      setEmail('')
      setConsent(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside id="blog-lead-magnet" className="blog-lead-magnet" aria-labelledby="blog-lead-magnet-title">
      <p className="blog-rail-eyebrow">Grátis</p>
      <h2 id="blog-lead-magnet-title" className="blog-rail-title">
        {title}
      </h2>
      <p className="blog-rail-text mt-2">{description}</p>
      <form className="mt-4 space-y-2" onSubmit={onSubmit} noValidate>
        <label className="sr-only" htmlFor="blog-lead-email">
          E-mail
        </label>
        <input
          id="blog-lead-email"
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
            Quero receber a checklist e conteúdos úteis da TegLion.{' '}
            <Link to="/privacidade" className="underline underline-offset-2">
              Privacidade
            </Link>
          </span>
        </label>
        <button type="submit" disabled={loading} className="landing-btn-primary w-full text-sm disabled:opacity-60">
          {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-hidden /> : 'Receber checklist'}
        </button>
      </form>
    </aside>
  )
}
