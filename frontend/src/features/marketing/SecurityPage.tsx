import { Link } from 'react-router-dom'
import { Lock, Server, Shield, Users } from 'lucide-react'

import { LandingMarketingShell } from '@/shared/components/landing/LandingMarketingShell'
import { LandingSocialProof } from '@/shared/components/landing/LandingSocialProof'
import { FadeInView } from '@/shared/components/landing/FadeInView'
import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { BRAND } from '@/shared/config/brand'

const PILLARS = [
  {
    icon: Lock,
    title: 'Autenticação segura',
    body: 'Sessões em cookies httpOnly, tokens de curta duração, bloqueio após tentativas falhadas e política de palavras-passe forte.',
  },
  {
    icon: Users,
    title: 'Isolamento multi-tenant',
    body: 'Cada escritório opera num espaço isolado. Dados de clientes e documentos são sempre filtrados por escritório na API.',
  },
  {
    icon: Server,
    title: 'Infraestrutura na UE',
    body: 'Base de dados e storage em fornecedores com datacenters europeus. Sem transferência de dados fiscais para fora da UE.',
  },
  {
    icon: Shield,
    title: 'RGPD e conformidade',
    body: 'DPA disponível, registo de consentimentos, páginas legais públicas e audit trail de acções sensíveis (login, documentos, hub).',
  },
] as const

const CHECKLIST = [
  'Encriptação TLS em trânsito (HTTPS obrigatório)',
  'Cookies Secure + SameSite em produção',
  'Protecção CSRF em mutações autenticadas',
  'Rate limiting em login e APIs públicas',
  'Uploads validados por tipo e tamanho',
  'Logs de auditoria para acções críticas',
  'Backups geridos pelo fornecedor cloud (Supabase)',
  'Sem partilha de dados entre escritórios',
] as const

function SecurityPage() {
  return (
    <LandingMarketingShell
      title={`Segurança e confiança | ${BRAND.name}`}
      description="Como o TegLion protege dados de escritórios de contabilidade e dos seus clientes — RGPD, isolamento multi-tenant e infraestrutura na UE."
      path="/security"
    >
      <section className="landing-section">
        <div className="landing-container">
          <FadeInView className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#C9932E]">Confiança</p>
            <h1 className="mt-2 text-4xl font-semibold text-[#0F2942] sm:text-5xl">
              Segurança pensada para dados fiscais
            </h1>
            <p className="mt-4 text-lg text-[#4A5568]">
              O {BRAND.name} trata NIFs, documentos e comunicação entre contabilistas e PME. A segurança não é um
              add-on — está no desenho do produto.
            </p>
          </FadeInView>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <article key={title} className="landing-card p-6">
                <Icon className="h-8 w-8 text-[#0F2942]" aria-hidden />
                <h2 className="mt-4 text-lg font-semibold text-[#0F2942]">{title}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-[#4A5568]">{body}</p>
              </article>
            ))}
          </div>

          <div className="mt-14 rounded-2xl border border-[#0F2942]/10 bg-[#FAFAF7] p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[#0F2942]">Checklist técnico</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[#4A5568]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9932E]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to={authFirmRegisterUrl()} className="landing-btn-primary px-8 py-3 text-center">
              Experimentar 14 dias grátis
            </Link>
            <Link to="/dpa" className="landing-btn-ghost px-6 py-3 text-center">
              Ver DPA
            </Link>
            <a href={`mailto:${BRAND.emails.support}`} className="landing-btn-ghost px-6 py-3">
              Contactar segurança
            </a>
          </div>
        </div>
      </section>

      <LandingSocialProof showStats={false} className="landing-section border-t border-[#0F2942]/10 bg-[#FAFAF7]" />
    </LandingMarketingShell>
  )
}

export { SecurityPage }
export default SecurityPage
