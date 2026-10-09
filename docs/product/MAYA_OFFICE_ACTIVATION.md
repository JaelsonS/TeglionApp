# Maya — activação do escritório (A–G)

Produto **Teglion** · AfDigital — Soluções Tecnológicas.

## Objetivo

Permitir que escritórios (incl. os 5 pilotos) configurem **rápido e com segurança** perfil, página pública, serviços, agenda e carteira — sem publicar automaticamente nem enviar dados de clientes à IA.

## Camadas

| Camada | Custo IA | Função |
|--------|----------|--------|
| **Maya guia** | Incluída | Intents estáticos, FAB, chat no estúdio (pesquisa local) |
| **Estúdio página pública** | Setup: 1×/sessão; chat: respostas curtas | Ver `docs/product/MAYA_PUBLIC_SITE_STUDIO.md` |
| **Assistente de activação** | Incluída | Mapa do escritório (perfil → página → clientes) |
| **Import CSV clientes** | Não | Fluxo existente `ClientsSpreadsheetDialog` |

## Fases entregues

- **A–D** — Setup IA, Painel (próximo passo + checklist), Maya contextual.
- **Co-pilot página pública** — questionário **inline** em Definições → Página pública (`mayaSetup=1`); preview ao vivo enquanto responde (antes do apply); passo marca/legal/redes/cores; enquadrar hero/sobre nas secções; pré-visualização em **nova aba** (`?preview=token`); imagens em serviços personalizados (`custom:0`, …).
- **Serviços personalizados** — até 6 no questionário (além do catálogo PT/BR); criados no apply com intake mínimo.
- **Assistente de activação** — Perfil → Setup → publicar página → serviços públicos → primeiro cliente (CTA navega com `navigate`, não link dentro do modal).
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
