# Deploy em produção — TegLion

**Objetivo:** colocar o piloto no escritório de contabilidade com confiança.

---

## Email: Brevo vs Supabase Auth

| Canal | Uso no TegLion | Recomendação |
|-------|-----------------|--------------|
| **Brevo (API)** | Convites, tarefas, lembretes, docs recebidos | **Usar** — já integrado |
| **Supabase Auth emails** | Magic link, confirm signup em `auth.users` | **Não usamos** — auth é custom (`firm_users` + `clients` + JWT) |

O Supabase **pode** enviar emails de autenticação se migrares para Supabase Auth. Hoje o login/registo/password são geridos pelo backend TegLion — por isso **Brevo é o canal certo** para emails transacionais do produto.

Storage e base de dados continuam no Supabase; só os emails de produto vão pela Brevo.

---

## Checklist pré-deploy

## O meu fluxo antes de qualquer release

1. Eu valido o gate automatizado com `npm run release:readiness`.
2. Eu corro `npm run security:secrets` para garantir que não há exposição acidental no repositório.
3. Eu faço deploy coordenado de backend e frontend.
4. Eu só abro tráfego com rollback pronto.

## Regra P0 antes de qualquer deploy em produção

- produção só recebe promoção vinda de `staging` ou `hotfix/*`
- branch `main` protegida no GitHub
- `release-readiness` e `tenant-isolation` obrigatórios e verdes
- staging isolado e validado antes da promoção
- secrets de produção armazenados apenas no GitHub Environment `production`

### 1. Supabase

- [ ] Projeto criado (região EU recomendada para RGPD)
- [ ] Migrations aplicadas: `supabase db push` ou SQL em `supabase/migrations/` incluindo:
  - `20260705000000_password_reset_tokens.sql`
  - **`20260829000000_auth_login_attempts.sql`** (lockout login)
  - **`20260829100000_audit_logs_nullable_firm.sql`** (audit auth)
  - **`20260829110000_firm_user_onboarding.sql`** (wizard pós-registo)
- [ ] Bucket `contabil-documents` + policies (`20260703000000_storage_contabil_documents.sql`)
- [ ] `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` no backend

```bash
cd backend && npm run smoke:pilot
```

### 2. Backend (Render)

Variáveis **obrigatórias** em produção — ver [`backend/.env.local`](../../backend/.env.local):

| Variável | Notas |
|----------|-------|
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | 32+ chars aleatórios |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | |
| `DATA_ENCRYPTION_KEY` / `DOCUMENTS_SIGNING_SECRET` | |
| `FROM_EMAIL` | Remetente **verificado na Brevo** |
| `BREVO_API_KEY` | Já configuraste |
| `FRONTEND_URL` | URL pública do frontend (links nos emails) |
| `CORS_ORIGINS` | Mesmo domínio do frontend |
| `COOKIE_SECURE=true` | Se HTTPS |
| `COOKIE_SAMESITE=none` | Se frontend e API em domínios diferentes |
| `JWT_ACCESS_EXPIRES_IN` | **`15m`** (recomendado pós-auditoria; remover `24h` legado) |
| `RATE_LIMIT_AUTH_MAX` | Opcional — default `600` (req/15 min por utilizador autenticado) |
| `LOGIN_MAX_FAILURES` | Opcional — default `5` |
| `LOGIN_LOCKOUT_MINUTES` | Opcional — default `15` |

**Autenticação (2026):** sessão **cookie-only** (sem token no JSON). Frontend e backend desta release devem ser deployados **em conjunto**. Ver [SECURITY.md](../security/SECURITY.md).

### 2.2 Redis activo no Render (obrigatório em produção)

Para produção robusta, eu mantenho Redis activo e sem fallback in-memory.

1. Criar serviço Redis no Render (mesma região da API)
2. Definir `REDIS_URL` no backend com a Internal URL do Redis
3. Fazer redeploy do backend
4. Confirmar em logs que não há aviso de fallback

Guia completo: [REDIS_RENDER_SETUP.md](./REDIS_RENDER_SETUP.md)

### 2.1 Secrets GitHub para produção

Criar environment `production` no GitHub e definir os mesmos nomes de secret usados em staging, mas com valores exclusivos de produção.

Nunca reutilizar:

- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `DATA_ENCRYPTION_KEY`
- `COOKIE_DOMAIN`
- `FRONTEND_URL`
- `CORS_ORIGINS`

Opcional SMS:

```
SMS_ENABLED=true
BREVO_SMS_SENDER=TegLion   # nome validado na Brevo SMS
```

### 3. Frontend (Vercel)

**Produção sem estilos:** o build precisa de `postcss.config.cjs` + Tailwind. Se o **GitHub `main`** estiver atrás de `contabil/staging`, a Vercel compila código antigo — faz `git push origin main` (ou em Vercel → Settings → Git → **Production Branch** = `contabil/staging`) e **Redeploy**.

1. **Importar o repositório Git** na [Vercel](https://vercel.com).
2. **Root Directory:** `frontend` (monorepo — não uses a raiz do repo).
3. **Framework Preset:** Vite (detetado automaticamente se `vite.config.ts` existir).
4. **Build Command:** `npm run build` (default).
5. **Output Directory:** `dist` (default do Vite).

Variáveis de ambiente no painel Vercel → **Settings → Environment Variables**:

```env
VITE_API_BASE_URL=https://teglionapp.onrender.com/api
VITE_PRODUCT_MODE=contabil
```

Substitui pela URL do Render enquanto `api.teglion.com` não estiver activo. Depois migra para `https://api.teglion.com/api`.

**Exemplo (piloto):** frontend `https://teglion.com`, API `https://teglionapp.onrender.com/api`.

| Onde | Variável | Valor |
|------|----------|--------|
| Vercel | `VITE_API_BASE_URL` | `https://teglionapp.onrender.com/api` |
| Vercel | `VITE_PRODUCT_MODE` | `contabil` |
| Render | `FRONTEND_URL` | `https://teglion.com` |
| Render | `PUBLIC_API_URL` | `https://teglionapp.onrender.com` |
| Render | `CORS_ORIGINS` | `https://teglion.com,https://www.teglion.com` |
| Render | `COOKIE_SECURE` | `true` |
| Render | `COOKIE_SAMESITE` | `none` |

**CORS no registo:** se vês `blocked by CORS` e pedidos a `...onrender.com/csrf` (sem `/api`), corrige `VITE_API_BASE_URL` e faz **Redeploy** na Vercel. Limpa cache do site ou abre janela anónima (o browser pode ter gravado URL antiga em `sessionStorage`).

**Domínio custom** (ex.: `teglion.com` / `www.teglion.com`): Settings → Domains → Add. Segue o assistente de DNS (registo A / CNAME conforme a Vercel indicar).

Há um `frontend/vercel.json` com rewrite SPA para o React Router.

Build local:

```bash
cd frontend && npm run build
```

### 4. Brevo — validar remetente

1. Brevo → **Senders** → verificar domínio ou email `FROM_EMAIL`
2. Testar convite: criar cliente → gerar convite → email deve chegar
3. SMS: ativar **Transactional SMS** na Brevo + créditos

---

## WAF / Cloudflare (P3 — recomendado produção)

Colocar **Cloudflare** (ou similar) à frente de `teglion.com` e `api.teglion.com`:

| Funcionalidade | Configuração |
|----------------|--------------|
| Proxy DNS | Laranja (proxied) nos registos A/CNAME |
| SSL | Full (strict) |
| WAF managed rules | Activar OWASP + bot fight mode |
| Rate limit edge | `/api/auth/*` — 10 req/min por IP |
| Cache | Só assets estáticos (`/_assets/*`, `/icons/*`); **não** cachear `/api/*` |

O rate limit Redis no backend continua necessário — o WAF é camada adicional, não substituto.

---

### 5. DNS / domínios (recomendado)

| Subdomínio | Serviço |
|------------|---------|
| `teglion.com` / `www.teglion.com` | Frontend (Vercel) |
| `api.teglion.com` | Backend (Render) |

---

## Fluxo piloto pós-deploy

1. Abrir landing → criar escritório
2. Entrar dashboard
3. Criar cliente + **gerar convite** (email Brevo)
4. Cliente aceita convite → hub
5. Cliente envia documento → email ao dono do escritório
6. Escritório valida documento
7. Mensagens + obrigação entregue

Checklist final de execução: [GO_PRODUCTION.md](./GO_PRODUCTION.md)

---

## O que ainda falta (pós-MVP deploy)

| Item | Prioridade |
|------|------------|
| Recuperação de palavra-passe (backend + email Brevo) | ✅ |
| Auditoria segurança (auth, docs, hub) | ✅ — ver [SECURITY.md](../security/SECURITY.md) |
| Stripe live (trial → subscrição) | Média |
| Monitorização (Sentry / logs) | Média |
| Backups Supabase (plano pago) | Alta |
| WAF Cloudflare (edge) | Média — rate limit app já activo |

---

## Comandos úteis

```bash
# Smoke infra
cd backend && npm run smoke:pilot

# API + frontend local com .env.local
cd backend && npm run dev
cd frontend && npm run dev

# Build produção
cd frontend && npm run build
```

---

## Rollback

- Frontend: redeploy commit anterior no Vercel
- Backend: redeploy Render + env vars intactas
- Supabase: migrations são forward-only — testar sempre em staging primeiro

### Rollback de migrations (F0-05)

Não há `down.sql` automático — cada migração forward-only exige rollback manual pensado caso a caso:

1. **Nunca** fazer `DROP COLUMN`/`DROP TABLE` na mesma migração que introduz a mudança — separar em 2 passos (deprecar → remover só depois de confirmar em produção por ≥1 semana sem uso).
2. Se uma migração já aplicada causar um incidente: escrever uma nova migração de compensação (ex: `_revert_<nome>.sql`) que desfaz o efeito — nunca editar/apagar a migração já aplicada (o histórico em `supabase/migrations/` é o registo de auditoria).
3. Antes de qualquer migração com `ALTER`/`DROP` em tabela com dados reais: correr primeiro em staging e confirmar com `SELECT count(*)` antes/depois.
4. Para dados corrompidos por bug de aplicação (não de schema): preferir um script de backfill dedicado (ver `supabase/migrations/20260901030000_fix_client_tasks_duplicated_task_type.sql` como exemplo) em vez de alterar schema.
5. Registar todo rollback executado em produção no `docs/operations/INCIDENT_RUNBOOK.md`.

**Drill de rollback executado:** ainda não há um exercício registado (ver `runbook-incident-drill.js`, que testa o runbook de incidente mas não simula ainda um rollback de migration real). Pendente.
