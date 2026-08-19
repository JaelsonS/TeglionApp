# Internacionalização — a arquitetura de configuração por país

> Fonte consolidada: `docs/08-BUSINESS/INTERNATIONALIZATION.md` (removido após esta migração). O conteúdo abaixo reflete a leitura direta do código feita em auditoria técnica de 18/08/2026, e corrige o que o documento anterior descrevia de forma otimista demais. Para narrativa estratégica de quando e por que expandir para outro mercado, ver [`docs/product/VISION.md`](../product/VISION.md). Para a lista concreta do que falta ligar, ver `docs/ROADMAP.md`, Fase 3 e Fase 4 — este documento não a repete.

## O desenho: país como configuração central, não texto espalhado

A decisão arquitetural de tratar país como configuração central — em vez de espalhar `if (country === 'PT')` pelo código inteiro — já foi tomada e já está em uso, dos dois lados do sistema:

- **Backend:** `backend/src/config/country-config.registry.js` é o registro central. Ele carrega um módulo de configuração por país (`backend/src/config/country-configs/pt.config.js` e `br.config.js`) e expõe funções para resolver, validar e listar país suportado (`resolveCountryConfig`, `isSupportedCountry`, `listSupportedCountries`).
- **Frontend:** `frontend/src/shared/config/country/countryConfig.ts` espelha a mesma estrutura, com os mesmos dois países.

Cada entrada do registro carrega: `code`, `name`, `locale`, `currency`, `timezone`, `taxId` (tipo, rótulo e número de dígitos esperado da identificação fiscal), e `features` — um mapa de qual funcionalidade está disponível para aquele país (`fiscalCalendar`, `postalLookup`, `clientPortal`). Portugal e Brasil já estão cadastrados:

| Campo | Portugal | Brasil |
|---|---|---|
| `locale` | `pt-PT` | `pt-BR` |
| `currency` | `EUR` | `BRL` |
| `timezone` | `Europe/Lisbon` | `America/Sao_Paulo` |
| `taxId` | NIF, 9 dígitos | CNPJ, 14 dígitos |
| `features.fiscalCalendar` | `true` | `false` |
| `features.postalLookup` | `true` | `false` |
| `features.clientPortal` | `true` | `true` |

## País é propriedade do tenant, não do usuário

A tabela `firms` tem uma coluna `country_code` (`TEXT DEFAULT 'PT'`, ver `supabase/tables.sql`). País é decidido uma única vez, no cadastro do escritório: `registerFirm` (`backend/src/modules/auth/contabil-auth.service.js`) recebe um `countryCode`, resolve contra o registro (`resolveCountryConfig` — um código não cadastrado é rejeitado com erro `UNSUPPORTED_COUNTRY`, não aceito silenciosamente) e grava o código resultante no escritório.

Isso significa que país é propriedade do **tenant** — nunca do usuário individual, nunca do cliente do escritório. Um escritório inteiro opera sob a mesma configuração de país; não existe (nem faz sentido existir, no modelo de negócio do Teglion) um usuário com país diferente do escritório ao qual pertence. Essa mesma coluna, e nenhuma outra, é o que separaria um escritório português de um escritório brasileiro para fins de configuração — o que é uma decisão inteiramente distinta de isolamento entre tenants, tratada em [MULTI_TENANCY.md](./MULTI_TENANCY.md): `country_code` nunca é, e nunca deve ser, usado como mecanismo de isolamento. Isolamento é sempre por `firm_id`.

Existe também um endpoint público que expõe o registro de país sem exigir sessão (`GET /api/public/countries`, `backend/src/modules/public/countries.controller.js`, que chama `listSupportedCountries()`) — usado para popular um seletor de país antes mesmo de haver um usuário autenticado, como no fluxo de cadastro.

## O padrão de degradação graciosa: o calendário fiscal

O exemplo mais maduro de como o registro deveria ser consultado em todo o sistema é o calendário fiscal (`backend/src/modules/fiscal/fiscal-calendar.service.js`). Antes de devolver conteúdo, o serviço resolve a configuração do país pedido e verifica `features.fiscalCalendar`. Para Portugal (`true`), devolve o calendário real. Para Brasil (`false` hoje), devolve explicitamente um estado "em preparação", com uma mensagem indicando que obrigação e tarefa personalizada (tipo `CUSTOM`) são o caminho alternativo enquanto o conteúdo fiscal brasileiro não existe — em vez de quebrar, devolver lista vazia sem explicação, ou fingir ter conteúdo que não tem.

Esse é o padrão que o resto do sistema deveria seguir ao lidar com uma funcionalidade que ainda não está pronta para um país: consultar `features` do registro e degradar de forma explícita, não silenciosa. Hoje, é implementado nesse ponto — não (ainda) em todos os pontos que precisariam dele.

## Duas coisas diferentes, fáceis de confundir: configuração de país e tradução de interface

O registro de país (`country-config.registry.js` / `countryConfig.ts`) resolve **configuração de negócio** — moeda, fuso, formato de identificação fiscal, disponibilidade de funcionalidade. Isso é um sistema diferente do **dicionário de tradução de texto de interface** (i18next no frontend, um dicionário próprio no backend para string de mensagem/erro). Os dois são preparados para múltiplos idiomas na estrutura, mas hoje o dicionário de texto só tem conteúdo real em `pt-PT` — a chave `pt-BR`, quando existe, é um alias que aponta para o mesmo conteúdo português europeu, não uma tradução real. Ter os dois sistemas prontos estruturalmente não significa que ambos estão totalmente povoados; são maturidades diferentes, e é importante não tratar "o registro de país existe" como equivalente a "o produto já fala português do Brasil".

## Por que isso não é "arquitetura pronta, só falta conteúdo" — correção do documento anterior

A versão anterior deste documento descrevia o estado como "arquitetura pronta, conteúdo pendente", como se o único trabalho restante fosse preencher texto e regra fiscal. A leitura direta do código mostra algo mais específico: a arquitetura de configuração por país **existe e está corretamente desenhada** — o registro, a coluna de tenant, o padrão de degradação graciosa do calendário fiscal são reais e funcionam como descrito acima. Mas a maior parte do sistema ainda não **consulta** esse registro — em vez disso, lê valor fixo diretamente no código (`'EUR'`, `'pt-PT'`, `'Europe/Lisbon'`, `'PT'`, entre outros pontos). Isso não é falha de desenho: é fiação incompleta — o registro existe, mas nem todo o sistema está conectado a ele ainda.

A distinção importa porque muda o tipo de trabalho necessário. Não é preciso reprojetar nada — não é preciso decidir de novo como país deveria ser modelado. É preciso, ponto a ponto, trocar leitura de valor fixo por consulta ao registro já existente. Esse levantamento específico — cada ponto do sistema que ainda não está ligado, com prioridade e critério de conclusão — está em `docs/ROADMAP.md`, Fase 3 ("Arquitetura multi-país"). O que viabiliza um escritório brasileiro real operando (o subconjunto mínimo necessário, sem depender de automação fiscal brasileira completa) está na Fase 4 ("Brasil MVP") do mesmo roadmap. Este documento não duplica essas listas — elas mudam de estado com o tempo, e o roadmap é a única fonte oficial de prioridade no repositório.

## Onde aprofundar

- `docs/ROADMAP.md`, Fase 3 e Fase 4 — o que falta ligar ao registro, item por item, com prioridade e critério de conclusão.
- [`docs/product/VISION.md`](../product/VISION.md) — a narrativa estratégica de quando e por que expandir.
- [MULTI_TENANCY.md](./MULTI_TENANCY.md) — por que `country_code` nunca é mecanismo de isolamento.
- [INTEGRATIONS.md](./INTEGRATIONS.md) — fuso horário na integração com Google Calendar.
