# Teglion — começa aqui

**Actualizado:** 28 de outubro de 2026  
**Produção:** [`production/CURRENT_STATE.md`](./production/CURRENT_STATE.md)  
**Soft launch comercial:** 29/10/2026

Eu construí o **Teglion**: um SaaS multi-tenant para **escritórios de contabilidade**, começando em Portugal.  
A entidade que desenvolve e opera o produto é a **AfDigital — Soluções Tecnológicas**. Teglion é a marca do produto — não é uma Lda. nem uma S.A.

Site: [teglion.com](https://www.teglion.com)

---

## Em 60 segundos

Um escritório regista-se, gere clientes, documentos, prazos, mensagens, agenda e captação pública. O cliente final usa um portal. Eu isolei cada escritório dos outros (`firm_id`). Há billing Stripe, MFA, cofre, Maya (activação assistida) e, desde o soft launch, ferramentas V10 (pagamentos internos, calculadoras, rendas, SAF-T leitura, Manual).

A AfDigital opera o SaaS pelo **Control Center** (painel interno gated) — não misturo isso com a área do contabilista.

---

## Verdade única

| Pergunta | Documento |
|----------|-----------|
| O que está em produção **agora**? | [`production/CURRENT_STATE.md`](./production/CURRENT_STATE.md) |
| O que fazer a seguir? | [`ROADMAP.md`](./ROADMAP.md) — **único** roadmap vivo |
| O que o produto faz? | [`product/PRODUCT.md`](./product/PRODUCT.md) + [`product/FEATURES.md`](./product/FEATURES.md) |
| Como corre (stack)? | [`architecture/ARCHITECTURE.md`](./architecture/ARCHITECTURE.md) |
| Segurança? | [`security/SECURITY.md`](./security/SECURITY.md) |
| Como testar? | [`testing/TESTING.md`](./testing/TESTING.md) |
| Git / releases? | [`operations/GIT_WORKFLOW.md`](./operations/GIT_WORKFLOW.md) |
| Control Center? | [`product/TEGLION_CONTROL_CENTER_CHARTER.md`](./product/TEGLION_CONTROL_CENTER_CHARTER.md) |
| Multi-país? | [`architecture/INTERNATIONALIZATION.md`](./architecture/INTERNATIONALIZATION.md) |

Política de docs: [`governance/DOCUMENTATION_POLICY.md`](./governance/DOCUMENTATION_POLICY.md).

---

## Onde estou → para onde vou

**Hoje (28 Out 2026):** soft launch amanhã; `main` tem o pacote V10 + endurecimentos GTM; Control Center em ondas gated; Redis e denylist em produção.

**A seguir:** plantão do dia D, Google OAuth em Production (sair do modo Testing), monitorização, evolução do Control Center, preparar multi-país e — mais tarde — outros segmentos. Tudo em [`ROADMAP.md`](./ROADMAP.md).

---

## Percurso: novo developer (dia 1–3)

1. [`architecture/ARCHITECTURE.md`](./architecture/ARCHITECTURE.md)
2. [`architecture/BACKEND.md`](./architecture/BACKEND.md) + [`architecture/FRONTEND.md`](./architecture/FRONTEND.md)
3. [`architecture/MULTI_TENANCY.md`](./architecture/MULTI_TENANCY.md) + [`security/TENANT_ISOLATION.md`](./security/TENANT_ISOLATION.md) — **obrigatório**
4. [`infrastructure/ENVIRONMENTS.md`](./infrastructure/ENVIRONMENTS.md) — **nunca** apontar testes de isolamento a prod
5. [`testing/TESTING.md`](./testing/TESTING.md)
6. [`decisions/README.md`](./decisions/README.md)

Antes do primeiro PR: `npm run tsc`, `npm test`, olhar o diff com atenção a `firm_id`.

---

## Percurso: ops / release

1. [`operations/RUNBOOK.md`](./operations/RUNBOOK.md)
2. [`operations/GIT_WORKFLOW.md`](./operations/GIT_WORKFLOW.md)
3. [`infrastructure/DEPLOYMENT.md`](./infrastructure/DEPLOYMENT.md)
4. [`operations/INCIDENTS.md`](./operations/INCIDENTS.md)

---

## Percurso: investidor

1. [`product/VISION.md`](./product/VISION.md) + [`product/BUSINESS_MODEL.md`](./product/BUSINESS_MODEL.md)
2. [`investor/INVESTOR_NARRATIVE.md`](./investor/INVESTOR_NARRATIVE.md)
3. [`investor/DUE_DILIGENCE.md`](./investor/DUE_DILIGENCE.md)
4. [`security/SECURITY.md`](./security/SECURITY.md)

---

## O que **não** vais encontrar neste repo público

Auditorias antigas com passos de exploração, limiares exactos de abuso, allowlists de emails ops, ou playbooks de penetração. Isso fica no arquivo interno da AfDigital — ver [`historico/README.md`](./historico/README.md).

Identidade e responsabilidades legais: [`product/PRODUCT_PRINCIPLES.md`](./product/PRODUCT_PRINCIPLES.md).
