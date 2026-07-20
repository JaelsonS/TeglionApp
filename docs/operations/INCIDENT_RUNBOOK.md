# TegLion - Incident Runbook

## Escopo

Runbook para incidentes de disponibilidade, autenticação e isolamento tenant.

## Severidades

1. P0: vazamento cross-tenant, auth bypass, indisponibilidade total
2. P1: degradação severa de login/upload/mensagens/faturamento
3. P2: falha parcial com workaround

## Resposta inicial

1. Confirmar sintoma com endpoint de health
2. Coletar request-id de erro reportado pelo cliente
3. Correlacionar logs por request-id
4. Classificar severidade
5. Acionar owner técnico e comunicação

## Drill automatizado

Executar:

```bash
cd backend && API_BASE=http://127.0.0.1:8001 npm run runbook:drill
```

Valida automaticamente:

1. `/health` e `/api/public/health`
2. Presença de `x-request-id`
3. Erro 401 com `requestId` no payload
4. Erro 404 com código `ROUTE_NOT_FOUND`

## Ações por tipo de incidente

### Auth indisponível

1. Verificar `/api/public/health`
2. Verificar secrets JWT e cookies
3. Validar CORS e CSRF
4. Se persistir, rollback para último release verde

### Falha no onboarding de equipa (convite/e-mail)

1. Validar estado do membro em `firm_users` (`invite_status`, `email_confirmed_at`, `is_active`).
2. Validar convite em `firm_member_invites` (`status`, `expires_at`) e expiração de token.
3. Validar token de confirmação em `email_confirmation_tokens` (`used_at`, `expires_at`).
4. Reemitir convite com endpoint de reenvio se token estiver revogado/expirado.
5. Confirmar que login retorna `EMAIL_NOT_CONFIRMED` quando aplicável e libera após confirmação.

### Suspeita de vazamento tenant

1. Bloquear novas releases
2. Executar tenant isolation estrito
3. Isolar endpoint suspeito
4. Corrigir e redeploy apenas com gate verde

### Falha de API em produção

1. Confirmar health e logs com request-id
2. Executar smoke de backend
3. Aplicar rollback se P0/P1 sem mitigação rápida

## Critério de encerramento

1. Causa raiz documentada
2. Evidência de correção com gate de release verde
3. Comunicação concluída para stakeholders

## Incidentes registados

### 2026-07-20 — Postal lookup PT (produção)

| Campo | Valor |
|-------|--------|
| Severidade | P2 (fallback UX: preencher morada manualmente) |
| Sintoma | Contadora em produção: falha ao autocompletar código postal |
| Endpoint | `GET /api/public/postal-lookup?country=PT&postalCode=…` |
| Sentry | `f0a37556` / request `27221227-c61c-456f-911e-05fcf68fa9b3` |
| Erro | `ConnectTimeoutError` + `ENETUNREACH` IPv6 ao contactar `json.geoapi.pt` (`194.60.201.198` / `2a02:c206:…`) |

**Causa raiz:** o backend dependia só de `https://json.geoapi.pt/cp/{CP}` sem timeout/fallback. A partir do host Render (AWS) a ligação ao geoapi (Contabo) falhou (IPv6 inacessível + timeout IPv4). O `fetch` rebentava em `TypeError: fetch failed` → 500 no Sentry.

**Correcção:**

1. Timeout curto (5s) + preferência IPv4 (`dns.setDefaultResultOrder('ipv4first')` + Agent undici `family: 4`)
2. Fallback para `https://postcode-pt.onrender.com/v1/postal-codes/{CP}` se o geoapi falhar
3. Falhas de rede mapeadas para `503 POSTAL_LOOKUP_UNAVAILABLE` (mensagem amigável; UI já pede preenchimento manual)
4. Melhor extracção de rua a partir de `pontos`/`partes` do geoapi

**Verificação após deploy:** `GET /api/public/postal-lookup?country=PT&postalCode=3090-492` deve devolver localidade (ex.: Casal Novo / Figueira da Foz).
