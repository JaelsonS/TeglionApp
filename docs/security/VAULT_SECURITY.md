# Vault security — estado actual (Gate 3)

**Actualizado:** 21/08/2026  
**Estado actual:** [`../production/CURRENT_STATE.md`](../production/CURRENT_STATE.md) · Gate histórico: [`../historico/FINAL_MAIN_RELEASE_GATE_2026-08-21.md`](../historico/FINAL_MAIN_RELEASE_GATE_2026-08-21.md)

## Garantias no código (`5916b2b` / staging)

| Requisito | Estado |
|-----------|--------|
| Credenciais encriptadas (AES-GCM) | Sim |
| GET/list sem plaintext | Sim (`hasPassword`) |
| Reveal com step-up | Sim |
| Mutate/import com step-up | Sim |
| TTL step-up | **10 minutos** |
| Purpose-bound | `vault_reveal` ≠ `vault_mutate` ≠ `vault_import` |
| MFA on → TOTP (ou step-up do mesmo purpose) | Sim |
| sessionStorage só JWT step-up (por purpose) | Sim |
| Audit sem password/TOTP/token | Sim (redaction) |
| Cross-tenant | Bloqueado por `firmId` + checks |

Detalhe da matriz de acções (registo histórico): [`../historico/security-gates/GATE2_SENSITIVE_ACTIONS.md`](../historico/security-gates/GATE2_SENSITIVE_ACTIONS.md). Comportamento actual → [`AUTHORIZATION.md`](./AUTHORIZATION.md).
