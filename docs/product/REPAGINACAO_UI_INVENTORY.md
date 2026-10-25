# Inventário de rotas — Repaginação UI Teglion

**Congelado em:** 2026-10-25  
**Fonte:** `frontend/src/shared/components/layout/ContabilAppRouter.tsx`  
**Branch de trabalho:** `feature/fase-repaginacao-ui`

Totais aproximados: **~55 destinos de produto** · **~90 path patterns** (incl. redirects) · blog ~33 · manual 18 capítulos.

## A · Marketing

| Path | Propósito |
|------|-----------|
| `/` | Landing comercial Teglion |
| `/pricing` | Planos |
| `/case-studies` | Casos |
| `/suporte` | Suporte |
| `/blog`, `/blog/:slug` | Blog |

## B · Auth

| Path | Propósito |
|------|-----------|
| `/auth` | Escolha firm/cliente |
| `/auth/firm/login`, `/mfa`, `/register`, `/register/google` | Auth escritório |
| `/auth/firm/convite/:token`, `/team-invite/:token`, `/confirm-email/:token` | Convites firm |
| `/auth/client/login`, `/register`, `/convite/:token` | Auth cliente |
| `/recover-password`, `/reset-password` | Recuperação |

## C · App escritório `/app/firm/*`

Painel · Clientes · Hub cliente · Pagamentos · Imóveis/rendas · SAF-T · Calculadoras · Documentos (pedidos/ficheiros/histórico) · Tarefas (overview/obrigações/mês/manual/calendário/clientes) · Agenda · Calendário fiscal · Mensagens · Alertas · Notícias · IRS · Serviços · Plano · Definições · Ajuda · Sobre

## D · Portal cliente `/app/client/*`

Dashboard · Pedidos · Serviços · Mais · Mensagens · Documentos · Arquivo · Agenda/obrigações · Updates · Conta · no-access

## E · Público escritório

`/:firmSlug` · `/:firmSlug/servicos/:serviceSlug` · `/:firmSlug/booking/return` · `/pedidos/:token`

## F · Manual / legal

`/manual` + 18 capítulos · `/termos` · `/privacidade` · `/cookies` · `/dpa` · `/aviso-legal` · 404

## Regras da repaginação

- Não remover rotas nem funcionalidades; redirects OK.
- Não alterar contratos backend.
- Uma pele visual (tokens + design-system) em todas as superfícies.

## Progresso (branch `feature/fase-repaginacao-ui`)

| Wave | Conteúdo | Estado |
|------|----------|--------|
| Base | DS tokens, menu firm, Painel Hoje, PagePurpose | feito |
| 2 | Público, pricing, tarefas, portal (arquivo/updates/conta) | feito |
| 3 | Auth, legal, suporte, casos — navy + propósito | feito |
| 4 | Landing, blog, manual — navy único | feito |
| 5 | Residual navy, hero Teglion, 404/no-access | feito |
| 6 | Labels menu firm + chrome portal | feito |
| 7 | Blog + Ajuda/Sobre + rail sync | feito |
| 8 | Booking return + clareza pagamentos | feito |
| 9 | Copy pt-PT residual + inventário | feito |
| 10 | Atmosfera canvas firm + portal (sem cream) | feito |
| 11 | Topbar + painéis clientes/docs + crumb labels | feito |
| 12 | Hub cliente + calendário fiscal | feito |
| 13 | Vocabulário PT «gabinete» + copy/SEO própria Teglion | feito |
| Merge → staging | Só quando a repaginação estiver completa | pendente |
