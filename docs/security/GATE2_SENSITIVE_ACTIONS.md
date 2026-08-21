# Gate 2 — Sensitive actions / step-up MFA

**Data:** 21/08/2026  
**Branch:** `fix/gate-2-sensitive-actions`  
**Vault TTL 8h:** **não alterado** (Gate 3)

## Abstração central

`backend/src/modules/security/sensitive-action.service.js`

- `confirmSensitiveAction({ purpose, totpCode | currentPassword })` — conta/admin
- `assertVaultSensitiveUnlock({ purpose, … })` — cofre (MFA → TOTP; senão vault password)

## Matriz

| Ação | Purpose | MFA on | MFA off |
|------|---------|--------|---------|
| Alterar email | `profile_email_change` | TOTP | login password |
| Alterar password | `profile_password_change` | TOTP + current pwd | current pwd (+ revoke sessions) |
| Encerrar escritório | `firm_close` | TOTP + nome | login pwd + nome |
| Permissões equipa | `team_permissions_patch` | TOTP | login pwd |
| Desactivar membro | `team_member_deactivate` | TOTP | login pwd |
| Mudar role | `team_member_role_change` | TOTP | login pwd |
| Criar membro | `team_member_create` | TOTP | login pwd |
| Vault reveal/mutate/import | `vault_*` | TOTP (ou step-up JWT) | vault/login pwd |

## FE

`SensitiveActionConfirmFields` — copy autenticador, sem email/SMS.

## Fora deste Gate

- Redução TTL vault 8h → Gate 3
- Confirmação por e-mail do novo endereço (avaliado; não bloqueia step-up TOTP)
