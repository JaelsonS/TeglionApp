# Blog TegLion — autoría e SEO

Guia único para criar artigos, afiliados, newsletter e deploy SEO.

---

## URLs

| Página | URL |
|--------|-----|
| Índice | `/blog` |
| Artigo | `/blog/{slug}` |

Produção: [teglion.com/blog](https://teglion.com/blog)

---

## Arquitectura actual

```
frontend/src/content/blog/
├── posts/*.ts           # Conteúdo completo de cada artigo
├── all-posts.ts         # Registo para build (prerender + catálogo)
├── catalog.json         # Metadados leves (índice, cards) — gerado
├── post-loaders.ts      # Import dinâmico por slug (runtime)
├── read-prerendered-post.ts  # Lê JSON embutido no HTML (PageSpeed)
├── pillar-faqs.ts       # FAQs injectadas por slug
├── affiliates.ts        # Links Amazon / Hotmart
└── shared.ts            # Helpers de blocos
```

**Não existe CMS headless** — artigos são ficheiros TypeScript versionados no Git. Futuro: Sanity/Contentful (ver roadmap em `STATUS.md`).

---

## Novo artigo (4 passos)

### 1. Criar o post

Ficheiro: `frontend/src/content/blog/posts/meu-artigo.ts`

```ts
import type { BlogPost } from '@/content/blog/types'
import { legalCallout, proseParagraphs } from '@/content/blog/shared'

export const postMeuArtigo: BlogPost = {
  slug: 'meu-artigo',
  title: 'Título do artigo',
  excerpt: 'Resumo para cards e meta description.',
  publishedAt: '2026-06-18',
  updatedAt: '2026-06-18',
  author: 'Equipa TegLion',
  category: 'Guias completos',
  tags: ['tag1', 'tag2'],
  readMinutes: 12,
  coverImage: {
    src: 'https://images.unsplash.com/...',
    alt: 'Descrição da imagem',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Título SEO | Blog TegLion',
    description: 'Meta description até ~160 caracteres.',
    keywords: ['palavra-chave'],
  },
  relatedSlugs: ['outro-artigo'],
  blocks: [
    legalCallout(),
    ...proseParagraphs('Primeiro parágrafo.', 'Segundo parágrafo.'),
    // h2, tabelas, afiliados, etc.
  ],
}
```

### 2. Registar em `all-posts.ts`

Importar e adicionar ao array `RAW_POSTS` (mais recente primeiro).

### 3. Gerar SEO assets

```bash
cd frontend && npm run seo:generate
```

Regenera `catalog.json`, `public/sitemap.xml` e `public/rss.xml`.

### 4. Build (prerender automático)

```bash
npm run build
```

Cria `dist/blog/{slug}/index.html` com conteúdo, meta tags, JSON-LD e payload JSON para hidratação rápida.

---

## Blocos disponíveis

Ver `frontend/src/content/blog/types.ts`:

| Tipo | Uso |
|------|-----|
| `p`, `h2`, `h3`, `ul`, `ol` | Texto |
| `image` | Unsplash ou `/blog/images/...` em `public/` |
| `callout` | Avisos (`legal`, `tip`, `warning`, `info`) |
| `link` | Ligação interna (`slug`) |
| `affiliate` | Caixa de produto afiliado |
| `table` | Tabelas comparativas |
| `faq` | Perguntas frequentes (schema FAQPage) |
| `teglionCta` | CTA para teste grátis escritório |

Helpers em `shared.ts`: `affiliateBlock`, `affiliateSection`, `articleSection`, `keyTakeaways`, `legalCallout`, etc.

**Obrigatório:** `legalCallout()` no início (e no fim se necessário).

---

## Afiliados

Links centralizados em `frontend/src/content/blog/affiliates.ts` (Amazon + Hotmart activos).

```ts
affiliateBlock({
  key: 'hotmartReciboVerde7Dias',
  leadIn: 'Contexto antes do link.',
  title: 'Nome do produto',
  description: 'Uma linha.',
})
```

AdSense só com `VITE_ADSENSE_LIVE=true` no deploy. Caso contrário, slots mostram afiliados (`BlogMonetizationSlot`).

### Próximos programas a afiliar (prioridade)

| Prioridade | Programa | Porquê |
|------------|----------|--------|
| Alta | Amazon Associates **BR** (quando houver tráfego BR) | Mesmo catálogo + moeda local |
| Alta | Hotmart — mais produtos PT/BR (facturação, MEI, IRPF BR) | Já funciona; falta variedade |
| Média | Wise / Revolut Business | Freelancers e estrangeiros |
| Média | NordVPN / 1Password / Bitwarden | Artigos de segurança e portal Finanças |
| Média | Hostinger / Cloudflare | Quem abre site + actividade |
| Baixa | Softwares PT (Moloni, InvoiceXpress, etc.) | Só se tiverem programa claro |
| Evitar | «Get rich» / cripto / empréstimos | Risco AdSense e E-E-A-T |

Para Google AdSense: conteúdo original > densidade de afiliados. Disclosure obrigatório; não transformar o artigo numa loja.

---

## Newsletter

- API: `POST /api/public/blog/newsletter` `{ email, consent: true, source }`
- Tabela: `blog_newsletter_subscribers` (Supabase)
- Opcional: `BLOG_NEWSLETTER_NOTIFY_EMAIL` no Render

---

## SEO técnico (automático no build)

| Feature | Ficheiro |
|---------|----------|
| Prerender HTML | `scripts/prerender-static.ts` |
| Sitemap + RSS | `scripts/generate-seo-assets.mjs` |
| Meta + JSON-LD cliente | `useBlogSeo.ts` |
| FAQ schema | `pillar-faqs.ts` + prerender |
| PageSpeed | `read-prerendered-post.ts`, capa 640px, sem auth preload no blog |

### Indexação Google (manual)

- [ ] Verificar domínio no Search Console
- [ ] Submeter `https://teglion.com/sitemap.xml`
- [ ] Pedir indexação de artigos pillar

### Conteúdo SEO

- 27 artigos activos; objectivo: pillars 2000+ palavras
- Imagens próprias (substituir Unsplash gradualmente) — E-E-A-T
- AdSense só com tráfego; usar afiliados até lá (`VITE_ADSENSE_LIVE`)

---

## Checklist antes de publicar

- [ ] `legalCallout()` no início
- [ ] `coverImage` com `alt` descritivo
- [ ] `seo.title` e `seo.description` únicos
- [ ] Registado em `all-posts.ts`
- [ ] `npm run seo:generate` executado
- [ ] Build local sem erros
- [ ] Artigo legível em mobile (tabelas, imagens)
