# Princípios de engenharia

Este documento é sobre como a engenharia do Teglion trabalha — convenções de código, decisões técnicas recorrentes, o que é valorizado tecnicamente. Não é sobre produto (isso está em `docs/product/PRODUCT_PRINCIPLES.md` ou onde esse documento estiver depois de movido). Cada item aqui tem evidência de código ou de configuração de CI; onde não houver evidência de um processo formal, este documento diz isso explicitamente em vez de descrever um processo que não existe.

## Isolamento de tenant nunca é opcional, e nunca vem de um valor que o cliente da API controla

Toda tabela de dado pertencente a um escritório carrega `firm_id`, e toda função de repositório que busca ou grava esse dado recebe `firm_id` como parâmetro explícito — derivado da sessão autenticada, nunca de um valor manipulável pelo lado do cliente. Isso é descrito com detalhe em [`docs/architecture/MULTI_TENANCY.md`](../architecture/MULTI_TENANCY.md), mas o que importa aqui é que virou uma disciplina de código, não uma política de banco: as políticas RLS existem no schema, mas hoje são irrelevantes para o tráfego real porque nada usa uma chave que respeitaria essas políticas — a proteção inteira vem da aplicação sempre incluir `firm_id` na consulta. Esse padrão foi verificado como consistente em toda a camada de repositórios numa auditoria de 12/08/2026, e é reforçado por um teste dedicado (`backend/scripts/tenant-isolation-test.js`, ver `docs/testing/TESTING.md`) que grava dados reais em staging e tenta ativamente furar esse isolamento.

Isso é um dos poucos pontos onde dá para dizer que existe um princípio de engenharia realmente enforced, não só declarado — porque o teste de isolamento é código executável, não uma frase num documento.

## Configuração em vez de condicional espalhado — valorizado, mas ainda não cumprido por completo

Existe um registro central de configuração por país, `backend/src/config/country-config.registry.js`, com Portugal e Brasil já cadastrados (`REGISTRY = { PT, BR }`), consumido por 4 arquivos do backend hoje. A intenção declarada — inclusive no roadmap oficial (`docs/ROADMAP.md`, Fase 3) — é que expandir para um novo país seja "fiação" (ligar uma configuração que já existe a um lugar que hoje lê um valor fixo), não reescrever lógica espalhada.

Na prática, essa disciplina ainda não é seguida em todo o código: há hoje 7 ocorrências de `if (country === ...)` (condicional direto em vez de ler do registro) em 2 arquivos do frontend (`frontend/src/shared/utils/firmLocale.ts` e `frontend/src/infrastructure/postalLookup.ts`). Ou seja: o padrão preferido existe, está registrado como direção técnica no roadmap, mas não é uma regra cumprida uniformemente hoje — é uma direção com exceções conhecidas, não uma garantia.

## Não deixar um arquivo virar monólito de novo

Há um guard de CI (`tools/ci/check-file-sizes.mjs`) que não é um limite genérico de tamanho de arquivo para todo o repositório — é um teto de linhas aplicado a três arquivos específicos que, em algum momento, foram extraídos de um estado monolítico: `frontend/src/infrastructure/api.ts` (máx. 100 linhas), `backend/src/routes/contabil.routes.js` e `backend/src/db/supabase/repositories/contabil.repository.js` (máx. 10 linhas cada). O objetivo explícito é impedir que alguém volte a empilhar código nesses arquivos específicos depois que eles já foram divididos em módulos menores. É uma convenção de engenharia real, ativamente enforced em CI, mas estreita — não é uma política geral de "nenhum arquivo pode crescer", é uma cicatriz de um problema específico já resolvido, com um teste para não repeti-lo.

## Separação em camadas: rotas → controllers → services → repositórios

A estrutura do backend (`backend/src/routes/`, `backend/src/modules/*/[nome].service.js`, `backend/src/db/supabase/repositories/`) segue essa separação de forma consistente pelos módulos observados (`firm`, `booking`, `entitlements`, `connect`, `tasks`, etc.). O isolamento de tenant descrito acima vive na camada de repositório. Isso é uma convenção observável no código, não um documento de arquitetura formal que a declare como regra — está descrita com mais detalhe em [`docs/architecture/BACKEND.md`](../architecture/BACKEND.md).

## Segurança como gate técnico, não como checklist de papel

Dois scripts rodam automaticamente em todo PR/push (`docs/testing/TESTING.md` tem o detalhe completo): uma auditoria estática (`security-static-audit.js`) e o teste de isolamento entre tenants. Nenhum dos dois é abrangente — a auditoria estática é uma lista fixa de ~12 verificações escritas contra problemas conhecidos, não uma ferramenta de SAST genérica — mas os dois são código que roda de verdade e pode derrubar o CI, não documentação descrevendo uma intenção de segurança. O princípio observável é: quando um risco de segurança é corrigido, a correção tende a virar uma verificação automatizada específica (ex.: `assertNotIncludes('firm-users.repository.js', 'passwordHash: row.password_hash', ...)`), não só um comentário de código ou uma nota em documento.

## O que não está formalizado — sem inventar que está

- **Não há processo formal de revisão de código por múltiplos revisores.** `CODEOWNERS` atribui todo o repositório, e em particular as áreas sensíveis (`middlewares/`, `config/`, `billing/`, `stripe/`, migrations do Supabase, `.github/`, `tools/ci/`), a um único dono (`@JaelsonS`). Não há evidência no repositório de um segundo revisor humano exigido por branch protection nem de um time de engenharia maior que uma pessoa — este documento não afirma o tamanho do time além do que `CODEOWNERS` deixa ver.
- **Não há `CONTRIBUTING.md` nem template de PR** (`.github/PULL_REQUEST_TEMPLATE.md` não existe). O padrão de mensagem de commit observado no histórico do git (`fix(firm): ...`, `feat(firm): ...`, `docs(...)`, `test(...)`) segue uma convenção parecida com Conventional Commits, mas não há um arquivo que documente essa convenção como regra — é um hábito observável, não uma regra escrita.
- **ESLint está instalado no frontend (`eslint`, `@eslint/js`, plugins de React/JSX-a11y/import) mas não está configurado.** Não existe `eslint.config.*`, não há script `lint` em nenhum `package.json`, e não há step de lint no CI. Isso é uma lacuna concreta entre intenção (as dependências estão lá) e prática (o gate não existe) — não comprovado atualmente como convenção ativa.
- **Não há evidência de um processo formal de design técnico antes de escrever código** (RFC, design doc revisado antes da implementação). O que existe é o inverso: decisões técnicas registradas diretamente como itens de roadmap (`docs/ROADMAP.md`, e historicamente em `docs/historico/PHASE-*.md`), escritas durante ou logo depois da implementação, não antes dela como aprovação prévia.

## Honestidade documental como princípio de engenharia, não só de produto

`docs/product/PRODUCT_PRINCIPLES.md` já registra isso do lado de produto ("documentar o que existe, não o que a gente gostaria que existisse"), com os estados IMPLEMENTADO / PARCIAL / EM DESENVOLVIMENTO / PLANEJADO / NÃO EXISTE. Do lado de engenharia, a mesma disciplina aparece nos scripts de teste — o teste de isolamento entre tenants reporta avisos separados de falhas críticas exatamente para não inflar artificialmente "tudo passou" quando há um ponto que merece revisão humana, mas ainda não é motivo de bloqueio. A política de manutenção da documentação (`docs/governance/DOCUMENTATION_POLICY.md`) existe para que esse mesmo princípio se aplique a este conjunto de documentos.
