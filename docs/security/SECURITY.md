# Segurança — visão geral

**Actualizado:** 28 de outubro de 2026 · Snapshot: [`../production/CURRENT_STATE.md`](../production/CURRENT_STATE.md)

Ponto de entrada da pasta `security/`:

| Doc | Tema |
|-----|------|
| [`AUTHENTICATION.md`](./AUTHENTICATION.md) | Login, sessão, JWT cookie, MFA |
| [`MFA_FASE4.md`](./MFA_FASE4.md) | TOTP, recovery |
| [`AUTHORIZATION.md`](./AUTHORIZATION.md) | Papéis e permissões |
| [`TENANT_ISOLATION.md`](./TENANT_ISOLATION.md) | Isolamento entre escritórios |
| [`VAULT_SECURITY.md`](./VAULT_SECURITY.md) | Cofre |
| [`DATA_PROTECTION.md`](./DATA_PROTECTION.md) | Dados em repouso/trânsito, lacunas GDPR |
| [`SECURITY_TESTING.md`](./SECURITY_TESTING.md) | O que o CI testa (sem playbooks de ataque) |
| [`INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md) | Resposta a incidentes |

Backup / DR → [`../database/BACKUPS.md`](../database/BACKUPS.md).

**Não** publico neste repo auditorias antigas com passos de exploração — ver [`../historico/README.md`](../historico/README.md).

---

## O que está sólido

| Controlo | Notas |
|----------|--------|
| CSRF double-submit | Cookies + header |
| CORS allowlist em produção | HTTPS |
| Helmet + CSP (API) | |
| Senha Argon2id | |
| JWT access/refresh em cookies `httpOnly` | |
| MFA TOTP | Owners; anti-replay no código |
| Turnstile em mutações públicas sensíveis | Fail-closed quando configurado |
| Isolamento `firm_id` | Repositórios + teste staging |
| Stripe webhooks | Assinatura + idempotência |
| Upload | Validação de conteúdo + path por tenant |
| Rate limit / lockout | Redis quando saudável; valores exactos **não** documentados aqui |
| Control Center | Gated + MFA; sem detalhes operacionais públicos |

---

## Riscos residuais (honestos, sem receita)

1. Chave administrativa do backend ignora RLS — um `firm_id` esquecido é o risco nº 1. Mitigo com testes e revisão.
2. Fornecedores (Supabase, GitHub Actions) fora do ar por billing derrubam prod ou CI.
3. Sanitização de logs — ainda parcial.
4. Export/erase GDPR completo — ainda não implementado.
5. Escala horizontal da API sem Redis partilhado — não faço.
6. Pentest externo formal — ainda não contratei; o relatório não entrará neste repo público.

---

## Contacto

Problemas de segurança: canal de suporte AfDigital / Teglion — **não** abras issue pública com prova de conceito explorável.
