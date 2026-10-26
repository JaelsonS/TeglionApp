# Teglion Control Center (AfDigital Ops)

**Estado:** onda 1 em `staging` (`feature/fase-ops-center-wave1-mgmt`)  
**Operador:** AfDigital — Soluções Tecnológicas (não inventar entidade jurídica «Teglion»)  
**Ambiente de trabalho:** staging primeiro; desenho pronto para produção.

## Objectivo

Painel interno onde o operador AfDigital (blue + red team):

- vê **todos os gabinetes** e actividade recente;
- **gere** estado do gabinete (suspender / reactivar) e limpa lockouts;
- lê **audit logs** e tentativas de login (com IP quando existir);
- exporta CSV e acompanha anomalias;
- **não** usa um segundo stack de auth — reutiliza sessão firm + MFA + allowlist.

## Modelo de segurança (não negociável)

1. **Gate de ambiente:** `PLATFORM_OPS_ENABLED=true` (só com literal `true`).
2. **Allowlist de um único email:** `PLATFORM_OPS_EMAIL_ALLOWLIST` (exactamente 1). 0 ou >1 → 503.
3. **Sessão existente:** cookie HttpOnly da app firm (sem Bearer em prod). A conta ops é um `firm_user` anfitrião **só para auth** — não é um gabinete comercial.
4. **MFA TOTP obrigatória** na conta do operador:
   - após criar/definir a password → `MFA_ENROLLMENT_REQUIRED` no próximo login;
   - com MFA activo → `MFA_CHALLENGE_REQUIRED` em **cada** login;
   - não pode desactivar MFA enquanto o email estiver na allowlist.
5. **Isolamento de UI:** contas `platformOps` aterraram em `/app/ops` e **não** usam `/app/firm/*` (excepto Definições/MFA).
6. **Clientes do portal** nunca acedem.
7. **Todas as leituras/ações** do Center geram `audit_logs` com `firm_id` null e `actor_role=PLATFORM_OPS`.
8. **Sem** service role no browser; **sem** SIEM pago nesta fase (Sentry + Postgres).
9. Bloqueio de IP global: só quando existir middleware na edge/Render — não basta tabela órfã.
10. Gabinete anfitrião (`internal_ops` / slug `afdigital-ops`) **não** pode ser suspenso pelo Center.

## Rotas

| UI | API |
|----|-----|
| `/auth/ops/login` | login firm (mesmo endpoint) + UI dedicada Control Center |
| `/auth/ops/mfa` | desafio / enrollment MFA do operador |
| `/app/ops` | `GET /api/platform-ops/me` + overview |
| `/app/ops/firms` | `GET /api/platform-ops/firms` |
| `/app/ops/firms/:id` | `GET /api/platform-ops/firms/:id` |
| — | `POST .../firms/:id/suspend` · `POST .../reactivate` |
| `/app/ops/audit` | `GET /api/platform-ops/audit-logs` |
| `/app/ops/logins` | `GET /api/platform-ops/login-attempts` · `POST .../clear-lockout` |
| — | `GET /api/platform-ops/export/:kind` (`firms`\|`audit`\|`logins`) |

**Entrada:** `/app/ops` sem sessão → `/auth/ops/login` (não o login comercial dos gabinetes).  
Label de ambiente: derivado de `FRONTEND_URL` (staging vs production), não só de `NODE_ENV`.

## Ondas

| Onda | Conteúdo |
|------|----------|
| **0** | Authz + overview + listas audit/logins/firms + UI shell |
| **1 (esta)** | Filtros, detalhe de firm, suspend/reactivate, clear lockout, export CSV, anomalias |
| **2** | Registo com aprovação (`pending_review`) |
| **3** | Sinais Sentry (link-out) + rate-limit / IP denylist na edge |
| **4** | Red-team checklist documentada + drills em staging |

## Configuração staging (Render)

```bash
PLATFORM_OPS_ENABLED=true
PLATFORM_OPS_EMAIL_ALLOWLIST=afdigitalweb.st@gmail.com
```

Operador (primeiro acesso):

1. Conta firm anfitriã com esse email (já existente).
2. Definir password (se ainda não tiver).
3. Abrir https://staging.teglion.com/auth/ops/login
4. Enrollment MFA (obrigatório) em `/auth/ops/mfa`.
5. Logins seguintes → desafio MFA (TOTP) sempre → `/app/ops`.

## Fora de âmbito (onda 1)

- Substituir Sentry
- Impersonation de gabinete sem step-up dedicado
- Dados fiscais detalhados / documentos de clientes no Center (só metadados / contagens / audit)
- Aprovação de registo (`pending_review`) — onda 2
