# Cofre / acessos oficiais

**Actualizado:** 28 de outubro de 2026

O cofre guarda credenciais oficiais do cliente (portais, finanças) de forma encriptada.

## Garantias que eu exijo no código

| Requisito | Estado |
|-----------|--------|
| Credenciais encriptadas (AES-GCM) | Sim |
| Listagens sem plaintext | Sim |
| Reveal / mutate / import com confirmação sensível (step-up) | Sim |
| Purposes separados (reveal ≠ mutate ≠ import) | Sim |
| MFA ligado → confirmação TOTP | Sim |
| Audit sem password / TOTP / token | Sim |
| Isolamento por `firm_id` | Sim |

TTLs e detalhes de armazenamento de tokens de step-up **não** documento no repo público — vivem no código e no runbook interno.

RBAC geral: [`AUTHORIZATION.md`](./AUTHORIZATION.md).  
Postura: [`SECURITY.md`](./SECURITY.md).
