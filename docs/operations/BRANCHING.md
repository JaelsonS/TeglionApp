# Branches — produção (`main`) vs staging

Estratégia para testar com segurança antes de afectar `teglion.com`.

---

## Modelo recomendado

| Branch | Ambiente | Deploy | Quem mergeia |
|--------|----------|--------|--------------|
| `main` | **Produção** | Manual ou protegido (Vercel + Render prod) | Só após QA em staging |
| `staging` | **Pré-produção** | Automático (Vercel staging + Render staging) | Push directo ou merge de `feature/*` |
| `feature/*` | Local / PR preview | Opcional (Vercel Preview) | Desenvolvimento diário |

```
feature/xyz ──PR──► staging ──QA OK──► main ──► teglion.com
```

---

## Setup inicial (uma vez)

### 1. Criar branch `staging`

```bash
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging
```

### 2. GitHub — proteger `main`

Settings → Branches → Add rule para `main`:

- Require pull request before merging
- Require status checks (CI verde)
- Opcional: require review

`staging` pode ficar sem protecção forte para iteração rápida.

### Regra operacional obrigatória (P0)

- `main` só recebe código via PR `staging -> main` ou `hotfix/* -> main`
- push directo a `main` deve ser bloqueado no GitHub
- merge para `main` só com CI, `release-readiness` e `tenant-isolation` verdes
- PR para `main` deve referenciar o resultado do `release:readiness`

### Branch protection recomendada para `main`

Activar no GitHub:

- Require a pull request before merging
- Require approvals: `1` no mínimo
- Dismiss stale approvals when new commits are pushed
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Restrict who can push to matching branches
- Do not allow bypassing the above settings

Checks recomendados como obrigatórios:

- `Frontend build`
- `Backend unit tests`
- `Frontend E2E smoke`
- `Release readiness gate`
- `tenant-isolation`
- `Require staging source`
- `Require promotion checklist note`

### 3. Vercel

| Projeto | Branch de produção | Domínio |
|---------|-------------------|---------|
| TegLion (prod) | `main` | `teglion.com` |
| TegLion Staging *(novo projeto)* | `staging` | `staging.teglion.com` |

Cada projeto com as suas env vars (`VITE_API_BASE_URL` aponta para a API correcta).

### 4. Render

| Serviço | Branch | URL exemplo |
|---------|--------|-------------|
| `teglion-api` (prod) | `main` | `teglion.onrender.com` |
| `teglion-api-staging` | `staging` | `teglion-api-staging.onrender.com` |

**Importante:** Supabase **separado** para staging (projeto novo). Nunca reutilizar `JWT_*_SECRET` nem `SERVICE_ROLE_KEY` entre ambientes.

Detalhe completo: [DEPLOY_STAGING.md](./DEPLOY_STAGING.md)

### 5. CI (GitHub Actions)

O workflow `.github/workflows/ci.yml` corre em `main`, `staging` e PRs. Nenhum merge com CI vermelho.

---

## Fluxo diário

1. Trabalhar em `feature/nome` ou directamente em `staging`
2. Push → deploy automático staging
3. Checklist QA em `staging.teglion.com` (registo, login, Google SSO, upload, Stripe test)
4. `git checkout main && git merge staging` (ou PR `staging` → `main`)
5. Deploy produção (automático se configurado, ou manual no Render/Vercel)

### GitHub Environments obrigatórios

- Criar environment `staging`
- Criar environment `production`
- Guardar secrets homónimos, mas com valores diferentes em cada environment
- Os workflows `release-readiness` e `tenant-isolation` já devem usar o environment conforme a branch

---

## O que nunca fazer

- Push directo a `main` sem passar por staging (excepto hotfix documentado)
- Partilhar base de dados prod/staging
- Usar chaves Stripe **live** em staging
- Copiar dados reais de clientes para staging (RGPD)

---

## Hotfix em produção

Se produção estiver em baixo e staging não tiver o fix:

```bash
git checkout main
git checkout -b hotfix/descricao
# corrigir, commit, PR para main
# depois merge main → staging para não divergir
git checkout staging && git merge main && git push
```

---

## Comandos úteis

```bash
# Ver diferença staging vs main
git log main..staging --oneline

# Smoke contra staging
API_BASE=https://teglion-api-staging.onrender.com npm run smoke:pilot

# E2E local
cd frontend && npm run test:e2e
```

---

## Robustez (roadmap operacional)

| Prática | Estado |
|---------|--------|
| CI em `main` + `staging` | Configurado |
| E2E smoke Playwright | Configurado |
| Ambiente staging isolado | Documentado — setup manual Render/Vercel/Supabase |
| Branch protection `main` | **A configurar no GitHub** |
| Migrations: testar em staging antes de prod | Processo manual `supabase db push` no projeto staging |

Ver também: [DEPLOY_PRODUCTION.md](./DEPLOY_PRODUCTION.md) · [GOOGLE_SSO_SETUP.md](./GOOGLE_SSO_SETUP.md)
