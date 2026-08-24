# Gate 2.5 — Security / UAT Validation Report

**Data:** 21/08/2026  
**Autor:** agente (validação técnica + correção UX mínima)  
**Ambiente alvo:** staging (`staging.teglion.com` / `teglion-api-staging.onrender.com`)

---

## 1. STATUS

**PASS WITH CONDITIONS**

Gate 2 **não** fica APROVADO para fecho até o bloco UAT interativo (browser + MFA owner autenticado + smoke Gate 1 5–15 min) ser executado por operador com conta de staging e evidências coladas neste relatório.

Não foi iniciado Gate 3. TTL vault 8h **não** alterado. `main` / produção / Cloudflare / Vercel / DNS / migrations **não** alterados.

---

## 2. Ambiente testado

| Camada | Alvo | Evidência |
|--------|------|-----------|
| Staging API health | `https://teglion-api-staging.onrender.com/api/health` | HTTP **200**, `status: healthy` (2026-08-21) |
| Staging SPA | `https://staging.teglion.com/` | HTTP **200** |
| Código local (Gate 2 tip) | `origin/staging` @ `e0f85da` | `feat(security): Gate 2 central step-up for HIGH/CRITICAL actions` |
| Correção UX Gate 2.5 | branch `fix/gate-2-5-create-member-stepup` | create-member step-up FE + teste vault MFA (ainda **não** em staging até merge) |

---

## 3. Commit

| Ref | Notas |
|-----|--------|
| `e0f85da` | Gate 2 em staging (baseline validado em código) |
| Working tree `fix/gate-2-5-create-member-stepup` | Correção: UI «Criar colaborador» passa a enviar `totpCode` / `currentPassword`; teste `reveal` MFA-on rejeita password-only |

---

## 4. Utilizadores / tenants (sem PII desnecessária)

| Uso | Identificação |
|-----|----------------|
| Tenant staging conhecido (docs anteriores) | firm slug `afdigital` (owner MFA on) — **não** reutilizado em chamadas autenticadas nesta sessão |
| Contas UAT autenticadas | **Não usadas** nesta sessão (sem credenciais / TOTP no agente) |
| Cross-tenant Firm A/B | **PENDENTE** (operador) |

---

## 5. Testes executados

### A — Automatizados (executados)

| Suite | Resultado |
|-------|-----------|
| Backend `npm test` | **564 / 564 pass** (0 fail) |
| Frontend `vitest run` | **42 files / 181 tests pass** |
| Frontend `tsc --noEmit` | **pass** |
| Frontend `npm run build:spa` | **pass** (vite build ~5.2s) |
| Unit: `sensitive-action.service` | MFA on sem TOTP rejeita; MFA off exige password; cross-tenant actor rejeitado; vault MFA sem fator falha |
| Unit: `mfa.service` / refresh gates | challenge typ; recovery one-shot; owner MFA obrigatório |
| Unit: `official-accesses` | list sem plaintext; **novo** reveal MFA-on → `SENSITIVE_ACTION_MFA_REQUIRED` |
| Unit: CSV import | sem secrets não pede step-up; com secrets chama `assertVaultSensitiveUnlock` |
| Unit: nav-badges poll | `FIRM_NAV_BADGES_POLL_MS >= 180000` |

### B — Staging HTTP (executados, sem sessão)

| Teste | Resultado |
|-------|-----------|
| Health API / SPA | 200 |
| PATCH/POST sensíveis **sem cookie/CSRF** (`/firm/profile`, `/firm/close`, `/team`, vault reveal) | **403** `CSRF_INVALID` (barreira antes de auth) |

### C — UAT browser / MFA / bypass autenticado (NÃO executados nesta sessão)

Marcados **PENDENTE — OPERADOR** nas secções 6–12.

---

## 6. Resultado de cada teste (matriz Gate 2.5)

Legenda: ✅ pass evidência · ⚠ código OK / UAT pendente · ❌ falha · ⏸ não executado

### 1. MFA Owner

| # | Caso | Estado | Evidência |
|---|------|--------|-----------|
| 1 | Login exige MFA | ⚠ | Código: `mfa.service` + testes challenge; UAT browser pendente |
| 2 | TOTP válido continua | ⏸ | Operador |
| 3 | TOTP inválido rejeitado | ⚠ | Unit + `SENSITIVE_ACTION_DENIED` / MFA invalid |
| 4 | Expirado/inválido | ⏸ | Operador |
| 5 | Challenge JWT ≠ sessão | ✅ código | `auth.middleware` rejeita `typ === mfa-challenge` \| `vault-stepup` |
| 6 | Refresh não contorna MFA | ⚠ | `mfa.refresh-gates.test.js` |
| 7–8 | Recovery policy + one-shot | ⚠ | `consumeRecoveryCode` unit (reuse falha) |

### 2. Segurança → Definições

| Caso | Estado | Notas |
|------|--------|-------|
| Página abre (sem loop) | ⚠ | Hotfix `d09ebf6` + `FirmSettingsSecuritySection.load.test.ts`; UAT visual pendente |
| Owner MFA obrigatório / staff opcional | ⚠ | Política em `mfa.service` |
| Copy autenticador (não email/SMS) | ✅ código | `SensitiveActionConfirmFields` |
| Segredos no HTML/Network | ⏸ | Operador DevTools |

### 3. Alteração de email

| Caso | Estado |
|------|--------|
| Sem fator / TOTP inválido / válido | ⚠ código (`profile_email_change`); ⏸ UAT |
| Bypass alternativo | ✅ auditoria: único write self-email = `PATCH /api/contabil/firm/profile` → `updateMyProfile` → `confirmSensitiveAction` |
| Nota residual | `PATCH /team/:id` pode alterar **email de outro membro** **sem** step-up (fora da matriz Gate 2 self-profile) — ver §16 |

### 4. Alteração de password

| Caso | Estado |
|------|--------|
| current errada / TOTP errado / ausente / ambos OK | ⚠ código (`changeMyPassword` + revoke `deleteAllForActor`); ⏸ UAT |
| Bypass | ✅ único path `POST /api/contabil/firm/profile/password` |

### 5. Encerramento do escritório

| Caso | Estado |
|------|--------|
| Sem TOTP / TOTP inválido / nome incorrecto | ⚠ código (`firm_close`); ⏸ UAT (não executar close real) |
| Bypass | ✅ único `POST /api/contabil/firm/close` + `requireFirmOwner` |

### 6. Vault / senhas clientes

| Caso | Estado |
|------|--------|
| GET list sem plaintext | ✅ unit + serviço |
| Reveal/mutate/delete sem fator (MFA on) | ✅ unit MFA-on; ⏸ UAT API |
| Challenge purpose cruzado (conta vs vault) | ✅ `confirmSensitiveAction` **não** aceita vault-stepup JWT |
| Vault JWT entre reveal/mutate/import | ⚠ **mesmo** JWT vault-stepup serve os 3 purposes vault (by design Gate 2) — Gate 3 pode apertar |
| Cross-tenant step-up | ✅ `readValidStepUpToken` exige `firmId`+`userId` |
| Persistência FE | ⚠ plaintext reveal em React state ~30s; **stepUpToken** em `sessionStorage` até 8h (`vaultStepUpSession.ts`) — **Gate 3** (TTL) |
| TTL 8h | ⚠ documentado; **não alterado** |

### 7. Importação CSV com senhas

| Caso | Estado |
|------|--------|
| Sem secrets / com secrets + fator | ⚠ unit spreadsheet; ⏸ UAT |

### 8. Equipa

| Caso | Estado |
|------|--------|
| Create member BE | ✅ `team_member_create` |
| Create member FE TOTP | ✅ **corrigido** nesta branch (antes: UI sem fator → BE 403) |
| Role / permissions / deactivate | ⚠ código + FE fields; ⏸ UAT |
| Convite email (`POST /team/invites`) | ⚠ **sem** `confirmSensitiveAction` — residual (§16) |

### 9. API direct / bypass

| Caso | Estado |
|------|--------|
| Sem sessão | ✅ 403 CSRF (staging sample) |
| Sessão autenticada sem fator / purpose errado / challenge cruzado | ⏸ **PENDENTE operador** (cookies + CSRF + TOTP) |

### 10. Cross-tenant

| Caso | Estado |
|------|--------|
| Challenge / vault / IDs | ⚠ unit firmId checks; ⏸ UAT Firm A vs B |

### 11. Audit log

| Caso | Estado |
|------|--------|
| Redaction keys | ✅ `security-audit.service` REDACT: password, totpCode, recovery*, tokens, revealedValue, secret* |
| Eventos emitidos | ⚠ código paths; ⏸ amostragem DB staging |

### 12. Rate-limit / Gate 1

| Caso | Estado |
|------|--------|
| Poll badges ≥180s | ✅ unit |
| Skip-list só `nav-badges` | ✅ código |
| Smoke 5–15 min zero 429 | ⏸ **PENDENTE operador** (bloqueante para APROVAR Gate 2) |

---

## 7. Evidências (resumo)

1. Health staging 200 (API + SPA).  
2. Backend **564** tests pass (incl. novo vault MFA gate).  
3. Frontend **181** tests + `tsc` + `build:spa` pass.  
4. CSRF 403 em writes sensíveis sem sessão.  
5. Diff UX: `FirmSettingsTeamSection.tsx` — `SensitiveActionConfirmFields` no formulário «Criar colaborador».  
6. Middleware rejeita challenge/step-up como access token (grep/leitura `auth.middleware.js`).

---

## 8. Endpoints auditados (matriz completa)

| AÇÃO | Endpoint | Controller | Service | Middleware / guards | Purpose | Fator (MFA on / off) | Bypass encontrado? |
|------|----------|------------|---------|---------------------|---------|----------------------|--------------------|
| Email próprio | `PATCH /api/contabil/firm/profile` | `firm-settings.controller.patchProfile` | `updateMyProfile` | auth + `FIRM_READ` | `profile_email_change` | TOTP / login pwd | **Não** (só se email mudar) |
| Password própria | `POST /api/contabil/firm/profile/password` | `changePassword` | `changeMyPassword` | auth + `FIRM_READ` | `profile_password_change` (+ sempre current pwd) | TOTP+current / current | **Não** |
| Encerrar firm | `POST /api/contabil/firm/close` | `closeAccount` | `closeFirmAccount` | auth + `requireFirmOwner` | `firm_close` | TOTP+nome / pwd+nome | **Não** |
| Criar membro | `POST /api/contabil/team` | `team.controller.create` | `createMember` | `USERS_CREATE` | `team_member_create` | TOTP / login pwd | **Não** no BE; FE alinhado nesta branch |
| Convite membro | `POST /api/contabil/team/invites` | `teamInvitesController.create` | `team-invites.service` | `FIRM_INVITES_MANAGE` | — | **nenhum step-up** | Residual (não na matriz Gate 2) |
| Patch membro (email/nome) | `PATCH /api/contabil/team/:id` | `team.controller.patch` | `updateMember` | `USERS_UPDATE` | step-up **só** se `role` muda → `team_member_role_change` | TOTP / pwd se role | Email membro **sem** step-up |
| Role | (mesmo patch) | … | `updateMember` | … | `team_member_role_change` | TOTP / pwd | **Não** |
| Permissões | `PATCH /api/contabil/team/:id/permissions` | `team-permissions.controller` | `patchTeamPermissions` | `FIRM_MEMBER_PERMISSION_MANAGE` | `team_permissions_patch` | TOTP / pwd | **Não** |
| Desactivar | `POST /api/contabil/team/:id/deactivate` | `deactivate` | `deactivateMember` | `USERS_DELETE` | `team_member_deactivate` | TOTP / pwd | **Não** |
| Vault list | `GET …/official-accesses` | `list` | `listOfficialAccesses` | `FIRM_CLIENTS_MANAGE` | — | — | Sem plaintext |
| Vault upsert | `PUT …/official-accesses` | `upsert` | `upsertOfficialAccess` | + step-up limiter | `vault_mutate` | TOTP\|stepup / vault pwd | **Não** |
| Vault reveal | `POST …/reveal` | `reveal` | `revealOfficialAccess` | + limiter | `vault_reveal` | idem | **Não** |
| Vault remove | `POST …/remove` | `remove` | (mutate) | + limiter | `vault_mutate` | idem | **Não** |
| CSV import | `POST …/import` (spreadsheet) | `clients.controller` | `importCsv` | + limiter | `vault_import` se secrets | idem | **Não** |
| MFA disable | `POST /api/auth/mfa/disable` | `mfa.controller.disable` | `disableMfa` | auth + limiter | (próprio TOTP/recovery) | Owner **bloqueado** | N/A Gate 2 matrix |
| Recovery regen | `POST /api/auth/mfa/recovery/regenerate` | `regenerateRecovery` | `regenerateRecoveryCodes` | auth + limiter | TOTP | — | N/A |

Abstração central: `backend/src/modules/security/sensitive-action.service.js`.

---

## 9. Bypass tests

| Tentativa | Resultado |
|-----------|-----------|
| Write sensível sem cookie/CSRF (staging) | **403 CSRF_INVALID** |
| Challenge/step-up JWT como `Authorization` access | **Rejeitado em código** (`UNAUTHORIZED`) |
| Vault password-only com MFA on | **Rejeitado** (unit Gate 2.5) |
| Bypass autenticado (sessão válida, sem TOTP) | **PENDENTE** operador |
| Purpose / tenant / expired challenge autenticado | **PENDENTE** operador |

---

## 10. Cross-tenant tests

**PENDENTE** operador (Firm A vs Firm B).  
Código: `loadActor` / `readValidStepUpToken` / repositories scoped a `firmId`.

---

## 11. Audit log validation

| Check | Resultado |
|-------|-----------|
| Sanitização keys sensíveis | ✅ `REDACT_KEYS` inclui totp, recovery, passwords, tokens, revealedValue |
| Amostragem live staging | ⏸ operador |

---

## 12. Rate-limit smoke

| Check | Resultado |
|-------|-----------|
| Código Gate 1 (`nav-badges` 180s, skip-list) | ✅ |
| Smoke 5–15 min zero 429 (desktop/mobile/abas) | ⏸ **bloqueante** para Gate 2 APROVADO |

---

## 13. Testes automatizados (números reais)

```
Backend:  tests 564, pass 564, fail 0
Frontend: Test Files 42 passed, Tests 181 passed
Frontend: tsc --noEmit → pass
Frontend: build:spa → pass (vite built in 5.24s)
```

---

## 14. Falhas encontradas

1. **UX:** «Criar colaborador» não enviava fator → backend rejeitava (inconsistência FE/BE).  
2. **UAT live autenticado:** não executável nesta sessão sem credenciais MFA.  
3. **Residuais fora do escopo de “corrigir só UX create-member”:**  
   - `POST /team/invites` sem step-up  
   - `PATCH /team/:id` email de membro sem step-up  
   - Vault step-up JWT 8h em `sessionStorage` (Gate 3)

Nenhuma falha P0 de bypass de `confirmSensitiveAction` / `assertVaultSensitiveUnlock` encontrada nos paths da matriz Gate 2.

---

## 15. Correções feitas

| Correção | Ficheiros | Âmbito |
|----------|-----------|--------|
| Step-up no formulário create-member | `frontend/.../FirmSettingsTeamSection.tsx` | Só alinhamento FE↔BE |
| Teste vault MFA-on password-only | `backend/.../official-accesses.service.test.js` | Regressão Gate 2 |

**Não mergeado** para `staging` nesta sessão (aguarda commit/PR se autorizares).

---

## 16. Riscos restantes

| Risco | Severidade | Tratamento |
|-------|------------|------------|
| UAT browser MFA / vault / equipa / audit sampling não feito | Alto (processo) | Operador; sem isto Gate 2 ≠ APROVADO |
| Gate 1 smoke 429 não feito | Alto (processo) | Operador 5–15 min |
| Convite de membro sem TOTP | Médio | Backlog pós-Gate 2 / hardening |
| Email de outro membro sem TOTP | Médio | Backlog |
| Vault JWT 8h / purpose vault partilhado | Médio (produto) | **Gate 3 — VAULT** (aguardar autorização) |
| Create-member fix só em branch local | Médio | Merge → staging antes do UAT final |

---

## 17. Gate 2 final

| Pergunta | Resposta |
|----------|----------|
| Gate 2.5 STATUS | **PASS WITH CONDITIONS** |
| Gate 2 APROVADO para fecho? | **NÃO** — falta UAT autenticado + smoke Gate 1 + merge da UX create-member |
| Gate 3 iniciado? | **NÃO** |
| Próximo passo | 1) Commit/PR da branch `fix/gate-2-5-create-member-stepup` → `staging` 2) Operador preenche secções ⏸ 3) Só depois: «AUTORIZO GATE 3 — VAULT» |

**PARAR.** Aguardar autorização explícita do utilizador para Gate 3.
