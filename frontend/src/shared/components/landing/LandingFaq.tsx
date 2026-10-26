import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { FadeInView } from '@/shared/components/landing/FadeInView'
import { cn } from '@/shared/lib/utils'
import { PRICING_TEXT } from '@/shared/config/pricingConstants'

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: 'O que é o Teglion?',
    a: (
      <>
        Software SaaS de gestão para gabinetes de contabilidade em Portugal: painel da equipa,
        portal do cliente e página pública no mesmo sistema. Cada gabinete é responsável pelos
        dados que introduz — o detalhe está nos{' '}
        <Link to="/termos" className="font-medium text-[var(--landing-navy)] underline-offset-2 hover:underline">
          Termos
        </Link>{' '}
        e na{' '}
        <Link
          to="/privacidade"
          className="font-medium text-[var(--landing-navy)] underline-offset-2 hover:underline"
        >
          Privacidade
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Para quem é?',
    a: 'Para gabinetes em Portugal que querem clientes, documentos, prazos, serviços e pagamentos no mesmo fluxo — com portal para o cliente final e site público da marca do gabinete.',
  },
  {
    q: 'Quanto custa depois do teste?',
    a: `${PRICING_TEXT.monthlyLabel}/mês ou ${PRICING_TEXT.yearlyTotalLabel}/ano (equiv. ${PRICING_TEXT.yearlyMonthlyLabel}/mês), por gabinete. Os ${PRICING_TEXT.trialDays} dias são grátis e sem cartão — só paga se decidir ficar.`,
  },
  {
    q: 'O que está incluído?',
    a: 'Painel do gabinete, portal do cliente, página pública, catálogo de serviços, fluxos de IRS, pedidos de documentos, mensagens, prazos e pagamentos do cliente final na plataforma.',
  },
  {
    q: 'Os clientes podem pagar no Teglion?',
    a: 'Sim. O pagamento do cliente final ao gabinete fica na plataforma, ligado a serviços e marcações.',
  },
  {
    q: 'Funciona no telemóvel?',
    a: 'Sim. Portal e gabinete abrem no browser — e pode instalar como app (PWA) no telemóvel ou tablet.',
  },
  {
    q: 'Como cancelo?',
    a: 'No painel, quando a faturação estiver activa, ou por email. Sem período mínimo de fidelização.',
  },
  {
    q: 'Têm suporte em português?',
    a: 'Sim — suporte por email e WhatsApp em português, em dias úteis.',
  },
]

function FaqItem({ q, a }: { q: string; a: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[var(--landing-navy)]/10">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-semibold text-[var(--landing-navy)]">{q}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-[var(--landing-muted)] transition',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-[15px] leading-relaxed text-[var(--landing-muted)]">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function LandingFaq() {
  return (
    <section id="faq" className="landing-section scroll-mt-24 bg-white">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center">
          <p className="landing-kicker">FAQ</p>
          <h2 className="mt-3 text-[1.85rem] leading-tight sm:text-4xl">Perguntas frequentes</h2>
        </FadeInView>
        <FadeInView className="mx-auto mt-10 max-w-2xl">
          {FAQ.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </FadeInView>
      </div>
    </section>
  )
}
