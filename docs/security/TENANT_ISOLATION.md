# Isolamento entre escritórios (multi-tenant)

**Actualizado:** 28 de outubro de 2026

Este é o documento mais importante da pasta `security/`. A pergunta: **um utilizador de um escritório consegue ver dados de outro?**

**Resposta curta:** pelas rotas normais do produto, **não** — desde que cada repositório filtre `firm_id`. O risco residual é regressão humana (endpoint novo sem filtro) ou má gestão da chave administrativa do backend.

## Como eu garanto o isolamento

### A fronteira real é o filtro `firm_id` na aplicação

O backend acede ao Supabase com a chave administrativa do servidor (`service_role`). Essa chave, por desenho do Supabase, **ignora RLS**. Por isso a fronteira real é a app:

```js
.eq('firm_id', firmId)   // em cada consulta que lê ou escreve dado de tenant
```

Eu nunca aceito um `firm_id` vindo do cliente sem validar contra a sessão autenticada.

### RLS é defesa em profundidade — não a fronteira primária

RLS protege cenários em que alguém fale com o PostgREST sem passar pelo nosso backend (ex.: chave `anon`). No tráfego real do produto, o isolamento depende dos repositórios.

Tenho RLS confirmada em tabelas críticas de auth/pagamentos e no Storage de documentos (paths por `firm_id`). Para o resto do schema, continuo a tratar RLS como camada extra — **não** como prova única de isolamento.

## O teste que comprova

`backend/scripts/tenant-isolation-test.js` cria dois escritórios sintéticos em **staging** e tenta ler/escrever dados cross-tenant.

No CI (quando activo), o job falha se faltarem secrets de staging — **fail-closed**. O script **nunca** deve apontar a produção (grava dados reais de teste).

Há ainda um scanner estático (`test:security-static`) que avisa consultas suspeitas sem `firm_id` na mesma cadeia.

## Correr localmente

```bash
# Env aponta para Supabase de STAGING activo — nunca produção
npm run test:tenant-isolation -w backend
```

Se o DNS do projecto falhar (`ENOTFOUND`), o projecto está pausado ou o URL está errado — não é falha de lógica de isolamento.

## Disciplina contínua

Um único filtro esquecido num endpoint novo é um vazamento silencioso até o teste ou a revisão o apanharem. Por isso: CI + testes + revisão de PRs com olho em `.eq('firm_id', …)`.

Postura geral: [`SECURITY.md`](./SECURITY.md).
