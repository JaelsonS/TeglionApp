import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { AgencyNameLink } from '@/shared/components/agency/AgencyNameLink'
import { FadeInView } from '@/shared/components/landing/FadeInView'
import { cn } from '@/shared/lib/utils'
import { PRICING_TEXT } from '@/shared/config/pricingConstants'

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: 'O que é o Teglion?',
    a: (
      <>
        O Teglion é software de gestão para gabinetes de contabilidade em Portugal: painel da
        equipa, portal do cliente e página pública no mesmo produto. Desenvolvido e operado pela{' '}
        <AgencyNameLink className="text-[#0B3A6E]" />. Teglion é o nome do produto — não uma empresa
        independente. Cada gabinete continua responsável pelos dados que introduz; o detalhe está
        nos Termos e na Política de Privacidade.
      </>
    ),
  },
  {
    q: 'Para quem é o Teglion?',
    a: 'Para gabinetes de contabilidade em Portugal que querem clientes, documentos, prazos, serviços e pagamentos no mesmo fluxo — com portal para o cliente final e site público da marca do gabinete.',
  },
  {
    q: 'Quanto custa depois do teste?',
    a: `${PRICING_TEXT.monthlyLabel}/mês ou ${PRICING_TEXT.yearlyTotalLabel}/ano (equiv. ${PRICING_TEXT.yearlyMonthlyLabel}/mês), por gabinete. Os ${PRICING_TEXT.trialDays} dias são grátis e sem cartão — só paga se decidir ficar.`,
  },
  {
    q: 'O que está incluído?',
    a: 'Painel do gabinete, portal do cliente, página pública, catálogo de serviços, fluxos de IRS, pedidos de documentos, mensagens, prazos, Google Calendar/Drive e pagamentos do cliente final na plataforma.',
  },
  {
    q: 'Posso ter uma página pública do gabinete?',
    a: 'Sim. Configuras a página com a tua marca, serviços e marcação — o cliente acede sem precisares de montar um site à parte nem gerir vários links.',
  },
  {
    q: 'Os clientes podem pagar serviços no Teglion?',
    a: 'Sim. O pagamento do cliente final ao gabinete fica na plataforma, ligado ao fluxo de serviços e marcações — sem saltar para outro sistema só para cobrar.',
  },
  {
    q: 'Há inteligência artificial?',
    a: 'Ainda não no produto. A IA no contexto do gabinete (apoio a documentos e fecho do mês) está planeada e marcada como “em breve” — não vendemos como pronta.',
  },
  {
    q: 'Funciona no telemóvel?',
    a: 'Sim. O portal e o gabinete abrem no browser — e podes instalar como app (PWA) no telemóvel ou tablet.',
  },
  {
    q: 'Funciona com a Autoridade Tributária?',
    a: 'O Teglion organiza prazos, documentos e comunicação com clientes. A submissão oficial à AT continua pelos canais habituais — mas deixas de perder guias e anexos pelo caminho.',
  },
  {
    q: 'Os meus clientes precisam de instalar alguma coisa?',
    a: 'Não. Acedem pelo browser no telemóvel ou computador. Recebem um convite do gabinete e entram no portal em minutos.',
  },
  {
    q: 'Como cancelo?',
    a: 'No painel, quando a faturação estiver activa, ou por email. Sem período mínimo de fidelização.',
  },
  {
    q: 'Têm suporte em português?',
    a: 'Sim — suporte por email em dias úteis, em português, por quem conhece o dia a dia de um gabinete.',
  },
]

function FaqItem({ q, a }: { q: string; a: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#0B3A6E]/10">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-semibold text-[#0B3A6E]">{q}</span>
        <ChevronDown className={cn('h-5 w-5 shrink-0 text-[#4A5568] transition', open && 'rotate-180')} />
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
            <p className="pb-4 text-[15px] leading-relaxed text-[#4A5568]">{a}</p>
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
          <h2 className="text-3xl font-semibold sm:text-4xl">Perguntas frequentes</h2>
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
