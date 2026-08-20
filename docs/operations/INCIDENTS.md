# Incidentes

> Fontes consolidadas: `docs/07-OPERACAO/INCIDENTS.md`, `docs/operations/INCIDENT_RUNBOOK.md` (pasta antiga, removida após esta consolidação).
>
> **Correção em relação aos documentos-fonte:** os dois documentos originais afirmavam que a recuperação de desastre (restore de backup) "nunca foi testada". Isso está desatualizado. Rodei dois drills reais de restauração em 13/08/2026 (ver abaixo) — marquei o item correspondente do Sprint 0 como concluído.

## Escopo

Esse é o runbook que sigo pra incidentes de disponibilidade, autenticação e isolamento entre escritórios (tenant).

## Severidades

1. **P0** — vazamento cross-tenant, auth bypass, indisponibilidade total.
2. **P1** — degradação severa de login, upload, mensagens ou faturamento.
3. **P2** — falha parcial com workaround disponível.

## Resposta inicial

1. Confirmo o sintoma com o endpoint de health.
2. Coleto o `request-id` do erro reportado pelo cliente.
3. Correlaciono logs por `request-id`.
4. Classifico a severidade.
5. Acionamento do responsável técnico e comunicação com o cliente, se aplicável.

## Drill automatizado de incidente

```bash
cd backend && API_BASE=http://127.0.0.1:8001 npm run runbook:drill
```

Isso valida automaticamente: `/health` e `/api/public/health`; presença de `x-request-id`; erro 401 retornando `requestId` no payload; erro 404 com código `ROUTE_NOT_FOUND`. Esse mesmo drill também roda dentro do gate de `release:readiness` (ver [`RELEASES.md`](./RELEASES.md)).

## Ações por tipo de incidente

### Auth indisponível

1. Verifico `/api/public/health`.
2. Verifico segredos JWT e configuração de cookies.
3. Valido CORS e CSRF.
4. Se persistir, rollback para o último release verde — ver [`../infrastructure/DEPLOYMENT.md`](../infrastructure/DEPLOYMENT.md#rollback).

### Falha no onboarding de equipe (convite/email)

1. Valido estado do membro em `firm_users` (`invite_status`, `email_confirmed_at`, `is_active`).
2. Valido o convite em `firm_member_invites` (`status`, `expires_at`) e a expiração do token.
3. Valido o token de confirmação em `email_confirmation_tokens` (`used_at`, `expires_at`).
4. Reemito convite pelo endpoint de reenvio se o token estiver revogado ou expirado.
5. Confirmo que o login retorna `EMAIL_NOT_CONFIRMED` quando aplicável, e libera normalmente depois da confirmação.

### Suspeita de vazamento entre escritórios (cross-tenant)

1. Bloqueio novas releases imediatamente.
2. Rodo o teste de isolamento tenant em modo estrito.
3. Isolo o endpoint suspeito.
4. Corrijo e faço redeploy só com o gate de CI verde.

Ainda não tenho um runbook específico e detalhado pra esse cenário além dos passos acima — hoje trato isso como incidente de segurança usando este documento genérico. O teste automatizado que existe pra prevenir isso (não pra responder depois de acontecido) já roda em todo PR/push no CI — ver [`../infrastructure/CI_CD.md`](../infrastructure/CI_CD.md).

### Falha de API em produção

1. Confirmo health e logs com `request-id`.
2. Rodo o smoke de backend (`npm run smoke:pilot`).
3. Aplico rollback se for P0/P1 sem mitigação rápida disponível.

### Perda de dado ou indisponibilidade do banco

O cenário de maior impacto possível pra mim. Diferente de incidentes de código, perda de dado sem um restore validado não tem segunda chance.

**Estado real:** o backup externo (Postgres → Cloudflare R2, `pg_dump` diário) já teve restauração testada com sucesso duas vezes, em 13/08/2026:

| Drill | Object key | RTO observado | Resultado |
|-------|-----------|----------------|-----------|
| 1 | `postgresql/daily/2026/08/2026-08-13-131519.dump` | ~2 min | PASS — smoke em Postgres 17 Docker isolado, SHA-256 validado |
| 2 (fecho formal do item 3 do Sprint 0) | `postgresql/daily/2026/08/2026-08-13-130155.dump` | ~1,3 min | PASS — dump operacional real, `firms=2`, `clients=39`, contagens completas validadas |

O detalhe do procedimento passo a passo e o registro completo de cada drill estão em `docs/database/` (migrado de `docs/operations/BACKUP_RESTORE.md`). A cadência que quero manter é repetir o drill pelo menos trimestralmente, ou depois de qualquer mudança material no schema ou no pipeline de backup.

**O que continua em aberto, sem suavizar:** o PITR (point-in-time recovery) nativo do Supabase Pro precisa de confirmação direta no painel do projeto de produção — não dá pra confirmar isso só pelo repositório. Também ainda não tenho um drill formal de **rollback de migração** (desfazer uma migração de schema ruim já aplicada) — é um cenário diferente do restore de backup, e continua pendente. Ver [`../infrastructure/DEPLOYMENT.md`](../infrastructure/DEPLOYMENT.md#rollback) pro processo manual que sigo hoje.

## Critério de encerramento

1. Causa raiz documentada.
2. Evidência de correção com o gate de release verde.
3. Comunicação concluída para os interessados.

## Incidentes registrados

### 2026-07-20 — Postal lookup PT (produção)

| Campo | Valor |
|-------|-------|
| Severidade | P2 (fallback de UX: preenchimento manual do endereço) |
| Sintoma | Contadora em produção: falha ao autocompletar código postal |
| Endpoint | `GET /api/public/postal-lookup?country=PT&postalCode=…` |
| Sentry | `f0a37556` / request `27221227-c61c-456f-911e-05fcf68fa9b3` |
| Erro | `ConnectTimeoutError` + `ENETUNREACH` IPv6 ao contactar `json.geoapi.pt` |

**Causa raiz:** o backend dependia só de `https://json.geoapi.pt/cp/{CP}`, sem timeout nem fallback. A partir do host Render (AWS), a conexão ao geoapi (Contabo) falhava — IPv6 inacessível e timeout em IPv4. O `fetch` estourava em `TypeError: fetch failed`, gerando 500 no Sentry.

**Correção que apliquei:**

1. Timeout curto (5s) e preferência por IPv4 (`dns.setDefaultResultOrder('ipv4first')` + Agent undici `family: 4`).
2. Fallback para `https://postcode-pt.onrender.com/v1/postal-codes/{CP}` se o geoapi falhar.
3. Falhas de rede mapeadas para `503 POSTAL_LOOKUP_UNAVAILABLE` (mensagem amigável — a UI já pede preenchimento manual).
4. Melhorei a extração de rua a partir de `pontos`/`partes` do retorno do geoapi.

**Verificação pós-deploy:** `GET /api/public/postal-lookup?country=PT&postalCode=3090-492` deve devolver a localidade correta (ex.: Casal Novo / Figueira da Foz).

## Antes de crescer a base de escritórios pagantes

Vale eu registrar isso sem rodeio: um sistema que depende do rastreamento de erro (Sentry) estar de fato configurado — e que, fora isso, só descubro o problema pela reclamação do cliente — funciona quando tenho um único escritório piloto acompanhado de perto por mim mesmo. Não escala do mesmo jeito com múltiplos escritórios pagantes que eu não estou olhando o tempo inteiro. Fechar a lacuna de monitoramento (ver [`../infrastructure/OBSERVABILITY.md`](../infrastructure/OBSERVABILITY.md)) é, por isso, também uma questão de prontidão operacional pra crescer — não só boa prática técnica.
