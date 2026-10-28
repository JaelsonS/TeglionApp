# Estado actual do Teglion (produção)

**Actualizado:** 28 de outubro de 2026  
**Branch de produção:** `main` (merge soft launch [#291](https://github.com/JaelsonS/TeglionApp/pull/291) — staging → main)  
**Uso comercial:** escritórios em produção em `www.teglion.com` · soft launch comercial **29/10/2026**

Este ficheiro é o **snapshot operacional**. Não inclui IDs de projectos cloud nem limiares de abuso.

---

## O que está em produção hoje

- Núcleo: clientes, documentos, tarefas, agenda, MFA, cofre, Stripe billing/Connect, Maya, página pública por slug, portal cliente
- **V10 Ops+Fiscal** (após #291): avenças/pagamentos internos, calculadoras fiscais, rendas, SAF-T (leitura), Manual `/manual`
- **Control Center** AfDigital: gated por env + MFA (ver carta de produto, sem detalhes operacionais no repo público)

## Capacidade e escala

| Dimensão | Estado |
|----------|--------|
| Arquitectura | Monólito modular (Node + React + Supabase) |
| Schedulers | No processo API — OK com 1 instância; 2.ª instância só com Redis partilhado |
| Multi-tenant | `firm_id` na app + teste de isolamento em staging |

## Infraestrutura (sem fingerprints)

| Componente | Nota |
|------------|------|
| Supabase prod | Tem de estar **activo**; pausa por faturação = login a falhar |
| Supabase staging | Tem de estar activo para CI / teste de isolamento local |
| GitHub Actions | Pode falhar por billing; nesse caso corro a bateria local antes de merge |
| Redis | Necessário para rate limit / lockout partilhados entre instâncias |
| Vercel + Render | Frontend + API; deploy em merge `main` |

## Soft launch (29/10)

- Divulgação **gradual** (não ads virais no dia D)
- Plantão humano + Sentry + Render
- **Zero merges de risco** para `main` no dia da divulgação
- Google OAuth: publicar a app no Google Cloud (sair do modo Testing) ou gerir test users com cuidado

Prioridades a seguir: [`../ROADMAP.md`](../ROADMAP.md).

## Teste de isolamento

`npm run test:tenant-isolation -w backend` — só contra staging. Ver [`../security/TENANT_ISOLATION.md`](../security/TENANT_ISOLATION.md).

## Onde actualizar

Mudou produto, segurança ou ops → este ficheiro + [`../ROADMAP.md`](../ROADMAP.md) + doc da pasta afectada, no mesmo PR.
