# Fluxo Git definitivo — Teglion

**Regra absoluta:** `main` = produção aprovada. Produção é intocável fora deste fluxo.

**Não usamos `develop`.** Integração de QA = branch `staging`.

```
                    GITHUB
                       │
         feature/fase-N  (trabalho da fase)
                       │
                       ▼
              Pull Request → staging
                       │
                       ▼
                CI / GitHub Actions
                       │
                       ▼
                    STAGING
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   Vercel           Backend        Supabase
   STAGING          STAGING        STAGING
        │              │              │
        ├──────────────┼──────────────┤
        │
  Google TEST · Brevo TEST · Stripe TEST · Sentry STAGING
        │
        ▼
  JAELSON TESTA TUDO (UAT operacional)
        │
        ▼
     APROVADO
        │
        ▼
   Pull Request → main
        │
        ▼
   Vercel PROD · Backend PROD · Supabase PROD
        │
  Google PROD · Brevo PROD · Stripe LIVE · Sentry PROD
        │
        ▼
   Liliane + clientes
```

Não existe “alteração rápida na main”. **Uma linha** também passa por este fluxo.

## Branches oficiais (a partir de 2026-08-13)

| Branch | Papel |
|--------|--------|
| `main` | **Só** produção aprovada |
| `staging` | Integração / deploy do ambiente STAGING (dados fictícios) |
| `feature/fase-0`, `feature/fase-1`, … | Trabalho da **fase** actual do roadmap (não micro-PRs soltos como ramo permanente) |

### Convenção `feature/fase-N`

- Estamos a fechar o Sprint / Fase 0 → ramo activo: **`feature/fase-0`**
- Quando entrarmos na Fase 1 → **`feature/fase-1`**
- Hotfixes pontuais: `fix/…` de vida curta, PR → `staging` → (após UAT) → `main`
- **Proibido:** recriar dezenas de `feat/…` eternas; fechar a fase e apagar o ramo

### O que não existe

- `develop`
- push directo para `main`
- desenvolvimento apontado a Supabase / Stripe / Brevo de **produção**

## Ambientes

### Produção (`main`)

Vercel Production → Backend Production → Supabase **PROD** → dados reais

### Staging (`staging`)

Vercel Staging/Preview → Backend Staging → Supabase **STAGING** (`xscriwhchdblmwmpglby`) → dados fictícios + Google/Brevo/Stripe/Sentry de **teste**

**Nunca** partilhar `JWT_*`, `SUPABASE_SERVICE_ROLE_KEY` ou Stripe live entre prod e staging.

## Protecção da `main` (GitHub)

Estado (2026-08-13): branch protection com:

- PR obrigatório (sem push directo)
- status check `validate` obrigatório + branch actualizada (`strict`)
- `enforce_admins: true`
- force push e delete da `main` desligados

## UAT operacional em staging (antes de promover a `main`)

Criar dados fictícios Firm A / Firm B (owner, staff, cliente) e percorrer cadastro → auth → Google → booking → docs → Brevo → sessão → isolamento. Tentar quebrar cross-tenant de propósito.

Checklist: Google OAuth/Calendar · Brevo · Stripe test · Storage · Booking · Auth · Multi-tenant A ≠ B.

## Hotfix de produção

1. `fix/…` a partir de `main` (ou `feature/fase-N` se couber)
2. PR → `staging`, validar
3. PR → `main` com CI verde
4. Documentar incidente

## Referências

- [DEPLOY_STAGING.md](./DEPLOY_STAGING.md)
- [DEPLOY_PRODUCTION.md](./DEPLOY_PRODUCTION.md)
- [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)
- [SECURITY-GATES.md](../06-SEGURANCA/SECURITY-GATES.md)
