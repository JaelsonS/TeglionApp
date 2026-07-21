import { BRAND } from '@/shared/config/brand'

/** Autor único do blog Teglion — fonte de verdade para UI e JSON-LD. */
export const BLOG_AUTHOR = {
  name: 'Jaelson Santos',
  role: 'Fundador do Teglion · Escreve sobre fiscalidade em Portugal',
  bio: 'Formado em contabilidade no Brasil, vivo em Coimbra e estudo a fiscalidade portuguesa enquanto construo o Teglion — software nascido do dia-a-dia de um escritório de contabilidade. Estes guias são educativos: ajudam a perceber obrigações e a preparar a conversa com o contabilista certificado (OCC), não o substituem.',
  image: '/blog/authors/jaelson-santos.jpg',
  imageAlt: 'Jaelson Santos, fundador do Teglion',
  email: BRAND.emails.hello,
  phoneDisplay: BRAND.phone.display,
  url: 'https://www.linkedin.com/in/jaelson-santos-8628b52a4/',
  sameAs: [
    'https://www.linkedin.com/in/jaelson-santos-8628b52a4/',
    'https://x.com/jaelsonsil56152',
    'https://www.instagram.com/jaelsonsantoos',
    'https://www.facebook.com/share/1EBexVJ9oU/',
    'https://www.threads.com/@jaelsonsantoos',
    'https://www.tiktok.com/@jaelsonsantoos345',
    'https://github.com/JaelsonS',
    BRAND.phone.whatsapp,
  ],
  social: [
    { id: 'whatsapp', label: 'WhatsApp', href: BRAND.phone.whatsapp },
    { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/jaelson-santos-8628b52a4/' },
    { id: 'x', label: 'X', href: 'https://x.com/jaelsonsil56152' },
    { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/jaelsonsantoos' },
    { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/share/1EBexVJ9oU/' },
    { id: 'threads', label: 'Threads', href: 'https://www.threads.com/@jaelsonsantoos' },
    { id: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/@jaelsonsantoos345' },
    { id: 'github', label: 'GitHub', href: 'https://github.com/JaelsonS' },
  ],
} as const

export type BlogAuthorSocialId = (typeof BLOG_AUTHOR.social)[number]['id']
