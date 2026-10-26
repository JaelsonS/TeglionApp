# Teglion Control Center (AfDigital Ops)

**Estado:** fundação em `staging` (`feature/fase-ops-teglion-center`)  
**Operador:** AfDigital — Soluções Tecnológicas (não inventar entidade jurídica «Teglion»)  
**Ambiente de trabalho:** staging primeiro; desenho pronto para produção.

## Objectivo

Painel interno onde o operador AfDigital (blue + red team):

- vê **todos os gabinetes** e actividade recente;
- lê **audit logs** e tentativas de login (com IP quando existir);
- acompanha falhas / sinais de abuso;
- **não** usa um segundo stack de auth — reutiliza sessão firm + MFA + allowlist.

## Modelo de segurança (não negociável)

1. **Gate de ambiente:** `PLATFORM_OPS_ENABLED=true` (só com literal `true`).
2. **Allowlist de um único email:** `PLATFORM_OPS_EMAIL_ALLOWLIST` (exactamente 1). 0 ou >1 → 503.
3. **Sessão existente:** cookie HttpOnly da app firm (sem Bearer em prod).
4. **MFA TOTP obrigatória** na conta do operador:
   - após criar/definir a password → `MFA_ENROLLMENT_REQUIRED` no próximo login;
   - com MFA activo → `MFA_CHALLENGE_REQUIRED` em **cada** login;
   - não pode desactivar MFA enquanto o email estiver na allowlist.
5. **Clientes do portal** nunca acedem.
6. **Todas as leituras/ações** do Center geram `audit_logs` com `firm_id` null e `actor_role=PLATFORM_OPS`.
7. **Sem** service role no browser; **sem** SIEM pago nesta fase (Sentry + Postgres).
8. Bloqueio de IP global: só quando existir middleware na edge/Render — não basta tabela órfã.

## Rotas

| UI | API |
|----|-----|
| `/app/ops` | `GET /api/platform-ops/me` |
| `/app/ops/overview` | `GET /api/platform-ops/overview` |
| `/app/ops/firms` | `GET /api/platform-ops/firms` |
| `/app/ops/audit` | `GET /api/platform-ops/audit-logs` |
| `/app/ops/logins` | `GET /api/platform-ops/login-attempts` |

## Ondas

| Onda | Conteúdo |
|------|----------|
| **0 (esta)** | Authz + overview + listas audit/logins/firms + UI shell |
| **1** | Filtros, detalhe de firm, export CSV, highlight de anomalias |
| **2** | Registo com aprovação (`pending_review`) |
| **3** | Sinais Sentry (link-out) + rate-limit / IP denylist na edge |
| **4** | Red-team checklist documentada + drills em staging |

## Configuração staging (Render)

```bash
PLATFORM_OPS_ENABLED=true
PLATFORM_OPS_EMAIL_ALLOWLIST=afdigitalweb.st@gmail.com
```

Operador (primeiro acesso):

1. Conta firm com esse email (já existente ou convite).
2. Definir password («Esqueci a password» / reset se ainda não tiver).
3. Login → ecrã de enrollment MFA (obrigatório).
4. Logins seguintes → desafio MFA (TOTP) sempre.
5. Abrir `/app/ops`.

## Fora de âmbito (onda 0)

- Substituir Sentry
- Impersonation de gabinete sem step-up dedicado
- Dados fiscais detalhados de clientes no Center (só metadados / contagens / audit)
