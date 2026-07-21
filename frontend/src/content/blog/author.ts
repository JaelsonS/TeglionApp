import { BRAND } from '@/shared/config/brand'

/** Autor único do blog TegLion — fonte de verdade para UI e JSON-LD. */
export const BLOG_AUTHOR = {
  name: 'Jaelson Santos',
  role: 'Fundador do TegLion · Dev de software · Contabilidade (BR) → fiscalidade PT',
  bio: 'Formado em contabilidade no Brasil, vivo em Coimbra e aprofundo a fiscalidade portuguesa enquanto construo software. Vim de supervisão de vendas e estou na transição para desenvolvimento de Software. O TegLion nasce da dor real de uma contabilista em Portugal — documentos, prazos e clientes sem caos. Estes guias são investigação educativa; confirme sempre com um contabilista certificado (OCC).',
  image: '/blog/authors/jaelson-santos.jpg',
  imageAlt: 'Jaelson Santos, fundador do TegLion',
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
