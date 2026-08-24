# Teglion

**Gestão digital para escritórios de contabilidade** — clientes, documentos, prazos, portal do cliente, agenda e comunicação num só lugar.

| | |
|---|---|
| **Produto** | [teglion.com](https://teglion.com) |
| **Marca** | Teglion · um produto da **AfDigital — Soluções Tecnológicas** |
| **Estado** | Produção controlada com **4 escritórios pilotos** |
| **Mercado inicial** | Portugal (expansão internacional no roadmap) |

Índice da documentação: [`docs/README.md`](docs/README.md)  
Roadmap (única fonte de prioridades): [`docs/ROADMAP.md`](docs/ROADMAP.md)

---

## O problema

Escritórios pequenos e médios ainda operam entre **email, WhatsApp, pastas partilhadas e Excel**. O cliente não sabe o que falta enviar; o contabilista pede o mesmo documento várias vezes; os prazos fiscais dependem da memória de uma pessoa.

## A solução

- **Portal do escritório** — clientes, documentos, tarefas, agenda, calendário fiscal, mensagens, serviços, alertas, definições e faturação SaaS.
- **Portal do cliente** — pedidos, uploads, obrigações, mensagens e marcações.
- **Página pública do escritório** — marca, serviços publicados, captação e booking sem login.
- **Site comercial** — landing, preços, suporte, blog SEO.

Detalhe de produto: [`docs/product/PRODUCT.md`](docs/product/PRODUCT.md) · maturidade por módulo: [`docs/product/FEATURES.md`](docs/product/FEATURES.md)

---

## Stack

```
Frontend   React · Vite · TypeScript · Tailwind     → Vercel
Backend    Node · Express · JWT (cookies) · Argon2  → Render
Dados      Supabase (Postgres + Storage + RLS)
Email      Brevo
Pagamentos Stripe (assinatura SaaS + Connect opcional)
Auth extra Google SSO / Calendar / Drive (quando configurado)
```

Arquitetura: [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md)  
Multi-tenant: [`docs/architecture/MULTI_TENANCY.md`](docs/architecture/MULTI_TENANCY.md)  
Segurança: [`docs/security/SECURITY.md`](docs/security/SECURITY.md)

---

## Preços (plano Escritório)

Fonte de verdade no código: `backend/src/config/pricing-plans.js` (valores via env no Render).

| Plano | Referência (defaults PT) |
|------|---------------------------|
| **Mensal** | €35,00 / mês |
| **Anual** | €359,88 / ano (≈ €29,99 / mês) |
| **Trial** | 14 dias (configurável) |

API pública: `GET /api/public/pricing`

---

## Começar em local

**Requisitos:** Node **≥ 24** (workspaces), projeto Supabase, ficheiros de ambiente (não versionados).

Na raiz do monorepo:

```bash
npm install

# API
cp backend/.env.staging.example backend/.env.local   # preencher valores locais
npm run dev:backend

# SPA (outro terminal)
cp frontend/.env.example frontend/.env.local         # se necessário
npm run dev:frontend
```

Exemplos de env: [`backend/.env.staging.example`](backend/.env.staging.example) · [`frontend/.env.example`](frontend/.env.example)  
Deploy / ambientes: [`docs/infrastructure/DEPLOYMENT.md`](docs/infrastructure/DEPLOYMENT.md) · [`docs/infrastructure/ENVIRONMENTS.md`](docs/infrastructure/ENVIRONMENTS.md)

### Comandos úteis

```bash
npm run test:backend          # testes do backend
npm run test                  # testes do frontend (Vitest)
npm run tsc                   # typecheck frontend
npm run build                 # build frontend
npm run security:secrets      # scan de segredos no Git
npm run smoke:pilot -w backend
npm run test:security-static -w backend
npm run test:tenant-isolation -w backend   # exige Supabase (staging)
```

Testes: [`docs/testing/TESTING.md`](docs/testing/TESTING.md)  
Releases: [`docs/operations/RELEASES.md`](docs/operations/RELEASES.md)

---

## Estrutura do repositório

```
TeglionApp/
├── frontend/     SPA (marketing + app escritório/cliente + blog)
├── backend/      API Express + módulos de negócio
├── supabase/     Migrations SQL e políticas RLS
├── docs/         Documentação viva (ver docs/README.md)
├── tools/        Scripts CI auxiliares
└── .github/      Workflows CI
```

Fluxo Git: `feature/…` → PR → `staging` → UAT → PR → `main` (produção).  
CI/CD: [`docs/infrastructure/CI_CD.md`](docs/infrastructure/CI_CD.md)

---

## Documentação (links válidos)

| Documento | Conteúdo |
|-----------|----------|
| [`docs/README.md`](docs/README.md) | Mapa de toda a documentação |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | **Único** roadmap / prioridades |
| [`docs/product/PRODUCT.md`](docs/product/PRODUCT.md) | O que o produto faz |
| [`docs/product/FEATURES.md`](docs/product/FEATURES.md) | Estado por funcionalidade |
| [`docs/product/VISION.md`](docs/product/VISION.md) | Visão |
| [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) | Arquitetura |
| [`docs/security/SECURITY.md`](docs/security/SECURITY.md) | Segurança |
| [`docs/security/TENANT_ISOLATION.md`](docs/security/TENANT_ISOLATION.md) | Isolamento multi-tenant |
| [`docs/infrastructure/DEPLOYMENT.md`](docs/infrastructure/DEPLOYMENT.md) | Deploy |
| [`docs/operations/RELEASES.md`](docs/operations/RELEASES.md) | Processo de release |
| [`docs/governance/DOCUMENTATION_POLICY.md`](docs/governance/DOCUMENTATION_POLICY.md) | Como manter docs vivos |

Pastas numeradas antigas (`docs/00-*`, `docs/03-*`, …) e `docs/historico/` são **arquivo / legado** — não usar como estado actual.

---

## Segurança do repositório

1. Não versionar `.env` nem segredos operacionais.
2. Correr `npm run security:secrets` antes de push relevante.
3. Isolamento entre escritórios: filtro `firm_id` no backend (RLS é defesa em profundidade; o backend usa `service_role`).
4. Clientes do portal usam `/api/client-portal` — não herdam permissões de staff em `/api/contabil`.

---

## Licença

Licença proprietária — todos os direitos reservados: [`LICENSE`](LICENSE).
