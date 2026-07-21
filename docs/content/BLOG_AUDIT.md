# Auditoria editorial do blog TegLion (Jul 2026)

Matriz de decisão para os artigos publicados. Actualizar trimestralmente.

Legenda: **M** manter · **R** reescrever/enriquecer · **F** fundir · **A** arquivar

| Slug | Decisão | Notas |
|------|---------|--------|
| guia-completo-trabalhador-independente-portugal-2026 | M/R | Pilar hub — featured |
| calendario-fiscal-portugal-2026-completo | M/R | Actualizar trimestral (AT/SS) |
| digitalizar-escritorio-contabilidade-portugal | M/R | Série operações TegLion |
| deducoes-irs-portugal-guia-completo | M/R | Série zero→IRS |
| como-escolher-contabilista-portugal | M | Conversão B2B + FAQ (2026-07-21) |
| portal-financas-guia-completo-iniciantes | M/R | Tutorial + FAQ |
| declaracao-irs-guia-pratico | M/R | Série zero→IRS |
| gestao-prazos-fiscais-escritorio-contabilidade | M/R | Série operações |
| software-escritorio-contabilidade-portugal | M | Landing intenção SEO + FAQ |
| irc-sociedades-lda-portugal-guia | M | PME + FAQ |
| abrir-sociedade-lda-portugal-passo-a-passo | M | PME + FAQ |
| saft-efatura-validacao-documentos-escritorio | M | Escritórios + FAQ |
| caso-escritorio-digitalizacao-prazos | M | Case + FAQ |
| caso-pme-transicao-eni-lda | M | Case + FAQ |
| contabilidade-explicada-leigos-portugal | M | Topo funil |
| estudar-contabilidade-portugal-guia-estudantes | M | Estudantes |
| ferramentas-essenciais-contabilista-2026 | M | Escritórios |
| organizar-documentos-fiscais-arquivo-digital | M | + FAQ |
| como-emitir-recibo-verde-passo-a-passo | M | |
| seguranca-social-trabalhador-independente | M | |
| quanto-custa-abrir-actividade-portugal | M | |
| irs-recibos-verdes-erros-comuns | M | + FAQ |
| escolher-software-faturacao-portugal | M | |
| retencao-fonte-recibos-verdes | M | + FAQ |
| freelancer-estrangeiro-portugal | M | + FAQ |
| regime-simplificado-vs-contabilidade-organizada | M | + FAQ |
| quando-passar-de-isento-a-iva | M | + FAQ |
| prazos-irs-2026-independentes | M | Actualizar anualmente |
| abrir-empresa-individual-eni | M | + FAQ |
| obrigacoes-fiscais-mes-a-mes | M | |
| iva-quando-preciso-de-me-registar | M | |
| recibos-verdes-vs-faturacao | M | |
| proteger-dados-fiscais-freelancer-portugal | M | |

**Nenhum artigo arquivado nesta ronda.** Featured activos: 4 pilares (independente, calendário, digitalizar, escolher contabilista).

## Ronda 2026-07-21

- Sticky rail do índice: removido `landing-page`/`overflow-x:hidden` que matava `position:sticky`
- FAQ schema em todos os slugs em falta (15+) via `pillar-faqs.ts`
- Titles SERP ≤ ~55–60 caracteres; JSON-LD usa `seo.description`
- Próximo: capas OG únicas (menos Unsplash/SVG repetido); 1 artigo novo/semana

## Cadência operacional

- **1 artigo novo / semana** (terça ou quarta)
- **1 actualização de pilar / mês** (datas AT, limiares IVA, IRS)
- Newsletter: 1 insight fiscal + 1 link produto (rail direito)
- Repurpose: 3 takeaways → LinkedIn + WhatsApp Status (ver `BLOG_AUTHORING.md`)

## Funil a medir (GA4 / GTM)

- `blog_post_view`
- `blog_newsletter_subscribe` / `blog_lead_magnet_subscribe`
- `blog_product_click`
- Conversão: `/auth/firm/register` com `utm_source=blog`

## Evolução ainda em aberto (prioridade)

1. Capas/OG distintas por pilar (CTR social + SERP)
2. Mid-links internos mais densos nos artigos «caso»
3. Autor com foto/bio OCC mais forte (E-E-A-T)
4. Index: reduzir chrome de share nos cards; reforçar hero editorial
