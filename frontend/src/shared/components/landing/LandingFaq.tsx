import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { FadeInView } from '@/shared/components/landing/FadeInView'
import { cn } from '@/shared/lib/utils'

const FAQ = [
  {
    q: 'Quanto custa depois do teste?',
    a: '35 €/mês ou 359,88 €/ano (equiv. 29,99 €/mês), por escritório. Os 14 dias são grátis e sem cartão — só paga se decidir ficar.',
  },
  {
    q: 'Funciona com a Autoridade Tributária?',
    a: 'O Teglion organiza prazos, documentos e comunicação com clientes. A submissão oficial à AT continua pelos canais habituais — mas deixas de perder guias e anexos pelo caminho.',
  },
  {
    q: 'Os meus clientes precisam de instalar alguma coisa?',
    a: 'Não. Acedem pelo browser no telemóvel ou computador. Recebem um convite do escritório e entram no portal em minutos.',
  },
  {
    q: 'Posso migrar dados de outro software?',
    a: 'Podes começar com clientes novos no teste e importar a carteira com apoio da nossa equipa quando fizeres a transição.',
  },
  {
    q: 'Como cancelo?',
    a: 'No painel, quando a faturação estiver activa, ou por email. Sem período mínimo de fidelização.',
  },
  {
    q: 'Têm suporte em português?',
    a: 'Sim — suporte por email em dias úteis, em português, por quem conhece o dia a dia de um escritório.',
  },
] as const

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#0F2942]/10">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-semibold text-[#0F2942]">{q}</span>
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
