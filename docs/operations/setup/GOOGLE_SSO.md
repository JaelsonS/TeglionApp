# Login com Google (SSO)

> Fonte: `docs/operations/GOOGLE_SSO_SETUP.md` (pasta antiga, removida após esta consolidação). Editado para PT-BR, sem reescrita de conteúdo técnico.

Decidi não usar Supabase Auth pro login do Teglion. A autenticação é custom no backend (`firm_users` + JWT em cookies). O Google SSO passa pelo **backend Express** que eu construí, não pelo painel Authentication do Supabase.

Deixo aqui registrado onde as chaves vão e onde não vão, pra nunca mais confundir isso.

---

## Onde **não** coloco as chaves

| Local | Usar para Google SSO? |
|-------|------------------------|
| Supabase → Authentication → Providers → Google | **Não** |
| Supabase → Edge Functions (secrets) | **Não** (a menos que eu crie uma função própria — não é o fluxo atual) |
| Frontend `.env` (`VITE_*`) | **Não** — o secret nunca vai para o browser |

Colocar o Client ID/Secret no Supabase **não ativa** o botão "Entrar com Google" do Teglion e só me gera confusão com credenciais erradas.

---

## Onde configuro (correto)

### 1. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Credentials**.
2. Crio um **OAuth 2.0 Client ID** → tipo **Web application**.
3. **Authorized JavaScript origins**:

| Ambiente | URI |
|----------|-----|
| Produção | `https://teglion.com` |
| Produção | `https://www.teglion.com` |
| Local (frontend) | `http://localhost:3000` |

4. **Authorized redirect URIs** — tem que coincidir **exatamente** com o callback do backend:

| Ambiente | Redirect URI |
|----------|----------------|
| Produção (recomendado) | `https://teglion.com/api/auth/google/callback` |
| Produção (www) | `https://www.teglion.com/api/auth/google/callback` |
| Produção (API direta) | `https://teglionapp.onrender.com/api/auth/google/callback` |
| Local | `http://localhost:8001/api/auth/google/callback` |
| Staging | `https://teglion-api-staging.onrender.com/api/auth/google/callback` |

> Registro **teglion.com** e **www.teglion.com** no Google Console. O proxy da Vercel `/api/*` → Render não recebe CSP do frontend (evita bloquear o cold start).

5. Copio **Client ID** e **Client Secret**.

Opcional: OAuth consent screen → adiciono domínio `teglion.com` e emails de teste enquanto o app estiver em "Testing".

### 2. Backend (Render ou `.env` local)

Variáveis no serviço **API** (Render → Environment):

```env
GOOGLE_OAUTH_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_OAUTH_REDIRECT_URI=https://teglion.com/api/auth/google/callback
COOKIE_DOMAIN=.teglion.com
FRONTEND_URL=https://teglion.com
PUBLIC_API_URL=https://teglion.com
```

Se `GOOGLE_OAUTH_REDIRECT_URI` ficar vazio, o backend infere a partir de `FRONTEND_URL` — em produção, defino explicitamente. **503 em `/api/auth/google`** significa que falta credencial Google no Render (`SSO_DISABLED`).

Referência: [`backend/.env.example`](../../../backend/.env.example)

### 3. Supabase (só banco de dados)

O Supabase guarda usuários em `firm_users` depois do callback do Google. Só preciso: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

**Não** preciso ativar o provider Google no Supabase Auth.

---

## Fluxo técnico

**Entrar (conta existente):**
```
Browser → GET /api/auth/google?intent=login
       → Google → GET /api/auth/google/callback
       → loginFirmBySso → cookies JWT → /app/firm/dashboard
```

**Criar escritório (conta nova):**
```
Browser → GET /api/auth/google?intent=register&countryCode=PT
       → Google → callback
       → se email já existe: login
       → se não existe: cookie pendente → /auth/firm/register/google
       → POST /api/auth/register-firm-google (nome do escritório + termos legais)
       → cookies JWT → dashboard
```

Código: `backend/src/modules/auth/google-sso.controller.js`, `google-sso.service.js`.

---

## Como verifico se está ativo

```bash
curl -s https://SUA-API/api/auth/sso/status
# { "google": true, "providers": ["google"] }
```

Se `google: false`, faltam `GOOGLE_OAUTH_CLIENT_ID` ou `GOOGLE_OAUTH_CLIENT_SECRET` no backend. Endpoint de saúde administrativo: integrações Google em `integrations-health`.

---

## Erros comuns (e o que já aprendi sobre cada um)

| Sintoma | Causa provável |
|---------|----------------|
| `redirect_uri_mismatch` | URI no Google Cloud diferente de `GOOGLE_OAUTH_REDIRECT_URI` |
| `sso_disabled` | Variáveis faltando no Render |
| `invalid_state` | Cookies bloqueados ou domínio/cross-site mal configurado (`COOKIE_SAMESITE`, `COOKIE_SECURE`) |
| `account_not_found` | Email Google não corresponde a um `firm_user` já registrado no escritório |
| Funciona local, falha em produção | Redirect URI de produção não adicionado no Google Cloud |

---

## Staging vs. produção

Uso **dois OAuth clients** no Google Cloud (ou o mesmo client com vários redirect URIs listados) — um redirect para a API de staging, outro para a de produção. Secrets diferentes em cada serviço Render — ver [`../../infrastructure/DEPLOYMENT.md`](../../infrastructure/DEPLOYMENT.md).

### Staging — cookies first-party (obrigatório)

Em staging, o SPA usa `/api` same-origin (`staging.teglion.com`). O callback do Google **precisa** estar no mesmo host:

| Variável / console | Valor |
|--------------------|--------|
| `GOOGLE_OAUTH_REDIRECT_URI` | `https://staging.teglion.com/api/auth/google/callback` |
| Google Cloud → Redirect URIs | o mesmo URI |
| `FRONTEND_URL` | `https://staging.teglion.com` |
| `COOKIE_DOMAIN` | vazio (host-only em `staging.teglion.com`) |

O rewrite da Vercel `/api` → Render faz com que `Set-Cookie` fique first-party no domínio do SPA.

**Registro Google (conta nova):** o callback também envia um token assinado em `?pending=` (e o SPA reenvia em `X-OAuth-Pending`). Isso evita a tela "Sessão Google expirada" quando o cookie OAuth ficou preso em host Render antigo.

| Sintoma | Causa |
|---------|--------|
| `SSO_PENDING_NOT_FOUND` / "Sessão Google expirada" | Cookie pendente em outro host; token `pending` faltando ou expirado (15 min). Sentry: tag `auth.code=SSO_PENDING_NOT_FOUND`. |
