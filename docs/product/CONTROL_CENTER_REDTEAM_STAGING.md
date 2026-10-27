# Control Center — checklist red-team (staging only)

**Ambiente:** `staging.teglion.com` + API staging.  
**Nunca** correr estes drills contra produção.

## Pré-requisitos

- [ ] Conta ops allowlist com MFA
- [ ] `PLATFORM_OPS_ENABLED=true`
- [ ] Migration `ip_geo_cache` aplicada
- [ ] Migration `ip_denylist` aplicada
- [ ] Gabinete de teste (não `afdigital-ops`) disponível para suspend/cancel/trial
- [ ] IP de teste **público** (não o vosso IP de gestão) disponível para denylist

## O que testar → o que deve acender

| # | Acção | Esperado no Center |
|---|--------|-------------------|
| 1 | Registar gabinete novo via `/auth/firm/register` | Aparece em Overview «recentes» + badge Novo na lista **sem** bloquear o registo |
| 2 | 5+ falhas de login seguidas numa conta | Lockout + alerta `LOCKOUTS` / `LOGIN_FAIL_SPIKE` → `/app/ops/logins` |
| 3 | Limpar lockout via UI | Audit `platform_ops.lockout.clear`; conta desbloqueada |
| 4 | Estender trial N dias | `trial_ends_at` actualizado; audit `platform_ops.firm.extend_trial` |
| 5 | Cancelar gabinete (nome exacto) | `CANCELLED`, users inactivos, sessões mortas; audit `platform_ops.firm.cancel` |
| 6 | Tentar suspender/cancelar `afdigital-ops` | 400 `PLATFORM_OPS_HOST_FIRM` |
| 7 | Login com IP público | Coluna IP preenchida; país quando lookup/cache ok |
| 8 | Abrir `/app/ops/sentry` | Links e/ou lista de issues; sem PII de clientes |
| 9 | Chamar APIs ops sem MFA / sem allowlist | 403 com código `PLATFORM_OPS_*` |
| 10 | Burst de registos (≥5/24h) em teste controlado | Alerta `FIRM_REGISTER_BURST` |
| 11 | Adicionar IP de teste em `/app/ops/denylist` | Audit `ip_denylist.add`; pedidos desse IP → `403 IP_DENIED` (health isento) |
| 12 | Remover IP da denylist | Audit `ip_denylist.revoke`; acesso restaura (~30s cache) |
| 13 | Tentar denylist `10.x` / `127.0.0.1` | 400 `IP_DENYLIST_PRIVATE` |

## Dados que **não** devem aparecer

- NIF / emails de clientes finais
- Conteúdo de documentos ou cálculos fiscais
- Password hashes / recovery codes
- Service role keys

## Pós-drill

- [ ] Reverter ou deixar cancelados só gabinetes de teste
- [ ] Confirmar audit_logs com `actor_role=PLATFORM_OPS`
- [ ] Anotar falsos positivos de alertas para afinar limiares na onda 3
