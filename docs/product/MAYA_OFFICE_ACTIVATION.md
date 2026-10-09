# Maya — activação do escritório (A–G)

Produto **Teglion** · AfDigital — Soluções Tecnológicas.

## Objetivo

Permitir que escritórios (incl. os 5 pilotos) configurem **rápido e com segurança** perfil, página pública, serviços, agenda e carteira — sem publicar automaticamente nem enviar dados de clientes à IA.

## Camadas

| Camada | Custo IA | Função |
|--------|----------|--------|
| **Maya guia** | Incluída | Intents estáticos, «O que fazer aqui», Assistente de activação (regras) |
| **Configuração rápida (Setup)** | Add-on `ai` ou piloto | Questionário + OpenAI → proposta validada → apply em rascunho |
| **Import CSV clientes** | Não | Fluxo existente `ClientsSpreadsheetDialog` |

## Fases entregues

- **A–D** — Setup IA, Painel (próximo passo + checklist), Maya contextual.
- **Assistente de activação** — Perfil → Setup → publicar página → serviços públicos → primeiro cliente.
- **B** — Imagens: logo, hero, sobre, por serviço (upload MIME validado no backend).
- **C** — Contactos do rodapé a partir de `firm.settings.contact` no apply (não enviados à OpenAI).
- **D** — Preview rico (secções + cores) no wizard.
- **E** — Assistente com CTAs (Setup, CSV, ecrãs).
- **F** — Import CSV ligado ao passo «primeiro cliente».
- **G** — Modo demonstração: clientes fictícios `@example.invalid`, só com `MAYA_DEMO_OFFICE_ENABLED=1` e allowlist; **bloqueado em produção** por defeito.

## Países

- Questionário e catálogo: **PT** e **BR** (`supportedCountries` em `/api/contabil/maya-setup/capabilities`).
- IRS / templates `irs-*`: apenas PT.

## Segurança

Ver `docs/security/MAYA_SETUP_AI.md` (uploads, schema, rate limit, owner-only, audit).

## Variáveis

Ver `.env.example` — `MAYA_SETUP_*`, `MAYA_DEMO_OFFICE_*`.
