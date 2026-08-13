# Deploy staging — Teglion

Ambiente isolado para desenvolver e testar **sem afectar o escritório em produção** (`teglion.com`).

---

## Arquitectura recomendada

| Camada | Produção | Staging |
|--------|----------|---------|
| Frontend | `teglion.com` (Vercel) | `staging.teglion.com` (Vercel) |
| API | `teglionapp.onrender.com` (Render) | `teglion-api-staging.onrender.com` (Render) |
| Base de dados | Supabase projeto **prod** | Supabase projeto **staging** (separado) |
| Storage | Bucket `contabil-documents` prod | Bucket staging (mesmo nome, projeto diferente) |
| Email (Brevo) | Remetente prod | Remetente `staging@…` ou sandbox Brevo |
| Stripe | Live | **Test mode** (`sk_test_…`) |

**Regra:** nunca partilhar `JWT_*_SECRET` nem `SUPABASE_SERVICE_ROLE_KEY` entre prod e staging.

## Requisito P0 de isolamento

- staging deve usar projeto Supabase próprio
- staging deve usar serviço Render próprio
- staging deve usar projeto/domínio Vercel próprio
- staging deve usar chaves Stripe de teste
- staging deve usar cookies, CORS e URLs apontando apenas para staging
- staging deve usar GitHub Environment `staging` com secrets próprios

---

## 1. Supabase (staging)

1. Criar **novo projeto** Supabase (região EU).
2. Aplicar migrations: `supabase link --project-ref <staging-ref>` → `supabase db push`.
3. Aplicar policy de storage (`20260703000000_storage_contabil_documents.sql`).
4. Guardar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` só no Render staging.

```bash
cd backend && npm run smoke:pilot   # com env staging apontado
```

---

## 2. Backend (Render — serviço staging)

Duplicar o Web Service de produção com nome `teglion-api-staging`:

| Variável | Valor staging |
|----------|----------------|
| `NODE_ENV` | `production` |
| `PRODUCT_MODE` | `contabil` |
| `FRONTEND_URL` | `https://staging.teglion.com` |
| `PUBLIC_API_URL` | `https://teglion-api-staging.onrender.com` |
| `CORS_ORIGINS` | `https://staging.teglion.com` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `none` |
| `JWT_ACCESS_SECRET` | **novo** (32+ chars) |
| `JWT_REFRESH_SECRET` | **novo** |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | projeto staging |
| `FROM_EMAIL` | remetente verificado (pode ser subdomínio) |
| `BREVO_API_KEY` | mesma conta ou API key de teste |
| `STRIPE_SECRET_KEY` | `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | webhook endpoint staging |

Branch de deploy do ambiente staging: **`staging`** (sempre alinhada ao que está em QA). Trabalho de fase em `feature/fase-N` → PR para `staging` → UAT → PR `staging`→`main`. Ver [GIT_WORKFLOW.md](./GIT_WORKFLOW.md).

## 2.1 Secrets GitHub para staging

Criar environment `staging` no GitHub e definir pelo menos:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `DATA_ENCRYPTION_KEY`
- `BREVO_API_KEY`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `COOKIE_DOMAIN`

---

## 3. Frontend (Vercel — isolamento obrigatório)

### Porquê staging escreveu em produção (incidente)

1. `frontend/vercel.json` reescreve `/api/*` → **`teglionapp.onrender.com` (produção)**.
2. Em `apiBase.ts`, só `teglion.com` / `www` forçavam `/api`. Em `staging.teglion.com`, se o build usasse Production env ou caísse no fallback `/api`, o browser falava com a **API de produção**.
3. Variáveis **Preview** no Vercel **não** entram se o domínio `staging.teglion.com` estiver ligado ao deployment **Production** (`main`).

### Regra dura (código)

Em `staging.teglion.com`, o frontend **sempre** usa:

`https://teglion-api-staging.onrender.com/api`

(mesmo que `VITE_API_BASE_URL` esteja errado ou o rewrite exista).

### Configuração Vercel (fazer agora)

**Opção A — mesmo projeto (mínimo):**

1. **Settings → Git** → Production Branch = `main` (não `staging`).
2. **Settings → Domains** → `staging.teglion.com` → assign to Git Branch **`staging`** (não Production).
3. **Settings → Environment Variables**
   - Preview: `VITE_API_BASE_URL` = `https://teglion-api-staging.onrender.com/api`
   - Production: `VITE_API_BASE_URL` = `/api` (ou URL da API prod; o rewrite de `vercel.json` cobre `/api`)
4. Redeploy do branch `staging` (Deployments → ⋯ → Redeploy).
5. Em `https://staging.teglion.com`, DevTools → Network: pedidos devem ir a **`teglion-api-staging.onrender.com`**, nunca a `teglionapp.onrender.com`.

**Opção B (recomendada a médio prazo):** segundo projeto Vercel (`teglion-app-staging`), root `frontend`, branch `staging`, domínio `staging.teglion.com`, e usar `frontend/vercel.staging.json` (rewrite `/api` → API staging) como `vercel.json` desse projeto.

| Variável | Preview / projeto staging | Production |
|----------|---------------------------|------------|
| `VITE_API_BASE_URL` | `https://teglion-api-staging.onrender.com/api` | `/api` (prod rewrite) |
| `VITE_PRODUCT_MODE` | `contabil` | `contabil` |

Ficheiro local de referência (raiz do monorepo): `.env.staging` (git-ignored) + template versionável `.env.staging.example`. Frontend: [frontend/.env.staging.example](../../frontend/.env.staging.example). Backend: [backend/.env.staging.example](../../backend/.env.staging.example).

```bash
# Preencher .env.staging na raiz (nunca copiar de produção)
cp .env.staging.example .env.staging

cd frontend
cp .env.staging.example .env.staging.local   # só local, não commitar
npm run dev -- --mode staging                # se configurares mode no Vite
```

---

## 4. Fluxo de trabalho

```
feature branch → PR → deploy automático staging → QA → merge main → deploy produção
```

1. Desenvolver em `feature/*` ou directamente em `staging`.
2. Push → Vercel staging + Render staging rebuild.
3. Testar fluxo piloto completo (registo escritório → cliente → documento).
4. Merge para `main` só após QA; produção deploy manual ou com protecção de branch.

---

## 5. Dados de teste

- Criar escritório fictício em staging (`Escritório Demo Staging`).
- Não importar dados reais de clientes de produção (RGPD).
- Reset periódico: truncate tabelas ou recriar projeto Supabase staging.

---

## 6. Checklist rápido pós-setup

- [ ] Registo escritório em `staging.teglion.com`
- [ ] Login / logout / refresh sessão
- [ ] Upload documento + validação
- [ ] Convite cliente + portal
- [ ] Mensagens + obrigações
- [ ] Stripe checkout (modo teste)
- [ ] `npm run smoke:pilot` contra API staging

---

## Comandos

```bash
# Smoke contra staging
API_BASE=https://teglion-api-staging.onrender.com npm run smoke:pilot

# Build frontend (validar antes de merge)
cd frontend && npx tsc --noEmit && npm run build
```

Produção: [DEPLOY_PRODUCTION.md](./DEPLOY_PRODUCTION.md) · Local: [DEV_LOCAL.md](./DEV_LOCAL.md)
