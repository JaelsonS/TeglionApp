# Isolamento entre escritórios (multi-tenant)

> **Actualizado:** 28/09/2026. Snapshot produção: [`docs/production/CURRENT_STATE.md`](../production/CURRENT_STATE.md) (**5 escritórios**). Fontes históricas: migração 19/08/2026; item 0.1 view-tracking **fechado** Ago/2026.

Este é o documento mais importante da minha pasta `security/`. A pergunta que ele responde: **um utilizador de um escritório consegue ver dados de outro escritório?**

Resposta curta (**Set/2026):** **não pelas rotas normais do produto**, desde que cada repositório filtre `firm_id` — o padrão que auditamos com script + CI. O vazamento conhecido de *view tracking* (metadata por UUID) **já foi corrigido**; risco residual = regressão humana (endpoint novo) ou **service_role** exposta.

## Como garanto o isolamento de verdade

### A fronteira real é o filtro `firm_id`, aplicado pela aplicação — não pelo banco

O backend acessa o Supabase com uma chave de acesso total (`service_role`). Essa chave **ignora Row Level Security (RLS) por definição** — é assim que o `service_role` funciona no Postgres/Supabase, não é uma configuração específica que escolhi no Teglion. Isso significa que, para o tráfego real do produto, políticas RLS que escrevi no schema do banco não estão no caminho da requisição.

A fronteira de isolamento real é a camada de aplicação: **toda consulta que toca dado de um escritório precisa, manualmente, filtrar por `firm_id`.** Exemplo real, de um dos 52 arquivos de repositório do backend (`backend/src/db/supabase/repositories/contabil/documents.repository.js`):

```js
.eq('firm_id', firmId)   // repetido em cada consulta que lê ou escreve documento
```

Verifiquei esse padrão de forma consistente na camada de repositórios — documentos, tarefas, mensagens, clientes, obrigações, consultas/agendamentos, pedidos de serviço, leads, alertas, conexões de Google Calendar, e pagamentos via Stripe Connect — sempre combinando o ID do recurso pedido com o `firm_id` do usuário autenticado, nunca aceitando um `firm_id` vindo de fora sem validar contra a sessão.

### RLS existe, mas é defesa em profundidade — não a fronteira primária

É importante não deixar essa frase soar mais forte do que é: RLS **não protege o tráfego real do produto**, porque o backend nunca passa por ela. Onde tenho RLS ativa hoje (`IMPLEMENTADO`, com matriz confirmada), ela protege contra um cenário diferente e mais estreito: acesso direto ao banco via PostgREST/Supabase client com uma chave que **não** seja `service_role` (por exemplo, se um JWT de usuário final algum dia for usado diretamente contra o Supabase, ou um erro de configuração meu expuser a chave `anon`).

**Matriz que confirmei — 4 tabelas críticas (auditoria 13/08/2026):**

| Tabela | RLS produção | RLS staging | Policy | Risco residual se `service_role` vazar |
|---|---|---|---|---|
| `stripe_webhook_events` | ON | ON | deny-all | baixo — sem `firm_id`; protegido por idempotência Stripe |
| `auth_login_attempts` | ON | ON | deny-all | baixo — usado só para lockout |
| `obligation_templates` | ON | ON | firm_staff | baixo — tenant via `firm_id` |
| `obligation_recurrence_rules` | ON | ON | firm_staff | baixo — tenant via `firm_id` |

Migration: `20260927020000_sprint0_rls_defense_in_depth.sql` (apliquei em staging e produção). Storage (`contabil-documents`) também tem `public: false` com 5 policies scoped a `firm/{firm_id}/…`, equivalentes em produção e staging.

**Isso não significa "RLS ON em todas as tabelas public".** Uma versão anterior deste documento (`docs/security/TEGLION_SECURITY_GATE.md`, item P0.03) afirmava isso de forma mais ampla do que a evidência sustenta — a matriz que confirmei por auditoria cobre essas 4 tabelas nomeadas mais o módulo de Stripe Connect e o Storage. Para o restante das ~40+ tabelas do schema, o estado de RLS é `A VALIDAR` — não confirmei nesta rodada de documentação nem que está ligado nem que está desligado. Isso não muda o risco prático (não dependo de RLS pra nenhuma tabela no tráfego real), mas é uma afirmação que não devo repetir sem essa qualificação.

## O teste que comprova isso — e por que ele importa mais do que parece

Tenho um script de aproximadamente 590 linhas (`backend/scripts/tenant-isolation-test.js`) que testa diretamente o risco mais caro do produto: vazamento de dado entre escritórios. Ele cria dois escritórios sintéticos em staging e tenta, sistematicamente, ler e escrever dado de um a partir do contexto do outro.

**Esse teste roda automaticamente, hoje, em todo PR/push — `IMPLEMENTADO`.** Isso corrige uma afirmação desatualizada que os documentos-fonte deste arquivo (`MULTI-TENANT-SECURITY.md`, de 12/08) ainda continham: "o único teste automatizado que pegaria essa regressão não roda sozinho em lugar nenhum hoje." Isso deixou de ser verdade em 13/08/2026, quando coloquei o gate em produção — nunca tinha atualizado os documentos antigos depois disso, o que esta reescrita corrige.

Evidência direta, que li em `.github/workflows/ci.yml` (linhas 57–72) durante esta revisão:

```yaml
- name: Tenant isolation test (staging)
  env:
    SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.STAGING_SUPABASE_SERVICE_ROLE_KEY }}
    ...
  run: |
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
      echo "::error::STAGING_SUPABASE_URL / STAGING_SUPABASE_SERVICE_ROLE_KEY em falta."
      exit 1
    fi
    ...
    npm run test:tenant-isolation -w backend
```

O comportamento é **fail-closed**: se os secrets de staging (`STAGING_SUPABASE_URL`, `STAGING_SUPABASE_SERVICE_ROLE_KEY`) não estiverem cadastrados no GitHub, o job falha com `exit 1` — meu pipeline não passa em silêncio, ele quebra o merge. O script roda contra o projeto Supabase de staging dedicado (`teglion-staging`), nunca contra produção — ele escreve dados sintéticos reais nesse ambiente.

Além do teste de isolamento contra staging, cada PR também roda um scanner estático (parte de `test:security-static`) que procura por consultas `.eq('id', …)` sem `.eq('firm_id', …)` acompanhando — hoje configurei ele pra não falhar o build (`TENANT_ISOLATION_FAIL_ON_WARNINGS=false`), só sinalizar. Uma classificação desses avisos (auditoria 13/08) resultou em 0 avisos depois que fiz allowlist de casos legítimos (tokens de convite, tabelas sem conceito de tenant) e endureci queries genuinamente frouxas.

## Rastreamento de visualizações (item 0.1) — **CORRIGIDO**

**Estado (Set/2026):** `CONCLUÍDO` desde Ago/2026. Em `backend/src/services/tracking/view-tracking.service.js`, as leituras de contadores usam `.eq('id', entityId).eq('firm_id', firmId)` e `assertEntityVisibleToActor` valida posse antes de gravar. Testes: `view-tracking.service.test.js`.

O achado original (leituras só por `id`) está descrito no [`ROADMAP.md`](../ROADMAP.md) item 0.1 como histórico fechado — não reabrir como risco activo.

## Executar o teste de isolamento localmente (Set/2026)

`npm run test:tenant-isolation -w backend` lê `SUPABASE_URL` do ambiente local (sou `.env` / `.env.local`).

| Sintoma | Causa | Acção |
|---------|--------|--------|
| `ENOTFOUND …supabase.co` | Projecto Supabase **pausado**, removido ou URL errada | Reactivar no painel Supabase ou corrigir URL; **nunca** usar produção |
| Passou estático, falhou na execução | Mesmo que acima | CI usa `STAGING_SUPABASE_*`; local deve apontar para staging **activo** (`teglion-staging`, ref. `xscriwhchdblmwmpglby`) |
| Aviso `service-inquiries.repository.js:172` | Heurística `.eq('id')` sem `firm_id` na mesma cadeia | Revisar call site; não falha unless `TENANT_ISOLATION_FAIL_ON_WARNINGS=true` |

## Ponto de atenção estrutural — não é vulnerabilidade hoje, mas é risco de desenho

Algumas funções internas de repositório (por exemplo, comentários/mensagens vinculados a uma tarefa ou a um pedido de serviço) filtram só pelo ID do registro pai, sem repetir o filtro de `firm_id` na própria função interna. Hoje isso não é explorável, porque todo lugar que chama essas funções já validou o registro pai antes de chegar nelas. Mas é o mesmo padrão que **já** causou o vazamento de view tracking (corrigido) — uma função que parece segura porque hoje só é chamada de um jeito seguro, até reutilização num endpoint novo sem `firm_id`.

## Por que a resposta não é um "sim" simples

Zero rede de segurança no banco de dados (na prática, para o tráfego real) significa que um único filtro de `firm_id` esquecido, num endpoint novo, é um vazamento silencioso até eu encontrar. O gate de CI (fail-closed contra staging) e o scanner estático reduzem bastante a chance disso passar despercebido — mas o scanner não bloqueia o build hoje, só avisa, e o teste de isolamento cobre os fluxos que escrevi o script pra cobrir, não necessariamente todo endpoint novo automaticamente. A resposta honesta (Set/2026): **isolamento é verificado no código e pelo script de isolamento**, mas o CI só corre com **GitHub Actions activo + Supabase staging activo**; localmente `ENOTFOUND` no host staging indica projecto pausado, não falha de lógica. Não é “garantido para sempre” — é **disciplina + testes + ops**.

## O que não verifiquei nesta revisão

Estado de RLS nas tabelas fora da matriz de 4 tabelas críticas — marquei `A VALIDAR` acima. Não li linha a linha nesta revisão a cobertura exata do script de isolamento (quais entidades/endpoints ele testa) — ver o próprio arquivo `backend/scripts/tenant-isolation-test.js` pro escopo real.
