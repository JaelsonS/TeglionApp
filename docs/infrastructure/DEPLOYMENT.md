# Deploy

> Fontes consolidadas: `docs/07-OPERACAO/DEPLOY.md`, `docs/operations/DEPLOY_PRODUCTION.md`, `docs/operations/DEPLOY_STAGING.md`, `docs/operations/GIT_WORKFLOW.md`, `docs/operations/BRANCHING.md` (só as partes com informação única — o restante é redundante com `GIT_WORKFLOW.md`, que é o documento canônico de estratégia de branches), `docs/operations/GO_LIVE_CHECKLIST.md`, `docs/operations/GO_PRODUCTION.md` (pasta antiga, removida após esta consolidação).
>
> O processo de **decidir e declarar uma release pronta** (gate funcional, critério de GO) está em [`../operations/RELEASES.md`](../operations/RELEASES.md), não aqui — este documento cobre a mecânica técnica do deploy em si.

Rodo o frontend na Vercel, o backend no Render, e banco e storage no Supabase. Cada um com seu próprio ciclo de deploy — não existe um botão único que sobe tudo junto.

| Ambiente | Branch Git | Destino |
|----------|-----------|---------|
| Produção | `main` | Vercel Production + Backend Render produção + Supabase PROD |
| Staging | `staging` (integração, recebe PRs de `feature/fase-N`) | Vercel Staging/Preview + Backend Render staging + Supabase STAGING |

## Fluxo Git obrigatório

**Regra absoluta que sigo:** `main` = produção aprovada, intocável fora deste fluxo. **Não uso branch `develop`** — a integração de QA é a própria `staging`.

```
feature/fase-N  (trabalho da fase atual do roadmap)
        │
        ▼
Pull Request → staging
        │
        ▼
   CI / GitHub Actions
        │
        ▼
      STAGING
  Vercel · Backend · Supabase (tudo staging)
  Google TEST · Brevo TEST · Stripe TEST · Sentry STAGING
        │
        ▼
  UAT operacional em staging.teglion.com
        │
        ▼
     APROVADO
        │
        ▼
   Pull Request → main
        │
        ▼
      PRODUÇÃO
  Vercel PROD · Backend PROD · Supabase PROD
  Google PROD · Brevo PROD · Stripe LIVE · Sentry PROD
```

Faço até uma única linha de código passar por esse fluxo — não me permito "correção rápida direto na main".

Branches oficiais que uso: `main` (só produção aprovada), `staging` (integração/deploy do ambiente de staging, dados fictícios), `feature/fase-N` (trabalho da fase atual do roadmap — evito micro-branches soltos permanentes). Hotfixes: `fix/…` de vida curta, PR pra `staging`, e só depois de validado, PR pra `main`.

**Nunca faço**: push direto pra `main`, desenvolvimento apontando pra Supabase/Stripe/Brevo de produção, ou compartilhar `JWT_*`, `SUPABASE_SERVICE_ROLE_KEY` ou chaves Stripe live entre staging e produção.

### Proteção da `main` (estado real, GitHub)

Confirmei em 13/08/2026: branch protection ativa com PR obrigatório (sem push direto), status check `validate` obrigatório e branch atualizada (`strict`), `enforce_admins: true`, force push e delete da `main` desligados. O job `validate` do CI é obrigatório pra merge (ver [`CI_CD.md`](./CI_CD.md) pro que esse job cobre).

Checks que deixei configurados como obrigatórios: `Frontend build`, `Backend unit tests`, `Frontend E2E smoke`, `Release readiness gate`, `tenant-isolation`, `Require staging source`, `Require promotion checklist note`.

GitHub Environments que uso: `staging` e `production`, cada um com os mesmos nomes de secret mas valores exclusivos por ambiente (nunca reutilizo `SUPABASE_SERVICE_ROLE_KEY`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DATA_ENCRYPTION_KEY`, `COOKIE_DOMAIN`, `FRONTEND_URL`, `CORS_ORIGINS` entre os dois).

### Vercel — projetos e domínios

| Projeto | Branch de produção | Domínio |
|---------|--------------------|---------|
| Teglion (prod) | `main` | `teglion.com` |
| Teglion Staging | `staging` | `staging.teglion.com` |

Cada projeto com suas próprias variáveis de ambiente (`VITE_API_BASE_URL` aponta pra API correspondente).

### Render — serviços

| Serviço | Branch | URL de referência |
|---------|--------|--------------------|
| `teglion-api` (produção) | `main` | `teglionapp.onrender.com` |
| `teglion-api-staging` | `staging` | `teglion-api-staging.onrender.com` |

### UAT operacional em staging (antes de promover a `main`)

Crio dados fictícios de dois escritórios (Firm A / Firm B — dono, equipe, cliente) e percorro cadastro → auth → Google → booking → documentos → Brevo → sessão → isolamento entre os dois. Tento quebrar isolamento cross-tenant de propósito — isso faz parte do processo, não é opcional.

Checklist mínimo que sigo: Google OAuth/Calendar, Brevo, Stripe em modo teste, Storage, Booking, Auth, isolamento Firm A ≠ Firm B.

## Deploy em staging

Mantenho esse ambiente isolado pra desenvolver e testar sem afetar `teglion.com`. Isolamento obrigatório: projeto Supabase próprio, serviço Render próprio, projeto/domínio Vercel próprio, chaves Stripe de teste, cookies/CORS/URLs apontando só pra staging, GitHub Environment `staging` com secrets próprios.

### Supabase (staging)

1. Crio um novo projeto Supabase (região EU).
2. `supabase link --project-ref <staging-ref>` seguido de `supabase db push`.
3. Aplico a policy de storage (`20260703000000_storage_contabil_documents.sql`).
4. Guardo `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` só no Render staging.

### Backend (Render — serviço staging)

Variáveis principais do serviço `teglion-api-staging`:

| Variável | Valor staging |
|----------|----------------|
| `FRONTEND_URL` | `https://staging.teglion.com` (https sempre) |
| `PUBLIC_API_URL` | `https://teglion-api-staging.onrender.com` |
| `GOOGLE_OAUTH_REDIRECT_URI` | `https://staging.teglion.com/api/auth/google/callback` — first-party via rewrite Vercel |
| `GOOGLE_CALENDAR_REDIRECT_URI` | `https://staging.teglion.com/api/contabil/integrations/google-calendar/callback` |
| `COOKIE_DOMAIN` | vazio (cookies host-only, same-origin via rewrite Vercel) |
| `TURNSTILE_EXPECTED_HOSTNAMES` | `staging.teglion.com` |
| `CORS_ORIGINS` | `https://staging.teglion.com` |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` | `true` / `none` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | valores **novos**, nunca copiados de produção |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | projeto staging |
| `STRIPE_SECRET_KEY` | `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | secret do endpoint de webhook staging |

Turnstile em staging é obrigatório e fail-closed pra mim: sem token válido, a API responde `403 TURNSTILE_MISSING`/`TURNSTILE_FAILED` — não deixo skip em staging (dev/CI local sem secret continua fazendo skip, só em ambiente não-produção).

### Por que staging já escreveu em produção uma vez (incidente que corrigi)

`frontend/vercel.json` reescrevia `/api/*` sempre pra `teglionapp.onrender.com` (produção), sem distinguir o host de origem. Em `staging.teglion.com`, se o build usasse variável de ambiente de Production ou caísse no fallback `/api`, o browser acabava falando com a API de produção — inclusive gravando cookies no domínio de produção.

Correção que apliquei: `frontend/vercel.json` agora tem rewrite condicional por host — `staging.teglion.com`/`www.staging.teglion.com` vai pra `teglion-api-staging.onrender.com`, o resto vai pra produção. Em staging, o SPA usa `/api` same-origin (precisava disso pra cookies de auth/CSRF funcionarem no Chrome e no iOS). A navegação de OAuth do Google continua indo pra URL absoluta do Render, porque o callback precisa gravar cookie no host da própria API.

### Frontend (Vercel — configuração staging)

1. Settings → Git → Production Branch = `main` (não `staging`).
2. Settings → Domains → `staging.teglion.com` associado à branch Git `staging` (não Production).
3. Settings → Environment Variables: `VITE_API_BASE_URL=/api` tanto em Preview/staging quanto em Production (o rewrite por host já resolve o destino).
4. Redeploy da branch `staging`.
5. Verifico em DevTools → Network que as chamadas XHR vão pra `staging.teglion.com/api/...`, nunca pra `teglionapp.onrender.com`.

Variáveis de referência local: `.env.staging` na raiz do monorepo (git-ignored) com template `.env.staging.example`; equivalentes em `frontend/.env.staging.example` e `backend/.env.staging.example`.

### Checklist rápido pós-setup de staging

Faço registro de escritório em `staging.teglion.com`; login/logout/refresh de sessão; upload de documento com validação; convite de cliente e portal; mensagens e obrigações; checkout Stripe em modo teste; `npm run smoke:pilot` contra a API staging.

## Deploy em produção

### Supabase

Criei o projeto em região EU (requisito de RGPD). Aplico migrations via `supabase db push` ou SQL direto em `supabase/migrations/`. Bucket `contabil-documents` com as policies da migration `20260703000000_storage_contabil_documents.sql`. `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no backend.

```bash
cd backend && npm run smoke:pilot
```

### Backend (Render — produção)

Variáveis obrigatórias — nomes de referência em [`backend/.env.example`](../../backend/.env.example) (nunca copio valor real pra lá; produção usa as env vars do próprio Render):

| Variável | Notas |
|----------|-------|
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | 32+ caracteres aleatórios |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | |
| `DATA_ENCRYPTION_KEY` / `DOCUMENTS_SIGNING_SECRET` | |
| `FROM_EMAIL` | Remetente verificado na Brevo |
| `BREVO_API_KEY` | |
| `FRONTEND_URL` | URL pública do frontend (usada em links de email) |
| `CORS_ORIGINS` | Mesmo domínio do frontend |
| `COOKIE_SECURE=true` | Se HTTPS (sempre em produção) |
| `COOKIE_SAMESITE=none` | Quando frontend e API estão em domínios diferentes |
| `JWT_ACCESS_EXPIRES_IN` | `15m` recomendado — removo qualquer `24h` legado |
| `RATE_LIMIT_AUTH_MAX` | Opcional, default `600` (req/15min por usuário autenticado) |
| `LOGIN_MAX_FAILURES` / `LOGIN_LOCKOUT_MINUTES` | Opcionais, default `5` / `15` |

Autenticação é cookie-only (sem token no JSON) — por isso deployo sempre frontend e backend de uma mesma release juntos.

### Redis em produção

Manter Redis ativo e sem fallback in-memory é obrigatório pra mim em produção. Crio o serviço Redis (Upstash ou Render) na mesma região da API, defino `REDIS_URL` no backend, faço redeploy, e confirmo nos logs que não há aviso de fallback. Guia completo: [`../operations/setup/REDIS.md`](../operations/setup/REDIS.md).

### Frontend (Vercel — produção)

1. Importo o repositório no Vercel.
2. Root Directory: `frontend` (nunca a raiz do monorepo).
3. Framework Preset: Vite (detectado automaticamente).
4. Build Command: `npm run build`. Output Directory: `dist`.
5. Environment Variables: `VITE_API_BASE_URL` apontando pra API de produção, `VITE_PRODUCT_MODE=contabil`.

Quando o build sai "sem estilos", geralmente é `postcss.config.cjs`/Tailwind não processado porque a branch de produção da Vercel está desalinhada com o `main` do GitHub — checo Settings → Git → Production Branch.

Domínio custom: Settings → Domains → Add, seguindo o assistente de DNS (registro A/CNAME conforme indicado pela Vercel). `frontend/vercel.json` já tem rewrite SPA pro React Router.

```bash
cd frontend && npm run build   # build local, para validar antes de merge
```

### Brevo — validar remetente antes de abrir tráfego

Vou em Senders & IP → verifico domínio ou email `FROM_EMAIL`; testo convite de cliente de ponta a ponta e confirmo chegada do email; ativo Transactional SMS + créditos se o canal SMS estiver em uso. Detalhe de configuração de domínio (SPF/DKIM) deixei em [`../operations/setup/BREVO_DOMAIN.md`](../operations/setup/BREVO_DOMAIN.md).

### WAF / Cloudflare

Já deixei o Cloudflare ativo na frente de `teglion.com` e da API (proxy DNS, SSL full-strict, WAF managed rules + bot fight mode, Turnstile nos formulários públicos, rate limit de borda em `/api/auth/*`). Isso é infraestrutura que já liguei, não é mais um item pendente (ver [`docs/ROADMAP.md`](../ROADMAP.md), Sprint 0 item 8) — o rate limit do Redis no backend continua necessário, o WAF é camada adicional, não substituto.

### DNS

| Subdomínio | Serviço |
|------------|---------|
| `teglion.com` / `www.teglion.com` | Frontend (Vercel) |
| `api.teglion.com` | Backend (Render) — a migração de `teglionapp.onrender.com` pra esse domínio próprio ainda estou fazendo gradualmente |

## Rollback

**Frontend:** reverto pro deploy anterior na Vercel — operação de poucos cliques (Deployments → selecionar deploy anterior → Promote to Production).

**Backend:** faço redeploy do último commit saudável no Render, com as variáveis de ambiente intactas.

**Banco de dados / migrations:** não tenho rollback automatizado (`down.sql`) — cada migração é forward-only e exige decisão manual caso a caso. É o que eu sigo:

1. Nunca faço `DROP COLUMN`/`DROP TABLE` na mesma migração que introduz a mudança — separo em dois passos (depreciar → remover só depois de confirmar em produção por pelo menos uma semana sem uso).
2. Se uma migração já aplicada causar um incidente: escrevo uma nova migração de compensação (`_revert_<nome>.sql`) que desfaz o efeito — nunca edito ou apago a migração já aplicada, porque o histórico em `supabase/migrations/` é o registro de auditoria.
3. Antes de qualquer migração com `ALTER`/`DROP` em tabela com dados reais: rodo primeiro em staging e confirmo contagens antes/depois.
4. Pra dado corrompido por bug de aplicação (não de schema): prefiro um script de backfill dedicado em vez de alterar schema.
5. Registro todo rollback executado em produção em [`../operations/INCIDENTS.md`](../operations/INCIDENTS.md).

Ainda não registrei um exercício formal de rollback de migração (simular uma migração ruim e desfazê-la) — isso é diferente do drill de restauração de backup, que já fiz duas vezes (ver [`INFRASTRUCTURE.md`](./INFRASTRUCTURE.md) e `docs/database/`). Um protege contra perda total de dado; o outro protegeria contra um erro de schema específico. Os dois continuam pendentes de fechamento independente um do outro — não trato o drill de restore como se já cobrisse isso.

**Passos operacionais de rollback (execução):**

1. Reverto o frontend no Vercel pro deploy anterior estável.
2. Faço redeploy do backend no Render pro último release saudável.
3. Valido `npm run release:readiness` no commit de rollback antes de reabrir a release.
4. Comunico o incidente e a causa raiz — registro em [`../operations/INCIDENTS.md`](../operations/INCIDENTS.md).
5. Só reabro a release depois da causa raiz corrigida.

## Fluxo funcional pós-deploy (smoke manual do piloto)

1. Abro a landing → crio escritório.
2. Entro no dashboard.
3. Crio cliente e gero convite (email via Brevo).
4. Cliente aceita convite → acessa o hub.
5. Cliente envia documento → notificação pro dono do escritório.
6. Escritório valida o documento.
7. Confirmo que mensagens e entrega de obrigação estão funcionando.

O critério formal de "GO aprovado" e o gate funcional de equipe (convites, permissões, auditoria) estão em [`../operations/RELEASES.md`](../operations/RELEASES.md).
