import type { ReactNode } from 'react'
import { BrandMark } from '@/shared/components/brand/BrandMark'
import { ShieldCheck, Clock3, Sparkles } from 'lucide-react'

export function AuthLayout({
    title,
    subtitle,
    children,
    footer,
    leftPanelSlot,
}: {
    title: string
    subtitle?: string
    children: ReactNode
    footer?: ReactNode
    leftPanelSlot?: ReactNode
}) {
    return (
        <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
            <div className="relative min-h-screen overflow-hidden">
                <div className="pointer-events-none absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-[#0f2942]/15 blur-3xl" />
                <div className="pointer-events-none absolute right-[-120px] top-[20%] h-96 w-96 rounded-full bg-[#2b6cb0]/15 blur-3xl" />

                <div className="relative mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-stretch lg:px-10 lg:py-10">
                    <section className="hidden overflow-hidden rounded-[2rem] border border-[#0f2942]/10 bg-gradient-to-br from-[#0f2942] via-[#123a61] to-[#195285] p-10 text-white shadow-[0_40px_120px_rgba(15,41,66,0.32)] lg:sticky lg:top-8 lg:flex lg:self-start lg:flex-col lg:gap-6">
                        <div>
                            <BrandMark size="lg" variant="onDark" showName nameClassName="text-xl" />
                            <p className="mt-10 max-w-md text-4xl font-semibold leading-tight">
                                Gestão contábil com cara de produto enterprise.
                            </p>
                            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-200">
                                Centralize clientes, documentos, obrigações e comunicação num fluxo claro e seguro para escritório e cliente final.
                            </p>
                        </div>

                        {leftPanelSlot ? (
                            <div>{leftPanelSlot}</div>
                        ) : (
                            <div className="space-y-4">
                                <FeatureLine
                                    icon={<ShieldCheck className="h-4 w-4" />}
                                    text="Cadastro de clientes, documentos e obrigações com segurança e rastreabilidade."
                                />
                                <FeatureLine
                                    icon={<Clock3 className="h-4 w-4" />}
                                    text="As tarefas do dia ficam visíveis num só lugar, sem idas e vindas."
                                />
                                <FeatureLine
                                    icon={<Sparkles className="h-4 w-4" />}
                                    text="Interface limpa para a equipa trabalhar com menos ruído."
                                />
                            </div>
                        )}
                    </section>

                    <section className="flex flex-col justify-center">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <BrandMark size="md" variant="onLight" showName className="shadow-sm" />
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Teglion
                            </span>
                        </div>

                        <div className="mb-7 space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
                            {subtitle ? <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{subtitle}</p> : null}
                        </div>

                        <div className="w-full">{children}</div>

                        {footer ? <div className="mt-6">{footer}</div> : null}
                    </section>
                </div>
            </div>
        </main>
    )
}

function FeatureLine({ icon, text }: { icon: ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-slate-100 backdrop-blur">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20">{icon}</span>
            <span>{text}</span>
        </div>
    )
}
