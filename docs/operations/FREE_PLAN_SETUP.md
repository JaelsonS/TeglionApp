# Setup Externo no Plano Free

**Objetivo:** fechar agora os itens `F0-01` e `F0-02`, e deixar `F0-03` parcialmente coberto sem contratar infra extra neste momento.

Este guia assume:

- mesmo repositório GitHub
- mesma base de código
- uso de `staging` como branch obrigatória de promoção
- uso do plano free das plataformas atuais

---

## O que fecha agora

### Fecha completamente

- `F0-01 [P0]` Tornar `staging` obrigatório antes de qualquer deploy para produção
- `F0-02 [P0]` Proteger `main` com branch rules, CI obrigatório e review obrigatório

### Fecha parcialmente

- `F0-03 [P0]` Garantir ambientes totalmente isolados para `local`, `staging` e `produção`

No plano free e sem novo Supabase/Render agora, o máximo que conseguimos é:

- `local` isolado por `.env.example`
- `staging` isolado por branch, preview frontend e GitHub Environment
- `produção` isolada por `main` + GitHub Environment

**Importante:** isolamento total de `staging` só fica completo quando existir backend e base de dados separados.

---

## Parte 1 — GitHub

### 1.1 Branch principal de produção

No GitHub:

1. abrir o repositório
2. entrar em `Settings`
3. entrar em `Branches`
4. criar regra ou ruleset para `main`

Configuração recomendada:

- `Require a pull request before merging`
- `Require approvals`: `1`
- `Dismiss stale pull request approvals when new commits are pushed`
- `Require status checks to pass before merging`
- `Require branches to be up to date before merging`
- `Block force pushes`
- `Block deletions`
- `Restrict who can push to matching branches` se estiver disponível

### 1.2 Checks obrigatórios em `main`

Adicionar como obrigatórios os checks abaixo:

- `Frontend build`
- `Backend unit tests`
- `Frontend E2E smoke`
- `Release readiness gate`
- `tenant-isolation`
- `Require staging source`
- `Require promotion checklist note`

### 1.3 Fluxo oficial de promoção

Fluxo que deve passar a ser obrigatório:

1. desenvolvimento em `feature/*` ou diretamente em `staging`
2. validação em `staging`
3. PR de `staging` para `main`
4. merge apenas com checks verdes
5. deploy de produção só depois do merge em `main`

### 1.4 GitHub Environments

No GitHub:

1. `Settings`
2. `Environments`
3. criar dois environments:
   - `staging`
   - `production`

### 1.5 Secrets mínimos por environment

Criar os mesmos nomes de secret nos dois environments, mas com valores diferentes quando existir separação real de infra.

Secrets usados hoje pelos workflows:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `DATA_ENCRYPTION_KEY`
- `BREVO_API_KEY`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `COOKIE_DOMAIN`

### 1.6 Como usar agora no free

Se ainda não tens staging separado de backend/banco:

- podes criar `staging` e `production` no GitHub já agora
- podes repetir temporariamente alguns secrets iguais
- mas deves marcar internamente que `F0-03` continua **parcial**

---

## Parte 2 — Vercel

### 2.1 Produção

Confirma no projeto atual da Vercel:

- branch de produção = `main`
- root directory = `frontend`

### 2.2 Staging no plano free

No plano free, a forma mais simples é usar **Preview Deployments** da branch `staging`.

O que fazer:

1. fazer push para `staging`
2. abrir o deployment preview gerado pela Vercel
3. usar esse preview como ambiente de QA antes de promover para `main`

Isso já ajuda a cumprir `F0-01`.

### 2.3 Variáveis de ambiente na Vercel

No projeto frontend atual:

1. `Settings`
2. `Environment Variables`

Configurar pelo menos:

- `VITE_API_BASE_URL`
- `VITE_PRODUCT_MODE=contabil`

### 2.4 Separação mínima sem custo

Se não vais criar um segundo projeto Vercel agora:

- produção continua em `main`
- QA visual/funcional usa preview de `staging`

Isso **não** é isolamento total, mas é suficiente para fechar `F0-01` e parte de `F0-03`.

---

## Parte 3 — Local

### 3.1 Frontend local

Usar:

- [frontend/.env.example](../../frontend/.env.example)
- [frontend/.env.staging.example](../../frontend/.env.staging.example)

### 3.2 Backend local

Usar:

- [backend/.env.example](../../backend/.env.example)
- [backend/.env.staging.example](../../backend/.env.staging.example)

### 3.3 Regra

Nunca usar `.env` real de produção no ambiente local.

---

## Parte 4 — O que marcar como concluído agora

### Pode marcar como concluído quando terminares a configuração acima

- `F0-01 [P0]` se `main` só aceitar promoção vinda de `staging`/`hotfix`
- `F0-02 [P0]` se branch protection e checks obrigatórios estiverem ativos

### Ainda não marcar como concluído total

- `F0-03 [P0]`

Motivo:

- ainda não existe backend staging separado
- ainda não existe Supabase staging separado
- ainda não existe isolamento total de secrets e dados em runtime

Podes considerar o status como:

- `F0-03`: **parcial / mitigado por processo**

---

## Parte 5 — Checklist prático de 10 minutos

### GitHub

- [ ] Criar environment `staging`
- [ ] Criar environment `production`
- [ ] Ativar PR obrigatório para `main`
- [ ] Exigir 1 aprovação para `main`
- [ ] Exigir status checks para `main`
- [ ] Adicionar os 7 checks obrigatórios

### Vercel

- [ ] Confirmar produção na branch `main`
- [ ] Confirmar root directory `frontend`
- [ ] Confirmar preview deploys para `staging`
- [ ] Confirmar `VITE_API_BASE_URL`
- [ ] Confirmar `VITE_PRODUCT_MODE=contabil`

### Processo

- [ ] Não fazer mais push direto em `main`
- [ ] Testar primeiro em `staging`
- [ ] Promover para `main` só por PR

---

## Parte 6 — Quando assinares Supabase e Render

Aí o próximo passo natural é fechar o isolamento total:

1. criar backend staging no Render
2. criar projeto staging no Supabase
3. apontar frontend preview/staging para backend staging
4. duplicar secrets de `staging` com valores próprios
5. marcar `F0-03` como concluído total

---

## Decisão recomendada agora

No teu cenário atual, a melhor decisão é:

- **fechar já `F0-01` e `F0-02`**
- **deixar `F0-03` como parcial**
- **não travar evolução do produto por falta de infra paga neste momento**

Isso eleva bastante a segurança operacional sem aumentar complexidade nem custo agora.