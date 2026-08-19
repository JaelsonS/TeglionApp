# Prompt brutal — repaginação da página pública (próxima conversa)

Copiar o bloco abaixo **inteiro** para uma conversa nova no Cursor. Anexar as duas imagens de referência.

**Imagens (obrigatórias):**
- `docs/03-PRODUTO/assets/public-site-desktop-repaginate.png`
- `docs/03-PRODUTO/assets/public-site-mobile-repaginate.png`

**Já feito nesta sessão (não reimplementar do zero):**
- `header.content.title` e `hero.content.title` editáveis e independentes (fallback → nome público)
- Inputs no editor: «Texto do cabeçalho (esquerda)» + «Título em destaque (H1)»
- Largura desktop `lg:max-w-4xl` nas secções do template default
- Backend `normalizeSectionContent` já persiste `title` em header/hero

---

## PROMPT (colar na conversa nova)

```
OBJETIVO
Repaginar a página pública do escritório Teglion para ficar visualmente idêntica às imagens de referência anexadas (desktop + mobile), SEM retirar funcionalidades existentes e reaproveitando 100% da estrutura de secções, dados, APIs e editor.

CONTEXTO DO PRODUTO
- Teglion = produto SaaS; AfDigital — Soluções Tecnológicas = entidade; domínio teglion.com.
- Página pública = vitrine do escritório em `/:firmSlug` (preview `?preview=`).
- Git: trabalhar em feature/fix branch a partir de `staging`; PR → staging; NUNCA main sem aprovação.
- Identidade visual Teglion: navy #0F2942, gold #C9932E, canvas #FAFAF7 (ver `frontend/src/shared/config/brand.ts`). A página do escritório usa branding do firm via CSS vars (`--brand-*` / `--primary`), não BrandMark Teglion no site do cliente.

IMAGENS DE REFERÊNCIA (PIXEL / LAYOUT TARGET)
1) docs/03-PRODUTO/assets/public-site-desktop-repaginate.png
2) docs/03-PRODUTO/assets/public-site-mobile-repaginate.png
Replicar hierarquia, espaçamento, tipografia relativa, CTAs, grelha de serviços e sensação “SaaS enterprise limpo”. Não inventar secções novas fora do builder. Não fugir para purple/cream/terracotta/broadsheet.

REGRAS DURAS — NÃO RETIRAR / REAPROVEITAR
- Manter todas as secções do builder na mesma ordem lógica:
  header → hero → about → services → bookingServices → features → process → faq → contact → footer
- Manter enabled/disabled por secção; about/features/process podem continuar off por default.
- Manter CTAs do hero (tipos: booking, whatsapp, service-detail, contact-form, external-url).
- Manter serviços vindos do catálogo live (`mode: 'auto'`), preços (`showPrices`), FAQ, contact toggles, social links, livro de reclamações / elogios.
- Manter preview token, draft/publish, live preview no `PublicSiteEditor`.
- Manter o mesmo template registry (`default`) — evoluir DefaultTemplate/DefaultSections, não criar template paralelo sem necessidade.
- Manter payload JSONB em `firm_public_sites` + normalização backend; qualquer campo novo = FE types + BE normalize + editor + render.
- NÃO remover campos existentes; só adicionar/estilizar.
- Textos independentes (já existem — usar):
  - header.content.title = marca curta no header (esquerda)
  - hero.content.title = H1 do destaque
  - hero.tagline / hero.bio = frase + parágrafo
  - Fallback de ambos os titles → firmName público (displayName || firm.name)
  - Footer continua a mostrar o nome público/legal (firmName), não misturar com header title
- Logo continua a vir das definições de identidade (não inventar upload só no header).
- Contacto email/phone/address continua a vir de settings do escritório.

FICHEIROS ÂNCORA (editar estes; ler antes de mudar)
- frontend/src/features/public-intake/FirmPublicSitePage.tsx
- frontend/src/features/public-intake/templates/default/DefaultTemplate.tsx
- frontend/src/features/public-intake/templates/default/DefaultSections.tsx
- frontend/src/features/firm/public-site/PublicSiteEditor.tsx
- frontend/src/features/firm/public-site/sectionEditors.tsx
- frontend/src/shared/types/firmPublicSite.ts
- backend/src/modules/firm/firm-public-site.service.js (+ .test.js)
- docs/03-PRODUTO/PAGINA-PUBLICA.md (actualizar só o que mudar de verdade)

DESIGN TARGET (alinhar às imagens, sem destruir o builder)
Desktop
- Conteúdo mais largo e centrado (~max-w-4xl / ~960px), fundo canvas claro.
- Header: barra limpa, texto curto editável à esquerda; sem repetir o H1.
- Hero: logo circular opcional → H1 distinto → tagline → bio → CTAs (primary navy + secondary outline).
- Serviços: grelha 2–3 colunas no desktop (cards limpos, sem dashed empty “caixote” feio quando há serviços; empty state pode manter mensagem mas com melhor tipografia).
- FAQ accordion + contactos + footer com redes; footer com nome mais discreto.
- Banner PRÉ-VISUALIZAÇÃO permanece no topo quando preview.

Mobile
- Manter sensação “bacana” actual; empilhar CTAs; uma coluna de serviços.
- Header + hero sem triplicar o mesmo string quando titles estão preenchidos.

Branding do escritório
- Respeitar cores por secção já editáveis (backgroundColor/textColor/titleColor/…).
- Defaults mais próximos de navy/gold Teglion quando firm não customizou (sem forçar BrandMark Teglion no site do cliente).
- Tipografia: hierarquia clara H1 > tagline > bio; evitar o aspecto “lista estreita mobile-only” no desktop.

O QUE NÃO FAZER
- Não criar landing Teglion aqui — isto é o site do escritório.
- Não atribuir personalidade jurídica a “Teglion” em copy legal.
- Não apontar migrations experimentais a Supabase PROD.
- Não merge para main.
- Não remover checkboxes/aceites legais de outras páginas.
- Não “redesignar” o editor inteiro; só o necessário para a preview bater certo com o público.

ACEITAÇÃO (teste brutal obrigatório antes de PR)
1) Preview e página publicada renderizam o MESMO DefaultTemplate.
2) header.title ≠ hero.title possíveis; vazios → firmName; rodapé = firmName.
3) Guardar rascunho → reload → valores persistem (normalize BE).
4) Publicar → GET público reflecte published, não draft.
5) Preview token continua a funcionar.
6) Serviços booking / não-booking / empty state OK.
7) CTAs todos os tipos + openInternalLinksInNewTab no editor.
8) Mobile + desktop visual alinhado às imagens (checklist side-by-side).
9) tsc + testes firm-public-site.service.test.js + smoke vitest relevantes.
10) Sem regressão no registo/login firm (fora de âmbito visual).

ENTREGA
- Branch a partir de staging (ex.: feature/public-site-repaginate).
- Diff focado; screenshots no PR (mobile + desktop) vs imagens de referência.
- Notas curtas no PR: o que reaproveitou vs o que mudou de CSS/layout.
```
