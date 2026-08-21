# Gate 2 / Vault step-up — estado actual

**Actualizado:** 21/08/2026 (main-release blockers)

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
| Criar membro / convite | `team_member_create` | TOTP | login pwd |
| Alterar email de membro | `team_member_email_change` | TOTP | login pwd (+ revoke sessions) |
| Vault reveal | `vault_reveal` | TOTP ou step-up JWT **deste purpose** | vault/login pwd |
| Vault mutate | `vault_mutate` | idem | idem |
| Vault import | `vault_import` | idem | idem |

## Vault step-up JWT

- TTL: **10 minutos** (`VAULT_STEPUP_EXPIRES_IN`)
- Claim obrigatório: `purpose` ∈ {`vault_reveal`,`vault_mutate`,`vault_import`}
- Reutilizar token de reveal em mutate/import → **rejeitado**
- FE: `sessionStorage` chaveado por purpose (`vaultStepUpSession.ts`)
- Plaintext revelado: só React state ~30s (não localStorage)

## FE

`SensitiveActionConfirmFields` — copy autenticador, sem email/SMS.
