# Incidente — colunas MFA em produção sem registo em schema_migrations

**Data:** 2026-08-21  
**Âmbito:** Fase 4 MFA (Etapa D)  
**Ambiente:** produção (teglion-prod) — incidente de **histórico de migração**, não de “MFA desligado no produto”

## O que encontrei na altura

As colunas MFA em `public.firm_users` já existiam em produção:

- `mfa_enabled` (default `false`)
- `mfa_totp_secret_enc`
- `mfa_totp_pending_secret_enc`
- `mfa_recovery_codes_hash`
- `mfa_enabled_at`
- `mfa_last_verified_at`

Naquele dia:

- `mfa_enabled = false` nas linhas que olhei
- a aplicação ainda **não** usava MFA no fluxo de login
- as versões correspondentes **não** estavam registadas correctamente em `schema_migrations`

Tratei como **incidente de histórico/schema**, não como autorização para mexer à mão em produção.

## Decisões daquela fase (aprovadas na altura)

- Não “corrigir” produção naquele PR
- Não fazer rollback das colunas
- Não fazer `migration repair` em produção sem autorização explícita
- Não alterar as colunas
- Não activar MFA em produção **naquela fase** (o código de produto veio depois, por fluxo normal de staging → main)

## Nota actual (depois da activação no produto)

O MFA TOTP passou a fazer parte do produto (login + Definições → Segurança + trocar app). O estado vivo está em [`MFA_FASE4.md`](./MFA_FASE4.md). Este ficheiro fica como registo do incidente de schema — se ainda for preciso alinhar `schema_migrations` em produção, isso continua a exigir decisão e autorização próprias, separadas do merge de funcionalidade.

## Staging (na altura)

Staging já tinha o mesmo modelo de colunas (migration `20260821165305_firm_users_mfa_totp`). O repositório inclui migration idempotente `20261012000000_firm_users_mfa_totp.sql` para alinhar o histórico Git sem `DROP`/`recreate`.

## Dependência TOTP

Biblioteca única: `otplib@13.5.0` (API async; CommonJS; Node ≥20). Sem `speakeasy` nem biblioteca concorrente.
