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
| `/auth` | Escolha gabinete/cliente |
| `/auth/firm/login`, `/mfa`, `/register`, `/register/google` | Auth gabinete |
| `/auth/firm/convite/:token`, `/team-invite/:token`, `/confirm-email/:token` | Convites firm |
| `/auth/client/login`, `/register`, `/convite/:token` | Auth cliente |
| `/recover-password`, `/reset-password` | Recuperação |

## C · App gabinete `/app/firm/*`

Painel · Clientes · Hub cliente · Pagamentos · Imóveis/rendas · SAF-T · Calculadoras · Documentos (pedidos/ficheiros/histórico) · Tarefas · Agenda · Calendário fiscal · Mensagens · Alertas · Notícias · IRS · Serviços · Plano · Definições · Ajuda · Sobre

## D · Portal cliente `/app/client/*`

Dashboard · Pedidos · Serviços · Mais · Mensagens · Documentos · Arquivo · Agenda/obrigações · Updates · Conta · no-access

## E · Público gabinete

`/:firmSlug` · `/:firmSlug/servicos/:serviceSlug` · `/:firmSlug/booking/return` · `/pedidos/:token`

## F · Manual / legal

`/manual` + 18 capítulos · `/termos` · `/privacidade` · `/cookies` · `/dpa` · `/aviso-legal` · 404

## Regras da repaginação

- Não remover rotas nem funcionalidades; redirects OK.
- Não alterar contratos backend.
- Uma pele visual (tokens + design-system) em todas as superfícies.
- Vocabulário PT de mercado: **gabinete** (não imitar copy de concorrentes).
- Shell responsivo: mobile &lt;768 · tablet 768–1279 · desktop ≥1280.

## Progresso — **COMPLETO**

| Wave | Conteúdo | Estado |
|------|----------|--------|
| Base–14 | DS, shells, propósitos, landing/SEO própria, gabinete app | feito |
| 15 | Smoke responsivo (tabs settings, clearance portal) | feito |
| 16 | Maya + Manual residual «gabinete» | feito |
| **Entrega** | Repaginação UI fechada na branch | **100%** |
| Merge → staging | PR / merge geral | a seguir |
