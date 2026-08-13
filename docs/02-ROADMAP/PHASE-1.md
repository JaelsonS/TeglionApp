# Fase 1 — Progresso

**Branch:** `feature/fase-1` (derivada de `staging`)  
**Ambiente alvo:** staging only — sem produção.

## FASE 1A — Security Critical

**STATUS:** implementado (pendente commit/PR)

### Implementado

- **SEC-H1:** staff não pode atribuir / promover / desativar `FIRM_OWNER`
  - `team.service.js` — `assertActorCanAssignRole`
  - `team-invites.service.js` — usa a mesma regra
  - capabilities: `canManageMemberRoles`, `canAssignFirmOwner`
- **SEC-M1:** refresh rejeita utilizador firm `is_active=false` (e cliente REVOKED/inactivo); invalida sessão
- **SEC-M3:** `listComments` exige `firm_id` (service requests + tasks)

### Testes

- `team.service.test.js` — SEC-H1 (+ deactivate sessions)
- `contabil-auth.refresh.test.js` — SEC-M1
- `comments-firm-id.test.js` — SEC-M3

### Deferred nesta subfase

- Auditoria completa de logs/`VITE_*` (Fase 1A extended / 1J)
- Least privilege staff (SEC-M2)
- MFA / Admin / Maya / Blog / Design System (fases seguintes)

### Próximo passo

**FASE 1B** — Design System + UX Foundation
