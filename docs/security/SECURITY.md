# Segurança — visão geral

> **Actualizado:** 28/09/2026 · Snapshot: [`../production/CURRENT_STATE.md`](../production/CURRENT_STATE.md) · **5 escritórios** em produção.

Este documento é o ponto de entrada da pasta `security/`. Detalhe por tema:

- [`AUTHENTICATION.md`](./AUTHENTICATION.md) — login, sessão, JWT em cookie, MFA (resumo).
- [`MFA_FASE4.md`](./MFA_FASE4.md) — TOTP, recovery, trocar app autenticador.
- [`AUTHORIZATION.md`](./AUTHORIZATION.md) — papéis, permissões, SEC-H1 (escalação staff).
- [`TENANT_ISOLATION.md`](./TENANT_ISOLATION.md) — isolamento entre escritórios, testes, runbook `ENOTFOUND`.
- [`VAULT_SECURITY.md`](./VAULT_SECURITY.md) — cofre e acessos oficiais (step-up).
- [`DATA_PROTECTION.md`](./DATA_PROTECTION.md) — repouso, trânsito, segredos, lacunas GDPR.
- [`SECURITY_TESTING.md`](./SECURITY_TESTING.md) — CI, tenant script, auditoria estática.
- [`INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md) — resposta a incidentes de segurança.

Backup / DR → [`../database/BACKUPS.md`](../database/BACKUPS.md), [`../database/DISASTER_RECOVERY.md`](../database/DISASTER_RECOVERY.md).

Relatórios **históricos** (audit Ago/2026, gates MFA) → [`../historico/auditorias/`](../historico/auditorias/), [`../historico/security-gates/`](../historico/security-gates/).

---

## Rótulos de honestidade

`IMPLEMENTADO` · `PARCIAL` · `A VALIDAR` · `NÃO IMPLEMENTADO` — conforme [`../governance/DOCUMENTATION_POLICY.md`](../governance/DOCUMENTATION_POLICY.md).

---

## O que está sólido (IMPLEMENTADO)

| Controlo | Evidência |
|----------|-----------|
| CSRF double-submit | `csrf.middleware.js`, header `X-CSRF-Token` |
| CORS allowlist (prod https) | `app.js` |
| Helmet + CSP (API) | `app.js` |
| Senha Argon2id | `password-crypto.js` |
| JWT access/refresh em cookies `httpOnly` | `auth-cookies.js` |
| MFA TOTP + anti-replay (jti/código) | testes MFA, `MFA_FASE4.md` |
| Turnstile em rotas de login (prod) | `turnstile.service.js` |
| IDOR/BOLA nos módulos principais | `firm_id` nos repositórios + tenant script |
| View tracking cross-tenant | **Corrigido** Ago/2026 — `.eq('firm_id', firmId)` + testes |
| Stripe webhooks | assinatura + idempotência |
| Upload | magic bytes, path `firm/{firm_id}/…` |
| Rate limit | Redis quando saudável; fallback in-memory por instância |

---

## Riscos residuais (verdade Set/2026)

1. **Service role Supabase** — ignora RLS; um `firm_id` esquecido num repo = vazamento. Mitigação: disciplina + `tenant-isolation-test.js` + scanner estático (avisos).
2. **Ops / fornecedores** — Supabase ou GitHub Actions inactivos por billing derrubam prod ou CI (incidente 28/09/2026 documentado).
3. **Sanitização de logs** — PARCIAL (nem todos os logs passam pelo sanitizador).
4. **Sentry** — opcional no boot; recomendado em prod.
5. **GDPR export/erase** — NÃO IMPLEMENTADO (`DATA_PROTECTION.md`).
6. **Pentest Burp formal** — A VALIDAR (`SECURITY_TESTING.md`).
7. **Escala horizontal API** — schedulers in-process; duplicar instâncias sem locks pode duplicar emails.

---

## Achados históricos já fechados

- **SEC-H1** — staff não promove a owner (`team.service.js`, testes).
- **Sessão de membro desactivado** — refresh revogado.
- **View tracking metadata** — item ROADMAP 0.1 concluído.

Detalhe e datas → [`../ROADMAP.md`](../ROADMAP.md) Fase 0.

---

## O que não está neste documento

Termos legais PT (livro de reclamações, etc.), pentest completo, estado RLS de **todas** as tabelas — ver `database/RLS.md` e roadmap.
