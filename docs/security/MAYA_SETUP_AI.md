# Maya Setup — IA (OpenAI)

Produto **Teglion** (AfDigital — Soluções Tecnológicas). Fluxo opcional **Configuração rápida** para donos de escritório (`FIRM_OWNER`).

## O que é enviado à OpenAI

- Respostas do questionário (país, especialidades, tom, serviços desejados, campanha IRS sim/não, horário típico, cidade/região, **texto livre opcional `ownerBrief`** — sem PII de clientes).
- Metadados mínimos do escritório: **nome**, **slug**, **código de país**.
- Lista de `catalogKey` permitidos (catálogo nacional de serviços).

## O que nunca é enviado

- Dados de clientes, NIFs, documentos, cofre, mensagens, solicitações ou conteúdo fiscal concreto de terceiros.

## Onde corre

- `OPENAI_API_KEY` **apenas no backend** (ex.: Render). Não existe variável `VITE_*` para OpenAI.
- Resposta validada com schema `MayaSetupProposalV1` antes de gravar.

## Aplicação (apply)

- Grava **rascunho** da página pública (`saveDraft`) — **não** publica.
- Cria/activa serviços do catálogo **sem** `isPubliclyListed`.
- Defaults de agenda (`firm.settings.booking`).
- IRS (PT): activação de templates de catálogo (campanha/recolha), **sem** cálculo AT.

## Opt-in

- UI exige `consentOpenAi: true`.
- Link para política de privacidade / subcontratantes: `LEGAL_DECISION_REQUIRED` até URL oficial confirmada.

## Retenção

- Sessões em `maya_setup_sessions` (answers + proposal JSON). Auditar via `audit_logs` (`maya.setup.*`) **sem** prompt completo nos metadados.

## Entitlements

- Feature `ai` (`entitlements.service.js`) ou allowlist `MAYA_SETUP_FREE_FIRM_IDS` (piloto).

## Limites

- Gerações: `MAYA_SETUP_GENERATE_DAILY_LIMIT` (default 5/dia/firm).

## Smoke manual (staging.teglion.com)

1. Login como **FIRM_OWNER** com MFA completo (se activo).
2. Painel → «Maya configura por mim» ou Maya → «Configuração rápida».
3. Consentimento + questionário PT com IRS → preview com 4 separadores → **Aplicar rascunho**.
4. Confirmar: rascunho em Definições → Página pública; ≥3 serviços **não** publicados; IRS activável; agenda com horário.
5. Staff (não-owner) → API/wizard 403.
6. Repetir apply na mesma sessão → idempotente, sem duplicar serviços.
