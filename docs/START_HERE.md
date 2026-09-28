# Teglion — comece aqui

**Actualizado:** 28/09/2026 · **Produção:** [`production/CURRENT_STATE.md`](./production/CURRENT_STATE.md)

O Teglion é um SaaS **multi-tenant** para **escritórios de contabilidade** em Portugal. Hoje **5 escritórios** usam o sistema em produção (`www.teglion.com`). Este documento orienta **novos developers**, **ops** e **investidores** — cada um com um percurso de leitura.

---

## Verdade única

| Pergunta | Documento canónico |
|----------|-------------------|
| O que está em produção **agora**? | [`production/CURRENT_STATE.md`](./production/CURRENT_STATE.md) |
| O que fazer a seguir (prioridades)? | [`ROADMAP.md`](./ROADMAP.md) — **único** roadmap vivo |
| O que o produto faz (módulos)? | [`product/FEATURES.md`](./product/FEATURES.md) + [`product/PRODUCT.md`](./product/PRODUCT.md) |
| Como corre (stack, deploy)? | [`architecture/ARCHITECTURE.md`](./architecture/ARCHITECTURE.md) + [`infrastructure/DEPLOYMENT.md`](./infrastructure/DEPLOYMENT.md) |
| Segurança e isolamento entre escritórios? | [`security/SECURITY.md`](./security/SECURITY.md) + [`security/TENANT_ISOLATION.md`](./security/TENANT_ISOLATION.md) |
| Como testar? | [`testing/TESTING.md`](./testing/TESTING.md) |
| Passado / auditorias antigas? | [`historico/README.md`](./historico/README.md) — **não** usar como estado actual |

Política de manutenção: [`governance/DOCUMENTATION_POLICY.md`](./governance/DOCUMENTATION_POLICY.md).

---

## Onde estávamos → onde estamos → para onde vamos

### Onde estávamos (2025 – meados 2026)

- Piloto com poucos escritórios; foco em **Sprint 0** (segurança multi-tenant, MFA, cofre, CI com teste de isolamento).
- Documentação fragmentada; consolidada em Agosto/2026.

### Onde estamos (Set/2026)

- **5 escritórios** em produção; equipa contabilística + portal cliente no dia a dia.
- **Main** estável com releases recentes: alertas/detalhe no portal, validade de documentos + lembretes, UX cofre, banner de trial para dono do escritório.
- **652** testes backend + **224** frontend; dependências prod sem vulnerabilidades conhecidas (`npm audit`).
- **Sólido:** auth JWT cookie + MFA, CSRF, isolamento `firm_id`, upload validado, Stripe billing, página pública por slug.
- **Fragilidades operacionais (não “bugs de produto”):** Supabase/ GitHub Actions dependem de **faturação activa**; staging Supabase deve estar **ACTIVE** para tenant test local/CI; schedulers no processo HTTP (OK com 1 instância Render).

### Para onde vamos (próximos meses)

Ver [`ROADMAP.md`](./ROADMAP.md): escala comercial (~10+ escritórios), observabilidade, filas para lembretes, reactivar CI cloud, backup drill trimestral, expansão PT antes de BR (ADR-0002/0006).

---

## Percurso: novo developer (dia 1–3)

1. [`architecture/ARCHITECTURE.md`](./architecture/ARCHITECTURE.md) — monólito modular, fronteiras.
2. [`architecture/BACKEND.md`](./architecture/BACKEND.md) + [`architecture/FRONTEND.md`](./architecture/FRONTEND.md).
3. [`architecture/MULTI_TENANCY.md`](./architecture/MULTI_TENANCY.md) + [`security/TENANT_ISOLATION.md`](./security/TENANT_ISOLATION.md) — **obrigatório** antes de tocar em repositórios.
4. [`infrastructure/ENVIRONMENTS.md`](./infrastructure/ENVIRONMENTS.md) — setup local; **nunca** apontar tenant test para prod.
5. [`testing/TESTING.md`](./testing/TESTING.md) — `npm test`, `npm run test:tenant-isolation -w backend`.
6. [`decisions/README.md`](./decisions/README.md) — ADRs (decisões já tomadas).

**Antes do primeiro PR:** `npm run tsc`, `npm test`, ler diff com olho em `.eq('firm_id', …)`.

---

## Percurso: ops / release

1. [`operations/RUNBOOK.md`](./operations/RUNBOOK.md)
2. [`infrastructure/DEPLOYMENT.md`](./infrastructure/DEPLOYMENT.md) + [`infrastructure/CI_CD.md`](./infrastructure/CI_CD.md)
3. [`operations/INCIDENTS.md`](./operations/INCIDENTS.md) — incl. Supabase pausado (Set/2026)
4. [`production/PRODUCTION_READINESS_CHECKLIST.md`](./production/PRODUCTION_READINESS_CHECKLIST.md)

---

## Percurso: investidor / due diligence

1. [`product/VISION.md`](./product/VISION.md) + [`product/BUSINESS_MODEL.md`](./product/BUSINESS_MODEL.md)
2. [`investor/INVESTOR_NARRATIVE.md`](./investor/INVESTOR_NARRATIVE.md)
3. [`investor/DUE_DILIGENCE.md`](./investor/DUE_DILIGENCE.md) — honesto sobre escala comprovada (5 escritórios)
4. [`investor/PITCH_DECK.md`](./investor/PITCH_DECK.md)
5. Segurança: [`security/SECURITY.md`](./security/SECURITY.md)

---

## Mapa de pastas

| Pasta | Conteúdo |
|-------|----------|
| [`product/`](./product/) | Produto, utilizadores, funcionalidades, princípios |
| [`architecture/`](./architecture/) | Backend, frontend, API, dados, integrações |
| [`decisions/`](./decisions/) | ADRs |
| [`security/`](./security/) | Auth, tenant, vault, testes de segurança |
| [`database/`](./database/) | Schema, migrations, backup, DR |
| [`infrastructure/`](./infrastructure/) | Ambientes, CI/CD, deploy, observabilidade |
| [`operations/`](./operations/) | Runbooks, releases, setup integrações |
| [`testing/`](./testing/) | Estratégia de testes |
| [`production/`](./production/) | Estado actual + checklist prontidão |
| [`investor/`](./investor/) | Narrativa e due diligence |
| [`historico/`](./historico/) | Arquivo congelado — sprints e auditorias antigas |

---

## O que melhorar (verdade do projecto)

| Área | Estado | Próximo passo |
|------|--------|----------------|
| CI GitHub Actions | Billing pode bloquear job | Resolver conta; staging Supabase activo |
| Tenant test local | Falha se staging pausado (`ENOTFOUND`) | Reactivar `teglion-staging` |
| RLS em todas as tabelas | Defesa em profundidade parcial | Roadmap / ADR-0001 |
| Schedulers | In-process | Locks/fila ao escalar instâncias |
| GDPR export/erase | Não implementado | [`security/DATA_PROTECTION.md`](./security/DATA_PROTECTION.md) |
| Pentest HTTP formal | Não feito | [`security/SECURITY_TESTING.md`](./security/SECURITY_TESTING.md) |
| On-call 24/7 | Fundador | Esperado nesta fase; documentado em due diligence |

---

## Repositório (código)

- Monorepo: `backend/` (Express, Supabase service role), `frontend/` (React/Vite), `supabase/migrations/`.
- Deploy: **Vercel** (SPA) + **Render** (API) + **Supabase** (Postgres/Storage).

Dúvida sobre “está implementado?” → **código + teste**; se não comprovou, escreva `A VALIDAR` na doc.
