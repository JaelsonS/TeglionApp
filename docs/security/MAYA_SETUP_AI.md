# Maya Setup — IA (OpenAI)

Produto **Teglion** (AfDigital — Soluções Tecnológicas). Fluxo opcional **Configuração rápida** para donos de escritório (`FIRM_OWNER`).

## O que é enviado à OpenAI

- Respostas do questionário (país, especialidades, tom, serviços desejados, campanha IRS sim/não, horário típico, cidade/região, **texto livre opcional `ownerBrief`** — sem PII de clientes).
- Metadados mínimos do escritório: **nome**, **slug**, **código de país**, flags booleanas de contacto (`firmContact.hasEmail` etc.) — **sem** e-mail, telefone ou morada literais.
- Lista de `catalogKey` permitidos (catálogo nacional de serviços).

## O que nunca é enviado

- Dados de clientes, NIFs, documentos, cofre, mensagens, solicitações ou conteúdo fiscal concreto de terceiros.
- Ficheiros de imagem (logo, hero, serviços) — ficam no storage Teglion/Supabase após validação MIME.

## Uploads (B)

- Imagens: tipos permitidos no `contabil-storage.service.js` (JPEG, PNG, WebP, GIF conforme slot).
- Referências no apply: `storageKey` validado por regex (`media-assets.js`); a IA **não** pode injectar URLs arbitrárias na proposta.
- Logótipo: `uploadPublicLogo` grava rascunho da página pública (mesmo fluxo manual).

## Onde corre

- `OPENAI_API_KEY` **apenas no backend** (ex.: Render). Não existe variável `VITE_*` para OpenAI.
- Resposta validada com schema `MayaSetupProposalV1` antes de gravar.

## Aplicação (apply)

- Grava **rascunho** da página pública (`saveDraft`) — **não** publica o site.
- Opcional: `prepareServicesForPublicPage` → serviços activos com slug público (formulário do catálogo).
- Opcional (G): clientes demonstração — e-mails `@example.invalid`, notas explícitas; requer env + allowlist.
- Defaults de agenda (`firm.settings.booking`).
- IRS (PT): activação de templates de catálogo, **sem** cálculo AT.
- Sincroniza rodapé/contacto a partir das Definições do escritório (C).

## Opt-in

- UI exige `consentOpenAi: true`.
- Links: `/privacidade#subcontratantes` e `/dpa#subprocessadores`.

## Retenção

- Sessões em `maya_setup_sessions` (answers + proposal JSON). Auditar via `audit_logs` (`maya.setup.*`) **sem** prompt completo nos metadados.

## Entitlements

- Feature `ai` (`entitlements.service.js`) ou allowlist `MAYA_SETUP_FREE_FIRM_IDS` (piloto).
- Maya **guia** estática: sem entitlement.

## Limites

- Gerações: `MAYA_SETUP_GENERATE_DAILY_LIMIT` (default 5/dia/firm).
- Rate limit HTTP na rota `generate`.

## Modo demonstração (G)

- `MAYA_DEMO_OFFICE_ENABLED=1`
- `MAYA_DEMO_OFFICE_FIRM_IDS` ou fallback `MAYA_SETUP_FREE_FIRM_IDS`
- Em `NODE_ENV=production`, desactivado salvo `TEGLION_ALLOW_DEMO_OFFICE_IN_PROD=1` (não recomendado).

## Smoke manual (staging)

1. Login **FIRM_OWNER**.
2. Configuração rápida: consentimento → questionário → **imagens** → gerar → preview (secções) → aplicar.
3. Verificar rascunho, serviços, agenda; opcional serviços públicos e clientes demo (staging).
4. Assistente de activação + import CSV no passo carteira.
5. Staff → 403 nas rotas `maya-setup`.
