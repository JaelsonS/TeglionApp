import { useEffect, useState } from 'react'

const CAROUSEL_SLIDES = [
    {
        src: '/landing/screens/dashboard.png',
        alt: 'Visão geral do escritório com indicadores e atalhos',
        caption: 'Painel do escritório com visão rápida de tudo o que importa.',
    },
    {
        src: '/landing/screens/tarefas-calendario.png',
        alt: 'Calendário de tarefas e obrigações do escritório',
        caption: 'Calendário e tarefas lado a lado para cumprir prazos com clareza.',
    },
    {
        src: '/landing/screens/portal-cliente.png',
        alt: 'Portal do cliente para partilha de documentos',
        caption: 'Portal do cliente para envio de documentos e acompanhamento.',
    },
] as const

export function OfficeScreensCarousel() {
    const [active, setActive] = useState(0)

    useEffect(() => {
        const timer = window.setInterval(() => {
            setActive((current) => (current + 1) % CAROUSEL_SLIDES.length)
        }, 4500)
        return () => window.clearInterval(timer)
    }, [])

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur">
                <img
                    src={CAROUSEL_SLIDES[active].src}
                    alt={CAROUSEL_SLIDES[active].alt}
                    className="h-[220px] w-full rounded-xl object-cover xl:h-[250px]"
                    loading="eager"
                />
            </div>

            <p className="text-sm leading-6 text-slate-100">{CAROUSEL_SLIDES[active].caption}</p>

            <div className="flex items-center gap-2" aria-label="Indicadores do carrossel">
                {CAROUSEL_SLIDES.map((slide, index) => (
                    <button
                        key={slide.src}
                        type="button"
                        onClick={() => setActive(index)}
                        className={
                            index === active
                                ? 'h-2.5 w-8 rounded-full bg-white'
                                : 'h-2.5 w-2.5 rounded-full bg-white/50 transition hover:bg-white/80'
                        }
                        aria-label={`Ver imagem ${index + 1}`}
                        aria-pressed={index === active}
                    />
                ))}
            </div>
        </div>
    )
}