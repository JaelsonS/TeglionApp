# TegLion

**Gestão digital para escritórios de contabilidade em Portugal** — documentos, prazos, portal do cliente e comunicação num só lugar.

| | |
|---|---|
| **Site** | [teglion.com](https://teglion.com) |
| **Estado** | Piloto vendável — hardening para produção e escala |
| **Contexto** | Produto SaaS + projeto de estudo (full-stack, UX, fiscalidade PT) |

---

## O problema

Escritórios pequenos e médios em Portugal ainda vivem entre **email, WhatsApp, pastas partilhadas e folhas Excel**. O cliente não sabe o que falta enviar; o contabilista perde tempo a pedir o mesmo documento três vezes; os prazos fiscais dependem da memória de uma pessoa.

## A solução

O TegLion junta num único sistema:

- **Portal do escritório** — clientes, pedidos de documentos, validação, tarefas, calendário fiscal, mensagens, alertas.
- **Portal do cliente** — upload de ficheiros, estado dos pedidos, obrigações, mensagens com o escritório.
- **Site público** — landing, preços, blog SEO (atração orgânica para freelancers e PME).

O piloto arranca com **um escritório de contabilidade real** que valida o fluxo no dia a dia antes de escalar.

---

## Para quem é

| Público | Valor |
|---------|--------|
| **Escritório piloto** | Menos caça ao documento, mais controlo de prazos e comunicação profissional com clientes |
| **Cliente do escritório** | Saber o que falta entregar, falar com o contabilista sem WhatsApp caótico |
| **Desenvolvimento / estudo** | Codebase completa: React, Node, Supabase, multi-tenant, RGPD, deploy real |

---

## Estado actual (Jul 2026)

| Área | Situação |
|------|----------|
| Registo escritório + convite cliente | ✅ |
| Pedidos e upload de documentos | ✅ |
| Mensagens escritório ↔ cliente | ✅ |
| Tarefas, obrigações, calendário fiscal | ✅ |
| Blog (27 artigos, prerender SEO) | ✅ |
| Redesign UI escritório + portal cliente | ✅ |
| TypeScript frontend | ✅ 0 erros |
| Frontend build `build:spa` | ✅ |
| Backend smoke piloto | ✅ 6/6 |
| Backend security audit | ✅ com 1 aviso |
| Frontend Playwright E2E smoke | ✅ 5/5 |
| QA visual tablet/mobile em produção | 🟡 Pendente |
| Stripe live | 🟡 Configuração manual |

Detalhe completo: [`docs/operations/STATUS.md`](docs/operations/STATUS.md)

## Pricing oficial (documentação)

| Plano | Valor mensal equivalente | Cobrança |
|------|---------------------------|----------|
| **Plano anual** | €29,99/mês | €359,88 por ano |
| **Plano mensal** | €35,00/mês | €35,00 por mês |

Notas:

- Estes valores são a referência oficial para documentação e comunicação comercial.
- A configuração final no Stripe deve refletir exatamente estes dois modelos de cobrança.

---

## Stack

```
┌─────────────────────────────────────────────────────────┐
│  Frontend   React 19 · Vite · TypeScript · Tailwind     │
│             Vercel (teglion.com)                        │
├─────────────────────────────────────────────────────────┤
│  Backend    Node · Express · JWT cookies · Argon2       │
│             Render (api.teglion.com)                    │
├─────────────────────────────────────────────────────────┤
│  Dados      Supabase (Postgres + Storage + RLS)         │
│  Email      Brevo (convites, lembretes)                 │
│  Pagamentos Stripe (trial / subscrição)                 │
└─────────────────────────────────────────────────────────┘
```

---

## Módulos principais

### Escritório (`/app/firm`)

Dashboard · Clientes · Documentos (pedidos / ficheiros / histórico) · Tarefas · Agenda · Calendário fiscal · Mensagens · Alertas · Serviços · Definições · Faturação

### Cliente (`/app/client`)

Início · Pedidos · Documentos · Arquivo · Obrigações · Mensagens · Alertas · Notícias · Marcações

### Público

`/` · `/pricing` · `/security` · `/blog` · `/auth/firm/*` · `/auth/client/*`

Mapa de produto e módulos: [`docs/product/PRODUCT.md`](docs/product/PRODUCT.md) · [`docs/product/MODULES.md`](docs/product/MODULES.md)

---

## Começar em local

**Requisitos:** Node 20+, conta Supabase, variáveis em `backend/.env.local`

```bash
cd backend && npm install && npm run dev

cd frontend && npm install && npm run dev
```

Validar infra piloto:

```bash
cd backend && npm run smoke:pilot
```

Guia completo: [`docs/operations/DEV_LOCAL.md`](docs/operations/DEV_LOCAL.md)

---

## Estrutura do repositório

Ver [`STRUCTURE.md`](STRUCTURE.md) — mapa backend/frontend, camadas e comandos.

```
TegLion/
├── frontend/          SPA React (marketing + app + blog)
├── backend/           API Express + módulos de negócio
├── supabase/          Migrations SQL e políticas RLS
├── docs/              Documentação do produto
└── .github/workflows/ CI (build, tsc, testes)
```

---

## Documentação

Índice completo: [`docs/README.md`](docs/README.md)

| Documento | Conteúdo |
|-----------|----------|
| [`docs/product/VISION.md`](docs/product/VISION.md) | Missão, visão e valores |
| [`docs/operations/STATUS.md`](docs/operations/STATUS.md) | Estado actual e piloto |
| [`docs/product/ROADMAP.md`](docs/product/ROADMAP.md) | Plano de evolução (8 fases) |
| [`docs/operations/DEV_LOCAL.md`](docs/operations/DEV_LOCAL.md) | Ambiente de desenvolvimento |
| [`docs/operations/DEPLOY_PRODUCTION.md`](docs/operations/DEPLOY_PRODUCTION.md) | Deploy produção |
| [`docs/security/SECURITY.md`](docs/security/SECURITY.md) | Segurança e multi-tenant |

---

## Roadmap imediato

1. **Piloto no escritório** — onboarding real, feedback semanal, ajustes de fluxo
2. **QA produção** — tablet/mobile, capturas baseline (`docs/qa/visual-baseline/`)
3. **SEO** — Search Console, indexação blog, PageSpeed mobile
4. **Hardening** — WAF, cache assets, validação Stripe live

## Prontidão para 100.000 clientes activos

Prioridades executivas para escalar com segurança:

1. Filas e processamento assíncrono resiliente (emails, notificações, jobs pesados)
2. Observabilidade completa (APM, métricas p95/p99, tracing e alertas SLO)
3. Estratégia de capacidade por tenant (particionamento, índices e políticas de retenção)
4. Pipeline de release com gates obrigatórios (testes, tenant isolation e smoke)
5. Plano de resposta a incidentes e exercícios recorrentes de disaster recovery

Ver [`docs/product/ROADMAP.md`](docs/product/ROADMAP.md) para o plano por fases.

---

## Licença

Projeto privado — uso interno e piloto acordado com o escritório parceiro.
