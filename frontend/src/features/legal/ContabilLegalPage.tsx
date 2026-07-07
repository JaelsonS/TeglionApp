import { Link } from 'react-router-dom'

import { getContabilLegalDocument } from '@/features/legal/contabil/documents'
import { CONTABIL_LEGAL_OPERATOR } from '@/features/legal/contabil/operator'
import type { ContabilLegalDocKey } from '@/features/legal/contabil/versions'

const FOOTER_LINKS: { key: ContabilLegalDocKey; href: string; label: string }[] = [
  { key: 'terms', href: '/termos', label: 'Termos' },
  { key: 'privacy', href: '/privacidade', label: 'Privacidade' },
  { key: 'dpa', href: '/dpa', label: 'DPA' },
  { key: 'cookies', href: '/cookies', label: 'Cookies' },
  { key: 'notice', href: '/aviso-legal', label: 'Aviso legal' },
]

export type ContabilLegalPageKey = ContabilLegalDocKey

export function ContabilLegalPage({ page }: { page: ContabilLegalPageKey }) {
  const doc = getContabilLegalDocument(page)
  const op = CONTABIL_LEGAL_OPERATOR

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link to="/" className="font-semibold text-[#0f2942]">
            {op.brand}
          </Link>
          <nav className="flex flex-wrap gap-3 text-xs text-slate-600">
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.key}
                to={l.href}
                className={l.key === page ? 'font-semibold text-[#0f2942]' : 'hover:text-slate-900'}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{doc.subtitle}</p>
        <h1 className="mt-1 text-3xl font-semibold text-[#0f2942]">{doc.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {doc.updatedAtLabel}: {doc.updatedAtValue} · Ref. {doc.version}
        </p>
        <div className="prose prose-slate mt-8 max-w-none space-y-6 text-sm leading-relaxed text-slate-700">
          {doc.intro.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {doc.sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              {section.paragraphs.map((p) => (
                <p key={p} className="mt-2">
                  {p}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
        <footer className="mt-12 border-t border-slate-200 pt-6 text-xs text-slate-500">
          <p>
            {op.legalName} · NIF {op.nif} · {op.address} ·{' '}
            <a href={`mailto:${op.email}`} className="text-[#0f2942] hover:underline">
              {op.email}
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}
