# Incidente — colunas MFA em produção sem registo em schema_migrations

**Data:** 2026-08-21  
**Âmbito:** Fase 4 MFA (Etapa D)  
**Ambiente:** produção (teglion-prod) — **não corrigido nesta fase**

## Achado

As colunas MFA em `public.firm_users` existem em produção:

- `mfa_enabled` (default `false`)
- `mfa_totp_secret_enc`
- `mfa_totp_pending_secret_enc`
- `mfa_recovery_codes_hash`
- `mfa_enabled_at`
- `mfa_last_verified_at`

Observado:

- `mfa_enabled = false` em todas as linhas relevantes
- aplicação **não** utiliza MFA em produção
- versões correspondentes **não** estão registadas correctamente em `schema_migrations`

Tratar como **incidente de histórico/schema**, não como autorização para alterar produção.

## Decisões desta fase (aprovadas)

- Não corrigir produção nesta fase
- Não fazer rollback das colunas
- Não fazer `migration repair` em produção
- Não alterar as colunas
- Não activar MFA em produção
- Qualquer regularização de produção exige decisão e autorização explícitas e separadas

## Staging

Staging já possui o mesmo modelo de colunas (migration aplicada `20260821165305_firm_users_mfa_totp`). O repositório inclui migration idempotente `20261012000000_firm_users_mfa_totp.sql` para alinhar o histórico Git sem `DROP`/`recreate`.

## Dependência TOTP

Biblioteca única: `otplib@13.5.0` (API async; CommonJS; Node ≥20). Sem `speakeasy` nem biblioteca concorrente.
